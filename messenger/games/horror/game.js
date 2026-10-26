// «Не оборачивайся» — эпизод на Three.js. Управление для телефона: левая половина экрана — джойстик,
// правая — свайп для осмотра, короткий тап по правой половине — действие. Клавиатуры нет.
// Модели и текстуры — в models.js (всё рисуется кодом). Звуки синтезируются в Web Audio.
import * as THREE from './vendor/three.module.js';
import {
  MAT, DUST_GEO, bedModel, nightstandModel, tableLampModel, corded_phoneModel, noteModel, sofaModel,
  bathtubModel, sinkModel, toiletModel, mirrorFrameModel, coatModel, ceilingDrumModel, fluoroModel,
  windowModel, rugModel, batteryModel, photoFrameModel, doorModel, plinth, stalkerModel, animateStalker,
} from './models.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const EYE = 1.6;   // высота глаз
const H = 2.8;     // высота потолка
const T = 0.16;    // толщина стен
const CORR_END = -20; // базовая позиция двери в конце коридора
const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* устройство без вибрации */ } };

/* ---------- рендер и камера ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020103);
scene.fog = new THREE.FogExp2(0x040307, 0.2);

const camera = new THREE.PerspectiveCamera(66, 1, 0.05, 80);
camera.rotation.order = 'YXZ';
scene.add(camera);
const listener = new THREE.AudioListener();
camera.add(listener);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.8 ? 80 : 66; // на узком экране шире угол обзора
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

/* ---------- состояние ---------- */
const view = { x: 0, z: 4.6, yaw: 0, pitch: 0 };
const S = {
  started: false, paused: false, ended: false, t: 0, hiddenPause: false,
  flash: true, battery: 100,
  ringAt: -1, ringing: false, ringStop: 0, answered: false,
  batteryTaken: false,
  lampOn: false, lampUsed: false, coatChecked: false, switchUsed: false,
  hallT: -1, nudgeSaid: false,
  visitedBath: false, visitedLiving: false, exitedLiving: false, livingEnterT: -1,
  lampSaid: false, stepSaid: false, frozenSaid: false, lockedSaid: false,
  endOffset: 0, doorAng: 0, doorOpening: false, doorDone: false,
  failing: false, stepAcc: 0, figStepAcc: 0,
};
let later = [];
function after(sec, fn) { later.push({ at: S.t + sec, fn }); }

/* ---------- субтитры и карточки ---------- */
const subEl = $('sub');
let subLeft = 0;
function say(text, sec = 4.6) {
  subEl.textContent = text;
  subEl.classList.add('on');
  subLeft = sec;
}
function openCard(title, text) {
  S.paused = true;
  $('card').querySelector('h3').textContent = title;
  $('card').querySelector('p').textContent = text;
  $('card').classList.remove('hidden');
}
function closeCard() {
  $('card').classList.add('hidden');
  S.paused = false;
}
$('card').addEventListener('pointerdown', (e) => { e.stopPropagation(); closeCard(); });
function setFade(on) { $('fade').classList.toggle('on', on); }

/* ---------- геометрия комнат ---------- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 60), MAT.floor);
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -20); floor.receiveShadow = true; scene.add(floor);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 60), MAT.ceil);
ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -20); scene.add(ceil);

const colliders = []; // статичные препятствия {x0,x1,z0,z1}
function addCollider(x0, x1, z0, z1) { colliders.push({ x0, x1, z0, z1 }); }
function box(x0, x1, y0, y1, z0, z1, mat, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = true; m.receiveShadow = true;
  (opts.parent || scene).add(m);
  if (opts.collide) addCollider(x0, x1, z0, z1);
  return m;
}
const wallX = (x, za, zb, mat = MAT.wall) => box(x - T / 2, x + T / 2, 0, H, Math.min(za, zb), Math.max(za, zb), mat, { collide: true });
const wallZ = (xa, xb, z, mat = MAT.wall) => box(Math.min(xa, xb), Math.max(xa, xb), 0, H, z - T / 2, z + T / 2, mat, { collide: true });
function at(obj, x, y, z, rotY = 0) { obj.position.set(x, y, z); obj.rotation.y = rotY; scene.add(obj); return obj; }

// спальня x[-3,3] z[0,6]
wallZ(-3.1, 3.1, 6.1); wallX(-3.1, 0, 6.1); wallX(3.1, 0, 6.1);
wallZ(-3.1, -1.2, 0); wallZ(1.2, 3.1, 0);
// коридор x[-1.2,1.2] z[-20,0] (статичная часть); дальше — растягивающаяся часть
wallX(-1.2, -10, 0); wallX(-1.2, -20, -12);       // левая стена, проём в гостиную z[-12,-10]
wallX(1.2, -4.6, 0); wallX(1.2, -20, -6);         // правая стена, проём в ванную z[-6,-4.6]
// ванная x[1.2,3.2] z[-7.5,-3]
wallZ(1.2, 3.2, -3.0, MAT.tile); wallZ(1.2, 3.2, -7.5, MAT.tile); wallX(3.2, -7.5, -3.0, MAT.tile);
// гостиная x[-4.2,-1.2] z[-16,-8]
wallX(-4.2, -16, -8); wallZ(-4.2, -1.2, -8); wallZ(-4.2, -1.2, -16);

/* ---------- мебель и предметы ---------- */
const BED = at(bedModel(), -1.6, 0, 4.9);
addCollider(-2.6, -0.6, 4.0, 5.8);
const NIGHT = at(nightstandModel(), 2.2, 0, 5.3);
addCollider(1.95, 2.45, 5.05, 5.55);
const LAMP = at(tableLampModel(), 2.33, 0, 5.1);
const PHONE = at(corded_phoneModel(), 2.1, 0.6, 5.36, -0.2);
const NOTE = at(noteModel(), 2.28, 0.6, 5.46);
at(ceilingDrumModel(), 0, H, 3.0);
at(windowModel(), -2.98, 0, 2.0);
const COAT = at(coatModel(), -1.13, 0, -0.9);
at(photoFrameModel(0.62, 0.46), -1.12, 1.5, -2.6);
at(rugModel(1.6, 4.5), 0, 0, -5);
// плинтусы в коридоре
at(plinth(10, 'z'), -1.1, 0, -5);
at(plinth(4.6, 'z'), 1.1, 0, -2.3);
at(plinth(14, 'z'), 1.1, 0, -13);

// ванная
const TUB = at(bathtubModel(), 2.2, 0, -6.95);
addCollider(1.4, 3.0, -7.3, -6.6);
const SINK = at(sinkModel(), 2.85, 0, -5.2);
addCollider(2.6, 3.1, -5.41, -4.99);
const TOILET = at(toiletModel(), 2.1, 0, -3.4);
addCollider(1.85, 2.35, -3.68, -3.12);
at(mirrorFrameModel(1.2, 1.5), 3.11, 1.5, -5.2);
const MIRROR = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), MAT.mirror);
MIRROR.rotation.y = -Math.PI / 2; MIRROR.position.set(3.1, 1.5, -5.2); scene.add(MIRROR);
const BATTERY = at(batteryModel(), 2.8, 0.93, -5.3);
at(ceilingDrumModel(), 2.2, H, -5.2);

// гостиная
const SOFA = at(sofaModel(), -3.45, 0, -14.0);
addCollider(-4.0, -2.9, -15.1, -12.9);

// выключатель (щиток)
box(-1.19, -1.13, 1.0, 1.4, -1.6, -1.44, MAT.trim);

// растягивающаяся часть коридора: стены между CORR_END и endZ
const extL = new THREE.Mesh(new THREE.BoxGeometry(T, H, 1), MAT.wall);
const extR = extL.clone();
extL.position.set(-1.2, H / 2, CORR_END); extR.position.set(1.2, H / 2, CORR_END);
extL.receiveShadow = extR.receiveShadow = true;
scene.add(extL, extR);

const endGroup = new THREE.Group(); // локальный z = 0 — это текущая дверь
scene.add(endGroup);
box(-1.2, -0.6, 0, H, -T / 2, T / 2, MAT.wall, { parent: endGroup });
box(0.6, 1.2, 0, H, -T / 2, T / 2, MAT.wall, { parent: endGroup });
box(-0.6, 0.6, 2.2, H, -T / 2, T / 2, MAT.wall, { parent: endGroup });
const doorPivot = new THREE.Group();
doorPivot.position.set(-0.6, 0, 0);
endGroup.add(doorPivot);
doorPivot.add(doorModel(1.2, 2.2));
const endGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.8), new THREE.MeshBasicMaterial({ color: 0xfff8ee, transparent: true, opacity: 0 }));
endGlow.position.set(0, 1.4, -0.5); endGroup.add(endGlow);
const endLight = new THREE.PointLight(0xfff4e6, 0, 16, 1.6);
endLight.position.set(0, 1.6, -1.5); endGroup.add(endLight);

/* ---------- свет ---------- */
scene.add(new THREE.HemisphereLight(0x1d2435, 0x050302, 0.15));
const lamps = [];
function lightPoint(x, y, z, color, intensity, dist = 7, decay = 1.8) {
  const l = new THREE.PointLight(color, intensity, dist, decay);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
function lamp(x, z, color, intensity) {
  const l = lightPoint(x, 2.45, z, color, intensity);
  at(fluoroModel(), x, H - 0.02, z);
  const o = { light: l, base: intensity, timer: 0, dim: 1, x, z };
  lamps.push(o);
  return o;
}
const lampBed = { light: lightPoint(0, 2.55, 3.0, 0xffd9a0, 7, 7), base: 7, timer: 0, dim: 1, x: 0, z: 3 };
lamps.push(lampBed);
const lampHall1 = lamp(0, -2, 0xffd9a0, 8);
const lampHall2 = lamp(0, -9, 0xffd9a0, 8);
const lampBath = { light: lightPoint(2.2, 2.6, -5.2, 0xbcd0ff, 5, 6), base: 5, timer: 0, dim: 1, x: 2.2, z: -5.2 };
lamps.push(lampBath);
// лампа у кровати: включается вручную, сначала мигает
const lampTable = lightPoint(2.33, 0.95, 5.1, 0xffb070, 0, 4, 1.6);
// лунный свет через окно
lightPoint(-2.5, 1.8, 2.0, 0x8ea4d8, 1.2, 6, 2);

// фонарик — прикреплён к камере
const flash = new THREE.SpotLight(0xffecd0, 60, 18, 0.5, 0.6, 1.8);
flash.position.set(0.14, -0.14, -0.1);
flash.target.position.set(0, -0.05, -6);
camera.add(flash); camera.add(flash.target);
flash.castShadow = true;
flash.shadow.mapSize.set(512, 512);
flash.shadow.bias = -0.0015;
flash.shadow.camera.near = 0.1;
flash.shadow.camera.far = 18;

/* ---------- пыль в луче ---------- */
const DUST = 180;
const dustMesh = new THREE.InstancedMesh(DUST_GEO, MAT.dust, DUST);
const dustP = [];
const _m = new THREE.Matrix4();
for (let i = 0; i < DUST; i++) {
  dustP.push({ x: rand(-4, 4), y: rand(0.2, 2.6), z: rand(-4, 4), vx: rand(-0.03, 0.03), vy: rand(-0.01, 0.01), vz: rand(-0.03, 0.03) });
}
scene.add(dustMesh);
function updateDust(dt) {
  for (let i = 0; i < DUST; i++) {
    const p = dustP[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (Math.hypot(p.x - view.x, p.z - view.z) > 4.5 || p.y < 0.1 || p.y > 2.6) {
      p.x = view.x + rand(-4, 4); p.z = view.z + rand(-4, 4); p.y = rand(0.2, 2.6);
    }
    _m.makeTranslation(p.x, p.y, p.z);
    dustMesh.setMatrixAt(i, _m);
  }
  dustMesh.instanceMatrix.needsUpdate = true;
}

/* ---------- фигуры ---------- */
const FIG_START = { x: -1.9, z: -15.3 };
const stalk = stalkerModel();          // в гостиной
stalk.group.position.set(FIG_START.x, 0, FIG_START.z);
stalk.group.visible = false;
scene.add(stalk.group);

const refl = stalkerModel();           // отражение в зеркале ванной
refl.group.visible = false;
scene.add(refl.group);
const lag = { z: 0 };

/* ---------- звук: синтез в Web Audio + позиционирование ---------- */
const snd = {};
let audioReady = false;
let ambHum = null, heartSnd = null, ringSnd = null, buzzSnd = null;
const stepPool = [];
const stalkSteps = [];
const phoneAt = new THREE.Object3D(); phoneAt.position.set(2.1, 0.8, 5.36); scene.add(phoneAt);
const lampAt = new THREE.Object3D(); lampAt.position.set(0, 2.2, -9); scene.add(lampAt);
const doorAt = new THREE.Object3D(); doorAt.position.set(0, 1.1, CORR_END); scene.add(doorAt);

function makeBuf(ctx, sec, fn) {
  const sr = ctx.sampleRate, n = Math.floor(sec * sr);
  const b = ctx.createBuffer(1, n, sr);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = fn(i / sr, i / n);
  return b;
}
function initAudio() {
  if (audioReady) return;
  audioReady = true;
  const ctx = listener.context;
  if (ctx.state !== 'running' && ctx.resume) ctx.resume();
  // гул люминесцентных ламп (50/100 Гц), 4 с — кратно периоду, петля без щелчка
  snd.hum = makeBuf(ctx, 4, (t) => 0.05 * Math.sin(TAU * 50 * t) + 0.025 * Math.sin(TAU * 100 * t) + 0.01 * (Math.random() - 0.5));
  // комнатный тон: тихий низкий шум
  let br = 0;
  snd.room = makeBuf(ctx, 6, () => { br = clamp(br + (Math.random() - 0.5) * 0.04, -1, 1); return br * 0.18; });
  // телефон: двойной звонок 440+480 Гц, цикл 2 с
  snd.ring = makeBuf(ctx, 2, (t) => {
    const ph = t % 2.0;
    const on = (ph < 0.4) || (ph > 0.6 && ph < 1.0);
    return on ? 0.22 * (Math.sin(TAU * 440 * t) + Math.sin(TAU * 480 * t)) * 0.5 : 0;
  });
  // шёпот: отфильтрованный шум с огибающей и медленным дрожанием
  let lp = 0;
  snd.whisper = makeBuf(ctx, 3.6, (t) => {
    lp = lp * 0.93 + (Math.random() - 0.5) * 0.25;
    const env = Math.sin(Math.PI * Math.min(1, t / 3.6)) ** 2;
    return lp * env * (0.55 + 0.45 * Math.sin(TAU * 2.7 * t));
  });
  // скрип двери: частота падает 220 → 95 Гц
  let ph = 0;
  snd.door = makeBuf(ctx, 2.2, (t) => {
    ph += TAU * (220 - 125 * (t / 2.2)) / ctx.sampleRate;
    return (0.12 * Math.sin(ph) + 0.05 * (Math.random() - 0.5)) * Math.sin(Math.PI * t / 2.2);
  });
  // сердцебиение: два глухих удара, цикл 1.2 с
  snd.heart = makeBuf(ctx, 1.2, (t) => {
    const thump = (x) => (x >= 0 && x < 0.18) ? Math.sin(TAU * 58 * x) * Math.exp(-x * 22) : 0;
    return 0.5 * (thump(t) + thump(t - 0.25));
  });
  // гудение лампы: 120 Гц с модуляцией, цикл 1 с
  snd.buzz = makeBuf(ctx, 1, (t) => 0.05 * Math.sin(TAU * 120 * t) * (0.7 + 0.3 * Math.sin(TAU * 7 * t)));
  // шаг: короткий глухой удар с шумом по паркету
  snd.step = makeBuf(ctx, 0.25, (t) => Math.exp(-t * 40) * (0.5 * Math.sin(TAU * 95 * t) + 0.25 * (Math.random() * 2 - 1)));

  ambHum = new THREE.Audio(listener);
  ambHum.setBuffer(snd.hum); ambHum.setLoop(true); ambHum.setVolume(0.1); ambHum.play();
  const room = new THREE.Audio(listener);
  room.setBuffer(snd.room); room.setLoop(true); room.setVolume(0.25); room.play();

  for (let i = 0; i < 3; i++) { const a = new THREE.Audio(listener); a.setBuffer(snd.step); stepPool.push(a); }

  ringSnd = new THREE.PositionalAudio(listener);
  ringSnd.setBuffer(snd.ring); ringSnd.setLoop(true); ringSnd.setRefDistance(2); ringSnd.setVolume(0.7);
  phoneAt.add(ringSnd);

  heartSnd = new THREE.PositionalAudio(listener);
  heartSnd.setBuffer(snd.heart); heartSnd.setLoop(true); heartSnd.setRefDistance(2.5); heartSnd.setVolume(0);
  stalk.group.add(heartSnd); heartSnd.play();
  for (let i = 0; i < 2; i++) {
    const a = new THREE.PositionalAudio(listener);
    a.setBuffer(snd.step); a.setRefDistance(3); a.setVolume(0.6);
    stalk.group.add(a); stalkSteps.push(a);
  }

  buzzSnd = new THREE.PositionalAudio(listener);
  buzzSnd.setBuffer(snd.buzz); buzzSnd.setLoop(true); buzzSnd.setRefDistance(2); buzzSnd.setVolume(0.08);
  lampAt.add(buzzSnd); buzzSnd.play();
}
function oneShot(holder, buf, vol = 0.9, ref = 2.5) {
  const s = new THREE.PositionalAudio(listener);
  s.setBuffer(buf); s.setRefDistance(ref); s.setVolume(vol);
  holder.add(s); s.play();
  return s;
}
function playStep(vol) {
  for (const a of stepPool) if (!a.isPlaying) { a.setVolume(vol); a.play(); return; }
}
function playStalkStep() {
  for (const a of stalkSteps) if (!a.isPlaying) { a.play(); return; }
}

/* ---------- интерактивные предметы ---------- */
const uses = [];
function addUse(x, y, z, label, fn, once = false) { uses.push({ x, y, z, label, fn, once, dead: false }); }
addUse(2.1, 0.8, 5.36, 'ответить на звонок', () => {
  if (S.answered) return say('Гудков нет. Только тихое дыхание.');
  if (!S.ringing) return say('Телефон молчит.');
  S.answered = true; S.ringing = false; ringSnd.stop();
  oneShot(phoneAt, snd.whisper, 0.9, 2.5);
  buzz(40);
  after(0.3, () => say('…ты дома?'));
  after(5.0, () => say('Не выходи, пока свет не вернётся.'));
  after(10.5, () => say('Линия молчит. Дыхание в трубке — медленное, как твоё.', 5));
});
addUse(2.28, 0.65, 5.46, 'прочитать записку', () => {
  openCard('Записка', 'Если в коридоре станет темнее — не оборачивайся. Фонарь держи включённым. Я приду, когда стемнеет окончательно. — Л.');
});
addUse(2.33, 0.9, 5.1, 'включить лампу', () => {
  S.lampOn = !S.lampOn;
  if (!S.lampUsed) {
    S.lampUsed = true;
    lampTable.intensity = 0;
    after(0.2, () => { lampTable.intensity = 4; });
    after(0.5, () => { lampTable.intensity = 0; });
    after(0.8, () => { lampTable.intensity = 4; });
    after(1.1, () => say('Лампа моргнула дважды и загорелась. Провод вилки давно не в розетке.', 5.5));
    return;
  }
  lampTable.intensity = S.lampOn ? 4 : 0;
  say(S.lampOn ? 'Тёплый свет. В углах стало темнее.' : 'Лампа погасла.');
});
addUse(-1.1, 1.5, -2.6, 'посмотреть фото', () => {
  openCard('Фотография', 'Мама, папа и ты на пляже. Всё правильно. Только за твоей спиной стоит кто-то четвёртый. Ты точно помнишь, что вас было трое.');
});
addUse(-1.13, 1.2, -1.5, 'щёлкнуть выключатель', () => {
  S.switchUsed = true;
  lampHall1.timer = 0.35; // лампы гаснут на долю секунды
  lampHall2.timer = 0.35;
  say('Щёлкает. Лампы в коридоре на секунду гаснут и загораются.');
});
addUse(-1.0, 1.0, -0.9, 'проверить карманы пальто', () => {
  S.coatChecked = true;
  openCard('Карман пальто', 'Бумажка, сложенная вчетверо: «Не открывай дверь в гостиную, если свет погас сам». Ниже другим почерком: «Ты уже открывал».');
});
addUse(3.0, 1.5, -5.2, 'посмотреть в зеркало', () => say('Отражение отстаёт на полсекунды.'));
addUse(2.8, 0.95, -5.3, 'взять батарейку', () => {
  S.batteryTaken = true;
  S.battery = Math.min(100, S.battery + 60);
  BATTERY.visible = false;
  say('Батарейка тёплая. Кто-то только что её выронил.');
}, true);

const fwd = new THREE.Vector3();
function forwardVec() { return fwd.set(-Math.sin(view.yaw) * Math.cos(view.pitch), Math.sin(view.pitch), -Math.cos(view.yaw) * Math.cos(view.pitch)); }
let candidate = null;
function findCandidate() {
  const f = forwardVec();
  let best = null, bestDot = 0.9;
  for (const u of uses) {
    if (u.dead) continue;
    const dx = u.x - view.x, dy = u.y - EYE, dz = u.z - view.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > 2.3 || d < 0.01) continue;
    const dot = (dx * f.x + dy * f.y + dz * f.z) / d;
    if (dot > bestDot) { best = u; bestDot = dot; }
  }
  return best;
}
function tryUse() {
  if (!candidate) return;
  const u = candidate;
  if (u.once) u.dead = true;
  u.fn();
}

/* ---------- зоны и движение ---------- */
function inBox(x, z, b) { return x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1; }
const ZONE = {
  bath: { x0: 1.25, x1: 3.15, z0: -7.4, z1: -3.1 },
  living: { x0: -4.1, x1: -1.3, z0: -15.8, z1: -8.2 },
};
function inView(x, y, z, cosThr = 0.5) {
  const f = forwardVec();
  const dx = x - view.x, dy = y - EYE, dz = z - view.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  return (dx * f.x + dy * f.y + dz * f.z) / d > cosThr;
}
function blocked(x, z, r = 0.28) {
  for (const c of colliders) {
    if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return true;
  }
  if (!S.doorDone) {
    const dz = CORR_END + S.endOffset;
    // закрытая дверь: перекрывает весь проём коридора
    if (x > -1.2 - r && x < 1.2 + r && z > dz - T / 2 - r && z < dz + T / 2 + r) return true;
  }
  return false;
}
function moveWithCollision(dx, dz) {
  const x0 = view.x, z0 = view.z;
  if (!blocked(view.x + dx, view.z)) view.x += dx;
  if (!blocked(view.x, view.z + dz)) view.z += dz;
  return Math.hypot(view.x - x0, view.z - z0);
}
function teleport(x, z, yaw) {
  view.x = x; view.z = z; view.yaw = yaw ?? view.yaw; view.pitch = 0;
}
function fail() {
  if (S.failing) return;
  S.failing = true;
  setFade(true);
  buzz([120, 80, 200]);
  after(0.9, () => {
    teleport(0, 4.6, 0);
    stalk.group.position.set(FIG_START.x, 0, FIG_START.z);
    say('Ты очнулся в спальне. Ты не слышал, как он подошёл.', 5);
    after(0.9, () => { setFade(false); S.failing = false; });
  });
}
function ending() {
  if (S.ended) return;
  S.ended = true;
  setFade(true);
  after(1.6, () => { $('end').classList.remove('hidden'); });
}

/* ---------- ввод ---------- */
const input = { x: 0, y: 0 };
const pointers = new Map();
const stick = $('stick'), knob = $('knob');
const STICK_R = 56;
let stickOrigin = null;
const touchLayer = $('touch');

touchLayer.addEventListener('pointerdown', (e) => {
  if (S.paused || !S.started) return;
  touchLayer.setPointerCapture(e.pointerId);
  const left = e.clientX < window.innerWidth * 0.5;
  pointers.set(e.pointerId, { left, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 });
  if (left) {
    stickOrigin = { x: e.clientX, y: e.clientY };
    stick.style.left = (e.clientX - 70) + 'px';
    stick.style.top = (e.clientY - 70) + 'px';
    stick.classList.add('on');
    knob.style.transform = 'translate(0px,0px)';
    input.x = 0; input.y = 0;
  }
});
touchLayer.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  p.moved += Math.hypot(dx, dy);
  if (p.left) {
    let kx = e.clientX - stickOrigin.x, ky = e.clientY - stickOrigin.y;
    const len = Math.hypot(kx, ky);
    if (len > STICK_R) { kx *= STICK_R / len; ky *= STICK_R / len; }
    knob.style.transform = `translate(${kx}px,${ky}px)`;
    input.x = clamp(kx / STICK_R, -1, 1);
    input.y = clamp(-ky / STICK_R, -1, 1);
  } else {
    view.yaw -= dx * 0.0042;
    view.pitch = clamp(view.pitch - dy * 0.0035, -1.2, 1.2);
  }
});
function endPointer(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  pointers.delete(e.pointerId);
  if (p.left) {
    stick.classList.remove('on');
    input.x = 0; input.y = 0;
  } else if (p.moved < 10 && performance.now() - p.t < 380) {
    tryUse();
  }
}
touchLayer.addEventListener('pointerup', endPointer);
touchLayer.addEventListener('pointercancel', endPointer);

function toggleFlash() {
  if (!S.started || S.paused) return;
  if (!S.flash && S.battery <= 0) return say('Фонарь сел. Нужна батарейка.');
  S.flash = !S.flash;
  $('flash').classList.toggle('off', !S.flash);
}
$('flash').addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleFlash(); });

// в фоне игра ставится на паузу, звук глушится
document.addEventListener('visibilitychange', () => {
  S.hiddenPause = document.hidden;
  const ctx = listener.context;
  if (ctx && ctx.state) { if (document.hidden) ctx.suspend(); else if (audioReady) ctx.resume(); }
});

/* ---------- старт ---------- */
function start() {
  if (S.started) return;
  initAudio();
  S.started = true;
  $('intro').classList.add('hidden');
  S.ringAt = 6;
  after(0.6, () => say('Тихо. Где-то гудит холодильник, которого не видно.', 5));
}
$('start').addEventListener('pointerdown', (e) => { e.stopPropagation(); start(); });

/* ---------- цикл ---------- */
function update(dt) {
  // движение и шаги
  let ix = input.x, iy = input.y;
  const m = Math.hypot(ix, iy);
  if (m > 1) { ix /= m; iy /= m; }
  const sp = 1.5 * dt;
  const fx = -Math.sin(view.yaw), fz = -Math.cos(view.yaw);
  const rx = Math.cos(view.yaw), rz = -Math.sin(view.yaw);
  if (ix || iy) {
    const moved = moveWithCollision((fx * iy + rx * ix) * sp, (fz * iy + rz * ix) * sp);
    S.stepAcc += moved;
    if (S.stepAcc > 0.7) { S.stepAcc = 0; playStep(0.22); }
  }

  // батарея фонаря
  if (S.flash) {
    S.battery = Math.max(0, S.battery - dt * 0.55);
    if (S.battery <= 0) {
      S.flash = false;
      $('flash').classList.add('off');
      buzz(60);
      say(S.batteryTaken ? 'Фонарь сел.' : 'Фонарь сел. Батарейка должна быть где-то в ванной.', 5);
    }
  }
  const flashTarget = S.flash ? (S.battery < 15 ? 60 * (0.6 + 0.4 * Math.random()) : 60) : 0;
  flash.intensity += (flashTarget - flash.intensity) * Math.min(1, dt * 12);
  $('bat').firstElementChild.style.transform = `scaleX(${(S.battery / 100).toFixed(3)})`;

  // лампы: случайные вспышки и мигание по таймеру
  for (const L of lamps) {
    if (L.timer > 0) { L.timer -= dt; L.dim = 0.05; }
    else L.dim += (1 - L.dim) * Math.min(1, dt * 3);
    if (L.base > 0 && L.timer <= 0 && Math.random() < dt * 0.05) L.timer = rand(0.1, 0.35);
    L.light.intensity = L.base * L.dim * (0.92 + 0.08 * Math.sin(S.t * 13 + L.x * 7));
  }
  MAT.fluoro.emissiveIntensity = 1.2 * lampHall1.dim;
  MAT.drumGlow.emissiveIntensity = 1.6 * lampBed.dim;
  // однажды, когда идёшь по коридору и не смотришь на лампу, она мигает
  if (!S.lampSaid && view.z < -7.8 && view.z > -11.5 && !inView(lampHall2.x, 2.4, lampHall2.z, 0.4)) {
    S.lampSaid = true;
    lampHall2.timer = 1.6;
    say('Лампа в коридоре мигнула, когда ты отвернулся.');
  }

  updateDust(dt);

  // подсказка
  candidate = findCandidate();
  const hint = $('hint');
  if (candidate && S.started && !S.paused) {
    hint.textContent = candidate.label[0].toUpperCase() + candidate.label.slice(1) + ' — тап';
    hint.classList.add('on');
  } else hint.classList.remove('on');

  // зоны и события
  if (S.hallT < 0 && view.z < -0.4) S.hallT = S.t;
  if (S.hallT >= 0 && !S.nudgeSaid && !S.visitedLiving && S.t - S.hallT > 40) {
    S.nudgeSaid = true;
    say('Из левой двери тянет холодом.');
  }
  if (!S.visitedBath && inBox(view.x, view.z, ZONE.bath)) {
    S.visitedBath = true;
    say('Здесь пахнет сыростью. Зеркало над раковиной.');
  }
  const inLiving = inBox(view.x, view.z, ZONE.living);
  if (inLiving && !S.visitedLiving) {
    S.visitedLiving = true;
    S.livingEnterT = S.t;
    say('Тут нет света. Фонарь — единственный ориентир.', 5.5);
  }
  if (S.visitedLiving && !S.exitedLiving && !inLiving && view.x > -1.1 && S.t - S.livingEnterT > 3) {
    S.exitedLiving = true;
    say('Ты вышел. Он стоит в углу и не двигается, пока ты на него светишь.', 5.5);
  }

  // фигура: в гостиной, когда фонарь выключен — идёт к игроку; при свете замирает и поворачивает голову
  const figLive = S.visitedLiving && !S.exitedLiving && !S.failing;
  stalk.group.visible = S.visitedLiving;
  let figDist = 99;
  let walk = 0;
  const fp = stalk.group.position;
  if (figLive && inLiving) {
    const dx = view.x - fp.x, dz = view.z - fp.z;
    figDist = Math.hypot(dx, dz);
    if (!S.flash) {
      if (!S.stepSaid) { S.stepSaid = true; say('Что-то переставляет ногу по паркету.', 4); }
      const step = Math.min(figDist, 0.6 * dt);
      fp.x += (dx / figDist) * step;
      fp.z += (dz / figDist) * step;
      walk = 1;
      S.figStepAcc += step;
      if (S.figStepAcc > 0.6) { S.figStepAcc = 0; playStalkStep(); }
    } else if (!S.frozenSaid && inView(fp.x, 1.0, fp.z, 0.9)) {
      S.frozenSaid = true;
      say('Он стоит, пока ты на него светишь.', 4.5);
    }
    stalk.group.lookAt(view.x, 0, view.z);
    if (figDist < 1.05) fail();
  }
  const frozen = S.flash && figLive && inView(fp.x, 1.0, fp.z, 0.9);
  if (stalk.group.visible) animateStalker(stalk, dt, S.t, walk, frozen);
  // сердцебиение: громче, когда фигура ближе
  if (heartSnd) {
    const near = figLive && figDist < 7 ? clamp(1 - figDist / 7, 0, 1) : 0;
    heartSnd.setVolume(near * 0.9);
  }

  // отражение в ванной: отстаёт от игрока примерно на полсекунды
  const inBath = view.x > 1.2 && view.z > -7.5 && view.z < -3;
  refl.group.visible = inBath;
  if (inBath) {
    lag.z += (view.z - lag.z) * Math.min(1, dt * 2);
    refl.group.position.set(2.3, 0, lag.z);
    refl.group.lookAt(view.x, 0, view.z);
    animateStalker(refl, dt, S.t, 0, false);
  }

  // коридор удлиняется, пока на дверь не смотрят (после посещения гостиной)
  const endZ = CORR_END + S.endOffset;
  if (S.visitedLiving && !S.doorDone && !S.doorOpening && !inView(0, 1.4, endZ, 0.2)) {
    S.endOffset = Math.max(-6, S.endOffset - dt * 0.35);
  }
  extL.scale.z = extR.scale.z = Math.max(0.001, -S.endOffset);
  extL.position.z = extR.position.z = CORR_END + S.endOffset / 2;
  endGroup.position.z = endZ;
  doorAt.position.z = endZ;

  // дверь: открывается, только если подошли и были в гостиной
  if (!S.doorDone && Math.hypot(view.x, view.z - endZ) < 2.2 && Math.abs(view.x) < 0.9) {
    if (!S.visitedLiving) {
      if (!S.lockedSaid) { S.lockedSaid = true; say('Дверь не поддаётся. Холод тянет из левой комнаты.', 5); }
    } else if (!S.doorOpening) {
      S.doorOpening = true;
      oneShot(doorAt, snd.door, 0.9, 3);
    }
  }
  if (S.doorOpening && !S.doorDone) {
    S.doorAng = Math.min(1.9, S.doorAng + dt * 0.9);
    doorPivot.rotation.y = S.doorAng;
    if (S.doorAng >= 1.9) S.doorDone = true;
  }
  endGlow.material.opacity = S.doorDone ? Math.min(1, endGlow.material.opacity + dt * 0.8) : 0;
  endLight.intensity = S.doorDone ? 14 : 0;
  if (S.doorDone && view.z < endZ - 1.2 && Math.abs(view.x) < 0.7) ending();

  // звонок: звонит, пока не ответили; затем умолкает и через 45 с звонит снова
  if (!S.answered && !S.ringing && S.ringAt > 0 && S.t >= S.ringAt) {
    S.ringing = true;
    S.ringStop = S.t + 25;
    ringSnd.play();
  }
  if (S.ringing && S.t >= S.ringStop) {
    S.ringing = false;
    ringSnd.stop();
    S.ringAt = S.t + 45;
  }

  // отложенные события
  const due = later.filter((l) => l.at <= S.t);
  later = later.filter((l) => l.at > S.t);
  for (const l of due) l.fn();

  // субтитры
  if (subLeft > 0) { subLeft -= dt; if (subLeft <= 0) subEl.classList.remove('on'); }

  // фоновый гул растёт по мере продвижения (постепенно, без скримеров)
  if (ambHum) {
    const progress = (S.visitedBath ? 1 : 0) + (S.visitedLiving ? 1 : 0) + (S.exitedLiving ? 1 : 0);
    ambHum.setVolume(0.1 + 0.05 * progress);
  }
}

let prev = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  if (S.started && !S.paused && !S.ended && !S.hiddenPause) {
    S.t += dt;
    update(dt);
  } else {
    candidate = null;
    $('hint').classList.remove('on');
  }
  camera.position.set(view.x, EYE, view.z);
  camera.rotation.set(view.pitch, view.yaw, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// для отладки и тестов: не влияет на геймплей
window.__horror = {
  S, view, teleport, toggleFlash, start, say, scene,
  aim(x, z, tx, ty, tz) { const dx = tx - x, dz = tz - z; view.x = x; view.z = z; view.yaw = Math.atan2(-dx, -dz); view.pitch = Math.atan2(ty - EYE, Math.hypot(dx, dz)); },
  setFlash(on) { S.flash = !!on; $('flash').classList.toggle('off', !S.flash); },
  get figPos() { return stalk.group.position; },
  get reflVisible() { return refl.group.visible; },
  inView,
};
