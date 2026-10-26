// PBR-материалы: цветовая карта + карта высот (bump) + roughness/metalness. Всё рисуется кодом.
import * as THREE from './vendor/three.module.js';

const canv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const tex = (c, srgb = true) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const speck = (g, w, h, n, a, b, s = 2) => {
  for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? a : b; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * s, 1 + Math.random() * s); }
};
const gray = (v) => `rgb(${v},${v},${v})`;
const rgbS = (r, g, b, k = 1) => `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;

function mat(c, b, o = {}) {
  return new THREE.MeshStandardMaterial({
    map: c ? tex(c) : null,
    bumpMap: b ? tex(b, false) : null,
    bumpScale: o.bump ?? 0.02,
    color: o.color ?? 0xffffff,
    roughness: o.rough ?? 0.8,
    metalness: o.metal ?? 0,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
    depthWrite: o.depthWrite ?? true,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.ei ?? 1,
    envMapIntensity: o.env ?? 1,
  });
}
const plain = (o) => mat(null, null, o);

/* ---- карты ---- */
const brickC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#6f5d52'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
    const off = (r % 2) * 32, k = 0.75 + Math.random() * 0.4;
    g.fillStyle = rgbS(128, 66, 50, k); g.fillRect(c * 64 + off + 2, r * 32 + 2, 60, 28);
  }
  speck(g, w, h, 1200, 'rgba(0,0,0,0.18)', 'rgba(255,230,200,0.05)', 2);
});
const brickB = canv(256, 256, (g, w, h) => {
  g.fillStyle = gray(50); g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
    g.fillStyle = gray(160 + Math.floor(Math.random() * 60)); g.fillRect(c * 64 + (r % 2) * 32 + 2, r * 32 + 2, 60, 28);
  }
});
const plasterC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#cbbda6'; g.fillRect(0, 0, w, h); speck(g, w, h, 2600, 'rgba(90,70,50,0.06)', 'rgba(255,250,235,0.08)', 3);
});
const plasterB = canv(256, 256, (g, w, h) => {
  g.fillStyle = gray(128); g.fillRect(0, 0, w, h); speck(g, w, h, 2000, gray(110), gray(150), 3);
});
const wallpaperC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#4f5f4c'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(190,200,170,0.07)'; g.fillRect(x + 8, 0, 10, h); }
  for (let y = 16; y < h; y += 64) for (let x = 16; x < w; x += 64) { g.fillStyle = 'rgba(200,190,150,0.12)'; g.beginPath(); g.arc(x, y, 4, 0, 6.3); g.fill(); }
  speck(g, w, h, 800, 'rgba(0,0,0,0.08)', 'rgba(255,255,255,0.03)', 2);
});
const wallpaperCream = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#d6c9ac'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 42) for (let x = (y / 42 % 2) * 21; x < w; x += 42) { g.fillStyle = 'rgba(120,95,60,0.12)'; g.beginPath(); g.ellipse(x, y, 9, 13, 0, 0, 6.3); g.fill(); }
  speck(g, w, h, 1500, 'rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)', 2);
});
const woodC = canv(256, 256, (g, w, h) => {
  const pl = 64;
  for (let y = 0; y < h; y += pl) {
    const k = 0.8 + Math.random() * 0.35;
    g.fillStyle = rgbS(118, 80, 52, k); g.fillRect(0, y, w, pl);
    speck(g, w, pl, 160, 'rgba(0,0,0,0.22)', 'rgba(255,210,160,0.06)', 18);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, y, w, 2);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect((y / pl % 2) * 96, y, 2, pl);
  }
});
const woodB = canv(256, 256, (g, w, h) => {
  g.fillStyle = gray(120); g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) { g.fillStyle = gray(40); g.fillRect(0, y, w, 3); g.fillStyle = gray(40); g.fillRect((y / 64 % 2) * 96, y, 3, 64); }
  speck(g, w, h, 500, gray(100), gray(150), 12);
});
const tileC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#8f8c86'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.fillStyle = rgbS(226, 224, 218, 0.9 + Math.random() * 0.1); g.fillRect(x + 2, y + 2, 60, 60); }
});
const tileB = canv(256, 256, (g, w, h) => {
  g.fillStyle = gray(30); g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.fillStyle = gray(200); g.fillRect(x + 3, y + 3, 58, 58); }
});
const carpetC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#5b3f3a'; g.fillRect(0, 0, w, h); speck(g, w, h, 4000, 'rgba(0,0,0,0.2)', 'rgba(255,200,170,0.05)', 2);
});
const asphaltC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#1f2226'; g.fillRect(0, 0, w, h); speck(g, w, h, 5000, 'rgba(0,0,0,0.35)', 'rgba(150,160,170,0.08)', 2);
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
});
const asphaltB = canv(256, 256, (g, w, h) => { g.fillStyle = gray(150); g.fillRect(0, 0, w, h); speck(g, w, h, 6000, gray(90), gray(200), 2); });
const concC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#6d6e6f'; g.fillRect(0, 0, w, h); speck(g, w, h, 2500, 'rgba(0,0,0,0.12)', 'rgba(255,255,255,0.05)', 3);
  g.fillStyle = 'rgba(40,40,40,0.8)'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
});
const lawnC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#243020'; g.fillRect(0, 0, w, h); speck(g, w, h, 9000, 'rgba(0,0,0,0.3)', 'rgba(120,160,80,0.12)', 2);
});
const lawnB = canv(256, 256, (g, w, h) => { g.fillStyle = gray(140); g.fillRect(0, 0, w, h); speck(g, w, h, 6000, gray(90), gray(190), 2); });
const roofC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#3a3331'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { const k = 0.7 + Math.random() * 0.5; g.fillStyle = rgbS(58, 52, 50, k); g.fillRect(c * 64 + (r % 2) * 32 + 1, r * 16 + 1, 62, 14); }
});
const roofB = canv(256, 256, (g, w, h) => {
  g.fillStyle = gray(60); g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { g.fillStyle = gray(190); g.fillRect(c * 64 + (r % 2) * 32 + 2, r * 16 + 2, 60, 12); }
});
const barkC = canv(128, 256, (g, w, h) => {
  g.fillStyle = '#3b2b20'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 4) { g.fillStyle = `rgba(0,0,0,${(Math.random() * 0.5).toFixed(2)})`; g.fillRect(x, 0, 2 + Math.random() * 3, h); }
});
const barkB = canv(128, 256, (g, w, h) => {
  g.fillStyle = gray(120); g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 6) { g.fillStyle = gray(60 + Math.floor(Math.random() * 120)); g.fillRect(x, 0, 3, h); }
});
const foliageC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#1d2b1b'; g.fillRect(0, 0, w, h); speck(g, w, h, 5000, 'rgba(0,0,0,0.35)', 'rgba(90,130,60,0.18)', 3);
});
const facadeC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#5a4a40'; g.fillRect(0, 0, w, h); speck(g, w, h, 1200, 'rgba(0,0,0,0.12)', 'rgba(255,220,200,0.04)', 3);
  for (let y = 20; y < h - 40; y += 60) for (let x = 14; x < w - 30; x += 52) {
    const lit = Math.random() < 0.35;
    g.fillStyle = lit ? 'rgba(255,200,120,0.95)' : 'rgba(20,24,30,0.95)';
    g.fillRect(x, y, 30, 40);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 14, y, 2, 40); g.fillRect(x, y + 19, 30, 2);
  }
});
const facadeB = canv(256, 256, (g, w, h) => {
  g.fillStyle = gray(200); g.fillRect(0, 0, w, h);
});
const glowC = canv(128, 128, (g) => {
  const grd = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,230,180,1)'); grd.addColorStop(0.25, 'rgba(255,200,130,0.5)'); grd.addColorStop(1, 'rgba(255,190,110,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
});
const coneC = canv(64, 256, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, 'rgba(255,225,170,0.9)'); grd.addColorStop(0.5, 'rgba(255,215,160,0.25)'); grd.addColorStop(1, 'rgba(255,205,150,0.0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});
const curtainC = canv(128, 256, (g, w, h) => {
  g.fillStyle = '#6e5f52'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 12) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(255,240,220,0.06)'; g.fillRect(x + 6, 0, 3, h); }
});
const fabricC = canv(128, 128, (g, w, h) => { g.fillStyle = '#3c4a4c'; g.fillRect(0, 0, w, h); speck(g, w, h, 2400, 'rgba(0,0,0,0.14)', 'rgba(200,220,210,0.06)', 2); });
const fabricB = canv(128, 128, (g, w, h) => { g.fillStyle = gray(140); g.fillRect(0, 0, w, h); speck(g, w, h, 2400, gray(100), gray(180), 2); });
const doorC = canv(256, 512, (g, w, h) => {
  g.fillStyle = '#4b2b1b'; g.fillRect(0, 0, w, h); speck(g, w, h, 1500, 'rgba(0,0,0,0.2)', 'rgba(255,210,170,0.05)', 2);
});
const stoneC = canv(256, 256, (g, w, h) => {
  g.fillStyle = '#7b7a76'; g.fillRect(0, 0, w, h); speck(g, w, h, 3000, 'rgba(0,0,0,0.2)', 'rgba(255,255,255,0.14)', 3);
});
const bumpSpeck = canv(128, 128, (g, w, h) => { g.fillStyle = gray(128); g.fillRect(0, 0, w, h); speck(g, w, h, 3000, gray(100), gray(160), 2); });

/* ---- материалы ---- */
export const MAT = {
  brick: mat(brickC, brickB, { bump: 0.06, rough: 0.9 }),
  plaster: mat(plasterC, plasterB, { bump: 0.012, rough: 0.95 }),
  wallpaper: mat(wallpaperC, null, { rough: 0.9 }),
  wallpaperCream: mat(wallpaperCream, null, { rough: 0.92 }),
  woodFloor: mat(woodC, woodB, { bump: 0.02, rough: 0.5 }),
  tile: mat(tileC, tileB, { bump: 0.02, rough: 0.22 }),
  tileDark: mat(tileC, tileB, { bump: 0.02, rough: 0.22, color: 0x4a6068 }),
  carpet: mat(carpetC, bumpSpeck, { bump: 0.03, rough: 1 }),
  asphalt: mat(asphaltC, asphaltB, { bump: 0.02, rough: 0.42, env: 1.2 }),
  concrete: mat(concC, bumpSpeck, { bump: 0.02, rough: 0.8 }),
  lawn: mat(lawnC, lawnB, { bump: 0.03, rough: 1 }),
  roof: mat(roofC, roofB, { bump: 0.05, rough: 0.8 }),
  bark: mat(barkC, barkB, { bump: 0.08, rough: 0.95 }),
  foliage: plain({ color: 0x27402a, rough: 0.8, side: THREE.DoubleSide }),
  facade: mat(facadeC, null, { rough: 0.85 }),
  darkMetal: plain({ color: 0x1b1d20, metal: 0.8, rough: 0.4 }),
  chrome: plain({ color: 0xc9ccd2, metal: 1, rough: 0.14 }),
  paintWhite: plain({ color: 0xe7e4dc, rough: 0.45 }),
  paintTrim: plain({ color: 0x2b2622, rough: 0.5 }),
  paintGreen: plain({ color: 0x2f4a3f, rough: 0.5 }),
  paintCream: plain({ color: 0xd8ccb0, rough: 0.5 }),
  glass: mat(null, null, { color: 0x9fb4c4, rough: 0.04, transparent: true, opacity: 0.22, env: 1.6, depthWrite: false, side: THREE.DoubleSide }),
  walnut: plain({ color: 0x4a2e1c, rough: 0.42 }),
  oak: plain({ color: 0x9a7550, rough: 0.5 }),
  fabric: mat(fabricC, fabricB, { bump: 0.02, rough: 1 }),
  leather: plain({ color: 0x2a1d16, rough: 0.38 }),
  porcelain: plain({ color: 0xe8e6e0, rough: 0.14 }),
  steel: plain({ color: 0x8e9298, metal: 0.9, rough: 0.3 }),
  rubber: plain({ color: 0x111214, rough: 0.9 }),
  door: mat(doorC, null, { rough: 0.5 }),
  doorPaint: plain({ color: 0x2c3b3a, rough: 0.45 }),
  brass: plain({ color: 0xb08d4a, metal: 0.85, rough: 0.3 }),
  stone: mat(stoneC, null, { rough: 0.35 }),
  puddle: plain({ color: 0x06080c, rough: 0.02, metal: 0.2, env: 1.5 }),
  rain: new THREE.MeshBasicMaterial({ color: 0xbcd2e6, transparent: true, opacity: 0.32, depthWrite: false }),
  ripple: new THREE.MeshBasicMaterial({ color: 0xc9dced, transparent: true, opacity: 0.22, depthWrite: false }),
  mirror: new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 1, roughness: 0.04, envMapIntensity: 2.2 }),
  glowSprite: new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowC), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  cone: new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(coneC), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  wire: plain({ color: 0x0a0a0c, rough: 0.6 }),
  gutter: plain({ color: 0x2a2f33, metal: 0.6, rough: 0.4 }),
  curtain: mat(curtainC, null, { rough: 1, env: 0.2 }),
  lampShade: plain({ color: 0xe6d3ab, rough: 0.9, emissive: 0xffc27a, ei: 0.25 }),
  bulb: plain({ color: 0xfff1d0, emissive: 0xffe2b0, ei: 3 }),
  streetLampGlow: plain({ color: 0xffe9c0, emissive: 0xffdca8, ei: 4 }),
  tvScreen: plain({ color: 0x0b0d12, rough: 0.1, metal: 0.4 }),
  fluoro: plain({ color: 0xfff8e8, emissive: 0xfff1d0, ei: 1 }),
  shutterGreen: plain({ color: 0x2c4a3c, rough: 0.6 }),
  rim: plain({ color: 0x0c0c0e, rough: 0.6 }),
  bumpSpeck,
};
export const TEXTURES = { facade: facadeC, facadeB, bumpSpeck, glowC, coneC };

/* ---- крашеный кузов: по цвету ---- */
const carCache = {};
export function carPaint(hex) {
  if (!carCache[hex]) carCache[hex] = new THREE.MeshStandardMaterial({ color: hex, metalness: 0.45, roughness: 0.3, envMapIntensity: 1.2 });
  return carCache[hex];
}
