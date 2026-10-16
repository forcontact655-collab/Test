"use strict";
(function () {
  const LH = 540;
  const SAVE_KEY = "honey-swarm-v2";
  const R = 1.15;
  const OFFLINE_MAX = 8 * 3600;
  const OFFLINE_RATE = 0.5;
  const ROYAL_UNIT = 1e6;
  const ROYAL_BONUS = 0.1;
  const ENDING_ROYAL = 10;
  const GOLD_MULT = 7;
  const GOLD_DUR = 20;
  const GOLD_LIFE = 15;
  const MAX_FLOWERS = 24;
  const MAX_BEES = 60;
  const MAX_UPS = 4;
  const MILESTONES = [10, 25, 50, 100, 200, 400];
  const SUF = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const PALETTE = ["#ff7ab6", "#b98cff", "#ffd34e", "#ff9f5a", "#7fd3ff", "#ffffff"];

  const TIERS = [
    { id: "bee", name: "Рабочая пчела", base: 15, prod: 1 },
    { id: "flower", name: "Цветочная полянка", base: 100, prod: 8 },
    { id: "comb", name: "Восковые соты", base: 1100, prod: 47 },
    { id: "apiary", name: "Пасека", base: 12000, prod: 260 },
    { id: "forest", name: "Лесная пасека", base: 130000, prod: 1400 },
    { id: "factory", name: "Медовый завод", base: 1.4e6, prod: 7800 },
    { id: "royal", name: "Королевский улей", base: 2e7, prod: 44000 }
  ];
  const TIER_BY = {};
  TIERS.forEach(function (t) { TIER_BY[t.id] = t; });

  const UPGRADES = [
    { id: "click1", name: "Крепкие лапки", desc: "Тап по улью ×2", cost: 100, target: "click", mult: 2, need: 0 },
    { id: "bee1", name: "Пыльцевые корзинки", desc: "Рабочие пчёлы ×2", cost: 250, target: "bee", mult: 2, need: 10 },
    { id: "flower1", name: "Сладкий нектар", desc: "Цветочные полянки ×2", cost: 1100, target: "flower", mult: 2, need: 10 },
    { id: "comb1", name: "Тонкий воск", desc: "Восковые соты ×2", cost: 12000, target: "comb", mult: 2, need: 10 },
    { id: "click2", name: "Стальные лапки", desc: "Тап по улью ×2", cost: 60000, target: "click", mult: 2, need: 0 },
    { id: "apiary1", name: "Пчелиный профсоюз", desc: "Пасеки ×2", cost: 130000, target: "apiary", mult: 2, need: 10 },
    { id: "all1", name: "Медовый бриз", desc: "Весь мёд ×1,5", cost: 5e6, target: "all", mult: 1.5, need: 0 },
    { id: "forest1", name: "Лесные маршруты", desc: "Лесные пасеки ×2", cost: 1.4e6, target: "forest", mult: 2, need: 10 },
    { id: "factory1", name: "Конвейер мёда", desc: "Медовые заводы ×2", cost: 1.5e7, target: "factory", mult: 2, need: 10 },
    { id: "royal1", name: "Королевский указ", desc: "Королевские ульи ×2", cost: 2.2e8, target: "royal", mult: 2, need: 10 },
    { id: "all2", name: "Солнечные дни", desc: "Весь мёд ×2", cost: 1e9, target: "all", mult: 2, need: 0 }
  ];
  const UP_BY = {};
  UPGRADES.forEach(function (u) { UP_BY[u.id] = u; });

  const ACH = [
    [1e3, "Первые соты"],
    [1e4, "Пасека растёт"],
    [1e5, "Полный улей"],
    [1e6, "Королевский рой"],
    [1e8, "Медовая река"],
    [1e10, "Легенда полей"],
    [1e12, "Медовый океан"]
  ];

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

  function rand(a, b) { return a + Math.random() * (b - a); }

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
    const owned = {};
    TIERS.forEach(function (t) { owned[t.id] = 0; });
    return {
      honey: 0,
      total: 0,
      owned: owned,
      bought: [],
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
      return Object.assign(f, d, { owned: Object.assign(f.owned, d.owned || {}) });
    } catch (e) {
      return fresh();
    }
  }

  let state = load();
  let gold = null;
  let goldTimer = rand(60, 120);
  let buffLeft = 0;

  function save() {
    state.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { return; }
  }

  function fmt(n) {
    if (!isFinite(n)) return "∞";
    if (n < 1000) return String(Math.floor(n));
    const e = Math.floor(Math.log10(n));
    const idx = Math.floor(e / 3);
    if (idx >= SUF.length) return (n / Math.pow(10, e)).toFixed(2) + "e" + e;
    const v = n / Math.pow(10, idx * 3);
    return (v >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, "") + SUF[idx];
  }

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + " ч " + m + " мин";
    return Math.max(1, m) + " мин";
  }

  function msCount(n) {
    let c = 0;
    MILESTONES.forEach(function (m) { if (n >= m) c++; });
    return c;
  }

  function hasUp(id) { return state.bought.indexOf(id) >= 0; }

  function tierMult(id) {
    let m = Math.pow(2, msCount(state.owned[id]));
    state.bought.forEach(function (uid) {
      const u = UP_BY[uid];
      if (u && u.target === id) m *= u.mult;
    });
    return m;
  }

  function scopeMult(target) {
    let m = 1;
    state.bought.forEach(function (uid) {
      const u = UP_BY[uid];
      if (u && u.target === target) m *= u.mult;
    });
    return m;
  }

  function royalMult() { return 1 + ROYAL_BONUS * state.royal; }
  function goldMult() { return buffLeft > 0 ? GOLD_MULT : 1; }
  function allMult() { return scopeMult("all") * royalMult(); }

  function unitRate(id) {
    return TIER_BY[id].prod * tierMult(id) * allMult();
  }

  function perSecNoBuff() {
    let s = 0;
    TIERS.forEach(function (t) { s += state.owned[t.id] * unitRate(t.id); });
    return s;
  }

  function perSec() { return perSecNoBuff() * goldMult(); }
  function tapValue() { return scopeMult("click") * allMult() * goldMult(); }
  function royalGain() { return Math.floor(Math.sqrt(state.total / ROYAL_UNIT)); }

  function costFor(id, n) {
    const t = TIER_BY[id];
    const owned = state.owned[id];
    return t.base * Math.pow(R, owned) * (Math.pow(R, n) - 1) / (R - 1);
  }

  function maxAff(id) {
    const t = TIER_BY[id];
    const b = t.base * Math.pow(R, state.owned[id]);
    const x = state.honey * (R - 1) / b;
    if (x <= 0) return 0;
    return Math.max(0, Math.min(1e6, Math.floor(Math.log(1 + x) / Math.log(R))));
  }

  function plan(id) {
    const m = maxAff(id);
    const cnt = state.mode === 0 ? m : Math.min(state.mode, m);
    if (cnt > 0) return { n: cnt, cost: costFor(id, cnt), can: true };
    const n = state.mode === 0 ? 1 : state.mode;
    return { n: n, cost: costFor(id, n), can: false };
  }

  function buy(id) {
    const p = plan(id);
    if (!p.can) return;
    const before = msCount(state.owned[id]);
    state.honey -= p.cost;
    state.owned[id] += p.n;
    const after = msCount(state.owned[id]);
    if (after > before) {
      toast(TIER_BY[id].name + ": " + MILESTONES[after - 1] + " шт. — ×2");
      sfx("mile");
    } else {
      sfx("buy");
    }
    renderShop();
    save();
  }

  function upVisible(u) {
    if (hasUp(u.id)) return false;
    if (u.target === "click" || u.target === "all") return true;
    return state.owned[u.target] >= u.need;
  }

  function buyUp(u) {
    if (state.honey < u.cost || hasUp(u.id)) return;
    state.honey -= u.cost;
    state.bought.push(u.id);
    toast("Улучшение: " + u.name);
    sfx("buy");
    renderShop();
    save();
  }

  function addHoney(v) {
    state.honey += v;
    state.total += v;
    ACH.forEach(function (a, i) {
      if (state.total >= a[0] && state.ach.indexOf(i) < 0) {
        state.ach.push(i);
        toast(a[1]);
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
    const royal = state.royal + g;
    state = Object.assign(fresh(), {
      royal: royal,
      ach: state.ach,
      ending: state.ending,
      mode: state.mode,
      muted: state.muted
    });
    buffLeft = 0;
    gold = null;
    sfx("mile");
    toast("Новый рой: +" + g + " матки");
    syncSound();
    renderShop();
    save();
  }

  function askPrestige() {
    const g = royalGain();
    if (g <= 0) return;
    const nextNeed = Math.pow(g + 1, 2) * ROYAL_UNIT - state.total;
    const bonus = Math.round(ROYAL_BONUS * 100 * (state.royal + g));
    const text = "Сбросятся мёд, ульи и улучшения. Получишь +" + g + " матки: мёд +" + bonus + "% навсегда. Следующая матка — через " + fmt(nextNeed) + " мёда.";
    openModal("Новый рой", text, "Начать", function () { prestige(g); }, "Отмена");
  }

  function applyOffline() {
    const away = Math.min((Date.now() - state.lastSeen) / 1000, OFFLINE_MAX);
    if (away < 30) return;
    const gain = perSecNoBuff() * away * OFFLINE_RATE;
    if (gain < 1) return;
    addHoney(gain);
    openModal("Пока тебя не было", "Рой работал " + fmtTime(away) + " и собрал +" + fmt(gain) + " мёда.", "Ок");
  }

  function showEnding() {
    state.ending = true;
    openModal("Королевский рой", "Ты поднял " + state.royal + " маток. Улей процветает, можно продолжать дальше.", "Продолжить");
    save();
  }

  function spawnGold() {
    gold = { x: rand(0.08, 0.5) * LW, y: rand(0.14, 0.42) * LH, life: GOLD_LIFE };
  }

  function tick(dt) {
    addHoney(perSec() * dt);
    if (buffLeft > 0) buffLeft = Math.max(0, buffLeft - dt);
    if (gold) {
      gold.life -= dt;
      if (gold.life <= 0) gold = null;
    } else {
      goldTimer -= dt;
      if (goldTimer <= 0) {
        spawnGold();
        goldTimer = rand(90, 180);
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
    else if (k === "gold") beep(880, 1320, 0.25, 0.2, "triangle");
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

  const rows = {};
  function buildShop() {
    TIERS.forEach(function (t) {
      const el = document.createElement("button");
      el.className = "item";
      el.type = "button";
      el.innerHTML = '<div class="it-top"><b></b><span class="lv"></span></div><div class="it-desc"></div><div class="it-bar"><i></i></div><div class="it-price"></div>';
      el.querySelector("b").textContent = t.name;
      el.addEventListener("click", function () { buy(t.id); });
      $("items").appendChild(el);
      rows[t.id] = {
        el: el,
        lv: el.querySelector(".lv"),
        desc: el.querySelector(".it-desc"),
        bar: el.querySelector(".it-bar i"),
        price: el.querySelector(".it-price")
      };
    });
  }

  let upKey = "";
  let upRows = [];
  function rebuildUps(list) {
    $("ups").innerHTML = "";
    upRows = list.map(function (u) {
      const el = document.createElement("button");
      el.className = "item up";
      el.type = "button";
      el.innerHTML = '<div class="it-top"><b></b></div><div class="it-desc"></div><div class="it-price"></div>';
      el.querySelector("b").textContent = u.name;
      el.querySelector(".it-desc").textContent = u.desc;
      el.addEventListener("click", function () { buyUp(u); });
      $("ups").appendChild(el);
      return { u: u, el: el, price: el.querySelector(".it-price") };
    });
  }

  function renderShop() {
    const list = UPGRADES.filter(upVisible).sort(function (a, b) { return a.cost - b.cost; }).slice(0, MAX_UPS);
    const key = list.map(function (u) { return u.id; }).join(",");
    if (key !== upKey) {
      upKey = key;
      rebuildUps(list);
      $("ups-title").classList.toggle("hidden", list.length === 0);
    }
    upRows.forEach(function (r) {
      const can = state.honey >= r.u.cost;
      r.price.textContent = "Купить — " + fmt(r.u.cost);
      r.el.classList.toggle("can", can);
      r.el.disabled = !can;
    });

    TIERS.forEach(function (t) {
      const r = rows[t.id];
      const n = state.owned[t.id];
      const p = plan(t.id);
      const ms = MILESTONES.filter(function (m) { return m > n; })[0];
      const prev = msCount(n) > 0 ? MILESTONES[msCount(n) - 1] : 0;
      r.lv.textContent = "ур. " + n;
      r.desc.textContent = "+" + fmt(unitRate(t.id)) + "/с за шт.";
      r.bar.style.width = (ms ? Math.min(100, (n - prev) / (ms - prev) * 100) : 100) + "%";
      r.price.textContent = (ms ? "до ×2 на " + ms + " · " : "") + "Купить x" + p.n + " — " + fmt(p.cost);
      r.el.disabled = !p.can;
      r.el.classList.toggle("can", p.can);
    });

    document.querySelectorAll(".mode").forEach(function (b) {
      b.classList.toggle("on", Number(b.dataset.mode) === state.mode);
    });
    $("stats").textContent = "Пчёл " + state.owned.bee + " · Тап +" + fmt(tapValue());
  }

  function renderHud() {
    $("honey").textContent = fmt(state.honey);
    $("rate").textContent = "+" + fmt(perSec()) + "/с";
    $("click-info").textContent = "Тап +" + fmt(tapValue());
    const g = royalGain();
    const rb = $("royal-btn");
    rb.disabled = g <= 0;
    rb.classList.toggle("ready", g > 0);
    rb.textContent = g > 0 ? "Новый рой +" + g : "Новый рой (от 1 млн)";
    const bf = $("buff");
    if (buffLeft > 0) {
      bf.classList.remove("hidden");
      bf.textContent = "Золотой взяток ×" + GOLD_MULT + " · " + Math.ceil(buffLeft) + " с";
    } else {
      bf.classList.add("hidden");
    }
  }

  const flowers = [];
  for (let i = 0; i < MAX_FLOWERS; i++) {
    flowers.push({ nx: rand(0.04, 0.5), ny: rand(0.6, 0.9), ph: rand(0, 6.28), bloom: 1, c: PALETTE[i % PALETTE.length] });
  }

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

  function flowerPos(f) { return { x: f.nx * LW, y: f.ny * LH }; }
  function flowerCount() { return Math.min(MAX_FLOWERS, 3 + state.owned.flower); }

  function pickTarget(b) {
    if (b.toHive) {
      b.tx = hiveX();
      b.ty = hiveY() + 12;
    } else {
      const f = flowers[Math.floor(Math.random() * flowerCount())];
      const p = flowerPos(f);
      b.tx = p.x + rand(-10, 10);
      b.ty = p.y - 20 + rand(-10, 10);
    }
  }

  function syncBees() {
    const n = Math.min(MAX_BEES, 1 + state.owned.bee);
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
    if (texts.length > 20) texts.splice(0, texts.length - 20);
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
    const n = flowerCount();
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

  function drawGold(t) {
    if (!gold) return;
    const pulse = 0.75 + 0.25 * Math.sin(t * 6);
    const fade = Math.min(1, gold.life / 2);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(gold.x, gold.y);
    ctx.rotate(Math.sin(t * 2) * 0.15);
    ctx.fillStyle = "rgba(255,211,78," + (0.35 * pulse).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd34e";
    ctx.strokeStyle = "#b07a10";
    ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      ctx.save();
      ctx.rotate(k / 6 * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -13, 7, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#fff1a8";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
    drawHive();
    drawBees(t);
    drawGold(t);
    drawFx();
  }

  function onPointer(e) {
    if ($("modal").classList.contains("show")) return;
    audio();
    const x = e.clientX / S;
    const y = e.clientY / S;
    if (gold && Math.hypot(x - gold.x, y - gold.y) < 40) {
      gold = null;
      buffLeft = GOLD_DUR;
      burst(x, y, "#ffd34e", 20, 260);
      popup("Золотой взяток ×" + GOLD_MULT, x, y - 20);
      sfx("gold");
      return;
    }
    const hx = hiveX();
    const hy = hiveY();
    if (Math.hypot(x - hx, y - hy) < 120) {
      const v = tapValue();
      addHoney(v);
      hivePulse = 1;
      burst(x, y, "#ffd34e", 12, 220);
      popup("+" + fmt(v), x, y - 20);
      sfx("tap");
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
  canvas.addEventListener("pointerdown", onPointer);
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
