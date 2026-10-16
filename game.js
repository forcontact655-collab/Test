"use strict";
(function () {
  const DIFFS = {
    EZ: { label: "EZ Lv.6", density: 0.9, minGap: 600, grid: 4, pHold: 0.4, pDrag: 0.15, pFlick: 0.2, pChord: 0, side: 0, rot: 0, mv: 0 },
    HD: { label: "HD Lv.11", density: 1.4, minGap: 380, grid: 4, pHold: 0.35, pDrag: 0.3, pFlick: 0.35, pChord: 0.1, side: 0, rot: 6, mv: 0.4 },
    IN14: { label: "IN Lv.14", density: 2.4, minGap: 260, grid: 8, pHold: 0.25, pDrag: 0.45, pFlick: 0.4, pChord: 0.2, side: 0.12, rot: 10, mv: 0.6 },
    IN15: { label: "IN Lv.15", density: 3.3, minGap: 200, grid: 8, pHold: 0.2, pDrag: 0.5, pFlick: 0.4, pChord: 0.3, side: 0.2, rot: 14, mv: 0.8 }
  };
  const WIN = {
    tap: { perfect: 80, good: 150, bad: 180 },
    hold: { perfect: 80, good: 150 },
    drag: { perfect: 105 },
    flick: { perfect: 115 }
  };
  const HOLD_GAP = 180;
  const COLUMN = 0.24;
  const LINE_Y = 0.8;
  const LANES = [-0.33, 0, 0.33];
  const FRAME_MS = 10;
  const LEAD_IN = 1.2;
  const EFFECT_MS = 480;
  const BASE_SPEED = 0.5;
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

  function detectOnsets(mono, sr) {
    const hop = Math.max(1, Math.round((sr * FRAME_MS) / 1000));
    const n = Math.floor(mono.length / hop);
    const aL = 1 - Math.exp((-2 * Math.PI * 200) / sr);
    const aH = 1 - Math.exp((-2 * Math.PI * 3000) / sr);
    const eLow = new Float64Array(n);
    const eHigh = new Float64Array(n);
    let lp1 = 0;
    let lp2 = 0;
    for (let f = 0; f < n; f++) {
      let sumL = 0;
      let sumH = 0;
      const end = (f + 1) * hop;
      for (let i = f * hop; i < end; i++) {
        const x = mono[i];
        lp1 += aL * (x - lp1);
        lp2 += aH * (x - lp2);
        const hi = x - lp2;
        sumL += lp1 * lp1;
        sumH += hi * hi;
      }
      eLow[f] = Math.log(sumL / hop + 1e-9);
      eHigh[f] = Math.log(sumH / hop + 1e-9);
    }
    const fluxL = new Float64Array(n);
    const fluxH = new Float64Array(n);
    for (let f = 1; f < n; f++) {
      fluxL[f] = Math.max(0, eLow[f] - eLow[f - 1]);
      fluxH[f] = Math.max(0, eHigh[f] - eHigh[f - 1]);
    }
    const flux = new Float64Array(n);
    for (let f = 0; f < n; f++) flux[f] = fluxL[f] + fluxH[f];
    const P = new Float64Array(n + 1);
    for (let f = 0; f < n; f++) P[f + 1] = P[f] + flux[f];
    const peaks = [];
    const win = Math.round(500 / FRAME_MS);
    for (let f = 0; f < n; f++) {
      const a = Math.max(0, f - win);
      const b = Math.min(n - 1, f + win);
      const mean = (P[b + 1] - P[a]) / (b - a + 1);
      const v = flux[f];
      if (v < 0.12 || v <= mean * 1.5 + 0.1) continue;
      let peak = true;
      for (let k = Math.max(0, f - 3); k <= Math.min(n - 1, f + 3); k++) {
        if (k === f) continue;
        if (flux[k] > v || (flux[k] === v && k < f)) {
          peak = false;
          break;
        }
      }
      if (!peak) continue;
      peaks.push({ t: f * FRAME_MS, lo: fluxL[f], hi: fluxH[f], s: v });
    }
    let maxL = 1e-9;
    let maxH = 1e-9;
    for (const p of peaks) {
      if (p.lo > maxL) maxL = p.lo;
      if (p.hi > maxH) maxH = p.hi;
    }
    for (const p of peaks) {
      p.lo = p.lo / maxL;
      p.hi = p.hi / maxH;
      p.s = Math.max(p.lo, p.hi);
    }
    return { onsets: peaks };
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

  function analyzeBuffer(buffer) {
    const a = buffer.getChannelData(0);
    const b = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    const mono = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) mono[i] = b ? (a[i] + b[i]) * 0.5 : a[i];
    const res = detectOnsets(mono, buffer.sampleRate);
    const tempo = estimateTempo(res.onsets);
    return { onsets: res.onsets, bpm: tempo.bpm, phase: tempo.phase, durationMs: buffer.duration * 1000 };
  }

  function makeNote(type, time, lane, side, dur, chord) {
    return {
      type: type,
      time: Math.round(time),
      lane: lane,
      side: side,
      dur: Math.round(dur),
      endTime: Math.round(time + dur),
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

  function stepEvents(phase, stepMs, endMs, rampMs, valueAt) {
    const events = [];
    const kA = Math.floor(-phase / stepMs) - 1;
    const kB = Math.ceil((endMs - phase) / stepMs) + 1;
    const hold = stepMs - rampMs;
    for (let k = kA; k < kB; k++) {
      const t0 = phase + k * stepMs;
      const v0 = valueAt(k);
      events.push({ start: t0, end: t0 + hold, startV: v0, endV: v0 });
      events.push({ start: t0 + hold, end: t0 + stepMs, startV: v0, endV: valueAt(k + 1) });
    }
    return events;
  }

  function targetPattern(amp, seed) {
    const len = 64;
    const out = [];
    if (amp <= 0) {
      for (let i = 0; i < len; i++) out.push(0);
      return out;
    }
    const rng = mulberry32(seed);
    for (let i = 0; i < len; i++) {
      const r = rng();
      out.push(r < 0.5 ? 0 : r < 0.75 ? -amp : amp);
    }
    return out;
  }

  function makeLines(an, cfg, durationMs) {
    const beat = 60000 / an.bpm;
    const endMs = durationMs + 30000;
    const stepMs = beat * 8;
    const rampMs = beat * 4;
    const rotPat = targetPattern(cfg.rot, 1001);
    const movePat = targetPattern(cfg.mv, 2002);
    const at = function (pat, k) {
      const n = pat.length;
      return pat[((k % n) + n) % n];
    };
    return {
      rotate: stepEvents(an.phase, stepMs, endMs, rampMs, function (k) {
        return at(rotPat, k);
      }),
      moveX: stepEvents(an.phase, stepMs, endMs, rampMs, function (k) {
        return at(movePat, k);
      }),
      speed: [{ start: -60000, end: endMs + 60000, value: BASE_SPEED }]
    };
  }

  function generateChart(an, diffKey) {
    const cfg = DIFFS[diffKey] || DIFFS.HD;
    const rng = mulberry32(4242 + Object.keys(DIFFS).indexOf(diffKey) * 77);
    const beat = 60000 / an.bpm;
    const step = beat / cfg.grid;
    const durationMs = an.durationMs;
    const cand = [];
    for (const o of an.onsets) {
      if (o.t < 600) continue;
      const q = an.phase + Math.round((o.t - an.phase) / step) * step;
      cand.push({ t: Math.round(q), s: o.s, lo: o.lo, hi: o.hi });
    }
    cand.sort(function (a, b) { return a.t - b.t || b.s - a.s; });
    const merged = [];
    for (const c of cand) {
      const last = merged[merged.length - 1];
      if (last && c.t === last.t) {
        if (c.s > last.s) merged[merged.length - 1] = c;
      } else {
        merged.push(c);
      }
    }
    const target = Math.max(1, Math.round((durationMs / 1000) * cfg.density));
    const byStrength = merged.slice().sort(function (a, b) { return b.s - a.s; });
    const sorted = [];
    const accepted = [];
    for (const c of byStrength) {
      if (accepted.length >= target) break;
      if (!farEnough(sorted, c.t, cfg.minGap)) continue;
      insertSorted(sorted, c.t);
      accepted.push(c);
    }
    accepted.forEach(function (c, idx) { c.strengthPct = idx / accepted.length; });
    const loSorted = accepted.map(function (c) { return c.lo; }).sort(function (a, b) { return a - b; });
    accepted.forEach(function (c) {
      c.loPct = lowerBound(loSorted, c.lo) / loSorted.length;
    });
    accepted.sort(function (a, b) { return a.t - b.t; });
    const notes = [];
    let lastLane = -1;
    const pickLane = function (exclude) {
      let li;
      do {
        li = Math.floor(rng() * LANES.length);
      } while (li === exclude);
      return li;
    };
    for (let i = 0; i < accepted.length; i++) {
      const c = accepted[i];
      const p = c.strengthPct;
      const prevGap = i > 0 ? c.t - accepted[i - 1].t : 1e9;
      const nextGap = i + 1 < accepted.length ? accepted[i + 1].t - c.t : 1e9;
      let type = "tap";
      let dur = 0;
      if (nextGap >= beat * 1.0 && rng() < cfg.pHold) {
        type = "hold";
        const span = Math.min(beat * 4, nextGap - beat * 0.5);
        dur = Math.max(beat / 2, Math.floor(span / (beat / 4)) * (beat / 4));
      } else if ((c.hi > c.lo || (prevGap <= beat * 0.5 && nextGap <= beat * 0.5)) && rng() < cfg.pDrag) {
        type = "drag";
      } else if (c.loPct >= 0.8 && rng() < cfg.pFlick) {
        type = "flick";
      }
      const li = pickLane(lastLane);
      lastLane = li;
      const side = rng() < cfg.side ? -1 : 1;
      const main = makeNote(type, c.t, LANES[li], side, dur, false);
      notes.push(main);
      const beatIdx = Math.round((c.t - an.phase) / beat);
      const onBeat = Math.abs(c.t - an.phase - beatIdx * beat) < step * 0.25;
      const strongBeat = beatIdx % 2 === 0 && p < 0.35;
      if (type !== "hold" && onBeat && strongBeat && rng() < cfg.pChord) {
        const lj = pickLane(li);
        main.chord = true;
        notes.push(makeNote("tap", c.t, LANES[lj], side, 0, true));
      }
    }
    notes.sort(function (a, b) { return a.time - b.time || a.lane - b.lane; });
    return { notes: notes, lines: makeLines(an, cfg, durationMs), durationMs: durationMs };
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

  function evalTrack(list, ms, def) {
    if (!list || list.length === 0) return def;
    if (ms <= list[0].start) return list[0].startV;
    const last = list[list.length - 1];
    if (ms >= last.end) return last.endV;
    let lo = 0;
    let hi = list.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (list[mid].start <= ms) lo = mid;
      else hi = mid - 1;
    }
    const e = list[lo];
    if (ms >= e.end) return e.endV;
    const k = (ms - e.start) / (e.end - e.start);
    return e.startV + (e.endV - e.startV) * k;
  }

  function floorAt(events, ms, flow) {
    let total = 0;
    for (const e of events) {
      if (ms <= e.start) break;
      const t1 = Math.min(ms, e.end);
      total += ((t1 - e.start) / 1000) * e.value;
    }
    return total * flow;
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
        d[i] = ((2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * 620 * t)) * Math.exp(-30 * t)) * 0.6;
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
      return { notes: charts[key].notes, lines: charts[key].lines, an: analyses[id].data, durationMs: charts[key].durationMs };
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
      const X = Lx / 14;
      let mx = 0;
      let deg = 0;
      if (settings.rotation) {
        deg = evalTrack(g.lines.rotate, ms, 0);
        mx = evalTrack(g.lines.moveX, ms, 0);
      }
      const ang = (-deg * Math.PI) / 180;
      const cx = W / 2 + mx * X;
      const cy = H * LINE_Y;
      return { cx: cx, cy: cy, ang: ang, Lx: Lx, X: X, cos: Math.cos(ang), sin: Math.sin(ang) };
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

    function floorOf(g, ms) {
      return floorAt(g.lines.speed, ms, settings.flow);
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

    function drawBar(n, x0, w, v, kind, bh) {
      const color = kind === "drag" ? COLORS.drag : kind === "flick" ? COLORS.flick : COLORS.tap;
      ctx.fillStyle = color;
      if (kind === "flick") {
        const mx = x0 + w / 2;
        const r = bh * 0.9;
        ctx.fillRect(x0, v - bh / 2, w, bh);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(mx, v - r);
        ctx.lineTo(mx + r * 0.8, v);
        ctx.lineTo(mx, v + r);
        ctx.lineTo(mx - r * 0.8, v);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(x0, v - bh / 2, w, bh);
        if (kind === "tap") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x0 + 6, v - 1.5, w - 12, 3);
        }
      }
      if (n.chord) {
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0 - 3, v - bh / 2 - 3, w + 6, bh + 6);
      }
    }

    function drawNote(g, n, ms, geo, bh) {
      const x0 = (n.lane - COLUMN) * geo.Lx;
      const w = COLUMN * 2 * geo.Lx;
      const fNow = floorOf(g, ms);
      const vHead = -n.side * (floorOf(g, n.time) - fNow) * 0.6 * H;
      if (n.type === "hold") {
        const vTail = -n.side * (floorOf(g, n.endTime) - fNow) * 0.6 * H;
        const a = n.state === "active" ? 0 : vHead;
        const top = Math.min(a, vTail);
        const bot = Math.max(a, vTail);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = COLORS.tap;
        ctx.fillRect(x0, top, w, Math.max(1, bot - top));
        ctx.globalAlpha = 1;
        if (n.state === "wait") drawBar(n, x0, w, vHead, "tap", bh);
        return;
      }
      drawBar(n, x0, w, vHead, n.type, bh);
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
      const bh = Math.max(14, H * 0.022);
      const lc = lineColor(g.counts);
      ctx.save();
      ctx.translate(geo.cx, geo.cy);
      ctx.rotate(geo.ang);
      ctx.shadowColor = lc;
      ctx.shadowBlur = 12 * DPR;
      ctx.fillStyle = lc;
      ctx.fillRect(-geo.Lx / 2, -2, geo.Lx, 4);
      ctx.shadowBlur = 0;
      const look = 3000 / settings.flow;
      for (let i = g.lo; i < g.N; i++) {
        const n = g.notes[i];
        if (n.time - ms > look) break;
        if (n.state === "done") continue;
        drawNote(g, n, ms, geo, bh);
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
        lines: chart.lines,
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
      beginGame(game.id, { notes: game.chartNotes, lines: game.lines, an: game.an, durationMs: game.durationMs });
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
      makeLines: makeLines,
      evalTrack: evalTrack,
      floorAt: floorAt,
      judgeDelta: judgeDelta,
      computeScore: computeScore,
      rankOf: rankOf,
      lineColor: lineColor,
      synthChrono: synthChrono
    };
  }

  if (typeof document !== "undefined" && document.getElementById("game")) init();
})();
