// «Не оборачивайся» — тихий дом и улица под дождём. Без монстров и скримеров: гуляй и слушай.
// Управление для телефона: левая половина экрана — джойстик, правая — свайп для взгляда,
// короткий тап по правой половине — действие (выключатель, дверь, кран). Клавиатуры нет.
// Всё собирается кодом: materials.js (PBR-текстуры на canvas), models.js (модели), world.js (мир).
import * as THREE from './vendor/three.module.js';
import { RoomEnvironment } from './vendor/addons/RoomEnvironment.js';
import { MAT } from './materials.js';
import { buildWorld } from './world.js';
import { mergeGeometries } from './vendor/addons/BufferGeometryUtils.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const EYE = 1.6;
const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* без вибрации */ } };

/* ---------- рендер ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070a);
scene.fog = new THREE.FogExp2(0x0b1017, 0.05);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.2;

const camera = new THREE.PerspectiveCamera(66, 1, 0.05, 140);
camera.rotation.order = 'YXZ';
scene.add(camera);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.8 ? 78 : 66;
  camera.updateProjectionMatrix();
  sizeDrops();
}
window.addEventListener('resize', resize);

/* ---------- мир ---------- */
const W = buildWorld(scene);

// Запекаем статичные меши: группируем по материалу и сливаем геометрию в один меш.
// Двери (вращаются), прозрачные материалы и анимированные объекты не трогаем.
function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const doorPivots = new Set(W.doors.map((d) => d.pivot));
  const underDoor = (o) => { for (let p = o; p; p = p.parent) if (doorPivots.has(p)) return true; return false; };
  const byMat = new Map();
  root.traverse((o) => {
    if (!o.isMesh || underDoor(o)) return;
    const m = o.material;
    if (Array.isArray(m) || m.transparent) return;
    if (!byMat.has(m)) byMat.set(m, []);
    byMat.get(m).push(o);
  });
  let before = 0, after = 0;
  for (const [mat, list] of byMat) {
    if (list.length < 2) continue;
    const geos = [];
    for (const o of list) {
      let g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      if (g.index) g = g.toNonIndexed();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      geos.push(g);
    }
    let merged = null;
    try { merged = mergeGeometries(geos, false); } catch (e) { merged = null; }
    if (!merged) continue;
    for (const o of list) o.parent.remove(o);
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    before += list.length; after += 1;
  }
  return { before, after };
}
const bake = bakeStatic(scene);

// Ключевой свет: слабое небо (ночь) и редкий холодный отблеск
scene.add(new THREE.HemisphereLight(0x2a3850, 0x0a0806, 0.16));

// Пул источников: фиксированное число, чтобы не было перекомпиляции шейдеров.
const PTS = 4, SPOTS = 2;
const pts = [];
for (let i = 0; i < PTS; i++) { const l = new THREE.PointLight(0xffffff, 0, 16, 2); scene.add(l); pts.push(l); }
const spots = [];
for (let i = 0; i < SPOTS; i++) {
  const s = new THREE.SpotLight(0xffffff, 0, 14, 1.25, 0.7, 2);
  s.castShadow = true; s.shadow.mapSize.set(512, 512); s.shadow.bias = -0.0008; s.shadow.normalBias = 0.02;
  s.shadow.camera.near = 0.2; s.shadow.camera.far = 14;
  scene.add(s); scene.add(s.target); spots.push(s);
}
// фонарик — в руке, без теней (экономия на телефоне)
const flash = new THREE.SpotLight(0xffe6c0, 0, 26, 0.42, 0.55, 2);
camera.add(flash); camera.add(flash.target); flash.target.position.set(0, -0.05, -10);
let flashLevel = 0;

// Светящиеся спрайты у уличных фонарей (объём света в тумане)
for (const sl of W.streetLights) {
  const spr = new THREE.Sprite(MAT.glowSprite.clone());
  spr.position.set(sl.lamp.x, sl.lamp.y - 0.08, sl.lamp.z);
  spr.scale.set(1.9, 1.9, 1); scene.add(spr);
  sl.glow = spr;
}

// Выключенные при старте лампы: кухня, спальни и т.п. оставим тёмными; коридор и гостиная горят
for (const l of W.lamps) {
  if (['living', 'hall', 'porch', 'out'].includes(l.room)) continue;
  l.on = false; l.cur = 0;
}

/* ---------- состояние ---------- */
const view = { x: 0.0, z: 3.4, yaw: Math.PI, pitch: -0.05 };
const S = {
  started: false, paused: false, hiddenPause: false,
  flash: true, level: 0, fy: 0, inHouse: false, wet: 1,
  faucets: { kitchen: false, wc: false, ubath: false }, fountain: 0,
  walked: 0, bob: 0, subLeft: 0,
};
const subEl = $('sub');
function say(text, sec = 3.2) {
  subEl.textContent = text; subEl.classList.add('on'); S.subLeft = sec;
}

/* ---------- коллизии и движение ---------- */
const bandOK = (c) => c.band === 'any' || c.band === S.level;
function blocked(x, z, r = 0.26) {
  for (const c of W.colliders) {
    if (!bandOK(c)) continue;
    if (c.door && c.door.target === 1) continue; // открытая дверь проходима
    if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return true;
  }
  if (x < -58 || x > 58 || z < -26 || z > 22) return true;
  return false;
}
function moveWithCollision(dx, dz) {
  const x0 = view.x, z0 = view.z;
  if (!blocked(view.x + dx, view.z)) view.x += dx;
  if (!blocked(view.x, view.z + dz)) view.z += dz;
  return Math.hypot(view.x - x0, view.z - z0);
}
const ST = W.stairs;
// Высота пола: лестница ступенчатая. Уровень меняется при пересечении концов лестницы
// (по предыдущей z, поэтому быстрый шаг не перескакивает порог). S.pz — прошлая z.
const UP_Z = ST.z0 + 0.4, DOWN_Z = ST.z1;
function floorAt(x, z, pz = S.pz ?? z) {
  const inX = x >= ST.x0 && x <= ST.x1;
  if (inX) {
    if (S.level === 0 && pz > UP_Z && z <= UP_Z) S.level = 1;        // поднялись на площадку
    else if (S.level === 1 && pz < DOWN_Z && z >= DOWN_Z) S.level = 0; // спустились к входу
  }
  S.pz = z;
  if (inX && z >= ST.z0 && z <= ST.z1) {
    const i = clamp(Math.floor((ST.z1 - z) / ST.run), 0, ST.n - 1);
    return (i + 1) * ST.rise;
  }
  return S.level === 1 ? 3.0 : 0;
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
  S.flash = !S.flash;
  $('flash').classList.toggle('off', !S.flash);
}
$('flash').addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleFlash(); });

document.addEventListener('visibilitychange', () => {
  S.hiddenPause = document.hidden;
  const ctx = audio.ctx;
  if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); }
});

/* ---------- использование предметов ---------- */
const fwd = new THREE.Vector3();
function inView(x, y, z, cosThr = 0.6) {
  fwd.set(-Math.sin(view.yaw) * Math.cos(view.pitch), Math.sin(view.pitch), -Math.cos(view.yaw) * Math.cos(view.pitch));
  const cy = camera.position.y;
  const dx = x - view.x, dy = y - cy, dz = z - view.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  return (dx * fwd.x + dy * fwd.y + dz * fwd.z) / d > cosThr;
}
let candidate = null;
function findCandidate() {
  let best = null, bestScore = 1e9;
  const cy = camera.position.y;
  for (const u of W.uses) {
    const dx = u.x - view.x, dz = u.z - view.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > u.dist * u.dist) continue;
    if (Math.abs(u.y - cy) > 1.6) continue;
    if (!inView(u.x, u.y, u.z, 0.55)) continue;
    if (d2 < bestScore) { bestScore = d2; best = u; }
  }
  return best;
}
function labelOf(u) {
  if (u.door) return u.door.target === 0 ? 'открыть дверь' : 'закрыть дверь';
  if (u.switchRoom) return 'свет';
  return u.label;
}
function tryUse() {
  if (!S.started || S.paused) return;
  const u = candidate || findCandidate();
  if (!u) return;
  if (u.door) {
    u.door.target = u.door.target === 0 ? 1 : 0;
    playDoor(u.door.target === 1);
    return;
  }
  if (u.switchRoom) {
    const on = W.toggleRoom(u.switchRoom);
    playClick();
    say(on ? 'Свет включён.' : 'Свет выключен.', 1.6);
    return;
  }
  if (u.fn) u.fn();
}
W.faucetToggle = (id) => {
  S.faucets[id] = !S.faucets[id];
  if (S.faucets[id]) say('Вода течёт.', 1.8); else say('Кран закрыт.', 1.5);
  playClick();
};
W.tvClick = () => playClick();

/* ---------- звук: синтез в Web Audio ---------- */
const listener = new THREE.AudioListener();
camera.add(listener);
const audio = { ctx: null, ready: false, master: null, rain: null, rainLP: null, rainGain: null, water: null, waterGain: null };
const bufs = {};
function noiseBuf(ctx, sec, fn) {
  const n = Math.floor(ctx.sampleRate * sec);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = fn(i / ctx.sampleRate, i);
  return b;
}
function initAudio() {
  if (audio.ready) return;
  audio.ready = true;
  const ctx = listener.context;
  audio.ctx = ctx;
  if (ctx.state !== 'running' && ctx.resume) ctx.resume();
  audio.master = ctx.createGain();
  audio.master.gain.value = 0.9;
  audio.master.connect(ctx.destination);
  // дождь: белый шум, слегка пересвечен на высоких и отфильтрован
  let lp = 0;
  bufs.rain = noiseBuf(ctx, 5, () => { lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45; return lp * 1.4 + (Math.random() * 2 - 1) * 0.08; });
  audio.rain = ctx.createBufferSource();
  audio.rain.buffer = bufs.rain; audio.rain.loop = true;
  audio.rainLP = ctx.createBiquadFilter(); audio.rainLP.type = 'lowpass'; audio.rainLP.frequency.value = 2400; audio.rainLP.Q.value = 0.4;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 280;
  audio.rainGain = ctx.createGain(); audio.rainGain.gain.value = 0.35;
  audio.rain.connect(audio.rainLP); audio.rainLP.connect(hp); hp.connect(audio.rainGain); audio.rainGain.connect(audio.master);
  audio.rain.start();
  // журчание воды из крана
  bufs.water = noiseBuf(ctx, 3, () => (Math.random() * 2 - 1));
  audio.water = ctx.createBufferSource();
  audio.water.buffer = bufs.water; audio.water.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.8;
  audio.waterGain = ctx.createGain(); audio.waterGain.gain.value = 0;
  audio.water.connect(bp); bp.connect(audio.waterGain); audio.waterGain.connect(audio.master);
  audio.water.start();
  // гром: низкий шум с огибающей
  let br = 0;
  bufs.thunder = noiseBuf(ctx, 7, (t) => { br = clamp(br + (Math.random() - 0.5) * 0.06, -1, 1); const env = Math.min(1, t / 0.5) * Math.exp(-t * 0.7); return br * env * 1.8; });
  // шаги: по паркету (дерево), по бетону (улица)
  bufs.step = noiseBuf(ctx, 0.12, (t) => Math.exp(-t * 60) * (Math.random() * 2 - 1) * 0.6);
  bufs.stepOut = noiseBuf(ctx, 0.14, (t) => Math.exp(-t * 45) * (Math.random() * 2 - 1) * 0.45);
  // щелчок выключателя
  bufs.click = noiseBuf(ctx, 0.03, (t) => Math.exp(-t * 180) * (Math.random() * 2 - 1) * 0.8);
  // скрип двери (частота падает)
  let ph = 0;
  bufs.door = noiseBuf(ctx, 1.4, (t) => { ph += TAU * (220 - 120 * (t / 1.4)) / ctx.sampleRate; return (0.12 * Math.sin(ph) + 0.03 * (Math.random() - 0.5)) * Math.sin(Math.PI * t / 1.4); });
  // холодильник: низкий гул (только внутри)
  bufs.hum = noiseBuf(ctx, 2, (t) => 0.04 * Math.sin(TAU * 58 * t) + 0.01 * Math.sin(TAU * 116 * t));
  const hum = ctx.createBufferSource(); hum.buffer = bufs.hum; hum.loop = true;
  audio.humGain = ctx.createGain(); audio.humGain.gain.value = 0;
  hum.connect(audio.humGain); audio.humGain.connect(audio.master); hum.start();
  // капли: короткие «пюють» со случайной высотой
  audio.nextDrip = 0; audio.nextThunder = rand(15, 35);
}
function playOnce(buf, vol = 0.8, rate = 1, pan = 0, delay = 0) {
  if (!audio.ready) return;
  const ctx = audio.ctx;
  const s = ctx.createBufferSource();
  s.buffer = buf; s.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vol;
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (p) { p.pan.value = pan; s.connect(g); g.connect(p); p.connect(audio.master); }
  else { s.connect(g); g.connect(audio.master); }
  s.start(ctx.currentTime + delay);
}
function playStep(outdoors) {
  playOnce(outdoors ? bufs.stepOut : bufs.step, outdoors ? 0.5 : 0.7, rand(0.9, 1.1), rand(-0.2, 0.2));
}
function playClick() { playOnce(bufs.click, 0.5, rand(0.95, 1.05)); }
function playDoor(opening) {
  if (!audio.ready) return;
  playOnce(bufs.door, 0.8, opening ? 1 : 1.12);
}
function playDrip() {
  if (!audio.ready) return;
  const ctx = audio.ctx;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  const f0 = rand(900, 1700), now = ctx.currentTime;
  o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f0 * 0.45, now + 0.12);
  g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.12, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  o.connect(g);
  if (p) { p.pan.value = rand(-0.7, 0.7); g.connect(p); p.connect(audio.master); } else g.connect(audio.master);
  o.start(now); o.stop(now + 0.2);
}
function playThunder() {
  if (!audio.ready) return;
  playOnce(bufs.thunder, S.inHouse ? 0.25 : 0.7, rand(0.8, 1.0));
}

/* ---------- дождь (InstancedMesh) и брызги ---------- */
const RAIN_N = 1400;
const rainMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.5, 0.012), MAT.rain, RAIN_N);
rainMesh.frustumCulled = false;
scene.add(rainMesh);
const rainX = new Float32Array(RAIN_N), rainY = new Float32Array(RAIN_N), rainZ = new Float32Array(RAIN_N), rainV = new Float32Array(RAIN_N);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12)), _p = new THREE.Vector3(), _s = new THREE.Vector3();
for (let i = 0; i < RAIN_N; i++) { rainX[i] = rand(-18, 18); rainY[i] = rand(0, 9); rainZ[i] = rand(-18, 18); rainV[i] = rand(9, 12); }
function inHouseBox(x, z, pad = 0) {
  return x > -7.2 - pad && x < 7.2 + pad && z > -12.2 - pad && z < 0.1 + pad;
}
function updateRain(dt) {
  const cx = view.x, cz = view.z;
  const cyBase = 0;
  for (let i = 0; i < RAIN_N; i++) {
    rainY[i] -= rainV[i] * dt;
    rainX[i] -= 1.2 * dt;
    if (rainY[i] < cyBase) {
      rainY[i] += 9.5;
      rainX[i] = cx + rand(-18, 18); rainZ[i] = cz + rand(-18, 18);
      // чуть вдали от камеры
    }
    const dxC = rainX[i] - cx, dzC = rainZ[i] - cz;
    if (dxC * dxC + dzC * dzC > 18 * 18) { rainX[i] = cx + rand(-18, 18); rainZ[i] = cz + rand(-18, 18); rainY[i] = rand(4, 9); }
    _p.set(rainX[i], rainY[i] + 0.25, rainZ[i]);
    const hidden = inHouseBox(rainX[i], rainZ[i]) || rainY[i] < 0.05;
    _s.set(1, hidden ? 0.0001 : 1, 1);
    _m.compose(_p, _q, _s);
    rainMesh.setMatrixAt(i, _m);
  }
  rainMesh.instanceMatrix.needsUpdate = true;
}

const SPL_N = 56;
const splashes = [];
const splGeo = new THREE.CircleGeometry(0.13, 14);
for (let i = 0; i < SPL_N; i++) {
  const m = new THREE.Mesh(splGeo, MAT.ripple.clone());
  m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 3;
  scene.add(m);
  splashes.push({ m, t: 0, life: 0.35, x: 0, z: 0, y: 0 });
}
let splIdx = 0;
function spawnSplash() {
  const s = splashes[splIdx]; splIdx = (splIdx + 1) % SPL_N;
  let x, z, y;
  if (W.puddles.length && Math.random() < 0.5) {
    const pd = W.puddles[(Math.random() * W.puddles.length) | 0];
    const a = rand(0, TAU), r = Math.sqrt(Math.random()) * pd.r * 0.9;
    x = pd.x + Math.cos(a) * r; z = pd.z + Math.sin(a) * r; y = 0.03;
    if (inHouseBox(view.x, view.z, 4)) return;
  } else {
    x = view.x + rand(-9, 9); z = view.z + rand(-9, 9);
    if (inHouseBox(x, z)) { y = S.level === 1 ? 3.02 : 0.02; }
    else { y = 0.02; }
    if (inHouseBox(x, z) && S.level === 0 && Math.random() < 0.5) return;
  }
  s.x = x; s.z = z; s.y = y; s.t = 0; s.life = rand(0.25, 0.45);
  s.m.position.set(x, y, z); s.m.visible = true;
}
function updateSplashes(dt) {
  for (const s of splashes) {
    if (!s.m.visible) continue;
    s.t += dt;
    const k = s.t / s.life;
    if (k >= 1) { s.m.visible = false; continue; }
    s.m.scale.setScalar(0.3 + k * 1.6);
    s.m.material.opacity = 0.35 * (1 - k);
  }
}

/* ---------- капли на стекле и следы (оверлей) ---------- */
const dropsCv = $('drops');
const dctx = dropsCv.getContext('2d');
const trailCv = document.createElement('canvas');
const tctx = trailCv.getContext('2d');
const drops = [];
let dropAcc = 0;
function sizeDrops() {
  const w = Math.round(window.innerWidth * 0.6), h = Math.round(window.innerHeight * 0.6);
  dropsCv.width = w; dropsCv.height = h;
  trailCv.width = w; trailCv.height = h;
}
sizeDrops();
function updateDrops(dt) {
  const w = dropsCv.width, h = dropsCv.height;
  const wet = S.wet;
  // следы выцветают
  tctx.globalCompositeOperation = 'destination-out';
  tctx.fillStyle = 'rgba(0,0,0,0.03)';
  tctx.fillRect(0, 0, w, h);
  tctx.globalCompositeOperation = 'source-over';
  // новые капли
  dropAcc += dt * 34 * wet;
  while (dropAcc >= 1 && drops.length < 240) {
    dropAcc -= 1;
    drops.push({ x: rand(0, w), y: rand(0, h * 0.7), r: 1.2 + Math.pow(Math.random(), 2) * 4.2, vy: 0, wait: rand(0.2, 3.5) });
  }
  if (dropAcc > 4) dropAcc = 0;
  dctx.clearRect(0, 0, w, h);
  dctx.drawImage(trailCv, 0, 0);
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    if (d.wait > 0) d.wait -= dt;
    else {
      const oldY = d.y;
      d.vy += (d.r > 2.8 ? 26 : 12) * dt * (0.6 + Math.random() * 0.8);
      d.y += d.vy * dt * 8;
      d.x += Math.sin(d.y * 0.05 + d.r) * 0.08 * dt * 30;
      // след
      tctx.strokeStyle = `rgba(190,205,222,${(0.12 + d.r * 0.02).toFixed(3)})`;
      tctx.lineWidth = d.r * 0.9;
      tctx.beginPath(); tctx.moveTo(d.x, oldY); tctx.lineTo(d.x, d.y); tctx.stroke();
      if (d.vy > 0 && Math.random() < 0.02 * d.r) { d.r *= 0.92; d.vy *= 0.6; }
    }
    if (d.y > h + 8) { drops.splice(i, 1); continue; }
    // сама капля
    const g = dctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.1, d.x, d.y, d.r);
    g.addColorStop(0, 'rgba(230,240,252,0.55)');
    g.addColorStop(0.6, 'rgba(160,180,200,0.22)');
    g.addColorStop(1, 'rgba(20,30,40,0.2)');
    dctx.fillStyle = g;
    dctx.beginPath(); dctx.arc(d.x, d.y, d.r, 0, TAU); dctx.fill();
  }
  dropsCv.style.opacity = S.inHouse ? '0.3' : '0.9';
}

/* ---------- цикл ---------- */
let stepPhase = 0;
let thunderFlash = 0;
let lastInHouse = null;
const lampTmp = [];
function updateLamps(dt) {
  for (const L of W.lamps) {
    const target = L.on ? 1 : 0;
    L.cur += (target - L.cur) * Math.min(1, dt * (L.on ? 9 : 5));
    if (L.flick > 0) L.flick = Math.max(0, L.flick - dt);
    let f = 1;
    if (L.flick > 0) f = Math.random() < 0.45 ? 0.1 : 1;
    L.eff = L.cur * f;
    for (const g of L.glow) g.m.emissiveIntensity = g.base * L.eff;
    if (L.glow.length === 0) L.eff = L.cur * f;
  }
  // выбор ближайших ламп для пула источников
  const playerRoom = W.roomOf(view.x, view.z, S.level);
  lampTmp.length = 0;
  for (const L of W.lamps) {
    if (L.cur < 0.03) continue;
    const dx = L.x - view.x, dy = L.y - camera.position.y, dz = L.z - view.z;
    let score = dx * dx + dy * dy + dz * dz;
    const outside = L.room === 'out' || L.room === 'porch';
    if (L.room === playerRoom) score -= 4;
    else if (outside) score += S.inHouse ? 500 : 0;
    else if (!S.inHouse) score += 500;
    else if (L.level !== S.level) score += 900;
    else score += 30;
    lampTmp.push({ L, score });
  }
  lampTmp.sort((a, b) => a.score - b.score);
  for (let i = 0; i < PTS; i++) {
    const p = pts[i];
    const e = lampTmp[SPOTS + i];
    const tgtI = e ? e.L.base * e.L.eff : 0;
    p.intensity += (tgtI - p.intensity) * Math.min(1, dt * 8);
    if (e) { p.position.set(e.L.x, e.L.y, e.L.z); p.color.set(e.L.color); }
    p.distance = e && e.L.kind === 'street' ? 26 : 12;
  }
  for (let i = 0; i < SPOTS; i++) {
    const s = spots[i];
    const e = lampTmp[i];
    const tgtI = e ? e.L.base * 1.6 * e.L.eff : 0;
    s.intensity += (tgtI - s.intensity) * Math.min(1, dt * 8);
    if (e) {
      s.position.set(e.L.x, e.L.y + 0.02, e.L.z);
      s.target.position.set(e.L.x, 0, e.L.z);
      s.color.set(e.L.color);
    }
    s.distance = e && e.L.kind === 'street' ? 26 : 12;
  }
  // свечение спрайтов уличных фонарей
  for (const sl of W.streetLights) if (sl.glow) sl.glow.material.opacity = 0.9 * sl.lamp.cur;
  // фонарик
  flashLevel += ((S.flash && S.started ? 1 : 0) - flashLevel) * Math.min(1, dt * 12);
  flash.intensity = flashLevel * 24;
}

function floorUnder() {
  return floorAt(view.x, view.z);
}

function update(dt) {
  // ввод и движение
  const len = Math.hypot(input.x, input.y);
  let ix = input.x, iy = input.y;
  if (len > 1) { ix /= len; iy /= len; }
  const speed = 2.4 * Math.min(1, len);
  if (speed > 0.01) {
    const fx = -Math.sin(view.yaw), fz = -Math.cos(view.yaw);
    const rx = Math.cos(view.yaw), rz = -Math.sin(view.yaw);
    const dx = (rx * ix + fx * iy) * speed * dt, dz = (rz * ix + fz * iy) * speed * dt;
    S.walked += moveWithCollision(dx, dz);
  }
  const fyTarget = floorUnder();
  S.fy += (fyTarget - S.fy) * Math.min(1, dt * 12);
  S.inHouse = inHouseBox(view.x, view.z, 0.0) && (S.level === 1 || S.level === 0);
  if (S.inHouse !== lastInHouse) {
    lastInHouse = S.inHouse;
    say(S.inHouse ? 'Внутри тихо. Слышно, как дождь стучит по крыше.' : 'На улице. Дождь и туман.', 3.2);
  }
  // шаги
  if (S.walked > 1.0 && speed > 0.1) {
    playStep(!S.inHouse);
    S.walked = 0;
  }
  stepPhase += dt * (speed > 0.1 ? 9 : 0);
  S.bob = speed > 0.1 ? Math.sin(stepPhase) * 0.035 : S.bob * 0.9;

  // двери
  for (const d of W.doors) {
    d.cur += (d.target - d.cur) * Math.min(1, dt * 2.8);
    d.pivot.rotation.y = d.base + d.swing * d.cur * (Math.PI / 2) * 0.95;
  }
  // лампы
  updateLamps(dt);

  // туман: внутри гуще (и теплее), снаружи — плотная ночная пелена
  const fogTarget = S.inHouse ? 0.032 : 0.052;
  scene.fog.density += (fogTarget - scene.fog.density) * Math.min(1, dt * 1.2);
  const fogCol = S.inHouse ? new THREE.Color(0x0c0a08) : new THREE.Color(0x0b1017);
  scene.fog.color.lerp(fogCol, Math.min(1, dt * 1.5));

  // дождь и брызги
  S.wet = S.inHouse ? 0.35 : 1;
  updateRain(dt);
  const rate = S.inHouse ? 10 : 46;
  for (let i = 0; i < rate * dt; i++) if (Math.random() < 1) spawnSplash();
  updateSplashes(dt);
  updateDrops(dt);

  // звук дождя и воды
  if (audio.ready) {
    const t = audio.ctx.currentTime;
    audio.rainGain.gain.setTargetAtTime(S.inHouse ? 0.12 : 0.36, t, 0.4);
    audio.rainLP.frequency.setTargetAtTime(S.inHouse ? 900 : 2600, t, 0.4);
    audio.humGain.gain.setTargetAtTime(S.inHouse && W.roomOf(view.x, view.z, S.level) === 'kitchen' ? 0.08 : 0, t, 0.6);
    const water = (S.faucets.kitchen && W.roomOf(view.x, view.z, S.level) === 'kitchen') || (S.faucets.wc && W.roomOf(view.x, view.z, S.level) === 'wc') || (S.faucets.ubath && W.roomOf(view.x, view.z, S.level) === 'ubath');
    audio.waterGain.gain.setTargetAtTime(water ? 0.12 : 0, t, 0.15);
    if (S.time === undefined) S.time = 0;
    S.time += dt;
    if (S.time >= audio.nextDrip) { playDrip(); audio.nextDrip = S.time + rand(0.35, 1.6); }
    if (S.time >= audio.nextThunder) { playThunder(); audio.nextThunder = S.time + rand(28, 70); thunderFlash = 1; }
  }
  if (thunderFlash > 0) { thunderFlash = Math.max(0, thunderFlash - dt * 1.5); }
  scene.environmentIntensity = 0.2 + thunderFlash * 0.25;

  // лужи и окна: капли на оверлее уже учтены выше
  // субтитры
  if (S.subLeft > 0) { S.subLeft -= dt; if (S.subLeft <= 0) subEl.classList.remove('on'); }
  // подсказка
  candidate = findCandidate();
  const hint = $('hint');
  if (candidate) { hint.textContent = labelOf(candidate); hint.classList.add('on'); }
  else hint.classList.remove('on');
}

let prev = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  if (S.started && !S.paused && !S.hiddenPause) update(dt);
  else { candidate = null; $('hint').classList.remove('on'); }
  camera.position.set(view.x, S.fy + EYE + S.bob, view.z);
  camera.rotation.set(view.pitch, view.yaw, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);

/* ---------- старт ---------- */
function start() {
  if (S.started) return;
  initAudio();
  S.started = true;
  $('intro').classList.add('hidden');
  say('Дождь. Дом перед тобой. Можно пройти внутрь или обойти вокруг.', 4.5);
}
$('start').addEventListener('pointerdown', (e) => { e.stopPropagation(); start(); });

// для тестов и отладки; не влияет на геймплей
window.__horror = {
  bake, S, view, W, scene, camera, teleport(x, z, yaw) { view.x = x; view.z = z; view.yaw = yaw ?? view.yaw; view.pitch = 0; },
  toggleFlash, start, say, inView,
  aim(x, z, tx, ty, tz) { const dx = tx - x, dz = tz - z; view.x = x; view.z = z; view.yaw = Math.atan2(-dx, -dz); view.pitch = Math.atan2(ty - (S.fy + EYE), Math.hypot(dx, dz)); },
  setFlash(on) { S.flash = !!on; $('flash').classList.toggle('off', !S.flash); },
  setLevel(l) { S.level = l; },
  press(u) { if (u) { candidate = u; tryUse(); } },
  findUse(pred) { return W.uses.find(pred) || null; },
  blocked, floorAt, tryUse, findCandidate, get candidate() { return candidate; }, camera,
};
