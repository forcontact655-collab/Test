(function () {
  "use strict";

  const SUPA_URL = "https://ceqahqbrvgqdcjxgzjxk.supabase.co";
  const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcWFocWJydmdxZGNqeGd6anhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDgzMDMsImV4cCI6MjEwODI4NDMwM30.ZRngDLbZeqysidVxsXU_S4I1GxfsAXmftHQsRvWQLsQ";
  const DOMAIN = "gemgram.app";
  const MB = 1024 * 1024;
  const EDIT_MS = 48 * 3600 * 1000;
  const REACTS = [":D", "xD", "=)", ":3", "^_~", "\\o/", "<3", ":(", "o_O", "+1"];
  const SMILES = [":D", "xD", "=)", ":3", "^_^", "^_~", "-_-", ":(", ":'(", "o_O", ">_<", "\\o/", "<3", "+1", "-1", ";)", ":P", ":O", "8)", "XD", "(-_-)", "(>_<)", "*_*", "T_T", "^^", "xP", ":S", ":|", "@_@", "~o~", "\\m/", "(y)", "(n)", "(!)", "(?)", ":*", "B)", "(:"];
  const GRADS = [
    "linear-gradient(135deg,#7c3aed,#c084fc)",
    "linear-gradient(135deg,#6d28d9,#a78bfa)",
    "linear-gradient(135deg,#a21caf,#f0abfc)",
    "linear-gradient(135deg,#4c1d95,#8b5cf6)",
    "linear-gradient(135deg,#7e22ce,#e879f9)",
    "linear-gradient(135deg,#5b21b6,#f472b6)"
  ];
  const NAME_COLORS = ["#c4b5fd", "#f0abfc", "#a5f3fc", "#fde68a", "#86efac", "#fda4af"];
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const FOLDERS = [["all", "Все"], ["direct", "Личные"], ["group", "Группы"], ["channel", "Каналы"], ["unread", "Непрочитанные"]];
  const ICON = {
    reply: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 5 5v6",
    copy: "M9 9h10v12H9zM5 15V3h10",
    fwd: "M14 5l7 7-7 7M21 12H9a6 6 0 0 0-6 6",
    edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
    pin: "M12 3l3 6 6 .8-4.5 4.2L18 21l-6-3.4L6 21l1.5-7L3 9.8 9 9z",
    mute: "M5 9v6h4l5 4V5L9 9H5zM16 9l5 6M21 9l-5 6",
    unmute: "M5 9v6h4l5 4V5L9 9H5zM16 8a5 5 0 0 1 0 8",
    info: "M12 16v-5M12 8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    exit: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
    close: "M6 6l12 12M18 6L6 18",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    sticker: "M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9l7-7V6a3 3 0 0 0-3-3zM15 21v-4a2 2 0 0 1 2-2h4",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8zM10 20a2 2 0 0 0 4 0",
    down: "M12 5v14M6 13l6 6 6-6",
    install: "M12 3v12M7 10l5 5 5-5M5 21h14",
    plus: "M12 5v14M5 12h14",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4"
  };

  const S = {
    sb: null, me: null, profile: null, entered: false,
    profiles: new Map(), chats: [], packs: [], online: new Set(),
    folder: "all", query: "", remote: { people: [], messages: [] }, remoteDone: false,
    open: null, messages: [], loadedChat: null, editing: null, replyTo: null, jumpMsg: null,
    typingCh: null, presCh: null, dbCh: null, installEvt: null, lastLong: 0, refreshT: null
  };
  const typingMap = new Map();
  let panelMode = null;
  let panelPack = null;
  let sending = false;
  let authMode = "login";
  const isTouch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  const $ = function (id) { return document.getElementById(id); };
  function clear(el) { el.replaceChildren(); }
  function rnd() { return Math.random().toString(36).slice(2, 8); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        const v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = String(v);
        else if (k === "style") Object.assign(el.style, v);
        else if (k === "dataset") Object.assign(el.dataset, v);
        else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : String(v));
      });
    }
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(x instanceof Node ? x : document.createTextNode(String(x))); });
      else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  function svg(d, cls) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    if (cls) s.setAttribute("class", cls);
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    s.appendChild(p);
    return s;
  }

  function toast(msg) {
    const t = h("div", { class: "toast", text: msg });
    $("toasts").appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  function errMsg(e) {
    const m = String((e && (e.message || e.error_description)) || e || "");
    if (/Invalid login/i.test(m)) return "Неверный username или пароль";
    if (/already registered|already been registered|User already|занят/i.test(m)) return "Такой username уже занят";
    if (/edit window/i.test(m)) return "Редактировать можно только 48 часов";
    if (/row-level security|not allowed|permission/i.test(m)) return "Нет доступа";
    if (/duplicate key/i.test(m)) return "Уже добавлено";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Нет связи с сервером";
    if (/at least/i.test(m)) return "Пароль слишком короткий";
    if (/Database error saving new user/i.test(m)) return "Не получилось создать аккаунт, попробуй другой username";
    return m || "Что-то пошло не так";
  }

  function hash(s) {
    let x = 0;
    const str = String(s || "");
    for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0;
    return x;
  }
  function gradFor(seed) { return GRADS[hash(seed) % GRADS.length]; }
  function nameColor(seed) { return NAME_COLORS[hash(seed) % NAME_COLORS.length]; }
  function isVideo(url) { return /\.(mp4|webm)(\?|$)/i.test(url || ""); }
  function initial(name) { return (String(name || "?").trim().charAt(0) || "?").toUpperCase(); }
  function pName(p) { return p ? (p.display_name || "@" + p.username) : "Неизвестно"; }
  function clean(q) { return String(q || "").replace(/[^\p{L}\p{N}_ ]/gu, "").trim(); }

  function hm(iso) { const d = new Date(iso); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
  function dayKey(iso) { const d = new Date(iso); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }
  function dayLabel(iso) {
    const d = new Date(iso);
    const now = new Date();
    const yest = new Date(Date.now() - 86400000);
    if (dayKey(iso) === dayKey(now.toISOString())) return "Сегодня";
    if (dayKey(iso) === dayKey(yest.toISOString())) return "Вчера";
    return d.getDate() + " " + MONTHS[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? " " + d.getFullYear() : "");
  }
  function shortTime(iso) {
    if (dayKey(iso) === dayKey(new Date().toISOString())) return hm(iso);
    const d = new Date(iso);
    return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1);
  }
  function agoText(iso) {
    if (!iso) return "давно";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 90) return "только что";
    if (s < 3600) return Math.round(s / 60) + " мин назад";
    if (s < 86400) return Math.round(s / 3600) + " ч назад";
    const d = new Date(iso);
    return d.getDate() + " " + MONTHS[d.getMonth()];
  }

  function avEl(o) {
    const el = h("div", { class: "av" + (o.size ? " " + o.size : ""), style: { background: gradFor(o.seed || o.name) } });
    if (o.url) {
      el.appendChild(isVideo(o.url)
        ? h("video", { src: o.url, autoplay: true, muted: true, loop: true, playsinline: true, preload: "metadata" })
        : h("img", { src: o.url, alt: "", loading: "lazy" }));
    } else {
      el.appendChild(document.createTextNode(initial(o.name)));
    }
    if (o.online !== undefined) el.appendChild(h("span", { class: "dot" + (o.online ? "" : " off") }));
    return el;
  }
  function thumb(url) {
    return isVideo(url)
      ? h("video", { src: url, muted: true, autoplay: true, loop: true, playsinline: true })
      : h("img", { src: url, alt: "", loading: "lazy" });
  }
  function kv(label, value) {
    return h("div", { class: "kv" }, h("small", { text: label }), h("span", { text: value }));
  }
  function emptyNote(text) { return h("div", { class: "empty-note", text: text }); }
  function sectTitle(text) { return h("div", { class: "sect", text: text }); }
  function btnPrimary(text, fn) { return h("button", { class: "btn-primary", type: "button", text: text, onclick: fn }); }
  function btnGhost(text, fn) { return h("button", { class: "btn-ghost", type: "button", text: text, onclick: fn }); }
  function btnDanger(text, fn) { return h("button", { class: "btn-danger", type: "button", text: text, onclick: fn }); }
  function rowBtn(left, title, sub, fn, danger) {
    return h("button", { class: "row-btn" + (danger ? " danger" : ""), type: "button", onclick: fn },
      left,
      h("span", { class: "who" }, h("span", { text: title }), sub ? h("small", { text: sub }) : null));
  }
  function icoBox(d) {
    return h("span", { style: { width: "40px", height: "40px", borderRadius: "14px", background: "rgba(167,139,250,.14)", display: "grid", placeItems: "center", flex: "none", color: "#d8ccff" } }, svg(d, "ico-s"));
  }

  const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  S.sb = sb;

  function curChat() { return S.chats.find(function (c) { return c.id === S.open; }) || null; }
  function chatTitle(c) {
    if (c.kind === "direct") { const p = profileOf(c); return p ? pName(p) : "Личный чат"; }
    return c.title;
  }
  function profileOf(c) { return c.kind === "direct" && c.otherId ? S.profiles.get(c.otherId) || null : null; }
  function chatAvProps(c) {
    const p = profileOf(c);
    if (p) return { seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, online: S.online.has(p.id) };
    return { seed: c.id, name: c.title, url: c.avatar_url, animated: c.avatar_animated };
  }
  function kindLabel(c) { return c.kind === "direct" ? "Личный чат" : c.kind === "group" ? "Группа" : "Канал"; }
  function sortedChats() {
    return S.chats.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const x = a.lastAt || "", y = b.lastAt || "";
      return x < y ? 1 : x > y ? -1 : 0;
    });
  }
  function matchFolder(c) {
    if (S.folder === "all") return true;
    if (S.folder === "direct") return c.kind === "direct";
    if (S.folder === "group") return c.kind === "group";
    if (S.folder === "channel") return c.kind === "channel";
    if (S.folder === "unread") return c.unread > 0;
    return true;
  }
  function canPost(c) { return c.kind !== "channel" || c.role === "owner" || c.role === "admin"; }

  function showAuth() {
    hideBoot();
    $("auth").classList.remove("hidden");
  }
  function hideBoot() {
    const b = $("boot");
    b.style.opacity = "0";
    setTimeout(function () { b.classList.add("hidden"); }, 400);
  }

  function setAuthMode(m) {
    authMode = m;
    document.querySelectorAll("#auth-seg .seg-btn").forEach(function (b) { b.classList.toggle("on", b.dataset.mode === m); });
    $("auth-seg").classList.toggle("right", m === "register");
    document.querySelectorAll(".reg-only").forEach(function (el) { el.classList.toggle("hidden", m !== "register"); });
    $("a-submit").textContent = m === "login" ? "Войти" : "Создать аккаунт";
    $("a-pass").setAttribute("autocomplete", m === "login" ? "current-password" : "new-password");
  }

  async function onAuthSubmit(e) {
    e.preventDefault();
    const btn = $("a-submit");
    const u = $("a-user").value.trim().toLowerCase();
    const p = $("a-pass").value;
    if (!/^[a-z0-9_]{3,32}$/.test(u)) return toast("Username: 3–32 символа, латиница, цифры и _");
    if (p.length < 6) return toast("Пароль — минимум 6 символов");
    btn.disabled = true;
    try {
      const email = u + "@" + DOMAIN;
      if (authMode === "login") {
        const r = await sb.auth.signInWithPassword({ email: email, password: p });
        if (r.error) throw r.error;
        await enter(r.data.user);
      } else {
        const dn = $("a-name").value.trim() || u;
        const free = await sb.rpc("username_available", { u: u });
        if (free.error) throw free.error;
        if (free.data !== true) throw new Error("занят");
        const r = await sb.auth.signUp({ email: email, password: p, options: { data: { username: u, display_name: dn } } });
        if (r.error) throw r.error;
        if (r.data.session) await enter(r.data.user);
        else {
          const r2 = await sb.auth.signInWithPassword({ email: email, password: p });
          if (r2.error) throw r2.error;
          await enter(r2.data.user);
        }
      }
    } catch (err) {
      toast(errMsg(err));
    } finally {
      btn.disabled = false;
    }
  }

  async function enter(user) {
    if (S.entered) return;
    S.entered = true;
    S.me = user;
    const r = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (r.error || !r.data) {
      toast("Профиль не найден");
      await sb.auth.signOut();
      location.reload();
      return;
    }
    S.profile = r.data;
    S.profiles.set(r.data.id, r.data);
    $("auth").classList.add("hidden");
    $("app").classList.remove("hidden");
    hideBoot();
    renderMeBtn();
    await Promise.all([loadChats(), loadPacks()]);
    connectRealtime();
    heartbeat();
    setInterval(heartbeat, 120000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        markReadSoon();
        scheduleChats();
        heartbeat();
      }
    });
  }

  function heartbeat() {
    if (!S.me || document.hidden) return;
    sb.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", S.me.id).then(function () {}, function () {});
  }

  function renderMeBtn() {
    const b = $("me-btn");
    clear(b);
    b.appendChild(avEl({ seed: S.me.id, name: pName(S.profile), url: S.profile.avatar_url, animated: S.profile.avatar_animated }));
  }

  function scheduleChats() {
    clearTimeout(S.refreshT);
    S.refreshT = setTimeout(loadChats, 350);
  }

  async function loadChats() {
    const me = S.me.id;
    const mem = await sb.from("chat_members").select("chat_id, role, pinned, muted, last_read_at, chats(id, kind, title, description, avatar_url, avatar_animated, created_by)").eq("user_id", me);
    if (mem.error) return toast(errMsg(mem.error));
    const mine = (mem.data || []).filter(function (r) { return r.chats; });
    const ids = mine.map(function (r) { return r.chat_id; });
    let all = [];
    if (ids.length) {
      const r = await sb.from("chat_members").select("chat_id, user_id, role, last_read_at, profiles(id, username, display_name, bio, status_emoji, status_text, avatar_url, avatar_animated, last_seen)").in("chat_id", ids);
      if (r.error) return toast(errMsg(r.error));
      all = r.data || [];
    }
    const st = await sb.rpc("my_chat_stats");
    const stats = new Map(((st.data) || []).map(function (s) { return [s.chat_id, s]; }));
    all.forEach(function (m) { if (m.profiles) S.profiles.set(m.profiles.id, Object.assign({}, S.profiles.get(m.profiles.id) || {}, m.profiles)); });
    S.chats = mine.map(function (r) {
      const c = r.chats;
      const members = all.filter(function (x) { return x.chat_id === c.id; }).map(function (x) {
        return { user_id: x.user_id, role: x.role, last_read_at: x.last_read_at };
      });
      const s = stats.get(c.id) || {};
      let otherId = null;
      if (c.kind === "direct") {
        const o = all.find(function (x) { return x.chat_id === c.id && x.user_id !== me; });
        otherId = o ? o.user_id : null;
      }
      return {
        id: c.id, kind: c.kind, title: c.title || "", description: c.description || "",
        avatar_url: c.avatar_url, avatar_animated: c.avatar_animated, created_by: c.created_by,
        role: r.role, pinned: r.pinned, muted: r.muted, members: members, otherId: otherId,
        unread: Number(s.unread || 0), lastAt: s.last_at || null,
        last: s.last_kind ? { kind: s.last_kind, body: s.last_body || "", sender: s.last_sender, deleted: !!s.last_deleted } : null
      };
    });
    const need = [];
    S.chats.forEach(function (c) { if (c.last && c.last.sender) need.push(c.last.sender); });
    await ensureProfiles(need);
    if (S.open && !S.chats.some(function (c) { return c.id === S.open; })) closeChat();
    renderSidebar();
    if (S.open) {
      renderHeader();
      renderBars();
      renderComposer();
      renderTimeline(false);
    }
  }

  async function loadPacks() {
    const r = await sb.from("user_sticker_packs").select("pack_id, sticker_packs(id, title, short_name, owner_id, stickers(id, url, animated, emoji, created_at))").eq("user_id", S.me.id);
    if (r.error) return;
    S.packs = (r.data || []).filter(function (x) { return x.sticker_packs; }).map(function (x) {
      const p = x.sticker_packs;
      p.stickers = (p.stickers || []).slice().sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
      return p;
    });
  }

  async function ensureProfiles(ids) {
    const need = Array.from(new Set(ids.filter(function (id) { return id && !S.profiles.has(id); })));
    if (!need.length) return;
    const r = await sb.from("profiles").select("*").in("id", need);
    (r.data || []).forEach(function (p) { S.profiles.set(p.id, p); });
  }

  function renderTabs() {
    const box = $("tabs");
    clear(box);
    const unread = S.chats.filter(function (c) { return c.unread > 0; }).length;
    FOLDERS.forEach(function (f) {
      const label = f[0] === "unread" && unread ? f[1] + " · " + unread : f[1];
      box.appendChild(h("button", {
        class: "tab" + (S.folder === f[0] ? " on" : ""), type: "button", text: label,
        onclick: function () { S.folder = f[0]; renderSidebar(); }
      }));
    });
  }

  function previewLine(c) {
    if (!c.last) return "Нет сообщений";
    const l = c.last;
    let body;
    if (l.deleted) body = "Сообщение удалено";
    else if (l.kind === "text") body = l.body;
    else if (l.kind === "image") body = l.body || "Фото";
    else if (l.kind === "video") body = l.body || "Видео";
    else if (l.kind === "sticker") body = "Стикер";
    else body = l.body;
    let who = "";
    if (l.sender === S.me.id) who = "Вы: ";
    else if (c.kind !== "direct") who = pName(S.profiles.get(l.sender)) + ": ";
    return who + body.replace(/\s+/g, " ");
  }

  function chatItem(c) {
    const typing = typingIn(c.id);
    const pv = h("span", { class: "pv" + (typing ? " typing" : ""), text: typing ? "печатает…" : previewLine(c) });
    const row1 = h("div", { class: "row1" },
      h("span", { class: "nm", text: chatTitle(c) }),
      c.pinned ? svg(ICON.pin, "mico pin") : null,
      h("span", { class: "tm", text: c.lastAt ? shortTime(c.lastAt) : "" }));
    const row2 = h("div", { class: "row2" },
      pv,
      c.muted ? svg(ICON.mute, "mico") : null,
      c.unread > 0 ? h("span", { class: "badge" + (c.muted ? " mute" : ""), text: c.unread > 99 ? "99+" : String(c.unread) }) : null);
    const it = h("div", {
      class: "item" + (c.id === S.open ? " on" : "") + (c.pinned ? " pin" : ""),
      dataset: { id: c.id },
      onclick: function () { if (Date.now() - S.lastLong < 700) return; openChat(c.id); },
      oncontextmenu: function (e) { e.preventDefault(); chatMenu(c, e.clientX, e.clientY); }
    }, avEl(Object.assign({ size: "" }, chatAvProps(c))), h("div", { class: "item-main" }, row1, row2));
    bindLongPress(it, function (x, y) { chatMenu(c, x, y); });
    return it;
  }

  function personRow(p) {
    return h("div", {
      class: "item", onclick: function () { openDirect(p.id); },
      oncontextmenu: function (e) { e.preventDefault(); profileSheet(p.id); }
    },
      avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, online: S.online.has(p.id) }),
      h("div", { class: "item-main" },
        h("div", { class: "row1" }, h("span", { class: "nm", text: pName(p) })),
        h("div", { class: "row2" }, h("span", { class: "pv", text: "@" + p.username }))));
  }

  function msgHit(m) {
    const c = S.chats.find(function (x) { return x.id === m.chat_id; });
    if (!c) return null;
    return h("div", {
      class: "item hit", onclick: function () { openChat(c.id, m); }
    },
      avEl(chatAvProps(c)),
      h("div", { class: "item-main" },
        h("div", { class: "row1" }, h("span", { class: "nm", text: chatTitle(c) }), h("span", { class: "tm", text: shortTime(m.created_at) })),
        h("div", { class: "row2" }, h("span", { class: "pv", text: (m.sender_id === S.me.id ? "Вы: " : "") + m.body }))));
  }

  function renderSidebar() {
    renderTabs();
    const list = $("list");
    clear(list);
    const q = clean(S.query).toLowerCase();
    const items = sortedChats().filter(function (c) {
      return matchFolder(c) && (!q || chatTitle(c).toLowerCase().indexOf(q) >= 0);
    });
    if (!q) {
      if (!items.length) {
        list.appendChild(emptyNote(S.chats.length ? "В этой папке пусто" : "Чатов пока нет. Нажми «+» и найди человека по username"));
      }
      items.forEach(function (c) { list.appendChild(chatItem(c)); });
      return;
    }
    if (items.length) {
      list.appendChild(sectTitle("Чаты"));
      items.forEach(function (c) { list.appendChild(chatItem(c)); });
    }
    if (S.remote.people.length) {
      list.appendChild(sectTitle("Люди"));
      S.remote.people.forEach(function (p) { list.appendChild(personRow(p)); });
    }
    if (S.remote.messages.length) {
      list.appendChild(sectTitle("Сообщения"));
      S.remote.messages.forEach(function (m) {
        const node = msgHit(m);
        if (node) list.appendChild(node);
      });
    }
    if (!items.length && !S.remote.people.length && !S.remote.messages.length) {
      list.appendChild(emptyNote(S.remoteDone ? "Ничего не нашлось" : "Ищем…"));
    }
  }

  let remoteTimer = null;
  function onSearchInput() {
    S.query = $("search").value;
    clearTimeout(remoteTimer);
    const q = clean(S.query);
    if (q.length < 2) {
      S.remote = { people: [], messages: [] };
      S.remoteDone = false;
      renderSidebar();
      return;
    }
    S.remoteDone = false;
    renderSidebar();
    remoteTimer = setTimeout(function () { runRemote(q); }, 260);
  }
  async function runRemote(q) {
    const pat = "%" + q + "%";
    const pr = await sb.from("profiles").select("*").or("username.ilike." + pat + ",display_name.ilike." + pat).neq("id", S.me.id).limit(12);
    const mr = await sb.from("messages").select("id, chat_id, body, created_at, sender_id").ilike("body", pat).is("deleted_at", null).order("created_at", { ascending: false }).limit(20);
    if (clean($("search").value) !== q) return;
    (pr.data || []).forEach(function (p) { S.profiles.set(p.id, Object.assign({}, S.profiles.get(p.id) || {}, p)); });
    S.remote = { people: pr.data || [], messages: mr.data || [] };
    S.remoteDone = true;
    renderSidebar();
  }

  function typingNames(cid) {
    const out = [];
    const now = Date.now();
    typingMap.forEach(function (v, k) {
      if (k.indexOf(cid + "|") === 0 && now - v.t < 3000) out.push(v.n);
    });
    if (!out.length) return "";
    return out.length === 1 ? out[0] + " печатает…" : "печатают: " + out.length;
  }
  function typingIn(cid) { return !!typingNames(cid); }

  function subtitleFor(c) {
    if (c.kind === "direct") {
      const p = profileOf(c);
      if (!p) return "";
      if (S.online.has(p.id)) return "в сети";
      return "был(а) " + agoText(p.last_seen);
    }
    if (c.kind === "group") return c.members.length + " участников";
    return "канал · " + c.members.length + " подписчиков";
  }

  function renderHeader() {
    const c = curChat();
    if (!c) return;
    $("chat-title").textContent = chatTitle(c);
    const av = $("chat-av");
    clear(av);
    av.appendChild(avEl(Object.assign({ size: "sm" }, chatAvProps(c))));
    const sub = $("chat-sub");
    const typing = typingNames(c.id);
    sub.textContent = typing || subtitleFor(c);
    sub.classList.toggle("typing", !!typing);
  }

  async function openChat(id, jumpMsg) {
    const c = S.chats.find(function (x) { return x.id === id; });
    if (!c) return;
    if (S.open !== id) {
      S.messages = [];
      S.loadedChat = null;
      S.editing = null;
      S.replyTo = null;
      closePanel();
    }
    S.open = id;
    S.jumpMsg = jumpMsg || null;
    hideCtx();
    $("app").classList.add("chat-open");
    $("welcome").classList.add("hidden");
    $("chat").classList.remove("hidden");
    $("chat-search").classList.add("hidden");
    $("chat-search-input").value = "";
    renderHeader();
    renderBars();
    renderComposer();
    renderTimeline(true);
    renderSidebar();
    const r = await sb.from("messages").select("*, reactions(message_id, user_id, emoji)").eq("chat_id", id).order("created_at", { ascending: false }).limit(80);
    if (S.open !== id) return;
    if (r.error) return toast(errMsg(r.error));
    S.messages = (r.data || []).reverse();
    S.loadedChat = id;
    await ensureProfiles(S.messages.map(function (m) { return m.sender_id; }));
    renderTimeline(true);
    if (S.jumpMsg) await jumpToMessage(S.jumpMsg);
    S.jumpMsg = null;
    markRead();
  }

  function closeChat() {
    S.open = null;
    S.messages = [];
    S.loadedChat = null;
    S.editing = null;
    S.replyTo = null;
    closePanel();
    hideCtx();
    $("app").classList.remove("chat-open");
    $("chat").classList.add("hidden");
    $("welcome").classList.remove("hidden");
    renderSidebar();
  }

  function nearBottom(el) { return el.scrollHeight - el.scrollTop - el.clientHeight < 140; }
  function updateDown() {
    $("down-btn").classList.toggle("hidden", nearBottom($("timeline")));
  }

  function readByAll(m, c) {
    const others = c.members.filter(function (x) { return x.user_id !== S.me.id; });
    if (!others.length) return false;
    const t = new Date(m.created_at).getTime();
    return others.every(function (x) { return x.last_read_at && new Date(x.last_read_at).getTime() >= t; });
  }

  function quoteEl(id) {
    const r = S.messages.find(function (x) { return x.id === id; });
    let who = "Сообщение";
    let text = "Исходное сообщение";
    if (r) {
      who = r.sender_id === S.me.id ? "Вы" : pName(S.profiles.get(r.sender_id));
      if (r.deleted_at) text = "Сообщение удалено";
      else text = r.body || (r.kind === "sticker" ? "Стикер" : r.kind === "video" ? "Видео" : "Фото");
    }
    return h("div", { class: "quote", onclick: function (e) { e.stopPropagation(); jumpTo(id); } },
      h("b", { text: who }), h("span", { text: text }));
  }

  function reactsEl(m) {
    const list = m.reactions || [];
    if (!list.length) return null;
    const groups = new Map();
    list.forEach(function (r) {
      const g = groups.get(r.emoji) || { n: 0, mine: false };
      g.n++;
      if (r.user_id === S.me.id) g.mine = true;
      groups.set(r.emoji, g);
    });
    const box = h("div", { class: "reacts" });
    groups.forEach(function (g, emoji) {
      box.appendChild(h("button", {
        class: "react" + (g.mine ? " mine" : ""), type: "button",
        text: g.n > 1 ? emoji + " " + g.n : emoji,
        onclick: function (e) { e.stopPropagation(); toggleReact(m, emoji); }
      }));
    });
    return box;
  }

  function msgRow(m, prev, c) {
    const me = m.sender_id === S.me.id;
    const deleted = !!m.deleted_at;
    const bare = m.kind === "sticker" && !deleted;
    const row = h("div", { class: "row " + (me ? "me" : "them") + (m._fresh ? " enter" : ""), dataset: { id: m.id } });
    const b = h("div", { class: "bubble" + (bare ? " bare" : "") });
    if (c.kind === "group" && !me && !deleted && (!prev || prev.sender_id !== m.sender_id)) {
      b.appendChild(h("div", { class: "sender", style: { color: nameColor(m.sender_id) }, text: pName(S.profiles.get(m.sender_id)) }));
    }
    if (m.forwarded_from && !deleted) b.appendChild(h("div", { class: "fwd", text: "Переслано от " + m.forwarded_from }));
    if (m.reply_to && !deleted) b.appendChild(quoteEl(m.reply_to));
    if (deleted) {
      b.appendChild(h("div", { class: "gone", text: "Сообщение удалено" }));
    } else {
      if (m.kind === "image" && m.media_url) b.appendChild(h("img", { class: "media", src: m.media_url, alt: "фото", loading: "lazy", onclick: function () { lightbox(m.media_url); } }));
      if (m.kind === "video" && m.media_url) b.appendChild(h("video", { class: "media", src: m.media_url, controls: true, playsinline: true, preload: "metadata" }));
      if (m.kind === "sticker" && m.media_url) {
        b.appendChild(isVideo(m.media_url)
          ? h("video", { class: "sticker-img", src: m.media_url, autoplay: true, loop: true, muted: true, playsinline: true })
          : h("img", { class: "sticker-img", src: m.media_url, alt: "стикер", loading: "lazy" }));
      }
      if (m.body) b.appendChild(h("div", { class: "text", text: m.body }));
    }
    const readAll = me && !deleted && readByAll(m, c);
    const meta = h("div", { class: "meta" },
      m.edited_at && !deleted ? h("span", { text: "изменено" }) : null,
      h("span", { text: hm(m.created_at) }),
      me && !deleted ? h("span", { class: "tick" + (readAll ? " read" : ""), text: c.kind === "channel" ? "✓" : (readAll ? "✓✓" : "✓") }) : null);
    b.appendChild(meta);
    const rx = deleted ? null : reactsEl(m);
    if (rx) b.appendChild(rx);
    b.addEventListener("contextmenu", function (e) { e.preventDefault(); openMsgMenu(m, c, e.clientX, e.clientY); });
    bindLongPress(b, function (x, y) { openMsgMenu(m, c, x, y); });
    row.appendChild(b);
    return row;
  }

  function renderTimeline(scrollBottom) {
    const c = curChat();
    if (!c) return;
    const tl = $("timeline");
    const wasBottom = nearBottom(tl);
    const prevTop = tl.scrollTop;
    const frag = document.createDocumentFragment();
    if (!S.messages.length) {
      frag.appendChild(emptyNote(S.loadedChat === c.id ? "Сообщений пока нет. Напиши первым :D" : ""));
    }
    let lastDay = "";
    let prev = null;
    S.messages.forEach(function (m) {
      const dk = dayKey(m.created_at);
      if (dk !== lastDay) {
        lastDay = dk;
        frag.appendChild(h("div", { class: "day", text: dayLabel(m.created_at) }));
        prev = null;
      }
      frag.appendChild(msgRow(m, prev, c));
      prev = m;
    });
    tl.replaceChildren(frag);
    S.messages.forEach(function (m) { m._fresh = false; });
    if (scrollBottom || wasBottom) tl.scrollTop = tl.scrollHeight;
    else tl.scrollTop = prevTop;
    updateDown();
  }

  function jumpTo(id) {
    const el = $("timeline").querySelector('[data-id="' + id + '"]');
    if (!el) return toast("Сообщение не найдено");
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const b = el.querySelector(".bubble");
    if (b) {
      b.classList.remove("flash");
      void b.offsetWidth;
      b.classList.add("flash");
    }
  }

  async function jumpToMessage(m) {
    if (!S.messages.some(function (x) { return x.id === m.id; })) {
      const r = await sb.from("messages").select("*, reactions(message_id, user_id, emoji)").eq("chat_id", m.chat_id).lte("created_at", m.created_at).order("created_at", { ascending: false }).limit(60);
      const extra = (r.data || []).reverse();
      const ids = new Set(S.messages.map(function (x) { return x.id; }));
      const merged = extra.filter(function (x) { return !ids.has(x.id); }).concat(S.messages);
      merged.sort(function (a, b) { return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0; });
      S.messages = merged;
      await ensureProfiles(extra.map(function (x) { return x.sender_id; }));
      renderTimeline(false);
    }
    jumpTo(m.id);
  }

  function renderBars() {
    const box = $("bars");
    clear(box);
    const c = curChat();
    if (!c) return;
    if (S.replyTo) {
      const m = S.messages.find(function (x) { return x.id === S.replyTo; });
      if (m) box.appendChild(bar("Ответ · " + (m.sender_id === S.me.id ? "Вы" : pName(S.profiles.get(m.sender_id))), previewBody(m), function () { S.replyTo = null; renderBars(); }));
      else S.replyTo = null;
    }
    if (S.editing) {
      box.appendChild(bar("Редактирование", S.editing.body, function () {
        S.editing = null;
        $("input").value = "";
        autosize();
        renderBars();
      }));
    }
  }
  function previewBody(m) {
    if (m.deleted_at) return "Сообщение удалено";
    return m.body || (m.kind === "sticker" ? "Стикер" : m.kind === "video" ? "Видео" : "Фото");
  }
  function bar(title, text, onClose) {
    return h("div", { class: "bar" },
      h("div", { class: "bar-main" }, h("b", { text: title }), h("span", { text: text || "Фото" })),
      h("button", { class: "icon-btn small", type: "button", "aria-label": "Отмена", onclick: onClose }, svg(ICON.close)));
  }

  function renderComposer() {
    const c = curChat();
    if (!c) return;
    const ok = canPost(c);
    $("composer").classList.toggle("hidden", !ok);
    $("readonly").classList.toggle("hidden", ok);
  }

  function autosize() {
    const ta = $("input");
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  }

  let lastTypingSent = 0;
  function throttleTyping() {
    const c = curChat();
    if (!c || !S.typingCh) return;
    const now = Date.now();
    if (now - lastTypingSent < 2500) return;
    lastTypingSent = now;
    S.typingCh.send({ type: "broadcast", event: "typing", payload: { c: c.id, u: S.me.id, n: S.profile.display_name || S.profile.username } });
  }
  function onTyping(p) {
    if (!p || p.u === S.me.id) return;
    typingMap.set(p.c + "|" + p.u, { n: p.n, t: Date.now() });
    renderSidebar();
    renderHeader();
    setTimeout(function () { renderSidebar(); renderHeader(); }, 3100);
  }

  async function submitText() {
    if (sending) return;
    const c = curChat();
    if (!c || !canPost(c)) return;
    const ta = $("input");
    const text = ta.value.trim();
    if (!text) return;
    if (text.length > 4096) return toast("Слишком длинное сообщение");
    sending = true;
    $("send-btn").disabled = true;
    try {
      if (S.editing) await saveEdit(S.editing, text);
      else await sendRow({ kind: "text", body: text });
      ta.value = "";
      autosize();
    } catch (err) {
      toast(errMsg(err));
    } finally {
      sending = false;
      $("send-btn").disabled = false;
    }
  }

  async function sendRow(fields) {
    const c = curChat();
    if (!c) return;
    const row = Object.assign({ chat_id: c.id, sender_id: S.me.id, kind: "text", body: "" }, fields);
    if (S.replyTo) row.reply_to = S.replyTo;
    const r = await sb.from("messages").insert(row).select("*").single();
    if (r.error) throw r.error;
    S.replyTo = null;
    renderBars();
    addMessage(r.data);
    scheduleChats();
  }

  function addMessage(m) {
    if (S.open !== m.chat_id || S.loadedChat !== m.chat_id) return;
    if (S.messages.some(function (x) { return x.id === m.id; })) return;
    m.reactions = m.reactions || [];
    m._fresh = true;
    S.messages.push(m);
    renderTimeline(m.sender_id === S.me.id);
    if (m.sender_id !== S.me.id) markReadSoon();
  }

  async function saveEdit(m, text) {
    const r = await sb.from("messages").update({ body: text }).eq("id", m.id).select("*").single();
    if (r.error) throw r.error;
    S.editing = null;
    applyMessageUpdate(r.data);
    renderBars();
  }

  function applyMessageUpdate(row) {
    const m = S.messages.find(function (x) { return x.id === row.id; });
    if (!m) return;
    const rx = m.reactions;
    const fresh = m._fresh;
    Object.assign(m, row);
    m.reactions = rx;
    m._fresh = fresh;
    renderTimeline(false);
  }

  async function deleteMessage(m) {
    const r = await sb.from("messages").update({ deleted_at: new Date().toISOString(), body: "" }).eq("id", m.id).select("*").single();
    if (r.error) throw r.error;
    applyMessageUpdate(r.data);
    scheduleChats();
  }

  async function toggleReact(m, emoji) {
    m.reactions = m.reactions || [];
    const mine = m.reactions.find(function (r) { return r.user_id === S.me.id && r.emoji === emoji; });
    if (mine) {
      const r = await sb.from("reactions").delete().eq("message_id", m.id).eq("user_id", S.me.id).eq("emoji", emoji);
      if (r.error) return toast(errMsg(r.error));
      m.reactions = m.reactions.filter(function (x) { return x !== mine; });
    } else {
      const r = await sb.from("reactions").insert({ message_id: m.id, user_id: S.me.id, emoji: emoji });
      if (r.error) return toast(errMsg(r.error));
      m.reactions.push({ message_id: m.id, user_id: S.me.id, emoji: emoji });
    }
    renderTimeline(false);
  }

  function startEdit(m) {
    S.editing = m;
    S.replyTo = null;
    $("input").value = m.body || "";
    autosize();
    renderBars();
    $("input").focus();
  }

  let readTimer = null;
  function markReadSoon() {
    clearTimeout(readTimer);
    readTimer = setTimeout(markRead, 400);
  }
  async function markRead() {
    const c = curChat();
    if (!c || document.hidden) return;
    const iso = new Date().toISOString();
    const r = await sb.from("chat_members").update({ last_read_at: iso }).eq("chat_id", c.id).eq("user_id", S.me.id);
    if (r.error) return;
    c.unread = 0;
    const me = c.members.find(function (x) { return x.user_id === S.me.id; });
    if (me) me.last_read_at = iso;
    renderSidebar();
  }

  function bindLongPress(el, fn) {
    let t = null;
    let sx = 0, sy = 0;
    el.addEventListener("touchstart", function (e) {
      const p = e.touches[0];
      sx = p.clientX;
      sy = p.clientY;
      clearTimeout(t);
      t = setTimeout(function () {
        t = null;
        S.lastLong = Date.now();
        if (navigator.vibrate) navigator.vibrate(12);
        fn(sx, sy);
      }, 480);
    }, { passive: true });
    el.addEventListener("touchmove", function (e) {
      if (!t) return;
      const p = e.touches[0];
      if (Math.abs(p.clientX - sx) > 8 || Math.abs(p.clientY - sy) > 8) {
        clearTimeout(t);
        t = null;
      }
    }, { passive: true });
    const end = function () { if (t) { clearTimeout(t); t = null; } };
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
  }

  function showCtx(x, y, nodes) {
    const box = $("ctx");
    box.replaceChildren.apply(box, nodes);
    box.classList.remove("hidden");
    const r = box.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8));
    box.style.left = left + "px";
    box.style.top = top + "px";
    setTimeout(function () { document.addEventListener("pointerdown", ctxOutside, true); }, 0);
  }
  function hideCtx() {
    $("ctx").classList.add("hidden");
    document.removeEventListener("pointerdown", ctxOutside, true);
  }
  function ctxOutside(e) {
    if (!$("ctx").contains(e.target)) hideCtx();
  }
  function mi(label, d, fn, danger) {
    return h("button", { class: "mi" + (danger ? " danger" : ""), type: "button", onclick: function () { hideCtx(); fn(); } },
      d ? svg(d) : null, h("span", { text: label }));
  }

  function openMsgMenu(m, c, x, y) {
    const items = [];
    const deleted = !!m.deleted_at;
    if (!deleted) {
      const bar = h("div", { class: "ctx-react" });
      REACTS.forEach(function (e) {
        bar.appendChild(h("button", { type: "button", text: e, onclick: function () { hideCtx(); toggleReact(m, e); } }));
      });
      items.push(bar);
      if (canPost(c)) items.push(mi("Ответить", ICON.reply, function () { S.replyTo = m.id; S.editing = null; renderBars(); $("input").focus(); }));
      if (m.body) items.push(mi("Копировать", ICON.copy, function () { copyText(m.body); }));
      items.push(mi("Переслать", ICON.fwd, function () { forwardSheet(m); }));
      const mine = m.sender_id === S.me.id;
      if (mine && m.kind === "text" && Date.now() - new Date(m.created_at).getTime() < EDIT_MS) {
        items.push(mi("Изменить", ICON.edit, function () { startEdit(m); }));
      }
      if (mine) {
        items.push(mi("Удалить", ICON.trash, function () {
          confirmDlg("Удалить сообщение?", "Оно пропадёт у всех участников чата.", "Удалить", function () { return deleteMessage(m); });
        }, true));
      }
    }
    showCtx(x, y, items);
  }

  function chatMenu(c, x, y) {
    const items = [
      mi(c.pinned ? "Открепить" : "Закрепить", ICON.pin, function () { togglePin(c); }),
      mi(c.muted ? "Включить звук" : "Выключить звук", c.muted ? ICON.unmute : ICON.mute, function () { toggleMute(c); }),
      mi("Информация", ICON.info, function () { chatInfo(c); })
    ];
    if (c.kind === "direct") {
      items.push(mi("Скрыть чат у меня", ICON.trash, function () {
        confirmDlg("Скрыть чат?", "Чат пропадёт из твоего списка. Его можно открыть снова через поиск.", "Скрыть", function () { return leaveChat(c); });
      }, true));
    } else {
      items.push(mi("Покинуть", ICON.exit, function () {
        confirmDlg("Покинуть?", "Ты выйдешь из «" + c.title + "».", "Покинуть", function () { return leaveChat(c); });
      }, true));
      if (c.role === "owner") {
        items.push(mi(c.kind === "channel" ? "Удалить канал" : "Удалить группу", ICON.trash, function () {
          confirmDlg("Удалить?", "Все сообщения «" + c.title + "» удалятся для всех.", "Удалить", function () { return deleteChat(c); });
        }, true));
      }
    }
    showCtx(x, y, items);
  }

  async function togglePin(c) {
    const v = !c.pinned;
    const r = await sb.from("chat_members").update({ pinned: v }).eq("chat_id", c.id).eq("user_id", S.me.id);
    if (r.error) return toast(errMsg(r.error));
    c.pinned = v;
    renderSidebar();
  }
  async function toggleMute(c) {
    const v = !c.muted;
    const r = await sb.from("chat_members").update({ muted: v }).eq("chat_id", c.id).eq("user_id", S.me.id);
    if (r.error) return toast(errMsg(r.error));
    c.muted = v;
    renderSidebar();
  }
  async function leaveChat(c) {
    const r = await sb.from("chat_members").delete().eq("chat_id", c.id).eq("user_id", S.me.id);
    if (r.error) throw r.error;
    S.chats = S.chats.filter(function (x) { return x.id !== c.id; });
    closeSheet();
    if (S.open === c.id) closeChat();
    renderSidebar();
  }
  async function deleteChat(c) {
    const r = await sb.from("chats").delete().eq("id", c.id);
    if (r.error) throw r.error;
    S.chats = S.chats.filter(function (x) { return x.id !== c.id; });
    closeSheet();
    if (S.open === c.id) closeChat();
    renderSidebar();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Скопировано");
    } catch (e) {
      toast("Не получилось скопировать");
    }
  }

  function forwardSheet(m) {
    const who = m.sender_id === S.me.id ? pName(S.profile) : pName(S.profiles.get(m.sender_id));
    openSheet("Переслать в…", function (b) {
      const targets = sortedChats().filter(canPost);
      if (!targets.length) b.appendChild(emptyNote("Некуда переслать"));
      targets.forEach(function (c) {
        b.appendChild(rowBtn(avEl(Object.assign({ size: "sm" }, chatAvProps(c))), chatTitle(c), kindLabel(c), async function () {
          closeSheet();
          const r = await sb.from("messages").insert({
            chat_id: c.id, sender_id: S.me.id, kind: m.kind, body: m.body || "",
            media_url: m.media_url || null, forwarded_from: who
          }).select("*").single();
          if (r.error) return toast(errMsg(r.error));
          toast("Переслано: " + chatTitle(c));
          if (S.open === c.id) addMessage(r.data);
          scheduleChats();
        }));
      });
    });
  }

  function insertText(s) {
    const input = $("input");
    const start = input.selectionStart == null ? input.value.length : input.selectionStart;
    const end = input.selectionEnd == null ? start : input.selectionEnd;
    input.value = input.value.slice(0, start) + s + input.value.slice(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + s.length;
    autosize();
  }

  function togglePanel(mode) {
    if (panelMode === mode) return closePanel();
    panelMode = mode;
    renderPanel();
  }
  function closePanel() {
    panelMode = null;
    $("panel").classList.add("hidden");
    $("panel").replaceChildren();
  }
  function renderPanel() {
    const p = $("panel");
    clear(p);
    p.classList.remove("hidden");
    if (panelMode === "stickers") {
      if (!S.packs.length) {
        p.appendChild(h("div", { class: "panel-empty" }, "Стикеров пока нет. Создай свой пак и добавь картинки или GIF.", h("br"), btnGhost("Открыть стикеры", stickerSheet)));
        return;
      }
      if (!panelPack || !S.packs.some(function (x) { return x.id === panelPack; })) panelPack = S.packs[0].id;
      const tabs = h("div", { class: "panel-tabs" });
      S.packs.forEach(function (pk) {
        tabs.appendChild(h("button", {
          class: "ptab" + (pk.id === panelPack ? " on" : ""), type: "button",
          onclick: function () { panelPack = pk.id; renderPanel(); }
        }, pk.stickers[0] ? thumb(pk.stickers[0].url) : null, h("span", { text: pk.title })));
      });
      tabs.appendChild(h("button", { class: "ptab", type: "button", "aria-label": "Управлять", onclick: stickerSheet }, svg(ICON.plus)));
      p.appendChild(tabs);
      const pk = S.packs.find(function (x) { return x.id === panelPack; });
      const grid = h("div", { class: "panel-grid" });
      if (pk) {
        pk.stickers.forEach(function (s) {
          grid.appendChild(h("button", {
            class: "stk", type: "button",
            onclick: function () { sendRow({ kind: "sticker", media_url: s.url }).catch(function (e) { toast(errMsg(e)); }); }
          }, thumb(s.url)));
        });
        if (!pk.stickers.length) grid.appendChild(h("div", { class: "panel-empty", text: "В этом паке пока пусто" }));
      }
      p.appendChild(grid);
    } else if (panelMode === "smiles") {
      const grid = h("div", { class: "smile-grid" });
      SMILES.forEach(function (s) {
        grid.appendChild(h("button", { class: "smile", type: "button", text: s, onclick: function () { insertText(s); } }));
      });
      p.appendChild(grid);
    }
  }

  function pickFile(accept, cb) {
    const el = $("picker");
    el.accept = accept;
    el.value = "";
    el.onchange = function () {
      const f = el.files && el.files[0];
      if (f) cb(f);
    };
    el.click();
  }

  function resizeImage(file, maxSide, type, quality) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.naturalWidth * k));
        cv.height = Math.max(1, Math.round(img.naturalHeight * k));
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) {
          URL.revokeObjectURL(url);
          if (b) resolve(b);
          else reject(new Error("Не получилось сжать картинку"));
        }, type, quality);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Не открывается картинка"));
      };
      img.src = url;
    });
  }

  async function prepareAndUpload(file, folder, o) {
    const opt = Object.assign({ maxSide: 512, maxBytes: 6 * MB, quality: 0.9 }, o || {});
    let blob = file;
    let ext = "bin";
    let animated = false;
    if (file.type === "image/gif") { animated = true; ext = "gif"; }
    else if (file.type === "video/mp4") { animated = true; ext = "mp4"; }
    else if (file.type === "video/webm") { animated = true; ext = "webm"; }
    else if (file.type.indexOf("image/") === 0) {
      blob = await resizeImage(file, opt.maxSide, "image/webp", opt.quality);
      ext = blob.type === "image/webp" ? "webp" : blob.type === "image/jpeg" ? "jpg" : "png";
    } else {
      throw new Error("Поддерживаются картинки, GIF, MP4 и WebM");
    }
    if (blob.size > opt.maxBytes) throw new Error("Файл больше " + Math.round(opt.maxBytes / MB) + " МБ");
    const path = S.me.id + "/" + folder + "/" + Date.now().toString(36) + rnd() + "." + ext;
    const up = await sb.storage.from("media").upload(path, blob, { contentType: blob.type || file.type, upsert: false });
    if (up.error) throw up.error;
    return { url: sb.storage.from("media").getPublicUrl(path).data.publicUrl, animated: animated };
  }

  async function handleAttach(f) {
    const c = curChat();
    if (!c || !canPost(c)) return;
    const caption = $("input").value.trim();
    try {
      toast("Загружаю…");
      const isVid = f.type.indexOf("video/") === 0;
      const res = await prepareAndUpload(f, "media", isVid ? { maxBytes: 20 * MB } : { maxSide: 1280, maxBytes: 20 * MB, quality: 0.86 });
      await sendRow({ kind: isVid ? "video" : "image", media_url: res.url, body: caption });
      $("input").value = "";
      autosize();
    } catch (e) {
      toast(errMsg(e));
    }
  }

  function lightbox(url) {
    const lb = $("lightbox");
    clear(lb);
    lb.appendChild(isVideo(url) ? h("video", { src: url, controls: true, autoplay: true }) : h("img", { src: url, alt: "" }));
    lb.classList.remove("hidden");
  }

  function openSheet(title, build) {
    hideCtx();
    $("sheet-title").textContent = title;
    const body = $("sheet-body");
    clear(body);
    build(body);
    $("sheet").classList.remove("hidden");
    if (!isTouch) {
      const first = body.querySelector("input,textarea");
      if (first) setTimeout(function () { first.focus(); }, 80);
    }
  }
  function closeSheet() {
    $("sheet").classList.add("hidden");
    clear($("sheet-body"));
  }

  function confirmDlg(title, text, okText, fn) {
    openSheet(title, function (b) {
      b.appendChild(h("p", { class: "hint", text: text }));
      b.appendChild(h("div", { class: "btn-row" },
        btnGhost("Отмена", closeSheet),
        btnDanger(okText, async function () {
          try {
            await fn();
          } catch (e) {
            toast(errMsg(e));
          }
        })));
    });
  }

  function statusNode(p) {
    const t = ((p.status_emoji || "") + " " + (p.status_text || "")).trim();
    return t ? h("div", { class: "profile-status", text: t }) : null;
  }

  function profileSheet(uid) {
    const p = S.profiles.get(uid);
    if (!p) return;
    openSheet("Профиль", function (b) {
      b.appendChild(h("div", { class: "profile-head" },
        avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, online: S.online.has(p.id), size: "lg" }),
        h("div", { class: "profile-name", text: pName(p) }),
        h("div", { class: "profile-user", text: "@" + p.username }),
        statusNode(p),
        p.bio ? h("div", { class: "profile-bio", text: p.bio }) : null));
      b.appendChild(kv("Статус в сети", S.online.has(p.id) ? "в сети" : "был(а) " + agoText(p.last_seen)));
      if (p.id !== S.me.id) b.appendChild(btnPrimary("Написать", function () { openDirect(p.id); }));
    });
  }

  async function openDirect(uid) {
    closeSheet();
    const r = await sb.rpc("open_direct", { other: uid });
    if (r.error) return toast(errMsg(r.error));
    await loadChats();
    S.folder = S.folder === "unread" || S.folder === "channel" || S.folder === "group" ? "all" : S.folder;
    openChat(r.data);
  }

  function myProfileSheet() {
    const p = S.profile;
    openSheet("Мой профиль", function (b) {
      const av = avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, size: "lg" });
      b.appendChild(h("div", { class: "profile-head" }, av,
        btnGhost("Сменить фото или GIF", function () {
          pickFile("image/*,video/mp4,video/webm", async function (f) {
            try {
              toast("Загружаю…");
              const res = await prepareAndUpload(f, "avatar", { maxSide: 512, maxBytes: 6 * MB, quality: 0.9 });
              const r = await sb.from("profiles").update({ avatar_url: res.url, avatar_animated: res.animated }).eq("id", p.id).select("*").single();
              if (r.error) throw r.error;
              S.profile = r.data;
              S.profiles.set(p.id, r.data);
              renderMeBtn();
              myProfileSheet();
            } catch (e) {
              toast(errMsg(e));
            }
          });
        })));
      const dn = h("input", { type: "text", maxlength: 64, value: p.display_name || "" });
      const un = h("input", { type: "text", value: "@" + p.username, disabled: true });
      const bio = h("textarea", { maxlength: 280 }, p.bio || "");
      const se = h("input", { type: "text", maxlength: 8, value: p.status_emoji || "", placeholder: "например, ^_^" });
      const st = h("input", { type: "text", maxlength: 80, value: p.status_text || "", placeholder: "Например: на работе до 18:00" });
      b.appendChild(h("label", { class: "lab" }, "Имя", dn));
      b.appendChild(h("label", { class: "lab" }, "Username (меняется только логин, поэтому фиксирован)", un));
      b.appendChild(h("label", { class: "lab" }, "О себе", bio));
      b.appendChild(h("div", { class: "ttl", text: "Статус" }));
      b.appendChild(h("label", { class: "lab" }, "Значок статуса", se));
      b.appendChild(h("label", { class: "lab" }, "Текст статуса", st));
      b.appendChild(h("div", { class: "btn-row" }, btnPrimary("Сохранить", async function () {
        const patch = {
          display_name: dn.value.trim(),
          bio: bio.value.trim(),
          status_emoji: se.value.trim(),
          status_text: st.value.trim()
        };
        const r = await sb.from("profiles").update(patch).eq("id", p.id).select("*").single();
        if (r.error) return toast(errMsg(r.error));
        S.profile = r.data;
        S.profiles.set(p.id, r.data);
        renderMeBtn();
        renderSidebar();
        closeSheet();
        toast("Профиль сохранён");
      })));
    });
  }

  function peopleSearchBox(container, onPick) {
    const input = h("input", { type: "text", placeholder: "Поиск по username или имени", autocomplete: "off" });
    const res = h("div", { style: { display: "flex", flexDirection: "column", gap: "2px" } });
    container.appendChild(input);
    container.appendChild(res);
    let t = null;
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(async function () {
        const q = clean(input.value);
        clear(res);
        if (!q) return;
        const r = await sb.from("profiles").select("*").or("username.ilike.%" + q + "%,display_name.ilike.%" + q + "%").neq("id", S.me.id).limit(15);
        (r.data || []).forEach(function (p) {
          S.profiles.set(p.id, Object.assign({}, S.profiles.get(p.id) || {}, p));
          res.appendChild(rowBtn(avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, size: "sm" }), pName(p), "@" + p.username, function () { onPick(p); }));
        });
        if (!res.children.length) res.appendChild(emptyNote("Никого не нашли"));
      }, 260);
    });
  }

  function newChatSheet() {
    openSheet("Новый чат", function (b) {
      b.appendChild(rowBtn(icoBox(ICON.user), "Личное сообщение", "найти человека по username", function () { personSheet(); }));
      b.appendChild(rowBtn(icoBox(ICON.user), "Новая группа", "несколько участников", function () { groupSheet(); }));
      b.appendChild(rowBtn(icoBox(ICON.bell), "Новый канал", "вещать подписчикам, писать только тебе", function () { channelSheet(); }));
    });
  }

  function personSheet() {
    openSheet("Личное сообщение", function (b) {
      peopleSearchBox(b, function (p) { openDirect(p.id); });
    });
  }

  function groupSheet() {
    const picked = new Map();
    openSheet("Новая группа", function (b) {
      const title = h("input", { type: "text", placeholder: "Название группы", maxlength: 64 });
      b.appendChild(h("label", { class: "lab" }, "Название", title));
      const chips = h("div", { class: "chip-row" });
      b.appendChild(chips);
      function redraw() {
        clear(chips);
        picked.forEach(function (p) {
          chips.appendChild(h("span", { class: "chip" }, pName(p),
            h("button", { type: "button", "aria-label": "Убрать", onclick: function () { picked.delete(p.id); redraw(); } }, "×")));
        });
      }
      peopleSearchBox(b, function (p) { picked.set(p.id, p); redraw(); });
      b.appendChild(h("div", { class: "btn-row" }, btnPrimary("Создать группу", async function () {
        const t = title.value.trim();
        if (!t) return toast("Введи название");
        if (!picked.size) return toast("Добавь хотя бы одного участника");
        const r = await sb.rpc("create_chat", { p_kind: "group", p_title: t, p_description: "", p_members: Array.from(picked.keys()) });
        if (r.error) return toast(errMsg(r.error));
        closeSheet();
        await loadChats();
        openChat(r.data);
      })));
    });
  }

  function channelSheet() {
    openSheet("Новый канал", function (b) {
      const title = h("input", { type: "text", placeholder: "Название канала", maxlength: 64 });
      const desc = h("textarea", { maxlength: 280, placeholder: "О чём канал" });
      b.appendChild(h("label", { class: "lab" }, "Название", title));
      b.appendChild(h("label", { class: "lab" }, "Описание", desc));
      b.appendChild(h("div", { class: "hint", text: "В канале пишешь только ты и админы. Подписчиков добавляй через «Информация»." }));
      b.appendChild(h("div", { class: "btn-row" }, btnPrimary("Создать канал", async function () {
        const t = title.value.trim();
        if (!t) return toast("Введи название");
        const r = await sb.rpc("create_chat", { p_kind: "channel", p_title: t, p_description: desc.value.trim(), p_members: [] });
        if (r.error) return toast(errMsg(r.error));
        closeSheet();
        await loadChats();
        openChat(r.data);
      })));
    });
  }

  function chatInfo(c) {
    if (c.kind === "direct") {
      const p = profileOf(c);
      if (p) profileSheet(p.id);
      return;
    }
    const isAdmin = c.role === "owner" || c.role === "admin";
    openSheet(c.kind === "channel" ? "Канал" : "Группа", function (b) {
      b.appendChild(h("div", { class: "profile-head" },
        avEl({ seed: c.id, name: c.title, url: c.avatar_url, animated: c.avatar_animated, size: "lg" }),
        h("div", { class: "profile-name", text: c.title }),
        c.description ? h("div", { class: "profile-bio", text: c.description }) : null));
      if (isAdmin) {
        const title = h("input", { type: "text", value: c.title, maxlength: 64 });
        const desc = h("textarea", { maxlength: 280 }, c.description || "");
        b.appendChild(h("label", { class: "lab" }, "Название", title));
        b.appendChild(h("label", { class: "lab" }, "Описание", desc));
        b.appendChild(h("div", { class: "btn-row" },
          btnGhost("Сменить аватар", function () {
            pickFile("image/*,video/mp4,video/webm", async function (f) {
              try {
                const res = await prepareAndUpload(f, "chats", { maxSide: 512, maxBytes: 6 * MB, quality: 0.9 });
                const r = await sb.from("chats").update({ avatar_url: res.url, avatar_animated: res.animated }).eq("id", c.id);
                if (r.error) throw r.error;
                await loadChats();
                chatInfo(curChat() || c);
              } catch (e) { toast(errMsg(e)); }
            });
          }),
          btnPrimary("Сохранить", async function () {
            const r = await sb.from("chats").update({ title: title.value.trim() || c.title, description: desc.value.trim() }).eq("id", c.id);
            if (r.error) return toast(errMsg(r.error));
            await loadChats();
            toast("Сохранено");
          })));
      }
      b.appendChild(h("div", { class: "ttl", text: "Участники · " + c.members.length }));
      const order = { owner: 0, admin: 1, member: 2 };
      c.members.slice().sort(function (x, y) { return order[x.role] - order[y.role]; }).forEach(function (mem) {
        const p = S.profiles.get(mem.user_id);
        if (!p) return;
        const roleText = mem.role === "owner" ? "владелец" : mem.role === "admin" ? "админ" : "участник";
        b.appendChild(rowBtn(avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, online: S.online.has(p.id), size: "sm" }),
          pName(p) + (mem.user_id === S.me.id ? " (вы)" : ""), roleText, function () { profileSheet(p.id); }));
      });
      if (isAdmin) {
        const add = h("input", { type: "text", placeholder: "Добавить по username" });
        b.appendChild(add);
        b.appendChild(h("div", { class: "btn-row" }, btnGhost("Добавить участника", async function () {
          const u = add.value.trim().toLowerCase();
          if (!u) return;
          const r = await sb.from("profiles").select("*").eq("username", u).maybeSingle();
          if (r.error || !r.data) return toast("Такой пользователь не найден");
          const a = await sb.rpc("add_chat_member", { p_chat: c.id, p_user: r.data.id });
          if (a.error) return toast(errMsg(a.error));
          S.profiles.set(r.data.id, r.data);
          toast("Добавлен: " + pName(r.data));
          await loadChats();
          chatInfo(curChat() || c);
        })));
      }
      b.appendChild(h("div", { class: "btn-row" },
        btnGhost("Покинуть", function () {
          confirmDlg("Покинуть?", "Ты выйдешь из «" + c.title + "».", "Покинуть", function () { return leaveChat(c); });
        }),
        c.role === "owner" ? btnDanger("Удалить", function () {
          confirmDlg("Удалить?", "Чат и все сообщения удалятся для всех.", "Удалить", function () { return deleteChat(c); });
        }) : null));
    });
  }

  function stickerSheet() {
    openSheet("Стикеры", function (b) {
      b.appendChild(h("div", { class: "ttl", text: "Новый пак" }));
      const t = h("input", { type: "text", placeholder: "Название пака", maxlength: 64 });
      const sn = h("input", { type: "text", placeholder: "Короткое имя: a-z, 0-9, _", maxlength: 40 });
      b.appendChild(t);
      b.appendChild(sn);
      b.appendChild(h("div", { class: "btn-row" }, btnPrimary("Создать пак", async function () {
        const title = t.value.trim();
        const short = sn.value.trim().toLowerCase();
        if (!title) return toast("Введи название пака");
        if (!/^[a-z0-9_]{3,40}$/.test(short)) return toast("Короткое имя: 3–40 символов, латиница, цифры и _");
        const r = await sb.from("sticker_packs").insert({ owner_id: S.me.id, title: title, short_name: short }).select("*").single();
        if (r.error) return toast(errMsg(r.error));
        const link = await sb.from("user_sticker_packs").insert({ user_id: S.me.id, pack_id: r.data.id });
        if (link.error) return toast(errMsg(link.error));
        await loadPacks();
        stickerSheet();
      })));
      b.appendChild(h("div", { class: "ttl", text: "Добавить чужой пак" }));
      const find = h("input", { type: "text", placeholder: "Короткое имя пака" });
      b.appendChild(find);
      b.appendChild(h("div", { class: "btn-row" }, btnGhost("Добавить", async function () {
        const short = find.value.trim().toLowerCase();
        if (!short) return;
        const r = await sb.from("sticker_packs").select("id").eq("short_name", short).maybeSingle();
        if (r.error || !r.data) return toast("Пак не найден");
        const link = await sb.from("user_sticker_packs").insert({ user_id: S.me.id, pack_id: r.data.id });
        if (link.error) return toast(errMsg(link.error));
        await loadPacks();
        stickerSheet();
      })));
      b.appendChild(h("div", { class: "ttl", text: "Мои и добавленные" }));
      if (!S.packs.length) b.appendChild(emptyNote("Пока пусто"));
      S.packs.forEach(function (pk) { b.appendChild(packBlock(pk)); });
    });
  }

  function packBlock(pk) {
    const mine = pk.owner_id === S.me.id;
    const grid = h("div", { class: "stk-grid" });
    pk.stickers.forEach(function (s) {
      const cell = h("div", { class: "stk-cell" }, thumb(s.url));
      if (mine) {
        cell.appendChild(h("button", {
          type: "button", "aria-label": "Удалить стикер", text: "×",
          onclick: function () {
            confirmDlg("Удалить стикер?", "Он пропадёт из пака.", "Удалить", async function () {
              const r = await sb.from("stickers").delete().eq("id", s.id);
              if (r.error) throw r.error;
              await loadPacks();
              stickerSheet();
            });
          }
        }));
      }
      grid.appendChild(cell);
    });
    const actions = h("div", { class: "btn-row" });
    if (mine) {
      actions.appendChild(btnGhost("+ Стикер", function () { addSticker(pk); }));
      actions.appendChild(btnDanger("Удалить пак", function () {
        confirmDlg("Удалить пак?", "Пак «" + pk.title + "» и все стикеры в нём удалятся.", "Удалить", async function () {
          const r = await sb.from("sticker_packs").delete().eq("id", pk.id);
          if (r.error) throw r.error;
          await loadPacks();
          stickerSheet();
        });
      }));
    } else {
      actions.appendChild(btnGhost("Убрать из моих", async function () {
        const r = await sb.from("user_sticker_packs").delete().eq("user_id", S.me.id).eq("pack_id", pk.id);
        if (r.error) return toast(errMsg(r.error));
        await loadPacks();
        stickerSheet();
      }));
    }
    return h("div", { class: "stk-manage" },
      h("div", { class: "stk-manage-head" }, h("b", { text: pk.title }), h("small", { text: "@" + pk.short_name })),
      grid,
      actions);
  }

  function addSticker(pk) {
    pickFile("image/*,video/mp4,video/webm", async function (f) {
      try {
        toast("Загружаю стикер…");
        const res = await prepareAndUpload(f, "stickers", { maxSide: 512, maxBytes: 6 * MB, quality: 0.92 });
        const r = await sb.from("stickers").insert({ pack_id: pk.id, url: res.url, animated: res.animated, emoji: "" });
        if (r.error) throw r.error;
        await loadPacks();
        stickerSheet();
      } catch (e) {
        toast(errMsg(e));
      }
    });
  }

  function settingsSheet() {
    openSheet("Настройки", function (b) {
      b.appendChild(rowBtn(avEl({ seed: S.me.id, name: pName(S.profile), url: S.profile.avatar_url, animated: S.profile.avatar_animated, size: "sm" }),
        pName(S.profile), "@" + S.profile.username, function () { myProfileSheet(); }));
      b.appendChild(rowBtn(icoBox(ICON.sticker), "Стикеры", "паки, свои картинки и GIF", function () { stickerSheet(); }));
      b.appendChild(rowBtn(icoBox(ICON.bell), "Уведомления", "браузерные, когда приложение свёрнуто", async function () {
        if (!("Notification" in window)) return toast("Браузер не поддерживает уведомления");
        const perm = await Notification.requestPermission();
        toast(perm === "granted" ? "Уведомления включены" : "Уведомления не разрешены");
      }));
      if (S.installEvt) {
        b.appendChild(rowBtn(icoBox(ICON.install), "Установить приложение", "добавить Gemgram на экран", async function () {
          const e = S.installEvt;
          S.installEvt = null;
          closeSheet();
          e.prompt();
        }));
      } else {
        b.appendChild(h("div", { class: "hint", text: "Установка: Android — меню браузера, «Установить приложение». iPhone — Safari, «Поделиться», «На экран Домой»." }));
      }
      b.appendChild(rowBtn(icoBox(ICON.exit), "Выйти", "из этого аккаунта на устройстве", function () {
        confirmDlg("Выйти?", "Сессия на этом устройстве завершится.", "Выйти", async function () {
          await sb.auth.signOut();
          location.reload();
        });
      }, true));
    });
  }

  function connectRealtime() {
    S.typingCh = sb.channel("gg-typing", { config: { broadcast: { self: false } } });
    S.typingCh.on("broadcast", { event: "typing" }, function (msg) { onTyping(msg.payload); }).subscribe();

    S.presCh = sb.channel("gg-online", { config: { presence: { key: S.me.id } } });
    S.presCh.on("presence", { event: "sync" }, function () {
      S.online = new Set(Object.keys(S.presCh.presenceState()));
      renderSidebar();
      renderHeader();
    }).subscribe(async function (status) {
      if (status === "SUBSCRIBED") await S.presCh.track({ at: Date.now() });
    });

    S.dbCh = sb.channel("gg-db")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, onMessageEvent)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, onReactionEvent)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_members" }, function () { scheduleChats(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, function () { scheduleChats(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, onProfileEvent)
      .subscribe();
  }

  function notifyFor(m) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const c = S.chats.find(function (x) { return x.id === m.chat_id; });
    if (c && c.muted) return;
    if (!document.hidden && S.open === m.chat_id) return;
    const sender = pName(S.profiles.get(m.sender_id));
    const body = (c && c.kind !== "direct" ? sender + ": " : "") + (m.body || "Вложение");
    try {
      new Notification(c ? chatTitle(c) : "Gemgram", { body: body, tag: m.chat_id, icon: "icon.png" });
    } catch (e) {}
  }

  async function onMessageEvent(p) {
    const rec = p.eventType === "DELETE" ? p.old : p.new;
    if (!rec || !rec.chat_id) return;
    if (p.eventType === "INSERT") {
      if (rec.sender_id !== S.me.id) {
        await ensureProfiles([rec.sender_id]);
        notifyFor(rec);
      }
      if (S.open === rec.chat_id && S.loadedChat === rec.chat_id) {
        addMessage(Object.assign({ reactions: [] }, rec));
      }
    } else if (p.eventType === "UPDATE") {
      if (S.open === rec.chat_id) applyMessageUpdate(rec);
    } else if (p.eventType === "DELETE") {
      S.messages = S.messages.filter(function (x) { return x.id !== rec.id; });
      if (S.open === rec.chat_id) renderTimeline(false);
    }
    scheduleChats();
  }

  function onReactionEvent(p) {
    if (p.eventType === "INSERT") {
      const r = p.new;
      const m = S.messages.find(function (x) { return x.id === r.message_id; });
      if (!m) return;
      m.reactions = m.reactions || [];
      if (m.reactions.some(function (x) { return x.user_id === r.user_id && x.emoji === r.emoji; })) return;
      m.reactions.push({ message_id: r.message_id, user_id: r.user_id, emoji: r.emoji });
      renderTimeline(false);
    } else if (p.eventType === "DELETE") {
      const r = p.old;
      const m = S.messages.find(function (x) { return x.id === r.message_id; });
      if (!m || !m.reactions) return;
      m.reactions = m.reactions.filter(function (x) { return !(x.user_id === r.user_id && x.emoji === r.emoji); });
      renderTimeline(false);
    }
  }

  function onProfileEvent(p) {
    const rec = p.new;
    if (!rec || !rec.id) return;
    const prev = S.profiles.get(rec.id) || {};
    const keys = ["display_name", "username", "avatar_url", "avatar_animated", "status_emoji", "status_text", "bio"];
    const changed = keys.some(function (k) { return prev[k] !== rec[k]; });
    S.profiles.set(rec.id, Object.assign({}, prev, rec));
    if (rec.id === S.me.id) {
      S.profile = S.profiles.get(rec.id);
      renderMeBtn();
    }
    if (changed) {
      renderSidebar();
      if (S.open) {
        renderHeader();
        renderTimeline(false);
      }
    }
  }

  function wire() {
    document.querySelectorAll("#auth-seg .seg-btn").forEach(function (b) {
      b.addEventListener("click", function () { setAuthMode(b.dataset.mode); });
    });
    $("auth-form").addEventListener("submit", onAuthSubmit);
    $("search").addEventListener("input", onSearchInput);
    $("me-btn").addEventListener("click", myProfileSheet);
    $("settings-btn").addEventListener("click", settingsSheet);
    $("new-btn").addEventListener("click", newChatSheet);
    $("back-btn").addEventListener("click", closeChat);
    $("chat-open-info").addEventListener("click", function () { const c = curChat(); if (c) chatInfo(c); });
    $("chat-menu-btn").addEventListener("click", function () {
      const c = curChat();
      if (!c) return;
      const r = $("chat-menu-btn").getBoundingClientRect();
      chatMenu(c, Math.max(8, r.right - 250), r.bottom + 6);
    });
    $("chat-search-btn").addEventListener("click", function () {
      const el = $("chat-search");
      const show = el.classList.contains("hidden");
      el.classList.toggle("hidden", !show);
      if (show) $("chat-search-input").focus();
      else { $("chat-search-input").value = ""; if (panelMode === "found") closePanel(); }
    });
    $("chat-search-close").addEventListener("click", function () {
      $("chat-search").classList.add("hidden");
      $("chat-search-input").value = "";
      if (panelMode === "found") closePanel();
    });
    let chatSearchT = null;
    $("chat-search-input").addEventListener("input", function () {
      clearTimeout(chatSearchT);
      chatSearchT = setTimeout(runChatSearch, 260);
    });
    $("timeline").addEventListener("scroll", updateDown);
    $("down-btn").addEventListener("click", function () {
      const tl = $("timeline");
      tl.scrollTo({ top: tl.scrollHeight, behavior: "smooth" });
    });
    $("sticker-btn").addEventListener("click", function () { togglePanel("stickers"); });
    $("smile-btn").addEventListener("click", function () { togglePanel("smiles"); });
    $("attach-btn").addEventListener("click", function () { pickFile("image/*,video/mp4,video/webm", handleAttach); });
    $("composer").addEventListener("submit", function (e) { e.preventDefault(); submitText(); });
    $("input").addEventListener("input", function () { autosize(); throttleTyping(); });
    $("input").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !isTouch) {
        e.preventDefault();
        submitText();
      }
      if (e.key === "Escape") {
        S.editing = null;
        S.replyTo = null;
        $("input").value = "";
        autosize();
        renderBars();
      }
    });
    $("sheet").addEventListener("click", function (e) { if (e.target === $("sheet")) closeSheet(); });
    $("sheet-x").addEventListener("click", closeSheet);
    $("lightbox").addEventListener("click", function (e) {
      if (e.target.tagName === "VIDEO") return;
      $("lightbox").classList.add("hidden");
      clear($("lightbox"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      hideCtx();
      if (!$("lightbox").classList.contains("hidden")) { $("lightbox").classList.add("hidden"); clear($("lightbox")); return; }
      if (!$("sheet").classList.contains("hidden")) closeSheet();
    });
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      S.installEvt = e;
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  async function runChatSearch() {
    const c = curChat();
    const q = clean($("chat-search-input").value);
    if (!c) return;
    if (!q) {
      if (panelMode === "found") closePanel();
      return;
    }
    const r = await sb.from("messages").select("id, chat_id, body, created_at, sender_id, kind")
      .eq("chat_id", c.id).ilike("body", "%" + q + "%").is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(40);
    if (r.error) return toast(errMsg(r.error));
    panelMode = "found";
    const p = $("panel");
    clear(p);
    p.classList.remove("hidden");
    const list = h("div", { class: "panel-grid", style: { gridTemplateColumns: "1fr", alignContent: "start" } });
    if (!(r.data || []).length) list.appendChild(h("div", { class: "panel-empty", text: "Ничего не нашлось" }));
    (r.data || []).forEach(function (m) {
      list.appendChild(h("button", {
        class: "item", type: "button", style: { height: "auto", background: "transparent", textAlign: "left", animation: "none" },
        onclick: function () { jumpToMessage(m); }
      },
        h("div", { class: "item-main" },
          h("div", { class: "row1" }, h("span", { class: "nm", text: m.sender_id === S.me.id ? "Вы" : pName(S.profiles.get(m.sender_id)) }), h("span", { class: "tm", text: shortTime(m.created_at) })),
          h("div", { class: "row2" }, h("span", { class: "pv", text: m.body }))) ));
    });
    p.appendChild(list);
  }

  async function boot() {
    wire();
    setAuthMode("login");
    const r = await sb.auth.getSession();
    if (r.data && r.data.session) return enter(r.data.session.user);
    showAuth();
  }

  boot();
})();
