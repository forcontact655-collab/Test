"use strict";
(function () {
  const SAVE_KEY = "gem-mine-v1";
  const MAXV = Number.MAX_VALUE;
  const N = 8;
  const OFFLINE_MAX = 8 * 3600;
  const SPEED_CAP = 1e300;
  const MULT_CAP = 1e300;
  const TEMPO_BASE = 1000;
  const TEMPO_GROW = 1.5;
  const SPEED_STEP = 0.1;
  const GALAXY_STEP = 0.05;
  const ACH_MULT = 1.03;
  const CRYS_STEP = 0.1;

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

  const ACH = [
    { name: "Первая кирка", text: "Купи первую Киру", test: function (s) { return s.bought[0] >= 1; } },
    { name: "Тысяча самоцветов", text: "Накопи 1 000 самоцветов", test: function (s) { return s.gems >= 1e3; } },
    { name: "Миллион самоцветов", text: "Накопи 1 000 000 самоцветов", test: function (s) { return s.gems >= 1e6; } },
    { name: "Первая проходка", text: "Сделай первую Проходку", test: function (s) { return s.boosts >= 1; } },
    { name: "Все штреки открыты", text: "Открой восьмой тип шахтных машин", test: function (s) { return s.boosts >= 4; } },
    { name: "Первый ствол", text: "Сделай первый Ствол", test: function (s) { return s.galaxies >= 1; } },
    { name: "Темп 10", text: "Купи десять улучшений Темпа в одном стволе", test: function (s) { return s.tempo >= 10; } },
    { name: "Обвал", text: "Обвали шахту на пределе", test: function (s) { return s.collapses >= 1; } }
  ];

  const $ = function (id) { return document.getElementById(id); };

  function zeros() {
    return Array.from({ length: N }, function () { return 0; });
  }

  function fresh() {
    return {
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
      lastSeen: Date.now()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh();
      const d = JSON.parse(raw);
      const f = Object.assign(fresh(), d);
      if (!Array.isArray(f.amount) || f.amount.length !== N) f.amount = zeros();
      if (!Array.isArray(f.bought) || f.bought.length !== N) f.bought = zeros();
      return f;
    } catch (e) {
      return fresh();
    }
  }

  let state = load();

  function save() {
    state.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { return; }
  }

  function fmt(n) {
    if (!isFinite(n)) return "∞";
    if (n < 1000) return String(Math.floor(n));
    let e = Math.floor(Math.log10(n));
    let m = n / Math.pow(10, e);
    if (m >= 9.995) {
      e++;
      m = n / Math.pow(10, e);
    }
    return m.toFixed(2) + "e" + e;
  }

  function fmtX(x) {
    if (!isFinite(x)) return "∞";
    if (x >= 1000) return fmt(x);
    return String(Math.round(x * 100) / 100);
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

  function speed() {
    return Math.min(SPEED_CAP, Math.pow(1 + SPEED_STEP + GALAXY_STEP * state.galaxies, state.tempo));
  }

  function crysMult() {
    return 1 + CRYS_STEP * state.crystals;
  }

  function gemMult() {
    return crysMult() * Math.pow(ACH_MULT, state.ach.length);
  }

  function prodRate(i) {
    const r = state.amount[i] * tierMult(i) * speed();
    return i === 0 ? r * gemMult() : r;
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

  function buyTier(i) {
    if (!unlocked(i)) return false;
    const p = tierPlan(i, state.mode);
    if (!p.can) return false;
    state.gems = Math.max(0, state.gems - p.cost);
    state.bought[i] += p.n;
    state.amount[i] = cap(state.amount[i] + p.n);
    sfx("buy");
    return true;
  }

  function buyMaxAll() {
    let any = false;
    for (let i = N - 1; i >= 0; i--) {
      if (!unlocked(i)) continue;
      const p = tierPlan(i, 0);
      if (!p.can) continue;
      state.gems = Math.max(0, state.gems - p.cost);
      state.bought[i] += p.n;
      state.amount[i] = cap(state.amount[i] + p.n);
      any = true;
    }
    if (any) sfx("buy");
    return any;
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
    checkAch();
    state.boosts += 1;
    resetTiers();
    sfx("boost");
    toast("Проходка " + state.boosts + ": открыт " + (state.boosts <= 4 ? TIERS[3 + state.boosts].name : "усиление всех машин"));
    save();
  }

  function doGalaxy() {
    const r = galaxyReq();
    if (!r.ok) return;
    checkAch();
    state.galaxies += 1;
    state.boosts = 0;
    state.tempo = 0;
    resetTiers();
    sfx("mile");
    toast("Ствол " + state.galaxies + ": Темп сильнее");
    save();
  }

  function doCollapse() {
    if (state.gems < MAXV) return;
    checkAch();
    const g = collapseGain();
    state.collapses += 1;
    state.crystals += g;
    state.galaxies = 0;
    state.boosts = 0;
    state.tempo = 0;
    resetTiers();
    sfx("mile");
    toast("Обвал: +" + g + " кристаллов");
    save();
  }

  function produce(dt) {
    const sp = speed();
    const gm = gemMult();
    for (let i = N - 1; i >= 1; i--) {
      if (state.amount[i] > 0) {
        state.amount[i - 1] = cap(state.amount[i - 1] + state.amount[i] * tierMult(i) * sp * dt);
      }
    }
    if (state.amount[0] > 0) {
      state.gems = cap(state.gems + state.amount[0] * tierMult(0) * sp * gm * dt);
    }
  }

  function checkAch() {
    ACH.forEach(function (a, i) {
      if (state.ach.indexOf(i) >= 0) return;
      if (a.test(state)) {
        state.ach.push(i);
        toast("Достижение: " + a.name);
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

  function renderRows() {
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
      r.mult.textContent = "×" + fmt(tierMult(i));
      r.n.textContent = fmt(Math.floor(state.amount[i]));
      if (i === 0) {
        r.prod.textContent = "+" + fmt(prodRate(0)) + "/с";
      } else {
        r.prod.textContent = "+" + fmt(prodRate(i)) + "/с → " + TIERS[i - 1].name;
      }
      const label = state.mode === 0 ? "MAX" : "x" + p.n;
      r.buy.textContent = "Купить " + label + " — " + fmt(p.cost);
      r.buy.disabled = !p.can;
      r.buy.classList.toggle("can", p.can);
    });
  }

  function renderLayers() {
    const tp = tempoPlan(state.mode);
    $("tempo-info").textContent = "×" + fmtX(speed()) + " · " + state.tempo + " шт.";
    $("tempo-btn").textContent = (tp.can ? "Купить " : "Нужно ") + (state.mode === 0 ? "MAX" : "x" + tp.n) + " — " + fmt(tp.cost);
    $("tempo-btn").disabled = !tp.can;

    const br = boostReq();
    $("boost-info").textContent = "Проходка " + state.boosts;
    $("boost-note").textContent = "Нужно " + br.need + " шт. «" + TIERS[br.idx].name + "» (есть " + fmt(Math.floor(br.have)) + "). Сбрасывает шахту, Темп сохраняется.";
    $("boost-btn").textContent = "Провести Проходку " + br.k;
    $("boost-btn").disabled = !br.ok;

    const gr = galaxyReq();
    $("shaft-info").textContent = "Стволов " + state.galaxies;
    $("shaft-note").textContent = "Нужно " + gr.need + " шт. «" + TIERS[N - 1].name + "» и 4 Проходки (есть " + fmt(Math.floor(gr.have)) + "). Сбрасывает Проходки и Темп.";
    $("shaft-btn").textContent = "Пробить ствол " + (state.galaxies + 1);
    $("shaft-btn").disabled = !gr.ok;

    const cr = state.gems >= MAXV;
    $("collapse-info").textContent = "Обвалов " + state.collapses;
    $("collapse-note").textContent = cr ? "Предел 1.80e308 достигнут. Обвал даст +" + collapseGain() + " кристаллов (×" + fmtX(1 + CRYS_STEP * (state.crystals + collapseGain())) + " к добыче)." : "Доступно у предела 1.80e308 самоцветов. Кристаллы: " + state.crystals + " (×" + fmtX(crysMult()) + ").";
    $("collapse-btn").textContent = "Обвалить шахту";
    $("collapse-btn").disabled = !cr;

    document.querySelectorAll(".mode").forEach(function (b) {
      b.classList.toggle("on", Number(b.dataset.mode) === state.mode);
    });
  }

  function renderHeader() {
    $("gems").textContent = fmt(state.gems);
    $("rate").textContent = "+" + fmt(prodRate(0)) + "/с";
    $("crys").textContent = "Кристаллы: " + state.crystals;
    $("ach-count").textContent = "Достижения: " + state.ach.length + "/" + ACH.length;
  }

  function render() {
    renderHeader();
    renderRows();
    renderLayers();
  }

  function showAch() {
    const lines = ACH.map(function (a, i) {
      const got = state.ach.indexOf(i) >= 0;
      return (got ? "[x] " : "[ ] ") + a.name + " — " + a.text;
    });
    lines.push("", "Бонус достижений: ×" + fmtX(Math.pow(ACH_MULT, state.ach.length)) + " к добыче самоцветов");
    openModal("Достижения", lines.join("\n"), "Закрыть");
  }

  $("maxall").addEventListener("click", function () {
    if (buyMaxAll()) save();
  });
  $("ach-btn").addEventListener("click", showAch);
  $("sound-btn").addEventListener("click", function () {
    state.muted = !state.muted;
    syncSound();
    save();
  });
  document.querySelectorAll(".mode").forEach(function (b) {
    b.addEventListener("click", function () {
      state.mode = Number(b.dataset.mode);
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
  syncSound();
  applyOffline();
  checkAch();
  save();
  render();
  requestAnimationFrame(frame);
})();
