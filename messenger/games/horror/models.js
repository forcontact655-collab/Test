// Модели мира: интерьер, экстерьер, улица. Всё собирается кодом, без внешних файлов.
// Соглашения: origin — у основания объекта; ось +z — «лицо» (если не сказано иначе).
import * as THREE from './vendor/three.module.js';
import { RoundedBoxGeometry } from './vendor/addons/RoundedBoxGeometry.js';
import { MAT, carPaint } from './materials.js';

export const G = (x = 0, y = 0, z = 0, p = null) => { const g = new THREE.Group(); g.position.set(x, y, z); if (p) p.add(g); return g; };

// Коробка с UV в метрах (unit), чтобы текстуры не растягивались на длинных стенах.
function boxUV(geo, w, h, d, unit) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++) {
    const [a, b] = dims[Math.floor(i / 4)];
    uv.setXY(i, uv.getX(i) * a / unit, uv.getY(i) * b / unit);
  }
  uv.needsUpdate = true;
  return geo;
}
export function bx(w, h, d, m, x = 0, y = 0, z = 0, p = null, unit = 1.5) {
  const mesh = new THREE.Mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, unit), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (p) p.add(mesh);
  return mesh;
}
export function rb(w, h, d, m, x = 0, y = 0, z = 0, p = null, r = 0.03) {
  const geo = new RoundedBoxGeometry(w, h, d, 4, Math.max(0.001, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002)));
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (p) p.add(mesh);
  return mesh;
}
export function cy(rt, rbot, h, m, x = 0, y = 0, z = 0, p = null, seg = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rbot, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (p) p.add(mesh);
  return mesh;
}
export function sp(r, m, x = 0, y = 0, z = 0, p = null, sx = 1, sy = 1, sz = 1, seg = 14) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), m);
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (p) p.add(mesh);
  return mesh;
}
const rnd = (a, b) => a + Math.random() * (b - a);

/* ================= ДВЕРИ И ОКНА ================= */

// Дверь: петля в x=0, полотно уходит в +x, высота h. Лицо +z.
export function doorUnit(w, h, m = MAT.door) {
  const g = G();
  bx(w, h, 0.05, m, w / 2, h / 2, 0, g);
  for (const [py, ph] of [[h * 0.56, h * 0.36], [h * 0.12, h * 0.36]]) {
    for (const zz of [0.03, -0.03]) {
      bx(w - 0.3, ph, 0.02, m, w / 2, py + ph / 2, zz, g);
    }
  }
  bx(0.06, 0.04, 0.12, MAT.brass, w - 0.12, h * 0.48, 0.07, g);
  cy(0.02, 0.02, 0.12, MAT.brass, w - 0.12, h * 0.48, 0.03, g).rotation.x = Math.PI / 2;
  return g;
}

// Окно: центр в (0,0,0), стекло в плоскости XY, лицо +z.
export function windowUnit(w, h) {
  const g = G();
  const fr = 0.07, d = 0.12;
  bx(w, fr, d, MAT.paintWhite, 0, h / 2 - fr / 2, 0, g);
  bx(w, fr, d, MAT.paintWhite, 0, -h / 2 + fr / 2, 0, g);
  bx(fr, h - 2 * fr, d, MAT.paintWhite, w / 2 - fr / 2, 0, 0, g);
  bx(fr, h - 2 * fr, d, MAT.paintWhite, -w / 2 + fr / 2, 0, 0, g);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * fr, h - 2 * fr), MAT.glass);
  glass.position.z = 0; g.add(glass);
  bx(0.04, h - 2 * fr, 0.04, MAT.paintWhite, 0, 0, 0.01, g);
  bx(w - 2 * fr, 0.04, 0.04, MAT.paintWhite, 0, 0, 0.01, g);
  // наличник и подоконник
  bx(w + 0.16, 0.05, 0.18, MAT.paintCream, 0, h / 2 + 0.07, 0.03, g);
  bx(0.06, h + 0.1, 0.16, MAT.paintCream, w / 2 + 0.1, 0, 0.03, g);
  bx(0.06, h + 0.1, 0.16, MAT.paintCream, -w / 2 - 0.1, 0, 0.03, g);
  bx(w + 0.3, 0.05, 0.3, MAT.paintCream, 0, -h / 2 - 0.02, 0.1, g);
  return g;
}

// Ставни по бокам окна: слоты с наклоном.
export function shutterPair(w, h) {
  const g = G();
  for (const side of [-1, 1]) {
    const x = side * (w / 2 + 0.22);
    bx(0.42, h, 0.04, MAT.shutterGreen, x, 0, 0.1, g);
    for (let i = 0; i < 9; i++) {
      const s = bx(0.36, 0.03, 0.03, MAT.shutterGreen, x, -h / 2 + 0.1 + i * (h - 0.2) / 8, 0.14, g);
      s.rotation.x = -0.5;
    }
  }
  return g;
}

// Потолочный плафон: origin у потолка, плафон висит на 0.1 м.
export function ceilingDrum(r = 0.22) {
  const g = G();
  cy(0.03, 0.03, 0.2, MAT.darkMetal, 0, -0.05, 0, g);
  cy(r, r + 0.05, 0.12, MAT.lampShade, 0, -0.16, 0, g, 28);
  cy(r - 0.02, r - 0.02, 0.01, MAT.bulb, 0, -0.22, 0, g, 28);
  return g;
}

// Люстра-подвес: шнур и конический абажур; свет — точка внутри.
export function pendant(len = 0.7) {
  const g = G();
  cy(0.006, 0.006, len, MAT.darkMetal, 0, -len / 2, 0, g, 6);
  cy(0.08, 0.26, 0.24, MAT.lampShade, 0, -len - 0.12, 0, g, 28);
  sp(0.07, MAT.bulb, 0, -len - 0.14, 0, g);
  return g;
}

// Бра на стене (лицом к +z): плафон и лампочка.
export function sconce() {
  const g = G();
  bx(0.1, 0.22, 0.08, MAT.brass, 0, 0, 0.04, g);
  cy(0.06, 0.09, 0.14, MAT.lampShade, 0, 0.16, 0.08, g, 16);
  sp(0.03, MAT.bulb, 0, 0.15, 0.08, g);
  return g;
}

/* ================= ИНТЕРЬЕР ================= */

export function sofa() {
  const g = G();
  rb(1.1, 0.34, 2.2, MAT.fabric, 0, 0.26, 0, g);
  rb(0.28, 0.7, 2.2, MAT.fabric, -0.42, 0.78, 0, g, 0.1);
  for (const z of [-1.0, 1.0]) rb(1.1, 0.32, 0.28, MAT.fabric, 0, 0.6, z, g, 0.13);
  for (const z of [-0.5, 0.5]) {
    rb(0.7, 0.14, 0.96, MAT.fabric, 0.14, 0.5, z, g, 0.06);
    rb(0.22, 0.48, 0.9, MAT.fabric, -0.22, 0.82, z, g, 0.1);
  }
  for (const [x, z] of [[0.4, -0.95], [0.4, 0.95], [-0.45, -0.95], [-0.45, 0.95]]) cy(0.03, 0.02, 0.12, MAT.walnut, x, 0.06, z, g, 8);
  return g;
}

export function coffeeTable(w = 1.2, d = 0.6) {
  const g = G();
  rb(w, 0.05, d, MAT.walnut, 0, 0.42, 0, g);
  rb(w - 0.1, 0.035, d - 0.1, MAT.walnut, 0, 0.14, 0, g);
  for (const [x, z] of [[w / 2 - 0.08, d / 2 - 0.08], [-w / 2 + 0.08, d / 2 - 0.08], [w / 2 - 0.08, -d / 2 + 0.08], [-w / 2 + 0.08, -d / 2 + 0.08]]) cy(0.02, 0.015, 0.4, MAT.walnut, x, 0.2, z, g, 10);
  return g;
}

export function tvStand(w = 1.6) {
  const g = G();
  rb(w, 0.5, 0.42, MAT.walnut, 0, 0.3, 0, g);
  for (let i = 0; i < 3; i++) bx(0.02, 0.4, 0.02, MAT.brass, -w / 2 + 0.3 + i * (w - 0.6) / 2, 0.3, 0.215, g);
  const tv = rb(w * 0.82, 0.62, 0.05, MAT.tvScreen, 0, 0.85, 0, g, 0.02);
  void tv;
  bx(0.08, 0.2, 0.05, MAT.darkMetal, 0, 0.56, 0, g);
  return g;
}

export function bookshelf(w = 1.2, h = 2.0, d = 0.35) {
  const g = G();
  const shelfMat = MAT.walnut;
  bx(0.03, h, d, shelfMat, -w / 2 + 0.015, h / 2, 0, g);
  bx(0.03, h, d, shelfMat, w / 2 - 0.015, h / 2, 0, g);
  bx(w, 0.04, d, shelfMat, 0, h, 0, g);
  bx(w, 0.04, d, shelfMat, 0, 0, 0, g);
  const cols = [0x6b2b25, 0x2d4c5b, 0x8a6a2f, 0x3e3a2e, 0x5a2e46, 0x2f3d2a, 0xa39070];
  for (let s = 1; s < 5; s++) {
    const y = s * h / 5;
    bx(w, 0.03, d, shelfMat, 0, y, 0, g);
    let x = -w / 2 + 0.06;
    while (x < w / 2 - 0.1) {
      const bw = rnd(0.025, 0.05), bh = rnd(0.2, 0.32);
      if (Math.random() < 0.1) { x += 0.12; continue; }
      const col = cols[Math.floor(Math.random() * cols.length)];
      bx(bw, bh, d * 0.7, new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 }), x + bw / 2, y + bh / 2 + 0.015, -0.02, g);
      x += bw + 0.005;
    }
  }
  return g;
}

export function diningTable(w = 1.4, d = 0.85) {
  const g = G();
  rb(w, 0.05, d, MAT.oak, 0, 0.75, 0, g);
  for (const [x, z] of [[w / 2 - 0.1, d / 2 - 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, -d / 2 + 0.1]]) cy(0.03, 0.025, 0.72, MAT.oak, x, 0.36, z, g, 12);
  bx(w - 0.2, 0.1, 0.03, MAT.oak, 0, 0.66, d / 2 - 0.1, g);
  bx(w - 0.2, 0.1, 0.03, MAT.oak, 0, 0.66, -d / 2 + 0.1, g);
  return g;
}

export function chair() {
  const g = G();
  rb(0.44, 0.05, 0.44, MAT.oak, 0, 0.45, 0, g);
  for (const [x, z] of [[0.19, 0.19], [-0.19, 0.19], [0.19, -0.19], [-0.19, -0.19]]) cy(0.017, 0.015, 0.45, MAT.oak, x, 0.225, z, g, 10);
  for (const x of [0.19, -0.19]) cy(0.015, 0.015, 0.5, MAT.oak, x, 0.7, -0.2, g, 8);
  bx(0.4, 0.04, 0.03, MAT.oak, 0, 0.9, -0.2, g);
  bx(0.4, 0.04, 0.03, MAT.oak, 0, 0.72, -0.2, g);
  return g;
}

// Кровать: длинная ось x, изголовье у +z.
export function bed(w = 2.0, d = 1.8) {
  const g = G();
  rb(w, 0.34, d, MAT.walnut, 0, 0.17, 0, g, 0.04);
  rb(w, 1.15, 0.14, MAT.walnut, 0, 0.57, d / 2 - 0.07, g, 0.05);
  rb(w, 0.45, 0.08, MAT.walnut, 0, 0.22, -d / 2 + 0.04, g, 0.04);
  rb(w - 0.1, 0.22, d - 0.18, MAT.fabric, 0, 0.45, 0, g, 0.06);
  const bl = new THREE.BoxGeometry(w - 0.14, 0.1, d * 0.66, 30, 1, 18);
  const p = bl.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y > 0) p.setY(i, y + 0.02 * Math.sin(x * 9 + z * 4) + 0.015 * Math.cos(z * 11 - x * 3));
  }
  bl.computeVertexNormals();
  const bm = new THREE.Mesh(bl, new THREE.MeshStandardMaterial({ color: 0x5a3a3a, roughness: 1 }));
  bm.position.set(0, 0.66, -0.2); bm.castShadow = true; g.add(bm);
  rb(0.5, 0.14, 0.34, new THREE.MeshStandardMaterial({ color: 0xc7bca8, roughness: 1 }), -0.42, 0.67, d / 2 - 0.38, g, 0.06);
  rb(0.5, 0.14, 0.34, new THREE.MeshStandardMaterial({ color: 0xc7bca8, roughness: 1 }), 0.1, 0.67, d / 2 - 0.38, g, 0.06);
  return g;
}

export function nightstand() {
  const g = G();
  rb(0.5, 0.58, 0.44, MAT.walnut, 0, 0.32, 0, g, 0.03);
  for (const y of [0.45, 0.25]) { bx(0.4, 0.14, 0.02, MAT.walnut, 0, y, 0.225, g); cy(0.012, 0.012, 0.03, MAT.brass, 0, y, 0.245, g, 8).rotation.x = Math.PI / 2; }
  return g;
}

export function wardrobe(w = 1.3, h = 2.2, d = 0.6) {
  const g = G();
  rb(w, h, d, MAT.walnut, 0, h / 2, 0, g, 0.02);
  rb(w + 0.06, 0.07, d + 0.06, MAT.walnut, 0, h + 0.035, 0, g, 0.02);
  for (const sx of [-1, 1]) {
    bx(w / 2 - 0.05, h - 0.2, 0.03, MAT.leather, sx * (w / 4), h / 2, d / 2 + 0.005, g);
    cy(0.012, 0.012, 0.16, MAT.brass, sx * 0.05, h * 0.5, d / 2 + 0.05, g, 8);
  }
  return g;
}

export function desk(w = 1.2, d = 0.6) {
  const g = G();
  rb(w, 0.04, d, MAT.oak, 0, 0.74, 0, g, 0.01);
  for (const sx of [-1, 1]) rb(0.04, 0.72, d - 0.06, MAT.darkMetal, sx * (w / 2 - 0.1), 0.36, 0, g, 0.01);
  rb(0.36, 0.6, d - 0.1, MAT.oak, w / 2 - 0.22, 0.32, 0, g, 0.02);
  return g;
}

export function dresser(w = 1.2, d = 0.5, h = 0.9) {
  const g = G();
  rb(w, h, d, MAT.oak, 0, h / 2, 0, g, 0.02);
  for (let i = 0; i < 3; i++) {
    bx(w - 0.08, h / 3 - 0.06, 0.02, MAT.oak, 0, h / 6 + i * h / 3, d / 2 + 0.01, g);
    cy(0.012, 0.012, 0.05, MAT.brass, -0.2, h / 6 + i * h / 3, d / 2 + 0.04, g, 8).rotation.x = Math.PI / 2;
    cy(0.012, 0.012, 0.05, MAT.brass, 0.2, h / 6 + i * h / 3, d / 2 + 0.04, g, 8).rotation.x = Math.PI / 2;
  }
  return g;
}

// Кухонный модуль: по оси x, фронт +z, столешка на 0.9 м.
export function kitchenBase(len) {
  const g = G();
  bx(len, 0.1, 0.56, MAT.darkMetal, 0, 0.05, 0, g);
  bx(len, 0.78, 0.6, MAT.oak, 0, 0.5, 0, g, 1.2);
  const n = Math.max(1, Math.round(len / 0.5));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * len / n;
    bx(len / n - 0.03, 0.74, 0.02, MAT.oak, x, 0.5, 0.31, g);
    bx(0.02, 0.1, 0.02, MAT.brass, x + (i % 2 ? 0.1 : -0.1), 0.72, 0.335, g);
  }
  rb(len + 0.04, 0.04, 0.64, MAT.stone, 0, 0.9, 0, g, 0.01);
  return g;
}

export function kitchenWall(len) {
  const g = G();
  bx(len, 0.7, 0.34, MAT.oak, 0, 0, 0, g, 1.2);
  const n = Math.max(1, Math.round(len / 0.45));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * len / n;
    bx(len / n - 0.03, 0.66, 0.02, MAT.oak, x, 0, 0.175, g);
    bx(0.02, 0.08, 0.02, MAT.brass, x + (i % 2 ? 0.08 : -0.08), -0.28, 0.19, g);
  }
  return g;
}

export function fridge() {
  const g = G();
  rb(0.72, 1.85, 0.7, MAT.steel, 0, 0.93, 0, g, 0.03);
  bx(0.72, 0.01, 0.01, MAT.darkMetal, 0, 1.2, 0.351, g);
  bx(0.03, 0.5, 0.04, MAT.chrome, 0.28, 1.55, 0.37, g);
  bx(0.03, 0.4, 0.04, MAT.chrome, 0.28, 0.6, 0.37, g);
  return g;
}

export function stove() {
  const g = G();
  rb(0.76, 0.9, 0.62, MAT.steel, 0, 0.45, 0, g, 0.02);
  rb(0.76, 0.02, 0.6, MAT.rim, 0, 0.91, 0, g, 0.005);
  bx(0.6, 0.4, 0.02, MAT.tvScreen, 0, 0.42, 0.315, g);
  for (const [x, z] of [[-0.18, 0.14], [0.18, 0.14], [-0.18, -0.12], [0.18, -0.12]]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 8, 24), MAT.darkMetal);
    t.rotation.x = Math.PI / 2; t.position.set(x, 0.925, z); g.add(t);
  }
  for (let i = 0; i < 4; i++) cy(0.02, 0.02, 0.03, MAT.darkMetal, -0.25 + i * 0.165, 0.78, 0.33, g, 12).rotation.x = Math.PI / 2;
  return g;
}

export function sinkUnit() {
  const g = G();
  cy(0.2, 0.18, 0.02, MAT.steel, 0, 0.93, 0, g, 28).scale.set(1, 1, 0.8);
  cy(0.19, 0.17, 0.05, MAT.steel, 0, 0.91, 0, g, 28).scale.set(1, 1, 0.8);
  const tap = G(0, 0.92, -0.25, g);
  cy(0.012, 0.012, 0.3, MAT.chrome, 0, 0.15, 0, tap, 10);
  const sp1 = cy(0.01, 0.01, 0.2, MAT.chrome, 0, 0.3, 0.1, tap, 8); sp1.rotation.x = Math.PI / 2;
  return g;
}

export function toilet() {
  const g = G();
  rb(0.38, 0.4, 0.2, MAT.porcelain, 0, 0.62, 0.21, g, 0.05);
  cy(0.2, 0.17, 0.36, MAT.porcelain, 0, 0.22, -0.02, g, 28);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 10, 30), MAT.porcelain);
  ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.42, -0.02); ring.scale.set(1, 1.1, 1); g.add(ring);
  cy(0.02, 0.02, 0.02, MAT.chrome, 0, 0.8, 0.22, g, 8);
  return g;
}

// Ванна: длинная ось x, у задней стены z−.
export function bathtub() {
  const g = G();
  rb(1.7, 0.56, 0.74, MAT.porcelain, 0, 0.28, 0, g, 0.12);
  rb(1.52, 0.04, 0.56, MAT.tileDark, 0, 0.5, 0.01, g, 0.02);
  const f = G(0.7, 0.56, -0.22, g);
  cy(0.02, 0.025, 0.2, MAT.chrome, 0, 0.1, 0, f, 12);
  const s = cy(0.014, 0.014, 0.16, MAT.chrome, 0, 0.2, 0.07, f, 10); s.rotation.x = Math.PI / 2;
  return g;
}

export function radiator(len = 0.9) {
  const g = G();
  const n = Math.max(6, Math.round(len / 0.08));
  for (let i = 0; i < n; i++) bx(0.04, 0.6, 0.12, MAT.paintWhite, -len / 2 + i * len / (n - 1), 0.35, 0.08, g);
  bx(len, 0.05, 0.14, MAT.paintWhite, 0, 0.66, 0.08, g);
  bx(len, 0.05, 0.14, MAT.paintWhite, 0, 0.06, 0.08, g);
  return g;
}

export function plant(h = 1) {
  const g = G();
  cy(0.18, 0.13, 0.32, MAT.porcelain, 0, 0.16, 0, g, 20);
  cy(0.15, 0.15, 0.02, MAT.bark, 0, 0.31, 0, g, 16);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = 0.08 + Math.random() * 0.12;
    sp(0.16 + Math.random() * 0.06, MAT.foliage, Math.cos(a) * r, 0.5 + h * 0.3 + Math.random() * h * 0.5, Math.sin(a) * r, g, 1, 0.6, 1, 8);
  }
  return g;
}

export function floorLamp() {
  const g = G();
  cy(0.18, 0.18, 0.03, MAT.darkMetal, 0, 0.015, 0, g, 24);
  cy(0.01, 0.01, 1.5, MAT.brass, 0, 0.8, 0, g, 8);
  cy(0.14, 0.2, 0.3, MAT.lampShade, 0, 1.55, 0, g, 24);
  sp(0.05, MAT.bulb, 0, 1.45, 0, g);
  return g;
}

export function rug(w, d, color = 0x7a3b30) {
  const g = G();
  const m = new THREE.MeshStandardMaterial({ map: MAT.carpet.map, color, roughness: 1 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  p.rotation.x = -Math.PI / 2; p.position.y = 0.008; p.receiveShadow = true; g.add(p);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, d - 0.12), new THREE.MeshStandardMaterial({ color: 0x3a1d18, roughness: 1 }));
  b.rotation.x = -Math.PI / 2; b.position.y = 0.009; g.add(b);
  return g;
}

export function mirror(w, h) {
  const g = G();
  bx(w + 0.08, h + 0.08, 0.03, MAT.walnut, 0, 0, 0, g);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MAT.glass);
  m.position.z = 0.02; g.add(m);
  return g;
}

export function coatRack() {
  const g = G();
  cy(0.02, 0.02, 1.75, MAT.oak, 0, 0.88, 0, g, 10);
  cy(0.2, 0.2, 0.03, MAT.oak, 0, 0.02, 0, g, 16);
  for (let i = 0; i < 5; i++) {
    const a = -1 + i * 0.5;
    const h = cy(0.012, 0.012, 0.14, MAT.oak, 0, 1.7, 0, g, 8);
    h.rotation.z = Math.PI / 2 * 0.7; h.rotation.y = a;
    h.position.x = Math.sin(a) * 0.12; h.position.z = Math.cos(a) * 0.12;
  }
  return g;
}

/* ================= ЭКСТЕРЬЕР ================= */

// Уличный фонарь: стойка по оси y, рожок в сторону +x (поворот задаёт мир).
// userData.bulb — локальная позиция лампы.
export function streetLamp() {
  const g = G();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.5, 20), MAT.darkMetal);
  base.position.y = 0.25; base.castShadow = true; g.add(base);
  cy(0.075, 0.1, 6.2, MAT.darkMetal, 0, 3.1, 0, g, 16);
  const arm = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 5.9, 0), new THREE.Vector3(0.5, 6.25, 0), new THREE.Vector3(1.2, 6.25, 0), new THREE.Vector3(1.6, 6.05, 0),
  ]), 24, 0.035, 10);
  const armM = new THREE.Mesh(arm, MAT.darkMetal); armM.castShadow = true; g.add(armM);
  // плафон — купол из лат-геометрии
  const prof = [];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; prof.push(new THREE.Vector2(0.01 + Math.sin(a) * 0.3, -Math.cos(a) * 0.14)); }
  const dome = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), MAT.darkMetal);
  dome.position.set(1.6, 6.02, 0); dome.castShadow = true; g.add(dome);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), MAT.streetLampGlow);
  lens.rotation.x = Math.PI / 2; lens.position.set(1.6, 5.95, 0); g.add(lens);
  g.userData.bulb = { x: 1.6, y: 5.9, z: 0 };
  // конус света (объёмный)
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 2.8, 5.9, 28, 1, true), MAT.cone);
  cone.position.set(1.6, 2.95, 0); cone.renderOrder = 2; g.add(cone);
  return g;
}

export function car(hex = 0x2a3a4a, len = 4.4) {
  const g = G();
  const paint = carPaint(hex);
  const s = len / 4.4;
  rb(4.4 * s, 0.62, 1.8, paint, 0, 0.55, 0, g, 0.18);
  rb(2.4 * s, 0.6, 1.6, paint, -0.25 * s, 1.14, 0, g, 0.22);
  // стёкла кабины
  for (const sx of [-1, 1]) {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.9 * s, 0.46), MAT.glass);
    gl.position.set(-0.25 * s, 1.14, sx * 0.812); if (sx < 0) gl.rotation.y = Math.PI; g.add(gl);
  }
  const wind = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.44), MAT.glass);
  wind.position.set(0.95 * s, 1.14, 0); wind.rotation.y = Math.PI / 2; wind.rotation.z = 0.45; g.add(wind);
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.44), MAT.glass);
  rear.position.set(-1.45 * s, 1.14, 0); rear.rotation.y = -Math.PI / 2; rear.rotation.z = -0.4; g.add(rear);
  // колёса
  for (const [x, z] of [[1.4, 0.92], [1.4, -0.92], [-1.4, 0.92], [-1.4, -0.92]]) {
    const tyre = cy(0.34, 0.34, 0.24, MAT.rubber, x * s, 0.34, z, g, 24); tyre.rotation.x = Math.PI / 2;
    const rim = cy(0.2, 0.2, 0.26, MAT.chrome, x * s, 0.34, z, g, 16); rim.rotation.x = Math.PI / 2;
  }
  // фары и фонари
  for (const z of [0.6, -0.6]) {
    bx(0.04, 0.14, 0.3, MAT.bulb, 2.2 * s + 0.01, 0.62, z, g);
    bx(0.04, 0.12, 0.3, new THREE.MeshStandardMaterial({ color: 0x801010, emissive: 0x600000, emissiveIntensity: 0.6 }), -2.2 * s - 0.01, 0.62, z, g);
  }
  bx(0.2, 0.12, 1.7, MAT.rim, 2.3 * s, 0.3, 0, g);
  return g;
}

export function tree(h = 6, r = 1.7) {
  const g = G();
  cy(0.12, 0.22, h * 0.55, MAT.bark, 0, h * 0.275, 0, g, 12);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05, rr = r * (0.4 + Math.random() * 0.4);
    sp(r * (0.6 + Math.random() * 0.3), MAT.foliage, Math.cos(a) * rr * 0.6, h * (0.6 + Math.random() * 0.25), Math.sin(a) * rr * 0.6, g, 1, 0.9, 1, 12);
  }
  sp(r * 0.8, MAT.foliage, 0, h * 0.85, 0, g, 1, 1, 1, 14);
  return g;
}

export function bush(r = 0.6) {
  const g = G();
  for (let i = 0; i < 4; i++) sp(r * (0.6 + Math.random() * 0.4), MAT.foliage, rnd(-r, r) * 0.6, r * 0.6, rnd(-r, r) * 0.5, g, 1, 0.8, 1, 10);
  return g;
}

export function dumpster() {
  const g = G();
  rb(1.5, 1.05, 1.0, MAT.paintGreen, 0, 0.6, 0, g, 0.03);
  rb(1.52, 0.08, 1.02, MAT.darkMetal, 0, 1.13, 0, g, 0.02);
  for (const x of [-0.6, 0.6]) cy(0.05, 0.05, 0.05, MAT.rubber, x, 0.05, 0.5, g, 10).rotation.x = Math.PI / 2;
  return g;
}

export function trashBags(n = 3) {
  const g = G();
  for (let i = 0; i < n; i++) sp(0.28 + Math.random() * 0.08, MAT.rim, rnd(-0.5, 0.5), 0.2, rnd(-0.4, 0.4), g, 1, 0.7, 1, 10);
  return g;
}

export function bench() {
  const g = G();
  for (let i = 0; i < 4; i++) bx(1.6, 0.04, 0.12, MAT.walnut, 0, 0.46, -0.2 + i * 0.13, g, 0.5);
  for (let i = 0; i < 2; i++) bx(1.6, 0.04, 0.12, MAT.walnut, 0, 0.8, -0.44 - i * 0.02, g, 0.5);
  for (const x of [-0.65, 0.65]) { bx(0.06, 0.45, 0.5, MAT.darkMetal, x, 0.22, 0, g); }
  return g;
}

export function fence(len = 6, h = 1.1) {
  const g = G();
  const n = Math.max(2, Math.round(len / 0.14));
  for (let i = 0; i < n; i++) bx(0.07, h, 0.02, MAT.paintWhite, -len / 2 + i * len / (n - 1), h / 2, 0, g, 0.4);
  for (let p = 0; p <= len / 1.5; p++) {
    const x = -len / 2 + p * 1.5;
    bx(0.1, h + 0.05, 0.1, MAT.paintWhite, x, h / 2, 0, g);
  }
  bx(len, 0.05, 0.03, MAT.paintWhite, 0, h * 0.82, 0, g);
  bx(len, 0.05, 0.03, MAT.paintWhite, 0, h * 0.25, 0, g);
  return g;
}

export function mailbox() {
  const g = G();
  cy(0.035, 0.035, 1.0, MAT.walnut, 0, 0.5, 0, g, 8);
  rb(0.3, 0.2, 0.42, MAT.darkMetal, 0, 1.08, 0, g, 0.08);
  bx(0.02, 0.2, 0.02, MAT.bulb, 0.16, 1.0, 0, g);
  return g;
}

export function utilityPole(h = 8.5) {
  const g = G();
  cy(0.11, 0.16, h, MAT.walnut, 0, h / 2, 0, g, 12);
  bx(2.2, 0.14, 0.14, MAT.walnut, 0, h - 0.4, 0, g);
  bx(1.6, 0.1, 0.1, MAT.walnut, 0, h - 1.0, 0, g);
  for (const x of [-1, -0.5, 0.5, 1]) cy(0.04, 0.04, 0.12, MAT.porcelain, x, h - 0.27, 0, g, 8);
  return g;
}

// Провод между двумя точками с провисом: массив точек и провода.
export function wireSpan(a, b, sag = 0.5, n = 3, color = MAT.wire) {
  const g = G();
  for (let k = 0; k < n; k++) {
    const off = (k - (n - 1) / 2) * 0.12;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector3(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t),
        a.z + (b.z - a.z) * t + off,
      ));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 6), color);
    tube.castShadow = true; g.add(tube);
  }
  return g;
}

// Дальний дом-фасад: блок с окнами, двускатная крыша.
export function farBuilding(w, h, d, facadeMat) {
  const g = G();
  bx(w, h, d, facadeMat, 0, h / 2, 0, g, 3);
  const roofH = Math.min(3, w * 0.25);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.2, d + 0.5), MAT.roof);
  roof.position.set(0, h + roofH * 0.45, 0); roof.rotation.z = 0.25; roof.castShadow = true;
  g.add(roof);
  const roof2 = roof.clone(); roof2.rotation.z = -0.25; g.add(roof2);
  return g;
}

export function binCan() {
  const g = G();
  cy(0.26, 0.22, 0.9, MAT.darkMetal, 0, 0.45, 0, g, 16);
  cy(0.28, 0.28, 0.05, MAT.darkMetal, 0, 0.92, 0, g, 16);
  for (let i = 0; i < 3; i++) cy(0.27, 0.23, 0.02, MAT.rim, 0, 0.2 + i * 0.3, 0, g, 16);
  return g;
}

export function manhole() {
  const g = G();
  cy(0.35, 0.35, 0.02, MAT.darkMetal, 0, 0.01, 0, g, 24);
  return g;
}

export function gutter(len) {
  const g = G();
  bx(len, 0.12, 0.14, MAT.gutter, 0, 0, 0, g);
  return g;
}

export function downspout(h) {
  const g = G();
  cy(0.05, 0.05, h, MAT.gutter, 0, h / 2, 0, g, 10);
  return g;
}

export function chimney(w = 0.8, h = 2.0, d = 0.6) {
  const g = G();
  bx(w, h, d, MAT.brick, 0, h / 2, 0, g, 1.2);
  bx(w + 0.12, 0.1, d + 0.12, MAT.brick, 0, h, 0, g, 1.2);
  return g;
}

export function leaves(n = 12, r = 2) {
  const g = G();
  const geo = new THREE.PlaneGeometry(0.12, 0.08);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, MAT.foliage);
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6;
    m.position.set(rnd(-r, r), 0.01 + Math.random() * 0.004, rnd(-r, r));
    g.add(m);
  }
  return g;
}
