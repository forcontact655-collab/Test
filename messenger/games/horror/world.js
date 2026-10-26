// Мир: двухэтажный дом, улица, дома вдали. Всё собирается кодом (models.js + materials.js).
// Координаты: дом x[-7,7] z[-12,0]; фасад и входная дверь на z=0 (смотрит на улицу, +z).
// Первый этаж: пол y=0, потолок 2.85. Второй: пол 3.0, потолок 5.85. Стены на обоих этажах.
import * as THREE from './vendor/three.module.js';
import { MAT } from './materials.js';
import * as M from './models.js';

const { G, bx, rb, cy, sp } = M;
const T = 0.2;             // толщина стен
const SLAB = [2.85, 3.0];  // потолок первого / пол второго
const Y1 = 3.0, YC1 = 5.85;
const STAIR = { x0: -1.6, x1: -0.1, z0: -4.7, z1: -0.2, n: 15, rise: 0.2, run: 0.3 };

/** Создаёт мир. Возвращает реестры: коллайдеры, лампы, двери, интерактив, лужи и т.д. */
export function buildWorld(scene) {
  const W = {
    colliders: [],   // {x0,x1,z0,z1,band:0|1|'any', door?}
    lamps: [],       // {x,y,z,room,color,base,glow:[{m,base}],on,cur,flick,light?}
    doors: [],       // {pivot,base,swing,target,cur,rect,level}
    uses: [],        // {x,y,z,label,fn,dist}
    puddles: [],     // {x,z,r}
    windows: [],     // для оверлея капель (условно)
    rooms: [],       // {name,x0,x1,z0,z1,level}
    stairs: STAIR,
    walkers: [],     // анимированные элементы (вывески и т.п.)
    tv: null, faucets: [],
    streetLights: [],
  };
  const add = (o) => { scene.add(o); return o; };
  const coll = (x0, x1, z0, z1, band = 'any', door = null) => { const c = { x0, x1, z0, z1, band, door }; W.colliders.push(c); return c; };
  const rooms = (name, x0, x1, z0, z1, level) => W.rooms.push({ name, x0, x1, z0, z1, level });
  const at = (obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); return obj; };

  /* ---------- стены с проёмами ---------- */
  // axis 'x': стена вдоль x при z=c. axis 'z': вдоль z при x=c.
  // holes: {a0,a1,y0,y1,type:'door'|'win', sw} — дверь (y0=0) оставляет проём, окно — сплошная плоскость в коллизии.
  function wall({ axis, c, a0, a1, yb, yt, holes = [], mat, band, ext = false }) {
    const sorted = holes.slice().sort((p, q) => p.a0 - q.a0);
    const parts = []; let cur = a0;
    for (const h of sorted) {
      if (h.a0 > cur) parts.push({ s0: cur, s1: h.a0 });
      parts.push({ s0: h.a0, s1: h.a1, hole: h });
      cur = h.a1;
    }
    if (cur < a1) parts.push({ s0: cur, s1: a1 });
    const box3 = (s0, s1, y0, y1, m) => {
      if (y1 - y0 <= 0.001 || s1 - s0 <= 0.001) return;
      const len = s1 - s0, mid = (s0 + s1) / 2, ym = (y0 + y1) / 2, h = y1 - y0;
      const m2 = m;
      if (axis === 'x') bx(len, h, T, m2, mid, ym, c, scene, 1.5);
      else bx(T, h, len, m2, c, ym, mid, scene, 1.5);
    };
    for (const p of parts) {
      if (!p.hole) {
        box3(p.s0, p.s1, yb, yt, mat);
        if (axis === 'x') coll(p.s0, p.s1, c - T / 2, c + T / 2, band); else coll(c - T / 2, c + T / 2, p.s0, p.s1, band);
        continue;
      }
      const h = p.hole;
      if (h.type === 'door') {
        box3(p.s0 - 0.04, p.s0, yb, yt, mat); // косяки видны обычной толщиной
        box3(p.s1, p.s1 + 0.04, yb, yt, mat);
        box3(p.s0, p.s1, h.y1, yt, mat);
        box3(p.s0, p.s1, yb, yb, mat);
        if (h.lift) box3(p.s0, p.s1, yb, h.y0, mat);
        // дверной короб
        const cm = MAT.paintTrim;
        const cw = 0.07;
        if (axis === 'x') {
          bx(cw, 2.15, 0.04, cm, p.s0 - 0.02, 1.07, c + T / 2 + 0.02, scene);
          bx(cw, 2.15, 0.04, cm, p.s1 + 0.02, 1.07, c + T / 2 + 0.02, scene);
          bx(p.s1 - p.s0 + 0.2, cw, 0.04, cm, (p.s0 + p.s1) / 2, 2.15, c + T / 2 + 0.02, scene);
          bx(cw, 2.15, 0.04, cm, p.s0 - 0.02, 1.07, c - T / 2 - 0.02, scene);
          bx(cw, 2.15, 0.04, cm, p.s1 + 0.02, 1.07, c - T / 2 - 0.02, scene);
          bx(p.s1 - p.s0 + 0.2, cw, 0.04, cm, (p.s0 + p.s1) / 2, 2.15, c - T / 2 - 0.02, scene);
        } else {
          bx(0.04, 2.15, cw, cm, c + T / 2 + 0.02, 1.07, p.s0 - 0.02, scene);
          bx(0.04, 2.15, cw, cm, c + T / 2 + 0.02, 1.07, p.s1 + 0.02, scene);
          bx(0.04, cw, p.s1 - p.s0 + 0.2, cm, c + T / 2 + 0.02, 2.15, (p.s0 + p.s1) / 2, scene);
          bx(0.04, 2.15, cw, cm, c - T / 2 - 0.02, 1.07, p.s0 - 0.02, scene);
          bx(0.04, 2.15, cw, cm, c - T / 2 - 0.02, 1.07, p.s1 + 0.02, scene);
          bx(0.04, cw, p.s1 - p.s0 + 0.2, cm, c - T / 2 - 0.02, 2.15, (p.s0 + p.s1) / 2, scene);
        }
        // полотно двери
        const w = p.s1 - p.s0;
        const pivot = G();
        if (axis === 'x') { pivot.position.set(p.s0, 0, c); pivot.rotation.y = 0; }
        else { pivot.position.set(c, 0, p.s0); pivot.rotation.y = -Math.PI / 2; }
        const leaf = M.doorUnit(w, 2.1, h.mat || MAT.door);
        pivot.add(leaf);
        // лицевая сторона — к комнате
        scene.add(pivot);
        const d = {
          pivot, base: pivot.rotation.y, swing: h.sw || 1, target: h.open ? 1 : 0, cur: h.open ? 1 : 0, level: band === 1 ? 1 : 0,
          axis, c, a0: p.s0, a1: p.s1, closedRect: axis === 'x'
            ? { x0: p.s0, x1: p.s1, z0: c - 0.11, z1: c + 0.11 } : { x0: c - 0.11, x1: c + 0.11, z0: p.s0, z1: p.s1 },
        };
        W.doors.push(d);
        const rc = coll(d.closedRect.x0, d.closedRect.x1, d.closedRect.z0, d.closedRect.z1, band, d);
        d.coll = rc;
        W.uses.push({ x: (axis === 'x' ? (p.s0 + p.s1) / 2 : c), y: (band === 1 ? Y1 : 0) + 1.1, z: (axis === 'x' ? c : (p.s0 + p.s1) / 2), label: 'дверь', dist: 2.0, door: d });
      } else {
        // окно: плоскость стены + рама и ставни
        box3(p.s0, p.s1, yb, h.y0, mat);
        box3(p.s0, p.s1, h.y1, yt, mat);
        if (axis === 'x') coll(p.s0, p.s1, c - T / 2, c + T / 2, band); else coll(c - T / 2, c + T / 2, p.s0, p.s1, band);
        const w = p.s1 - p.s0, hh = h.y1 - h.y0, cy0 = (h.y0 + h.y1) / 2, cm = (p.s0 + p.s1) / 2;
        const win = M.windowUnit(w, hh);
        const sh = M.shutterPair(w, hh);
        if (axis === 'x') {
          at(win, cm, cy0, c, 0);
          if (h.shutters) at(sh, cm, cy0, c, 0);
        } else {
          at(win, c, cy0, cm, Math.PI / 2);
          if (h.shutters) at(sh, c, cy0, cm, Math.PI / 2);
        }
        W.windows.push({ x: axis === 'x' ? cm : c, z: axis === 'x' ? c : cm, y: cy0 });
      }
    }
  }

  // Пол-плитка с UV в метрах
  function floor(x0, x1, z0, z1, y, m, unit = 1.5) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / unit, uv.getY(i) * (z1 - z0) / unit);
    const mesh = new THREE.Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    mesh.receiveShadow = true;
    return add(mesh);
  }
  function ceilingPlane(x0, x1, z0, z1, y, m) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    mesh.receiveShadow = true;
    return add(mesh);
  }

  // Лампа: регистрируем и отдельные материалы для свечения.
  function lamp(x, y, z, room, { color = 0xffd9a0, base = 6, kind = 'ceil', fixture = null, level = 0, glowMats = [] } = {}) {
    const L = { x, y, z, room, color, base, kind, glow: [], on: true, cur: 1, flick: 0, level };
    if (fixture) {
      fixture.traverse((o) => {
        if (!o.isMesh) return;
        const src = o.material;
        if ([MAT.lampShade, MAT.bulb, MAT.fluoro, MAT.streetLampGlow].includes(src)) {
          const m = src.clone();
          o.material = m;
          L.glow.push({ m, base: src.emissiveIntensity });
        }
      });
    }
    for (const m of glowMats) L.glow.push({ m, base: m.emissiveIntensity });
    W.lamps.push(L);
    return L;
  }
  // Настенный светильник (бра): ry — направление нормали стены (в комнату).
  function wallLamp(x, y, z, ry, room, color, base) {
    const f = at(M.sconce(), x, y, z, ry);
    return lamp(x + Math.sin(ry) * 0.1, y + 0.15, z + Math.cos(ry) * 0.1, room, { color, base, fixture: f, kind: 'wall' });
  }
  // Потолочный светильник-плафон (drum) по координате крепления (потолок).
  function ceilLamp(x, yc, z, room, color, base, level) {
    const f = G(x, yc, z); scene.add(f);
    f.add(M.ceilingDrum(0.22));
    return lamp(x, yc - 0.22, z, room, { color, base, fixture: f, level, kind: 'ceil' });
  }
  function tableLamp(x, y, z, room, color = 0xffb36b, base = 1.4, level = 0) {
    const g = G(x, y, z); scene.add(g);
    cy(0.07, 0.08, 0.02, MAT.darkMetal, 0, 0.01, 0, g, 18);
    cy(0.012, 0.012, 0.36, MAT.brass, 0, 0.19, 0, g, 8);
    cy(0.1, 0.17, 0.24, MAT.lampShade, 0, 0.36, 0, g, 24);
    sp(0.03, MAT.bulb, 0, 0.3, 0, g);
    return lamp(x, y + 0.3, z, room, { color, base, fixture: g, level, kind: 'table' });
  }

  // Выключатель — пластина на стене; rotY — направление нормали пластины (в комнату).
  function sw(x, y, z, rotY, room, label = 'свет') {
    const g = G(x, y, z); scene.add(g);
    rb(0.09, 0.13, 0.014, MAT.paintWhite, 0, 0, 0, g, 0.01);
    cy(0.012, 0.012, 0.016, MAT.paintTrim, 0, 0, 0.008, g, 8).rotation.x = Math.PI / 2;
    g.rotation.y = rotY;
    W.uses.push({ x, y, z, label, dist: 1.6, switchRoom: room });
    return g;
  }

  // Общая функция для «включить группу ламп».
  W.toggleRoom = (room) => {
    const group = W.lamps.filter((l) => l.room === room);
    const on = !group.some((l) => l.on);
    for (const l of group) { l.on = on; l.flick = on ? 0.5 : 0; }
    return on;
  };

  /* ================= ДОМ: ПЕРВЫЙ ЭТАЖ ================= */
  const Fg = 0;
  // Полы/потолки первого этажа (плитка/паркет/ковёр — по комнате)
  floor(-7, -1.6, -6.5, 0, Fg + 0.002, MAT.woodFloor, 1.5);       // гостиная
  floor(-7, -1.6, -12, -6.5, Fg + 0.002, MAT.carpet, 1.5);         // столовая (ковролин)
  floor(1.6, 7, -6.5, 0, Fg + 0.002, MAT.tile, 0.6);              // кухня, плитка
  floor(1.6, 3.4, -12, -6.5, Fg + 0.002, MAT.tile, 0.6);           // санузел
  floor(3.4, 7, -12, -6.5, Fg + 0.002, MAT.tile, 0.6);             // подсобка
  floor(-1.6, 1.6, -12, 0, Fg + 0.002, MAT.woodFloor, 1.5);        // прихожая (паркет)
  // ... но слой под лестницей тоже пол
  // потолок первого этажа — низ перекрытия (на slab)
  rooms('hall', -1.6, 1.6, -12, 0, 0);
  rooms('living', -7, -1.6, -6.5, 0, 0);
  rooms('dining', -7, -1.6, -12, -6.5, 0);
  rooms('kitchen', 1.6, 7, -6.5, 0, 0);
  rooms('wc', 1.6, 3.4, -12, -6.5, 0);
  rooms('util', 3.4, 7, -12, -6.5, 0);

  // Внешние стены первого этажа (кирпич)
  // Фасад z=0: вход x∈[-0.55,0.55]; окна гостиной и кухни
  wall({ axis: 'x', c: 0, a0: -7, a1: 7, yb: 0, yt: SLAB[0], mat: MAT.brick, band: 0, holes: [
    { a0: -0.55, a1: 0.55, y0: 0, y1: 2.1, type: 'door', sw: 1 },
    { a0: -5.05, a1: -3.55, y0: 0.9, y1: 2.4, type: 'win', shutters: true },
    { a0: 3.65, a1: 5.15, y0: 0.9, y1: 2.4, type: 'win', shutters: true },
  ] });
  // Задняя стена z=-12
  wall({ axis: 'x', c: -12, a0: -7, a1: 7, yb: 0, yt: SLAB[0], mat: MAT.brick, band: 0, holes: [
    { a0: -6.8, a1: -5.6, y0: 0.9, y1: 2.3, type: 'win', shutters: true },
    { a0: 2.25, a1: 2.75, y0: 1.5, y1: 2.2, type: 'win' },
    { a0: 5.1, a1: 6.1, y0: 0.9, y1: 2.2, type: 'win', shutters: true },
  ] });
  // Западная стена x=-7
  wall({ axis: 'z', c: -7, a0: -12, a1: 0, yb: 0, yt: SLAB[0], mat: MAT.brick, band: 0, holes: [
    { a0: -10.2, a1: -8.8, y0: 0.9, y1: 2.3, type: 'win', shutters: true },
  ] });
  // Восточная стена x=7
  wall({ axis: 'z', c: 7, a0: -12, a1: 0, yb: 0, yt: SLAB[0], mat: MAT.brick, band: 0, holes: [
    { a0: -10.2, a1: -8.8, y0: 0.9, y1: 2.3, type: 'win', shutters: true },
  ] });

  // Внутренние стены первого этажа
  // x=-1.6: гостиная | прихожая (дверь в гостиную z[-6.2,-5.0]); столовая | прихожая (z[-9.5,-8.3])
  wall({ axis: 'z', c: -1.6, a0: -12, a1: 0, yb: 0, yt: SLAB[0], mat: MAT.plaster, band: 0, holes: [
    { a0: -6.2, a1: -5.0, y0: 0, y1: 2.1, type: 'door', sw: -1 },
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  // x=1.6: прихожая | кухня (z[-6.2,-5.0]) и санузел (z[-9.5,-8.3])
  wall({ axis: 'z', c: 1.6, a0: -12, a1: 0, yb: 0, yt: SLAB[0], mat: MAT.plaster, band: 0, holes: [
    { a0: -6.2, a1: -5.0, y0: 0, y1: 2.1, type: 'door', sw: 1 },
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: 1 },
  ] });
  // z=-6.5: гостиная | столовая (дверь x[-4.8,-3.8]); кухня | подсобка (дверь x[4.55,5.45])
  wall({ axis: 'x', c: -6.5, a0: -7, a1: -1.6, yb: 0, yt: SLAB[0], mat: MAT.plaster, band: 0, holes: [
    { a0: -4.8, a1: -3.8, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  wall({ axis: 'x', c: -6.5, a0: 1.6, a1: 7, yb: 0, yt: SLAB[0], mat: MAT.plaster, band: 0, holes: [
    { a0: 4.55, a1: 5.45, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  // x=3.4: санузел | подсобка
  wall({ axis: 'z', c: 3.4, a0: -12, a1: -6.5, yb: 0, yt: SLAB[0], mat: MAT.plaster, band: 0 });

  // Лестница (рампа ступеней) у западной стены прихожей. Перила с восточной стороны.
  {
    const S = STAIR;
    const stepLen = S.run, rise = S.rise;
    for (let i = 0; i < S.n; i++) {
      const zc = S.z1 - stepLen * (i + 0.5);
      const h = rise * (i + 1);
      const b = bx((S.x1 - S.x0), h, stepLen, MAT.oak, (S.x0 + S.x1) / 2, h / 2, zc, scene, 1.2);
      b.receiveShadow = true;
    }
    // перила: наклонный поручень и стойки
    const len = Math.hypot(S.z1 - S.z0, 3.0);
    const ang = Math.atan2(3.0, S.z1 - S.z0);
    const rail = bx(0.05, 0.05, len, MAT.walnut, S.x1 - 0.04, 2.4, (S.z0 + S.z1) / 2, scene);
    rail.rotation.x = ang;
    for (let i = 0; i < S.n; i += 2) {
      const zc = S.z1 - stepLen * (i + 0.5);
      const h = rise * (i + 1);
      bx(0.04, 0.95, 0.04, MAT.walnut, S.x1 - 0.04, h + 0.47, zc, scene);
    }
    // лестница заходит в проём перекрытия — проём открыт
    // коллизия рейки
    coll(S.x1 - 0.04 - 0.05, S.x1 - 0.04 + 0.05, S.z0, S.z1, 'any');
    // боковые стенки (закрывают проём «в пустоту» снаружи)
  }

  // Перекрытие (низ — потолок первого этажа, верх — пол второго) с проёмом под лестницу
  const slabY = (SLAB[0] + SLAB[1]) / 2, slabH = SLAB[1] - SLAB[0];
  const slabRects = [
    [-7, 7, -12, STAIR.z0], [-7, STAIR.x0, STAIR.z0, STAIR.z1], [STAIR.x1, 7, STAIR.z0, STAIR.z1], [-7, 7, STAIR.z1, 0],
  ];
  for (const [x0, x1, z0, z1] of slabRects) {
    bx(x1 - x0, slabH, z1 - z0, MAT.plaster, (x0 + x1) / 2, slabY, (z0 + z1) / 2, scene, 1.5);
  }

  // Мебель гостиной
  at(M.tvStand(1.6), -6.7, 0, -3.2, Math.PI / 2);
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.55), MAT.tvScreen.clone());
  tvScreen.material.emissive = new THREE.Color(0x1c3650); tvScreen.material.emissiveIntensity = 0;
  tvScreen.position.set(-6.66, 0.85, -3.2); tvScreen.rotation.y = Math.PI / 2; add(tvScreen);
  W.tvScreen = tvScreen;
  W.tvOn = false;
  W.uses.push({ x: -6.5, y: 1.0, z: -3.2, label: 'телевизор', dist: 1.8, fn: () => {
    W.tvOn = !W.tvOn; tvScreen.material.emissiveIntensity = W.tvOn ? 0.9 : 0; W.tvClick && W.tvClick();
  } });
  at(M.sofa(), -4.2, 0, -3.2, Math.PI);
  at(M.coffeeTable(1.1, 0.6), -5.3, 0, -3.2, 0);
  at(M.rug(3.3, 3.0, 0x6f2d25), -5.0, 0.0, -3.0);
  at(M.bookshelf(1.2, 2.1, 0.35), -2.3, 0, -6.22, 0);
  at(M.plant(1.2), -6.4, 0, -0.8, 0);
  at(M.plant(0.9), -2.0, 0, -0.5, 0);
  ceilLamp(-4.2, SLAB[0], -3.2, 'living', 0xffdcaa, 5.5, 0);
  const fl = at(M.floorLamp(), -2.4, 0, -0.9, 0);
  lamp(-2.4, 1.45, -0.9, 'living', { color: 0xffb36b, base: 2.4, kind: 'floor', fixture: fl });
  sw(-1.71, 1.2, -1.0, -Math.PI / 2, 'living');
  // картина над камином-полкой
  at(M.mirror(0.9, 0.7), -6.0, 1.7, -6.42, 0);

  // Столовая
  at(M.diningTable(1.6, 0.9), -4.3, 0, -9.2, 0);
  for (const x of [-5.1, -4.3, -3.5]) {
    at(M.chair(), x, 0, -8.1, Math.PI);
    at(M.chair(), x, 0, -10.3, 0);
  }
  at(M.dresser(1.8, 0.48, 0.9), -4.3, 0, -11.7, 0);
  ceilLamp(-4.3, SLAB[0], -9.2, 'dining', 0xffcf96, 5.5, 0);
  // люстра-подвес над столом: отдельный светильник
  {
    const f = at(M.pendant(0.5), -4.3, SLAB[0], -9.2, 0);
    lamp(-4.3, SLAB[0] - 0.7, -9.2, 'dining', { color: 0xffc27a, base: 5.0, fixture: f });
  }
  sw(-1.71, 1.2, -10.6, -Math.PI / 2, 'dining');
  at(M.plant(1.0), -6.4, 0, -11.0, 0);

  // Кухня: базовые модули вдоль восточной стены, островок, холодильник, плита
  at(M.kitchenBase(4.4), 6.62, 0, -3.2, -Math.PI / 2);
  at(M.kitchenWall(3.8), 6.73, 1.8, -3.5, -Math.PI / 2);
  at(M.sinkUnit(), 6.5, 0, -2.4, -Math.PI / 2);
  at(M.stove(), 6.62, 0, -4.3, -Math.PI / 2);
  at(M.fridge(), 6.55, 0, -5.84, -Math.PI / 2);
  at(M.kitchenBase(1.8), 4.4, 0, -3.5, 0);
  // чайник на островке и фрукты
  sp(0.12, MAT.steel, 4.1, 0.97, -3.3, scene, 1, 0.9, 1);
  cy(0.14, 0.12, 0.18, MAT.steel, 4.6, 0.99, -3.2, scene, 14);
  ceilLamp(4.4, SLAB[0], -4.0, 'kitchen', 0xf1f5ff, 5.5, 0);
  lamp(6.5, 1.5, -3.0, 'kitchen', { color: 0xfff1d6, base: 1.2, kind: 'under' });
  sw(1.71, 1.2, -4.6, Math.PI / 2, 'kitchen');
  W.faucets.push({ x: 6.25, y: 1.0, z: -2.4, id: 'kitchen' });
  W.uses.push({ x: 6.25, y: 1.0, z: -2.4, label: 'кран: вода', dist: 1.6, fn: () => W.faucetToggle('kitchen') });

  // Санузел первого этажа
  at(M.toilet(), 2.5, 0, -11.6, Math.PI);
  at(M.sinkUnit(), 3.2, 0, -8.6, -Math.PI / 2);
  W.faucets.push({ x: 3.05, y: 0.95, z: -8.6, id: 'wc' });
  W.uses.push({ x: 3.05, y: 0.95, z: -8.6, label: 'кран: вода', dist: 1.6, fn: () => W.faucetToggle('wc') });
  ceilLamp(2.5, SLAB[0], -9.2, 'wc', 0xf1f5ff, 4.2, 0);
  sw(1.71, 1.2, -8.0, Math.PI / 2, 'wc');
  // Подсобка: стиральная машина, полки
  at(rb(0.6, 0.85, 0.6, MAT.steel, 0, 0.43, 0, null, 0.04), 6.0, 0, -11.4, 0);
  for (let i = 0; i < 3; i++) bx(0.5, 0.35, 0.45, MAT.oak, 3.7, 0.2 + i * 0.5, -9.4 - i * 0.12, scene, 0.5);
  ceilLamp(5.2, SLAB[0], -9.2, 'util', 0xf4f8ff, 4.8, 0);
  sw(3.51, 1.2, -7.4, Math.PI / 2, 'util');

  // Прихожая первого этажа
  at(M.coatRack(), 1.1, 0, -0.8, 0);
  at(M.radiator(1.0), -1.45, 0.1, -10.6, Math.PI / 2);
  at(M.mirror(0.8, 1.2), 1.51, 1.6, -2.2, -Math.PI / 2);
  at(M.rug(1.4, 2.2, 0x3e2c25), 0.5, 0, -1.9, 0);
  ceilLamp(0.6, SLAB[0], -2.5, 'hall', 0xffd9a0, 5.5, 0);
  ceilLamp(0.6, SLAB[0], -8.5, 'hall', 0xffd9a0, 5.5, 0);
  wallLamp(1.51, 1.9, -8.8, -Math.PI / 2, 'hall', 0xffd9a0, 2.5);
  sw(1.51, 1.2, -0.7, -Math.PI / 2, 'hall');

  // Лестница-колонна: сюда попадают лампы холла
  // Внешние детали здания: порог, крыльцо, карнизы — ниже в части экстерьера

  /* ================= ДОМ: ВТОРОЙ ЭТАЖ ================= */
  const F1 = Y1;
  floor(-7, -1.6, -6.5, 0, F1 + 0.002, MAT.carpet, 1.5);    // главная спальня
  floor(-7, -1.6, -12, -6.5, F1 + 0.002, MAT.woodFloor, 1.5); // детский кабинет (паркет)
  floor(-1.6, 1.6, -12, -4.7, F1 + 0.002, MAT.woodFloor, 1.5); // холл второго этажа (без проёма лестницы)
  floor(-0.1, 1.6, -4.7, 0, F1 + 0.002, MAT.woodFloor, 1.5);
  floor(-1.6, -0.1, -0.2, 0, F1 + 0.002, MAT.woodFloor, 1.5);
  floor(1.6, 4.4, -12, -6.5, F1 + 0.002, MAT.tile, 0.6);      // ванная
  floor(1.6, 7, -6.5, 0, F1 + 0.002, MAT.carpet, 1.5);        // гостевая
  floor(4.4, 7, -12, -6.5, F1 + 0.002, MAT.woodFloor, 1.5);   // кабинет
  // потолки второго этажа (под крышей)
  ceilingPlane(-7, 7, -12, 0, YC1, MAT.plaster);
  rooms('uhall', -1.6, 1.6, -12, 0, 1);
  rooms('master', -7, -1.6, -6.5, 0, 1);
  rooms('kids', -7, -1.6, -12, -6.5, 1);
  rooms('ubath', 1.6, 4.4, -12, -6.5, 1);
  rooms('guest', 1.6, 7, -6.5, 0, 1);
  rooms('study', 4.4, 7, -12, -6.5, 1);

  // Внешние стены второго этажа (окраска)
  wall({ axis: 'x', c: 0, a0: -7, a1: 7, yb: Y1, yt: YC1, mat: MAT.paintCream, band: 1, holes: [
    { a0: -4.9, a1: -3.6, y0: 3.8, y1: 5.2, type: 'win', shutters: true },
    { a0: 4.9, a1: 6.2, y0: 3.8, y1: 5.2, type: 'win', shutters: true },
  ] });
  wall({ axis: 'x', c: -12, a0: -7, a1: 7, yb: Y1, yt: YC1, mat: MAT.paintCream, band: 1, holes: [
    { a0: -4.9, a1: -3.6, y0: 3.8, y1: 5.2, type: 'win', shutters: true },
    { a0: 2.6, a1: 3.4, y0: 4.2, y1: 5.3, type: 'win' },
  ] });
  wall({ axis: 'z', c: -7, a0: -12, a1: 0, yb: Y1, yt: YC1, mat: MAT.paintCream, band: 1, holes: [
    { a0: -10.2, a1: -8.8, y0: 3.8, y1: 5.2, type: 'win', shutters: true },
  ] });
  wall({ axis: 'z', c: 7, a0: -12, a1: 0, yb: Y1, yt: YC1, mat: MAT.paintCream, band: 1, holes: [
    { a0: -3.9, a1: -2.6, y0: 3.8, y1: 5.2, type: 'win', shutters: true },
  ] });
  // внутренние стены второго этажа
  wall({ axis: 'z', c: -1.6, a0: -12, a1: 0, yb: Y1, yt: YC1, mat: MAT.plaster, band: 1, holes: [
    { a0: -6.2, a1: -5.0, y0: 0, y1: 2.1, type: 'door', sw: -1 },
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  wall({ axis: 'z', c: 1.6, a0: -12, a1: 0, yb: Y1, yt: YC1, mat: MAT.plaster, band: 1, holes: [
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: 1 },
    { a0: -2.2, a1: -1.0, y0: 0, y1: 2.1, type: 'door', sw: 1 },
  ] });
  wall({ axis: 'x', c: -6.5, a0: -7, a1: -1.6, yb: Y1, yt: YC1, mat: MAT.plaster, band: 1 });
  wall({ axis: 'x', c: -6.5, a0: 1.6, a1: 7, yb: Y1, yt: YC1, mat: MAT.plaster, band: 1, holes: [
    { a0: 5.25, a1: 6.15, y0: 0, y1: 2.1, type: 'door', sw: 1 },
  ] });
  wall({ axis: 'z', c: 4.4, a0: -12, a1: -6.5, yb: Y1, yt: YC1, mat: MAT.plaster, band: 1 });

  // Главная спальня
  at(M.bed(2.0, 1.8), -3.9, Y1, -5.5, Math.PI);
  at(M.nightstand(), -5.4, Y1, -6.18, 0);
  at(M.nightstand(), -2.4, Y1, -6.18, 0);
  tableLamp(-5.4, Y1 + 0.58, -6.18, 'master', 0xffb36b, 1.6, 1);
  tableLamp(-2.4, Y1 + 0.58, -6.18, 'master', 0xffb36b, 1.6, 1);
  at(M.wardrobe(1.3, 2.2, 0.6), -6.6, Y1, -2.2, Math.PI / 2);
  at(M.rug(2.2, 1.6, 0x4a3a33), -3.7, Y1, -2.6, 0);
  at(M.plant(0.9), -6.5, Y1, -5.4, 0);
  ceilLamp(-4.3, YC1, -3.0, 'master', 0xffd9a0, 4.5, 1);
  sw(-1.71, Y1 + 1.2, -4.4, -Math.PI / 2, 'master');
  // Детский кабинет
  at(M.desk(1.2, 0.6), -4.0, Y1, -11.7, 0);
  at(M.chair(), -4.0, Y1, -10.6, Math.PI);
  at(M.bookshelf(1.2, 2.0, 0.35), -6.7, Y1, -9.0, Math.PI / 2);
  tableLamp(-4.4, Y1 + 0.76, -11.9, 'kids', 0xffc68a, 1.4, 1);
  at(M.rug(2.0, 1.4, 0x3d4a4a), -4.0, Y1, -8.6, 0);
  ceilLamp(-4.3, YC1, -9.2, 'kids', 0xffe0b8, 4.5, 1);
  sw(-1.71, Y1 + 1.2, -10.6, -Math.PI / 2, 'kids');
  // Ванная наверху
  at(M.bathtub(), 3.0, Y1, -11.53, 0);
  at(M.toilet(), 4.1, Y1, -8.4, Math.PI / 2);
  at(M.sinkUnit(), 2.4, Y1, -6.9, Math.PI);
  at(M.mirror(0.9, 0.9), 2.4, Y1 + 1.5, -6.42, Math.PI);
  W.faucets.push({ x: 2.35, y: Y1 + 0.95, z: -6.9, id: 'ubath' });
  W.uses.push({ x: 2.35, y: Y1 + 0.95, z: -6.9, label: 'кран: вода', dist: 1.6, fn: () => W.faucetToggle('ubath') });
  ceilLamp(2.6, YC1, -10.0, 'ubath', 0xf1f5ff, 4.8, 1);
  sw(1.71, Y1 + 1.2, -8.0, Math.PI / 2, 'ubath');
  at(M.radiator(0.8), 4.2, Y1 + 0.02, -10.0, -Math.PI / 2);
  // Гостевая
  at(M.bed(2.0, 1.8), 6.0, Y1, -3.2, Math.PI / 2);
  at(M.nightstand(), 6.6, Y1, -4.9, Math.PI / 2);
  tableLamp(6.6, Y1 + 0.58, -4.9, 'guest', 0xffb36b, 1.6, 1);
  at(M.dresser(1.2, 0.5, 0.9), 2.0, Y1, -5.4, Math.PI / 2);
  at(M.rug(2.0, 1.6, 0x5a3f36), 3.8, Y1, -3.0, 0);
  at(M.plant(0.9), 6.5, Y1, -0.9, 0);
  ceilLamp(4.3, YC1, -3.2, 'guest', 0xffdcaa, 4.5, 1);
  sw(1.71, Y1 + 1.2, -3.4, Math.PI / 2, 'guest');
  // Кабинет
  at(M.desk(1.0, 0.55), 5.7, Y1, -11.72, 0);
  at(M.chair(), 5.7, Y1, -10.7, Math.PI);
  at(M.bookshelf(1.2, 2.0, 0.35), 6.72, Y1, -9.0, -Math.PI / 2);
  tableLamp(5.1, Y1 + 0.76, -11.9, 'study', 0xffc68a, 1.4, 1);
  ceilLamp(5.7, YC1, -9.0, 'study', 0xffe0b8, 4.0, 1);
  sw(6.4, Y1 + 1.2, -6.41, 0, 'study');
  // Холл второго этажа
  at(M.rug(1.4, 2.2, 0x3e2c25), 0.6, Y1, -4.5, 0);
  at(M.plant(1.0), 1.1, Y1, -10.8, 0);
  ceilLamp(0.6, YC1, -2.5, 'uhall', 0xffd9a0, 5.5, 1);
  ceilLamp(0.6, YC1, -8.5, 'uhall', 0xffd9a0, 5.5, 1);
  sw(-1.51, Y1 + 1.2, -10.4, Math.PI / 2, 'uhall');

  // Двери — отложены в uses по координатам; открывание/закрывание в game.js

  /* ================= ЭКСТЕРЬЕР ДОМА ================= */
  // крыша: два ската + фронтоны
  const roofAng = Math.atan2(2.35, 7.2), roofW = Math.hypot(7.2, 2.35);
  const roofMat = MAT.roof;
  for (const s of [-1, 1]) {
    const r = bx(roofW, 0.22, 12.8, roofMat, s * 3.6, 5.95 + 1.175, -6.0, scene, 1.0);
    r.rotation.z = -s * roofAng;
  }
  // фронтоны (треугольники, экструзия)
  for (const zc of [0.12, -12.12]) {
    const sh = new THREE.Shape();
    sh.moveTo(-7.2, 5.9); sh.lineTo(7.2, 5.9); sh.lineTo(0, 8.3); sh.lineTo(-7.2, 5.9);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false });
    const m = new THREE.Mesh(geo, MAT.paintCream);
    m.position.z = zc - 0.1; m.castShadow = true; m.receiveShadow = true; scene.add(m);
  }
  // свесы и водостоки
  for (const s of [-1, 1]) at(M.gutter(12.8), s * 7.3, 5.9, -6.0, Math.PI / 2);
  for (const [x, z] of [[-7.2, 0.15], [7.2, 0.15], [-7.2, -12.1], [7.2, -12.1]]) at(M.downspout(5.9), x, 0, z, 0);
  // дымоход
  at(M.chimney(0.8, 2.2, 0.6), -3.8, 5.6, -8.0, 0);
  // крыльцо
  bx(2.4, 0.15, 1.2, MAT.stone, 0, 0.075, 0.6, scene, 0.6);
  for (let i = 0; i < 3; i++) bx(2.4, 0.12, 0.3, MAT.stone, 0, 0.06 - i * 0.12 + 0.02, 1.2 + i * 0.3, scene, 0.6);
  for (const x of [-1.1, 1.1]) { cy(0.06, 0.06, 2.65, MAT.paintWhite, x, 1.33, 1.1, scene, 12); }
  bx(2.6, 0.12, 1.9, MAT.roof, 0, 2.7, 0.95, scene, 1.0);
  bx(2.4, 0.09, 0.04, MAT.paintCream, 0, 2.66, 0.02, scene);
  wallLamp(1.3, 2.2, 0.06, 0, 'porch', 0xffc98a, 2.2);
  wallLamp(-1.3, 2.2, 0.06, 0, 'porch', 0xffc98a, 2.2);
  // дверь крыльца — парадная дверь (открывается)
  // подвеска водостока, карниз — отдельно
  for (const z of [0.4]) bx(14.4, 0.2, 0.1, MAT.paintCream, 0, 5.95, z, scene);
  for (const x of [-5.0, 5.0]) bx(0.08, 0.5, 0.08, MAT.paintCream, x, 5.5, 0.2, scene);

  // Газон и двор
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(200, 5.2), MAT.lawn);
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.002, 2.6); lawn.receiveShadow = true; add(lawn);
  // дорожка к дому
  floor(-0.9, 0.9, 0.0, 5.2, 0.004, MAT.concrete, 1.5);
  // подъездная дорожка
  floor(9.0, 13.0, 0.0, 8.2, 0.005, MAT.asphalt, 2.0);
  // кусты у фасада
  for (const [x, z] of [[-6.6, 0.8], [-5.6, 1.2], [5.6, 1.1], [6.6, 0.6], [-2.0, 0.9], [2.2, 0.8]]) at(M.bush(0.55), x, 0, z, 0);
  // деревья
  for (const [x, z, h, r] of [[-13, 3.4, 7.5, 2.2], [14.5, 3.0, 6.5, 2.0], [-30, 3.6, 8.2, 2.6], [22, 2.8, 6.8, 2.2], [40, 4.0, 7.6, 2.4], [-44, 3.8, 8.5, 2.7]]) {
    at(M.tree(h, r), x, 0, z, Math.random() * 6);
  }
  // забор вдоль участка
  at(M.fence(5.2, 1.0), -12.8, 0, 2.6, Math.PI / 2);
  at(M.fence(5.2, 1.0), 12.8, 0, 2.6, Math.PI / 2);
  // почтовый ящик, мусорный бак
  at(M.mailbox(), 2.6, 0, 5.7, 0);
  at(M.binCan(), -8.0, 0, 5.6, 0);
  at(M.trashBags(3), -8.9, 0, 5.8, 0);
  // провода от столба
  at(M.utilityPole(8.8), 16.2, 0, 5.8, 0);
  at(M.utilityPole(8.8), -16.2, 0, 5.8, 0);
  at(M.wireSpan(new THREE.Vector3(16.2, 8.2, 5.8), new THREE.Vector3(-16.2, 8.2, 5.8), 0.9, 3), 0, 0, 0, 0);

  // Соседние дома (объём и коллизии)
  const neighbor = (x0, x1, h, z0, z1, tint) => {
    const w = x1 - x0, d = z1 - z0;
    const m = new THREE.MeshStandardMaterial({ map: MAT.facade.map, color: tint, roughness: 0.85 });
    const b = bx(w, h, d, m, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, scene, 3.0);
    b.castShadow = true;
    const roof = bx(w + 0.4, 0.3, d + 0.4, MAT.roof, (x0 + x1) / 2, h + 0.15, (z0 + z1) / 2, scene, 1.0);
    void roof;
    coll(x0, x1, z0, z1, 'any');
    return b;
  };
  neighbor(-26, -12, 6.2, -12.5, -0.5, 0x8b7b6c);
  neighbor(10.5, 24, 5.8, -13, -0.5, 0x6c5c4f);
  neighbor(-42, -28, 7.6, -13, -0.5, 0x7b6e62);

  /* ================= УЛИЦА ================= */
  // дорога (асфальт) и бордюры
  const road = new THREE.Mesh(new THREE.PlaneGeometry(260, 8.0), MAT.asphalt);
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.001, 12.1); road.receiveShadow = true; add(road);
  // тротуары
  floor(-130, 9.0, 5.2, 7.9, 0.008, MAT.concrete, 1.5);
  floor(13.0, 130, 5.2, 7.9, 0.008, MAT.concrete, 1.5);
  floor(-130, 130, 16.3, 18.5, 0.008, MAT.concrete, 1.5);
  // дальний газон
  const far = new THREE.Mesh(new THREE.PlaneGeometry(260, 6), MAT.lawn);
  far.rotation.x = -Math.PI / 2; far.position.set(0, 0.002, 20.5); far.receiveShadow = true; add(far);
  // бордюры (низкие блоки)
  bx(260, 0.16, 0.2, MAT.concrete, 0, 0.08, 8.0, scene, 1.5);
  bx(260, 0.16, 0.2, MAT.concrete, 0, 0.08, 16.2, scene, 1.5);
  // разметка
  for (let x = -120; x < 120; x += 6) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.14), MAT.paintWhite);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, 12.1); add(m);
  }
  // люки и лужи
  for (const [x, z] of [[-20, 12.6], [22, 11.0], [-48, 13.3]]) at(M.manhole(), x, 0, z, 0);
  const puddleSpots = [[-18, 11.2, 2.2], [-6, 14.3, 2.8], [4, 9.6, 1.8], [18, 13.0, 3.2], [33, 10.5, 2.0], [-34, 14.5, 2.6], [-40, 11.4, 1.6], [0, 17.2, 2.0], [-28, 17.6, 1.5], [26, 17.4, 1.9]];
  for (const [x, z, r] of puddleSpots) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 28), MAT.puddle);
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.012, z); p.receiveShadow = true; add(p);
    W.puddles.push({ x, z, r });
  }
  // лужи на тротуаре
  for (const [x, z, r] of [[-14, 6.5, 0.9], [22, 6.9, 0.7]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 24), MAT.puddle);
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.01, z); add(p);
    W.puddles.push({ x, z, r });
  }

  // уличные фонари: вдоль ближней стороны (рожок к дороге, +z) и дальней (рожок к -z)
  const lampsNear = [-38, -25, -12, 2.5, 16, 29, 41];
  const lampsFar = [-31, -18, -5, 8, 21, 34];
  const addStreetLamp = (x, z, rot) => {
    const L = M.streetLamp();
    L.position.set(x, 0, z); L.rotation.y = rot;
    scene.add(L);
    L.updateMatrixWorld(true);
    const b = new THREE.Vector3(L.userData.bulb.x, L.userData.bulb.y, L.userData.bulb.z).applyMatrix4(L.matrixWorld);
    const lp = lamp(b.x, b.y, b.z, 'out', { color: 0xffd8a0, base: 58, kind: 'street', fixture: L });
    W.streetLights.push({ group: L, lamp: lp });
    return lp;
  };
  for (const x of lampsNear) addStreetLamp(x, 6.4, -Math.PI / 2);
  for (const x of lampsFar) addStreetLamp(x, 17.4, Math.PI / 2);

  // столбы
  for (const x of [-60, -33, 47]) at(M.utilityPole(8.8), x, 0, 19.6, 0);
  // машины у обочин и на подъездной дорожке
  const cars = [
    [-27, 9.0, 0, 0x2a3a4a], [-16, 9.1, 0, 0x6b1c1c], [18, 9.0, 0, 0x9aa0a6], [30, 9.1, 0, 0x101418], [-44, 9.0, 0, 0x4a5a2e],
    [-22, 15.0, Math.PI, 0x8a7a50], [6, 15.0, Math.PI, 0x23344a], [24, 15.1, Math.PI, 0x5b5b5b],
  ];
  for (const [x, z, ry, col] of cars) {
    at(M.car(col, 4.4), x, 0, z, ry);
    const alongX = Math.abs(Math.cos(ry)) > 0.5;
    coll(x - (alongX ? 2.2 : 0.9), x + (alongX ? 2.2 : 0.9), z - (alongX ? 0.9 : 2.2), z + (alongX ? 0.9 : 2.2), 'any');
  }
  coll(10.1, 11.9, 1.4, 5.8, 'any');
  for (const x of lampsNear) coll(x - 0.3, x + 0.3, 6.1, 6.7, 'any');
  for (const x of lampsFar) coll(x - 0.3, x + 0.3, 17.1, 17.7, 'any');
  for (const x of [-60, -33, 47]) coll(x - 0.3, x + 0.3, 19.3, 19.9, 'any');
  coll(15.9, 16.5, 5.5, 6.1, 'any'); coll(-16.5, -15.9, 5.5, 6.1, 'any');
  coll(-36.8, -35.2, 5.5, 6.5, 'any');
  for (const [x, z, h, r] of [[-30, 3.6, 8.2, 2.6]]) coll(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 'any');
  for (const [x, z] of [[-40, 5.4], [-19, 5.2], [-2, 4.8], [10, 5.5], [33, 5.2], [46, 5.4]]) coll(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 'any');
  coll(-8.4, -7.6, 5.2, 6.0, 'any');
  coll(-13.8, -12.2, 2.9, 3.9, 'any');
  coll(13.6, 14.8, 2.5, 3.6, 'any');
  at(M.car(0x5a1a1a, 4.4), 11.0, 0, 3.6, Math.PI / 2);
  // мусорный контейнер и мусор
  at(M.dumpster(), -36, 0, 6.0, 0);
  at(M.trashBags(4), -35, 0, 6.2, 0);
  at(M.binCan(), 6.4, 0, 6.0, 0);
  at(M.bench(), 26, 0, 6.1, Math.PI);
  // дальние дома: фон за туманом
  const farBlocks = [
    [-60, 22.0, 9, 9, 0x6b6e75], [-46, 23.8, 14, 11, 0x5c5a60], [-30, 24.0, 8, 10, 0x7d7470], [-16, 23.5, 10, 9, 0x655f5b],
    [-2, 24.5, 13, 10, 0x6e645c], [12, 23.0, 9, 8, 0x75706a], [26, 24.3, 12, 10, 0x5d5854], [40, 23.2, 8, 9, 0x6c6563], [54, 24.0, 13, 11, 0x626a72],
  ];
  for (const [x, z, w, h, col] of farBlocks) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 9), new THREE.MeshStandardMaterial({ map: MAT.facade.map, color: col, roughness: 0.9 }));
    b.position.set(x, h / 2, z + 4.5); b.castShadow = true; add(b);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.4, 9.5), MAT.roof);
    roof.position.set(x, h + 0.2, z + 4.5); add(roof);
    coll(x - w / 2, x + w / 2, z, z + 9.0, 'any');
  }
  // деревья улицы
  for (const [x, z] of [[-40, 5.4], [-19, 5.2], [-2, 4.8], [10, 5.5], [33, 5.2], [46, 5.4]]) at(M.tree(6.4, 1.8), x, 0, z, Math.random() * 6);
  for (const [x, z] of [[-48, 22], [-8, 26.5], [36, 26.2], [6, 29.5], [-28, 28.6]]) at(M.tree(7.4, 2.4), x, 0, z, Math.random() * 6);
  for (const [x, z] of [[-24, 19.2], [14, 19.4], [-6, 19.1], [36, 19.0]]) at(M.bush(0.8), x, 0, z, 0);

  // вывески/мусор/листья
  for (let i = 0; i < 6; i++) at(M.leaves(16, 3), -12 + i * 6, 0, 10.4 + (i % 2) * 2, 0);

  /* ============== ИНТЕРАКТИВ (uses) ============== */
  // пустая строка; выключатели уже добавлены через sw()
  W.roomOf = (x, z, level) => {
    if (x > -7.2 && x < 7.2 && z > -12.2 && z < 0.1) {
      for (const r of W.rooms) {
        if (r.level === level && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.name;
      }
      return level === 1 ? 'uhall' : 'hall';
    }
    if (x > -1.2 && x < 1.2 && z >= 0 && z < 1.9) return 'porch';
    return 'out';
  };
  return W;
}
