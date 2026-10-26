// «Не оборачивайся» — эпизод на Three.js. Управление для телефона: левая половина экрана — джойстик,
// правая — свайп для осмотра, короткий тап по правой половине — действие. Клавиатуры нет.
// Ничего внешнего не грузится: текстуры рисуются на canvas, звуки синтезируются в Web Audio.
import * as THREE from './vendor/three.module.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const EYE = 1.6;   // высота глаз
const H = 2.8;     // высота потолка
const T = 0.16;    // толщина стен
const CORR_END = -20; // базовая позиция двери в конце коридора

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
  started: false, paused: false, ended: false, t: 0,
  flash: true, battery: 100,
  ringAt: -1, ringing: false, ringStop: 0, answered: false,
  batteryTaken: false, batteryWarned: false,
  hallT: -1, nudgeSaid: false,
  visitedBath: false, visitedLiving: false, exitedLiving: false, livingEnterT: -1,
  lampSaid: false, stepSaid: false, frozenSaid: false, lockedSaid: false,
  endOffset: 0, doorAng: 0, doorOpening: false, doorDone: false,
  failing: false,
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

/* ---------- текстуры (рисуются кодом) ---------- */
function paintTex(w, h, paint, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const wallTex = paintTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4036'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,236,200,0.03)';
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random(), 1 + Math.random());
  }
  // потёки у плинтуса
  for (let x = 0; x < w; x += 40) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, h * 0.85, 2, h * 0.15); }
}, 2, 1);
const floorTex = paintTex(256, 256, (g, w, h) => {
  g.fillStyle = '#2e2119'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) {
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, y, w, 2);
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.2).toFixed(3) + ')'; g.fillRect(Math.random() * w, y + 4, 20 + Math.random() * 80, 1); }
  }
}, 4, 14);
// фото: семья на пляже; четвёртый силуэт почти сливается с фоном
const photoTex = paintTex(256, 192, (g, w, h) => {
  g.fillStyle = '#c9b89a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7a8fa3'; g.fillRect(0, 0, w, h * 0.55);
  g.fillStyle = '#d8c7a2'; g.fillRect(0, h * 0.55, w, h * 0.45);
  const fig = (x, y, s, col) => {
    g.fillStyle = col;
    g.beginPath(); g.arc(x, y, 9 * s, 0, TAU); g.fill();
    g.fillRect(x - 12 * s, y + 9 * s, 24 * s, 46 * s);
  };
  fig(70, 80, 1.0, '#3b3026');
  fig(120, 74, 1.05, '#4a3b2d');
  fig(176, 84, 0.9, '#2b2a2e');
  fig(214, 66, 0.9, 'rgba(10,8,12,0.85)');
}, 1, 1);
const matWall = new THREE.MeshStandardMaterial({ map: wallTex, color: 0xb8a895, roughness: 0.95 });
const matFloor = new THREE.MeshStandardMaterial({ map: floorTex, color: 0xa08474, roughness: 0.85 });
const matCeil = new THREE.MeshStandardMaterial({ color: 0x1c1a1f, roughness: 1 });
const matDark = new THREE.MeshStandardMaterial({ color: 0x120d0a, roughness: 0.9 });
const matPaper = new THREE.MeshStandardMaterial({ color: 0xcbbd9f, roughness: 1 });
const matMirror = new THREE.MeshStandardMaterial({ color: 0x0b0b10, metalness: 1, roughness: 0.06 });
const matFig = new THREE.MeshStandardMaterial({ color: 0x050406, roughness: 1 });
const matDust = new THREE.MeshBasicMaterial({ color: 0xddc8a8, transparent: true, opacity: 0.18 });
const matDoor = new THREE.MeshStandardMaterial({ color: 0x24160d, roughness: 0.8 });

/* ---------- геометрия ---------- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 60), matFloor);
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -20); floor.receiveShadow = true; scene.add(floor);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 60), matCeil);
ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -20); scene.add(ceil);

const colliders = []; // статичные стены {x0,x1,z0,z1}
function box(x0, x1, y0, y1, z0, z1, mat, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = true; m.receiveShadow = true;
  (opts.parent || scene).add(m);
  if (opts.collide) colliders.push({ x0, x1, z0, z1 });
  return m;
}
const wallX = (x, za, zb) => box(x - T / 2, x + T / 2, 0, H, Math.min(za, zb), Math.max(za, zb), matWall, { collide: true });
const wallZ = (xa, xb, z) => box(Math.min(xa, xb), Math.max(xa, xb), 0, H, z - T / 2, z + T / 2, matWall, { collide: true });

// спальня x[-3,3] z[0,6]
wallZ(-3.1, 3.1, 6.1); wallX(-3.1, 0, 6.1); wallX(3.1, 0, 6.1);
wallZ(-3.1, -1.2, 0); wallZ(1.2, 3.1, 0);
// коридор x[-1.2,1.2] z[-20,0] (статичная часть); дальше — растягивающаяся часть
wallX(-1.2, -10, 0); wallX(-1.2, -20, -12);       // левая стена, проём в гостиную z[-12,-10]
wallX(1.2, -4.6, 0); wallX(1.2, -20, -6);         // правая стена, проём в ванную z[-6,-4.6]
// ванная x[1.2,3.2] z[-7.5,-3]
wallZ(1.2, 3.2, -3.0); wallZ(1.2, 3.2, -7.5); wallX(3.2, -7.5, -3.0);
// гостиная x[-4.2,-1.2] z[-16,-8]
wallX(-4.2, -16, -8); wallZ(-4.2, -1.2, -8); wallZ(-4.2, -1.2, -16);

// мебель
box(-2.6, -0.6, 0, 0.5, 4.0, 5.8, matDark, { collide: true });     // кровать
box(1.95, 2.45, 0, 0.7, 5.05, 5.55, matDark, { collide: true });   // тумбочка
box(2.2, 3.0, 0, 0.8, -6.9, -5.9, matDark, { collide: true });     // стол в ванной
box(-3.9, -2.2, 0, 0.45, -14.6, -12.6, matDark, { collide: true }); // диван в гостиной
box(2.05, 2.32, 0.7, 0.76, 5.22, 5.45, matFig);                    // телефон
box(1.9, 2.1, 0.7, 0.705, 5.3, 5.45, matPaper);                    // записка

// зеркало в ванной (на восточной стене)
const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), matMirror);
mirror.rotation.y = -Math.PI / 2; mirror.position.set(3.11, 1.5, -5.2); scene.add(mirror);
// фото на левой стене коридора
const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.6 }));
photo.rotation.y = Math.PI / 2; photo.position.set(-1.1, 1.5, -2.6); scene.add(photo);
// батарейка на столе в ванной
const battery = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.6, roughness: 0.4 }));
battery.rotation.z = Math.PI / 2;
battery.position.set(2.6, 0.86, -6.4); scene.add(battery);
// выключатель (не работает)
box(-1.19, -1.13, 1.0, 1.4, -1.6, -1.44, matDark);

// растягивающаяся часть коридора: стены между CORR_END и endZ, дверь в конце
const extL = new THREE.Mesh(new THREE.BoxGeometry(T, H, 1), matWall);
const extR = extL.clone();
extL.position.set(-1.2, H / 2, CORR_END); extR.position.set(1.2, H / 2, CORR_END);
extL.receiveShadow = extR.receiveShadow = true;
scene.add(extL, extR);

const endGroup = new THREE.Group(); // локальный z = 0 — это текущая дверь
scene.add(endGroup);
box(-1.2, -0.6, 0, H, -T / 2, T / 2, matWall, { parent: endGroup });
box(0.6, 1.2, 0, H, -T / 2, T / 2, matWall, { parent: endGroup });
box(-0.6, 0.6, 2.2, H, -T / 2, T / 2, matWall, { parent: endGroup });
const doorPivot = new THREE.Group();
doorPivot.position.set(-0.6, 0, 0);
endGroup.add(doorPivot);
box(0, 1.2, 0, 2.2, -0.03, 0.03, matDoor, { parent: doorPivot });
const endGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.8), new THREE.MeshBasicMaterial({ color: 0xfff8ee, transparent: true, opacity: 0 }));
endGlow.position.set(0, 1.4, -0.5); endGroup.add(endGlow);
const endLight = new THREE.PointLight(0xfff4e6, 0, 16, 1.6);
endLight.position.set(0, 1.6, -1.5); endGroup.add(endLight);

/* ---------- свет ---------- */
scene.add(new THREE.HemisphereLight(0x1d2435, 0x050302, 0.15));
const lamps = [];
function lamp(x, z, color, intensity) {
  const l = new THREE.PointLight(color, intensity, 7, 1.8);
  l.position.set(x, 2.45, z);
  scene.add(l);
  const fx = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }));
  fx.position.set(x, H - 0.03, z);
  scene.add(fx);
  const o = { light: l, base: intensity, timer: 0, dim: 1, x, z };
  lamps.push(o);
  return o;
}
const lampBed = lamp(0, 3, 0xffd9a0, 9);
const lampHall1 = lamp(0, -2, 0xffd9a0, 8);
const lampHall2 = lamp(0, -9, 0xffd9a0, 8);
const lampBath = lamp(2.2, -5.2, 0xbcd0ff, 5);
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
const dustMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.006, 3, 2), matDust, DUST);
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
const FIG_START = { x: -2.6, z: -15.2 };
const figure = new THREE.Group(); // тёмная фигура в гостиной
const figBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.05, 4, 10), matFig);
figBody.position.y = 0.95; figBody.castShadow = true;
const figHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), matFig);
figHead.position.y = 1.95; figHead.castShadow = true;
figure.add(figBody, figHead);
figure.position.set(FIG_START.x, 0, FIG_START.z);
figure.visible = false;
scene.add(figure);

const mirrorFig = new THREE.Group(); // отражение в ванной: отстаёт от игрока
const mfBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.95, 4, 10), matFig);
mfBody.position.y = 0.9;
const mfHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), matFig);
mfHead.position.y = 1.8;
mirrorFig.add(mfBody, mfHead);
mirrorFig.visible = false;
scene.add(mirrorFig);
const lag = { z: 0 };

/* ---------- звук: синтез в Web Audio + позиционирование ---------- */
const snd = {};
let audioReady = false;
let ambHum = null, heartSnd = null, ringSnd = null, buzzSnd = null;
const phoneAt = new THREE.Object3D(); phoneAt.position.set(2.2, 0.8, 5.3); scene.add(phoneAt);
const figAt = new THREE.Object3D(); scene.add(figAt);
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

  ambHum = new THREE.Audio(listener);
  ambHum.setBuffer(snd.hum); ambHum.setLoop(true); ambHum.setVolume(0.1); ambHum.play();
  const room = new THREE.Audio(listener);
  room.setBuffer(snd.room); room.setLoop(true); room.setVolume(0.25); room.play();

  ringSnd = new THREE.PositionalAudio(listener);
  ringSnd.setBuffer(snd.ring); ringSnd.setLoop(true); ringSnd.setRefDistance(2); ringSnd.setVolume(0.7);
  phoneAt.add(ringSnd);

  heartSnd = new THREE.PositionalAudio(listener);
  heartSnd.setBuffer(snd.heart); heartSnd.setLoop(true); heartSnd.setRefDistance(2.5); heartSnd.setVolume(0);
  figAt.add(heartSnd); heartSnd.play();

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

/* ---------- интерактивные предметы ---------- */
const uses = [];
function addUse(x, y, z, label, fn, once = false) { uses.push({ x, y, z, label, fn, once, dead: false }); }
addUse(2.2, 0.8, 5.33, 'ответить на звонок', () => {
  if (S.answered) return say('Гудков нет. Только тихое дыхание.');
  if (!S.ringing) return say('Телефон молчит.');
  S.answered = true; S.ringing = false; ringSnd.stop();
  oneShot(phoneAt, snd.whisper, 0.9, 2.5);
  after(0.3, () => say('…ты дома?'));
  after(5.0, () => say('Не выходи, пока свет не вернётся.'));
  after(10.5, () => say('Линия молчит. Дыхание в трубке — медленное, как твоё.', 5));
});
addUse(1.98, 0.74, 5.18, 'прочитать записку', () => {
  openCard('Записка', 'Если в коридоре станет темнее — не оборачивайся. Фонарь держи включённым. Я приду, когда стемнеет окончательно. — Л.');
});
addUse(-1.1, 1.5, -2.6, 'посмотреть фото', () => {
  openCard('Фотография', 'Мама, папа и ты на пляже. Всё правильно. Только за твоей спиной стоит кто-то четвёртый. Ты точно помнишь, что вас было трое.');
});
addUse(-1.1, 1.2, -1.5, 'щёлкнуть выключатель', () => say('Щёлкает, но свет не загорается. Его давно нет.'));
addUse(3.0, 1.5, -5.2, 'посмотреть в зеркало', () => say('Отражение отстаёт на полсекунды.'));
addUse(2.6, 0.86, -6.4, 'взять батарейку', () => {
  S.batteryTaken = true;
  S.battery = Math.min(100, S.battery + 60);
  battery.visible = false;
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
    // закрытая дверь: две стенки по бокам и сама дверь на всю ширину проёма
    if (x > -1.2 - r && x < 1.2 + r && z > dz - T / 2 - r && z < dz + T / 2 + r) return true;
  }
  return false;
}
function moveWithCollision(dx, dz) {
  if (!blocked(view.x + dx, view.z)) view.x += dx;
  if (!blocked(view.x, view.z + dz)) view.z += dz;
}
function teleport(x, z, yaw) {
  view.x = x; view.z = z; view.yaw = yaw ?? view.yaw; view.pitch = 0;
}
function fail() {
  if (S.failing) return;
  S.failing = true;
  setFade(true);
  after(0.9, () => {
    teleport(0, 4.6, 0);
    figure.position.set(FIG_START.x, 0, FIG_START.z);
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
  // движение
  let ix = input.x, iy = input.y;
  const m = Math.hypot(ix, iy);
  if (m > 1) { ix /= m; iy /= m; }
  const sp = 1.5 * dt;
  const fx = -Math.sin(view.yaw), fz = -Math.cos(view.yaw);
  const rx = Math.cos(view.yaw), rz = -Math.sin(view.yaw);
  if (ix || iy) moveWithCollision((fx * iy + rx * ix) * sp, (fz * iy + rz * ix) * sp);

  // батарея фонаря
  if (S.flash) {
    S.battery = Math.max(0, S.battery - dt * 0.55);
    if (S.battery <= 0) {
      S.flash = false;
      $('flash').classList.add('off');
      say(S.batteryTaken ? 'Фонарь сел.' : 'Фонарь сел. Батарейка должна быть где-то в ванной.', 5);
    }
  }
  const flashTarget = S.flash ? (S.battery < 15 ? 60 * (0.6 + 0.4 * Math.random()) : 60) : 0;
  flash.intensity += (flashTarget - flash.intensity) * Math.min(1, dt * 12);
  $('bat').firstElementChild.style.transform = `scaleX(${(S.battery / 100).toFixed(3)})`;

  // лампы: случайные вспышки и «мигание по таймеру»
  for (const L of lamps) {
    if (L.timer > 0) { L.timer -= dt; L.dim = 0.05; }
    else L.dim += (1 - L.dim) * Math.min(1, dt * 3);
    if (L.base > 0 && L.timer <= 0 && Math.random() < dt * 0.05) L.timer = rand(0.1, 0.35);
    L.light.intensity = L.base * L.dim * (0.92 + 0.08 * Math.sin(S.t * 13 + L.x * 7));
  }
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

  // фигура: в гостиной, когда фонарь выключен — идёт к игроку; при свете замирает
  const figLive = S.visitedLiving && !S.exitedLiving && !S.failing;
  figure.visible = S.visitedLiving;
  let figDist = 99;
  if (figLive && inBox(view.x, view.z, ZONE.living)) {
    const dx = view.x - figure.position.x, dz = view.z - figure.position.z;
    figDist = Math.hypot(dx, dz);
    if (!S.flash) {
      if (!S.stepSaid) { S.stepSaid = true; say('Что-то переставляет ногу по паркету.', 4); }
      const step = Math.min(figDist, 0.6 * dt);
      figure.position.x += (dx / figDist) * step;
      figure.position.z += (dz / figDist) * step;
    } else if (!S.frozenSaid && inView(figure.position.x, 1.0, figure.position.z, 0.9)) {
      S.frozenSaid = true;
      say('Он стоит, пока ты на него светишь.', 4.5);
    }
    figure.lookAt(view.x, 0, view.z);
    if (figDist < 1.05) fail();
  }
  // сердцебиение: громче, когда фигура ближе
  if (heartSnd) {
    const near = figLive && figDist < 7 ? clamp(1 - figDist / 7, 0, 1) : 0;
    heartSnd.setVolume(near * 0.9);
    figAt.position.copy(figure.position);
  }

  // отражение в ванной: отстаёт от игрока примерно на полсекунды
  const inBath = view.x > 1.2 && view.z > -7.5 && view.z < -3;
  mirrorFig.visible = inBath;
  if (inBath) {
    lag.z += (view.z - lag.z) * Math.min(1, dt * 2);
    mirrorFig.position.set(2.7, 0, lag.z);
    mirrorFig.lookAt(view.x, 0, view.z);
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
  if (S.started && !S.paused && !S.ended) {
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
  S, view, teleport, toggleFlash, start, say,
  setFlash(on) { S.flash = !!on; $('flash').classList.toggle('off', !S.flash); },
  get figPos() { return figure.position; },
  inView,
};
