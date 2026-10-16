"use strict";
(function () {
  const LH = 540;
  const FLOOR = 470;
  const CEIL = 70;
  const R = 15;
  const GRAV = 4600;
  const SPIKE_S = 34;
  const SPIKE_H = 44;
  const BPM = 116;
  const BEST_KEY = "pulse-flip-best";
  const SOUND_KEY = "pulse-flip-sound";
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const COLORS = { cyan: "#3ff3ff", pink: "#ff3ecf", gold: "#ffd34e", blue: "#4d8dff", violet: "#9b6bff", white: "#ffffff" };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = function (id) { return document.getElementById(id); };

  const bgImg = new Image();
  let bgReady = false;
  bgImg.onload = function () { bgReady = true; };
  bgImg.src = "assets/city-bg.jpg";

  let W = 1;
  let H = 1;
  let S = 1;
  let LW = 960;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    S = H / LH;
    LW = W / S;
  }

  function glowSprite(color) {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,0.95)");
    grd.addColorStop(0.22, color);
    grd.addColorStop(0.6, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const GLOW = {};
  Object.keys(COLORS).forEach(function (k) { GLOW[k] = glowSprite(COLORS[k]); });

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function readNum(key) {
    try { return Number(localStorage.getItem(key)) || 0; } catch (e) { return 0; }
  }
  function writeVal(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { return; }
  }

  let sound = true;
  try { sound = localStorage.getItem(SOUND_KEY) !== "off"; } catch (e) { sound = true; }
  let actx = null;
  let master = null;
  let noiseBuf = null;
  let musicTimer = null;
  let nextStep = 0;
  let stepIdx = 0;

  function audioReady() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = sound ? 0.7 : 0;
      master.connect(actx.destination);
      noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (actx.state === "suspended") actx.resume();
    return true;
  }

  function tone(type, freq, t0, dur, vol, toFreq) {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function noise(t0, dur, vol, freq, filterType) {
    const src = actx.createBufferSource();
    src.buffer = noiseBuf;
    const f = actx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  function sfx(name) {
    if (!sound || !audioReady()) return;
    const t = actx.currentTime;
    if (name === "flip") {
      noise(t, 0.14, 0.18, 1400, "bandpass");
      tone("sine", 300, t, 0.16, 0.18, 760);
    } else if (name === "coin") {
      tone("triangle", 1046, t, 0.12, 0.2);
      tone("sine", 1568, t + 0.04, 0.14, 0.12);
    } else if (name === "near") {
      tone("square", 1760, t, 0.07, 0.04);
    } else if (name === "hit") {
      noise(t, 0.4, 0.45, 500, "lowpass");
      tone("sawtooth", 220, t, 0.45, 0.25, 35);
    } else if (name === "shield") {
      noise(t, 0.3, 0.3, 3500, "highpass");
      tone("sine", 620, t, 0.3, 0.2, 1500);
    } else if (name === "power") {
      tone("triangle", 523, t, 0.25, 0.22, 1046);
      tone("triangle", 784, t + 0.1, 0.3, 0.2, 1568);
    } else if (name === "over") {
      tone("sawtooth", 180, t, 0.9, 0.2, 40);
    } else if (name === "start") {
      tone("triangle", 440, t, 0.15, 0.2, 880);
    }
  }

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function scheduleStep(step, t) {
    const s = step % 16;
    const chord = CHORDS[Math.floor(step / 16) % CHORDS.length];
    if (s % 2 === 0) tone("triangle", mtof(chord[0] - 24), t, 0.2, 0.2);
    if (s % 4 === 0) tone("sine", 120, t, 0.2, 0.42, 42);
    if (s % 2 === 1) noise(t, 0.05, 0.05, 8000, "highpass");
    tone("triangle", mtof(chord[s % 3] + 12), t, 0.2, 0.05);
  }

  function musicStart() {
    if (!audioReady() || musicTimer) return;
    nextStep = actx.currentTime + 0.1;
    musicTimer = setInterval(function () {
      const stepDur = 60 / BPM / 4;
      while (nextStep < actx.currentTime + 0.15) {
        if (sound) scheduleStep(stepIdx, nextStep);
        nextStep += stepDur;
        stepIdx++;
      }
    }, 30);
  }

  function musicStop() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function toggleSound() {
    sound = !sound;
    writeVal(SOUND_KEY, sound ? "on" : "off");
    if (master) master.gain.value = sound ? 0.7 : 0;
    refreshSoundLabel();
  }

  function refreshSoundLabel() {
    $("sound-btn").textContent = sound ? "Звук: вкл" : "Звук: выкл";
  }

  let st = "menu";
  let best = readNum(BEST_KEY);
  let w = null;
  const stars = [];
  for (let i = 0; i < 70; i++) {
    stars.push({ x: Math.random(), y: Math.random(), v: rand(0.3, 1), r: rand(0.8, 2), p: rand(0, 6) });
  }

  function PX() { return LW * 0.22; }
  function surfaceY(side) { return side > 0 ? FLOOR - 40 : CEIL + 40; }

  function newWorld() {
    return {
      t: 0,
      speed: 360,
      score: 0,
      gems: 0,
      combo: 0,
      maxCombo: 0,
      mult: 1,
      near: 0,
      shield: false,
      magnet: 0,
      shake: 0,
      flash: 0,
      dying: false,
      deadT: 0,
      bgX: 0,
      p: { y: FLOOR - R, vy: 0, dir: 1, squash: 0, ring: 0, trail: 0 },
      obs: [],
      pick: [],
      parts: [],
      texts: [],
      spawnX: LW + 200
    };
  }

  function burst(x, y, g, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * rand(0.3, 1);
      w.parts.push({ kind: "spark", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rand(0.35, 0.8), size: rand(6, 14), g: g });
    }
    if (n > 8) w.parts.push({ kind: "ring", x: x, y: y, life: 0, max: 0.45, r: R, g: g });
    if (w.parts.length > 360) w.parts.splice(0, w.parts.length - 360);
  }

  function text(str, x, y, g) {
    w.texts.push({ str: str, x: x, y: y, life: 0, max: 0.9, g: g });
  }

  function addSpike(x, side, n) {
    w.obs.push({ x: x, side: side, n: n, w: n * SPIKE_S, near: false, dead: false });
  }

  function addPick(x, y, kind) {
    w.pick.push({ x: x, y: y, kind: kind, taken: false, spin: rand(0, 6) });
  }

  function spawnAhead() {
    while (w.spawnX < LW + 300) {
      const x = w.spawnX;
      let kind = pick(["single", "run", "run", "arc", "gems", "power"]);
      if (w.t < 5) kind = "gems";
      if (kind === "power" && w.t < 12) kind = "gems";
      if (kind === "single") {
        const side = pick([1, -1]);
        const n = Math.random() < 0.5 ? 2 : 3;
        addSpike(x, side, n);
        for (let i = 0; i < 4; i++) addPick(x + 10 + i * 34, surfaceY(-side), "gem");
        w.spawnX = x + n * SPIKE_S + rand(280, 360);
      } else if (kind === "run") {
        const gapX = Math.max(250, w.speed * 0.66);
        const count = 3 + Math.floor(rand(0, 3));
        let side = pick([1, -1]);
        let cx = x;
        for (let i = 0; i < count; i++) {
          addSpike(cx, side, 2);
          addPick(cx + (gapX + 68) / 2, surfaceY(-side), "gem");
          side = Math.random() < 0.75 ? -side : side;
          cx += gapX;
        }
        w.spawnX = cx + 200;
      } else if (kind === "arc") {
        const base = pick([300, 250]);
        for (let i = 0; i < 7; i++) addPick(x + i * 36, base - 110 * Math.sin((i / 6) * Math.PI), "gem");
        w.spawnX = x + 6 * 36 + 300;
      } else if (kind === "gems") {
        const side = pick([1, -1]);
        for (let i = 0; i < 6; i++) addPick(x + i * 34, surfaceY(side), "gem");
        w.spawnX = x + 5 * 34 + 260;
      } else {
        const side = pick([1, -1]);
        addPick(x + 20, surfaceY(side), pick(["shield", "magnet"]));
        w.spawnX = x + 300;
      }
    }
  }

  function flip() {
    if (st !== "play" || !w || w.dying) return;
    const p = w.p;
    p.dir = -p.dir;
    p.vy = 0;
    p.squash = 1;
    p.ring = 1;
    burst(PX(), p.y, p.dir > 0 ? "cyan" : "pink", 14, 220);
    sfx("flip");
  }

  function updatePlayer(dt) {
    const p = w.p;
    p.vy += GRAV * p.dir * dt;
    p.y += p.vy * dt;
    const lo = CEIL + R;
    const hi = FLOOR - R;
    if (p.y >= hi) {
      p.y = hi;
      if (p.vy > 0) p.vy = 0;
    }
    if (p.y <= lo) {
      p.y = lo;
      if (p.vy < 0) p.vy = 0;
    }
    p.squash = Math.max(0, p.squash - dt * 5);
    p.ring = Math.max(0, p.ring - dt * 3);
    p.trail -= dt;
    if (p.trail <= 0) {
      p.trail = 0.016;
      w.parts.push({ kind: "spark", x: PX(), y: p.y, vx: -w.speed * 0.25 + rand(-30, 30), vy: rand(-25, 25), life: 0, max: 0.4, size: 8, g: p.dir > 0 ? "cyan" : "pink" });
    }
  }

  function updateWorld(dt) {
    w.t += dt;
    w.speed = 360 + Math.min(340, w.t * 7);
    const d = w.speed * dt;
    w.bgX += d * 0.22;
    w.score += d * 0.02;
    w.spawnX -= d;
    w.magnet = Math.max(0, w.magnet - dt);
    w.obs.forEach(function (o) { o.x -= d; });
    w.pick.forEach(function (k) { k.x -= d; });
    w.obs = w.obs.filter(function (o) { return !o.dead && o.x + o.w > -60; });
  }

  function take(k) {
    k.taken = true;
    if (k.kind === "gem") {
      w.combo++;
      w.maxCombo = Math.max(w.maxCombo, w.combo);
      w.mult = 1 + Math.min(7, Math.floor(w.combo / 5));
      w.gems++;
      const pts = 10 * w.mult;
      w.score += pts;
      burst(k.x, k.y, "gold", 10, 260);
      text("+" + pts, k.x, k.y - 16, "gold");
      sfx("coin");
    } else if (k.kind === "shield") {
      w.shield = true;
      burst(k.x, k.y, "blue", 18, 300);
      text("ЩИТ", k.x, k.y - 16, "blue");
      sfx("power");
    } else {
      w.magnet = 6;
      burst(k.x, k.y, "violet", 18, 300);
      text("МАГНИТ", k.x, k.y - 16, "violet");
      sfx("power");
    }
  }

  function checkPicks() {
    const px = PX();
    const py = w.p.y;
    w.pick.forEach(function (k) {
      if (k.taken) return;
      if (w.magnet > 0 && k.kind === "gem") {
        const mx = px - k.x;
        const my = py - k.y;
        if (mx * mx + my * my < 220 * 220) {
          k.x += mx * 0.12;
          k.y += my * 0.12;
        }
      }
      const dx = k.x - px;
      const dy = k.y - py;
      if (dx * dx + dy * dy < (R + 16) * (R + 16)) {
        take(k);
      } else if (k.kind === "gem" && k.x < px - 24) {
        k.taken = true;
        w.combo = 0;
        w.mult = 1;
      }
    });
    w.pick = w.pick.filter(function (k) { return !k.taken && k.x > -60; });
  }

  function die() {
    if (w.dying) return;
    w.dying = true;
    w.deadT = 0;
    const px = PX();
    burst(px, w.p.y, "pink", 50, 520);
    burst(px, w.p.y, "white", 26, 380);
    w.shake = 22;
    w.flash = 1;
    sfx("hit");
    if (navigator.vibrate) navigator.vibrate(80);
  }

  function checkObstacles() {
    const px = PX();
    const py = w.p.y;
    for (let i = 0; i < w.obs.length; i++) {
      const o = w.obs[i];
      if (o.x > px + R + 40 || o.x + o.w < px - R - 40) continue;
      const tip = o.side > 0 ? FLOOR - SPIKE_H * 0.8 : CEIL + SPIKE_H * 0.8;
      const edge = o.side > 0 ? py + R : py - R;
      const gap = o.side > 0 ? tip - edge : edge - tip;
      const overlapX = px + 8 > o.x + 4 && px - 8 < o.x + o.w - 4;
      if (overlapX && gap < 0) {
        if (w.shield) {
          w.shield = false;
          o.dead = true;
          burst(px, py, "blue", 30, 360);
          w.shake = 10;
          sfx("shield");
          return;
        }
        die();
        return;
      }
      const nearX = px + R + 14 > o.x && px - R - 14 < o.x + o.w;
      if (!o.near && nearX && gap >= 0 && gap < 16) {
        o.near = true;
        w.near++;
        w.score += 50;
        text("БЛИЗКО +50", px, py - 36, "cyan");
        burst(px, edge, "cyan", 8, 200);
        sfx("near");
      }
    }
  }

  function updateFx(dt) {
    w.parts.forEach(function (p) {
      p.life += dt;
      if (p.kind === "spark") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.exp(-3 * dt);
        p.vy *= Math.exp(-3 * dt);
      }
    });
    w.parts = w.parts.filter(function (p) { return p.life < p.max; });
    w.texts.forEach(function (t) { t.life += dt; });
    w.texts = w.texts.filter(function (t) { return t.life < t.max; });
  }

  function gameOver() {
    st = "over";
    musicStop();
    sfx("over");
    const score = Math.floor(w.score);
    const isBest = score > best;
    if (isBest) {
      best = score;
      writeVal(BEST_KEY, String(best));
    }
    $("over-score").textContent = String(score);
    $("over-gems").textContent = String(w.gems);
    $("over-combo").textContent = "x" + w.maxCombo;
    $("over-near").textContent = String(w.near);
    $("over-note").textContent = isBest ? "НОВЫЙ РЕКОРД" : "Рекорд " + best;
    setUI("over");
  }

  function setUI(view) {
    ["menu", "pause", "over"].forEach(function (n) { $(n).classList.toggle("show", view === n); });
    $("hud").classList.toggle("show", view === "play" || view === "pause");
  }

  function startGame() {
    audioReady();
    musicStart();
    sfx("start");
    w = newWorld();
    st = "play";
    setUI("play");
  }

  function pauseGame() {
    if (st !== "play" || w.dying) return;
    st = "pause";
    setUI("pause");
  }

  function resumeGame() {
    if (st !== "pause") return;
    st = "play";
    setUI("play");
  }

  function toMenu() {
    st = "menu";
    w = newWorld();
    refreshMenu();
    setUI("menu");
  }

  function refreshMenu() {
    $("menu-best").textContent = best ? "Рекорд: " + best : "Рекорд пока не поставлен";
  }

  const hudCache = {};
  function setText(id, s) {
    if (hudCache[id] !== s) {
      hudCache[id] = s;
      $(id).textContent = s;
    }
  }

  function updateHud() {
    setText("score", String(Math.floor(w.score)));
    setText("mult", "x" + w.mult);
    $("shield-ind").classList.toggle("show", w.shield);
    $("magnet-ind").classList.toggle("show", w.magnet > 0);
  }

  function glow(sprite, x, y, r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  function drawBackground() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0b0620";
    ctx.fillRect(0, 0, W, H);
    if (bgReady) {
      const sc = Math.max(W / bgImg.width, H / bgImg.height);
      const dw = bgImg.width * sc;
      const dh = bgImg.height * sc;
      const ox = -((w.bgX * S * 0.5) % dw);
      const oy = (H - dh) / 2;
      ctx.drawImage(bgImg, ox, oy, dw, dh);
      ctx.drawImage(bgImg, ox + dw, oy, dw, dh);
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(11,6,32,0.25)");
    g.addColorStop(1, "rgba(11,6,32,0.78)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function neon(y, color) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(LW + 20, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(LW + 20, y);
    ctx.stroke();
  }

  function drawTrack() {
    const fg = ctx.createLinearGradient(0, FLOOR, 0, LH);
    fg.addColorStop(0, "rgba(255,62,207,0.2)");
    fg.addColorStop(1, "rgba(20,8,40,0.95)");
    ctx.fillStyle = fg;
    ctx.fillRect(-20, FLOOR, LW + 40, LH - FLOOR + 20);
    const cg = ctx.createLinearGradient(0, 0, 0, CEIL);
    cg.addColorStop(0, "rgba(20,8,40,0.95)");
    cg.addColorStop(1, "rgba(63,243,255,0.2)");
    ctx.fillStyle = cg;
    ctx.fillRect(-20, -20, LW + 40, CEIL + 20);
    const off = (w.bgX * 1.6) % 70;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,62,207,0.16)";
    ctx.beginPath();
    for (let x = -off; x < LW + 70; x += 70) {
      ctx.moveTo(x, FLOOR);
      ctx.lineTo(x - 30, LH + 10);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(63,243,255,0.16)";
    ctx.beginPath();
    for (let x = -off; x < LW + 70; x += 70) {
      ctx.moveTo(x, CEIL);
      ctx.lineTo(x - 30, -10);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    neon(FLOOR, COLORS.pink);
    neon(CEIL, COLORS.cyan);
    ctx.globalAlpha = 1;
  }

  function drawStars(t) {
    ctx.globalCompositeOperation = "lighter";
    stars.forEach(function (s) {
      const x = (((s.x * LW - w.bgX * s.v * 3) % LW) + LW) % LW;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 2 + s.p);
      ctx.fillStyle = "#cfe9ff";
      ctx.fillRect(x, s.y * LH, s.r, s.r);
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawObstacle(o) {
    const top = o.side > 0 ? FLOOR : CEIL;
    const dir = o.side > 0 ? -1 : 1;
    ctx.beginPath();
    for (let i = 0; i < o.n; i++) {
      const x0 = o.x + i * SPIKE_S;
      ctx.moveTo(x0, top);
      ctx.lineTo(x0 + SPIKE_S / 2, top + dir * SPIKE_H);
      ctx.lineTo(x0 + SPIKE_S, top);
    }
    ctx.fillStyle = "#ff4d6d";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    glow(GLOW.pink, o.x + o.w / 2, top + dir * SPIKE_H * 0.35, o.w * 0.55, 0.35);
  }

  function drawPick(k, t) {
    const y = k.y + Math.sin(t * 4 + k.spin) * 2;
    if (k.kind === "gem") {
      glow(GLOW.gold, k.x, y, 26, 0.7);
      ctx.save();
      ctx.translate(k.x, y);
      ctx.rotate(Math.sin(t * 2.5 + k.spin) * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fillStyle = COLORS.gold;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fillStyle = "#fff8d6";
      ctx.fill();
      ctx.restore();
    } else if (k.kind === "shield") {
      glow(GLOW.blue, k.x, y, 34, 0.8);
      ctx.beginPath();
      ctx.arc(k.x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#1c3c8a";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.blue;
      ctx.stroke();
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -t * 30;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#9cc4ff";
      ctx.beginPath();
      ctx.arc(k.x, y, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      glow(GLOW.violet, k.x, y, 34, 0.8);
      ctx.beginPath();
      ctx.arc(k.x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#2a1959";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.violet;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("M", k.x, y + 1);
    }
  }

  function drawPlayer(t) {
    const p = w.p;
    const x = PX();
    const gk = p.dir > 0 ? "cyan" : "pink";
    glow(GLOW[gk], x, p.y, 58, 0.9);
    const sx = 1 + p.squash * 0.35;
    const sy = 1 - p.squash * 0.25;
    ctx.save();
    ctx.translate(x, p.y);
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS[gk];
    ctx.stroke();
    ctx.restore();
    if (p.ring > 0) {
      ctx.globalAlpha = p.ring;
      ctx.strokeStyle = COLORS[gk];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, p.y, R + (1 - p.ring) * 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (w.shield) {
      glow(GLOW.blue, x, p.y, 40, 0.5);
      ctx.beginPath();
      ctx.arc(x, p.y, R + 11 + Math.sin(t * 8) * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawFx() {
    w.parts.forEach(function (p) {
      const k = p.life / p.max;
      if (p.kind === "ring") {
        ctx.globalAlpha = (1 - k) * 0.9;
        ctx.strokeStyle = COLORS[p.g];
        ctx.lineWidth = 3 * (1 - k) + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + k * 90, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        glow(GLOW[p.g], p.x, p.y, p.size * (1 - k * 0.6), 1 - k);
      }
    });
    ctx.font = "800 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    w.texts.forEach(function (t) {
      const k = t.life / t.max;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = COLORS[t.g];
      ctx.fillText(t.str, t.x, t.y - k * 34);
    });
    ctx.globalAlpha = 1;
  }

  function render(t) {
    drawBackground();
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    if (w.shake > 0) ctx.translate(rand(-w.shake, w.shake), rand(-w.shake, w.shake));
    drawStars(t);
    drawTrack();
    w.obs.forEach(drawObstacle);
    w.pick.forEach(function (k) { drawPick(k, t); });
    drawPlayer(t);
    drawFx();
    if (w.flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + (w.flash * 0.45).toFixed(3) + ")";
      ctx.fillRect(-60, -60, LW + 120, LH + 120);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (st === "play" && H > W) pauseGame();
    if (st === "play") {
      const k = w.dying ? 0.3 : 1;
      updatePlayer(dt * k);
      if (!w.dying) {
        updateWorld(dt);
        spawnAhead();
        checkPicks();
        checkObstacles();
      } else {
        w.deadT += dt;
        if (w.deadT > 1.1) gameOver();
      }
      updateFx(dt * k);
      w.flash = Math.max(0, w.flash - dt * 1.5);
      w.shake = Math.max(0, w.shake - dt * 50);
      updateHud();
    } else {
      w.bgX += dt * 40;
      updateFx(dt);
    }
    render(now / 1000);
    requestAnimationFrame(frame);
  }

  $("play-btn").addEventListener("click", startGame);
  $("retry-btn").addEventListener("click", startGame);
  $("pause-btn").addEventListener("click", pauseGame);
  $("resume-btn").addEventListener("click", resumeGame);
  $("pause-menu-btn").addEventListener("click", toMenu);
  $("over-menu-btn").addEventListener("click", toMenu);
  $("sound-btn").addEventListener("click", toggleSound);

  $("app").addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("button")) return;
    flip();
  });

  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      if (st === "play") flip();
      else if (st === "menu") startGame();
    } else if (e.code === "Escape") {
      if (st === "play") pauseGame();
      else if (st === "pause") resumeGame();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && st === "play") pauseGame();
  });

  window.addEventListener("resize", resize);

  resize();
  w = newWorld();
  refreshSoundLabel();
  refreshMenu();
  setUI("menu");
  requestAnimationFrame(frame);
})();
