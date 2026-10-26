// Модели и текстуры эпизода «Не оборачивайся». Всё собирается кодом: ни одного внешнего файла.
// Каждая функция возвращает THREE.Group с началом координат у основания объекта.
import * as THREE from './vendor/three.module.js';
import { RoundedBoxGeometry } from './vendor/addons/RoundedBoxGeometry.js';

/* ---------- текстуры ---------- */
function canvasTex(w, h, paint, rx = 1, ry = 1, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function speckle(g, w, h, n, colA, colB, size = 2) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = Math.random() < 0.5 ? colA : colB;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * size, 1 + Math.random() * size);
  }
}

export const TEX = {
  wall: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#4a4036'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x, 0, 2, h);
      g.fillStyle = 'rgba(255,230,190,0.03)'; g.fillRect(x + 6, 0, 10, h);
    }
    speckle(g, w, h, 1600, 'rgba(0,0,0,0.06)', 'rgba(255,236,200,0.03)', 2);
    for (let x = 0; x < w; x += 40) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, h * 0.85, 2, h * 0.15); }
  }, 2, 1),

  floor: canvasTex(256, 256, (g, w, h) => {
    // доски: 4 полосы, у каждой свой оттенок и текстура волокна
    const plank = 64;
    for (let y = 0; y < h; y += plank) {
      const tint = 0.85 + Math.random() * 0.3;
      g.fillStyle = `rgb(${Math.round(46 * tint)},${Math.round(33 * tint)},${Math.round(24 * tint)})`;
      g.fillRect(0, y, w, plank);
      speckle(g, w, plank, 140, 'rgba(0,0,0,0.25)', 'rgba(255,220,180,0.05)', 16);
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, y, w, 2);
      for (let x = 0; x < w; x += 128) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x + (y / plank % 2) * 64, y, 2, plank); }
    }
  }, 4, 14),

  woodDark: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2a1c12'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      g.fillStyle = `rgba(0,0,0,${(Math.random() * 0.35).toFixed(3)})`;
      g.fillRect(0, y, w, 1 + Math.random());
    }
    speckle(g, w, h, 400, 'rgba(0,0,0,0.2)', 'rgba(255,200,150,0.04)', 6);
  }, 1, 1),

  fabric: canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#3a4236'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2400, 'rgba(0,0,0,0.12)', 'rgba(200,220,190,0.05)', 2);
    for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x, 0, 1, h); }
  }, 1, 1),

  door: canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#3a2516'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(0,0,0,${(Math.random() * 0.25).toFixed(3)})`; g.fillRect(0, y, w, 1); }
    // две филёнки
    const panel = (x, y, pw, ph) => {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y, pw, 5); g.fillRect(x, y, 5, ph); g.fillRect(x + pw - 5, y, 5, ph); g.fillRect(x, y + ph - 5, pw, 5);
      g.fillStyle = 'rgba(255,220,180,0.06)'; g.fillRect(x + 8, y + 8, pw - 16, ph - 16);
    };
    panel(40, 50, 176, 170);
    panel(40, 280, 176, 190);
  }, 1, 1),

  rug: canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#4a1c18'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2b1210'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
    g.strokeStyle = '#6b3a2a'; g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68);
    for (let y = 60; y < h - 60; y += 36) {
      g.fillStyle = 'rgba(40,16,12,0.7)';
      g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 + 30, y + 18); g.lineTo(w / 2, y + 36); g.lineTo(w / 2 - 30, y + 18); g.closePath(); g.fill();
    }
    speckle(g, w, h, 1800, 'rgba(0,0,0,0.25)', 'rgba(255,200,150,0.04)', 2);
  }, 1, 1),

  curtain: canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#5a4d43'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 12) {
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, 0, 6, h);
      g.fillStyle = 'rgba(255,240,220,0.05)'; g.fillRect(x + 6, 0, 3, h);
    }
  }, 1, 1),

  night: canvasTex(256, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#05070d'); grd.addColorStop(1, '#141c30');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(230,235,255,${(Math.random() * 0.8).toFixed(2)})`; g.fillRect(Math.random() * w, Math.random() * h * 0.7, 1, 1); }
    const moon = g.createRadialGradient(190, 60, 2, 190, 60, 60);
    moon.addColorStop(0, 'rgba(220,226,240,0.95)'); moon.addColorStop(0.2, 'rgba(170,185,215,0.5)'); moon.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = moon; g.fillRect(100, 0, 180, 150);
  }, 1, 1, true),

  photo: canvasTex(256, 192, (g, w, h) => {
    g.fillStyle = '#c9b89a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7a8fa3'; g.fillRect(0, 0, w, h * 0.55);
    g.fillStyle = '#d8c7a2'; g.fillRect(0, h * 0.55, w, h * 0.45);
    const fig = (x, y, s, col) => {
      g.fillStyle = col;
      g.beginPath(); g.arc(x, y, 9 * s, 0, Math.PI * 2); g.fill();
      g.fillRect(x - 12 * s, y + 9 * s, 24 * s, 46 * s);
    };
    fig(70, 80, 1.0, '#3b3026');
    fig(120, 74, 1.05, '#4a3b2d');
    fig(176, 84, 0.9, '#2b2a2e');
    fig(214, 66, 0.9, 'rgba(10,8,12,0.85)');
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 0, w, h);
  }, 1, 1),

  paper: canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = '#d4c6a6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(60,40,30,0.55)'; g.lineWidth = 1.4;
    for (let y = 22; y < h - 8; y += 12) {
      g.beginPath();
      for (let x = 10; x < w - 10; x += 6) g.lineTo(x, y + Math.sin(x * 0.4 + y) * 1.2);
      g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h - 4, w, 4);
  }, 1, 1),

  tile: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2c3431'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      const v = (Math.random() * 0.12 - 0.06);
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v).toFixed(3)})`;
      g.fillRect(x + 1, y + 1, 30, 30);
    }
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 1);
  }, 2, 1),
};

/* ---------- материалы ---------- */
const std = (color, rough = 0.9, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

export const MAT = {
  wall: new THREE.MeshStandardMaterial({ map: TEX.wall, color: 0xb8a895, roughness: 0.95 }),
  floor: new THREE.MeshStandardMaterial({ map: TEX.floor, color: 0xa08474, roughness: 0.85 }),
  ceil: std(0x1c1a1f, 1),
  trim: std(0x2b2320, 0.7),
  woodDark: new THREE.MeshStandardMaterial({ map: TEX.woodDark, color: 0xffffff, roughness: 0.65 }),
  wood: std(0x2a1c12, 0.6),
  fabricSofa: new THREE.MeshStandardMaterial({ map: TEX.fabric, roughness: 1 }),
  blanket: std(0x5a3a3a, 1),
  sheet: std(0x9b9080, 1),
  pillow: std(0xb9b0a0, 1),
  paper: new THREE.MeshStandardMaterial({ map: TEX.paper, roughness: 1 }),
  chrome: std(0x9aa0a8, 0.22, 1),
  porcelain: std(0xd8d2c6, 0.22),
  tile: new THREE.MeshStandardMaterial({ map: TEX.tile, roughness: 0.35 }),
  metalDark: std(0x222428, 0.5, 0.6),
  coat: std(0x1e2019, 0.9),
  phone: std(0x1d1b1a, 0.45),
  brass: std(0x8a6a3a, 0.35, 0.8),
  battery: std(0x3a3f4a, 0.4, 0.6),
  shade: new THREE.MeshStandardMaterial({ color: 0xd9c49a, roughness: 1, side: THREE.DoubleSide, emissive: 0xffc27a, emissiveIntensity: 0 }),
  fluoro: new THREE.MeshStandardMaterial({ color: 0xfff8e8, emissive: 0xfff1d0, emissiveIntensity: 1.2 }),
  drumGlow: new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffd9a0, emissiveIntensity: 1.6 }),
  glass: new THREE.MeshBasicMaterial({ map: TEX.night }),
  curtain: new THREE.MeshStandardMaterial({ map: TEX.curtain, side: THREE.DoubleSide, roughness: 1 }),
  door: new THREE.MeshStandardMaterial({ map: TEX.door, roughness: 0.8 }),
  rug: new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 1 }),
  photo: new THREE.MeshStandardMaterial({ map: TEX.photo, roughness: 0.6 }),
  mirror: std(0x0b0b10, 0.06, 1),
  stalker: std(0x070608, 0.85),
  stalkerSkin: std(0x17151a, 0.7),
  dust: new THREE.MeshBasicMaterial({ color: 0xddc8a8, transparent: true, opacity: 0.18 }),
};

/* ---------- помощники ---------- */
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const rb = (w, h, d, r = 0.03) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
const grp = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };

/* ---------- кровать (изголовье у +z, длинная ось по x) ---------- */
export function bedModel() {
  const g = grp();
  mesh(rb(2.0, 0.34, 1.8, 0.04), MAT.wood, 0, 0.17, 0, g);            // рама
  mesh(rb(2.0, 1.15, 0.14, 0.05), MAT.wood, 0, 0.57, 0.9, g);         // изголовье
  mesh(rb(2.0, 0.45, 0.08, 0.04), MAT.wood, 0, 0.22, -0.9, g);        // изножье
  mesh(rb(1.9, 0.22, 1.62, 0.06), MAT.sheet, 0, 0.45, 0, g);          // матрас
  // одеяло со складками: верхние вершины смещаются шумом
  const bl = new THREE.BoxGeometry(1.86, 0.1, 1.2, 30, 1, 18);
  const p = bl.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y > 0) p.setY(i, y + 0.02 * Math.sin(x * 9 + z * 4) + 0.015 * Math.cos(z * 11 - x * 3));
  }
  bl.computeVertexNormals();
  mesh(bl, MAT.blanket, 0, 0.66, -0.18, g);
  mesh(rb(0.5, 0.14, 0.34, 0.06), MAT.pillow, -0.5, 0.67, 0.6, g);
  mesh(rb(0.5, 0.14, 0.34, 0.06), MAT.pillow, 0.1, 0.67, 0.6, g);
  for (const [x, z] of [[-0.9, 0.7], [0.9, 0.7], [-0.9, -0.7], [0.9, -0.7]]) {
    mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 8), MAT.wood, x, 0.05, z, g);
  }
  return g;
}

/* ---------- тумбочка ---------- */
export function nightstandModel() {
  const g = grp();
  mesh(rb(0.5, 0.6, 0.5, 0.03), MAT.woodDark, 0, 0.3, 0, g);
  mesh(rb(0.42, 0.001, 0.42, 0.0), MAT.trim, 0, 0.601, 0, g);
  mesh(new THREE.SphereGeometry(0.018, 10, 8), MAT.brass, 0, 0.44, 0.26, g);
  mesh(new THREE.SphereGeometry(0.018, 10, 8), MAT.brass, 0, 0.3, 0.26, g);
  return g;
}

/* ---------- настольная лампа (выключена; свет включает игра) ---------- */
export function tableLampModel() {
  const g = grp();
  mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.03, 20), MAT.brass, 0, 0.615, 0, g);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), MAT.brass, 0, 0.75, 0, g);
  const shade = mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.2, 24, 1, true), MAT.shade, 0, 0.9, 0, g);
  g.userData.shade = shade;
  return g;
}

/* ---------- телефон с проводом (стационарный) ---------- */
export function corded_phoneModel() {
  const g = grp();
  mesh(rb(0.24, 0.06, 0.2, 0.02), MAT.phone, 0, 0.03, 0, g);
  mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.008, 20), MAT.metalDark, 0, 0.064, 0.02, g);   // диск
  for (const x of [-0.07, 0.07]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 10), MAT.phone, x, 0.085, -0.04, g);
  const hand = mesh(new THREE.CapsuleGeometry(0.024, 0.18, 4, 10), MAT.phone, 0, 0.13, -0.04, g);
  hand.rotation.z = Math.PI / 2;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.11, 0.13, -0.04), new THREE.Vector3(0.15, 0.1, -0.02),
    new THREE.Vector3(0.14, 0.06, 0.04), new THREE.Vector3(0.1, 0.035, 0.1),
    new THREE.Vector3(0.0, 0.04, 0.14), new THREE.Vector3(-0.06, 0.03, 0.09),
  ]);
  mesh(new THREE.TubeGeometry(curve, 40, 0.0045, 6), MAT.phone, 0, 0, 0, g);
  return g;
}

/* ---------- записка (лежит на тумбочке) ---------- */
export function noteModel() {
  const g = grp();
  const m = mesh(new THREE.PlaneGeometry(0.14, 0.1), MAT.paper, 0, 0.003, 0, g);
  m.rotation.x = -Math.PI / 2; m.rotation.z = 0.3; m.castShadow = false;
  return g;
}

/* ---------- диван (спинка у -x, длинная ось по z) ---------- */
export function sofaModel() {
  const g = grp();
  mesh(rb(1.1, 0.32, 2.2, 0.08), MAT.fabricSofa, 0, 0.26, 0, g);       // основание
  mesh(rb(0.28, 0.68, 2.2, 0.1), MAT.fabricSofa, -0.41, 0.76, 0, g);   // спинка
  for (const z of [-1.0, 1.0]) mesh(rb(1.1, 0.3, 0.26, 0.12), MAT.fabricSofa, 0, 0.56, z, g); // подлокотники
  mesh(rb(0.7, 0.14, 0.96, 0.06), MAT.fabricSofa, 0.14, 0.49, -0.5, g);  // сиденья
  mesh(rb(0.7, 0.14, 0.96, 0.06), MAT.fabricSofa, 0.14, 0.49, 0.5, g);
  mesh(rb(0.22, 0.46, 0.9, 0.1), MAT.fabricSofa, -0.22, 0.8, -0.5, g);   // подушки спинки
  mesh(rb(0.22, 0.46, 0.9, 0.1), MAT.fabricSofa, -0.22, 0.8, 0.5, g);
  return g;
}

/* ---------- ванна (длинная ось по x, у задней стены) ---------- */
export function bathtubModel() {
  const g = grp();
  mesh(rb(1.6, 0.56, 0.7, 0.12), MAT.porcelain, 0, 0.28, 0, g);
  mesh(rb(1.45, 0.02, 0.56, 0.01), MAT.trim, 0, 0.555, 0.02, g);      // тёмная чаша внутри
  const faucet = grp(0.66, 0.56, -0.18); g.add(faucet);
  mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.18, 10), MAT.chrome, 0, 0.09, 0, faucet);
  const spout = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 10), MAT.chrome, 0, 0.16, 0.07, faucet);
  spout.rotation.x = Math.PI / 2;
  return g;
}

/* ---------- раковина на пьедестале ---------- */
export function sinkModel() {
  const g = grp();
  mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.72, 16), MAT.porcelain, 0, 0.36, 0, g);
  mesh(rb(0.5, 0.1, 0.42, 0.05), MAT.porcelain, 0, 0.82, 0, g);
  mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.04, 20), MAT.trim, 0, 0.9, 0, g); // чаша
  const tap = grp(0, 0.86, -0.17); g.add(tap);
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 10), MAT.chrome, 0, 0.06, 0, tap);
  const sp = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), MAT.chrome, 0, 0.12, 0.05, tap);
  sp.rotation.x = Math.PI / 2;
  return g;
}

/* ---------- унитаз (спинка бачка у +z) ---------- */
export function toiletModel() {
  const g = grp();
  mesh(rb(0.36, 0.36, 0.2, 0.05), MAT.porcelain, 0, 0.6, 0.2, g);      // бачок
  mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.4, 20), MAT.porcelain, 0, 0.2, -0.04, g);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 8, 24), MAT.porcelain);
  seat.rotation.x = Math.PI / 2; seat.position.set(0, 0.42, -0.04); seat.scale.set(1, 1.1, 1); g.add(seat);
  return g;
}

/* ---------- рамка зеркала (зеркало — тонкая плоскость на x=3.11) ---------- */
export function mirrorFrameModel(w, h) {
  const g = grp();
  const t = 0.05;
  mesh(rb(0.03, t, w + 0.1, 0.01), MAT.metalDark, 0, h / 2 + t / 2, 0, g);
  mesh(rb(0.03, t, w + 0.1, 0.01), MAT.metalDark, 0, -h / 2 - t / 2, 0, g);
  mesh(rb(0.03, h, t, 0.01), MAT.metalDark, 0, 0, w / 2 + t / 2, g);
  mesh(rb(0.03, h, t, 0.01), MAT.metalDark, 0, 0, -w / 2 - t / 2, g);
  return g;
}

/* ---------- пальто на крючке (висит на стене x=-1.2, лицом к +x) ---------- */
export function coatModel() {
  const g = grp();
  mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 6), MAT.chrome, 0, 1.8, 0, g);     // крючок
  mesh(rb(0.07, 0.8, 0.42, 0.04), MAT.coat, 0.04, 1.3, 0, g);                             // полы
  mesh(rb(0.08, 0.14, 0.46, 0.04), MAT.coat, 0.04, 1.66, 0, g);                           // плечи
  return g;
}

/* ---------- ламповый плафон над кроватью (потолочный) ---------- */
export function ceilingDrumModel() {
  const g = grp();
  mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.12, 24, 1, true), MAT.shade, 0, -0.06, 0, g);
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 24), MAT.drumGlow, 0, -0.12, 0, g);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), MAT.metalDark, 0, 0.1, 0, g);
  return g;
}

/* ---------- люминесцентный светильник ---------- */
export function fluoroModel() {
  const g = grp();
  mesh(rb(0.56, 0.05, 0.16, 0.02), MAT.metalDark, 0, 0, 0, g);
  mesh(new THREE.BoxGeometry(0.5, 0.02, 0.1), MAT.fluoro, 0, -0.03, 0, g).castShadow = false;
  return g;
}

/* ---------- окно с ночным небом и шторами (стена x=-3.1, лицом к +x) ---------- */
export function windowModel() {
  const g = grp();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.3), MAT.glass);
  glass.rotation.y = Math.PI / 2; glass.position.set(0.02, 0, 0); g.add(glass);
  const fr = 0.05, W = 1.2, Hh = 1.3;
  mesh(rb(0.05, fr, W + 0.1, 0.01), MAT.trim, 0, Hh / 2, 0, g);
  mesh(rb(0.05, fr, W + 0.1, 0.01), MAT.trim, 0, -Hh / 2, 0, g);
  mesh(rb(0.05, Hh, fr, 0.01), MAT.trim, 0, 0, W / 2, g);
  mesh(rb(0.05, Hh, fr, 0.01), MAT.trim, 0, 0, -W / 2, g);
  mesh(new THREE.BoxGeometry(0.02, Hh, 0.03), MAT.trim, 0.02, 0, 0, g); // импост
  for (const z of [-W / 2 - 0.22, W / 2 + 0.22]) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.5, 1, 1), MAT.curtain);
    c.rotation.y = Math.PI / 2; c.position.set(0.12, 0.05, z); c.castShadow = false; g.add(c);
  }
  return g;
}

/* ---------- ковёр (плоскость на полу, вращение задано снаружи) ---------- */
export function rugModel(w, d) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.rug);
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  const g = grp(); g.add(m); m.position.y = 0.006;
  return g;
}

/* ---------- батарейка (лежит, ось вдоль x) ---------- */
export function batteryModel() {
  const g = grp();
  const b = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 12), MAT.battery, 0, 0.022, 0, g);
  b.rotation.z = Math.PI / 2;
  const cap = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.004, 10), MAT.trim, 0.052, 0.022, 0, g);
  cap.rotation.z = Math.PI / 2;
  return g;
}

/* ---------- фото в рамке (плоскость с фотографией; рамка рисуется тонкими полосами) ---------- */
export function photoFrameModel(w, h) {
  const g = grp();
  mesh(rb(0.025, h + 0.05, w + 0.05, 0.01), MAT.trim, 0, 0, 0, g);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MAT.photo);
  p.rotation.y = Math.PI / 2; p.position.x = 0.014; g.add(p);
  return g;
}

/* ---------- дверь: панель, ручка (ось панели вдоль x от 0 до w) ---------- */
export function doorModel(w = 1.2, h = 2.2) {
  const g = grp();
  mesh(rb(w, h, 0.06, 0.01), MAT.door, w / 2, h / 2, 0, g);
  mesh(rb(0.12, 0.025, 0.04, 0.01), MAT.brass, w - 0.12, 1.0, 0.05, g);   // ручка
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14), MAT.brass, w - 0.12, 1.0, 0.03, g).rotation.x = Math.PI / 2;
  return g;
}

/* ---------- плинтус: короткий брусок вдоль стены ---------- */
export function plinth(len, axis = 'x') {
  const g = grp();
  const geo = axis === 'x' ? new THREE.BoxGeometry(len, 0.12, 0.025) : new THREE.BoxGeometry(0.025, 0.12, len);
  mesh(geo, MAT.trim, 0, 0.06, 0, g);
  return g;
}

/* ---------- пыль: одна общая геометрия на весь эпизод ---------- */
export const DUST_GEO = new THREE.SphereGeometry(0.006, 3, 2);

/* ---------- фигура: высокий человек в длинном пальто, без лица ---------- */
// Иерархия: hips (y≈1.02) → chest (y 0.8) → head/arms; ноги — hip → knee → ankle.
// Каждый сегмент висит от точки подвеса: pivot.rotation.x качает весь сегмент.
function hang(r, len, mat) {
  const pivot = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
  m.position.y = -(len / 2 + r);
  m.castShadow = true;
  pivot.add(m);
  return pivot;
}
function place(parent, child, x, y, z = 0) { child.position.set(x, y, z); parent.add(child); return child; }

export function stalkerModel() {
  const root = grp();
  const hips = grp(0, 1.02, 0); root.add(hips);
  mesh(new THREE.CapsuleGeometry(0.17, 0.1, 4, 10), MAT.stalker, 0, 0.02, 0, hips);

  // ноги
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = place(hips, hang(0.085, 0.36, MAT.stalker), s * 0.11, 0, 0);
    const knee = place(hip, hang(0.07, 0.36, MAT.stalker), 0, -0.53, 0);
    const foot = mesh(new THREE.SphereGeometry(1, 12, 8), MAT.stalkerSkin, 0, -0.5 - 0.04, 0.05, knee);
    foot.scale.set(0.07, 0.04, 0.15);
    legs.push({ hip, knee });
  }

  // торс: длинное пальто, шире к полу
  const chest = grp(0, 0.8, 0); hips.add(chest);
  mesh(new THREE.CylinderGeometry(0.19, 0.27, 0.95, 16), MAT.stalker, 0, -0.35, 0, chest); // торс едет вместе с сутулостью
  mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 10), MAT.stalkerSkin, 0, 0.14, 0, chest);

  // голова: вытянутая, без черт
  const head = grp(0, 0.2, 0.0); chest.add(head);
  const hd = mesh(new THREE.SphereGeometry(1, 20, 14), MAT.stalkerSkin, 0, 0.16, 0, head);
  hd.scale.set(0.11, 0.15, 0.1);

  // руки: плечо → локоть → кисть
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = place(chest, hang(0.05, 0.3, MAT.stalker), s * 0.23, -0.06, 0);
    const elbow = place(shoulder, hang(0.045, 0.3, MAT.stalker), 0, -0.6, 0);
    const hand = mesh(new THREE.SphereGeometry(1, 10, 8), MAT.stalkerSkin, 0, -0.44, 0, elbow);
    hand.scale.set(0.045, 0.1, 0.03);
    arms.push({ shoulder, elbow });
  }
  return { group: root, hips, chest, head, legs, arms, phase: 0 };
}

// Анимация: walk — 0..1 (сила шага), lit — при свете поза замирает и голова поворачивается к свету.
export function animateStalker(st, dt, t, walk, lit) {
  st.phase += dt * walk * 6.5;
  const s = Math.sin(st.phase);
  const a = walk * (lit ? 0.5 : 1);
  st.legs[0].hip.rotation.x = s * 0.5 * a;
  st.legs[1].hip.rotation.x = -s * 0.5 * a;
  st.legs[0].knee.rotation.x = Math.max(0, -s) * 0.6 * a;
  st.legs[1].knee.rotation.x = Math.max(0, s) * 0.6 * a;
  st.arms[0].shoulder.rotation.x = -s * 0.22 * a + Math.sin(t * 0.7) * 0.04;
  st.arms[1].shoulder.rotation.x = s * 0.22 * a + Math.cos(t * 0.6) * 0.04;
  st.arms[0].elbow.rotation.x = -0.12;
  st.arms[1].elbow.rotation.x = -0.12;
  st.hips.position.y = 1.02 + Math.abs(Math.cos(st.phase)) * 0.02 * a;
  st.chest.rotation.x = 0.1 + 0.03 * a;                 // сутулится
  st.head.rotation.x = 0.1 + Math.sin(t * 0.5) * 0.03;
  st.head.rotation.z = Math.sin(t * 0.33) * 0.08;
}
