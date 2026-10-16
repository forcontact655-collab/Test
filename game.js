"use strict";
(function () {
  const LH = 540;
  const SAVE_KEY = "honey-swarm-v1";
  const OFFLINE_MAX = 8 * 3600;
  const OFFLINE_RATE = 0.5;
  const ROYAL_NEED = 1e6;
  const ENDING_ROYAL = 10;
  const MAX_FLOWERS_SHOWN = 24;
  const MAX_BEES_SHOWN = 60;
  const SUF = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];
  const UPG = [
    { id: "bee", name: "Рабочие пчёлы", base: 10, grow: 1.15, max: 5000, desc: "Каждая пчела постоянно носит мёд в улей" },
    { id: "flower", name: "Цветы", base: 60, grow: 1.5, max: 60, desc: "Больше цветов: каждая пчела собирает больше" },
    { id: "comb", name: "Соты", base: 120, grow: 1.4, max: 200, desc: "+1 мёд за каждый тап по улью" },
    { id: "jelly", name: "Маточное молочко", base: 800, grow: 2.2, max: 60, desc: "×1,25 ко всему сбору за уровень" },
    { id: "auto", name: "Автосбор", base: 3000, grow: 2.6, max: 200, desc: "Соты собираются сами: тап в секунду за уровень" },
    { id: "nursery", name: "Нянька", base: 15000, grow: 2.8, max: 100, desc: "Каждые 20 с рождается пчела за уровень" }
  ];
  const MILES = [
    [1e3, "Первые соты"],
    [1e4, "Пасека растёт"],
    [1e5, "Полный улей"],
    [1e6, "Королевский рой"],
    [1e8, "Медовая река"],
    [1e10, "Легенда полей"]
  ];
  const PALETTE = ["#ff7ab6", "#b98cff", "#ffd34e", "#ff9f5a", "#7fd3ff", "#ffffff"];

  const $ = function (id) { return document.getElementById(id); };
  const canvas = $("scene");
  const ctx = canvas.getContext("2d");
  const bgImg = new Image();
  let bgReady = false;
  let bgCanvas = null;
  bgImg.onload = function () {
    bgReady = true;
    buildBg();
  };
  bgImg.src = "assets/meadow.jpg";

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
    buildBg();
  }

  function buildBg() {
    if (!bgReady || W <= 1) return;
    bgCanvas = document.createElement("canvas");
    bgCanvas.width = Math.round(W * dpr);
    bgCanvas.height = Math.round(H * dpr);
    const c = bgCanvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = "#2b1d08";
    c.fillRect(0, 0, W, H);
    const sc = Math.max(W / bgImg.width, H / bgImg.height);
    const dw = bgImg.width * sc;
    const dh = bgImg.height * sc;
    c.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const g = c.createLinearGradient(0, H * 0.5, 0, H);
    g.addColorStop(0, "rgba(43,29,8,0)");
    g.addColorStop(1, "rgba(43,29,8,0.55)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  function fresh() {
    return {
      honey: 0,
      total: 0,
      lv: { bee: 0, flower: 0, comb: 0, jelly: 0, auto: 0, nursery: 0 },
      extra: 0,
      nurse: 0,
      royal: 0,
      ach: [],
      ending: false,
      lastSeen: Date.now(),
      mode: 1,
      muted: false
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh();
      const d = JSON.parse(raw);
      const f = fresh();
      return Object.assign(f, d, { lv: Object.assign(f.lv, d.lv || {}) });
    } catch (e) {
      return fresh();
    }
  }

  function save() {
    state.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { return; }
  }

  let state = load();

  function fmt(n) {
    if (n < 1000) return String(Math.floor(n));
    let i = 0;
    let v = n;
    while (v >= 1000 && i < SUF.length - 1) {
      v /= 1000;
      i++;
    }
    const s = v >= 100 ? v.toFixed(0) : v.toFixed(1);
    return s.replace(/\.0$/, "") + SUF[i];
  }

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + " ч " + m + " мин";
    return Math.max(1, m) + " мин";
  }

  function beeCount() { return 1 + state.lv.bee + state.extra; }
  function flowerCount() { return 3 + state.lv.flower; }
  function jellyMult() { return Math.pow(1.25, state.lv.jelly); }
  function royalMult() { return 1 + 0.2 * state.royal; }
  function tapValue() { return (1 + state.lv.comb) * jellyMult() * royalMult(); }
  function perSec() {
    return beeCount() * (1 + 0.06 * flowerCount()) * jellyMult() * royalMult() + state.lv.auto * tapValue();
  }
  function royalGain() { return Math.floor(Math.sqrt(state.total / ROYAL_NEED)); }

  function costFor(u, n) {
    const lv = state.lv[u.id];
    return u.base * Math.pow(u.grow, lv) * (Math.pow(u.grow, n) - 1) / (u.grow - 1);
  }

  function buyCount(u) {
    return Math.max(0, Math.min(state.mode, u.max - state.lv[u.id]));
  }

  function buy(u) {
    let n = buyCount(u);
    while (n > 0 && state.honey < costFor(u, n)) n--;
    if (n <= 0) return;
    state.honey -= costFor(u, n);
    state.lv[u.id] += n;
    sfx("buy");
    renderShop();
    save();
  }

  function addHoney(v) {
    state.honey += v;
    state.total += v;
    MILES.forEach(function (m, i) {
      if (state.total >= m[0] && state.ach.indexOf(i) < 0) {
        state.ach.push(i);
        toast(m[1]);
        sfx("mile");
      }
    });
  }

  function toast(str) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = str;
    $("toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  let modalOk = null;
  function openModal(title, text, okText, onOk, cancelText) {
    $("modal-title").textContent = title;
    $("modal-text").textContent = text;
    $("modal-ok").textContent = okText || "Ок";
    $("modal-cancel").textContent = cancelText || "Отмена";
    $("modal-cancel").classList.toggle("hidden", !cancelText);
    modalOk = onOk || null;
    $("modal").classList.add("show");
  }

  function closeModal() {
    $("modal").classList.remove("show");
    modalOk = null;
  }

  function prestige(g) {
    state = Object.assign(fresh(), {
      royal: state.royal + g,
      ach: state.ach,
      ending: state.ending,
      mode: state.mode,
      muted: state.muted
    });
    sfx("mile");
    toast("Новый рой: +" + g);
    syncSound();
    renderShop();
    save();
  }

  function askPrestige() {
    const g = royalGain();
    if (g <= 0) return;
    const after = Math.round(20 * (state.royal + g));
    openModal("Новый рой", "Мёд и улучшения сбросятся. Получишь +" + g + " к бонусу, он станет +" + after + "% ко всему сбору.", "Начать", function () { prestige(g); }, "Отмена");
  }

  function applyOffline() {
    const away = Math.min((Date.now() - state.lastSeen) / 1000, OFFLINE_MAX);
    if (away < 30) return;
    const gain = perSec() * away * OFFLINE_RATE;
    if (gain < 1) return;
    addHoney(gain);
    openModal("Пока тебя не было", "Рой работал " + fmtTime(away) + " и собрал +" + fmt(gain) + " мёда.", "Ок");
  }

  function showEnding() {
    state.ending = true;
    openModal("Королевский рой", "Ты поднял " + state.royal + " роёв. Улей процветает, можно продолжать дальше.", "Продолжить");
    save();
  }

  function tick(dt) {
    addHoney(perSec() * dt);
    if (state.lv.nursery > 0) {
      state.nurse += dt * state.lv.nursery;
      while (state.nurse >= 20) {
        state.nurse -= 20;
        state.extra++;
        toast("Родилась пчела");
      }
    }
    if (!state.ending && state.royal >= ENDING_ROYAL) showEnding();
  }

  let actx = null;
  let master = null;

  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = state.muted ? 0 : 0.6;
      master.connect(actx.destination);
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  function beep(f0, f1, dur, vol, type) {
    const a = audio();
    if (!a || state.muted) return;
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function sfx(k) {
    if (k === "tap") beep(660, 880, 0.1, 0.15);
    else if (k === "buy") beep(440, 660, 0.15, 0.2, "triangle");
    else if (k === "pop") beep(1200, 600, 0.08, 0.1);
    else if (k === "mile") {
      beep(523, 0, 0.2, 0.2, "triangle");
      setTimeout(function () { beep(659, 0, 0.2, 0.2, "triangle"); }, 120);
      setTimeout(function () { beep(784, 0, 0.3, 0.2, "triangle"); }, 240);
    }
  }

  function syncSound() {
    if (master) master.gain.value = state.muted ? 0 : 0.6;
    $("sound-btn").textContent = state.muted ? "Звук: выкл" : "Звук: вкл";
  }

  function buildShop() {
    UPG.forEach(function (u) {
      const el = document.createElement("button");
      el.className = "item";
      el.type = "button";
      el.innerHTML = '<div class="it-top"><b></b><span class="lv"></span></div><div class="it-desc"></div><div class="it-price"></div>';
      el.querySelector("b").textContent = u.name;
      el.querySelector(".it-desc").textContent = u.desc;
      el.addEventListener("click", function () { buy(u); });
      $("items").appendChild(el);
      u.el = el;
      u.lvEl = el.querySelector(".lv");
      u.priceEl = el.querySelector(".it-price");
    });
  }

  function renderShop() {
    UPG.forEach(function (u) {
      const n = buyCount(u);
      u.lvEl.textContent = "ур. " + state.lv[u.id];
      if (n <= 0) {
        u.priceEl.textContent = "Максимум";
        u.el.disabled = true;
        u.el.classList.remove("can");
        return;
      }
      const c = costFor(u, n);
      const can = state.honey >= c;
      u.priceEl.textContent = "Купить x" + n + " — " + fmt(c);
      u.el.disabled = !can;
      u.el.classList.toggle("can", can);
    });
    document.querySelectorAll(".mode").forEach(function (b) {
      b.classList.toggle("on", Number(b.dataset.mode) === state.mode);
    });
    $("stats").textContent = "Пчёл " + beeCount() + " · Цветов " + flowerCount();
  }

  function renderHud() {
    $("honey").textContent = fmt(state.honey);
    $("rate").textContent = "+" + fmt(perSec()) + "/с";
    const g = royalGain();
    const rb = $("royal-btn");
    rb.disabled = g <= 0;
    rb.classList.toggle("ready", g > 0);
    rb.textContent = g > 0 ? "Новый рой +" + g : "Новый рой (от 1 млн)";
  }

  const flowers = [];
  for (let i = 0; i < MAX_FLOWERS_SHOWN; i++) {
    flowers.push({ nx: rand(0.04, 0.64), ny: rand(0.58, 0.9), ph: rand(0, 6.28), bloom: 1, c: PALETTE[i % PALETTE.length] });
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  const cells = [];
  (function buildCells() {
    const r = 7.5;
    for (let row = -9; row <= 0; row++) {
      for (let col = -9; col <= 9; col++) {
        const dx = col * r * 1.75 + (row % 2 ? r * 0.87 : 0);
        const dy = row * r * 1.5 - 40;
        if (dx * dx + (dy + 40) * (dy + 40) / 1.5 < 92 * 92 && dy < -2) cells.push({ dx: dx, dy: dy, d: Math.hypot(dx, dy + 60) });
      }
    }
    cells.sort(function (a, b) { return a.d - b.d; });
  })();
  let shownCells = 0;
  let hivePulse = 0;
  const HIVE_W = 300;
  const HIVE_H = 230;
  const HIVE_OX = 150;
  const HIVE_OY = 160;
  let hiveCache = null;
  let hiveKey = -1;
  let hiveK = 0;

  const bees = [];
  let particles = [];
  let texts = [];

  function hiveX() { return LW * 0.3; }
  function hiveY() { return LH * 0.64; }

  function flowerPos(f) {
    return { x: f.nx * LW, y: f.ny * LH };
  }

  function pickTarget(b) {
    if (b.toHive) {
      b.tx = hiveX();
      b.ty = hiveY() + 12;
    } else {
      const n = Math.min(flowerCount(), MAX_FLOWERS_SHOWN);
      const f = flowers[Math.floor(Math.random() * n)];
      const p = flowerPos(f);
      b.tx = p.x + rand(-10, 10);
      b.ty = p.y - 20 + rand(-10, 10);
    }
  }

  function syncBees() {
    const n = Math.min(beeCount(), MAX_BEES_SHOWN);
    while (bees.length < n) {
      const b = { x: hiveX(), y: hiveY() + 12, tx: 0, ty: 0, toHive: false, ph: rand(0, 6.28), sp: rand(150, 230) };
      pickTarget(b);
      bees.push(b);
    }
    if (bees.length > n) bees.length = n;
  }

  function updateBees(dt, t) {
    bees.forEach(function (b) {
      const dx = b.tx - b.x;
      const dy = b.ty - b.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        b.toHive = !b.toHive;
        pickTarget(b);
        return;
      }
      const step = Math.min(d, b.sp * dt);
      b.x += dx / d * step + Math.sin(t * 6 + b.ph) * 0.6;
      b.y += dy / d * step + Math.cos(t * 5 + b.ph) * 0.6;
      b.ang = Math.atan2(dy, dx);
    });
  }

  function burst(x, y, c, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = sp * rand(0.3, 1);
      particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: rand(0.5, 0.9), c: c, r: rand(2, 4.5) });
    }
    if (particles.length > 300) particles.splice(0, particles.length - 300);
  }

  function popup(str, x, y) {
    texts.push({ str: str, x: x, y: y, life: 0, max: 0.9 });
  }

  function updateFx(dt) {
    particles.forEach(function (p) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
    });
    particles = particles.filter(function (p) { return p.life < p.max; });
    texts.forEach(function (t) { t.life += dt; });
    texts = texts.filter(function (t) { return t.life < t.max; });
  }

  function hexPath(g, cx, cy, r) {
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i + Math.PI / 6;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
  }

  function drawBackground() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#2b1d08";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);
  }

  function drawFlowers(t) {
    const n = Math.min(flowerCount(), MAX_FLOWERS_SHOWN);
    for (let i = 0; i < n; i++) {
      const f = flowers[i];
      if (f.bloom < 1) f.bloom = Math.min(1, f.bloom + 0.02);
      const p = flowerPos(f);
      const sway = Math.sin(t * 1.3 + f.ph) * 5;
      ctx.strokeStyle = "rgba(90,140,60,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(p.x + sway * 0.4, p.y + 25, p.x + sway, p.y + 48);
      ctx.stroke();
      const pr = 4 + 8 * f.bloom;
      ctx.fillStyle = f.c;
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2 + t * 0.2;
        ctx.beginPath();
        ctx.arc(p.x + sway + Math.cos(a) * pr * 0.9, p.y - 20 + Math.sin(a) * pr * 0.9, pr * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffd34e";
      ctx.beginPath();
      ctx.arc(p.x + sway, p.y - 20, pr * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function paintHive(g, filled) {
    const grad = g.createLinearGradient(0, -130, 0, 30);
    grad.addColorStop(0, "#ffe08a");
    grad.addColorStop(0.55, "#d99a35");
    grad.addColorStop(1, "#7a4a14");
    g.beginPath();
    g.moveTo(-112, 34);
    g.bezierCurveTo(-112, -72, -60, -128, 0, -128);
    g.bezierCurveTo(60, -128, 112, -72, 112, 34);
    g.closePath();
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = "#5b3209";
    g.lineWidth = 3;
    g.stroke();
    g.strokeStyle = "rgba(91,50,9,0.45)";
    g.lineWidth = 2;
    [-96, -60, -26].forEach(function (y) {
      g.beginPath();
      g.moveTo(-108, y + 6);
      g.quadraticCurveTo(0, y - 6, 108, y + 6);
      g.stroke();
    });
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      hexPath(g, c.dx, c.dy, 7);
      if (i < filled) {
        g.fillStyle = "#ffc83d";
        g.fill();
        g.strokeStyle = "#8c5418";
      } else {
        g.fillStyle = "rgba(91,50,9,0.35)";
        g.fill();
        g.strokeStyle = "rgba(91,50,9,0.6)";
      }
      g.lineWidth = 1.2;
      g.stroke();
    }
    g.fillStyle = "#3a2107";
    g.beginPath();
    g.ellipse(0, 26, 18, 9, 0, 0, Math.PI * 2);
    g.fill();
  }

  function drawHive() {
    const hx = hiveX();
    const hy = hiveY();
    const filled = Math.round(shownCells);
    const k = S * dpr;
    if (!hiveCache) hiveCache = document.createElement("canvas");
    if (hiveKey !== filled || hiveK !== k) {
      hiveCache.width = Math.ceil(HIVE_W * k);
      hiveCache.height = Math.ceil(HIVE_H * k);
      const g = hiveCache.getContext("2d");
      g.setTransform(k, 0, 0, k, HIVE_OX * k, HIVE_OY * k);
      paintHive(g, filled);
      hiveKey = filled;
      hiveK = k;
    }
    ctx.fillStyle = "rgba(20,12,3,0.35)";
    ctx.beginPath();
    ctx.ellipse(hx, hy + 44, 120, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    const pulse = 1 + hivePulse * 0.04;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(pulse, pulse);
    ctx.drawImage(hiveCache, -HIVE_OX, -HIVE_OY, HIVE_W, HIVE_H);
    ctx.restore();
  }

  function drawBees(t) {
    bees.forEach(function (b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.ang || 0);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.save();
      ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(t * 40 + b.ph)));
      ctx.beginPath();
      ctx.ellipse(-2, -6, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffd34e";
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b1d08";
      ctx.fillRect(-2.5, -5, 2, 10);
      ctx.fillRect(1.5, -5, 2, 10);
      ctx.restore();
    });
  }

  function drawFx() {
    ctx.globalCompositeOperation = "lighter";
    particles.forEach(function (p) {
      const k = p.life / p.max;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.font = "800 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    texts.forEach(function (tx) {
      const k = tx.life / tx.max;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = "#ffd34e";
      ctx.fillText(tx.str, tx.x, tx.y - k * 36);
    });
    ctx.globalAlpha = 1;
  }

  function drawScene(t) {
    drawBackground();
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    drawFlowers(t);
    drawHive(t);
    drawBees(t);
    drawFx();
  }

  function onTap(e) {
    if ($("modal").classList.contains("show")) return;
    audio();
    const x = e.clientX / S;
    const y = e.clientY / S;
    const hx = hiveX();
    const hy = hiveY();
    if (Math.hypot(x - hx, y - hy) < 120) {
      const v = tapValue();
      addHoney(v);
      hivePulse = 1;
      burst(x, y, "#ffd34e", 12, 220);
      popup("+" + fmt(v), x, y - 20);
      sfx("tap");
      return;
    }
    const n = Math.min(flowerCount(), MAX_FLOWERS_SHOWN);
    for (let i = 0; i < n; i++) {
      const p = flowerPos(flowers[i]);
      if (Math.hypot(x - p.x, y - (p.y - 20)) < 34) {
        const v = tapValue() * 2;
        addHoney(v);
        flowers[i].bloom = 0;
        burst(p.x, p.y - 20, flowers[i].c, 10, 180);
        popup("+" + fmt(v), p.x, p.y - 40);
        sfx("pop");
        return;
      }
    }
  }

  let last = performance.now();
  let clock = 0;
  let shopAcc = 0;
  let saveAcc = 0;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    clock += dt;
    if (!$("modal").classList.contains("show")) tick(dt);
    syncBees();
    updateBees(dt, clock);
    const target = Math.min(cells.length, Math.floor(Math.log10(state.total + 1) * 9));
    shownCells += (target - shownCells) * Math.min(1, dt * 3);
    hivePulse = Math.max(0, hivePulse - dt * 4);
    updateFx(dt);
    drawScene(clock);
    shopAcc += dt;
    if (shopAcc > 0.25) {
      shopAcc = 0;
      renderHud();
      renderShop();
    }
    saveAcc += dt;
    if (saveAcc > 3) {
      saveAcc = 0;
      save();
    }
    requestAnimationFrame(frame);
  }

  $("royal-btn").addEventListener("click", askPrestige);
  $("sound-btn").addEventListener("click", function () {
    state.muted = !state.muted;
    syncSound();
    save();
  });
  document.querySelectorAll(".mode").forEach(function (b) {
    b.addEventListener("click", function () {
      state.mode = Number(b.dataset.mode);
      renderShop();
      save();
    });
  });
  $("modal-ok").addEventListener("click", function () {
    const cb = modalOk;
    closeModal();
    if (cb) cb();
  });
  $("modal-cancel").addEventListener("click", closeModal);
  canvas.addEventListener("pointerdown", onTap);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      save();
    } else {
      applyOffline();
      save();
    }
  });
  window.addEventListener("pagehide", save);
  window.addEventListener("resize", resize);

  resize();
  buildShop();
  syncSound();
  applyOffline();
  save();
  renderShop();
  renderHud();
  requestAnimationFrame(frame);
})();
