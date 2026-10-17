"use strict";
(function () {
  const SAVE_KEY = "gem-mine-v1";
  const SAVE_VER = 2;
  const MAXV = Number.MAX_VALUE;
  const N = 8;
  const OFFLINE_MAX = 8 * 3600;
  const SPEED_CAP = 1e300;
  const MULT_CAP = 1e300;
  const TEMPO_BASE = 1000;
  const TEMPO_GROW = 1.5;
  const SPEED_STEP = 0.1;
  const GALAXY_STEP = 0.05;
  const CRYS_STEP = 0.1;
  const SUF = ["", "k", "m", "b", "t", "qd", "qn", "sx", "sp", "oc", "no", "dc"];

  const TIERS = [
    { name: "Кирка", base: 10, mult: 1e3 },
    { name: "Тележка", base: 1e2, mult: 1e4 },
    { name: "Вагонетка", base: 1e4, mult: 1e5 },
    { name: "Штрек", base: 1e6, mult: 1e6 },
    { name: "Бурильщик", base: 1e9, mult: 1e8 },
    { name: "Буровая", base: 1e13, mult: 1e10 },
    { name: "Шахтный лифт", base: 1e18, mult: 1e12 },
    { name: "Плавильня", base: 1e24, mult: 1e15 }
  ];

  function A(id, name, desc, goal, prog, bonus) {
    return { id: id, name: name, desc: desc, goal: goal, prog: prog, bonus: bonus };
  }
  function ALL(v) { return { scope: "all", v: v }; }
  function TIER(i, v) { return { scope: "tier", tier: i, v: v }; }
  function SPEED(v) { return { scope: "speed", v: v }; }

  const ACH = [
    A("kirka1", "Первая кирка", "Купи первую «Кирку»", 1, function (s) { return s.bought[0]; }, TIER(0, 0.01)),
    A("gem1k", "Первая тысяча", "Заработай 1k самоцветов за всё время", 1e3, function (s) { return s.total; }, ALL(0.01)),
    A("gem1m", "Миллион", "Заработай 1m самоцветов за всё время", 1e6, function (s) { return s.total; }, ALL(0.01)),
    A("gem1b", "Миллиард", "Заработай 1b самоцветов за всё время", 1e9, function (s) { return s.total; }, ALL(0.01)),
    A("gem1t", "Триллион", "Заработай 1t самоцветов за всё время", 1e12, function (s) { return s.total; }, ALL(0.02)),
    A("gem1qd", "Квадриллион", "Заработай 1qd самоцветов за всё время", 1e15, function (s) { return s.total; }, ALL(0.02)),
    A("gem1qn", "Квинтиллион", "Заработай 1qn самоцветов за всё время", 1e18, function (s) { return s.total; }, ALL(0.02)),
    A("gem1sp", "Септиллион", "Заработай 1sp самоцветов за всё время", 1e24, function (s) { return s.total; }, ALL(0.03)),
    A("gem1no", "Нониллион", "Заработай 1no самоцветов за всё время", 1e30, function (s) { return s.total; }, ALL(0.03)),
    A("own0", "Владелец: Кирка", "Купи 25 «Кирка» в текущей шахте", 25, function (s) { return s.bought[0]; }, TIER(0, 0.02)),
    A("own1", "Владелец: Тележка", "Купи 25 «Тележка» в текущей шахте", 25, function (s) { return s.bought[1]; }, TIER(1, 0.02)),
    A("own2", "Владелец: Вагонетка", "Купи 25 «Вагонетка» в текущей шахте", 25, function (s) { return s.bought[2]; }, TIER(2, 0.02)),
    A("own3", "Владелец: Штрек", "Купи 25 «Штрек» в текущей шахте", 25, function (s) { return s.bought[3]; }, TIER(3, 0.02)),
    A("own4", "Владелец: Бурильщик", "Купи 25 «Бурильщик» в текущей шахте", 25, function (s) { return s.bought[4]; }, TIER(4, 0.02)),
    A("own5", "Владелец: Буровая", "Купи 25 «Буровая» в текущей шахте", 25, function (s) { return s.bought[5]; }, TIER(5, 0.02)),
    A("own6", "Владелец: Шахтный лифт", "Купи 25 «Шахтный лифт» в текущей шахте", 25, function (s) { return s.bought[6]; }, TIER(6, 0.02)),
    A("own7", "Владелец: Плавильня", "Купи 25 «Плавильня» в текущей шахте", 25, function (s) { return s.bought[7]; }, TIER(7, 0.02)),
    A("boost1", "Первая Проходка", "Сделай 1 Проходку", 1, function (s) { return s.totalBoosts; }, ALL(0.01)),
    A("boost10", "Опытный шахтёр", "Сделай 10 Проходок", 10, function (s) { return s.totalBoosts; }, ALL(0.02)),
    A("open8", "Все штреки открыты", "Открой все 8 типов машин в одной шахте", 1, function (s) { return s.boosts >= 4 ? 1 : 0; }, ALL(0.02)),
    A("gal1", "Первый ствол", "Пробей 1 ствол", 1, function (s) { return s.totalGalaxies; }, SPEED(0.001)),
    A("gal5", "Глубокая шахта", "Пробей 5 стволов", 5, function (s) { return s.totalGalaxies; }, ALL(0.02)),
    A("tempo10", "Разгон", "Купи 10 улучшений Темпа в одной шахте", 10, function (s) { return s.bestTempo; }, SPEED(0.001)),
    A("tempo50", "Турбо", "Купи 50 улучшений Темпа в одной шахте", 50, function (s) { return s.bestTempo; }, SPEED(0.002)),
    A("col1", "Первый обвал", "Обвали шахту на пределе 1.80e308", 1, function (s) { return s.totalCollapses; }, ALL(0.02)),
    A("col5", "Обвальщик", "Сделай 5 обвалов", 5, function (s) { return s.totalCollapses; }, ALL(0.02)),
    A("cry50", "Кристальный", "Накопи 50 кристаллов", 50, function (s) { return s.crystals; }, ALL(0.01)),
    A("buy500", "Шопоголик", "Сделай 500 покупок (улучшений и Темпа)", 500, function (s) { return s.purchases; }, ALL(0.01)),
    A("night", "Ночная смена", "Получи оффлайн-добычу за час и больше", 1, function (s) { return s.flags.night ? 1 : 0; }, ALL(0.01)),
    A("collector", "Коллекционер", "Получи 10 достижений", 10, function (s) { return s.ach.length; }, ALL(0.02))
  ];
  const ACHMAP = {};
  ACH.forEach(function (a) { ACHMAP[a.id] = a; });
  const OLD_ACH = ["kirka1", "gem1k", "gem1m", "boost1", "open8", "gal1", "tempo10", "col1"];

  const $ = function (id) { return document.getElementById(id); };

  function zeros() {
    return Array.from({ length: N }, function () { return 0; });
  }

  function fresh() {
    return {
      v: SAVE_VER,
      gems: 10,
      amount: zeros(),
      bought: zeros(),
      tempo: 0,
      boosts: 0,
      galaxies: 0,
      crystals: 0,
      collapses: 0,
      ach: [],
      mode: 1,
      muted: false,
      lastSeen: Date.now(),
      total: 0,
      purchases: 0,
      totalBoosts: 0,
      totalGalaxies: 0,
      totalCollapses: 0,
      bestTempo: 0,
      flags: {}
    };
  }

  function num(x, d) {
    return typeof x === "number" && isFinite(x) && x >= 0 ? x : d;
  }

  function arr(a) {
    const out = zeros();
    if (Array.isArray(a)) {
      for (let i = 0; i < N; i++) out[i] = num(a[i], 0);
    }
    return out;
  }

  function migrate1(d) {
    const ids = [];
    if (Array.isArray(d.ach)) {
      d.ach.forEach(function (i) {
        if (typeof i === "number" && OLD_ACH[i]) ids.push(OLD_ACH[i]);
      });
    }
    const gems = num(d.gems, 0);
    const bought = arr(d.bought);
    d.ach = ids;
    d.total = Math.max(gems, ids.indexOf("gem1m") >= 0 ? 1e6 : ids.indexOf("gem1k") >= 0 ? 1e3 : 0);
    d.purchases = bought.reduce(function (a, b) { return a + b; }, 0);
    d.totalBoosts = Math.max(num(d.boosts, 0), ids.indexOf("boost1") >= 0 ? 1 : 0);
    d.totalGalaxies = Math.max(num(d.galaxies, 0), ids.indexOf("gal1") >= 0 ? 1 : 0);
    d.totalCollapses = Math.max(num(d.collapses, 0), ids.indexOf("col1") >= 0 ? 1 : 0);
    d.bestTempo = num(d.tempo, 0);
    d.flags = {};
    d.v = 2;
    return d;
  }

  function load() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    } catch (e) {
      d = null;
    }
    if (!d || typeof d !== "object") return fresh();
    if (!d.v || d.v < 2) d = migrate1(d);
    const f = Object.assign(fresh(), d);
    f.gems = num(f.gems, 10);
    f.amount = arr(f.amount);
    f.bought = arr(f.bought);
    f.tempo = num(f.tempo, 0);
    f.boosts = num(f.boosts, 0);
    f.galaxies = num(f.galaxies, 0);
    f.crystals = num(f.crystals, 0);
    f.collapses = num(f.collapses, 0);
    f.total = num(f.total, 0);
    f.purchases = num(f.purchases, 0);
    f.totalBoosts = num(f.totalBoosts, 0);
    f.totalGalaxies = num(f.totalGalaxies, 0);
    f.totalCollapses = num(f.totalCollapses, 0);
    f.bestTempo = num(f.bestTempo, 0);
    f.mode = [1, 10, 100, 0].indexOf(f.mode) >= 0 ? f.mode : 1;
    f.muted = !!f.muted;
    f.flags = f.flags && typeof f.flags === "object" ? f.flags : {};
    const seen = {};
    f.ach = (Array.isArray(f.ach) ? f.ach : []).filter(function (id) {
      if (typeof id !== "string" || !ACHMAP[id] || seen[id]) return false;
      seen[id] = true;
      return true;
    });
    return f;
  }

  let state = load();

  function save() {
    state.v = SAVE_VER;
    state.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { return; }
  }

  function digits(v) {
    if (v >= 100) return v.toFixed(0);
    if (v >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  function fmt(n) {
    if (!isFinite(n)) return "∞";
    if (n < 1000) return String(Math.floor(n));
    if (n >= 1e36) {
      let e = Math.floor(Math.log10(n));
      let m = n / Math.pow(10, e);
      if (m.toFixed(2) === "10.00") {
        e++;
        m = n / Math.pow(10, e);
      }
      return m.toFixed(2) + "e" + e;
    }
    let idx = Math.floor(Math.log10(n) / 3);
    let v = n / Math.pow(10, idx * 3);
    if (v >= 1000) {
      idx++;
      v = n / Math.pow(10, idx * 3);
    }
    let s = digits(v);
    if (parseFloat(s) >= 1000 && idx < SUF.length - 1) {
      idx++;
      s = digits(v / 1000);
    }
    return s + SUF[idx];
  }

  function fmtX(x) {
    if (!isFinite(x)) return "∞";
    if (x >= 1000) return fmt(x);
    return String(Math.round(x * 100) / 100);
  }

  function pctText(x) {
    return String(Math.round(x * 1000) / 10);
  }

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + " ч " + m + " мин";
    return Math.max(1, m) + " мин";
  }

  function cap(x) {
    if (x !== x) return 0;
    return x > MAXV ? MAXV : x;
  }

  function boostFactor(i) {
    const b = state.boosts;
    const top = Math.min(b, N);
    return Math.pow(2, Math.max(0, top - i) + Math.max(0, b - N));
  }

  function tierMult(i) {
    return Math.min(MULT_CAP, Math.pow(2, Math.floor(state.bought[i] / 10)) * boostFactor(i));
  }

  function unlocked(i) {
    return i < Math.min(N, 4 + state.boosts);
  }

  function bonuses() {
    const tier = [];
    let sp = 0;
    for (let i = 0; i < N; i++) tier.push(1);
    state.ach.forEach(function (id) {
      const b = ACHMAP[id].bonus;
      if (b.scope === "all") {
        for (let i = 0; i < N; i++) tier[i] *= 1 + b.v;
      } else if (b.scope === "tier") {
        tier[b.tier] *= 1 + b.v;
      } else {
        sp += b.v;
      }
    });
    return { tier: tier, speed: sp };
  }

  function speed(extra) {
    return Math.min(SPEED_CAP, Math.pow(1 + SPEED_STEP + GALAXY_STEP * state.galaxies + extra, state.tempo));
  }

  function crysMult() {
    return 1 + CRYS_STEP * state.crystals;
  }

  function prodRate(i, b) {
    const r = state.amount[i] * tierMult(i) * speed(b.speed) * b.tier[i];
    return i === 0 ? r * crysMult() : r;
  }

  function priceAt(i, owned) {
    return TIERS[i].base * Math.pow(TIERS[i].mult, Math.floor(owned / 10));
  }

  function costOf(i, from, count) {
    let total = 0;
    let owned = from;
    let left = count;
    while (left > 0) {
      const room = 10 - (owned % 10);
      const take = Math.min(room, left);
      total += take * priceAt(i, owned);
      owned += take;
      left -= take;
    }
    return total;
  }

  function tierPlan(i, mode) {
    const want = mode === 0 ? 0 : mode;
    let owned = state.bought[i];
    const money = state.gems;
    let n = 0;
    let cost = 0;
    for (let it = 0; it < 400; it++) {
      const price = priceAt(i, owned);
      if (!(price > 0) || !isFinite(price)) break;
      const room = 10 - (owned % 10);
      const limit = want === 0 ? room : Math.min(room, want - n);
      if (limit <= 0) break;
      const take = Math.min(limit, Math.floor((money - cost) / price));
      if (take <= 0) break;
      cost += take * price;
      n += take;
      owned += take;
      if (take < room) break;
    }
    if (n > 0) return { n: n, cost: cost, can: true };
    const shown = want === 0 ? 1 : want;
    return { n: shown, cost: costOf(i, state.bought[i], shown), can: false };
  }

  function applyTier(i, n, cost) {
    state.gems = Math.max(0, state.gems - cost);
    state.bought[i] += n;
    state.amount[i] = cap(state.amount[i] + n);
    state.purchases += 1;
  }

  function buyTier(i) {
    if (!unlocked(i)) return false;
    const p = tierPlan(i, state.mode);
    if (!p.can) return false;
    applyTier(i, p.n, p.cost);
    sfx("buy");
    return true;
  }

  function buyMaxAll() {
    let any = false;
    for (let i = N - 1; i >= 0; i--) {
      if (!unlocked(i)) continue;
      const p = tierPlan(i, 0);
      if (!p.can) continue;
      applyTier(i, p.n, p.cost);
      any = true;
    }
    if (any) sfx("buy");
    return any;
  }

  function anyBuyable() {
    for (let i = 0; i < N; i++) {
      if (unlocked(i) && tierPlan(i, 0).can) return true;
    }
    return false;
  }

  function tempoPlan(mode) {
    const base = TEMPO_BASE * Math.pow(TEMPO_GROW, state.tempo);
    if (!isFinite(base)) return { n: 0, cost: Infinity, can: false };
    const x = state.gems * (TEMPO_GROW - 1) / base;
    const maxN = x <= 0 ? 0 : Math.floor(Math.log(1 + x) / Math.log(TEMPO_GROW));
    const n = mode === 0 ? maxN : Math.min(mode, maxN);
    if (n > 0) {
      return { n: n, cost: base * (Math.pow(TEMPO_GROW, n) - 1) / (TEMPO_GROW - 1), can: true };
    }
    const shown = mode === 0 ? 1 : mode;
    return { n: shown, cost: base * (Math.pow(TEMPO_GROW, shown) - 1) / (TEMPO_GROW - 1), can: false };
  }

  function buyTempo() {
    const p = tempoPlan(state.mode);
    if (!p.can) return;
    state.gems = Math.max(0, state.gems - p.cost);
    state.tempo += p.n;
    state.bestTempo = Math.max(state.bestTempo, state.tempo);
    state.purchases += 1;
    sfx("buy");
    save();
  }

  function boostReq() {
    const k = state.boosts + 1;
    const idx = Math.min(N - 1, 2 + k);
    const need = k <= 5 ? 20 : 20 + 15 * (k - 5);
    const have = state.amount[idx];
    return { k: k, idx: idx, need: need, have: have, ok: have >= need };
  }

  function galaxyReq() {
    const need = 80 + 60 * state.galaxies;
    const have = state.amount[N - 1];
    return { need: need, have: have, ok: state.boosts >= 4 && have >= need };
  }

  function collapseGain() {
    return 5 + 5 * state.collapses;
  }

  function resetTiers() {
    state.gems = 0;
    state.amount = zeros();
    state.bought = zeros();
  }

  function doBoost() {
    const r = boostReq();
    if (!r.ok) return;
    state.boosts += 1;
    state.totalBoosts += 1;
    checkAch();
    resetTiers();
    sfx("boost");
    toast("Проходка " + state.boosts + ": открыт " + (state.boosts <= 4 ? TIERS[3 + state.boosts].name : "усиление всех машин"));
    save();
  }

  function doGalaxy() {
    const r = galaxyReq();
    if (!r.ok) return;
    state.galaxies += 1;
    state.totalGalaxies += 1;
    checkAch();
    state.boosts = 0;
    state.tempo = 0;
    resetTiers();
    sfx("mile");
    toast("Ствол " + state.galaxies + ": Темп сильнее");
    save();
  }

  function doCollapse() {
    if (state.gems < MAXV) return;
    const g = collapseGain();
    state.collapses += 1;
    state.totalCollapses += 1;
    state.crystals += g;
    checkAch();
    state.galaxies = 0;
    state.boosts = 0;
    state.tempo = 0;
    resetTiers();
    sfx("mile");
    toast("Обвал: +" + g + " кристаллов");
    save();
  }

  function produce(dt) {
    const b = bonuses();
    const sp = speed(b.speed);
    for (let i = N - 1; i >= 1; i--) {
      if (state.amount[i] > 0) {
        state.amount[i - 1] = cap(state.amount[i - 1] + state.amount[i] * tierMult(i) * sp * b.tier[i] * dt);
      }
    }
    if (state.amount[0] > 0) {
      const g = state.amount[0] * tierMult(0) * sp * b.tier[0] * crysMult() * dt;
      state.gems = cap(state.gems + g);
      state.total = cap(state.total + g);
    }
  }

  function rewardText(b) {
    if (b.scope === "all") return "+" + pctText(b.v) + "% ко всей добыче";
    if (b.scope === "tier") return "+" + pctText(b.v) + "% к «" + TIERS[b.tier].name + "»";
    return "+" + pctText(b.v) + "% к шагу Темпа";
  }

  function checkAch() {
    ACH.forEach(function (a) {
      if (state.ach.indexOf(a.id) >= 0) return;
      if (a.prog(state) >= a.goal) {
        state.ach.push(a.id);
        toast("Достижение: " + a.name + " (" + rewardText(a.bonus) + ")");
        sfx("mile");
      }
    });
  }

  function toast(str) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = str;
    $("toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 2800);
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

  function modalOpen() {
    return $("modal").classList.contains("show");
  }

  function applyOffline() {
    const away = Math.min((Date.now() - state.lastSeen) / 1000, OFFLINE_MAX);
    if (away < 30) return;
    const before = state.gems;
    const steps = Math.floor(away);
    for (let s = 0; s < steps; s++) produce(1);
    if (away >= 3600) state.flags.night = true;
    checkAch();
    const gain = state.gems - before;
    if (gain < 1) return;
    openModal("Пока тебя не было", "Шахта работала " + fmtTime(away) + " и добыла +" + fmt(gain) + " самоцветов.", "Ок");
  }

  let actx = null;
  let master = null;

  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = state.muted ? 0 : 0.5;
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
    o.type = type || "triangle";
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
    if (k === "buy") beep(520, 780, 0.12, 0.15);
    else if (k === "boost") beep(330, 990, 0.35, 0.2, "sawtooth");
    else if (k === "mile") {
      beep(660, 0, 0.18, 0.18);
      setTimeout(function () { beep(880, 0, 0.2, 0.18); }, 110);
    }
  }

  function syncSound() {
    if (master) master.gain.value = state.muted ? 0 : 0.5;
    $("sound-btn").textContent = state.muted ? "Звук: выкл" : "Звук: вкл";
  }

  const rows = [];
  function buildRows() {
    TIERS.forEach(function (t, i) {
      const el = document.createElement("div");
      el.className = "row";
      el.innerHTML = '<div class="r-main"><b class="r-name"></b><small class="r-mult"></small></div><div class="r-amt"><span class="r-n"></span><small class="r-prod"></small></div><button class="r-buy" type="button"></button>';
      el.querySelector(".r-name").textContent = (i + 1) + ". " + t.name;
      el.querySelector(".r-buy").addEventListener("click", function () {
        if (buyTier(i)) save();
      });
      $("tiers").appendChild(el);
      rows.push({ el: el, mult: el.querySelector(".r-mult"), n: el.querySelector(".r-n"), prod: el.querySelector(".r-prod"), buy: el.querySelector(".r-buy") });
    });
  }

  function renderRows(b) {
    TIERS.forEach(function (t, i) {
      const r = rows[i];
      if (!unlocked(i)) {
        r.el.classList.add("locked");
        r.mult.textContent = "";
        r.n.textContent = "";
        r.prod.textContent = "Открывается после Проходки " + (i - 3);
        r.buy.textContent = "Заперто";
        r.buy.disabled = true;
        r.buy.classList.remove("can");
        return;
      }
      r.el.classList.remove("locked");
      const p = tierPlan(i, state.mode);
      r.mult.textContent = "×" + fmtX(tierMult(i) * b.tier[i]);
      r.n.textContent = fmt(Math.floor(state.amount[i]));
      if (i === 0) {
        r.prod.textContent = "+" + fmt(prodRate(0, b)) + "/с";
      } else {
        r.prod.textContent = "+" + fmt(prodRate(i, b)) + "/с → " + TIERS[i - 1].name;
      }
      const label = state.mode === 0 ? "MAX" : "x" + p.n;
      r.buy.textContent = "Купить " + label + " — " + fmt(p.cost);
      r.buy.disabled = !p.can;
      r.buy.classList.toggle("can", p.can);
    });
  }

  function setReady(btn, on) {
    btn.disabled = !on;
    btn.classList.toggle("can", on);
    btn.parentElement.classList.toggle("ready", on);
  }

  function renderLayers(b) {
    const tp = tempoPlan(state.mode);
    $("tempo-info").textContent = "×" + fmtX(speed(b.speed)) + " · " + state.tempo + " шт.";
    $("tempo-btn").textContent = (tp.can ? "Купить " : "Нужно ") + (state.mode === 0 ? "MAX" : "x" + tp.n) + " — " + fmt(tp.cost);
    setReady($("tempo-btn"), tp.can);

    const br = boostReq();
    $("boost-info").textContent = "Проходка " + state.boosts;
    $("boost-note").textContent = "Нужно " + br.need + " шт. «" + TIERS[br.idx].name + "» (есть " + fmt(Math.floor(br.have)) + "). Сбрасывает шахту, Темп сохраняется.";
    $("boost-btn").textContent = "Провести Проходку " + br.k;
    setReady($("boost-btn"), br.ok);

    const gr = galaxyReq();
    $("shaft-info").textContent = "Стволов " + state.galaxies;
    $("shaft-note").textContent = "Нужно " + gr.need + " шт. «" + TIERS[N - 1].name + "» и 4 Проходки (есть " + fmt(Math.floor(gr.have)) + "). Сбрасывает Проходки и Темп.";
    $("shaft-btn").textContent = "Пробить ствол " + (state.galaxies + 1);
    setReady($("shaft-btn"), gr.ok);

    const cr = state.gems >= MAXV;
    $("collapse-info").textContent = "Обвалов " + state.collapses;
    $("collapse-note").textContent = cr
      ? "Предел " + fmt(MAXV) + " достигнут. Обвал даст +" + collapseGain() + " кристаллов (×" + fmtX(1 + CRYS_STEP * (state.crystals + collapseGain())) + " к добыче)."
      : "Доступно у предела " + fmt(MAXV) + " самоцветов. Кристаллы: " + state.crystals + " (×" + fmtX(crysMult()) + ").";
    $("collapse-btn").textContent = "Обвалить шахту";
    setReady($("collapse-btn"), cr);

    document.querySelectorAll(".mode").forEach(function (m) {
      m.classList.toggle("on", Number(m.dataset.mode) === state.mode);
    });
  }

  function renderHeader(b) {
    $("gems").textContent = fmt(state.gems);
    $("rate").textContent = "+" + fmt(prodRate(0, b)) + "/с";
    $("crys").textContent = "Кристаллы: " + state.crystals;
    $("ach-count").textContent = "Достижения: " + state.ach.length + "/" + ACH.length;
    $("maxall").classList.toggle("can", anyBuyable());
  }

  const achRows = {};
  function buildAch() {
    ACH.forEach(function (a) {
      const el = document.createElement("div");
      el.className = "ach";
      el.innerHTML = '<div class="ach-h"><b class="ach-name"></b><span class="ach-st"></span></div><div class="ach-d"></div><div class="ach-bar"><i></i></div><div class="ach-p"><span class="ach-prog"></span><span class="ach-r"></span></div>';
      el.querySelector(".ach-name").textContent = a.name;
      el.querySelector(".ach-d").textContent = a.desc;
      el.querySelector(".ach-r").textContent = rewardText(a.bonus);
      $("ach-list").appendChild(el);
      achRows[a.id] = { el: el, st: el.querySelector(".ach-st"), bar: el.querySelector(".ach-bar i"), prog: el.querySelector(".ach-prog") };
    });
  }

  function renderAch() {
    let all = 1;
    let sp = 0;
    state.ach.forEach(function (id) {
      const b = ACHMAP[id].bonus;
      if (b.scope === "all") all *= 1 + b.v;
      else if (b.scope === "speed") sp += b.v;
    });
    $("ach-sum").textContent = "Получено " + state.ach.length + " из " + ACH.length + ".\nКо всей добыче: +" + pctText(all - 1) + "%. К шагу Темпа: +" + pctText(sp) + "%.";
    ACH.forEach(function (a) {
      const r = achRows[a.id];
      const got = state.ach.indexOf(a.id) >= 0;
      const p = Math.min(a.goal, Math.max(0, a.prog(state)));
      r.el.classList.toggle("done", got);
      r.st.textContent = got ? "готово" : "";
      r.bar.style.width = (100 * p / a.goal) + "%";
      r.prog.textContent = fmt(Math.floor(p)) + " / " + fmt(a.goal);
    });
  }

  function render() {
    const b = bonuses();
    renderHeader(b);
    renderRows(b);
    renderLayers(b);
    if ($("ach-view").classList.contains("show")) renderAch();
  }

  function openAch() {
    renderAch();
    $("ach-view").classList.add("show");
  }

  $("maxall").addEventListener("click", function () {
    if (buyMaxAll()) save();
  });
  $("ach-btn").addEventListener("click", openAch);
  $("ach-close").addEventListener("click", function () {
    $("ach-view").classList.remove("show");
  });
  $("sound-btn").addEventListener("click", function () {
    state.muted = !state.muted;
    syncSound();
    save();
  });
  document.querySelectorAll(".mode").forEach(function (m) {
    m.addEventListener("click", function () {
      state.mode = Number(m.dataset.mode);
      render();
      save();
    });
  });
  $("tempo-btn").addEventListener("click", buyTempo);
  $("boost-btn").addEventListener("click", doBoost);
  $("shaft-btn").addEventListener("click", doGalaxy);
  $("collapse-btn").addEventListener("click", doCollapse);
  $("modal-ok").addEventListener("click", function () {
    const cb = modalOk;
    closeModal();
    if (cb) cb();
  });
  $("modal-cancel").addEventListener("click", closeModal);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      save();
    } else {
      applyOffline();
      save();
    }
  });
  window.addEventListener("pagehide", save);

  let last = performance.now();
  let renderAcc = 0;
  let achAcc = 0;
  let saveAcc = 0;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!modalOpen()) produce(dt);
    renderAcc += dt;
    achAcc += dt;
    saveAcc += dt;
    if (achAcc > 0.5) {
      achAcc = 0;
      checkAch();
    }
    if (renderAcc > 0.2) {
      renderAcc = 0;
      render();
    }
    if (saveAcc > 3) {
      saveAcc = 0;
      save();
    }
    requestAnimationFrame(frame);
  }

  function setTop() {
    document.documentElement.style.setProperty("--top-h", $("top").offsetHeight + 12 + "px");
  }
  window.addEventListener("resize", setTop);
  setTop();
  buildRows();
  buildAch();
  syncSound();
  applyOffline();
  checkAch();
  save();
  render();
  requestAnimationFrame(frame);
})();
