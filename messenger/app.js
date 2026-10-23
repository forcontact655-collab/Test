(function () {
  "use strict";

  const SUPA_URL = "https://ceqahqbrvgqdcjxgzjxk.supabase.co";
  const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcWFocWJydmdxZGNqeGd6anhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDgzMDMsImV4cCI6MjEwODI4NDMwM30.ZRngDLbZeqysidVxsXU_S4I1GxfsAXmftHQsRvWQLsQ";
  const MB = 1024 * 1024;
  const EDIT_MS = 48 * 3600 * 1000;
  const REACTS = ["👍", "❤️", "🔥", "😂", "😮", "😢", "🙏", "🎉"];
  const EMOJI_SETS = [
    { t: "Смайлы", e: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😍","🥰","😘","😋","😎","🤓","🧐","🤔","🤨","😐","😶","😏","😒","🙄","😬","😴","😪","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","😵","🤯","🤠","🥳","😭","😢","😤","😠","😡","🤬","😱","😨","😰","😥","😓","🤗","🤭"] },
    { t: "Жесты", e: ["👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👋","🤚","🖐️","✋","🖖","👏","🙌","🤝","🙏","✍️","💪"] },
    { t: "Сердца и символы", e: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💯","💥","💫","✨","🔥","⭐","🌟","✅","❌","❓","❗","⚡","🎉","🎊","🎁","🏆","🥇"] },
    { t: "Животные и вещи", e: ["🐶","🐱","🐭","🦊","🐻","🐼","🐸","🐵","🐔","🐧","🦄","🐝","🌸","🌹","🌻","🌲","🍀","🍕","🍔","🍟","🌮","🍣","🍩","🍪","☕","🍺","🎵","🎮","🎲","📷","💡","📌","📎","🔒","🔑","🚀","🌙","☀️","🌈","❄️"] }
  ];
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
  const FOLDERS = [["all", "Все"], ["direct", "Личные"], ["group", "Группы"], ["channel", "Каналы"], ["unread", "Непрочитанные"], ["archived", "Архив"]];
  const ICON = {
    imgs: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9.5a1.5 1.5 0 1 0 0-.01",
    music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    play: "M8 5v14l11-7z",
    lbClose: "M6 6l12 12M18 6L6 18",
    lbDownload: "M12 4v11M7 10l5 5 5-5M5 20h14",
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
    mail: "M3 6h18v12H3zM3 7l9 6 9-6",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    sticker: "M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9l7-7V6a3 3 0 0 0-3-3zM15 21v-4a2 2 0 0 1 2-2h4",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8zM10 20a2 2 0 0 0 4 0",
    down: "M12 5v14M6 13l6 6 6-6",
    install: "M12 3v12M7 10l5 5 5-5M5 21h14",
    plus: "M12 5v14M5 12h14",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
    camera: "M4 7h3l2-3h6l2 3h3v12H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
    gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4",
    msg: "M4 5h16v11H9l-5 4z",
    pause: "M7 5h4v14H7zM13 5h4v14h-4z",
    vol: "M4 9.5v5h3.5L12 18V6L7.5 9.5H4zM15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11",
    muted: "M4 9.5v5h3.5L12 18V6L7.5 9.5H4zM16 9l5 6M21 9l-5 6",
    note: "M9 18V6l10-2v12",
    brush: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.7-.4-1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8z",
    hash: "M4 9h16M4 15h16M10 4l-2 16M16 4l-2 16",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"
  };

  const S = {
    sb: null, me: null, profile: null, entered: false,
    profiles: new Map(), chats: [], packs: [], online: new Set(),
    folder: "all", query: "", remote: { people: [], messages: [] }, remoteDone: false,
    open: null, messages: [], loadedChat: null, editing: null, replyTo: null, jumpMsg: null,
    typingCh: null, presCh: null, dbCh: null, installEvt: null, lastLong: 0, refreshT: null,
    seen: new Map(), chatsReady: false, pendingOpen: null, drafts: new Map()
  };
  const typingMap = new Map();
  const E2E = { priv: null, missing: false, keys: new Map(), plain: new Map() };
  const PP = { uid: null };
  const PALETTE = ["#7c3aed", "#c026d3", "#db2777", "#e11d48", "#ea580c", "#ca8a04", "#16a34a", "#0d9488", "#2563eb", "#334155"];
  let panelMode = null;
  let panelPack = null;
  let sending = false;
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
    if (/username_taken/i.test(m)) return "Такой username уже занят";
    if (/username_invalid/i.test(m)) return "Username: 3–32 символа, латиница, цифры и _";
    if (/username_change_requires_google/i.test(m)) return "Сменить username можно только с привязанным Google";
    if (/manual.?link/i.test(m)) return "Привязка Google пока не включена на сервере";
    if (/over_email_send_rate_limit|rate limit|too many|for security purposes/i.test(m)) return "Слишком часто. Подожди немного и попробуй снова";
    if (/otp_expired|expired|invalid.*(otp|token)|token.*invalid/i.test(m)) return "Код неверный или устарел. Запроси новый";
    if (/already registered|already been registered|User already|занят/i.test(m)) return "Такой username уже занят";
    if (/dm_closed/i.test(m)) return "Этот человек закрыл новые личные чаты. Написать можно, если переписка уже есть";
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
  function pName(p) { return p ? (p.display_name || (p.username ? "@" + p.username : "Пользователь")) : "Неизвестно"; }
  function uTag(p) { return p && p.username ? "@" + p.username : ""; }
  const APP_AUTH_URL = "com.forcontact655.echo://callback";
  function authRedirect() { return window.Capacitor ? APP_AUTH_URL : location.origin + location.pathname + location.search; }
  function googleLinked(u) { return !!u && (u.identities || []).some(function (i) { return i.provider === "google"; }); }
  function linkGoogle() {
    sb.auth.linkIdentity({ provider: "google", options: { redirectTo: authRedirect() } }).then(function (r) {
      if (r.error) toast(errMsg(r.error));
    });
  }
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
  function lastSeenText(p) { return p && p.last_seen ? "был(а) " + agoText(p.last_seen) : "статус скрыт"; }
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
    if (p) return { seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, online: isOn(p.id) };
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
    // В «Все» архивные чаты скрыты, но при поиске ищем и в них.
    if (S.folder === "archived") return !!c.archived;
    if (c.archived) return false;
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

  async function onGoogleLogin() {
    const btn = $("g-login");
    btn.disabled = true;
    try {
      const r = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: authRedirect() } });
      if (r.error) throw r.error;
    } catch (err) {
      toast(errMsg(err));
      btn.disabled = false;
    }
  }
  async function enter(user) {
    if (S.entered) return;
    S.entered = true;
    S.me = user;
    let r = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (r.error && isNetErr(r.error)) {
      const cp = await cacheGet("me");
      if (!cp) {
        S.entered = false;
        hideBoot();
        toast("Нет сети. Войди, когда появится связь");
        return;
      }
      r = { data: cp, error: null };
    }
    if (r.error || !r.data) {
      toast("Профиль не найден");
      await sb.auth.signOut();
      location.reload();
      return;
    }
    if (!r.error && r.data.id === user.id) cacheSet("me", r.data);
    S.profile = r.data;
    S.profiles.set(r.data.id, r.data);
    $("auth").classList.add("hidden");
    $("app").classList.remove("hidden");
    hideBoot();
    renderMeBtn();
    await loadDrafts();
    await showCachedChats();
    await e2eInit();
    await Promise.all([loadChats(), loadPacks()]);
    tryPendingOpen();
    flushOutbox();
    openFromUrl();
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

  function isOn(id) {
    return !!S.me && (id === S.me.id || S.online.has(id));
  }

  function heartbeat() {
    if (!S.me || document.hidden) return;
    sb.rpc("touch_presence").then(function () {}, function () {});
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
    if (!navigator.onLine) return loadCachedChats();
    const me = S.me.id;
    const mem = await sb.from("chat_members").select("chat_id, role, pinned, muted, archived, last_read_at, chats(id, kind, title, description, avatar_url, avatar_animated, created_by)").eq("user_id", me);
    if (mem.error) return isNetErr(mem.error) ? loadCachedChats() : toast(errMsg(mem.error));
    const mine = (mem.data || []).filter(function (r) { return r.chats; });
    const ids = mine.map(function (r) { return r.chat_id; });
    let all = [];
    if (ids.length) {
      const r = await sb.from("chat_members").select("chat_id, user_id, role, last_read_at, profiles(id, uid, username, display_name, bio, status_emoji, status_text, avatar_url, avatar_animated, last_seen, profile_bg, music_url, music_title, public_key)").in("chat_id", ids);
      if (r.error) return isNetErr(r.error) ? loadCachedChats() : toast(errMsg(r.error));
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
        role: r.role, pinned: r.pinned, muted: r.muted, archived: !!r.archived, members: members, otherId: otherId,
        unread: Number(s.unread || 0), lastAt: s.last_at || null,
        last: s.last_kind ? { kind: s.last_kind, body: s.last_body || "", sender: s.last_sender, deleted: !!s.last_deleted } : null
      };
    });
    const need = [];
    S.chats.forEach(function (c) { if (c.last && c.last.sender) need.push(c.last.sender); });
    await ensureProfiles(need);
    await warmPreviews();
    S.chatsReady = true;
    cacheChats();
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
    if (!need.length || !navigator.onLine) return;
    const r = await sb.from("profiles").select("*").in("id", need);
    (r.data || []).forEach(function (p) { S.profiles.set(p.id, p); });
  }

  function renderTabs() {
    const box = $("tabs");
    clear(box);
    const unread = S.chats.filter(function (c) { return c.unread > 0; }).length;
    const hasArchive = S.chats.some(function (c) { return c.archived; });
    FOLDERS.forEach(function (f) {
      if (f[0] === "archived" && !hasArchive) return;
      const label = f[0] === "unread" && unread ? f[1] + " · " + unread : f[1];
      box.appendChild(h("button", {
        class: "tab" + (S.folder === f[0] ? " on" : ""), type: "button", text: label,
        onclick: function () { S.folder = f[0]; renderSidebar(); }
      }));
    });
  }

  function shown(m) { return m._plain !== undefined ? m._plain : m.body; }
  function plainPrev(body) { return EchoE2E.isEncrypted(body) ? "🔒 Зашифровано" : body; }
  function prevText(l) {
    if (l.plain !== undefined) return l.plain;
    return EchoE2E.isEncrypted(l.body) ? "🔒 Зашифровано" : l.body;
  }
  function isNetErr(e) {
    return !navigator.onLine || /fetch|network|load failed/i.test(String(e && (e.message || e)));
  }
  function cacheGet(k) { return window.EchoStore ? EchoStore.get(k).catch(function () { return null; }) : Promise.resolve(null); }
  function cacheSet(k, v) { if (window.EchoStore) EchoStore.set(k, JSON.parse(JSON.stringify(v))).catch(function () {}); }
  // Черновики хранятся на устройстве по каждому чату (IndexedDB), привязаны к пользователю.
  let draftT = null;
  async function loadDrafts() {
    const d = await cacheGet("drafts");
    if (!d || d.uid !== S.me.id || !d.map) return;
    Object.keys(d.map).forEach(function (k) { S.drafts.set(k, d.map[k]); });
  }
  function persistDrafts() {
    const map = {};
    S.drafts.forEach(function (v, k) { map[k] = v; });
    cacheSet("drafts", { uid: S.me.id, map: map });
  }
  function setDraft(chatId, v) {
    if (!chatId || !S.me) return;
    if (v && v.trim()) S.drafts.set(chatId, v); else S.drafts.delete(chatId);
    clearTimeout(draftT);
    draftT = setTimeout(persistDrafts, 400);
  }
  function cacheChats() {
    setOffline(false);
    cacheSet("chats", { uid: S.me.id, chats: S.chats, profiles: Array.from(S.profiles.values()) });
  }
  function applyChatSnap(snap) {
    (snap.profiles || []).forEach(function (p) { S.profiles.set(p.id, Object.assign({}, S.profiles.get(p.id) || {}, p)); });
    S.chats = snap.chats;
  }
  // Показываем чаты из кэша сразу при запуске, пока идёт запрос к сети.
  // Кэш привязан к пользователю: чужие чаты с этого устройства не показываем.
  async function showCachedChats() {
    const snap = await cacheGet("chats");
    if (!snap || !snap.chats || snap.uid !== S.me.id || S.chatsReady) return;
    applyChatSnap(snap);
    S.chatsReady = true;
    renderSidebar();
  }
  async function loadCachedChats() {
    const snap = await cacheGet("chats");
    setOffline(true);
    if (!snap || !snap.chats || snap.uid !== S.me.id) return;
    applyChatSnap(snap);
    S.chatsReady = true;
    renderSidebar();
    if (S.open) openChat(S.open);
  }
  function setOffline(on) {
    const b = $("offline-bar");
    if (b) b.classList.toggle("hidden", !on);
  }
  async function warmPreviews() {
    for (const c of S.chats) {
      if (c.kind === "direct" && c.last && EchoE2E.isEncrypted(c.last.body)) c.last.plain = await plainOf(c.last.body, c);
    }
  }
  async function saveLocalKey(priv, pub) {
    await EchoStore.set("me-key", { uid: S.me.id, priv: priv, pub: pub });
    E2E.priv = priv;
    E2E.missing = false;
    E2E.keys.clear();
  }
  async function publishKey(pub, privB64) {
    const up = await sb.from("user_keys").upsert({ user_id: S.me.id, pub: pub, priv_pkcs8: privB64, updated_at: new Date().toISOString() });
    if (up.error) throw up.error;
    const pr = await sb.from("profiles").update({ public_key: pub }).eq("id", S.me.id).select("*").single();
    if (!pr.error) applySelf(pr.data);
  }
  async function e2eInit() {
    if (!window.EchoE2E || !window.EchoStore) return;
    try {
      const saved = await EchoStore.get("me-key");
      const pub = S.profile.public_key;
      if (saved && saved.uid === S.me.id && (!pub || pub === saved.pub)) {
        E2E.priv = saved.priv;
        E2E.missing = false;
        if (!pub) {
          const pr = await sb.from("profiles").update({ public_key: saved.pub }).eq("id", S.me.id).select("*").single();
          if (!pr.error) applySelf(pr.data);
        }
        return;
      }
      // Резервная копия на сервере: восстановление на новом устройстве или после переустановки.
      const row = await sb.from("user_keys").select("pub, priv_pkcs8").eq("user_id", S.me.id).maybeSingle();
      if (!row.error && row.data && (!pub || row.data.pub === pub)) {
        const priv = await EchoE2E.importPriv(row.data.priv_pkcs8);
        await saveLocalKey(priv, row.data.pub);
        if (!pub) {
          const pr = await sb.from("profiles").update({ public_key: row.data.pub }).eq("id", S.me.id).select("*").single();
          if (!pr.error) applySelf(pr.data);
        }
        return;
      }
      if (pub) {
        // Ключ в профиле есть, а копии нет (ключ создан до резервной копии): создать новый можно вручную.
        E2E.priv = null;
        E2E.missing = true;
        return;
      }
      const k = await EchoE2E.generate();
      await saveLocalKey(k.privateKey, k.publicKey);
      await publishKey(k.publicKey, k.privB64);
    } catch (e) {
      E2E.priv = null;
      E2E.missing = true;
    }
  }
  async function resetE2EKey() {
    const k = await EchoE2E.generate();
    await publishKey(k.publicKey, k.privB64);
    await saveLocalKey(k.privateKey, k.publicKey);
    toast("Создан новый ключ шифрования");
  }
  function e2eSheet() {
    openSheet("Шифрование личных чатов", function (b) {
      b.appendChild(h("p", { class: "hint", text: E2E.priv
        ? "Ключ есть на этом устройстве. Его резервная копия хранится на сервере, поэтому после переустановки ключ восстановится сам."
        : "Ключ на этом устройстве не найден, поэтому личные сообщения не открываются и не отправляются. Старые сообщения, зашифрованные прежним ключом, после создания нового ключа не откроются." }));
      if (!E2E.priv) {
        b.appendChild(h("div", { class: "btn-row" }, btnDanger("Создать новый ключ", async function () {
          try { await resetE2EKey(); closeSheet(); } catch (e) { toast(errMsg(e)); }
        })));
      }
    });
  }
  async function chatKeyFor(otherId) {
    if (!E2E.priv || !otherId) return null;
    let p = S.profiles.get(otherId);
    if ((!p || !p.public_key) && navigator.onLine) {
      const r = await sb.from("profiles").select("*").eq("id", otherId).maybeSingle();
      if (r.data) {
        p = Object.assign({}, p || {}, r.data);
        S.profiles.set(otherId, p);
      }
    }
    if (!p || !p.public_key) return null;
    const id = otherId + "|" + p.public_key;
    if (!E2E.keys.has(id)) E2E.keys.set(id, await EchoE2E.deriveChatKey(E2E.priv, p.public_key));
    return E2E.keys.get(id);
  }
  async function plainOf(body, c) {
    if (!EchoE2E.isEncrypted(body) || !c || c.kind !== "direct") return body;
    if (E2E.plain.has(body)) return E2E.plain.get(body);
    if (!E2E.priv) return "🔒 Ключ на другом устройстве";
    let out;
    try {
      const k = await chatKeyFor(c.otherId);
      if (!k) return "🔒 Нет ключа собеседника";
      out = await EchoE2E.decrypt(k, body);
    } catch (e) {
      out = "🔒 Не удалось расшифровать";
    }
    E2E.plain.set(body, out);
    return out;
  }
  async function prepMsgs(list, c) {
    for (const m of list) {
      if (EchoE2E.isEncrypted(m.body) && m._plain === undefined) m._plain = await plainOf(m.body, c);
      if (EchoE2E.isEncrypted(m.media_name) && m._pname === undefined) {
        const raw = await plainOf(m.media_name, c);
        if (raw.indexOf("🔒") === 0) {
          m._plock = true;
          m._pname = "";
        } else {
          const meta = parseMeta(raw);
          m._pname = meta.n || "";
          m._pmeta = meta.k ? meta : null;
        }
      }
    }
  }
  async function encryptFor(c, text) {
    if (!E2E.priv) throw new Error("На этом устройстве нет ключа шифрования");
    if (text.length > 1800) throw new Error("В личном чате максимум 1800 символов");
    const k = await chatKeyFor(c.otherId);
    if (!k) throw new Error("У собеседника ещё нет ключа шифрования");
    return EchoE2E.encrypt(k, text);
  }
  async function outBody(c, text) {
    return c.kind === "direct" && text ? encryptFor(c, text) : text;
  }
  async function flushOutbox() {
    if (!window.EchoStore || !navigator.onLine) return;
    const items = (await EchoStore.outboxAll().catch(function () { return []; })).sort(function (a, b) { return a.created - b.created; });
    let sent = 0;
    for (const it of items) {
      const r = await sb.from("messages").insert({ chat_id: it.chat_id, sender_id: S.me.id, kind: "text", body: it.body, reply_to: it.reply_to || null }).select("*").single();
      if (r.error) break;
      await EchoStore.outboxDel(it.lid);
      sent++;
    }
    if (sent) {
      toast("Отправлено сообщений: " + sent);
      if (S.open) openChat(S.open);
      scheduleChats();
    }
  }
  function openEmojiSheet(m) {
    openSheet("Реакция", function (b) {
      EMOJI_SETS.forEach(function (set) {
        b.appendChild(h("div", { class: "ttl", text: set.t }));
        const grid = h("div", { class: "emo-grid" });
        set.e.forEach(function (e) {
          grid.appendChild(h("button", { type: "button", text: e, onclick: function () { closeSheet(); toggleReact(m, e); } }));
        });
        b.appendChild(grid);
      });
    });
  }

  function previewLine(c) {
    if (!c.last) return "Нет сообщений";
    const l = c.last;
    let body;
    if (l.deleted) body = "Сообщение удалено";
    else if (l.kind === "text") body = prevText(l);
    else if (l.kind === "image") body = prevText(l) || "Фото";
    else if (l.kind === "video") body = prevText(l) || "Видео";
    else if (l.kind === "audio") body = prevText(l) || "Музыка";
    else if (l.kind === "sticker") body = "Стикер";
    else body = prevText(l);
    let who = "";
    if (l.sender === S.me.id) who = "Вы: ";
    else if (c.kind !== "direct") who = pName(S.profiles.get(l.sender)) + ": ";
    return who + body.replace(/\s+/g, " ");
  }

  function chatItem(c) {
    const typing = typingIn(c.id);
    const draft = S.open !== c.id ? S.drafts.get(c.id) : null;
    const pv = draft && !typing
      ? h("span", { class: "pv draft" }, h("b", { text: "Черновик: " }), draft.replace(/\s+/g, " ").slice(0, 120))
      : h("span", { class: "pv" + (typing ? " typing" : ""), text: typing ? "печатает…" : previewLine(c) });
    // Список перерисовывается целиком при каждом обновлении. Анимацию появления
    // проигрываем только для чатов, которых раньше не было на экране, и для бейджа,
    // у которого выросло число непрочитанных. Иначе всё мигало бы при каждой перерисовке.
    const prevUnread = S.seen.get(c.id);
    const fresh = prevUnread === undefined;
    const bumped = !fresh && c.unread > prevUnread;
    S.seen.set(c.id, c.unread);
    const row1 = h("div", { class: "row1" },
      h("span", { class: "nm", text: chatTitle(c) }),
      c.pinned ? svg(ICON.pin, "mico pin") : null,
      h("span", { class: "tm", text: c.lastAt ? shortTime(c.lastAt) : "" }));
    const row2 = h("div", { class: "row2" },
      pv,
      c.muted ? svg(ICON.mute, "mico") : null,
      c.unread > 0 ? h("span", { class: "badge" + (c.muted ? " mute" : "") + (bumped ? "" : " still"), text: c.unread > 99 ? "99+" : String(c.unread) }) : null);
    const it = h("div", {
      class: "item" + (fresh ? "" : " still") + (c.id === S.open ? " on" : "") + (c.pinned ? " pin" : ""),
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
      oncontextmenu: function (e) { e.preventDefault(); openProfilePage(p.id); }
    },
      avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, online: isOn(p.id) }),
      h("div", { class: "item-main" },
        h("div", { class: "row1" }, h("span", { class: "nm", text: pName(p) })),
        h("div", { class: "row2" }, h("span", { class: "pv", text: uTag(p) }))));
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
        h("div", { class: "row2" }, h("span", { class: "pv", text: (m.sender_id === S.me.id ? "Вы: " : "") + plainPrev(m.body) }))));
  }

  function renderSidebar() {
    renderTabs();
    const list = $("list");
    clear(list);
    const q = clean(S.query).toLowerCase();
    const items = sortedChats().filter(function (c) {
      return (q ? true : matchFolder(c)) && (!q || chatTitle(c).toLowerCase().indexOf(q) >= 0);
    });
    if (!q) {
      // Пока чаты не загружены (ни из кэша, ни с сети), не пишем «Чатов пока нет»:
      // иначе при каждом раннем обновлении (например, профиль) это мигает на старте.
      if (!items.length && S.chatsReady) {
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

  function profileOr(q) {
    const pat = "%" + q + "%";
    let out = "username.ilike." + pat + ",display_name.ilike." + pat;
    if (/^\d{1,12}$/.test(q)) out += ",uid.eq." + q;
    return out;
  }

  function cleanUser(q) { return String(q || "").trim().replace(/^@/, "").toLowerCase(); }
  async function findExact(q) {
    const s = cleanUser(q);
    if (!s) return null;
    const r = /^\d{1,12}$/.test(s)
      ? await sb.from("profiles").select("*").eq("uid", s).maybeSingle()
      : await sb.from("profiles").select("*").eq("username", s).maybeSingle();
    if (r.error || !r.data) return null;
    S.profiles.set(r.data.id, Object.assign({}, S.profiles.get(r.data.id) || {}, r.data));
    return r.data;
  }
  async function openProfileByQuery(q) {
    const p = await findExact(q);
    if (!p) return toast("Такой пользователь не найден");
    openProfilePage(p.id);
  }
  function openFromUrl() {
    const qs = new URLSearchParams(location.search);
    const q = qs.get("u") || qs.get("id");
    if (!q) return;
    history.replaceState(null, "", location.pathname);
    openProfileByQuery(q);
  }
  function mentionNodes(text) {
    const out = [];
    const re = /@([a-zA-Z0-9_]{3,32})/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const uname = m[1].toLowerCase();
      out.push(h("a", { class: "mention", href: "#", onclick: function (e) { e.preventDefault(); e.stopPropagation(); openProfileByQuery(uname); } }, m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
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
    const pr = await sb.from("profiles").select("*").or(profileOr(q)).neq("id", S.me.id).limit(12);
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
      if (isOn(p.id)) return "в сети";
      return lastSeenText(p);
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
    const switched = S.open !== id;
    S.open = id;
    if (switched) { $("input").value = S.drafts.get(id) || ""; autosize(); }
    clearNativeNotifs(id);
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
    const r = navigator.onLine ? await sb.from("messages").select("*, reactions(message_id, user_id, emoji)").eq("chat_id", id).order("created_at", { ascending: false }).limit(80) : { data: null, error: { message: "Failed to fetch: offline" } };
    if (S.open !== id) return;
    if (r.error && !isNetErr(r.error)) return toast(errMsg(r.error));
    if (r.error) S.messages = ((await cacheGet("msgs:" + id)) || []).slice();
    else {
      S.messages = (r.data || []).reverse();
      cacheSet("msgs:" + id, S.messages.slice(-80));
    }
    S.loadedChat = id;
    await prepMsgs(S.messages, c);
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
      else text = shown(r) || (r.kind === "sticker" ? "Стикер" : r.kind === "video" ? "Видео" : r.kind === "audio" ? "Музыка" : "Фото");
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
      if (m.kind === "image" && m.media_url) b.appendChild(imgEl(m));
      if (m.kind === "video" && m.media_url) b.appendChild(videoCard(m));
      if (m.kind === "audio" && m.media_url) b.appendChild(audioCard(m));
      if (m.kind === "sticker" && m.media_url) {
        b.appendChild(isVideo(m.media_url)
          ? h("video", { class: "sticker-img", src: m.media_url, autoplay: true, loop: true, muted: true, playsinline: true })
          : h("img", { class: "sticker-img", src: m.media_url, alt: "стикер", loading: "lazy" }));
      }
      if (shown(m)) b.appendChild(h("div", { class: "text" }, ...mentionNodes(shown(m))));
    }
    const readAll = me && !deleted && readByAll(m, c);
    const meta = h("div", { class: "meta" },
      m.edited_at && !deleted ? h("span", { text: "изменено" }) : null,
      h("span", { text: hm(m.created_at) }),
      me && !deleted && !m._pending ? h("span", { class: "tick" + (readAll ? " read" : ""), text: c.kind === "channel" ? "✓" : (readAll ? "✓✓" : "✓") }) : null);
    if (m._pending) b.appendChild(h("div", { class: "upl" }, h("span", { class: "spin" })));
    b.appendChild(meta);
    const rx = deleted || m._pending ? null : reactsEl(m);
    if (rx) b.appendChild(rx);
    if (!m._pending) {
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); openMsgMenu(m, c, e.clientX, e.clientY); });
      bindLongPress(b, function (x, y) { openMsgMenu(m, c, x, y); });
    }
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
      await prepMsgs(extra, S.chats.find(function (x) { return x.id === m.chat_id; }));
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
      box.appendChild(bar("Редактирование", shown(S.editing), function () {
        S.editing = null;
        $("input").value = S.drafts.get(S.open) || "";
        autosize();
        renderBars();
      }));
    }
  }
  function previewBody(m) {
    if (m.deleted_at) return "Сообщение удалено";
    return shown(m) || (m.kind === "sticker" ? "Стикер" : m.kind === "video" ? "Видео" : m.kind === "audio" ? "Музыка" : "Фото");
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
      const wasEdit = !!S.editing;
      if (S.editing) await saveEdit(S.editing, text);
      else await sendRow({ kind: "text", body: text });
      if (wasEdit) ta.value = S.drafts.get(c.id) || "";
      else { ta.value = ""; setDraft(c.id, ""); }
      autosize();
    } catch (err) {
      toast(errMsg(err));
    } finally {
      sending = false;
      $("send-btn").disabled = false;
    }
  }

  async function sendRow(fields, pendingId, chat) {
    const c = chat || curChat();
    if (!c) return;
    const row = Object.assign({ chat_id: c.id, sender_id: S.me.id, kind: "text", body: "" }, fields);
    if (S.replyTo) row.reply_to = S.replyTo;
    const plain = row.body;
    if (plain && c.kind === "direct") row.body = await encryptFor(c, plain);
    if (row.media_name && c.kind === "direct") row.media_name = await encryptFor(c, row.media_name);
    if (!navigator.onLine) {
      if (row.kind !== "text") {
        if (pendingId) dropPending(pendingId);
        return toast("Без сети отправляется только текст");
      }
      const lid = "L" + Date.now().toString(36) + rnd();
      if (window.EchoStore) await EchoStore.outboxAdd({ lid: lid, chat_id: c.id, body: row.body, reply_to: row.reply_to || null, created: Date.now() });
      S.replyTo = null;
      renderBars();
      addMessage({ id: lid, chat_id: c.id, sender_id: S.me.id, kind: "text", body: row.body, _plain: plain, created_at: new Date().toISOString(), reactions: [], reply_to: row.reply_to || null });
      return toast("Нет сети. Сообщение отправится, когда появится связь");
    }
    const r = await sb.from("messages").insert(row).select("*").single();
    if (r.error) throw r.error;
    if (pendingId) dropPending(pendingId, true);
    S.replyTo = null;
    renderBars();
    if (row.body !== plain) r.data._plain = plain;
    addMessage(r.data);
    scheduleChats();
  }

  function dropPending(id, quiet) {
    const n = S.messages.length;
    S.messages = S.messages.filter(function (x) { return x.id !== id; });
    if (!quiet && S.messages.length !== n) renderTimeline(false);
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
    const chat = curChat();
    const body = chat ? await outBody(chat, text) : text;
    const r = await sb.from("messages").update({ body: body }).eq("id", m.id).select("*").single();
    if (r.error) throw r.error;
    if (body !== text) r.data._plain = text;
    S.editing = null;
    applyMessageUpdate(r.data);
    renderBars();
  }

  function applyMessageUpdate(row) {
    const m = S.messages.find(function (x) { return x.id === row.id; });
    if (!m) return;
    if (row._plain !== undefined) m._plain = row._plain;
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
    $("input").value = shown(m) || "";
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
      const more = h("button", { type: "button", text: "+", "aria-label": "Все эмодзи", onclick: function () { openEmojiSheet(m); } });
      bar.appendChild(more);
      items.push(bar);
      if (canPost(c)) items.push(mi("Ответить", ICON.reply, function () { S.replyTo = m.id; S.editing = null; renderBars(); $("input").focus(); }));
      if (shown(m)) items.push(mi("Копировать", ICON.copy, function () { copyText(shown(m)); }));
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
      mi(c.archived ? "Вернуть из архива" : "В архив", ICON.pin, function () { toggleArchive(c); }),
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
  async function toggleArchive(c) {
    const v = !c.archived;
    const r = await sb.from("chat_members").update({ archived: v }).eq("chat_id", c.id).eq("user_id", S.me.id);
    if (r.error) return toast(errMsg(r.error));
    c.archived = v;
    if (v && S.folder === "archived" && !S.chats.some(function (x) { return x.archived; })) S.folder = "all";
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
          const fwd = await forwardPayload(m, c);
          const r = await sb.from("messages").insert({
            chat_id: c.id, sender_id: S.me.id, kind: m.kind, body: await outBody(c, shown(m) || ""),
            media_url: fwd.url, forwarded_from: who,
            media_name: fwd.meta ? await outBody(c, fwd.meta) : null, media_quality: m.media_quality || null
          }).select("*").single();
          if (r.error) return toast(errMsg(r.error));
          toast("Переслано: " + chatTitle(c));
          if (S.open === c.id) {
            r.data._plain = shown(m) || "";
            r.data._pname = mediaName(m) || null;
            addMessage(r.data);
          }
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

  function pickFile(accept, cb, multi) {
    const el = $("picker");
    el.accept = accept;
    el.multiple = !!multi;
    el.value = "";
    el.onchange = function () {
      const list = Array.from(el.files || []);
      if (!list.length) return;
      cb(multi ? list : list[0]);
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
    if (opt.chat) {
      const enc = await storeBlob(blob, ext, blob.type || file.type, opt.chat, "");
      return { url: enc.url, animated: animated, meta: enc.meta };
    }
    const path = S.me.id + "/" + folder + "/" + Date.now().toString(36) + rnd() + "." + ext;
    const up = await sb.storage.from("media").upload(path, blob, { contentType: blob.type || file.type, upsert: false });
    if (up.error) throw up.error;
    return { url: sb.storage.from("media").getPublicUrl(path).data.publicUrl, animated: animated };
  }

  const VIDEO_ORIG = ["video/mp4", "video/webm"];
  const QLABEL = { orig: "Оригинал", "720p": "720p", "480p": "480p", "360p": "360p" };
  function qualityLabel(q) { return QLABEL[q] || ""; }
  function mediaName(m) { return m._pname !== undefined ? m._pname : m.media_name; }

  async function uploadMedia(blob, ext, type) {
    const path = S.me.id + "/media/" + Date.now().toString(36) + rnd() + "." + ext;
    const up = await sb.storage.from("media").upload(path, blob, { contentType: type, upsert: false });
    if (up.error) throw up.error;
    return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  const ATTACH_MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", wav: "audio/wav" };

  function fileTitle(f) { return f.name.replace(/\.[^.]+$/, "").slice(0, 200) || "Аудио"; }

  function attachTile(title, sub, d, color, fn) {
    return h("button", { class: "attach-tile", type: "button", onclick: fn },
      h("span", { class: "at-ico", style: { background: color } }, svg(d, "at-svg")),
      h("b", { text: title }),
      h("small", { text: sub }));
  }

  function attachMenu() {
    const c = curChat();
    if (!c || !canPost(c)) return;
    openSheet("Прикрепить", function (b) {
      b.appendChild(h("div", { class: "attach-grid" },
        attachTile("Галерея", "фото и видео", ICON.imgs, "#8b5cf6", function () { closeSheet(); pickGallery(); }),
        attachTile("Музыка", "аудиофайлы", ICON.music, "#6366f1", function () { closeSheet(); pickFile("audio/*", attachFiles, true); })));
    });
  }

  async function galleryFile(r) {
    const src = r.webPath || window.Capacitor.convertFileSrc(r.path);
    const blob = await (await fetch(src)).blob();
    const name = String(r.path || src).split("?")[0];
    const ext = (name.split(".").pop() || "").toLowerCase();
    const type = blob.type && blob.type !== "application/octet-stream" ? blob.type : ATTACH_MIME[ext] || blob.type;
    return new File([blob], "media." + ext, { type: type });
  }

  async function pickGallery() {
    const Plugins = window.Capacitor && window.Capacitor.Plugins;
    if (!Plugins || !Plugins.Camera) return pickFile("image/*,video/*", attachFiles, true);
    let res;
    try {
      // mediaType: 2 = MediaTypeSelection.All (строка "all" плагин не понимает и берёт фото)
      res = await Plugins.Camera.chooseFromGallery({ mediaType: 2, allowMultipleSelection: true, limit: 10 });
    } catch (e) {
      if (!/cancel/i.test(String((e && (e.message || e.code)) || ""))) toast("Галерея не открылась");
      return;
    }
    const files = [];
    for (const r of res.results || []) {
      try { files.push(await galleryFile(r)); } catch (e) { toast("Не удалось открыть файл"); }
    }
    if (files.length) attachFiles(files);
  }

  async function attachFiles(files) {
    const c = curChat();
    if (!c || !canPost(c) || !files || !files.length) return;
    const list = files.filter(function (f) { return /^(image|video|audio)\//.test(f.type); });
    if (list.length < files.length) toast("Некоторые файлы не поддерживаются");
    if (!list.length) return;
    const videos = list.filter(function (f) { return f.type.indexOf("video/") === 0; });
    if (!videos.length) return queueMedia(c, list, null);
    chooseVideoQuality(videos, function (key) { queueMedia(c, list, key); });
  }

  function chooseVideoQuality(videos, done) {
    const orig = videos.every(function (f) { return VIDEO_ORIG.indexOf(f.type) >= 0; });
    const canEncode = EchoMedia.canTranscode();
    if (!orig && !canEncode) return toast("Этот формат не поддерживается. Выбери MP4 или WebM");
    const opts = [];
    if (orig) opts.push(["orig", "Оригинал", "без сжатия, до 20 МБ"]);
    if (canEncode) {
      opts.push(["720", "720p", "HD, лучшее качество"]);
      opts.push(["480", "480p", "баланс качества и размера"]);
      opts.push(["360", "360p", "экономия трафика"]);
    }
    openSheet("Качество видео", function (b) {
      opts.forEach(function (o) {
        b.appendChild(rowBtn(rowIco(ICON.globe, "#8b5cf6"), o[1], o[2], function () {
          closeSheet();
          done(o[0]);
        }));
      });
    });
  }

  function addPending(c, f, caption, key) {
    const kind = f.type.indexOf("video/") === 0 ? "video" : f.type.indexOf("audio/") === 0 ? "audio" : "image";
    const url = URL.createObjectURL(f);
    const m = {
      id: "P" + Date.now().toString(36) + rnd(), chat_id: c.id, sender_id: S.me.id, kind: kind, body: caption,
      media_url: url, _localUrl: url, _pending: true,
      media_quality: kind === "video" && key ? (key === "orig" ? "orig" : key + "p") : null,
      media_name: kind === "audio" ? fileTitle(f) : null,
      created_at: new Date().toISOString(), reactions: [], reply_to: null
    };
    addMessage(m);
    return m;
  }

  function queueMedia(c, list, key) {
    const caption = $("input").value.trim();
    $("input").value = "";
    autosize();
    const items = list.map(function (f, i) { return { file: f, msg: addPending(c, f, i === 0 ? caption : "", key) }; });
    (async function () {
      for (const it of items) await sendPending(c, it.file, it.msg, key);
    })();
  }

  async function sendPending(c, f, m, key) {
    try {
      if (f.type.indexOf("video/") === 0) {
        let blob = f;
        if (key && key !== "orig") blob = await EchoMedia.transcode(f, Number(key), function () {});
        if (blob.size > 20 * MB - 4096) throw new Error("Видео больше 20 МБ, выбери качество ниже");
        const ext = blob.type.indexOf("mp4") >= 0 ? "mp4" : "webm";
        const res = await storeBlob(blob, ext, blob.type, c, "");
        await sendRow({ kind: "video", media_url: res.url, body: m.body, media_quality: m.media_quality, media_name: res.meta }, m.id, c);
      } else if (f.type.indexOf("audio/") === 0) {
        if (f.size > 20 * MB - 4096) throw new Error("Аудио больше 20 МБ");
        const ext = ((f.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)) || "mp3";
        const res = await storeBlob(f, ext, f.type, c, m.media_name);
        await sendRow({ kind: "audio", media_url: res.url, body: m.body, media_name: res.meta }, m.id, c);
      } else {
        const res = await prepareAndUpload(f, "media", { maxSide: 1280, maxBytes: 20 * MB - 4096, quality: 0.86, chat: c });
        await sendRow({ kind: "image", media_url: res.url, body: m.body, media_name: res.meta }, m.id, c);
      }
    } catch (e) {
      dropPending(m.id);
      toast(e && e.message === "NO_TRANSCODE" ? "Сжатие на этом устройстве не работает" : errMsg(e));
    } finally {
      URL.revokeObjectURL(m._localUrl);
    }
  }

  function parseMeta(raw) {
    try {
      const o = JSON.parse(raw);
      if (o && typeof o === "object") return o;
    } catch (e) {
      return { n: raw };
    }
    return { n: raw };
  }

  function extFor(t) {
    const map = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/ogg": "ogg", "audio/wav": "wav", "audio/webm": "webm" };
    return map[t] || "bin";
  }

  async function storeBlob(blob, ext, type, c, name) {
    if (c.kind !== "direct") return { url: await uploadMedia(blob, ext, type), meta: name || null };
    if (!E2E.priv) throw new Error("На этом устройстве нет ключа шифрования");
    if (!(await chatKeyFor(c.otherId))) throw new Error("У собеседника ещё нет ключа шифрования");
    const enc = await EchoE2E.encryptBytes(await blob.arrayBuffer());
    const url = await uploadMedia(enc.data, "bin", "application/octet-stream");
    return { url: url, meta: JSON.stringify({ n: name || "", k: enc.key, i: enc.iv, t: type || "application/octet-stream" }) };
  }

  async function decryptedBlob(m) {
    const r = await fetch(m.media_url);
    if (!r.ok) throw new Error("Не удалось скачать файл");
    const plain = await EchoE2E.decryptBytes(await r.arrayBuffer(), m._pmeta.k, m._pmeta.i);
    return new Blob([plain], { type: m._pmeta.t || "application/octet-stream" });
  }

  const MEDIA_URLS = new Map();
  function mediaUrlOf(m) {
    if (!m._pmeta) return Promise.resolve(m.media_url);
    if (!MEDIA_URLS.has(m.media_url)) {
      const p = decryptedBlob(m).then(function (b) { return URL.createObjectURL(b); }, function (e) {
        MEDIA_URLS.delete(m.media_url);
        throw e;
      });
      MEDIA_URLS.set(m.media_url, p);
    }
    return MEDIA_URLS.get(m.media_url);
  }

  function openMedia(m, kind) {
    mediaUrlOf(m).then(function (u) { lightbox(u, kind, m); }, function (e) { toast(errMsg(e)); });
  }

  function mediaEl(m, tag, props) {
    if (!m._pmeta) return h(tag, Object.assign({ src: m.media_url }, props));
    const el = h(tag, props);
    mediaUrlOf(m).then(function (u) { el.src = u; }, function () { el.classList.add("broken"); });
    return el;
  }

  function lockNote() {
    return h("div", { class: "gone", text: "🔒 Медиа недоступно на этом устройстве" });
  }

  function imgEl(m) {
    if (m._plock) return lockNote();
    const el = mediaEl(m, "img", { class: "media", alt: "фото", loading: "lazy" });
    el.addEventListener("click", function () { openMedia(m, "image"); });
    return el;
  }

  async function forwardPayload(m, c) {
    if (!m.media_url) return { url: null, meta: null };
    if (m._pmeta && c.kind !== "direct") {
      const b = await decryptedBlob(m);
      const url = await uploadMedia(b, extFor(m._pmeta.t), m._pmeta.t || "application/octet-stream");
      return { url: url, meta: m._pname || null };
    }
    if (m._pmeta) return { url: m.media_url, meta: JSON.stringify(m._pmeta) };
    return { url: m.media_url, meta: mediaName(m) || null };
  }

  const THUMBS = new Map();

  function durText(sec) {
    const t = Math.max(0, Math.floor(isFinite(sec) ? sec : 0));
    return Math.floor(t / 60) + ":" + pad2(t % 60);
  }

  function captureFrame(url) {
    return new Promise(function (resolve, reject) {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      if (url.indexOf("blob:") !== 0) v.crossOrigin = "anonymous";
      v.onerror = function () { reject(new Error("thumb")); };
      let ready = false;
      const seekThumb = function () { v.currentTime = Math.max(0.1, Math.min(1, v.duration * 0.1)); };
      v.onloadedmetadata = function () {
        if (isFinite(v.duration)) { ready = true; return seekThumb(); }
        v.currentTime = 1e101;
      };
      v.ontimeupdate = function () {
        if (!ready && isFinite(v.duration)) { ready = true; seekThumb(); }
      };
      v.onseeked = function () {
        if (!ready) return;
        const w = v.videoWidth;
        const hh = v.videoHeight;
        if (!w || !hh) return reject(new Error("thumb"));
        const k = Math.min(1, 640 / Math.max(w, hh));
        const cv = document.createElement("canvas");
        cv.width = Math.round(w * k);
        cv.height = Math.round(hh * k);
        cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height);
        cv.toBlob(function (bl) {
          if (!bl) return reject(new Error("thumb"));
          resolve({ url: URL.createObjectURL(bl), duration: v.duration, w: w, h: hh });
        }, "image/jpeg", 0.82);
      };
      v.src = url;
    });
  }

  function videoThumb(m) {
    const key = m.media_url;
    if (!THUMBS.has(key)) {
      const p = mediaUrlOf(m).then(captureFrame).catch(function () {
        THUMBS.delete(key);
        return null;
      });
      THUMBS.set(key, p);
    }
    return THUMBS.get(key);
  }

  function videoCard(m) {
    if (m._plock) return lockNote();
    const box = h("div", { class: "vcard", role: "button", tabindex: "0", "aria-label": "Открыть видео" });
    const img = h("img", { class: "vthumb", alt: "" });
    const dur = h("span", { class: "vdur" });
    box.appendChild(img);
    box.appendChild(dur);
    if (!m._pending) box.appendChild(h("span", { class: "vplay" }, svg(ICON.play, "vplay-ico")));
    if (m.media_quality) box.appendChild(h("span", { class: "vq", text: qualityLabel(m.media_quality) }));
    videoThumb(m).then(function (t) {
      if (!t) return;
      img.src = t.url;
      dur.textContent = durText(t.duration);
      box.style.aspectRatio = t.w + " / " + t.h;
    });
    box.addEventListener("click", function (e) {
      e.stopPropagation();
      openMedia(m, "video");
    });
    return box;
  }

  function audioCard(m) {
    if (m._plock) return lockNote();
    return h("div", { class: "acard" },
      h("div", { class: "atitle", text: mediaName(m) || "Аудио" }),
      mediaEl(m, "audio", { controls: true, preload: "metadata" }));
  }

  function closeLightbox() {
    $("lightbox").classList.add("hidden");
    clear($("lightbox"));
  }

  function setIco(el, d) {
    el.querySelector("path").setAttribute("d", d);
  }

  function videoPlayer(url) {
    const v = h("video", { src: url, playsinline: true, autoplay: true, preload: "auto" });
    const box = h("div", { class: "vp" });
    const center = h("button", { class: "vp-center", type: "button", "aria-label": "Воспроизвести" }, svg(ICON.play, "vp-solid"));
    const small = h("button", { class: "vp-btn", type: "button", "aria-label": "Пауза" }, svg(ICON.play, "vp-solid"));
    const mute = h("button", { class: "vp-btn", type: "button", "aria-label": "Звук" }, svg(ICON.vol, "vp-ico"));
    const fill = h("i", { class: "vp-fill" });
    const knob = h("i", { class: "vp-knob" });
    const bar = h("div", { class: "vp-bar" }, fill, knob);
    const cur = h("span", { text: "0:00" });
    const total = h("span", { text: "0:00" });
    const bottom = h("div", { class: "vp-bottom" },
      bar,
      h("div", { class: "vp-row" }, small, h("span", { class: "vp-time" }, cur, " / ", total), h("span", { class: "vp-sp" }), mute));
    box.appendChild(v);
    box.appendChild(center);
    box.appendChild(bottom);

    const togglePlay = function () {
      if (v.paused) v.play().catch(function () {});
      else v.pause();
    };
    const sync = function () {
      const d = v.duration || 0;
      const p = d ? Math.min(1, v.currentTime / d) : 0;
      fill.style.width = (p * 100) + "%";
      knob.style.left = (p * 100) + "%";
      cur.textContent = durText(v.currentTime);
      total.textContent = durText(d);
      setIco(small, v.paused ? ICON.play : ICON.pause);
      setIco(center, v.paused ? ICON.play : ICON.pause);
      setIco(mute, v.muted || v.volume === 0 ? ICON.muted : ICON.vol);
      box.classList.toggle("paused", v.paused);
    };
    let idleT = null;
    const wake = function () {
      box.classList.remove("idle");
      clearTimeout(idleT);
      if (!v.paused) idleT = setTimeout(function () { box.classList.add("idle"); }, 2400);
    };
    box.addEventListener("pointermove", wake);
    box.addEventListener("pointerdown", wake);
    let fixing = false;
    v.addEventListener("loadedmetadata", function () {
      if (isFinite(v.duration)) return;
      fixing = true;
      v.currentTime = 1e101;
    });
    v.addEventListener("durationchange", function () {
      if (!fixing || !isFinite(v.duration)) return;
      fixing = false;
      v.currentTime = 0;
    });
    v.addEventListener("click", togglePlay);
    center.addEventListener("click", function (e) { e.stopPropagation(); togglePlay(); });
    small.addEventListener("click", function (e) { e.stopPropagation(); togglePlay(); });
    mute.addEventListener("click", function (e) { e.stopPropagation(); v.muted = !v.muted; sync(); });
    v.addEventListener("play", function () { wake(); sync(); });
    v.addEventListener("pause", function () { clearTimeout(idleT); box.classList.remove("idle"); sync(); });
    ["timeupdate", "loadedmetadata", "durationchange", "volumechange", "ended"].forEach(function (ev) { v.addEventListener(ev, sync); });
    let drag = false;
    const seek = function (e) {
      const r = bar.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      if (v.duration) v.currentTime = x * v.duration;
      sync();
    };
    bar.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
      drag = true;
      bar.setPointerCapture(e.pointerId);
      seek(e);
    });
    bar.addEventListener("pointermove", function (e) { if (drag) seek(e); });
    bar.addEventListener("pointerup", function () { drag = false; });
    bar.addEventListener("pointercancel", function () { drag = false; });
    sync();
    return box;
  }

  function lightbox(url, kind, m) {
    const lb = $("lightbox");
    clear(lb);
    const isVid = kind === "video" || (!kind && isVideo(url));
    const who = m ? (m.sender_id === S.me.id ? "Вы" : pName(S.profiles.get(m.sender_id))) : "";
    const type = m && m._pmeta ? m._pmeta.t : (isVid ? "video/mp4" : "image/jpeg");
    lb.appendChild(h("div", { class: "lb-top" },
      h("button", { class: "lb-btn", type: "button", "aria-label": "Закрыть", onclick: closeLightbox }, svg(ICON.lbClose, "lb-ico")),
      h("div", { class: "lb-title" }, h("b", { text: who }), m && m.created_at ? h("small", { text: hm(m.created_at) }) : null),
      h("a", { class: "lb-btn", href: url, download: "echo-" + Date.now().toString(36) + "." + extFor(type), "aria-label": "Сохранить" }, svg(ICON.lbDownload, "lb-ico"))));
    if (isVid) lb.appendChild(h("div", { class: "lb-body lb-vid" }, videoPlayer(url)));
    else lb.appendChild(h("div", { class: "lb-body" }, h("img", { src: url, alt: "" })));
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

  function ppProfile() { return PP.uid === S.me.id ? S.profile : (S.profiles.get(PP.uid) || null); }
  function ppBg(p) { return (p && p.profile_bg) || "#5b21b6"; }
  function profilePageOpen() { return !$("profile-page").classList.contains("hidden"); }

  function openProfilePage(uid) {
    const p = uid === S.me.id ? S.profile : S.profiles.get(uid);
    if (!p) return;
    closeSheet();
    hideCtx();
    PP.uid = uid;
    $("profile-page").classList.remove("hidden");
    $("pp-scroll").scrollTop = 0;
    renderProfilePage();
    onPpScroll();
    playProfileMusic(p);
  }

  function closeProfilePage() {
    PP.uid = null;
    $("profile-page").classList.add("hidden");
    const a = $("pp-audio");
    a.pause();
    a.removeAttribute("src");
    a.load();
    hideCtx();
    syncMusic();
  }

  function onPpScroll() {
    const sc = Math.max(0, $("pp-scroll").scrollTop);
    const pr = Math.min(1, sc / 60);
    const full = Math.round(Math.min(540, Math.max(400, innerHeight * 0.52)));
    const hh = Math.max(360, full - sc);
    $("pp-hero").style.height = hh + "px";
    $("pp-body").style.marginTop = (full - hh) + "px";
    $("pp-over").classList.toggle("pp-over-c", pr >= 0.5);
    $("profile-page").style.setProperty("--p", pr.toFixed(3));
  }

  function pRow(label, value) {
    return h("div", { class: "pp-row" }, h("span", { text: value }), h("small", { text: label }));
  }
  function actBtn(label, d, fn) {
    return h("button", { class: "pp-act", type: "button", onclick: fn }, svg(d, "pp-act-ico"), h("span", { text: label }));
  }

  function renderProfilePage() {
    const p = ppProfile();
    if (!p) return;
    const own = p.id === S.me.id;
    const bg = ppBg(p);
    $("profile-page").style.setProperty("--pbg", bg);
    $("pp-hero").style.background = bg;
    $("pp-title").textContent = pName(p);
    const av = $("pp-av");
    av.replaceChildren();
    if (p.avatar_url) {
      av.style.background = "none";
      av.appendChild(isVideo(p.avatar_url)
        ? h("video", { src: p.avatar_url, autoplay: true, muted: true, loop: true, playsinline: true })
        : h("img", { src: p.avatar_url, alt: "" }));
    } else {
      av.style.background = "linear-gradient(135deg," + bg + ",#c026d3)";
      av.appendChild(document.createTextNode(initial(pName(p))));
    }
    const online = isOn(p.id);
    const body = $("pp-body");
    body.replaceChildren();
    const over = $("pp-over");
    over.replaceChildren();
    over.appendChild(h("div", { class: "pp-name", text: pName(p) }));
    if (p.username) over.appendChild(h("div", { class: "pp-user", text: "@" + p.username }));
    over.appendChild(h("div", { class: "pp-seen" + (online ? " on" : ""), text: online ? "в сети" : lastSeenText(p) }));
    const st = statusNode(p);
    if (st) over.appendChild(st);
    const acts = own
      ? [actBtn("Выбрать фото", ICON.camera, function () { pickFile("image/*,video/mp4,video/webm", changeAvatar); }),
         actBtn("Изменить", ICON.edit, myEditSheet),
         actBtn("Настройки", ICON.gear, openSettingsPage)]
      : [actBtn("Написать", ICON.msg, function () { openDirect(p.id); }),
         actBtn("Скопировать ID", ICON.copy, function () { copyText(String(p.uid)); })];
    over.appendChild(h("div", { class: "pp-acts" }, acts));
    if (p.music_url) body.appendChild(musicCard(p));
    const info = h("div", { class: "pp-card" });
    if (p.bio) info.appendChild(pRow("О себе", p.bio));
    info.appendChild(pRow("Имя пользователя", p.username ? "@" + p.username : "не задан"));
    info.appendChild(pRow("ID", String(p.uid || "—")));
    info.appendChild(pRow("Статус", online ? "в сети" : lastSeenText(p)));
    body.appendChild(info);
    syncMusic();
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), sc = Math.floor(sec % 60);
    return m + ":" + (sc < 10 ? "0" : "") + sc;
  }
  function musicCard(p) {
    const card = h("div", { class: "pp-music" },
      h("div", { class: "pp-disc" }, svg(ICON.note, "pp-note")),
      h("div", { class: "pp-m-main" },
        h("b", { text: p.music_title || "Трек" }),
        h("span", { class: "pp-m-sub" }, h("span", { class: "pp-eq" }, h("i"), h("i"), h("i")), "Музыка профиля"),
        h("div", { class: "pp-bar", onclick: seekMusic }, h("i", { class: "pp-fill" })),
        h("div", { class: "pp-times" }, h("span", { class: "pp-cur", text: "0:00" }), h("span", { class: "pp-dur" }))),
      h("button", { class: "pp-play", type: "button", "aria-label": "Играть или пауза", onclick: toggleMusic }));
    card.style.setProperty("--pbg", ppBg(p));
    return card;
  }
  function syncMusic() {
    const a = $("pp-audio");
    const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : 0;
    const pct = dur ? Math.min(100, a.currentTime / dur * 100) : 0;
    document.querySelectorAll(".pp-music").forEach(function (c) {
      c.classList.toggle("playing", !a.paused);
      c.querySelector(".pp-fill").style.width = pct + "%";
      c.querySelector(".pp-cur").textContent = fmtTime(a.currentTime);
      c.querySelector(".pp-dur").textContent = dur ? fmtTime(dur) : "";
    });
    document.querySelectorAll(".pp-play").forEach(function (b) {
      b.replaceChildren(svg(a.paused ? ICON.play : ICON.pause, "pp-play-ico"));
    });
  }
  function seekMusic(e) {
    const a = $("pp-audio");
    if (!a.duration || !isFinite(a.duration)) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * a.duration;
    syncMusic();
  }
  function toggleMusic() {
    const a = $("pp-audio");
    if (a.paused) a.play().catch(function () { toast("Нажми ещё раз, чтобы включить музыку"); });
    else a.pause();
  }
  function playProfileMusic(p) {
    const a = $("pp-audio");
    a.pause();
    if (!p || !p.music_url) {
      a.removeAttribute("src");
      a.load();
      syncMusic();
      return;
    }
    a.src = p.music_url;
    a.play().catch(function () { syncMusic(); });
    syncMusic();
  }

  function rowIco(d, color) {
    return h("span", { class: "sp-ico", style: { background: color } }, svg(d, "ico-s"));
  }
  function openSettingsPage() {
    closeSheet();
    hideCtx();
    renderSettingsPage();
    $("settings-page").classList.remove("hidden");
    $("sp-body").scrollTop = 0;
  }
  function closeSettingsPage() {
    $("settings-page").classList.add("hidden");
    hideCtx();
  }
  function settingsPageOpen() { return !$("settings-page").classList.contains("hidden"); }
  function spGroup(rows) {
    const g = h("div", { class: "sp-group" });
    rows.forEach(function (r) { g.appendChild(r); });
    return g;
  }
  async function notifyPermission() {
    const LN = nativeNotifier();
    if (LN) {
      try {
        const ok = await nativeNotifyPermission(LN);
        return toast(ok ? "Уведомления включены" : "Уведомления не разрешены");
      } catch (e) { return toast("Не получилось включить уведомления"); }
    }
    if (!("Notification" in window)) return toast("Браузер не поддерживает уведомления");
    const perm = await Notification.requestPermission();
    toast(perm === "granted" ? "Уведомления включены" : "Уведомления не разрешены");
  }
  async function installApp() {
    const e = S.installEvt;
    S.installEvt = null;
    e.prompt();
    renderSettingsPage();
  }
  function logoutOthersConfirm() {
    confirmDlg("Выйти на других устройствах?", "Echo на остальных телефонах и в браузерах попросит войти заново. Этот телефон останется в аккаунте.", "Выйти", async function () {
      const r = await sb.auth.signOut({ scope: "others" });
      if (r && r.error) return toast(errMsg(r.error));
      toast("Готово");
    });
  }
  function privacySummary(p) {
    return (p.hide_last_seen ? "статус скрыт" : "статус виден") + ", новые чаты " + (p.dm_closed ? "закрыты" : "открыты");
  }
  function choiceRow(title, sub, active, fn) {
    return rowBtn(h("span", { class: "sp-ico", style: { background: active ? "#22c55e" : "rgba(167,139,250,.14)" } }, active ? "✓" : ""), title, sub, fn);
  }
  function privacySheet() {
    openSheet("Приватность", function (b) {
      const p = S.profile;
      b.appendChild(h("div", { class: "ttl", text: "Кто видит, что я в сети" }));
      b.appendChild(choiceRow("Все", "видят «в сети» и время последнего визита", !p.hide_last_seen, function () { setPrivacy({ hide_last_seen: false }); }));
      b.appendChild(choiceRow("Никто", "статус и время последнего визита скрыты", !!p.hide_last_seen, function () { setPrivacy({ hide_last_seen: true }); }));
      b.appendChild(h("div", { class: "ttl", text: "Новые личные чаты" }));
      b.appendChild(choiceRow("Разрешены", "любой может написать тебе первым", !p.dm_closed, function () { setPrivacy({ dm_closed: false }); }));
      b.appendChild(choiceRow("Закрыты", "писать можно только тем, с кем уже есть переписка", !!p.dm_closed, function () { setPrivacy({ dm_closed: true }); }));
    });
  }
  async function setPrivacy(patch) {
    const p = S.profile;
    const hide = patch.hide_last_seen !== undefined ? patch.hide_last_seen : !!p.hide_last_seen;
    const dm = patch.dm_closed !== undefined ? patch.dm_closed : !!p.dm_closed;
    const r = await sb.rpc("set_privacy", { p_hide_last_seen: hide, p_dm_closed: dm });
    if (r.error) return toast(errMsg(r.error));
    applySelf(r.data);
    if (S.presCh) {
      try { if (hide) await S.presCh.untrack(); else await S.presCh.track({ at: Date.now() }); } catch (e) {}
    }
    renderSettingsPage();
    privacySheet();
  }
  function logoutConfirm() {
    confirmDlg("Выйти?", "Сессия на этом устройстве завершится.", "Выйти", async function () {
      await sb.auth.signOut();
      location.reload();
    });
  }
  function renderSettingsPage() {
    const p = S.profile;
    const body = $("sp-body");
    body.replaceChildren();
    body.appendChild(h("div", { class: "sp-head" },
      avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, size: "lg" }),
      h("b", { text: pName(p) }),
      h("span", { text: uTag(p) })));
    body.appendChild(spGroup([
      rowBtn(rowIco(ICON.user, "#3b82f6"), "Аккаунт", "имя, о себе, статус", function () { myEditSheet(); }),
      rowBtn(rowIco(ICON.user, "#4285f4"), "Google", googleLinked(S.me) ? "привязан" : "не привязан, нажми, чтобы привязать", function () { if (googleLinked(S.me)) toast("Google уже привязан"); else linkGoogle(); }),
      rowBtn(rowIco(ICON.brush, "#a855f7"), "Оформление профиля", "фон и музыка профиля", function () { profileStyleSheet(); }),
      rowBtn(rowIco(ICON.hash, "#0ea5e9"), "Мой ID", String(p.uid || "—"), function () { copyText(String(p.uid)); }),
      rowBtn(rowIco(ICON.lock, "#10b981"), "Шифрование личных чатов", E2E.priv ? "включено, ключ на этом устройстве" : "ключ недоступен на этом устройстве", function () { e2eSheet(); })
    ]));
    body.appendChild(spGroup([
      rowBtn(rowIco(ICON.lock, "#64748b"), "Приватность", privacySummary(p), privacySheet)
    ]));
    const notifRows = [
      rowBtn(rowIco(ICON.sticker, "#f97316"), "Стикеры", "паки, свои картинки и GIF", function () { stickerSheet(); }),
      rowBtn(rowIco(ICON.bell, "#ef4444"), "Уведомления", "браузерные, когда приложение свёрнуто", notifyPermission)
    ];
    if (S.installEvt) notifRows.push(rowBtn(rowIco(ICON.install, "#22c55e"), "Установить приложение", "добавить Echo на экран", installApp));
    body.appendChild(spGroup(notifRows));
    if (!S.installEvt) body.appendChild(h("div", { class: "sp-hint", text: "Установка: Android — меню браузера, «Установить приложение». iPhone — Safari, «Поделиться», «На экран «Домой»»." }));
    body.appendChild(spGroup([
      rowBtn(rowIco(ICON.globe, "#8b5cf6"), "Язык", "Русский", function () { toast("Пока только русский"); })
    ]));
    body.appendChild(spGroup([
      rowBtn(rowIco(ICON.exit, "#ef4444"), "Выйти", "из этого аккаунта на устройстве", logoutConfirm, true),
      rowBtn(rowIco(ICON.exit, "#f59e0b"), "Выйти на других устройствах", "остальные телефоны и браузеры", logoutOthersConfirm)
    ]));
  }
  function profileStyleSheet() {
    const p = S.profile;
    openSheet("Оформление профиля", function (b) {
      b.appendChild(h("div", { class: "ttl", text: "Цвет фона" }));
      b.appendChild(h("div", { class: "sp-prev", style: { background: "linear-gradient(135deg," + ppBg(p) + ",#0f0a1d)" } }, "Фон профиля"));
      const sw = h("div", { class: "pp-sw" });
      PALETTE.forEach(function (c) {
        sw.appendChild(h("button", {
          class: "pp-dot" + (p.profile_bg === c ? " on" : ""), type: "button",
          style: { background: c }, "aria-label": "Цвет " + c,
          onclick: function () { setProfileBg(c); }
        }));
      });
      sw.appendChild(h("input", { type: "color", class: "pp-color", value: p.profile_bg || "#5b21b6", "aria-label": "Свой цвет", onchange: function (e) { setProfileBg(e.target.value); } }));
      b.appendChild(sw);
      b.appendChild(h("div", { class: "ttl", text: "Музыка профиля" }));
      if (p.music_url) b.appendChild(musicCard(p));
      b.appendChild(h("div", { class: "hint", text: p.music_url ? "Играет, когда тебя открывают в профиле." : "Загрузи трек: он будет играть, когда тебя открывают в профиле." }));
      b.appendChild(h("div", { class: "btn-row" },
        btnGhost(p.music_url ? "Сменить трек" : "Выбрать трек", function () { pickFile("audio/*", uploadMusic); }),
        p.music_url ? btnDanger("Убрать", removeMusic) : null));
      syncMusic();
    });
  }
  function refreshStyleSheet() {
    if (!$("sheet").classList.contains("hidden") && $("sheet-title").textContent === "Оформление профиля") profileStyleSheet();
  }

  function ppMenu(x, y) {
    const p = ppProfile();
    if (!p) return;
    const items = [mi("Скопировать ID", ICON.copy, function () { copyText(String(p.uid)); })];
    if (p.id !== S.me.id) items.push(mi("Написать", ICON.msg, function () { openDirect(p.id); }));
    showCtx(x, y, items);
  }

  async function openDirect(uid) {
    closeSheet();
    closeProfilePage();
    const r = await sb.rpc("open_direct", { other: uid });
    if (r.error) return toast(errMsg(r.error));
    await loadChats();
    S.folder = S.folder === "unread" || S.folder === "channel" || S.folder === "group" ? "all" : S.folder;
    openChat(r.data);
  }

  function applySelf(row) {
    S.profile = row;
    S.profiles.set(row.id, row);
    cacheSet("me", row);
    renderMeBtn();
    if (profilePageOpen()) renderProfilePage();
    if (settingsPageOpen()) renderSettingsPage();
    renderSidebar();
  }

  async function changeAvatar(f) {
    try {
      toast("Загружаю…");
      const res = await prepareAndUpload(f, "avatar", { maxSide: 1080, maxBytes: 6 * MB, quality: 0.9 });
      const r = await sb.from("profiles").update({ avatar_url: res.url, avatar_animated: res.animated }).eq("id", S.me.id).select("*").single();
      if (r.error) throw r.error;
      applySelf(r.data);
    } catch (e) {
      toast(errMsg(e));
    }
  }

  async function setProfileBg(c) {
    const r = await sb.from("profiles").update({ profile_bg: c }).eq("id", S.me.id).select("*").single();
    if (r.error) return toast(errMsg(r.error));
    applySelf(r.data);
    refreshStyleSheet();
  }

  async function uploadMusic(f) {
    if (!f.type || f.type.indexOf("audio/") !== 0) return toast("Нужен аудиофайл");
    if (f.size > 15 * MB) return toast("Трек больше 15 МБ");
    try {
      toast("Загружаю трек…");
      const ext = ((f.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)) || "mp3";
      const path = S.me.id + "/music/" + Date.now().toString(36) + rnd() + "." + ext;
      const up = await sb.storage.from("media").upload(path, f, { contentType: f.type, upsert: false });
      if (up.error) throw up.error;
      const url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
      const title = f.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Трек";
      const r = await sb.from("profiles").update({ music_url: url, music_title: title }).eq("id", S.me.id).select("*").single();
      if (r.error) throw r.error;
      applySelf(r.data);
      if (profilePageOpen()) playProfileMusic(r.data);
      refreshStyleSheet();
      toast("Трек добавлен");
    } catch (e) {
      toast(errMsg(e));
    }
  }

  async function removeMusic() {
    const r = await sb.from("profiles").update({ music_url: null, music_title: "" }).eq("id", S.me.id).select("*").single();
    if (r.error) return toast(errMsg(r.error));
    applySelf(r.data);
    playProfileMusic(r.data);
    refreshStyleSheet();
  }

  function myEditSheet() {
    const p = S.profile;
    openSheet("Изменить профиль", function (b) {
      const canUn = !p.username || googleLinked(S.me);
      const dn = h("input", { type: "text", maxlength: 64, value: p.display_name || "" });
      const un = h("input", { type: "text", maxlength: 32, value: p.username || "", placeholder: "например, alex_99", disabled: !canUn, autocomplete: "off" });
      const bio = h("textarea", { maxlength: 280 }, p.bio || "");
      const se = h("input", { type: "text", maxlength: 8, value: p.status_emoji || "", placeholder: "например, ^_^" });
      const st = h("input", { type: "text", maxlength: 80, value: p.status_text || "", placeholder: "Например: на работе до 18:00" });
      b.appendChild(h("label", { class: "lab" }, "Имя", dn));
      b.appendChild(h("label", { class: "lab" }, "Username", un));
      b.appendChild(h("p", { class: "hint", text: canUn ? "Латиница, цифры и _, от 3 до 32 символов. Можно не задавать." : "Сменить username можно, когда к аккаунту привязан Google (в настройках)." }));
      b.appendChild(h("label", { class: "lab" }, "О себе", bio));
      b.appendChild(h("div", { class: "ttl", text: "Статус" }));
      b.appendChild(h("label", { class: "lab" }, "Значок статуса", se));
      b.appendChild(h("label", { class: "lab" }, "Текст статуса", st));
      b.appendChild(h("div", { class: "btn-row" }, btnPrimary("Сохранить", async function () {
        if (canUn) {
          const want = un.value.trim().toLowerCase();
          if (want !== (p.username || "")) {
            if (!/^[a-z0-9_]{3,32}$/.test(want)) return toast("Username: 3–32 символа, латиница, цифры и _");
            const ru = await sb.rpc("set_username", { u: want });
            if (ru.error) return toast(errMsg(ru.error));
            applySelf(ru.data);
          }
        }
        const patch = {
          display_name: dn.value.trim(),
          bio: bio.value.trim(),
          status_emoji: se.value.trim(),
          status_text: st.value.trim()
        };
        const r = await sb.from("profiles").update(patch).eq("id", p.id).select("*").single();
        if (r.error) return toast(errMsg(r.error));
        applySelf(r.data);
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
        const r = await sb.from("profiles").select("*").or(profileOr(q)).neq("id", S.me.id).limit(15);
        (r.data || []).forEach(function (p) {
          S.profiles.set(p.id, Object.assign({}, S.profiles.get(p.id) || {}, p));
          res.appendChild(rowBtn(avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, size: "sm" }), pName(p), (uTag(p) ? uTag(p) + " · " : "") + "ID " + p.uid, function () { onPick(p); }));
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
      b.appendChild(h("div", { class: "hint", text: "Участников можно не добавлять: получится группа только с тобой, удобно для заметок." }));
      b.appendChild(h("div", { class: "btn-row" }, btnPrimary("Создать группу", async function () {
        const t = title.value.trim();
        if (!t) return toast("Введи название");
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
      if (p) openProfilePage(p.id);
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
        b.appendChild(rowBtn(avEl({ seed: p.id, name: pName(p), url: p.avatar_url, animated: p.avatar_animated, online: isOn(p.id), size: "sm" }),
          pName(p) + (mem.user_id === S.me.id ? " (вы)" : ""), roleText, function () { openProfilePage(p.id); }));
      });
      if (isAdmin) {
        const add = h("input", { type: "text", placeholder: "Добавить по username или ID" });
        b.appendChild(add);
        b.appendChild(h("div", { class: "btn-row" }, btnGhost("Добавить участника", async function () {
          const u = cleanUser(add.value);
          if (!u) return;
          const found = await findExact(u);
          if (!found) return toast("Такой пользователь не найден");
          const r = { data: found };
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

  function connectRealtime() {
    S.typingCh = sb.channel("gg-typing", { config: { broadcast: { self: false } } });
    S.typingCh.on("broadcast", { event: "typing" }, function (msg) { onTyping(msg.payload); }).subscribe();

    S.presCh = sb.channel("gg-online", { config: { presence: { key: S.me.id } } });
    S.presCh.on("presence", { event: "sync" }, function () {
      S.online = new Set(Object.keys(S.presCh.presenceState()));
      renderSidebar();
      renderHeader();
    }).subscribe(async function (status) {
      if (status === "SUBSCRIBED" && !S.profile.hide_last_seen) await S.presCh.track({ at: Date.now() });
    });

    S.dbCh = sb.channel("gg-db")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, onMessageEvent)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, onReactionEvent)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_members" }, function () { scheduleChats(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, function () { scheduleChats(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, onProfileEvent)
      .subscribe();
  }

  // APK (Capacitor): системные уведомления через плагин LocalNotifications.
  // В браузере плагина нет, работает обычный Notification API.
  function nativeNotifier() {
    const p = window.Capacitor && window.Capacitor.Plugins;
    return (p && p.LocalNotifications) || null;
  }
  async function nativeNotifyPermission(LN) {
    const cur = await LN.checkPermissions();
    let state = cur && cur.display;
    if (state !== "granted") {
      const req = await LN.requestPermissions();
      state = req && req.display;
    }
    if (state === "granted") {
      await LN.createChannel({ id: "messages", name: "Сообщения", importance: 4, visibility: 1 }).catch(function () {});
    }
    return state === "granted";
  }
  function wireNativeNotifications(LN) {
    LN.addListener("localNotificationActionPerformed", function (ev) {
      const chatId = ev && ev.notification && ev.notification.extra && ev.notification.extra.chat;
      if (!chatId) return;
      S.pendingOpen = chatId;
      tryPendingOpen();
    });
  }
  // Тап по уведомлению может прийти раньше, чем загрузились чаты: открываем, когда будут готовы.
  function tryPendingOpen() {
    if (!S.pendingOpen || !S.entered || !S.chats.some(function (x) { return x.id === S.pendingOpen; })) return;
    const id = S.pendingOpen;
    S.pendingOpen = null;
    openChat(id);
  }
  function clearNativeNotifs(chatId) {
    const LN = nativeNotifier();
    if (!LN) return;
    LN.getDeliveredNotifications().then(function (r) {
      const list = ((r && r.notifications) || []).filter(function (n) { return n.extra && n.extra.chat === chatId; });
      if (list.length) LN.removeDeliveredNotifications({ notifications: list.map(function (n) { return { id: n.id, tag: n.tag }; }) });
    }).catch(function () {});
  }
  let nativeNotifId = 1000;
  function notifyFor(m) {
    const c = S.chats.find(function (x) { return x.id === m.chat_id; });
    if (c && c.muted) return;
    const sender = pName(S.profiles.get(m.sender_id));
    const body = (c && c.kind !== "direct" ? sender + ": " : "") + (EchoE2E.isEncrypted(m.body) ? "Новое сообщение" : (m.body || "Вложение"));
    const title = c ? chatTitle(c) : "Echo";
    const LN = nativeNotifier();
    if (LN) {
      // В открытом приложении список и так обновляется сам, системное уведомление не нужно.
      if (!document.hidden) return;
      nativeNotifId = nativeNotifId >= 2147480000 ? 1000 : nativeNotifId + 1;
      LN.schedule({ notifications: [{ id: nativeNotifId, title: title, body: body, channelId: "messages", extra: { chat: m.chat_id }, schedule: { at: new Date(Date.now() + 100) } }] }).catch(function () {});
      return;
    }
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!document.hidden && S.open === m.chat_id) return;
    try {
      new Notification(title, { body: body, tag: m.chat_id, icon: "icon.png" });
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
        const incoming = Object.assign({ reactions: [] }, rec);
        await prepMsgs([incoming], S.chats.find(function (x) { return x.id === rec.chat_id; }));
        addMessage(incoming);
      }
    } else if (p.eventType === "UPDATE") {
      if (S.open === rec.chat_id) {
        await prepMsgs([rec], S.chats.find(function (x) { return x.id === rec.chat_id; }));
        applyMessageUpdate(rec);
      }
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
    const keys = ["display_name", "username", "avatar_url", "avatar_animated", "status_emoji", "status_text", "bio", "profile_bg", "music_url", "music_title"];
    const changed = keys.some(function (k) { return prev[k] !== rec[k]; });
    S.profiles.set(rec.id, Object.assign({}, prev, rec));
    if (rec.id === S.me.id) {
      S.profile = S.profiles.get(rec.id);
      renderMeBtn();
    }
    if (changed) {
      if (profilePageOpen() && PP.uid === rec.id) renderProfilePage();
      renderSidebar();
      if (S.open) {
        renderHeader();
        renderTimeline(false);
      }
    }
  }

  function wire() {
    $("g-login").addEventListener("click", onGoogleLogin);
    $("search").addEventListener("input", onSearchInput);
    $("me-btn").addEventListener("click", function () { openProfilePage(S.me.id); });
    $("settings-btn").addEventListener("click", openSettingsPage);
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
    $("attach-btn").addEventListener("click", attachMenu);
    $("composer").addEventListener("submit", function (e) { e.preventDefault(); submitText(); });
    $("input").addEventListener("input", function () {
      autosize();
      throttleTyping();
      if (S.open && !S.editing) setDraft(S.open, $("input").value);
    });
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
    $("pp-back").addEventListener("click", closeProfilePage);
    $("sp-back").addEventListener("click", closeSettingsPage);
    $("pp-scroll").addEventListener("scroll", onPpScroll, { passive: true });
    $("pp-more").addEventListener("click", function () {
      const r = $("pp-more").getBoundingClientRect();
      ppMenu(Math.max(8, r.right - 230), r.bottom + 6);
    });
    ["play", "pause", "ended", "timeupdate", "loadedmetadata"].forEach(function (ev) { $("pp-audio").addEventListener(ev, syncMusic); });
    $("sheet").addEventListener("click", function (e) { if (e.target === $("sheet")) closeSheet(); });
    $("sheet-x").addEventListener("click", closeSheet);
    $("lightbox").addEventListener("click", function (e) {
      if (e.target !== $("lightbox") && !e.target.classList.contains("lb-body")) return;
      closeLightbox();
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
    if ("serviceWorker" in navigator && !window.Capacitor) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
    const CapApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (CapApp) {
      CapApp.addListener("backButton", function () {
        if (!$("ctx").classList.contains("hidden")) return hideCtx();
        if (!$("sheet").classList.contains("hidden")) return closeSheet();
        if (!$("lightbox").classList.contains("hidden")) {
          $("lightbox").classList.add("hidden");
          clear($("lightbox"));
          return;
        }
        if (settingsPageOpen()) return closeSettingsPage();
        if (profilePageOpen()) return closeProfilePage();
        if (panelMode) return closePanel();
        if (S.open) return closeChat();
        CapApp.exitApp();
      });
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
          h("div", { class: "row2" }, h("span", { class: "pv", text: plainPrev(m.body) }))) ));
    });
    p.appendChild(list);
  }

  async function boot() {
    wire();
    setOffline(!navigator.onLine);
    window.addEventListener("offline", function () { setOffline(true); });
    window.addEventListener("online", function () {
      setOffline(false);
      flushOutbox().then(function () { loadChats(); });
    });
    if (/error_description=/.test(location.hash)) {
      const m = /error_description=([^&]*)/.exec(location.hash);
      toast(decodeURIComponent((m && m[1] || "").replace(/\+/g, " ")) || "Не удалось войти через Google");
      history.replaceState(null, "", location.pathname + location.search);
    }
    const LN = nativeNotifier();
    if (LN) wireNativeNotifications(LN);
    const CapAuth = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (CapAuth) {
      CapAuth.addListener("appUrlOpen", async function (ev) {
        const url = (ev && ev.url) || "";
        if (url.indexOf(APP_AUTH_URL) !== 0) return;
        const hashAt = url.indexOf("#");
        const q = new URLSearchParams(hashAt >= 0 ? url.slice(hashAt + 1) : "");
        if (q.get("error_description")) { toast(q.get("error_description")); return; }
        let res;
        if (q.get("access_token") && q.get("refresh_token")) {
          res = await sb.auth.setSession({ access_token: q.get("access_token"), refresh_token: q.get("refresh_token") });
        } else {
          const code = new URL(url.replace("com.forcontact655.echo://", "https://x/")).searchParams.get("code");
          if (!code) { toast("Не удалось войти через Google"); return; }
          res = await sb.auth.exchangeCodeForSession(code);
        }
        if (res.error) { toast(errMsg(res.error)); return; }
        try { await sb.rpc("ensure_profile"); } catch (e) {}
        enter(res.data.session.user);
      });
    }
    const r = await sb.auth.getSession();
    if (r.data && r.data.session) {
      try { await sb.rpc("ensure_profile"); } catch (e) {}
      return enter(r.data.session.user);
    }
    showAuth();
  }

  boot();
})();
