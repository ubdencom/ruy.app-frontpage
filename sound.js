// ========================================
// RUY.APP — synthesized sound
// Everything is generated with the Web Audio API (no audio files): mechanical keyboard
// clicks, boot chirps, whooshes, a launch impact, UI ticks and a quiet reactive ambient bed.
//
// Browsers keep an AudioContext suspended until the first user gesture (click, key press,
// touch). The context is therefore created on that first gesture; sounds requested before it
// are simply skipped, and the ambient bed starts as soon as audio is allowed.
// Exposes window.RUYSound — every method is a safe no-op when audio is unavailable.
// ========================================
(function () {
    'use strict';

    var noop = function () {};
    var API = {};
    ['key', 'tick', 'lock', 'swell', 'dissolve', 'whoosh', 'charge', 'impact', 'pop', 'confirm',
        'hover', 'click', 'step', 'launch', 'warn', 'go', 'ambientStart'].forEach(function (n) { API[n] = noop; });
    API.level = function () { return 0; };
    API.isReady = function () { return false; };
    window.RUYSound = API;

    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    var ctx = null, dry = null, master = null, analyser = null, noiseBuf = null;
    var wantAmbient = false, amb = null, gestureDone = false;
    var lastHit = {};
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };

    function gate(name, ms) {
        var now = performance.now();
        if (lastHit[name] && now - lastHit[name] < ms) return false;
        lastHit[name] = now;
        return true;
    }

    function build() {
        if (ctx) return;
        try { ctx = new AC(); } catch (e) { ctx = null; return; }

        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 12;
        comp.ratio.value = 5;
        comp.attack.value = 0.004;
        comp.release.value = 0.25;

        master = ctx.createGain();
        master.gain.value = 0.6;
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        master.connect(comp);
        comp.connect(ctx.destination);
        comp.connect(analyser);

        dry = ctx.createGain();
        dry.connect(master);

        // small synthetic room for the "digital hall" feel
        var verb = ctx.createConvolver();
        var len = Math.floor(ctx.sampleRate * 1.4);
        var imp = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var c = 0; c < 2; c++) {
            var d = imp.getChannelData(c);
            for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
        }
        verb.buffer = imp;
        var send = ctx.createGain();
        send.gain.value = 0.22;
        dry.connect(send);
        send.connect(verb);
        verb.connect(master);

        var nl = ctx.sampleRate * 2;
        noiseBuf = ctx.createBuffer(1, nl, ctx.sampleRate);
        var nd = noiseBuf.getChannelData(0);
        for (var j = 0; j < nl; j++) nd[j] = Math.random() * 2 - 1;
    }

    function ready() { return !!ctx && ctx.state === 'running'; }

    // ---------- building blocks ----------
    function osc(type, f0, f1, t, dur, peak, o) {
        o = o || {};
        var a = o.attack || 0.004, rel = o.release || 0.05, sd = o.sweep || dur;
        var os = ctx.createOscillator();
        var g = ctx.createGain();
        os.type = type;
        os.frequency.setValueAtTime(f0, t);
        if (f1 && f1 !== f0) os.frequency.exponentialRampToValueAtTime(f1, t + sd);
        if (o.detune) os.detune.value = o.detune;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
        g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur + rel);
        os.connect(g);
        var out = g;
        if (o.lp) {
            var f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.setValueAtTime(o.lp, t);
            if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t + sd);
            g.connect(f);
            out = f;
        }
        out.connect(dry);
        os.start(t);
        os.stop(t + a + dur + rel + 0.05);
        return os;
    }

    function noise(t, dur, peak, type, f0, f1, Q, o) {
        o = o || {};
        var src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        src.loop = true;
        var f = ctx.createBiquadFilter();
        f.type = type;
        f.Q.value = Q || 1;
        f.frequency.setValueAtTime(f0, t);
        if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
        var g = ctx.createGain();
        var a = o.attack || 0.003;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f);
        f.connect(g);
        g.connect(dry);
        src.start(t, Math.random() * 1.5);
        src.stop(t + dur + 0.05);
    }

    var now = function () { return ctx.currentTime + 0.002; };

    // ---------- sounds ----------
    // mechanical keyboard key: a bright transient + body thump (+ sometimes the spring ping)
    API.key = function (vol) {
        if (!ready() || !gate('key', 22)) return;
        vol = vol == null ? 1 : vol;
        var t = now();
        noise(t, 0.032, 0.42 * vol, 'highpass', rand(2400, 3800), 0, 0.7);
        noise(t, 0.05, 0.22 * vol, 'bandpass', rand(900, 1500), 0, 1.4);
        osc('sine', rand(170, 230), 80, t, 0.05, 0.32 * vol);
        if (Math.random() < 0.45) osc('square', rand(3000, 3800), 0, t + 0.002, 0.012, 0.035 * vol);
    };

    // quiet data tick (terminal lines)
    API.tick = function () {
        if (!ready() || !gate('tick', 60)) return;
        var t = now();
        noise(t, 0.02, 0.07, 'highpass', rand(3200, 5200), 0, 0.8);
        osc('sine', rand(1500, 2300), 0, t, 0.025, 0.025);
    };

    // a letter locking into place (i = 0..5 climbs the scale)
    API.lock = function (i) {
        if (!ready()) return;
        var f = 880 * Math.pow(1.122, i || 0);
        var t = now();
        osc('sine', f, f, t, 0.2, 0.17, { release: 0.25 });
        osc('triangle', f * 2.01, f * 2.01, t, 0.12, 0.05, { release: 0.2 });
        noise(t, 0.03, 0.12, 'highpass', 4000, 0, 0.8);
    };

    // rising synth drone while the particles assemble
    API.swell = function (dur) {
        if (!ready()) return;
        dur = dur || 2.6;
        var t = now();
        [110, 110.8, 165].forEach(function (f, i) {
            osc('sawtooth', f, f * 1.5, t, 0.2, 0.05 - i * 0.012, { attack: dur * 0.85, sweep: dur, release: 0.4, lp: 180, lp1: 2600 });
        });
        noise(t, dur, 0.1, 'bandpass', 300, 3200, 1.1, { attack: dur * 0.85 });
    };

    // crackle + falling hiss: letters dissolving
    API.dissolve = function (dur) {
        if (!ready()) return;
        dur = dur || 1.6;
        var t = now();
        noise(t, dur, 0.22, 'bandpass', 7000, 900, 1.2, { attack: 0.05 });
        for (var i = 0; i < 22; i++) {
            noise(t + rand(0, dur), 0.012, rand(0.05, 0.14), 'highpass', rand(3000, 7000), 0, 0.8);
        }
    };

    API.whoosh = function (dur, dir) {
        if (!ready()) return;
        dur = dur || 1.2;
        var t = now();
        var inward = dir !== 'out';
        noise(t, dur, 0.3, 'bandpass', inward ? 350 : 4200, inward ? 4200 : 260, 0.9, { attack: dur * (inward ? 0.8 : 0.05) });
    };

    // charge-up just before ignition
    API.charge = function (dur) {
        if (!ready()) return;
        dur = dur || 0.5;
        var t = now();
        osc('sine', 180, 1400, t, 0.06, 0.11, { attack: dur * 0.9, sweep: dur, release: 0.05 });
        osc('triangle', 360, 2800, t, 0.06, 0.04, { attack: dur * 0.9, sweep: dur, release: 0.05 });
    };

    // ignition: sub drop, rumble, sparkles
    API.impact = function () {
        if (!ready()) return;
        var t = now();
        osc('sine', 130, 30, t, 0.9, 0.85, { release: 0.6 });
        osc('sine', 52, 38, t, 1.2, 0.5, { release: 0.8 });
        noise(t, 0.7, 0.55, 'lowpass', 1100, 70, 0.8, { attack: 0.004 });
        noise(t, 0.12, 0.3, 'highpass', 2000, 0, 0.8);
        for (var i = 0; i < 9; i++) {
            var f = rand(2200, 6500);
            osc('sine', f, f * 1.01, t + rand(0.03, 0.5), 0.07, rand(0.03, 0.07), { release: 0.18 });
        }
    };

    // an app window opening
    API.pop = function (i) {
        if (!ready()) return;
        var f = 380 + ((i || 0) % 11) * 48;
        var t = now();
        osc('sine', f, f * 2.2, t, 0.09, 0.19, { release: 0.1 });
        osc('sine', f * 3, f * 3, t + 0.05, 0.08, 0.04, { release: 0.2 });
        noise(t, 0.02, 0.1, 'highpass', 3500, 0, 0.8);
    };

    API.confirm = function () {
        if (!ready()) return;
        var t = now();
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
            osc('sine', f, f, t + i * 0.07, 0.16, 0.14, { release: 0.35 });
        });
    };

    API.go = function () {
        if (!ready() || !gate('go', 300)) return;
        var t = now();
        osc('sine', 660, 660, t, 0.08, 0.1, { release: 0.15 });
        osc('sine', 990, 990, t + 0.07, 0.1, 0.1, { release: 0.25 });
    };

    API.warn = function () {
        if (!ready() || !gate('warn', 300)) return;
        var t = now();
        osc('sawtooth', 330, 330, t, 0.07, 0.06, { lp: 1400, release: 0.08 });
        osc('sawtooth', 247, 247, t + 0.1, 0.09, 0.06, { lp: 1400, release: 0.1 });
    };

    API.hover = function () {
        if (!ready() || !gate('hover', 45)) return;
        var f = rand(1500, 1800);
        osc('sine', f, f * 1.25, now(), 0.03, 0.045, { release: 0.04 });
    };

    API.click = function () {
        if (!ready() || !gate('click', 40)) return;
        var t = now();
        noise(t, 0.025, 0.2, 'highpass', 2600, 0, 0.8);
        osc('sine', 920, 430, t, 0.06, 0.17);
    };

    // carousel detent (i = selected index)
    API.step = function (i) {
        if (!ready() || !gate('step', 35)) return;
        var t = now();
        noise(t, 0.018, 0.3, 'bandpass', 1900, 0, 4);
        osc('square', 520 + ((i || 0) % 12) * 32, 0, t, 0.02, 0.05, { lp: 2500 });
    };

    API.launch = function () {
        if (!ready()) return;
        var t = now();
        API.whoosh(0.6, 'in');
        osc('sine', 400, 1250, t, 0.25, 0.14, { release: 0.15 });
        osc('sine', 1250, 1250, t + 0.26, 0.18, 0.12, { release: 0.3 });
    };

    // ---------- ambient bed (quiet drone + air + occasional chirps, reacts to pointer and scroll) ----------
    function startAmbient() {
        if (amb || !ready()) return;
        var t = ctx.currentTime;
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 500;
        lp.Q.value = 0.7;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 4);
        g.connect(lp);
        lp.connect(dry);

        var oscs = [];
        [[55, 'sine', 0.55], [82.41, 'sine', 0.3], [110.4, 'triangle', 0.1]].forEach(function (d) {
            var o = ctx.createOscillator();
            var og = ctx.createGain();
            o.type = d[1];
            o.frequency.value = d[0];
            og.gain.value = d[2];
            o.connect(og);
            og.connect(g);
            o.start();
            oscs.push(o);
        });
        var air = ctx.createBufferSource();
        air.buffer = noiseBuf;
        air.loop = true;
        var af = ctx.createBiquadFilter();
        af.type = 'lowpass';
        af.frequency.value = 420;
        var ag = ctx.createGain();
        ag.gain.value = 0.12;
        air.connect(af);
        af.connect(ag);
        ag.connect(g);
        air.start();

        var lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        lfo.frequency.value = 0.05;
        lfoGain.gain.value = 140;
        lfo.connect(lfoGain);
        lfoGain.connect(lp.frequency);
        lfo.start();

        amb = { lp: lp, oscs: oscs };
        wantAmbient = false;
        applyMood();

        (function chirp() {
            if (ready() && !document.hidden) {
                var f = pick([523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66]);
                var tt = now();
                osc('sine', f, f * 1.01, tt, 0.1, 0.02, { release: 0.3 });
                if (Math.random() < 0.4) osc('sine', f * 1.5, f * 1.5, tt + 0.11, 0.08, 0.012, { release: 0.3 });
            }
            setTimeout(chirp, rand(1800, 5200));
        })();
    }

    var mood = { x: 0.5, s: 0 };
    function applyMood() {
        if (!amb || !ready()) return;
        var t = ctx.currentTime;
        amb.lp.frequency.setTargetAtTime(320 + mood.x * 900 + mood.s * 700, t, 0.5);
        amb.oscs.forEach(function (o, i) { o.detune.setTargetAtTime((mood.x - 0.5) * 30 * (i + 1) + mood.s * 60, t, 0.6); });
    }
    window.addEventListener('pointermove', function (e) {
        if (!gate('mood', 80)) return;
        mood.x = e.clientX / Math.max(1, window.innerWidth);
        applyMood();
    }, { passive: true });
    window.addEventListener('scroll', function () {
        if (!gate('mood-s', 120)) return;
        var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        mood.s = Math.min(1, window.scrollY / max);
        applyMood();
    }, { passive: true });

    API.ambientStart = function () {
        wantAmbient = true;
        if (ready()) startAmbient();
    };

    API.level = function () {
        if (!analyser) return 0;
        var buf = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; sum += v * v; }
        return Math.sqrt(sum / buf.length);
    };
    API.isReady = ready;

    // ---------- first gesture unlocks audio ----------
    var UNLOCK = ['pointerup', 'mousedown', 'keydown', 'touchend', 'click'];
    function onRunning() {
        if (!ready() || gestureDone) return;
        gestureDone = true;
        UNLOCK.forEach(function (ev) { window.removeEventListener(ev, unlock, true); });
        if (wantAmbient) startAmbient();
    }
    function unlock() {
        build();
        if (!ctx) return;
        if (ctx.state === 'running') { onRunning(); return; }
        var p = ctx.resume();
        if (p && p.then) p.then(onRunning, noop);
    }
    UNLOCK.forEach(function (ev) { window.addEventListener(ev, unlock, true); });

    // no sound while the tab is in the background
    document.addEventListener('visibilitychange', function () {
        if (!ctx || !gestureDone) return;
        if (document.hidden) ctx.suspend();
        else ctx.resume();
    });

    // ---------- UI sounds, wired by delegation ----------
    var CLICKABLE = '.btn,.filter-tag,.nav-link,.app-link,.view-btn,.lib-nav,.social-icons a,.lang-switch,#lang-switch,.hero-skip,.close,.footer-links a,.lib-info-link,.app-info-btn';
    var HOVERABLE = CLICKABLE + ',.app-card,.feature-card,.platform-card,.contact-item,.popup-feature';
    var lastEl = null;
    document.addEventListener('pointerover', function (e) {
        if (e.pointerType === 'touch' || !e.target.closest) return;
        var el = e.target.closest(HOVERABLE);
        if (el && el !== lastEl) { lastEl = el; API.hover(); }
        else if (!el) lastEl = null;
    }, true);
    document.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest(CLICKABLE)) API.click();
    }, true);
    // typing in the search box / contact form sounds like a keyboard
    document.addEventListener('keydown', function (e) {
        var t = e.target;
        if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) return;
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') API.key();
    }, true);
})();
