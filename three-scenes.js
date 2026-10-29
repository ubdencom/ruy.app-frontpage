// ========================================
// RUY.APP — Three.js scenes
//   1. Background world: starfield + floating wireframes (scroll parallax)
//   3. Cinematic hero: "(Ru)n (Y)our (App)" -> RUY.APP launch sequence
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
        document.fonts.load('900 190px Orbitron', 'RUYAPPun'),
        document.fonts.load('500 22px "JetBrains Mono"'),
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
// 3. Cinematic hero — "(Ru)n (Y)our (App)" -> RUY.APP launch sequence
//    boot log -> particles assemble "Run Your App" -> the initials R·U·Y·A·P·P light up
//    -> the rest collapses into the dot -> RUY.APP -> ignition (shockwave + warp)
//    -> every app opens as a window and goes into orbit
// ========================================
const HERO_SRC = 'Run Your App';
const HERO_DST = 'RUY.APP';
const HERO_PAIRS = [[0, 0], [1, 1], [4, 2], [9, 4], [10, 5], [11, 6]]; // src glyph -> dst glyph
const HERO_DOT = 3;
const HERO_END = 9.6;

const heroSeg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const heroSmooth = (x) => x * x * (3 - 2 * x);
const heroBell = (t, a, b) => Math.sin(heroSeg(t, a, b) * Math.PI);
const heroRand = (a, b) => a + Math.random() * (b - a);

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Rasterise a string and return its pixels grouped per glyph (centred, y up).
function sampleText(str, px, step) {
    const font = `900 ${px}px Orbitron, "Arial Black", sans-serif`;
    const m = document.createElement('canvas').getContext('2d');
    m.font = font;
    const adv = [0];
    for (let i = 0; i < str.length; i++) adv.push(m.measureText(str.slice(0, i + 1)).width);
    const total = adv[str.length];
    const pad = Math.ceil(px * 0.3);
    const w = Math.ceil(total + pad * 2);
    const h = Math.ceil(px * 1.5);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.font = font;
    g.fillStyle = '#fff';
    g.textBaseline = 'middle';
    g.fillText(str, pad, h / 2);
    const data = g.getImageData(0, 0, w, h).data;

    const col = new Int16Array(w).fill(-1);
    for (let x = 0; x < w; x++) {
        const gx = x - pad;
        for (let i = 0; i < str.length; i++) {
            if (gx >= adv[i] && gx < adv[i + 1]) { col[x] = i; break; }
        }
    }
    const glyphs = [...str].map((ch) => ({ ch, pts: [] }));
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            if (data[(y * w + x) * 4 + 3] > 128 && col[x] >= 0) {
                glyphs[col[x]].pts.push([x + (Math.random() - 0.5) * step - pad - total / 2, h / 2 - y + (Math.random() - 0.5) * step]);
            }
        }
    }
    return { glyphs, width: total, height: h };
}

const HERO_VERT = /* glsl */ `
    attribute vec3 aScatter;
    attribute vec3 aA;
    attribute vec3 aB;
    attribute vec4 aRnd;   // x: delay, y: size, z: phase, w: group (0 initial, 1 dot, 2 dust)
    attribute vec3 aColor;
    attribute float aHi;
    uniform float uForm, uMerge, uTime, uPx, uScale, uHi, uPulse, uBreath, uSz;
    varying vec3 vColor;
    varying float vAlpha;

    float ease(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

    void main() {
        float f = ease(clamp((uForm - aRnd.x * 0.5) / 0.5, 0.0, 1.0));
        float m = ease(clamp((uMerge - aRnd.x * 0.45) / 0.55, 0.0, 1.0));
        vec3 pA = mix(aScatter, aA, f);
        float sw = sin(f * 3.14159);
        pA += vec3(sin(aRnd.z * 6.28 + uTime * 1.5), cos(aRnd.z * 6.28 + uTime * 1.2), sin(aRnd.z * 3.0 + uTime)) * sw * 1.6;
        vec3 pos = mix(pA, aB, m);
        float sm = sin(m * 3.14159);
        pos += vec3(cos(aRnd.z * 9.0 + uTime * 1.4), sin(aRnd.z * 7.0 + uTime * 1.1), sin(aRnd.z * 5.0)) * sm * 0.8;
        pos += vec3(sin(uTime * 1.3 + aRnd.z * 40.0), cos(uTime * 1.1 + aRnd.z * 31.0), sin(uTime + aRnd.z * 17.0)) * 0.014 * uBreath;
        // ignition shockwave pushes everything outwards for a beat
        vec2 radial = pos.xy;
        float rl = length(radial) + 0.001;
        pos.xy += radial / rl * uPulse * (0.35 + aRnd.y * 0.5);
        pos.z += uPulse * (aRnd.z - 0.5) * 2.0;

        // initial letters that are not part of RUY.APP dim while the initials glow
        float notHi = 1.0 - aHi;
        float glow = 1.0 + aHi * uHi * 0.55;
        float dim = 1.0 - notHi * uHi * 0.75;
        vColor = aColor * glow * dim;

        float dust = step(1.5, aRnd.w);
        float fade = mix(1.0, 0.0, dust * smoothstep(0.55, 1.0, m));      // dust drifts off
        float dotLife = step(0.5, aRnd.w) * (1.0 - dust);                  // the dot burns hotter
        vColor *= 1.0 + dotLife * m * 0.8;
        vColor *= 1.0 + m * 0.45 * (1.0 - dust);
        vAlpha = fade * (0.35 + 0.65 * smoothstep(0.0, 0.25, f));

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aRnd.y * uPx * uScale * uSz / -mv.z;
        gl_Position = projectionMatrix * mv;
    }
`;

const HERO_FRAG = /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
    }
`;

const WARP_VERT = /* glsl */ `
    attribute float aEnd;
    attribute vec4 aLine;  // x, y: radial dir; z: speed; w: phase
    uniform float uTime, uWarp, uShow;
    varying float vA;
    void main() {
        float depth = 70.0;
        float z0 = -depth + mod(aLine.w * depth + uTime * aLine.z * (4.0 + uWarp * 60.0), depth);
        float r = 2.0 + aLine.z * 9.0;
        vec3 p = vec3(aLine.xy * r, z0 - aEnd * (0.15 + uWarp * 7.0));
        vA = uShow * (0.12 + uWarp * 0.9) * (1.0 - aEnd * 0.8) * smoothstep(-depth, -depth * 0.6, z0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
`;

const WARP_FRAG = /* glsl */ `
    varying float vA;
    void main() {
        gl_FragColor = vec4(0.55, 0.6, 1.0, vA);
        #include <colorspace_fragment>
    }
`;

const GRID_VERT = /* glsl */ `
    varying vec3 vW;
    void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`;

const GRID_FRAG = /* glsl */ `
    uniform float uShow, uTime;
    varying vec3 vW;
    float line(float v) {
        float w = fwidth(v);
        float g = abs(fract(v - 0.5) - 0.5) / max(w, 0.0001);
        return 1.0 - min(g, 1.0);
    }
    void main() {
        vec2 uv = vW.xz * 0.5;
        uv.y += uTime * 0.35 * 0.5;
        float g = max(line(uv.x), line(uv.y));
        float dist = length(vW.xz - vec2(0.0, 6.0));
        float fade = smoothstep(46.0, 4.0, dist) * smoothstep(-34.0, -4.0, vW.z);
        gl_FragColor = vec4(0.42, 0.45, 1.0, g * fade * uShow * 0.55);
        #include <colorspace_fragment>
    }
`;

function drawWindowTexture(info) {
    const W = 512, H = 336;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    roundedRect(g, 6, 6, W - 12, H - 12, 28);
    const body = g.createLinearGradient(0, 0, 0, H);
    body.addColorStop(0, 'rgba(34,34,72,0.96)');
    body.addColorStop(1, 'rgba(13,13,33,0.96)');
    g.fillStyle = body;
    g.fill();
    g.save();
    roundedRect(g, 6, 6, W - 12, H - 12, 28);
    g.clip();
    const aura = g.createRadialGradient(90, 170, 0, 90, 170, 300);
    aura.addColorStop(0, hexA(info.c1, 0.4));
    aura.addColorStop(1, hexA(info.c1, 0));
    g.fillStyle = aura;
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.fillRect(0, 0, W, 54);
    g.restore();
    roundedRect(g, 6, 6, W - 12, H - 12, 28);
    const stroke = g.createLinearGradient(0, 0, W, H);
    stroke.addColorStop(0, info.c1);
    stroke.addColorStop(1, info.c2);
    g.lineWidth = 3;
    g.strokeStyle = stroke;
    g.stroke();

    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
        g.beginPath();
        g.arc(38 + i * 28, 30, 8, 0, Math.PI * 2);
        g.fillStyle = col;
        g.fill();
    });
    g.fillStyle = '#7c86a8';
    g.font = '500 20px "JetBrains Mono", monospace';
    g.textAlign = 'right';
    g.fillText('ruy://run', W - 30, 37);

    const ix = 40, iy = 96, is = 112;
    roundedRect(g, ix, iy, is, is, 28);
    const ig = g.createLinearGradient(ix, iy, ix + is, iy + is);
    ig.addColorStop(0, info.c1);
    ig.addColorStop(1, info.c2);
    g.fillStyle = ig;
    g.fill();
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = info.glyph.charCodeAt(0) > 0xf000 ? '900 52px "Font Awesome 6 Free"' : '900 54px Orbitron, sans-serif';
    g.fillText(info.glyph, ix + is / 2, iy + is / 2 + 2);

    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#fff';
    g.font = '700 31px Orbitron, monospace';
    let title = info.title;
    while (g.measureText(title).width > W - 190 && title.length > 4) title = title.slice(0, -1);
    g.fillText(title === info.title ? title : `${title}…`, 176, 140);
    g.fillStyle = '#28c840';
    g.beginPath();
    g.arc(184, 176, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#a7b0c5';
    g.font = '500 22px "JetBrains Mono", monospace';
    g.fillText('RUNNING', 202, 184);

    // progress rail
    roundedRect(g, 40, 262, W - 80, 12, 6);
    g.fillStyle = 'rgba(255,255,255,0.1)';
    g.fill();
    roundedRect(g, 40, 262, (W - 80) * 0.86, 12, 6);
    const pg = g.createLinearGradient(40, 0, W - 40, 0);
    pg.addColorStop(0, info.c1);
    pg.addColorStop(1, info.c2);
    g.fillStyle = pg;
    g.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

async function loadBloom() {
    try {
        const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
            import('three/addons/postprocessing/EffectComposer.js'),
            import('three/addons/postprocessing/RenderPass.js'),
            import('three/addons/postprocessing/UnrealBloomPass.js'),
            import('three/addons/postprocessing/OutputPass.js'),
        ]);
        return { EffectComposer, RenderPass, UnrealBloomPass, OutputPass };
    } catch (err) {
        console.warn('[ruy] bloom unavailable, rendering without it:', err);
        return null;
    }
}

function createHero(bloomLib) {
    const section = $('#hero');
    const canvas = $('#hero-canvas');
    const cards = [...document.querySelectorAll('.apps-grid .app-card')];
    if (!section || !canvas) return null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !bloomLib, alpha: false, powerPreference: 'high-performance' });
    const DPR = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 1); // (a tinted clear colour comes out washed-out through the bloom composer)

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 160);
    camera.position.set(0, 0, 17);

    // ---------- sample the two phrases ----------
    const SAMPLE_PX = 190;
    const STEP = window.innerWidth < 700 ? 4 : 3;
    const A = sampleText(HERO_SRC, SAMPLE_PX, STEP);
    const B = sampleText(HERO_DST, SAMPLE_PX, STEP);
    const K = 14.5 / A.width; // world units per sample pixel
    const WORLD_A = A.width * K;
    const WORLD_B = B.width * K;

    const bMinX = -B.width / 2, bMaxX = B.width / 2;
    const palette = {
        ru: [new THREE.Color('#818cf8'), new THREE.Color('#a78bfa')],
        y: [new THREE.Color('#f093fb'), new THREE.Color('#f5576c')],
        dot: [new THREE.Color('#f59e0b'), new THREE.Color('#fcd34d')],
        app: [new THREE.Color('#4facfe'), new THREE.Color('#00f2fe')],
    };
    const bColor = (di, x, out) => {
        const t = clamp((x - bMinX) / (bMaxX - bMinX), 0, 1);
        const set = di <= 1 ? palette.ru : di === 2 ? palette.y : di === HERO_DOT ? palette.dot : palette.app;
        return out.copy(set[0]).lerp(set[1], t * 0.8 + Math.random() * 0.2);
    };

    const hiSet = new Set(HERO_PAIRS.map((p) => p[0]));
    const parts = []; // { a:[x,y], b:[x,y], hi, group, color:Color, rx }
    const tmpC = new THREE.Color();
    const dimC = new THREE.Color('#7f8fe6');
    let dotWorldX = 0;
    {
        const dotPts = B.glyphs[HERO_DOT].pts;
        const dotCx = dotPts.reduce((s, p) => s + p[0], 0) / Math.max(1, dotPts.length);
        dotWorldX = dotCx * K;
    }

    HERO_PAIRS.forEach(([si, di]) => {
        const sp = A.glyphs[si].pts;
        const dp = shuffleInPlace(B.glyphs[di].pts.slice());
        sp.forEach((p, i) => {
            const q = dp[i % dp.length];
            bColor(di, q[0], tmpC);
            parts.push({ a: p, b: q, hi: 1, group: 0, color: tmpC.clone() });
        });
    });
    const others = [];
    A.glyphs.forEach((g, gi) => { if (!hiSet.has(gi)) g.pts.forEach((p) => others.push(p)); });
    shuffleInPlace(others);
    const dotCount = Math.min(520, Math.floor(others.length * 0.3));
    const dotPts = B.glyphs[HERO_DOT].pts;
    others.forEach((p, i) => {
        if (i < dotCount) {
            const q = dotPts[i % dotPts.length];
            parts.push({ a: p, b: [q[0] + (Math.random() - 0.5) * STEP * 1.6, q[1] + (Math.random() - 0.5) * STEP * 1.6], hi: 0, group: 1, color: bColor(HERO_DOT, q[0], new THREE.Color()) });
        } else {
            const ang = Math.random() * Math.PI * 2;
            const r = heroRand(380, 1400);
            parts.push({ a: p, b: [Math.cos(ang) * r, Math.sin(ang) * r * 0.7, heroRand(-120, 120)], hi: 0, group: 2, color: dimC.clone() });
        }
    });

    const N = parts.length;
    const aScatter = new Float32Array(N * 3), aA = new Float32Array(N * 3), aB = new Float32Array(N * 3);
    const aRnd = new Float32Array(N * 4), aColor = new Float32Array(N * 3), aHi = new Float32Array(N);
    const aMin = -A.width / 2;
    parts.forEach((p, i) => {
        const ang = Math.random() * Math.PI * 2;
        const r = heroRand(3, 17);
        aScatter.set([Math.cos(ang) * r, Math.sin(ang) * r * 0.75, heroRand(-34, -10)], i * 3);
        aA.set([p.a[0] * K, p.a[1] * K, (Math.random() - 0.5) * 0.18], i * 3);
        const bz = p.b[2] !== undefined ? p.b[2] * K : (Math.random() - 0.5) * 0.18;
        aB.set([p.b[0] * K, p.b[1] * K, bz], i * 3);
        const xn = (p.a[0] - aMin) / A.width;
        aRnd.set([clamp(xn * 0.7 + Math.random() * 0.3, 0, 1), heroRand(0.55, 1.15), Math.random(), p.group + Math.random() * 0.4], i * 4);
        const c = p.group === 2 ? dimC : p.hi ? p.color : p.group === 1 ? p.color : dimC;
        aColor.set([c.r, c.g, c.b], i * 3);
        aHi[i] = p.hi;
    });
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(aA, 3));
    pGeo.setAttribute('aScatter', new THREE.BufferAttribute(aScatter, 3));
    pGeo.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
    pGeo.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
    pGeo.setAttribute('aRnd', new THREE.BufferAttribute(aRnd, 4));
    pGeo.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
    pGeo.setAttribute('aHi', new THREE.BufferAttribute(aHi, 1));
    const pMat = new THREE.ShaderMaterial({
        vertexShader: HERO_VERT,
        fragmentShader: HERO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uForm: { value: 0 }, uMerge: { value: 0 }, uTime: { value: 0 }, uPx: { value: 1 }, uScale: { value: 600 },
            uHi: { value: 0 }, uPulse: { value: 0 }, uBreath: { value: 0 }, uSz: { value: 1 },
        },
    });
    const points = new THREE.Points(pGeo, pMat);
    points.frustumCulled = false;
    // sized in world units (the shader multiplies by uScale/-z)
    const POINT_WORLD = 0.07;
    const logo = new THREE.Group();
    logo.add(points);
    scene.add(logo);

    // ---------- warp lines ----------
    const LINES = 700;
    const wPos = new Float32Array(LINES * 2 * 3), wEnd = new Float32Array(LINES * 2), wLine = new Float32Array(LINES * 2 * 4);
    for (let i = 0; i < LINES; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = Math.random();
        const ph = Math.random();
        for (let e = 0; e < 2; e++) {
            const k = i * 2 + e;
            wEnd[k] = e;
            wLine.set([Math.cos(ang), Math.sin(ang), 0.4 + speed * 0.9, ph], k * 4);
        }
    }
    const wGeo = new THREE.BufferGeometry();
    wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
    wGeo.setAttribute('aEnd', new THREE.BufferAttribute(wEnd, 1));
    wGeo.setAttribute('aLine', new THREE.BufferAttribute(wLine, 4));
    const wMat = new THREE.ShaderMaterial({
        vertexShader: WARP_VERT, fragmentShader: WARP_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uWarp: { value: 0 }, uShow: { value: 0 } },
    });
    const warp = new THREE.LineSegments(wGeo, wMat);
    warp.frustumCulled = false;
    scene.add(warp);

    // ---------- neon floor ----------
    const gridMat = new THREE.ShaderMaterial({
        vertexShader: GRID_VERT, fragmentShader: GRID_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uShow: { value: 0 }, uTime: { value: 0 } },
        extensions: { derivatives: true },
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.set(0, -5.6, -30);
    scene.add(grid);

    // ---------- shockwave rings ----------
    const rings = [0, 1].map((i) => {
        const m = new THREE.Mesh(
            new THREE.RingGeometry(0.96, 1, 160),
            new THREE.MeshBasicMaterial({ color: i ? 0xf093fb : 0x8b9cff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
        );
        m.visible = false;
        logo.add(m);
        return m;
    });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x7c8bff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(16);
    logo.add(glow);

    // ---------- app windows ----------
    const orbit = new THREE.Group();
    orbit.rotation.x = 0.5; // front of the ring dips below the logo, the back rises above it
    scene.add(orbit);
    const WIN_W = 2.0, WIN_H = WIN_W * (336 / 512);
    const winGeo = new THREE.PlaneGeometry(WIN_W, WIN_H);
    const windows = cards.map((card, i) => {
        const info = readCard(card, i);
        const mat = new THREE.MeshBasicMaterial({ map: drawWindowTexture(info), transparent: true, opacity: 0, depthWrite: false });
        const mesh = new THREE.Mesh(winGeo, mat);
        mesh.visible = false;
        orbit.add(mesh);
        return { mesh, mat, base: (i / cards.length) * Math.PI * 2, start: 7.05 + i * 0.1, info };
    });

    // ---------- optional bloom ----------
    let composer = null, bloom = null;
    if (bloomLib) {
        composer = new bloomLib.EffectComposer(renderer);
        composer.setPixelRatio(DPR);
        composer.addPass(new bloomLib.RenderPass(scene, camera));
        bloom = new bloomLib.UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.7, 0.2);
        composer.addPass(bloom);
        composer.addPass(new bloomLib.OutputPass());
    }

    // ---------- DOM: boot log, progress, flash ----------
    const logEl = $('#hero-log');
    const phaseEl = $('#hero-phase');
    const barEl = $('#hero-bar-fill');
    const pctEl = $('#hero-pct');
    const flashEl = $('#hero-flash');
    const skipBtn = $('#hero-skip');
    const count = cards.length;
    const LOG = [
        [0.2, '$ ruy run --your --app', ''],
        [1.2, '[ ok ] resolving (Ru)n', 'ok'],
        [2.0, '[ ok ] resolving (Y)our', 'ok'],
        [2.8, '[ ok ] resolving (App)', 'ok'],
        [4.6, '[ .. ] extracting initials R·U·Y·A·P·P', 'wait'],
        [6.0, '[ ok ] building RUY.APP', 'ok'],
        [6.9, `[ ok ] deploying ${count} apps`, 'ok'],
        [7.4, '[ ▶ ] RUNNING — your app is live', 'go'],
    ];
    const PHASES = [[0, 'BOOT'], [1.0, 'RESOLVE'], [4.6, 'BUILD'], [6.8, 'DEPLOY'], [7.4, 'RUNNING']];
    let logIndex = 0, phaseIdx = -1, lastPct = -1, revealed = false;

    function resetHud() {
        logEl.innerHTML = '';
        logIndex = 0;
        phaseIdx = -1;
        lastPct = -1;
        flashEl.style.opacity = '0';
        skipBtn.classList.remove('done');
        setSkipLabel();
    }
    function setSkipLabel() {
        const done = skipBtn.classList.contains('done');
        const labels = (window.RUY_HERO_LABELS || ['Skip intro', 'Replay intro']);
        $('span', skipBtn).textContent = done ? labels[1] : labels[0];
        $('i', skipBtn).className = done ? 'fas fa-redo' : 'fas fa-forward';
    }
    document.addEventListener('ruy:lang', setSkipLabel);

    function pushLog(entry) {
        const li = document.createElement('div');
        li.className = `hero-log-line ${entry[2]}`;
        li.textContent = entry[1];
        logEl.appendChild(li);
        while (logEl.children.length > 14) logEl.removeChild(logEl.firstChild);
    }

    // endless, random deployment chatter once the scripted boot lines are done
    const slugs = cards.map((c) => c.dataset.appId || 'app');
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];
    const hex = (n) => Array.from({ length: n }, () => ((Math.random() * 16) | 0).toString(16)).join('');
    const num = (a, b) => a + ((Math.random() * (b - a + 1)) | 0);
    function randomLogEntry() {
        const app = pick(slugs);
        const r = Math.random();
        if (r < 0.16) return [0, `[ ok ] pull ruy/${app}:latest`, 'ok'];
        if (r < 0.30) return [0, `[ ok ] ${app}-${hex(4)} started`, 'ok'];
        if (r < 0.46) return [0, `[ ok ] health ${app} 200 ${num(3, 96)}ms`, 'ok'];
        if (r < 0.62) return [0, `GET /${app}/status 200 ${num(4, 120)}ms`, ''];
        if (r < 0.72) return [0, `[ ok ] dns ${app}.ruy.app \u2192 10.0.${num(1, 99)}.${num(2, 254)}`, 'ok'];
        if (r < 0.79) return [0, `[ ok ] tls renewed ${app}.ruy.app`, 'ok'];
        if (r < 0.86) return [0, `[ .. ] scaling ${app} x${num(2, 6)}`, 'wait'];
        if (r < 0.92) return [0, `[warn] ${pick(['eu-west', 'us-east', 'nbg1', 'fra1'])} latency ${num(60, 190)}ms`, 'wait'];
        return [0, `[ \u25b6 ] deploy #${num(4000, 9999)} live`, 'go'];
    }
    let streamIn = 0.5;

    // ---------- timeline ----------
    let T = REDUCED ? HERO_END : 0;
    let playing = true;
    // the intro starts once the loading screen is gone
    let started = window.__ruyLoaded === true || !document.getElementById('loading-screen');
    document.addEventListener('ruy:loaded', () => { started = true; });
    let orbitAngle = 0;
    let visible = true;
    const cam = { x: 0, y: 0 };
    let fit = 1, halfH = 5, halfW = 8, logoY = 1.8, viewW = 1200;

    function layout() {
        const w = section.clientWidth, h = section.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        if (composer) composer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        pMat.uniforms.uScale.value = (h * DPR) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * POINT_WORLD;
        const dist = 12.5;
        halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
        halfW = halfH * camera.aspect;
        fit = halfW; // visible half width at the reference distance
        viewW = w;
        // keep the logo ~300px from the top however tall the hero grows (the text block sits below it)
        const centrePx = clamp(h * 0.34, 190, 300);
        logoY = halfH * (1 - (2 * centrePx) / h);
    }
    new ResizeObserver(layout).observe(section);
    layout();
    new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; }, { threshold: 0.01 }).observe(section);

    function reveal() {
        if (revealed) return;
        revealed = true;
        document.body.classList.add('hero-ready');
    }
    function finish() {
        skipBtn.classList.add('done');
        setSkipLabel();
    }
    skipBtn.addEventListener('click', () => {
        if (skipBtn.classList.contains('done')) {
            T = 0;
            playing = true;
            resetHud();
        } else {
            T = HERO_END;
        }
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && visible && !skipBtn.classList.contains('done')) T = HERO_END; });

    const tmpQ = new THREE.Quaternion();

    function update(dt, t) {
        if (!visible || !started) return;
        if (playing) {
            T = Math.min(HERO_END, T + dt);
            if (T >= HERO_END) { playing = false; finish(); reveal(); }
        }
        const u = pMat.uniforms;
        const form = heroSeg(T, 0.9, 3.5);
        const hiT = heroSmooth(heroSeg(T, 3.3, 4.0)) * (1 - heroSmooth(heroSeg(T, 4.8, 5.5)));
        const merge = heroSeg(T, 4.7, 6.7);
        const ign = heroBell(T, 6.9, 7.45);
        const settle = heroSmooth(heroSeg(T, 7.0, 9.0));

        u.uForm.value = form;
        u.uMerge.value = merge;
        u.uHi.value = hiT;
        u.uTime.value = t;
        u.uBreath.value = settle;
        u.uPulse.value = Math.sin(heroSeg(T, 6.9, 7.7) * Math.PI) * 0.9 * (T > 6.9 ? 1 : 0);

        wMat.uniforms.uTime.value = t;
        wMat.uniforms.uShow.value = heroSmooth(heroSeg(T, 0.4, 1.6));
        wMat.uniforms.uWarp.value = heroBell(T, 6.7, 8.1) * 0.9 + 0.02;
        gridMat.uniforms.uTime.value = t;
        gridMat.uniforms.uShow.value = heroSmooth(heroSeg(T, 6.9, 8.4));

        // logo framing: shrink to fit narrow screens, grow into the final logo
        const fitA = Math.min(1, (halfW * 2 * 0.86) / WORLD_A);
        const fitB = Math.min(1.45, (halfW * 2 * 0.8) / WORLD_B);
        const sc = THREE.MathUtils.lerp(fitA, fitB, heroSmooth(merge));
        logo.scale.setScalar(sc);
        u.uSz.value = clamp(sc, 0.3, 1.2) * (viewW < 700 ? 0.8 : 1);
        logo.position.y = logoY + Math.sin(t * 0.8) * 0.06 * MOTION * settle;
        logo.rotation.y += ((pointer.x * 0.22 + Math.sin(t * 0.35) * 0.05 * settle) - logo.rotation.y) * Math.min(1, dt * 3);
        logo.rotation.x += ((-pointer.y * 0.1) - logo.rotation.x) * Math.min(1, dt * 3);

        // camera dolly
        const z = 17 - 2 * heroSmooth(heroSeg(T, 0, 1.2)) - 2.5 * heroSmooth(heroSeg(T, 1, 3.4)) - 0.5 * heroSmooth(heroSeg(T, 3.4, 4.8))
            + 1.4 * heroSmooth(heroSeg(T, 4.8, 6.6)) + 1.3 * heroSmooth(heroSeg(T, 6.9, 7.6)) - 1.0 * heroSmooth(heroSeg(T, 7.6, 10));
        cam.x += (pointer.x * 0.9 - cam.x) * Math.min(1, dt * 2);
        cam.y += (pointer.y * 0.5 - cam.y) * Math.min(1, dt * 2);
        const shake = ign * 0.09 * MOTION;
        camera.position.set(cam.x + (Math.random() - 0.5) * shake, cam.y + (Math.random() - 0.5) * shake, z);
        camera.lookAt(cam.x * 0.2, 0, 0);

        // shockwave + glow
        const ringT = heroSeg(T, 6.9, 8.3);
        rings.forEach((r, i) => {
            const p = clamp(ringT - i * 0.12, 0, 1);
            r.visible = p > 0 && p < 1;
            r.scale.setScalar(0.5 + heroSmooth(p) * (i ? 16 : 22));
            r.material.opacity = (1 - p) * 0.7;
        });
        glow.material.opacity = (ign * 0.5 + settle * 0.2) * (T > 6.8 ? 1 : 0) + heroSmooth(heroSeg(T, 5.2, 6.7)) * 0.25 * (1 - settle);
        glow.scale.setScalar(14 + ign * 8 + Math.sin(t * 1.6) * 0.5 * settle);
        flashEl.style.opacity = String((heroBell(T, 6.88, 7.25) * 0.3).toFixed(3));
        if (bloom) bloom.strength = (0.7 + ign * 0.7 + settle * 0.15) * (viewW < 700 ? 0.55 : 1);

        // app windows fly out of the dot and settle in orbit
        orbitAngle += dt * 0.13 * MOTION;
        const orbitScale = clamp((halfW * 2 * 0.9) / 19.5, 0.34, 1);
        orbit.scale.setScalar(orbitScale);
        orbit.position.set(0, logo.position.y - 0.2, -0.5);
        const ox = (dotWorldX * sc) / orbitScale, oy = (logo.position.y - orbit.position.y) / orbitScale, oz = 0.5 / orbitScale;
        tmpQ.copy(orbit.quaternion).invert().multiply(camera.quaternion);
        windows.forEach((w) => {
            const p = heroSmooth(heroSeg(T, w.start, w.start + 1.5));
            w.mesh.visible = p > 0.001;
            if (!w.mesh.visible) return;
            const a = w.base + orbitAngle;
            const rx = 8.6, rz = 3.6;
            const tx = Math.cos(a) * rx, tz = Math.sin(a) * rz, ty = Math.sin(a * 2 + w.base) * 0.5;
            const arc = Math.sin(p * Math.PI) * 1.6;
            w.mesh.position.set(ox + (tx - ox) * p, oy + (ty - oy) * p + arc, oz + (tz - oz) * p);
            w.mesh.scale.setScalar(0.25 + p * 0.75);
            w.mat.opacity = p * (0.55 + 0.45 * ((tz / rz + 1) / 2));
            w.mesh.quaternion.copy(tmpQ);
        });

        // HUD
        while (logIndex < LOG.length && T >= LOG[logIndex][0]) pushLog(LOG[logIndex++]);
        let ph = 0;
        PHASES.forEach((p, i) => { if (T >= p[0]) ph = i; });
        if (ph !== phaseIdx) { phaseIdx = ph; phaseEl.textContent = PHASES[ph][1]; phaseEl.dataset.phase = PHASES[ph][1].toLowerCase(); }
        const pct = Math.round(heroSmooth(clamp(T / 7.4, 0, 1)) * 100);
        if (pct !== lastPct) { lastPct = pct; barEl.style.width = `${pct}%`; pctEl.textContent = `${pct}%`; }
        if (T >= 7.7) reveal();
        if (T >= 7.9 && MOTION) {
            streamIn -= dt;
            if (streamIn <= 0) {
                pushLog(randomLogEntry());
                streamIn = 0.25 + Math.random() * 0.9;
            }
        }

        if (composer) composer.render();
        else renderer.render(scene, camera);
    }

    resetHud();
    if (REDUCED) { while (logIndex < LOG.length) pushLog(LOG[logIndex++]); finish(); reveal(); }
    return { update };
}

// ========================================
// Boot
// ========================================
(async function boot() {
    const root = document.documentElement;
    if (!hasWebGL()) { root.classList.remove('hero-3d'); return; }

    let bg = null;
    try {
        bg = createBackground();
        if (bg) document.body.classList.add('three-bg');
    } catch (err) {
        console.warn('[ruy] background scene disabled:', err);
    }

    let hero = null, lib = null;
    try {
        const [bloom] = await Promise.all([loadBloom(), waitForFonts()]);
        try {
            hero = createHero(bloom);
        } catch (err) {
            console.warn('[ruy] hero scene disabled:', err);
        }
        if (hero) window.__ruyHeroOk = true;
        else root.classList.remove('hero-3d');
        lib = createLibrary();
        if (lib) document.body.classList.add('lib-ready');
    } catch (err) {
        console.warn('[ruy] 3D library disabled:', err);
        if (!hero) root.classList.remove('hero-3d');
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
        if (hero) hero.update(dt, t);
        if (lib && lib.visible) lib.update(dt, t);
    }
    frame();
})();
