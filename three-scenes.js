// ========================================
// RUY.APP — Three.js scenes
//   1. Background world: starfield, hero core, floating wireframes (scroll parallax)
//   2. 3D App Library: a cylinder carousel built from the .app-card elements
// Progressive enhancement: if WebGL (or this module) is unavailable the page keeps
// the 2D particles and the regular card grid.
// ========================================
import * as THREE from 'three';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOTION = REDUCED ? 0 : 1;

const $ = (sel, root = document) => root.querySelector(sel);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mod = (a, n) => ((a % n) + n) % n;
const pad2 = (n) => String(n).padStart(2, '0');

const pointer = { x: 0, y: 0 }; // -1..1, y up
window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
}, { passive: true });

function hasWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) {
        return false;
    }
}

// ----------------------------------------
// Shared textures
// ----------------------------------------
function radialTexture(stops) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, a]) => grad.addColorStop(o, `rgba(255,255,255,${a})`));
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
const glowTex = radialTexture([[0, 1], [0.35, 0.35], [1, 0]]);
const dotTex = radialTexture([[0, 1], [0.3, 0.7], [1, 0]]);

// ========================================
// 1. Background world
// ========================================
function createBackground() {
    const canvas = $('#bg-canvas');
    if (!canvas) return null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 0, 14);

    const palette = [0x6366f1, 0x8b5cf6, 0xf093fb, 0x4facfe, 0xf59e0b];
    const SCROLL_K = 0.012; // world units per scrolled pixel

    // ---- starfield (follows the camera at 85% so it drifts slowly) ----
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);
    const starCount = window.innerWidth < 700 ? 900 : 1800;
    const sPos = new Float32Array(starCount * 3);
    const sCol = new Float32Array(starCount * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < starCount; i++) {
        sPos[i * 3] = (Math.random() - 0.5) * 80;
        sPos[i * 3 + 1] = (Math.random() - 0.5) * 70;
        sPos[i * 3 + 2] = -35 + Math.random() * 43;
        tmp.set(palette[(Math.random() * palette.length) | 0]).lerp(new THREE.Color(0xffffff), Math.random() * 0.55);
        sCol.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({
        size: 0.11, map: dotTex, vertexColors: true, transparent: true, opacity: 0.9,
        depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    starsGroup.add(stars);

    // ---- hero core ----
    const core = new THREE.Group();
    core.position.set(0, 0.4, -3);
    scene.add(core);
    const fadeMats = []; // [material, baseOpacity]
    const wire = (geo, color, opacity) => {
        const m = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
        fadeMats.push([m, opacity]);
        return new THREE.Mesh(geo, m);
    };
    const outer = wire(new THREE.IcosahedronGeometry(4.3, 1), 0x6366f1, 0.24);
    const inner = wire(new THREE.IcosahedronGeometry(2.7, 0), 0xf093fb, 0.32);
    const nucleus = wire(new THREE.OctahedronGeometry(1.1, 0), 0xf59e0b, 0.5);
    core.add(outer, inner, nucleus);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6366f1, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(15);
    fadeMats.push([halo.material, 0.4]);
    core.add(halo);

    const rings = [];
    [[5.6, 1.15, 0.25, 0x8b5cf6], [6.6, -0.6, 0.9, 0x4facfe]].forEach(([radius, rx, rz, color], i) => {
        const pivot = new THREE.Group();
        pivot.rotation.set(rx, 0, rz);
        const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
        fadeMats.push([ringMat, 0.5]);
        pivot.add(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 6, 160), ringMat));
        const spin = new THREE.Group();
        for (let s = 0; s < 3; s++) {
            const satMat = new THREE.MeshBasicMaterial({ color: palette[(i * 2 + s) % palette.length], wireframe: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
            fadeMats.push([satMat, 0.9]);
            const sat = new THREE.Mesh(s % 2 ? new THREE.OctahedronGeometry(0.28) : new THREE.BoxGeometry(0.34, 0.34, 0.34), satMat);
            const a = (s / 3) * Math.PI * 2;
            sat.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
            spin.add(sat);
        }
        pivot.add(spin);
        core.add(pivot);
        rings.push({ spin, dir: i % 2 ? -1 : 1, speed: 0.35 + i * 0.15 });
    });

    // ---- floating wireframes distributed down the page ----
    const geos = [
        new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0), new THREE.TorusGeometry(1, 0.32, 8, 24),
        new THREE.TetrahedronGeometry(1.15), new THREE.DodecahedronGeometry(1), new THREE.BoxGeometry(1.4, 1.4, 1.4),
        new THREE.TorusKnotGeometry(0.8, 0.24, 60, 8),
    ];
    const shapes = [];
    const SHAPE_COUNT = 14;
    for (let i = 0; i < SHAPE_COUNT; i++) {
        const mesh = new THREE.Mesh(geos[i % geos.length], new THREE.MeshBasicMaterial({
            color: palette[i % palette.length], wireframe: true, transparent: true, opacity: 0.26,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        const s = 0.9 + Math.random() * 1.5;
        mesh.scale.setScalar(s);
        scene.add(mesh);
        shapes.push({
            mesh, frac: (i + 0.6) / SHAPE_COUNT, side: i % 2 ? 1 : -1, fx: 0.5 + Math.random() * 0.38,
            z: -9 + Math.random() * 6, spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.5),
            phase: Math.random() * 6.28,
        });
    }

    let maxScroll = 1;
    function measure() {
        maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        shapes.forEach((s) => {
            const halfW = tanHalf * (camera.position.z - s.z) * camera.aspect;
            s.mesh.position.x = s.side * s.fx * halfW;
            s.mesh.position.z = s.z;
            s.baseY = -s.frac * maxScroll * SCROLL_K - 1;
        });
    }
    measure();
    window.addEventListener('resize', measure);
    new ResizeObserver(measure).observe(document.body);

    return {
        update(dt, t) {
            const sy = window.scrollY;
            const ease = Math.min(1, dt * 6);
            camera.position.y += (-sy * SCROLL_K - camera.position.y) * ease;
            camera.position.x += (pointer.x * 0.9 - camera.position.x) * Math.min(1, dt * 2);

            starsGroup.position.y = camera.position.y * 0.85;
            starsGroup.rotation.y = t * 0.012 * MOTION + pointer.x * 0.04;
            starsGroup.rotation.x = pointer.y * 0.02;

            // hero core fades out as the hero scrolls away
            const heroK = clamp(1 - sy / (window.innerHeight * 0.95), 0, 1);
            core.visible = heroK > 0.01;
            if (core.visible) {
                fadeMats.forEach(([m, base]) => { m.opacity = base * heroK; });
                outer.rotation.set(t * 0.1 * MOTION + pointer.y * 0.35, t * 0.16 * MOTION + pointer.x * 0.5, 0);
                inner.rotation.set(-t * 0.18 * MOTION, -t * 0.12 * MOTION, t * 0.07 * MOTION);
                nucleus.rotation.set(t * 0.4 * MOTION, t * 0.55 * MOTION, 0);
                const pulse = 1 + Math.sin(t * 1.6) * 0.04 * MOTION;
                halo.scale.setScalar(15 * pulse);
                rings.forEach((r) => { r.spin.rotation.z = t * r.speed * r.dir * MOTION; });
                core.position.y = 0.4 + sy * 0.004; // lags a little behind the page
            }

            shapes.forEach((s) => {
                s.mesh.position.y = s.baseY + Math.sin(t * 0.5 + s.phase) * 0.4 * MOTION;
                s.mesh.rotation.x += s.spin.x * dt * MOTION;
                s.mesh.rotation.y += s.spin.y * dt * MOTION;
                s.mesh.rotation.z += s.spin.z * dt * MOTION;
            });

            renderer.render(scene, camera);
        },
    };
}

// ========================================
// 2. 3D App Library
// ========================================
const TILE_W = 2.6;
const TILE_H = 3.64;
const TEX_W = 512;
const TEX_H = 717; // keeps TILE_W : TILE_H

function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function roundedRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
}

function wrapLines(g, text, maxW, maxLines) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (g.measureText(test).width > maxW && line) {
            lines.push(line);
            line = w;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
        lines.length = maxLines;
        let last = lines[maxLines - 1];
        while (g.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
        lines[maxLines - 1] = `${last}…`;
    }
    return lines;
}

function readCard(card, index) {
    const iconBox = $('.app-icon', card);
    const bg = iconBox.getAttribute('style') || '';
    const colors = bg.match(/#[0-9a-fA-F]{6}/g) || ['#667eea', '#764ba2'];
    const iEl = $('i', iconBox);
    let glyph = '';
    try {
        glyph = (getComputedStyle(iEl, '::before').content || '').replace(/^["']|["']$/g, '');
    } catch (e) { /* fall through to initial */ }
    const title = $('.app-title', card).textContent.trim();
    if (glyph.length !== 1) glyph = title.charAt(0).toUpperCase();
    const link = $('.app-link', card);
    return {
        card, index, title, glyph,
        c1: colors[0], c2: colors[1] || colors[0],
        badge: $('.app-badge', card).textContent.trim(),
        desc: $('.app-description', card).textContent.trim(),
        tags: [...card.querySelectorAll('.tag')].map((t) => t.textContent.trim()),
        href: link.href,
        linkLabel: link.textContent.trim(),
        linkHtml: link.innerHTML,
        infoHref: $('.app-info-btn', card)?.href || null,
    };
}

function drawCardTexture(info, total, maxAniso) {
    const c = document.createElement('canvas');
    c.width = TEX_W;
    c.height = TEX_H;
    const g = c.getContext('2d');
    const W = TEX_W, H = TEX_H, M = 10;

    // glass body
    roundedRect(g, M, M, W - 2 * M, H - 2 * M, 46);
    const body = g.createLinearGradient(0, 0, 0, H);
    body.addColorStop(0, '#1d1d40');
    body.addColorStop(1, '#0d0d21');
    g.fillStyle = body;
    g.fill();

    g.save();
    roundedRect(g, M, M, W - 2 * M, H - 2 * M, 46);
    g.clip();
    // colour aura
    let a = g.createRadialGradient(W * 0.2, 80, 0, W * 0.2, 80, 420);
    a.addColorStop(0, hexA(info.c1, 0.55));
    a.addColorStop(1, hexA(info.c1, 0));
    g.fillStyle = a;
    g.fillRect(0, 0, W, H);
    a = g.createRadialGradient(W, H, 0, W, H, 380);
    a.addColorStop(0, hexA(info.c2, 0.35));
    a.addColorStop(1, hexA(info.c2, 0));
    g.fillStyle = a;
    g.fillRect(0, 0, W, H);
    // faint scan lines
    g.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 1);
    // watermark index
    g.font = '900 210px Orbitron, monospace';
    g.textAlign = 'right';
    g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(255,255,255,0.045)';
    g.fillText(pad2(info.index + 1), W - 24, H - 96);
    g.restore();

    // border
    roundedRect(g, M, M, W - 2 * M, H - 2 * M, 46);
    const stroke = g.createLinearGradient(0, 0, W, H);
    stroke.addColorStop(0, info.c1);
    stroke.addColorStop(1, info.c2);
    g.lineWidth = 3;
    g.strokeStyle = stroke;
    g.globalAlpha = 0.85;
    g.stroke();
    g.globalAlpha = 1;

    // icon tile
    const ix = 46, iy = 56, is = 140;
    roundedRect(g, ix, iy, is, is, 36);
    const ig = g.createLinearGradient(ix, iy, ix + is, iy + is);
    ig.addColorStop(0, info.c1);
    ig.addColorStop(1, info.c2);
    g.shadowColor = hexA(info.c1, 0.6);
    g.shadowBlur = 30;
    g.fillStyle = ig;
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = info.glyph.length === 1 && info.glyph.charCodeAt(0) > 0xf000
        ? '900 66px "Font Awesome 6 Free"'
        : '900 70px Orbitron, sans-serif';
    g.fillText(info.glyph, ix + is / 2, iy + is / 2 + 3);

    // badge pill
    g.font = '700 22px "Space Grotesk", sans-serif';
    g.textBaseline = 'middle';
    const bw = g.measureText(info.badge).width + 36;
    const bx = W - 40 - bw, by = 62;
    roundedRect(g, bx, by, bw, 40, 20);
    const bg = g.createLinearGradient(bx, by, bx + bw, by);
    bg.addColorStop(0, '#f093fb');
    bg.addColorStop(1, '#f5576c');
    g.fillStyle = bg;
    g.fill();
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.fillText(info.badge, bx + bw / 2, by + 21);

    // title
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#ffffff';
    g.font = '700 38px Orbitron, monospace';
    const titleLines = wrapLines(g, info.title, W - 92, 2);
    let y = 270;
    titleLines.forEach((l) => { g.fillText(l, 46, y); y += 48; });

    // description
    g.fillStyle = '#a7b0c5';
    g.font = '400 25px "Space Grotesk", sans-serif';
    y += 10;
    wrapLines(g, info.desc, W - 92, 5).forEach((l) => { g.fillText(l, 46, y); y += 35; });

    // tags
    g.font = '600 20px "Space Grotesk", sans-serif';
    let tx = 46, ty = H - 168;
    info.tags.slice(0, 3).forEach((tag) => {
        const tw = g.measureText(tag).width + 28;
        if (tx + tw > W - 40) { tx = 46; ty += 44; }
        roundedRect(g, tx, ty, tw, 34, 17);
        g.fillStyle = 'rgba(99,102,241,0.22)';
        g.fill();
        g.lineWidth = 1.5;
        g.strokeStyle = '#6366f1';
        g.stroke();
        g.fillStyle = '#a5b4fc';
        g.textBaseline = 'middle';
        g.fillText(tag, tx + 14, ty + 18);
        tx += tw + 10;
    });

    // footer
    g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(46, H - 86, W - 92, 2);
    g.fillStyle = '#e5e7ff';
    g.font = '700 22px Orbitron, monospace';
    g.fillText(info.linkLabel.toUpperCase() + '  →', 46, H - 40);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    return tex;
}

function createReflectionAlpha() {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.55, '#202020');
    grad.addColorStop(1, '#fff'); // canvas bottom = tile bottom = nearest to the floor
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(c);
}

async function waitForFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const loads = [
        document.fonts.load('700 38px Orbitron'),
        document.fonts.load('900 66px "Font Awesome 6 Free"', ''),
        document.fonts.load('400 25px "Space Grotesk"'),
        document.fonts.load('600 20px "Space Grotesk"'),
    ];
    await Promise.race([Promise.allSettled(loads), new Promise((r) => setTimeout(r, 3500))]);
}

function createLibrary() {
    const stage = $('#lib-stage');
    const canvas = $('#lib-canvas');
    const viewport = $('.lib-viewport', stage || document);
    const detailEl = $('#lib-detail');
    const cards = [...document.querySelectorAll('.apps-grid .app-card')];
    if (!stage || !canvas || !cards.length) return null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f0f23, 0.045);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    const R = Math.max(6, (cards.length * (TILE_W + 0.7)) / (2 * Math.PI));
    const FLOOR = -2.6;
    const CAM_BASE = new THREE.Vector3(0, 1.35, R + 8.4);
    const CAM_LOOK = new THREE.Vector3(0, -0.15, R - 0.6);

    // lights only matter for tile edges / backs
    scene.add(new THREE.AmbientLight(0x8a8fff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 6, R + 8);
    scene.add(key);
    const core = new THREE.PointLight(0x8b5cf6, 28, 24, 2);
    core.position.set(0, 1, 0);
    scene.add(core);

    // ---- platform ----
    const platform = new THREE.Group();
    platform.position.y = FLOOR;
    scene.add(platform);
    const disc = new THREE.Mesh(
        new THREE.CircleGeometry(R + 3.4, 72),
        new THREE.MeshBasicMaterial({ map: glowTex, color: 0x6366f1, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    disc.rotation.x = -Math.PI / 2;
    platform.add(disc);
    const ringMat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    [[R + 0.78, R + 0.82, 0x8b5cf6, 0.85], [R - 0.9, R - 0.88, 0x4facfe, 0.5], [R + 2.2, R + 2.21, 0xf093fb, 0.35]].forEach(([a, b, color, o]) => {
        const ring = new THREE.Mesh(new THREE.RingGeometry(a, b, 180), ringMat(color, o));
        ring.rotation.x = -Math.PI / 2;
        platform.add(ring);
    });
    // tick marks that turn with the carousel
    const ticks = new THREE.Group();
    platform.add(ticks);
    const tickVerts = [];
    for (let i = 0; i < 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const r0 = R + 1.05, r1 = R + (i % 5 === 0 ? 1.6 : 1.3);
        tickVerts.push(Math.sin(a) * r0, 0.01, Math.cos(a) * r0, Math.sin(a) * r1, 0.01, Math.cos(a) * r1);
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickVerts, 3));
    ticks.add(new THREE.LineSegments(tickGeo, new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));

    // ---- dust ----
    const dustN = 420;
    const dp = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) {
        const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * (R + 4);
        dp[i * 3] = Math.sin(a) * r;
        dp[i * 3 + 1] = FLOOR + Math.random() * 8;
        dp[i * 3 + 2] = Math.cos(a) * r;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.07, map: dotTex, color: 0xa5b4fc, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(dust);

    // ---- tiles ----
    const tileGeo = new THREE.BoxGeometry(TILE_W, TILE_H, 0.1);
    const reflGeo = new THREE.PlaneGeometry(TILE_W, TILE_H);
    const glowGeo = new THREE.PlaneGeometry(TILE_W * 1.75, TILE_H * 1.5);
    const reflAlpha = createReflectionAlpha();
    const tiles = cards.map((card, i) => {
        const info = readCard(card, i);
        const map = drawCardTexture(info, cards.length, maxAniso);
        const sideMat = new THREE.MeshStandardMaterial({ color: 0x15153a, metalness: 0.75, roughness: 0.3, emissive: new THREE.Color(info.c1), emissiveIntensity: 0.12, transparent: true });
        const backMat = new THREE.MeshStandardMaterial({ color: 0x0b0b1f, metalness: 0.5, roughness: 0.6, emissive: new THREE.Color(info.c2), emissiveIntensity: 0.05, transparent: true });
        const frontMat = new THREE.MeshBasicMaterial({ map, transparent: true });
        const mesh = new THREE.Mesh(tileGeo, [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]);

        const glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(info.c1), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        glow.position.z = -0.15;

        const refl = new THREE.Mesh(reflGeo, new THREE.MeshBasicMaterial({ map, alphaMap: reflAlpha, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
        refl.scale.y = -1;

        const group = new THREE.Group();
        group.add(mesh, glow, refl);
        scene.add(group);

        const tile = { info, group, mesh, glow, refl, frontMat, sideMat, backMat, f: 0, fT: 1, h: 0, s: 0, vi: i, on: true };
        mesh.userData.tile = tile;
        return tile;
    });

    // ---- carousel state ----
    let order = tiles.slice(); // visible tiles, in order
    let n = order.length;
    let wrap = n >= 9;
    let step = (Math.PI * 2) / Math.max(n, 9);
    let pos = 0;      // continuous position, in tiles
    let target = 0;
    let selected = 0; // index into `order`
    let hovered = null;
    let dragging = false;
    let pressed = false;
    let vel = 0;
    let visible = false;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const local = { x: 0, y: 0 };

    function renderDetail() {
        const t = order[selected];
        counterIdx.textContent = pad2(n ? selected + 1 : 0);
        counterTotal.textContent = pad2(n);
        if (!t) {
            detailEl.innerHTML = '<p class="lib-empty"><i class="fas fa-search"></i> No apps match your search.</p>';
            return;
        }
        const i = t.info;
        detailEl.classList.remove('swap');
        void detailEl.offsetWidth; // restart the CSS animation
        detailEl.classList.add('swap');
        detailEl.innerHTML = `
            <div class="lib-detail-icon">${$('.app-icon', i.card).outerHTML}</div>
            <div class="lib-detail-body">
                <div class="lib-detail-top"><h3 class="lib-detail-title"></h3><span class="lib-detail-badge"></span></div>
                <p class="lib-detail-desc"></p>
                <div class="app-tags"></div>
            </div>
            <div class="lib-detail-actions"></div>`;
        $('.lib-detail-title', detailEl).textContent = i.title;
        $('.lib-detail-badge', detailEl).textContent = i.badge;
        $('.lib-detail-desc', detailEl).textContent = i.desc;
        $('.app-tags', detailEl).innerHTML = i.card.querySelector('.app-tags').innerHTML;
        const actions = $('.lib-detail-actions', detailEl);
        const open = document.createElement('a');
        open.className = 'app-link';
        open.href = i.href;
        open.target = '_blank';
        open.rel = 'noopener';
        open.innerHTML = i.linkHtml;
        actions.appendChild(open);
        if (i.infoHref) {
            const info = document.createElement('a');
            info.className = 'lib-info-link';
            info.href = i.infoHref;
            info.target = '_blank';
            info.rel = 'noopener';
            info.innerHTML = '<i class="fas fa-info-circle"></i> Docs';
            actions.appendChild(info);
        }
    }

    function currentIndex() {
        if (!n) return 0;
        const r = Math.round(pos);
        return wrap ? mod(r, n) : clamp(r, 0, n - 1);
    }

    function syncSelection() {
        const idx = currentIndex();
        if (idx !== selected || !detailEl.firstElementChild) {
            selected = idx;
            renderDetail();
        }
    }

    function goTo(i) {
        if (!n) return;
        if (wrap) {
            const base = Math.round(pos);
            const delta = mod(i - mod(base, n) + n / 2, n) - n / 2;
            target = base + delta;
        } else {
            target = clamp(i, 0, n - 1);
        }
    }
    function move(dir) {
        if (!n) return;
        const base = Math.round(target);
        target = wrap ? base + dir : clamp(base + dir, 0, n - 1);
    }
    function launch(tile) {
        window.open(tile.info.href, '_blank', 'noopener');
    }

    function applyFilter() {
        const prev = order[selected];
        order = tiles.filter((t) => !t.info.card.hasAttribute('data-hidden'));
        n = order.length;
        wrap = n >= 9;
        step = (Math.PI * 2) / Math.max(n, 9);
        const on = new Set(order);
        tiles.forEach((t) => {
            t.on = on.has(t);
            t.fT = t.on ? 1 : 0;
            if (t.on) t.f = 0; // fade the new layout in
        });
        order.forEach((t, i) => { t.vi = i; });
        const keep = prev ? order.indexOf(prev) : -1;
        selected = -1; // force detail refresh
        pos = target = Math.max(0, keep);
        vel = 0;
        syncSelection();
    }

    // ---- DOM chrome ----
    const counterIdx = $('#lib-index');
    const counterTotal = $('#lib-total');
    $('#lib-prev').addEventListener('click', () => move(-1));
    $('#lib-next').addEventListener('click', () => move(1));
    stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
        else if (e.key === 'Home') { goTo(0); e.preventDefault(); }
        else if (e.key === 'End') { goTo(n - 1); e.preventDefault(); }
        else if (e.key === 'Enter' && e.target === stage && order[selected]) { launch(order[selected]); }
    });
    document.addEventListener('ruy:filter', applyFilter);

    // language switch: scripts.js rewrites the card text, so redraw textures + detail panel from it
    document.addEventListener('ruy:lang', () => {
        tiles.forEach((tile) => {
            tile.info = readCard(tile.info.card, tile.info.index);
            const map = drawCardTexture(tile.info, tiles.length, maxAniso);
            tile.frontMat.map.dispose();
            tile.frontMat.map = map;
            tile.refl.material.map = map;
            tile.frontMat.needsUpdate = true;
            tile.refl.material.needsUpdate = true;
        });
        selected = -1;
        syncSelection();
    });

    // ---- pointer interaction ----
    let startX = 0, startY = 0, lastX = 0, lastT = 0, downTile = null;
    const pxPerTile = () => clamp(viewport.clientWidth * 0.27, 150, 420);

    function updateNdc(e) {
        const r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
        local.x = ndc.x;
        local.y = ndc.y;
    }
    function pick() {
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(order.map((t) => t.mesh), false);
        return hits.length ? hits[0].object.userData.tile : null;
    }

    canvas.addEventListener('pointerdown', (e) => {
        updateNdc(e);
        pressed = true;
        dragging = false;
        startX = lastX = e.clientX;
        startY = e.clientY;
        lastT = performance.now();
        vel = 0;
        downTile = pick();
        canvas.setPointerCapture(e.pointerId);
        stage.focus({ preventScroll: true });
    });
    canvas.addEventListener('pointermove', (e) => {
        updateNdc(e);
        if (!pressed) {
            hovered = e.pointerType === 'mouse' ? pick() : null;
            canvas.style.cursor = hovered ? 'pointer' : 'grab';
            return;
        }
        if (!dragging && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
            dragging = true;
            hovered = null;
            canvas.classList.add('dragging');
        }
        if (dragging) {
            const now = performance.now();
            const d = (e.clientX - lastX) / pxPerTile();
            const dtm = Math.max(1, now - lastT) / 1000;
            vel = vel * 0.6 + (-d / dtm) * 0.4;
            pos -= d;
            if (!wrap) pos = clamp(pos, -0.45, n - 0.55);
            target = pos;
            lastX = e.clientX;
            lastT = now;
        }
    });
    function release(e, cancelled) {
        if (!pressed) return;
        pressed = false;
        canvas.classList.remove('dragging');
        if (dragging) {
            dragging = false;
            const fling = clamp(vel * 0.3, -3, 3);
            const t = Math.round(pos + fling);
            target = wrap ? t : clamp(t, 0, n - 1);
        } else if (!cancelled) {
            updateNdc(e);
            const tile = pick();
            if (tile && tile === downTile) {
                if (tile.vi === currentIndex()) launch(tile);
                else goTo(tile.vi);
            }
        }
    }
    canvas.addEventListener('pointerup', (e) => release(e, false));
    canvas.addEventListener('pointercancel', (e) => release(e, true));
    canvas.addEventListener('pointerleave', () => { if (!pressed) hovered = null; });

    // ---- sizing / visibility ----
    function resize() {
        const w = viewport.clientWidth, h = viewport.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(viewport);
    resize();
    // callbacks can batch several records; the newest one is the current state
    new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; }, { rootMargin: '120px' }).observe(stage);

    // initial state
    applyFilter();
    tiles.forEach((t) => { t.f = 0; });

    const tmpV = new THREE.Vector3();
    return {
        get visible() { return visible; },
        update(dt, t) {
            const ease = (k) => 1 - Math.exp(-dt * k);

            if (!pressed) {
                pos += (target - pos) * ease(7);
                if (Math.abs(target - pos) < 0.0005) pos = target;
            }
            syncSelection();

            tiles.forEach((tile) => {
                tile.f += (tile.fT - tile.f) * ease(7);
                const live = tile.f > 0.01;
                tile.group.visible = live;
                if (!live) return;
                if (tile.fT === 1 && tile.f > 0.995) tile.f = 1;

                tile.h += ((hovered === tile && !dragging ? 1 : 0) - tile.h) * ease(10);
                tile.s += ((tile.on && tile.vi === selected ? 1 : 0) - tile.s) * ease(8);

                const sc = (0.55 + 0.45 * tile.f) * (1 + tile.s * 0.05 + tile.h * 0.04);
                tile.group.scale.setScalar(sc);

                if (tile.on) {
                    let d = tile.vi - pos;
                    if (wrap) d = mod(d + n / 2, n) - n / 2;
                    const th = d * step;
                    const bob = Math.sin(t * 0.9 + tile.info.index * 1.3) * 0.09 * MOTION;
                    tile.group.position.set(Math.sin(th) * R, bob, Math.cos(th) * R);
                    tile.group.rotation.y = th;
                    // mirror about the floor plane (local y is scaled by the group, so divide it back out)
                    tile.refl.position.y = (2 * (FLOOR - bob)) / sc;
                }

                // selected tile steps forward and leans toward the pointer
                tile.mesh.position.z = tile.h * 0.3 + tile.s * 0.3;
                tile.mesh.rotation.y = local.x * 0.14 * tile.s;
                tile.mesh.rotation.x = -local.y * 0.07 * tile.s;

                const bright = 0.72 + 0.28 * Math.max(tile.s, tile.h);
                tile.frontMat.color.setScalar(bright);
                tile.frontMat.opacity = tile.f;
                tile.sideMat.opacity = tile.f;
                tile.backMat.opacity = tile.f;
                tile.refl.material.opacity = 0.2 * tile.f;
                tile.glow.material.opacity = (0.22 * tile.h + 0.6 * tile.s) * tile.f;
            });

            ticks.rotation.y = -pos * step;
            dust.rotation.y = t * 0.02 * MOTION;

            camera.position.set(CAM_BASE.x + local.x * 0.7, CAM_BASE.y + local.y * 0.35, CAM_BASE.z);
            camera.lookAt(tmpV.copy(CAM_LOOK));

            renderer.render(scene, camera);
        },
    };
}

// ========================================
// Boot
// ========================================
(async function boot() {
    if (!hasWebGL()) return;

    let bg = null;
    try {
        bg = createBackground();
        if (bg) document.body.classList.add('three-bg');
    } catch (err) {
        console.warn('[ruy] background scene disabled:', err);
    }

    let lib = null;
    try {
        await waitForFonts();
        lib = createLibrary();
        if (lib) document.body.classList.add('lib-ready');
    } catch (err) {
        console.warn('[ruy] 3D library disabled:', err);
    }

    // view toggle (3D <-> grid)
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach((btn) => btn.addEventListener('click', () => {
        viewBtns.forEach((b) => b.classList.toggle('active', b === btn));
        document.body.classList.toggle('view-grid', btn.dataset.view === 'grid');
    }));

    const clock = new THREE.Clock();
    function frame() {
        requestAnimationFrame(frame);
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        if (bg) bg.update(dt, t);
        if (lib && lib.visible) lib.update(dt, t);
    }
    frame();
})();
