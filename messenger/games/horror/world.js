// Мир: двухэтажный дом, улица, дома вдали. Всё собирается кодом (models.js + materials.js).
// Дом: x[-7,7] z[-12,0]. Фасад и входная дверь на z=0 (к улице, +z).
// Первый этаж: пол 0, потолок 2.85. Второй: пол 3.0, потолок 5.85.
// Лестница: x[-1.6,-0.5], z от -2.2 (низ) до -6.7 (верх), 15 ступеней по 0.2 м.
import * as THREE from './vendor/three.module.js';
import { MAT } from './materials.js';
import * as M from './models.js';

const { G, bx, rb, cy, sp } = M;
const T = 0.2;                       // толщина стен (центр на линии плана)
const C0 = 2.85, F1 = 3.0, C1 = 5.85;
const ST = { x0: -1.6, x1: -0.5, z0: -6.7, z1: -2.2, n: 15, rise: 0.2, run: 0.3 };

/** Создаёт мир. Возвращает реестры: коллайдеры, лампы, двери, интерактив, лужи, комнаты. */
export function buildWorld(scene) {
  const W = {
    colliders: [], lamps: [], doors: [], uses: [], puddles: [], rooms: [],
    stairs: ST, streetLights: [], faucets: [], tvScreen: null, tvOn: false,
  };
  const DOOR_HOLES = [];                // проёмы дверей для плинтусов
  const add = (o) => { scene.add(o); return o; };
  const coll = (x0, x1, z0, z1, band = 'any') => { W.colliders.push({ x0, x1, z0, z1, band, door: null }); };
  const fc = (cx, cz, hx, hz, lv) => coll(cx - hx, cx + hx, cz - hz, cz + hz, lv);   // мебель: прямоугольник в плане
  const at = (obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); return obj; };
  const room = (name, x0, x1, z0, z1, level) => W.rooms.push({ name, x0, x1, z0, z1, level });

  /* ---------- стены с проёмами ---------- */
  // axis 'x': стена вдоль x при z=c; axis 'z': вдоль z при x=c.
  // holes: {a0,a1,y0,y1,type:'door'|'win',sw,open,shutters,curtain}. ls — знак «внутрь» (для отделки и штор).
  function wall({ axis, c, a0, a1, yb, yt, holes = [], mat, band, lin = null, ls = 0 }) {
    const sorted = holes.slice().sort((p, q) => p.a0 - q.a0);
    const parts = []; let cur = a0;
    for (const h of sorted) {
      if (h.a0 > cur) parts.push({ s0: cur, s1: h.a0 });
      parts.push({ s0: h.a0, s1: h.a1, hole: h });
      cur = h.a1;
    }
    if (cur < a1) parts.push({ s0: cur, s1: a1 });

    // кусок стены (и, если нужно, облицовка с внутренней стороны)
    const piece = (s0, s1, y0, y1, m) => {
      if (y1 - y0 <= 0.001 || s1 - s0 <= 0.001) return;
      const len = s1 - s0, mid = (s0 + s1) / 2, ym = (y0 + y1) / 2, h = y1 - y0;
      if (axis === 'x') bx(len, h, T, m, mid, ym, c, scene, 1.5);
      else bx(T, h, len, m, c, ym, mid, scene, 1.5);
      if (lin && ls) {
        const off = ls * (T / 2 + 0.006);
        if (axis === 'x') bx(len, h, 0.012, lin, mid, ym, c + off, scene, 1.5);
        else bx(0.012, h, len, lin, c + off, ym, mid, scene, 1.5);
      }
    };
    const addWallColl = (s0, s1, band2) => {
      if (axis === 'x') coll(s0, s1, c - T / 2, c + T / 2, band2); else coll(c - T / 2, c + T / 2, s0, s1, band2);
    };

    for (const p of parts) {
      if (!p.hole) { piece(p.s0, p.s1, yb, yt, mat); addWallColl(p.s0, p.s1, band); continue; }
      const h = p.hole;
      if (h.type === 'door') {
        const fy = band === 1 ? F1 : 0;       // пол этажа; у дверей высоты проёма относительно пола
        piece(p.s0, p.s1, fy + 2.1, yt, mat);  // перемычка над проёмом
        DOOR_HOLES.push({ axis, c, a0: p.s0, a1: p.s1 });
        // наличники: по обе стороны стены, чуть выступают
        const cw = 0.075, face = T / 2 + 0.012;
        for (const sgn of [-1, 1]) {
          const f = c + sgn * face;
          const jambs = [p.s0 - cw / 2, p.s1 + cw / 2];
          for (const jx of jambs) {
            if (axis === 'x') bx(cw, 2.14, 0.024, MAT.paintTrim, jx, fy + 1.07, f, scene);
            else bx(0.024, 2.14, cw, MAT.paintTrim, f, fy + 1.07, jx, scene);
          }
          const lw = p.s1 - p.s0 + 2 * cw;
          if (axis === 'x') bx(lw, cw, 0.024, MAT.paintTrim, (p.s0 + p.s1) / 2, fy + 2.14 + cw / 2, f, scene);
          else bx(0.024, cw, lw, MAT.paintTrim, f, fy + 2.14 + cw / 2, (p.s0 + p.s1) / 2, scene);
        }
        // полотно двери
        const w = p.s1 - p.s0;
        const pivot = G();
        if (axis === 'x') { pivot.position.set(p.s0, fy, c); pivot.rotation.y = 0; }
        else { pivot.position.set(c, fy, p.s0); pivot.rotation.y = -Math.PI / 2; }
        pivot.add(M.doorUnit(w, 2.1, MAT.door));
        scene.add(pivot);
        const cr = axis === 'x'
          ? { x0: p.s0, x1: p.s1, z0: c - 0.1, z1: c + 0.1 }
          : { x0: c - 0.1, x1: c + 0.1, z0: p.s0, z1: p.s1 };
        const d = {
          pivot, base: pivot.rotation.y, swing: h.sw || 1, target: 0, cur: 0, level: band === 1 ? 1 : 0, axis, c, a0: p.s0, a1: p.s1,
        };
        W.doors.push(d);
        W.colliders.push({ x0: cr.x0, x1: cr.x1, z0: cr.z0, z1: cr.z1, band, door: d });
        W.uses.push({
          x: axis === 'x' ? (p.s0 + p.s1) / 2 : c, y: (band === 1 ? F1 : 0) + 1.1,
          z: axis === 'x' ? c : (p.s0 + p.s1) / 2, label: 'дверь', dist: 1.9, door: d,
        });
      } else {
        // окно: под и над ним — стена, в проёме — рама и стекло; ставни и шторы
        piece(p.s0, p.s1, yb, h.y0, mat);
        piece(p.s0, p.s1, h.y1, yt, mat);
        addWallColl(p.s0, p.s1, band);
        const w = p.s1 - p.s0, hh = h.y1 - h.y0, ymid = (h.y0 + h.y1) / 2, cm = (p.s0 + p.s1) / 2;
        const win = M.windowUnit(w, hh);
        if (axis === 'x') at(win, cm, ymid, c, 0); else at(win, c, ymid, cm, Math.PI / 2);
        if (h.shutters) {
          const sh = M.shutterPair(w, hh);
          if (axis === 'x') at(sh, cm, ymid, c, 0); else at(sh, c, ymid, cm, Math.PI / 2);
        }
        if (h.curtain && ls) {
          const off = c + ls * (T / 2 + 0.085);
          const cwid = 0.3;
          for (const side of [-1, 1]) {
            const pos = side < 0 ? p.s0 - 0.14 : p.s1 + 0.14;
            const curt = hh + 0.42;
            if (axis === 'x') bx(cwid, curt, 0.03, MAT.curtain, pos, ymid - 0.02, off, scene);
            else bx(0.03, curt, cwid, MAT.curtain, off, ymid - 0.02, pos, scene);
          }
          const rodLen = w + 0.9;
          const rod = cy(0.011, 0.011, rodLen, MAT.chrome, 0, 0, 0, scene, 8);
          rod.position.set(axis === 'x' ? cm : off, h.y1 + 0.24, axis === 'x' ? off : cm);
          if (axis === 'x') rod.rotation.z = Math.PI / 2; else rod.rotation.x = Math.PI / 2;
        }
        W.windows = W.windows || [];
        W.windows.push({ x: axis === 'x' ? cm : c, z: axis === 'x' ? c : cm, y: ymid });
      }
    }
  }

  // Плинтус и карниз по периметру комнаты (без проёмов дверей).
  function trimRoom(r) {
    const { x0, x1, z0, z1, y0, y1 } = r;
    const sides = [
      { axis: 'x', c: z0, a0: x0, a1: x1, s: 1 }, { axis: 'x', c: z1, a0: x0, a1: x1, s: -1 },
      { axis: 'z', c: x0, a0: z0, a1: z1, s: 1 }, { axis: 'z', c: x1, a0: z0, a1: z1, s: -1 },
    ];
    for (const sd of sides) {
      let segs = [[sd.a0, sd.a1]];
      for (const h of DOOR_HOLES) {
        if (h.axis !== sd.axis || Math.abs(h.c - sd.c) > 0.01) continue;
        const nxt = [];
        for (const [s0, s1] of segs) {
          const q0 = h.a0 - 0.07, q1 = h.a1 + 0.07;
          if (q1 <= s0 || q0 >= s1) { nxt.push([s0, s1]); continue; }
          if (q0 > s0) nxt.push([s0, q0]);
          if (q1 < s1) nxt.push([q1, s1]);
        }
        segs = nxt;
      }
      for (const [s0, s1] of segs) {
        const len = s1 - s0;
        if (len <= 0.05) continue;
        const mid = (s0 + s1) / 2;
        const fb = sd.c + sd.s * (T / 2 + 0.008);
        const fc = sd.c + sd.s * (T / 2 + 0.03);
        if (sd.axis === 'x') {
          bx(len, 0.1, 0.016, MAT.paintWhite, mid, y0 + 0.05, fb, scene);
          bx(len, 0.14, 0.06, MAT.paintCream, mid, y1 - 0.07, fc, scene);
        } else {
          bx(0.016, 0.1, len, MAT.paintWhite, fb, y0 + 0.05, mid, scene);
          bx(0.06, 0.14, len, MAT.paintCream, fc, y1 - 0.07, mid, scene);
        }
      }
    }
  }

  // Пол/потолок-плитка с UV в метрах
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

  // Лампа: регистрируем, клонируем материалы свечения, чтобы гасить каждую отдельно.
  function lamp(x, y, z, roomName, { color = 0xffd9a0, base = 6, kind = 'ceil', fixture = null, level = 0 } = {}) {
    const L = { x, y, z, room: roomName, color, base, kind, glow: [], on: true, cur: 1, flick: 0, level };
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
    W.lamps.push(L);
    return L;
  }
  // Бра: ry — направление нормали стены (в комнату).
  function wallLamp(x, y, z, ry, roomName, color, base, level = 0) {
    const f = at(M.sconce(), x, y, z, ry);
    return lamp(x + Math.sin(ry) * 0.1, y + 0.15, z + Math.cos(ry) * 0.1, roomName, { color, base, fixture: f, kind: 'wall', level });
  }
  // Потолочный плафон: yc — крепление к потолку.
  function ceilLamp(x, yc, z, roomName, color, base, level) {
    const f = G(x, yc, z); scene.add(f);
    f.add(M.ceilingDrum(0.22));
    return lamp(x, yc - 0.22, z, roomName, { color, base, fixture: f, level, kind: 'ceil' });
  }
  function tableLamp(x, y, z, roomName, color = 0xffb36b, base = 1.4, level = 0) {
    const g = G(x, y, z); scene.add(g);
    cy(0.07, 0.08, 0.02, MAT.darkMetal, 0, 0.01, 0, g, 18);
    cy(0.012, 0.012, 0.36, MAT.brass, 0, 0.19, 0, g, 8);
    cy(0.1, 0.17, 0.24, MAT.lampShade, 0, 0.36, 0, g, 24);
    sp(0.03, MAT.bulb, 0, 0.3, 0, g);
    return lamp(x, y + 0.3, z, roomName, { color, base, fixture: g, level, kind: 'table' });
  }
  // Выключатель: (x,y,z) — центр пластины на стене, rotY — направление нормали в комнату.
  function sw(x, y, z, rotY, roomName) {
    const g = G(x, y, z); scene.add(g);
    rb(0.09, 0.13, 0.014, MAT.paintWhite, 0, 0, 0, g, 0.01);
    cy(0.012, 0.012, 0.016, MAT.paintTrim, 0, 0, 0.008, g, 8).rotation.x = Math.PI / 2;
    g.rotation.y = rotY;
    W.uses.push({ x, y, z, label: 'свет', dist: 1.6, switchRoom: roomName });
  }
  W.toggleRoom = (roomName) => {
    const group = W.lamps.filter((l) => l.room === roomName);
    const on = !group.some((l) => l.on);
    for (const l of group) { l.on = on; l.flick = on ? 0.5 : 0; }
    return on;
  };
  // Кран: интерактив + точка для звука воды
  function tap(x, y, z, id, label = 'кран: вода') {
    W.faucets.push({ x, y, z, id });
    W.uses.push({ x, y, z, label, dist: 1.6, fn: () => W.faucetToggle(id) });
  }
  // Общий декор: розетка у пола
  function socket(x, y, z, ry) {
    const g = G(x, y, z); scene.add(g);
    rb(0.08, 0.12, 0.012, MAT.paintWhite, 0, 0, 0, g, 0.008);
    g.rotation.y = ry;
  }

  /* ================================================================
     ПЕРВЫЙ ЭТАЖ
     ================================================================ */
  // Полы первого этажа
  floor(-7, -1.6, -6.5, 0, 0.002, MAT.woodFloor, 1.5);      // гостиная: паркет
  floor(-7, -1.6, -12, -6.5, 0.002, MAT.carpet, 1.5);        // столовая: ковролин
  floor(1.6, 7, -6.5, 0, 0.002, MAT.tile, 0.6);              // кухня: плитка
  floor(1.6, 3.4, -12, -6.5, 0.002, MAT.tile, 0.6);          // санузел
  floor(3.4, 7, -12, -6.5, 0.002, MAT.tile, 0.6);            // подсобка
  floor(-1.6, 1.6, -12, 0, 0.002, MAT.woodFloor, 1.5);       // прихожая
  room('hall', -1.6, 1.6, -12, 0, 0);
  room('living', -7, -1.6, -6.5, 0, 0);
  room('dining', -7, -1.6, -12, -6.5, 0);
  room('kitchen', 1.6, 7, -6.5, 0, 0);
  room('wc', 1.6, 3.4, -12, -6.5, 0);
  room('util', 3.4, 7, -12, -6.5, 0);

  // Внешние стены первого этажа (кирпич снаружи, отделка внутри)
  wall({ axis: 'x', c: 0, a0: -7, a1: 7, yb: 0, yt: C0, mat: MAT.brick, band: 0, lin: MAT.wallpaperCream, ls: -1, holes: [
    { a0: -0.55, a1: 0.55, y0: 0, y1: 2.1, type: 'door', sw: 1 },
    { a0: -5.05, a1: -3.55, y0: 0.9, y1: 2.4, type: 'win', shutters: true, curtain: true },
    { a0: 3.65, a1: 5.15, y0: 0.9, y1: 2.4, type: 'win', shutters: true, curtain: true },
  ] });
  wall({ axis: 'x', c: -12, a0: -7, a1: 7, yb: 0, yt: C0, mat: MAT.brick, band: 0, lin: MAT.wallpaperCream, ls: 1, holes: [
    { a0: -6.8, a1: -5.6, y0: 0.9, y1: 2.3, type: 'win', shutters: true, curtain: true },
    { a0: 2.25, a1: 2.75, y0: 1.5, y1: 2.2, type: 'win' },
    { a0: 5.1, a1: 6.1, y0: 0.9, y1: 2.2, type: 'win', shutters: true, curtain: true },
  ] });
  wall({ axis: 'z', c: -7, a0: -12, a1: 0, yb: 0, yt: C0, mat: MAT.brick, band: 0, lin: MAT.wallpaper, ls: 1, holes: [
    { a0: -10.2, a1: -8.8, y0: 0.9, y1: 2.3, type: 'win', shutters: true, curtain: true },
  ] });
  wall({ axis: 'z', c: 7, a0: -12, a1: 0, yb: 0, yt: C0, mat: MAT.brick, band: 0, lin: MAT.tile, ls: -1, holes: [
    { a0: -10.2, a1: -8.8, y0: 0.9, y1: 2.3, type: 'win', shutters: true, curtain: true },
  ] });

  // Внутренние стены первого этажа
  // x=-1.6: гостиная/столовая | прихожая. Двери: гостиная z[-1.7,-0.5], столовая z[-9.5,-8.3]
  wall({ axis: 'z', c: -1.6, a0: -12, a1: 0, yb: 0, yt: C0, mat: MAT.plaster, band: 0, holes: [
    { a0: -1.7, a1: -0.5, y0: 0, y1: 2.1, type: 'door', sw: -1 },
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  // x=1.6: прихожая | кухня (z[-1.8,-0.6]) и санузел (z[-9.5,-8.3])
  wall({ axis: 'z', c: 1.6, a0: -12, a1: 0, yb: 0, yt: C0, mat: MAT.plaster, band: 0, holes: [
    { a0: -1.8, a1: -0.6, y0: 0, y1: 2.1, type: 'door', sw: 1 },
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: 1 },
  ] });
  // z=-6.5: гостиная | столовая (дверь x[-4.8,-3.8]); кухня | подсобка (x[4.55,5.45]); кухня | санузел — глухо
  wall({ axis: 'x', c: -6.5, a0: -7, a1: -1.6, yb: 0, yt: C0, mat: MAT.plaster, band: 0, holes: [
    { a0: -4.8, a1: -3.8, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  wall({ axis: 'x', c: -6.5, a0: 1.6, a1: 7, yb: 0, yt: C0, mat: MAT.plaster, band: 0, holes: [
    { a0: 4.55, a1: 5.45, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  // x=3.4: санузел | подсобка — глухо
  wall({ axis: 'z', c: 3.4, a0: -12, a1: -6.5, yb: 0, yt: C0, mat: MAT.plaster, band: 0 });

  // Лестница: ступени у западной стены холла, рейка с восточной стороны.
  {
    const stepLen = ST.run;
    const width = ST.x1 - ST.x0;
    for (let i = 0; i < ST.n; i++) {
      const zc = ST.z1 - stepLen * (i + 0.5);
      const h = ST.rise * (i + 1);
      bx(width, h, stepLen, MAT.oak, (ST.x0 + ST.x1) / 2, h / 2, zc, scene, 1.2);
    }
    // боковина (тетива) под ступенями с восточной стороны
    const len = Math.hypot(ST.z1 - ST.z0, 3.0);
    const ang = Math.atan2(3.0, ST.z1 - ST.z0);
    const stringer = bx(0.04, 0.22, len, MAT.walnut, ST.x1 - 0.02, 1.4, (ST.z0 + ST.z1) / 2, scene);
    stringer.rotation.x = ang;
    // поручень и стойки
    const rail = bx(0.05, 0.05, len, MAT.walnut, ST.x1 - 0.04, 2.4, (ST.z0 + ST.z1) / 2, scene);
    rail.rotation.x = ang;
    for (let i = 0; i < ST.n; i += 2) {
      const zc = ST.z1 - stepLen * (i + 0.5);
      const h = ST.rise * (i + 1);
      bx(0.04, 0.95, 0.04, MAT.walnut, ST.x1 - 0.04, h + 0.47, zc, scene);
    }
  }

  // Полоса перед нижней площадкой: на первом этаже подняться можно только с юга (со стороны лестницы).
  coll(ST.x0, ST.x1, ST.z0 - 0.3, ST.z0, 0);

  // Перекрытие: низ — потолок первого этажа, верх — пол второго; проём под лестницу
  const slabY = (C0 + F1) / 2, slabH = F1 - C0;
  for (const [x0, x1, z0, z1] of [[-7, 7, -12, ST.z0], [-7, ST.x0, ST.z0, 0], [ST.x1, 7, ST.z0, 0], [ST.x0, ST.x1, ST.z1, 0]]) {
    bx(x1 - x0, slabH, z1 - z0, MAT.plaster, (x0 + x1) / 2, slabY, (z0 + z1) / 2, scene, 1.5);
  }

  // --- гостиная ---
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.55), MAT.tvScreen.clone());
  tvScreen.material.emissive = new THREE.Color(0x1c3650); tvScreen.material.emissiveIntensity = 0;
  tvScreen.position.set(-6.66, 0.85, -3.2); tvScreen.rotation.y = Math.PI / 2; add(tvScreen);
  W.tvScreen = tvScreen;
  at(M.tvStand(1.6), -6.7, 0, -3.2, Math.PI / 2);
  W.uses.push({ x: -6.5, y: 1.0, z: -3.2, label: 'телевизор', dist: 1.8, fn: () => {
    W.tvOn = !W.tvOn; tvScreen.material.emissiveIntensity = W.tvOn ? 0.9 : 0; W.tvClick && W.tvClick();
  } });
  at(M.sofa(), -4.2, 0, -3.2, Math.PI);
  at(M.coffeeTable(1.1, 0.6), -5.3, 0, -3.2, 0);
  at(M.rug(3.3, 3.0, 0x6f2d25), -5.0, 0.0, -3.0);
  at(M.bookshelf(1.2, 2.1, 0.35), -2.3, 0, -6.22, 0);
  at(M.picture(0.7, 0.5), -5.4, 1.7, -6.42, 0);
  const fl = at(M.floorLamp(), -6.3, 0, -0.6, 0);
  lamp(-6.3, 1.45, -0.6, 'living', { color: 0xffb36b, base: 2.4, kind: 'floor', fixture: fl });
  at(M.plant(1.2), -6.5, 0, -5.9, 0);
  ceilLamp(-4.2, C0, -3.2, 'living', 0xffdcaa, 5.5, 0);
  sw(-1.71, 1.2, -0.25, -Math.PI / 2, 'living');

  // --- столовая ---
  at(M.diningTable(1.6, 0.9), -4.3, 0, -9.2, 0);
  for (const x of [-5.1, -4.3, -3.5]) { at(M.chair(), x, 0, -8.1, Math.PI); at(M.chair(), x, 0, -10.3, 0); }
  at(M.dresser(1.8, 0.48, 0.9), -4.3, 0, -11.65, 0);
  at(M.plant(1.0), -6.5, 0, -11.0, 0);
  {
    const f = at(M.pendant(0.5), -4.3, C0, -9.2, 0);
    lamp(-4.3, C0 - 0.7, -9.2, 'dining', { color: 0xffc27a, base: 5.0, fixture: f });
  }
  sw(-1.71, 1.2, -11.0, -Math.PI / 2, 'dining');

  // --- кухня ---
  // столешка и корпуса: вырез под раковину на локальной x = 0.8 (мир z = -2.4)
  at(M.kitchenBase(4.4, 0.8), 6.62, 0, -3.2, -Math.PI / 2);
  at(M.kitchenWall(3.8), 6.73, 1.8, -3.5, -Math.PI / 2);
  at(M.sinkUnit({ vanity: false, tapZ: -0.3 }), 6.62, 0, -2.4, -Math.PI / 2);
  at(M.stove(), 3.6, 0, -6.22, 0);            // свободно стоящая плита у северной стены кухни
  at(M.fridge(), 6.55, 0, -5.84, -Math.PI / 2);
  at(M.kitchenBase(1.8), 4.4, 0, -3.5, 0);
  sp(0.12, MAT.steel, 4.1, 0.97, -3.3, scene, 1, 0.9, 1);
  cy(0.14, 0.12, 0.18, MAT.steel, 4.6, 0.99, -3.2, scene, 14);
  ceilLamp(4.4, C0, -4.2, 'kitchen', 0xf1f5ff, 5.5, 0);
  lamp(6.5, 1.5, -3.0, 'kitchen', { color: 0xfff1d6, base: 1.2, kind: 'under' });
  sw(1.71, 1.2, -0.3, Math.PI / 2, 'kitchen');
  tap(6.42, 1.0, -2.4, 'kitchen');

  // --- санузел первого этажа ---
  at(M.toilet(), 2.5, 0, -11.6, Math.PI);
  at(M.sinkUnit({ vanity: true, tapZ: -0.2 }), 3.05, 0, -8.6, -Math.PI / 2);
  tap(3.25, 0.9, -8.6, 'wc');
  ceilLamp(2.5, C0, -9.5, 'wc', 0xf1f5ff, 4.2, 0);
  sw(1.71, 1.2, -7.8, Math.PI / 2, 'wc');
  socket(1.71, 0.35, -11.0, Math.PI / 2);

  // --- подсобка ---
  rb(0.6, 0.85, 0.6, MAT.steel, 6.0, 0.43, -11.4, scene, 0.04);
  for (let i = 0; i < 3; i++) bx(0.5, 0.35, 0.45, MAT.oak, 3.7, 0.2 + i * 0.5, -9.4 - i * 0.12, scene, 0.5);
  ceilLamp(5.2, C0, -9.2, 'util', 0xf4f8ff, 4.8, 0);
  sw(3.51, 1.2, -7.4, Math.PI / 2, 'util');

  // --- прихожая первого этажа ---
  at(M.coatRack(), 0.8, 0, -10.6, 0);
  at(M.rug(1.2, 2.0, 0x3e2c25), 0.9, 0, -3.0, 0);
  at(M.mirror(0.7, 1.1), 1.51, 1.5, -4.6, -Math.PI / 2);
  ceilLamp(0.6, C0, -1.6, 'hall', 0xffd9a0, 5.5, 0);
  ceilLamp(0.6, C0, -9.6, 'hall', 0xffd9a0, 5.5, 0);
  wallLamp(-1.51, 1.9, -11.0, Math.PI / 2, 'hall', 0xffd9a0, 2.5, 0);
  sw(1.51, 1.2, -0.3, -Math.PI / 2, 'hall');
  at(M.radiator(1.0), -1.45, 0.1, -10.6, Math.PI / 2);

  /* ================================================================
     ВТОРОЙ ЭТАЖ
     ================================================================ */
  floor(-7, -1.6, -6.5, 0, F1 + 0.002, MAT.carpet, 1.5);       // спальня (ковёр)
  floor(-7, -1.6, -12, -6.5, F1 + 0.002, MAT.woodFloor, 1.5);  // детский кабинет
  floor(-1.6, 1.6, -12, ST.z0, F1 + 0.002, MAT.woodFloor, 1.5); // верхний холл, площадка лестницы
  floor(-0.5, 1.6, ST.z0, 0, F1 + 0.002, MAT.woodFloor, 1.5);    // холл справа от ступеней
  floor(-1.6, -0.5, ST.z1, 0, F1 + 0.002, MAT.woodFloor, 1.5);   // холл у входа в спальню
  floor(1.6, 4.4, -12, -6.5, F1 + 0.002, MAT.tile, 0.6);       // ванная
  floor(1.6, 7, -6.5, 0, F1 + 0.002, MAT.carpet, 1.5);         // гостевая
  floor(4.4, 7, -12, -6.5, F1 + 0.002, MAT.woodFloor, 1.5);    // кабинет
  ceilingPlane(-7, 7, -12, 0, C1, MAT.plaster);
  room('uhall', -1.6, 1.6, -12, 0, 1);
  room('master', -7, -1.6, -6.5, 0, 1);
  room('kids', -7, -1.6, -12, -6.5, 1);
  room('ubath', 1.6, 4.4, -12, -6.5, 1);
  room('guest', 1.6, 7, -6.5, 0, 1);
  room('study', 4.4, 7, -12, -6.5, 1);

  // Внешние стены второго этажа (окрашенный сайдинг снаружи, штукатурка внутри)
  wall({ axis: 'x', c: 0, a0: -7, a1: 7, yb: F1, yt: C1, mat: MAT.paintCream, band: 1, lin: MAT.plaster, ls: -1, holes: [
    { a0: -4.9, a1: -3.6, y0: 3.8, y1: 5.2, type: 'win', shutters: true, curtain: true },
    { a0: 4.9, a1: 6.2, y0: 3.8, y1: 5.2, type: 'win', shutters: true, curtain: true },
  ] });
  wall({ axis: 'x', c: -12, a0: -7, a1: 7, yb: F1, yt: C1, mat: MAT.paintCream, band: 1, lin: MAT.plaster, ls: 1, holes: [
    { a0: -4.9, a1: -3.6, y0: 3.8, y1: 5.2, type: 'win', shutters: true, curtain: true },
    { a0: 2.6, a1: 3.4, y0: 4.2, y1: 5.3, type: 'win' },
    { a0: 5.3, a1: 6.3, y0: 3.8, y1: 5.2, type: 'win', shutters: true, curtain: true },
  ] });
  wall({ axis: 'z', c: -7, a0: -12, a1: 0, yb: F1, yt: C1, mat: MAT.paintCream, band: 1, lin: MAT.plaster, ls: 1, holes: [
    { a0: -4.6, a1: -3.2, y0: 3.8, y1: 5.2, type: 'win', shutters: true, curtain: true },
  ] });
  wall({ axis: 'z', c: 7, a0: -12, a1: 0, yb: F1, yt: C1, mat: MAT.paintCream, band: 1, lin: MAT.plaster, ls: -1 });

  // Внутренние стены второго этажа
  // x=-1.6: спальня (z[-1.7,-0.5]) и детская (z[-9.5,-8.3]) — проёмы
  wall({ axis: 'z', c: -1.6, a0: -12, a1: 0, yb: F1, yt: C1, mat: MAT.plaster, band: 1, holes: [
    { a0: -1.7, a1: -0.5, y0: 0, y1: 2.1, type: 'door', sw: -1 },
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: -1 },
  ] });
  // x=1.6: санузел (z[-9.5,-8.3]) и гостевая (z[-1.8,-0.6])
  wall({ axis: 'z', c: 1.6, a0: -12, a1: 0, yb: F1, yt: C1, mat: MAT.plaster, band: 1, holes: [
    { a0: -9.5, a1: -8.3, y0: 0, y1: 2.1, type: 'door', sw: 1 },
    { a0: -1.8, a1: -0.6, y0: 0, y1: 2.1, type: 'door', sw: 1 },
  ] });
  wall({ axis: 'x', c: -6.5, a0: -7, a1: -1.6, yb: F1, yt: C1, mat: MAT.plaster, band: 1 });
  wall({ axis: 'x', c: -6.5, a0: 1.6, a1: 7, yb: F1, yt: C1, mat: MAT.plaster, band: 1, holes: [
    { a0: 5.25, a1: 6.15, y0: 0, y1: 2.1, type: 'door', sw: 1 },
  ] });
  wall({ axis: 'z', c: 4.4, a0: -12, a1: -6.5, yb: F1, yt: C1, mat: MAT.plaster, band: 1 });

  // --- спальня ---
  at(M.bed(2.0, 1.8), -3.9, F1, -5.5, Math.PI);
  at(M.nightstand(), -5.4, F1, -6.18, 0);
  at(M.nightstand(), -2.4, F1, -6.18, 0);
  tableLamp(-5.4, F1 + 0.58, -6.18, 'master', 0xffb36b, 1.6, 1);
  tableLamp(-2.4, F1 + 0.58, -6.18, 'master', 0xffb36b, 1.6, 1);
  at(M.wardrobe(1.3, 2.2, 0.6), -6.6, F1, -1.2, Math.PI / 2);
  at(M.rug(2.2, 1.6, 0x4a3a33), -3.7, F1, -2.8, 0);
  at(M.plant(0.9), -6.5, F1, -5.4, 0);
  ceilLamp(-4.3, C1, -3.0, 'master', 0xffd9a0, 4.5, 1);
  sw(-1.71, F1 + 1.2, -0.25, -Math.PI / 2, 'master');

  // --- детский кабинет ---
  at(M.desk(1.2, 0.6), -4.0, F1, -11.7, 0);
  at(M.chair(), -4.0, F1, -10.6, Math.PI);
  at(M.bookshelf(1.2, 2.0, 0.35), -6.7, F1, -9.0, Math.PI / 2);
  tableLamp(-4.4, F1 + 0.76, -11.9, 'kids', 0xffc68a, 1.4, 1);
  at(M.rug(2.0, 1.4, 0x3d4a4a), -4.0, F1, -8.6, 0);
  ceilLamp(-4.3, C1, -9.2, 'kids', 0xffe0b8, 4.5, 1);
  sw(-1.71, F1 + 1.2, -10.8, -Math.PI / 2, 'kids');

  // --- ванная наверху ---
  at(M.bathtub(), 3.0, F1, -11.53, 0);
  at(M.toilet(), 4.05, F1, -8.4, Math.PI / 2);
  at(M.sinkUnit({ vanity: true, tapZ: -0.2 }), 2.4, F1, -6.9, Math.PI);
  tap(2.4, F1 + 0.9, -6.7, 'ubath');
  at(M.mirror(0.9, 0.9), 2.4, F1 + 1.5, -6.62, Math.PI);
  ceilLamp(2.6, C1, -10.0, 'ubath', 0xf1f5ff, 4.8, 1);
  sw(1.71, F1 + 1.2, -7.8, Math.PI / 2, 'ubath');
  at(M.radiator(0.8), 4.2, F1 + 0.02, -10.0, -Math.PI / 2);

  // --- гостевая ---
  at(M.bed(2.0, 1.8), 6.0, F1, -3.2, Math.PI / 2);
  at(M.nightstand(), 6.68, F1, -4.9, Math.PI / 2);
  tableLamp(6.68, F1 + 0.58, -4.9, 'guest', 0xffb36b, 1.6, 1);
  at(M.dresser(1.2, 0.5, 0.9), 2.0, F1, -5.4, Math.PI / 2);
  at(M.rug(2.0, 1.6, 0x5a3f36), 3.8, F1, -3.0, 0);
  at(M.plant(0.9), 6.5, F1, -0.9, 0);
  at(M.picture(0.6, 0.45), 3.8, F1 + 1.6, -0.1, Math.PI);
  ceilLamp(4.3, C1, -3.2, 'guest', 0xffdcaa, 4.5, 1);
  sw(1.71, F1 + 1.2, -0.3, Math.PI / 2, 'guest');
  sw(6.4, F1 + 1.2, -6.59, Math.PI, 'study');

  // --- кабинет ---
  at(M.desk(1.0, 0.55), 5.7, F1, -11.72, 0);
  at(M.chair(), 5.7, F1, -10.7, Math.PI);
  at(M.bookshelf(1.2, 2.0, 0.35), 6.72, F1, -9.0, -Math.PI / 2);
  tableLamp(5.1, F1 + 0.76, -11.9, 'study', 0xffc68a, 1.4, 1);
  ceilLamp(5.7, C1, -9.0, 'study', 0xffe0b8, 4.0, 1);

  // --- верхний холл ---
  at(M.rug(1.4, 2.2, 0x3e2c25), 0.6, F1, -4.5, 0);
  at(M.plant(1.0), 0.9, F1, -10.9, 0);
  ceilLamp(0.6, C1, -2.5, 'uhall', 0xffd9a0, 5.5, 1);
  ceilLamp(0.6, C1, -9.0, 'uhall', 0xffd9a0, 5.5, 1);
  wallLamp(-1.51, F1 + 1.2, -11.0, Math.PI / 2, 'uhall', 0xffd9a0, 2.5, 1);
  sw(-1.51, F1 + 1.2, -0.3, Math.PI / 2, 'uhall');

  // Коллизии мебели (прямоугольники в плане, по этажам)
  fc(-4.2, -3.2, 0.55, 1.1, 0);      // диван
  fc(-5.3, -3.2, 0.55, 0.3, 0);      // журнальный столик
  fc(-6.7, -3.2, 0.25, 0.8, 0);      // тумба ТВ
  fc(-4.3, -9.2, 0.8, 0.45, 0);      // обеденный стол
  fc(-4.3, -11.65, 0.9, 0.26, 0);    // комод столовой
  fc(-2.3, -6.3, 0.6, 0.2, 0);       // стеллаж гостиной
  fc(6.62, -3.2, 0.3, 2.2, 0);       // кухонная линия у восточной стены
  fc(4.4, -3.5, 0.9, 0.3, 0);        // остров
  fc(6.55, -5.84, 0.36, 0.35, 0);    // холодильник
  fc(3.6, -6.22, 0.38, 0.31, 0);     // плита
  fc(2.5, -11.5, 0.2, 0.35, 0);      // унитаз (первый этаж)
  fc(3.05, -8.6, 0.28, 0.25, 0);     // тумба с раковиной (первый этаж)
  fc(6.0, -11.4, 0.3, 0.3, 0);       // стиральная машина
  fc(-3.9, -5.5, 1.0, 0.9, 1);       // кровать хозяйской
  fc(-5.4, -6.18, 0.25, 0.22, 1);    // тумбочка
  fc(-2.4, -6.18, 0.25, 0.22, 1);    // тумбочка
  fc(-6.6, -1.2, 0.3, 0.65, 1);      // шкаф
  fc(-4.0, -11.7, 0.6, 0.3, 1);      // письменный стол детской
  fc(-6.7, -9.0, 0.18, 0.6, 1);      // стеллаж детской
  fc(3.0, -11.5, 0.85, 0.37, 1);     // ванна
  fc(4.05, -8.4, 0.22, 0.36, 1);     // унитаз (второй этаж)
  fc(2.4, -6.9, 0.28, 0.25, 1);      // тумба с раковиной (второй этаж)
  fc(6.0, -3.2, 0.9, 1.0, 1);        // кровать гостевой
  fc(6.68, -4.9, 0.22, 0.25, 1);     // тумбочка гостевой
  fc(2.0, -5.4, 0.26, 0.6, 1);       // комод гостевой
  fc(5.7, -11.72, 0.5, 0.28, 1);     // стол кабинета
  fc(6.72, -9.0, 0.18, 0.6, 1);      // стеллаж кабинета
  // Плинтусы и карнизы комнат
  for (const r of W.rooms) {
    if (['hall', 'uhall'].includes(r.name)) continue;
    trimRoom({ ...r, y0: r.level ? F1 : 0, y1: r.level ? C1 : C0 });
  }

  /* ================================================================
     ЭКСТЕРЬЕР ДОМА
     ================================================================ */
  // Крыша: два ската по 18°, фронтоны, свесы, водосток
  const roofAng = Math.atan2(2.35, 7.2), roofW = Math.hypot(7.2, 2.35);
  for (const s of [-1, 1]) {
    const r = bx(roofW, 0.22, 12.8, MAT.roof, s * 3.6, 5.95 + 1.175, -6.0, scene, 1.0);
    r.rotation.z = -s * roofAng;
  }
  for (const zc of [0.12, -12.12]) {
    const sh = new THREE.Shape();
    sh.moveTo(-7.2, 5.9); sh.lineTo(7.2, 5.9); sh.lineTo(0, 8.3); sh.lineTo(-7.2, 5.9);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false });
    const m = new THREE.Mesh(geo, MAT.paintCream);
    m.position.z = zc - 0.1; m.castShadow = true; m.receiveShadow = true; scene.add(m);
  }
  for (const s of [-1, 1]) at(M.gutter(12.8), s * 7.3, 5.9, -6.0, Math.PI / 2);
  for (const [x, z] of [[-7.2, 0.15], [7.2, 0.15], [-7.2, -12.1], [7.2, -12.1]]) at(M.downspout(5.9), x, 0, z, 0);
  at(M.chimney(0.8, 2.2, 0.6), -3.8, 5.6, -8.0, 0);
  // крыльцо: площадка, ступени, навес на стойках, светильники
  bx(2.4, 0.15, 1.2, MAT.stone, 0, 0.075, 0.6, scene, 0.6);
  for (let i = 0; i < 2; i++) { const sh = 0.1 - 0.05 * i; bx(2.4, sh, 0.3, MAT.stone, 0, sh / 2, 1.35 + i * 0.3, scene, 0.6); }
  for (const x of [-1.1, 1.1]) cy(0.06, 0.06, 2.65, MAT.paintWhite, x, 1.33, 1.1, scene, 12);
  bx(2.6, 0.12, 1.9, MAT.roof, 0, 2.7, 0.95, scene, 1.0);
  wallLamp(1.3, 2.25, 0.1, 0, 'porch', 0xffc98a, 2.2, 0);
  wallLamp(-1.3, 2.25, 0.1, 0, 'porch', 0xffc98a, 2.2, 0);
  // карниз фасада
  bx(14.4, 0.2, 0.12, MAT.paintCream, 0, 5.95, 0.12, scene);

  // участок: газон, дорожка, подъездная дорожка
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(200, 5.2), MAT.lawn);
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.002, 2.6); lawn.receiveShadow = true; add(lawn);
  floor(-0.9, 0.9, 0.0, 5.2, 0.004, MAT.concrete, 1.5);
  floor(9.0, 13.0, 0.0, 8.2, 0.005, MAT.asphalt, 2.0);
  for (const [x, z] of [[-6.6, 0.8], [-5.6, 1.2], [5.6, 1.1], [6.6, 0.6], [-2.0, 0.9], [2.2, 0.8]]) at(M.bush(0.55), x, 0, z, 0);
  for (const [x, z, h, r] of [[-13, 3.4, 7.5, 2.2], [14.5, 3.0, 6.5, 2.0], [-30, 3.6, 8.2, 2.6], [22, 2.8, 6.8, 2.2], [40, 4.0, 7.6, 2.4], [-44, 3.8, 8.5, 2.7]]) {
    at(M.tree(h, r), x, 0, z, Math.random() * 6);
  }
  at(M.fence(5.2, 1.0), -12.8, 0, 2.6, Math.PI / 2);
  at(M.fence(5.2, 1.0), 12.8, 0, 2.6, Math.PI / 2);
  at(M.mailbox(), 2.6, 0, 5.7, 0);
  at(M.binCan(), -8.0, 0, 5.6, 0);
  at(M.trashBags(3), -8.9, 0, 5.8, 0);
  at(M.utilityPole(8.8), 16.2, 0, 5.8, 0);
  at(M.utilityPole(8.8), -16.2, 0, 5.8, 0);
  at(M.wireSpan(new THREE.Vector3(16.2, 8.5, 5.8), new THREE.Vector3(-16.2, 8.5, 5.8), 0.9, 3), 0, 0, 0, 0);

  // Соседние дома
  const neighbor = (x0, x1, h, z0, z1, tint) => {
    const w = x1 - x0, d = z1 - z0;
    const m = new THREE.MeshStandardMaterial({ map: MAT.facade.map, color: tint, roughness: 0.85 });
    bx(w, h, d, m, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, scene, 3.0);
    bx(w + 0.4, 0.3, d + 0.4, MAT.roof, (x0 + x1) / 2, h + 0.15, (z0 + z1) / 2, scene, 1.0);
    coll(x0, x1, z0, z1, 'any');
  };
  neighbor(-26, -12, 6.2, -12.5, -0.5, 0x8b7b6c);
  neighbor(10.5, 24, 5.8, -13, -0.5, 0x6c5c4f);
  neighbor(-42, -28, 7.6, -13, -0.5, 0x7b6e62);

  /* ================================================================
     УЛИЦА
     ================================================================ */
  const road = new THREE.Mesh(new THREE.PlaneGeometry(260, 8.0), MAT.asphalt);
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.001, 12.1); road.receiveShadow = true; add(road);
  floor(-130, 9.0, 5.2, 7.9, 0.008, MAT.concrete, 1.5);
  floor(13.0, 130, 5.2, 7.9, 0.008, MAT.concrete, 1.5);
  floor(-130, 130, 16.3, 18.5, 0.008, MAT.concrete, 1.5);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(260, 6), MAT.lawn);
  far.rotation.x = -Math.PI / 2; far.position.set(0, 0.002, 20.5); far.receiveShadow = true; add(far);
  bx(260, 0.16, 0.2, MAT.concrete, 0, 0.08, 8.0, scene, 1.5);
  bx(260, 0.16, 0.2, MAT.concrete, 0, 0.08, 16.2, scene, 1.5);
  for (let x = -120; x < 120; x += 6) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.14), MAT.paintWhite);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, 12.1); add(m);
  }
  for (const [x, z] of [[-20, 12.6], [22, 11.0], [-48, 13.3]]) at(M.manhole(), x, 0, z, 0);
  const puddleSpots = [[-18, 11.2, 2.2], [-6, 14.3, 2.8], [4, 9.6, 1.8], [18, 13.0, 3.2], [33, 10.5, 2.0], [-34, 14.5, 2.6], [-40, 11.4, 1.6], [0, 17.2, 2.0], [-28, 17.6, 1.5], [26, 17.4, 1.9]];
  for (const [x, z, r] of puddleSpots) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 28), MAT.puddle);
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.012, z); p.receiveShadow = true; add(p);
    W.puddles.push({ x, z, r });
  }
  for (const [x, z, r] of [[-14, 6.5, 0.9], [22, 6.9, 0.7]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 24), MAT.puddle);
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.01, z); add(p);
    W.puddles.push({ x, z, r });
  }

  // уличные фонари
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
    coll(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 'any');
    return lp;
  };
  for (const x of lampsNear) addStreetLamp(x, 6.4, -Math.PI / 2);
  for (const x of lampsFar) addStreetLamp(x, 17.4, Math.PI / 2);
  for (const x of [-60, -33, 47]) { at(M.utilityPole(8.8), x, 0, 19.6, 0); coll(x - 0.3, x + 0.3, 19.3, 19.9, 'any'); }

  // машины у обочин и одна в подъездной дорожке
  const cars = [
    [-27, 9.0, 0, 0x2a3a4a], [-16, 9.1, 0, 0x6b1c1c], [18, 9.0, 0, 0x9aa0a6], [30, 9.1, 0, 0x101418], [-44, 9.0, 0, 0x4a5a2e],
    [-22, 15.0, Math.PI, 0x8a7a50], [6, 15.0, Math.PI, 0x23344a], [24, 15.1, Math.PI, 0x5b5b5b],
  ];
  for (const [x, z, ry, col] of cars) {
    at(M.car(col, 4.4), x, 0, z, ry);
    const alongX = Math.abs(Math.cos(ry)) > 0.5;
    coll(x - (alongX ? 2.2 : 0.9), x + (alongX ? 2.2 : 0.9), z - (alongX ? 0.9 : 2.2), z + (alongX ? 0.9 : 2.2), 'any');
  }
  at(M.car(0x5a1a1a, 4.4), 11.0, 0, 3.6, Math.PI / 2);
  coll(10.1, 11.9, 1.4, 5.8, 'any');
  at(M.dumpster(), -36, 0, 6.0, 0);
  at(M.trashBags(4), -35, 0, 6.2, 0);
  at(M.binCan(), 6.4, 0, 6.0, 0);
  at(M.bench(), 26, 0, 6.1, Math.PI);
  coll(-36.8, -35.2, 5.5, 6.5, 'any');

  // дальние дома за туманом
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
  for (const [x, z, h, r] of [[-48, 22, 7.4, 2.4], [-8, 26.5, 7.4, 2.4], [36, 26.2, 7.4, 2.4]]) at(M.tree(h, r), x, 0, z, Math.random() * 6);
  for (const [x, z] of [[-40, 5.4], [-19, 5.2], [-2, 4.8], [19, 5.4], [33, 5.2], [46, 5.4]]) {
    at(M.tree(6.4, 1.8), x, 0, z, Math.random() * 6);
    coll(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 'any');
  }
  for (const [x, z] of [[-24, 19.2], [14, 19.4], [-6, 19.1], [36, 19.0]]) at(M.bush(0.8), x, 0, z, 0);
  for (let i = 0; i < 6; i++) at(M.leaves(16, 3), -12 + i * 6, 0, 10.4 + (i % 2) * 2, 0);

  /* ================================================================
     Определение комнаты по координатам (для ламп и звука)
     ================================================================ */
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
