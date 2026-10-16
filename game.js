"use strict";
(function () {
  const DIFFS = {
    EZ: { label: "EZ Lv.6", keep: 0.35, gap: 380, side: 0 },
    HD: { label: "HD Lv.11", keep: 0.6, gap: 220, side: 0 },
    IN14: { label: "IN Lv.14", keep: 0.8, gap: 140, side: 0.2 },
    IN15: { label: "IN Lv.15", keep: 1, gap: 95, side: 0.3 }
  };
  const WIN = {
    tap: { perfect: 80, good: 150, bad: 180 },
    hold: { perfect: 80, good: 150 },
    drag: { perfect: 105 },
    flick: { perfect: 115 }
  };
  const HOLD_GAP = 180;
  const COLUMN = 0.24;
  const LANES = [-0.25, 0, 0.25];
  const FRAME_MS = 20;
  const LEAD_IN = 1.2;
  const EFFECT_MS = 480;
  const STORE_KEY = "phigros-web-x-settings";
  const DEFAULTS = { track: "track", diff: "HD", flow: 1, offset: 0, sfx: true, rotation: true, autoplay: false };
  const COLORS = { tap: "#36d6ff", drag: "#ffe45e", flick: "#ff4d8d", gold: "#ffe07d", blue: "#48e5ff" };

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function detectOnsets(mono, sr) {
    const frameLen = Math.max(1, Math.round((sr * FRAME_MS) / 1000));
    const n = Math.floor(mono.length / frameLen);
    const logE = new Float64Array(n);
    for (let f = 0; f < n; f++) {
      let acc = 0;
      const end = (f + 1) * frameLen;
      for (let i = f * frameLen; i < end; i++) {
        const d = i > 0 ? mono[i] - mono[i - 1] : mono[i];
        acc += d * d;
      }
      logE[f] = Math.log(acc / frameLen + 1e-9);
    }
    const flux = new Float64Array(n);
    for (let f = 1; f < n; f++) flux[f] = Math.max(0, logE[f] - logE[f - 1]);
    const P = new Float64Array(n + 1);
    for (let f = 0; f < n; f++) P[f + 1] = P[f] + flux[f];
    const onsets = [];
    let maxS = 0;
    for (let f = 0; f < n; f++) {
      const a = Math.max(0, f - 25);
      const b = Math.min(n - 1, f + 25);
      const mean = (P[b + 1] - P[a]) / (b - a + 1);
      const v = flux[f];
      if (v < 0.1 || v <= mean * 1.5 + 0.08) continue;
      let peak = true;
      for (let k = Math.max(0, f - 2); k <= Math.min(n - 1, f + 2); k++) {
        if (k === f) continue;
        if (flux[k] > v || (flux[k] === v && k < f)) {
          peak = false;
          break;
        }
      }
      if (!peak) continue;
      onsets.push({ t: f * FRAME_MS, s: v });
      if (v > maxS) maxS = v;
    }
    if (maxS > 0) {
      for (const o of onsets) o.s = o.s / maxS;
    }
    return { onsets: onsets, flux: flux };
  }

  function estimateTempo(onsets) {
    const BINS = 64;
    let best = { bpm: 120, phase: 0, score: -1 };
    if (onsets.length < 4) return best;
    for (let bpm = 80; bpm <= 200; bpm += 0.25) {
      const period = 60000 / bpm;
      const hist = new Float64Array(BINS);
      for (const o of onsets) {
        const frac = (((o.t % period) + period) % period) / period;
        hist[Math.floor(frac * BINS) % BINS] += o.s;
      }
      for (let b = 0; b < BINS; b++) {
        const score = hist[(b + BINS - 1) % BINS] + hist[b] + hist[(b + 1) % BINS];
        if (score > best.score) {
          best = { bpm: bpm, phase: ((b + 0.5) / BINS) * period, score: score };
        }
      }
    }
    return best;
  }

  function lowerBound(sorted, t) {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function farEnough(sorted, t, gap) {
    const i = lowerBound(sorted, t);
    if (i < sorted.length && sorted[i] - t < gap) return false;
    if (i > 0 && t - sorted[i - 1] < gap) return false;
    return true;
  }

  function insertSorted(sorted, t) {
    sorted.splice(lowerBound(sorted, t), 0, t);
  }

  function makeNote(type, time, lane, side, dur, chord) {
    return {
      type: type,
      time: time,
      lane: lane,
      side: side,
      dur: dur,
      endTime: time + dur,
      chord: chord,
      state: "wait",
      headResult: null,
      lastHeld: 0
    };
  }

  function cloneNotes(notes) {
    return notes.map(function (n) {
      return makeNote(n.type, n.time, n.lane, n.side, n.dur, n.chord);
    });
  }

  function generateChart(analysis, diffKey) {
    const cfg = DIFFS[diffKey] || DIFFS.HD;
    const rng = mulberry32(4242 + Object.keys(DIFFS).indexOf(diffKey) * 77);
    const beatMs = 60000 / analysis.bpm;
    const pool = analysis.onsets.filter(function (o) { return o.t >= 600; }).slice().sort(function (a, b) { return b.s - a.s; });
    const sorted = [];
    let picked = [];
    for (const o of pool) {
      if (!farEnough(sorted, o.t, cfg.gap)) continue;
      insertSorted(sorted, o.t);
      picked.push(o);
    }
    picked.sort(function (a, b) { return b.s - a.s; });
    picked = picked.slice(0, Math.max(1, Math.round(picked.length * cfg.keep)));
    picked.sort(function (a, b) { return a.t - b.t; });
    const pickLane = function (exclude) {
      let li;
      do {
        li = Math.floor(rng() * LANES.length);
      } while (li === exclude);
      return li;
    };
    const notes = [];
    let lastLane = -1;
    for (let i = 0; i < picked.length; i++) {
      const o = picked[i];
      const prevGap = i > 0 ? o.t - picked[i - 1].t : 1e9;
      const nextGap = i + 1 < picked.length ? picked[i + 1].t - o.t : 1e9;
      let type = "tap";
      let dur = 0;
      if (nextGap >= 650 && rng() < 0.6) {
        type = "hold";
        dur = Math.min(nextGap * 0.6, 1400);
      } else if (prevGap < 170 && nextGap < 170 && o.s < 0.7) {
        type = "drag";
      } else if (o.s >= 0.8 && rng() < 0.6) {
        type = "flick";
      }
      const li = pickLane(lastLane);
      lastLane = li;
      const side = rng() < cfg.side ? -1 : 1;
      const main = makeNote(type, o.t, LANES[li], side, dur, false);
      notes.push(main);
      const rel = o.t - analysis.phase;
      const beatIdx = Math.round(rel / beatMs);
      const off = Math.abs(rel - beatIdx * beatMs);
      if (type !== "hold" && off < 35 && beatIdx % 4 === 0 && o.s >= 0.55 && rng() < 0.7) {
        const lj = pickLane(li);
        main.chord = true;
        notes.push(makeNote("tap", o.t, LANES[lj], side, 0, true));
      }
    }
    notes.sort(function (a, b) { return a.time - b.time || a.lane - b.lane; });
    return notes;
  }

  function judgeDelta(type, adt) {
    if (type === "tap") {
      if (adt <= WIN.tap.perfect) return "perfect";
      if (adt <= WIN.tap.good) return "good";
      if (adt <= WIN.tap.bad) return "bad";
      return null;
    }
    if (type === "hold") {
      if (adt <= WIN.hold.perfect) return "perfect";
      if (adt <= WIN.hold.good) return "good";
      return null;
    }
    const w = type === "drag" ? WIN.drag.perfect : WIN.flick.perfect;
    return adt <= w ? "perfect" : null;
  }

  function computeScore(c, total, maxCombo) {
    if (total <= 0) return 0;
    const acc = (c.perfect + c.good * 0.65) / total;
    return Math.round(900000 * acc + 100000 * (maxCombo / total));
  }

  function rankOf(c, total, score) {
    if (total > 0 && c.good === 0 && c.bad === 0 && c.miss === 0) return { label: "φ", color: COLORS.gold };
    if (total > 0 && c.bad === 0 && c.miss === 0) return { label: "V", color: COLORS.blue };
    if (score >= 960000) return { label: "V", color: "#ffffff" };
    if (score >= 920000) return { label: "S", color: "#ffffff" };
    if (score >= 880000) return { label: "A", color: "#ffffff" };
    if (score >= 820000) return { label: "B", color: "#ffffff" };
    if (score >= 700000) return { label: "C", color: "#ffffff" };
    return { label: "F", color: "#ff6b6b" };
  }

  function lineColor(c) {
    if (c.good === 0 && c.bad === 0 && c.miss === 0) return COLORS.gold;
    if (c.bad === 0 && c.miss === 0) return COLORS.blue;
    return "#ffffff";
  }

  function analyzeBuffer(buffer) {
    const a = buffer.getChannelData(0);
    const b = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    const mono = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) mono[i] = b ? (a[i] + b[i]) * 0.5 : a[i];
    const res = detectOnsets(mono, buffer.sampleRate);
    const tempo = estimateTempo(res.onsets);
    return { onsets: res.onsets, bpm: tempo.bpm, phase: tempo.phase, durationMs: buffer.duration * 1000 };
  }

  function makeHitBuffer(actx, kind) {
    const sr = actx.sampleRate;
    const len = Math.floor(sr * 0.12);
    const buf = actx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      if (kind === "tap") {
        d[i] = Math.sin(2 * Math.PI * 900 * t) * Math.exp(-45 * t) * 0.8;
      } else if (kind === "drag") {
        d[i] = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * 620 * t)) * Math.exp(-30 * t) * 0.6;
      } else {
        const noise = Math.random() * 2 - 1;
        d[i] = (noise - prev) * 0.5 * Math.exp(-35 * t);
        prev = noise;
      }
    }
    return buf;
  }

  function synthChrono(actx) {
    const sr = actx.sampleRate;
    const beat = 60 / 160;
    const bars = 32;
    const total = Math.floor(beat * 4 * bars * sr) + sr;
    const buf = actx.createBuffer(1, total, sr);
    const d = buf.getChannelData(0);
    const TWO_PI = Math.PI * 2;
    const mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
    let seed = 99;
    const rnd = function () {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647) * 2 - 1;
    };
    const add = function (start, dur, fn) {
      const i0 = Math.max(0, Math.floor(start * sr));
      const i1 = Math.min(total, Math.floor((start + dur) * sr));
      for (let i = i0; i < i1; i++) d[i] += fn(i / sr - start);
    };
    for (let b = 0; b < bars; b++) {
      const ch = chords[b % 4];
      const barStart = b * 4 * beat;
      for (let k = 0; k < 4; k++) {
        const s = barStart + k * beat;
        add(s, 0.42, function (t) {
          return Math.sin(TWO_PI * (45 * t + (110 / 30) * (1 - Math.exp(-30 * t)))) * Math.exp(-12 * t) * 0.8;
        });
        if (k % 2 === 1) {
          add(s, 0.2, function (t) { return rnd() * Math.exp(-28 * t) * 0.22; });
        }
      }
      for (let e = 0; e < 8; e++) {
        const s = barStart + (e * beat) / 2;
        add(s, 0.06, function (t) { return rnd() * Math.exp(-90 * t) * 0.12; });
        const root = ch[0] - 12 + (e % 2 === 1 ? ch[2] - ch[0] : 0);
        const f = mtof(root);
        add(s, (beat / 2) * 0.9, function (t) {
          let v = 0;
          for (let h = 1; h <= 6; h++) v += Math.sin(TWO_PI * f * h * t) / h;
          return v * 0.1 * Math.exp(-4 * t);
        });
      }
      for (let s16 = 0; s16 < 16; s16++) {
        const s = barStart + (s16 * beat) / 4;
        const f = mtof(ch[s16 % 3] + 24);
        add(s, (beat / 4) * 0.85, function (t) {
          return (Math.sin(TWO_PI * f * t) >= 0 ? 1 : -1) * Math.exp(-9 * t) * 0.06;
        });
      }
    }
    let peak = 0;
    for (let i = 0; i < total; i++) {
      const v = Math.abs(d[i]);
      if (v > peak) peak = v;
    }
    if (peak > 0) {
      const k = 0.85 / peak;
      for (let i = 0; i < total; i++) d[i] *= k;
    }
    return buf;
  }

  function decodeData(actx, data) {
    return new Promise(function (resolve, reject) {
      actx.decodeAudioData(data, resolve, reject);
    });
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return Object.assign({}, DEFAULTS, raw ? JSON.parse(raw) : {});
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch (e) {
      return;
    }
  }

  function pad7(n) {
    return String(Math.max(0, n)).padStart(7, "0");
  }

  function init() {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const el = function (id) { return document.getElementById(id); };
    let W = 1;
    let H = 1;
    let DPR = 1;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
    }
    resize();
    window.addEventListener("resize", resize);

    const settings = loadSettings();
    if (settings.track !== "track" && settings.track !== "chrono") settings.track = "track";
    if (!DIFFS[settings.diff]) settings.diff = "HD";

    let audio = null;
    const buffers = {};
    const analyses = {};
    const charts = {};
    const trackNames = { track: "Somewhat_empty — Track", chrono: "Chronostasis — 160 BPM", custom: "" };
    let game = null;

    function persist() {
      saveSettings(settings);
    }

    function setStatus(msg) {
      el("status").textContent = msg;
    }

    function setText(id, s) {
      const node = el(id);
      if (node.textContent !== s) node.textContent = s;
    }

    function syncMenu() {
      document.querySelectorAll(".track-btn").forEach(function (b) {
        b.classList.toggle("on", b.dataset.track === settings.track);
      });
      document.querySelectorAll(".diff-btn").forEach(function (b) {
        b.classList.toggle("on", b.dataset.diff === settings.diff);
      });
      const custom = el("custom-btn");
      custom.classList.toggle("on", settings.track === "custom");
      custom.textContent = buffers.custom ? trackNames.custom : "Свой аудиофайл…";
      el("flow").value = settings.flow;
      el("flow-val").textContent = settings.flow.toFixed(1) + "x";
      el("offset").value = settings.offset;
      el("offset-val").textContent = settings.offset + " мс";
      el("sfx").checked = settings.sfx;
      el("rotation").checked = settings.rotation;
      el("autoplay").checked = settings.autoplay;
    }

    function setScreen(name) {
      el("menu").classList.toggle("hidden", name !== "menu");
      el("pause").classList.toggle("hidden", name !== "pause");
      el("result").classList.toggle("hidden", name !== "result");
      document.body.classList.toggle("playing", name === "game" || name === "pause");
    }

    function ensureAudio() {
      if (!audio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        const actx = new AC();
        const music = actx.createGain();
        music.gain.value = 0.9;
        music.connect(actx.destination);
        const sfx = actx.createGain();
        sfx.gain.value = 0.6;
        sfx.connect(actx.destination);
        audio = {
          ctx: actx,
          music: music,
          sfx: sfx,
          hits: {
            tap: makeHitBuffer(actx, "tap"),
            drag: makeHitBuffer(actx, "drag"),
            flick: makeHitBuffer(actx, "flick")
          }
        };
      }
      if (audio.ctx.state === "suspended") audio.ctx.resume();
      return audio;
    }

    function playHit(kind) {
      if (!settings.sfx || !audio) return;
      const src = audio.ctx.createBufferSource();
      src.buffer = audio.hits[kind];
      src.connect(audio.sfx);
      src.start();
    }

    async function loadTrack(id) {
      if (buffers[id]) return buffers[id];
      const a = ensureAudio();
      if (id === "track") {
        const res = await fetch("track.m4a");
        if (!res.ok) throw new Error("track.m4a не найден");
        buffers[id] = await decodeData(a.ctx, await res.arrayBuffer());
      } else if (id === "chrono") {
        buffers[id] = synthChrono(a.ctx);
      } else {
        throw new Error("выбери свой аудиофайл");
      }
      return buffers[id];
    }

    function getChart(id, diff) {
      const buf = buffers[id];
      if (!analyses[id] || analyses[id].src !== buf) {
        analyses[id] = { src: buf, data: analyzeBuffer(buf) };
        Object.keys(charts).forEach(function (k) {
          if (k.indexOf(id + "|") === 0) delete charts[k];
        });
      }
      const key = id + "|" + diff;
      if (!charts[key]) charts[key] = generateChart(analyses[id].data, diff);
      return { notes: charts[key], an: analyses[id].data };
    }

    function stopSource() {
      if (game && game.src) {
        try {
          game.src.stop();
        } catch (e) {
          return;
        }
        game.src = null;
      }
    }

    function songMs(g) {
      return (audio.ctx.currentTime - g.t0) * 1000 - settings.offset;
    }

    function geometry(g, ms) {
      const Lx = Math.min(W * 0.9, H * 1.3);
      let cx = W / 2;
      let cy = H * 0.6;
      let ang = 0;
      if (settings.rotation) {
        const beat = 60000 / g.an.bpm;
        const ph = (2 * Math.PI * ms) / (beat * 4);
        ang = 0.22 * Math.sin(ph);
        cx += Math.sin(ph * 0.5) * W * 0.05;
        cy += Math.cos(ph) * H * 0.02;
      }
      return { cx: cx, cy: cy, ang: ang, Lx: Lx, cos: Math.cos(ang), sin: Math.sin(ang) };
    }

    function localU(g, x, y) {
      const dx = x - g.geo.cx;
      const dy = y - g.geo.cy;
      return (dx * g.geo.cos + dy * g.geo.sin) / g.geo.Lx;
    }

    function inColumn(u, lane) {
      return Math.abs(u - lane) <= COLUMN;
    }

    function pointerInColumn(g, lane) {
      for (const p of g.pointers.values()) {
        if (inColumn(localU(g, p.x, p.y), lane)) return true;
      }
      return false;
    }

    function pxPerMs(g) {
      return settings.flow * H * 0.00045;
    }

    function advanceLo(g) {
      while (g.lo < g.N && g.notes[g.lo].state === "done") g.lo++;
    }

    function tally(g, res) {
      g.counts[res]++;
      if (res === "perfect" || res === "good") {
        g.combo++;
        if (g.combo > g.maxCombo) g.maxCombo = g.combo;
      } else {
        g.combo = 0;
      }
    }

    function spawnEffect(g, lane, res) {
      if (res !== "perfect" && res !== "good") return;
      g.effects.push({ u: lane, kind: res, t: performance.now() });
    }

    function hitNote(g, n, res, dt) {
      if (dt < 0) g.early++;
      else if (dt > 0) g.late++;
      spawnEffect(g, n.lane, res);
      playHit(n.type === "flick" ? "flick" : n.type === "drag" ? "drag" : "tap");
      if (n.type === "hold") {
        n.state = "active";
        n.headResult = res;
        n.lastHeld = songMs(g);
        g.holds.push(n);
        return;
      }
      n.state = "done";
      g.resolved++;
      tally(g, res);
    }

    function missNote(g, n) {
      n.state = "done";
      g.resolved++;
      tally(g, "miss");
    }

    function tapHit(g, p, ms) {
      const u = localU(g, p.x, p.y);
      let best = null;
      let bestAdt = Infinity;
      for (let i = g.lo; i < g.N; i++) {
        const n = g.notes[i];
        if (n.time - ms > 200) break;
        if (n.state !== "wait" || (n.type !== "tap" && n.type !== "hold")) continue;
        const adt = Math.abs(ms - n.time);
        const limit = n.type === "tap" ? WIN.tap.bad : WIN.hold.good;
        if (adt > limit || adt >= bestAdt || !inColumn(u, n.lane)) continue;
        best = n;
        bestAdt = adt;
      }
      if (!best) return;
      const res = judgeDelta(best.type, bestAdt);
      if (!res) return;
      hitNote(g, best, res, ms - best.time);
    }

    function flickHit(g, p, ms) {
      const u = localU(g, p.x, p.y);
      for (let i = g.lo; i < g.N; i++) {
        const n = g.notes[i];
        if (n.time - ms > 200) break;
        if (n.state !== "wait" || n.type !== "flick") continue;
        const dt = ms - n.time;
        if (Math.abs(dt) > WIN.flick.perfect || !inColumn(u, n.lane)) continue;
        hitNote(g, n, "perfect", dt);
        return;
      }
    }

    function inputTick(g, ms) {
      for (let i = g.lo; i < g.N; i++) {
        const n = g.notes[i];
        if (n.time - ms > 200) break;
        if (n.state !== "wait") continue;
        const dt = ms - n.time;
        if (n.type === "drag") {
          if (Math.abs(dt) <= WIN.drag.perfect && pointerInColumn(g, n.lane)) hitNote(g, n, "perfect", dt);
          else if (dt > WIN.drag.perfect) missNote(g, n);
        } else if (n.type === "flick") {
          if (dt > WIN.flick.perfect) missNote(g, n);
        } else if (n.type === "tap") {
          if (dt > WIN.tap.bad) missNote(g, n);
        } else if (dt > WIN.hold.good) {
          missNote(g, n);
        }
      }
      advanceLo(g);
    }

    function autoTick(g, ms) {
      for (let i = g.lo; i < g.N; i++) {
        const n = g.notes[i];
        if (n.time > ms) break;
        if (n.state === "wait") hitNote(g, n, "perfect", 0);
      }
      advanceLo(g);
    }

    function holdTick(g, ms) {
      for (let k = g.holds.length - 1; k >= 0; k--) {
        const n = g.holds[k];
        if (ms >= n.endTime) {
          n.state = "done";
          g.resolved++;
          tally(g, n.headResult);
          g.holds.splice(k, 1);
          continue;
        }
        if (settings.autoplay || pointerInColumn(g, n.lane)) {
          n.lastHeld = ms;
        } else if (ms - n.lastHeld > HOLD_GAP) {
          n.state = "done";
          g.resolved++;
          tally(g, "miss");
          g.holds.splice(k, 1);
        }
      }
      advanceLo(g);
    }

    function finishGame(g) {
      g.finished = true;
      for (const n of g.notes) {
        if (n.state !== "done") {
          n.state = "done";
          g.resolved++;
          tally(g, "miss");
        }
      }
      g.holds = [];
      stopSource();
      showResult(g);
    }

    function endTick(g, ms) {
      if (g.finished) return;
      const allDone = g.resolved >= g.N;
      if (ms >= g.durationMs + 200 || (allDone && ms > g.lastEnd + 1500)) finishGame(g);
    }

    function update(g) {
      const ms = songMs(g);
      g.ms = ms;
      g.geo = geometry(g, ms);
      if (settings.autoplay) autoTick(g, ms);
      else inputTick(g, ms);
      holdTick(g, ms);
      endTick(g, ms);
    }

    function drawBar(n, x0, w, v, kind) {
      const color = kind === "drag" ? COLORS.drag : kind === "flick" ? COLORS.flick : COLORS.tap;
      ctx.fillStyle = color;
      ctx.fillRect(x0, v - 5, w, 10);
      if (kind === "flick") {
        const mx = x0 + w / 2;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(mx, v - 6);
        ctx.lineTo(mx + 8, v);
        ctx.lineTo(mx, v + 6);
        ctx.lineTo(mx - 8, v);
        ctx.closePath();
        ctx.fill();
      } else if (kind === "tap") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x0 + 6, v - 1.5, w - 12, 3);
      }
      if (n.chord) {
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0 - 3, v - 8, w + 6, 16);
      }
    }

    function drawNote(g, n, ms, ppm, geo) {
      const x0 = (n.lane - COLUMN) * geo.Lx;
      const w = COLUMN * 2 * geo.Lx;
      const vHead = -n.side * (n.time - ms) * ppm;
      if (n.type === "hold") {
        const vTail = -n.side * (n.endTime - ms) * ppm;
        const a = n.state === "active" ? 0 : vHead;
        const top = Math.min(a, vTail);
        const bot = Math.max(a, vTail);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = COLORS.tap;
        ctx.fillRect(x0, top, w, Math.max(1, bot - top));
        ctx.globalAlpha = 1;
        if (n.state === "wait") drawBar(n, x0, w, vHead, "tap");
        return;
      }
      drawBar(n, x0, w, vHead, n.type);
    }

    function drawEffects(g, geo) {
      const now = performance.now();
      g.effects = g.effects.filter(function (e) { return now - e.t < EFFECT_MS; });
      for (const e of g.effects) {
        const k = (now - e.t) / EFFECT_MS;
        const ex = e.u * geo.Lx;
        const color = e.kind === "perfect" ? COLORS.gold : COLORS.blue;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const s = 14 + 70 * k;
        ctx.strokeRect(ex - s / 2, -s / 2, s, s);
        ctx.fillStyle = color;
        for (let j = 0; j < 6; j++) {
          const ang = (j * Math.PI) / 3 + 0.35;
          const dist = 6 + 60 * k;
          ctx.fillRect(ex + Math.cos(ang) * dist - 3, Math.sin(ang) * dist - 3, 6, 6);
        }
      }
      ctx.globalAlpha = 1;
    }

    function draw(g) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0c0b18");
      grad.addColorStop(1, "#1a1430");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      if (!g) return;
      const ms = g.ms;
      const geo = g.geo;
      const ppm = pxPerMs(g);
      const lc = lineColor(g.counts);
      ctx.save();
      ctx.translate(geo.cx, geo.cy);
      ctx.rotate(geo.ang);
      ctx.shadowColor = lc;
      ctx.shadowBlur = 12 * DPR;
      ctx.fillStyle = lc;
      ctx.fillRect(-geo.Lx / 2, -2, geo.Lx, 4);
      ctx.shadowBlur = 0;
      const look = (H * 1.2) / ppm;
      for (let i = g.lo; i < g.N; i++) {
        const n = g.notes[i];
        if (n.time - ms > look) break;
        if (n.state === "done") continue;
        drawNote(g, n, ms, ppm, geo);
      }
      drawEffects(g, geo);
      ctx.restore();
    }

    function updateHud(g) {
      const p = Math.min(1, Math.max(0, g.ms) / g.durationMs);
      el("progress").style.transform = "scaleX(" + p.toFixed(4) + ")";
      setText("score", pad7(computeScore(g.counts, g.N, g.maxCombo)));
      setText("combo", String(g.combo));
      el("combo-box").classList.toggle("show", g.combo >= 3);
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!game) return;
      if (!game.paused && !game.finished) update(game);
      draw(game);
      updateHud(game);
    }

    function beginGame(id, chart) {
      const a = ensureAudio();
      stopSource();
      const buf = buffers[id];
      const notes = cloneNotes(chart.notes);
      const src = a.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(a.music);
      const t0 = a.ctx.currentTime + LEAD_IN;
      src.start(t0);
      let lastEnd = 0;
      for (const n of notes) {
        if (n.endTime > lastEnd) lastEnd = n.endTime;
      }
      game = {
        id: id,
        diff: settings.diff,
        chartNotes: chart.notes,
        notes: notes,
        N: notes.length,
        an: chart.an,
        durationMs: buf.duration * 1000,
        counts: { perfect: 0, good: 0, bad: 0, miss: 0 },
        combo: 0,
        maxCombo: 0,
        early: 0,
        late: 0,
        lo: 0,
        resolved: 0,
        lastEnd: lastEnd,
        holds: [],
        pointers: new Map(),
        effects: [],
        paused: false,
        finished: false,
        src: src,
        t0: t0,
        ms: -LEAD_IN * 1000,
        geo: null
      };
      game.geo = geometry(game, game.ms);
      el("track-name").textContent = trackNames[id];
      el("diff-name").textContent = DIFFS[settings.diff].label;
      setScreen("game");
    }

    async function startFromMenu() {
      const btn = el("play-btn");
      btn.disabled = true;
      setStatus("Загрузка трека…");
      try {
        ensureAudio();
        const id = settings.track;
        await loadTrack(id);
        setStatus("Анализ трека и генерация чарта…");
        await new Promise(function (r) { setTimeout(r, 30); });
        const chart = getChart(id, settings.diff);
        setStatus("");
        beginGame(id, chart);
      } catch (err) {
        setStatus("Ошибка: " + err.message);
      } finally {
        btn.disabled = false;
      }
    }

    function pauseGame() {
      if (!game || game.paused || game.finished) return;
      game.paused = true;
      game.pointers.clear();
      audio.ctx.suspend();
      setScreen("pause");
    }

    function resumeGame() {
      if (!game || !game.paused) return;
      game.paused = false;
      audio.ctx.resume();
      setScreen("game");
    }

    function restartGame() {
      if (!game) return;
      beginGame(game.id, { notes: game.chartNotes, an: game.an });
    }

    function quitGame() {
      stopSource();
      game = null;
      setScreen("menu");
      syncMenu();
    }

    function showResult(g) {
      const score = computeScore(g.counts, g.N, g.maxCombo);
      const rank = rankOf(g.counts, g.N, score);
      const rankEl = el("res-rank");
      rankEl.textContent = rank.label;
      rankEl.style.color = rank.color;
      el("res-score").textContent = pad7(score);
      const acc = g.N ? ((g.counts.perfect + g.counts.good * 0.65) / g.N) * 100 : 0;
      el("res-acc").textContent = acc.toFixed(2) + "%";
      el("res-combo").textContent = String(g.maxCombo);
      el("res-p").textContent = String(g.counts.perfect);
      el("res-g").textContent = String(g.counts.good);
      el("res-b").textContent = String(g.counts.bad);
      el("res-m").textContent = String(g.counts.miss);
      el("res-early").textContent = String(g.early);
      el("res-late").textContent = String(g.late);
      el("res-track").textContent = trackNames[g.id] + " · " + DIFFS[g.diff].label;
      setScreen("result");
    }

    function onDown(e) {
      if (!game || game.paused || game.finished) return;
      e.preventDefault();
      const p = { x: e.clientX, y: e.clientY, acc: 0 };
      game.pointers.set(e.pointerId, p);
      if (!settings.autoplay) tapHit(game, p, songMs(game));
    }

    function onMove(e) {
      if (!game || game.paused || game.finished || settings.autoplay) return;
      const p = game.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      p.acc += Math.sqrt(dx * dx + dy * dy);
      if (p.acc >= 6) {
        p.acc = 0;
        flickHit(game, p, songMs(game));
      }
    }

    function onUp(e) {
      if (game) game.pointers.delete(e.pointerId);
    }

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    el("play-btn").addEventListener("click", startFromMenu);
    el("pause-btn").addEventListener("click", pauseGame);
    el("resume").addEventListener("click", resumeGame);
    el("restart").addEventListener("click", restartGame);
    el("quit").addEventListener("click", quitGame);
    el("res-replay").addEventListener("click", restartGame);
    el("res-menu").addEventListener("click", quitGame);

    document.querySelectorAll(".track-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        settings.track = b.dataset.track;
        persist();
        syncMenu();
      });
    });
    document.querySelectorAll(".diff-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        settings.diff = b.dataset.diff;
        persist();
        syncMenu();
      });
    });
    el("custom-btn").addEventListener("click", function () {
      el("file").click();
    });
    el("file").addEventListener("change", async function (e) {
      const input = e.target;
      const f = input.files && input.files[0];
      if (!f) return;
      try {
        const a = ensureAudio();
        setStatus("Декодирую " + f.name + "…");
        buffers.custom = await decodeData(a.ctx, await f.arrayBuffer());
        trackNames.custom = f.name;
        settings.track = "custom";
        persist();
        syncMenu();
        setStatus("Файл загружен: " + f.name);
      } catch (err) {
        setStatus("Не удалось открыть файл: " + err.message);
      }
      input.value = "";
    });
    el("flow").addEventListener("input", function (e) {
      settings.flow = parseFloat(e.target.value);
      persist();
      syncMenu();
    });
    el("offset").addEventListener("input", function (e) {
      settings.offset = parseInt(e.target.value, 10);
      persist();
      syncMenu();
    });
    el("sfx").addEventListener("change", function (e) {
      settings.sfx = e.target.checked;
      persist();
    });
    el("rotation").addEventListener("change", function (e) {
      settings.rotation = e.target.checked;
      persist();
    });
    el("autoplay").addEventListener("change", function (e) {
      settings.autoplay = e.target.checked;
      persist();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pauseGame();
    });

    syncMenu();
    setScreen("menu");
    requestAnimationFrame(frame);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      detectOnsets: detectOnsets,
      estimateTempo: estimateTempo,
      analyzeBuffer: analyzeBuffer,
      generateChart: generateChart,
      judgeDelta: judgeDelta,
      computeScore: computeScore,
      rankOf: rankOf,
      lineColor: lineColor,
      synthChrono: synthChrono
    };
  }

  if (typeof document !== "undefined" && document.getElementById("game")) init();
})();
