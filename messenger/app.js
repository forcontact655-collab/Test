"use strict";
(function () {
  const KEY = "gemgram-v1";
  const EDIT_WINDOW = 48 * 3600 * 1000;
  const MAX_LEN = 4096;
  const REACTIONS = [":D", "xD", "=)", ":3", "^_~", "\\o/", "<3", ":(", "o_O", "+1"];
  const EMOJI = [":D", "xD", "=)", ":3", "^_^", "^_~", "-_-", ":(", ":'(", "o_O", ">_<", "\\o/", "<3", "+1", "-1", "=(", ";)", ":P", ":O", "8)", "XD", "(-_-)", "(>_<)", "*_*", "T_T", "^^", "xP", ":S", ":|", "@_@", "0_0", "d(-_-)b", "~o~", "\\m/", "(y)", "(n)", "(!)", "(?)", "(ok)", "(Y)", ":*", "<.>", "8-)", "B)", "(:"];
  const PEOPLE = [
    { name: "Миша", color: "#e17076", online: true },
    { name: "Аня", color: "#7bc862", online: false },
    { name: "Костя", color: "#e5ca77", online: true },
    { name: "Лена", color: "#65aadd", online: false },
    { name: "Дима", color: "#a695e7", online: false },
    { name: "Соня", color: "#ee7aae", online: true }
  ];
  const SUPPORT = { name: "Поддержка Gemgram", color: "#5ce2ce", online: true };
  const GROUP_COLORS = ["#65aadd", "#a695e7", "#e5ca77", "#7bc862", "#ee7aae"];
  const LINES = ["Ок", "Понял(а)", "Ахах, норм", "Да, согласен(на)", "Щас гляну", "Окей, позже отвечу", "Круто! ^_^", "Ну такое :D", "Давай завтра", "=)", "Норм идея", "Ха, а я думал(а) иначе", "Согласен(на) на все 100", "Ой, не знал(а) :O"];
  const CHANNEL_POSTS = ["Новое в Gemgram: реакции и ответы на сообщения ^_~", "Сохраняй важное в Избранное, чтобы не потерять :3", "Папки чатов уже в списке слева =)", "Спасибо, что тестируешь Gemgram \\o/", "Экспорт чата лежит в меню чата, пригодится для архива"];
  const FOLDERS = [["all", "Все"], ["users", "Личные"], ["groups", "Группы"], ["channels", "Каналы"], ["unread", "Непрочитанные"]];

  const $ = function (id) { return document.getElementById(id); };
  const pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  const uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  const now = function () { return Date.now(); };
  const pad = function (n) { return n < 10 ? "0" + n : String(n); };

  function mkMsg(from, text, extra) {
    return Object.assign({ id: uid(), from: from, text: text || "", img: null, ts: now(), status: "sent", replyTo: null, edited: false, fwd: null, reactions: {} }, extra || {});
  }

  function mkChat(type, title, color, extra) {
    return Object.assign({ id: uid(), type: type, title: title, color: color, online: false, pinned: false, muted: false, unread: 0, messages: [], members: [] }, extra || {});
  }

  function seed() {
    const t = now();
    const at = function (mins) { return t - mins * 60000; };
    const saved = mkChat("saved", "Избранное", "#5ce2ce", { pinned: true });
    saved.messages.push(mkMsg("me", "Сюда можно кидать заметки и ссылки :D", { ts: at(60), status: "read" }));
    const misha = mkChat("user", "Миша", PEOPLE[0].color, { online: true, unread: 1 });
    misha.messages.push(mkMsg("Миша", "Глянул новую шахту? Жесть)", { ts: at(12) }));
    const team = mkChat("group", "Дизайн-группа", "#65aadd", { members: ["Аня", "Костя", "Соня"] });
    team.messages.push(mkMsg("Аня", "Кто за тёмную тему по умолчанию?", { ts: at(40) }));
    team.messages.push(mkMsg("Костя", "Я за! =)", { ts: at(38) }));
    const news = mkChat("channel", "Новости Gemgram", "#e5ca77", { unread: 1 });
    news.messages.push(mkMsg("Новости Gemgram", "Добро пожаловать в Gemgram! Это демо: все чаты хранятся на этом устройстве.", { ts: at(30) }));
    const support = mkChat("user", SUPPORT.name, SUPPORT.color, { online: true });
    support.messages.push(mkMsg(SUPPORT.name, "Привет! Напиши что-нибудь, я отвечу :3", { ts: at(5) }));
    return [saved, misha, team, news, support];
  }

  function defaults() {
    return { v: 1, me: { name: "Вы", username: "me", bio: "" }, theme: "system", folder: "all", chats: seed() };
  }

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && Array.isArray(d.chats)) return Object.assign(defaults(), d);
    } catch (e) {
      return defaults();
    }
    return defaults();
  }

  let st = load();
  let warned = false;
  const ui = { open: null, q: "", editId: null, replyId: null, search: false, sq: "", picker: false, typing: {}, bottomLock: true };
  let deferredPrompt = null;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (e) {
      if (!warned) {
        warned = true;
        toast("Память заполнена: удали фото или чаты");
      }
    }
  }

  function find(id) {
    return st.chats.find(function (c) { return c.id === id; }) || null;
  }

  function findMsg(c, id) {
    return c ? c.messages.find(function (m) { return m.id === id; }) || null : null;
  }

  function colorOf(name) {
    const p = PEOPLE.find(function (x) { return x.name === name; });
    return p ? p.color : "#9aa4ad";
  }

  function hm(ts) {
    const d = new Date(ts);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function dayKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  }

  function dayLabel(ts) {
    const today = new Date();
    const yest = new Date(now() - 86400000);
    if (dayKey(ts) === dayKey(today.getTime())) return "Сегодня";
    if (dayKey(ts) === dayKey(yest.getTime())) return "Вчера";
    const d = new Date(ts);
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function shortTime(ts) {
    if (dayKey(ts) === dayKey(now())) return hm(ts);
    const d = new Date(ts);
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1);
  }

  function preview(m, c) {
    if (!m) return "Нет сообщений";
    let who = "";
    if (m.from === "me") who = "Вы: ";
    else if (c.type === "group") who = m.from + ": ";
    const body = m.text ? m.text.replace(/\s+/g, " ") : (m.img ? "Фото" : "");
    return who + body;
  }

  function lastTs(c) {
    const m = c.messages[c.messages.length - 1];
    return m ? m.ts : 0;
  }

  function sortChats(a, b) {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return lastTs(b) - lastTs(a);
  }

  function folderTest(key, c) {
    if (key === "users") return c.type === "user" || c.type === "saved";
    if (key === "groups") return c.type === "group";
    if (key === "channels") return c.type === "channel";
    if (key === "unread") return c.unread > 0;
    return true;
  }

  function note(text) {
    const d = document.createElement("div");
    d.className = "note";
    d.textContent = text;
    return d;
  }

  function avatarEl(c, cls) {
    const a = document.createElement("div");
    a.className = "avatar" + (cls ? " " + cls : "");
    a.style.background = c.color;
    a.textContent = c.type === "saved" ? "*" : c.title.charAt(0).toUpperCase();
    return a;
  }

  function bindItem(el, onClick, onMenu) {
    let timer = null;
    let fired = false;
    el.addEventListener("click", function () {
      if (fired) {
        fired = false;
        return;
      }
      onClick();
    });
    el.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      onMenu(e.clientX, e.clientY);
    });
    el.addEventListener("touchstart", function (e) {
      fired = false;
      const t = e.touches[0];
      timer = setTimeout(function () {
        timer = null;
        fired = true;
        onMenu(t.clientX, t.clientY);
      }, 450);
    }, { passive: true });
    const cancel = function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    el.addEventListener("touchend", cancel);
    el.addEventListener("touchmove", cancel, { passive: true });
  }

  function chatItem(c) {
    const last = c.messages[c.messages.length - 1];
    const el = document.createElement("div");
    el.className = "item" + (c.id === ui.open ? " on" : "") + (c.pinned ? " pinned" : "");
    el.appendChild(avatarEl(c, ""));
    const main = document.createElement("div");
    main.className = "item-main";
    const r1 = document.createElement("div");
    r1.className = "row1";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = c.title;
    const time = document.createElement("span");
    time.className = "time";
    time.textContent = last ? shortTime(last.ts) : "";
    r1.appendChild(name);
    r1.appendChild(time);
    const r2 = document.createElement("div");
    r2.className = "row2";
    const prev = document.createElement("span");
    const typing = ui.typing[c.id];
    prev.className = "prev" + (typing ? " typing" : "");
    prev.textContent = typing ? "печатает..." : preview(last, c);
    r2.appendChild(prev);
    const tail = document.createElement("span");
    tail.className = "tail";
    if (c.muted) {
      const m = document.createElement("span");
      m.className = "mute";
      m.textContent = "без звука";
      tail.appendChild(m);
    }
    if (c.unread > 0) {
      const b = document.createElement("span");
      b.className = "badge" + (c.muted ? " muted" : "");
      b.textContent = String(c.unread);
      tail.appendChild(b);
    }
    r2.appendChild(tail);
    main.appendChild(r1);
    main.appendChild(r2);
    el.appendChild(main);
    bindItem(el, function () { openChat(c.id); }, function (x, y) { chatMenu(c.id, x, y); });
    return el;
  }

  function hitItem(c, m) {
    const el = document.createElement("div");
    el.className = "item hit";
    el.appendChild(avatarEl(c, ""));
    const main = document.createElement("div");
    main.className = "item-main";
    const r1 = document.createElement("div");
    r1.className = "row1";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = c.title;
    const time = document.createElement("span");
    time.className = "time";
    time.textContent = shortTime(m.ts);
    r1.appendChild(name);
    r1.appendChild(time);
    const snip = document.createElement("div");
    snip.className = "snip";
    snip.textContent = (m.from === "me" ? "Вы: " : m.from + ": ") + m.text;
    main.appendChild(r1);
    main.appendChild(snip);
    el.appendChild(main);
    el.addEventListener("click", function () {
      openChat(c.id);
      setTimeout(function () { jumpTo(m.id); }, 60);
    });
    return el;
  }

  function sectionTitle(text) {
    const d = document.createElement("div");
    d.className = "section";
    d.textContent = text;
    return d;
  }

  function renderFolders() {
    const box = $("folders");
    box.innerHTML = "";
    FOLDERS.forEach(function (f) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "folder" + (st.folder === f[0] ? " on" : "");
      b.textContent = f[1];
      b.addEventListener("click", function () {
        st.folder = f[0];
        save();
        renderAll();
      });
      box.appendChild(b);
    });
  }

  function renderChats() {
    const box = $("chats");
    box.innerHTML = "";
    const q = ui.q.trim().toLowerCase();
    const list = st.chats.filter(function (c) {
      if (!folderTest(st.folder, c)) return false;
      if (!q) return true;
      return c.title.toLowerCase().indexOf(q) >= 0;
    }).sort(sortChats);
    list.forEach(function (c) { box.appendChild(chatItem(c)); });
    if (q) {
      const hits = [];
      st.chats.forEach(function (c) {
        c.messages.forEach(function (m) {
          if ((m.text || "").toLowerCase().indexOf(q) >= 0) hits.push({ c: c, m: m });
        });
      });
      hits.sort(function (a, b) { return b.m.ts - a.m.ts; });
      if (hits.length) {
        box.appendChild(sectionTitle("Сообщения"));
        hits.slice(0, 30).forEach(function (h) { box.appendChild(hitItem(h.c, h.m)); });
      }
    }
    if (!box.children.length) box.appendChild(note("Ничего не найдено"));
  }

  function renderChatHead() {
    const c = find(ui.open);
    if (!c) return;
    $("chat-title").textContent = c.title;
    let sub = "";
    const typing = ui.typing[c.id];
    if (c.type === "saved") sub = "только вы";
    else if (c.type === "group") sub = c.members.length + " участников" + (typing ? ", " + typing + " печатает..." : "");
    else if (c.type === "channel") sub = "канал";
    else sub = typing ? "печатает..." : (c.online ? "в сети" : "был(а) недавно");
    $("chat-sub").textContent = sub;
    $("chat-sub").classList.toggle("typing", !!typing);
    const av = $("chat-avatar");
    av.style.background = c.color;
    av.textContent = c.type === "saved" ? "*" : c.title.charAt(0).toUpperCase();
    $("readonly").classList.toggle("hidden", c.type !== "channel");
    $("composer").classList.toggle("hidden", c.type === "channel");
    $("chat-search").classList.toggle("hidden", !ui.search);
  }

  function ticksEl(m) {
    const tk = document.createElement("span");
    tk.className = "ticks" + (m.status === "read" ? " read" : "");
    tk.textContent = m.status === "sent" ? "\u2713" : "\u2713\u2713";
    return tk;
  }

  function msgEl(m, c, prev) {
    const me = m.from === "me";
    const wrap = document.createElement("div");
    wrap.className = "msg " + (me ? "me" : "them");
    wrap.dataset.id = m.id;
    const b = document.createElement("div");
    b.className = "bubble";
    if (c.type === "group" && !me && (!prev || prev.from !== m.from)) {
      const s = document.createElement("div");
      s.className = "sender";
      s.style.color = colorOf(m.from);
      s.textContent = m.from;
      b.appendChild(s);
    }
    if (m.fwd) {
      const f = document.createElement("div");
      f.className = "fwd";
      f.textContent = "Переслано от " + m.fwd;
      b.appendChild(f);
    }
    if (m.replyTo) {
      const q = document.createElement("div");
      q.className = "quote";
      const qn = document.createElement("b");
      qn.textContent = m.replyTo.from === "me" ? "Вы" : m.replyTo.from;
      const qt = document.createElement("span");
      qt.textContent = m.replyTo.text || "Фото";
      q.appendChild(qn);
      q.appendChild(qt);
      q.addEventListener("click", function (e) {
        e.stopPropagation();
        jumpTo(m.replyTo.id);
      });
      b.appendChild(q);
    }
    if (m.img) {
      const im = document.createElement("img");
      im.className = "photo";
      im.src = m.img;
      im.alt = "фото";
      b.appendChild(im);
    }
    if (m.text) {
      const t = document.createElement("div");
      t.className = "text";
      t.textContent = m.text;
      b.appendChild(t);
    }
    const meta = document.createElement("span");
    meta.className = "meta";
    if (m.edited) {
      const e = document.createElement("span");
      e.textContent = "изменено";
      meta.appendChild(e);
    }
    const tm = document.createElement("span");
    tm.textContent = hm(m.ts);
    meta.appendChild(tm);
    if (me) meta.appendChild(ticksEl(m));
    b.appendChild(meta);
    const keys = Object.keys(m.reactions || {}).filter(function (k) { return m.reactions[k].length; });
    if (keys.length) {
      const r = document.createElement("div");
      r.className = "reacts";
      keys.forEach(function (k) {
        const users = m.reactions[k];
        const chip = document.createElement("span");
        chip.className = "react" + (users.indexOf("me") >= 0 ? " mine" : "");
        chip.textContent = users.length > 1 ? k + " " + users.length : k;
        chip.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleReact(m, k);
        });
        r.appendChild(chip);
      });
      b.appendChild(r);
    }
    bindItem(b, function () {}, function (x, y) { msgMenu(c, m, x, y); });
    wrap.appendChild(b);
    return wrap;
  }

  function renderMessages() {
    const c = find(ui.open);
    if (!c) return;
    const box = $("messages");
    const wasBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    const prevTop = box.scrollTop;
    box.innerHTML = "";
    let msgs = c.messages;
    if (ui.search && ui.sq) {
      const q = ui.sq.toLowerCase();
      msgs = msgs.filter(function (m) { return (m.text || "").toLowerCase().indexOf(q) >= 0; });
      $("chat-search-count").textContent = msgs.length ? msgs.length + " найдено" : "";
    } else {
      $("chat-search-count").textContent = "";
    }
    if (!msgs.length) box.appendChild(note(ui.search ? "Ничего не найдено" : "Сообщений пока нет. Напиши первым :D"));
    let lastDay = "";
    let prev = null;
    msgs.forEach(function (m) {
      const dk = dayKey(m.ts);
      if (dk !== lastDay) {
        lastDay = dk;
        const d = document.createElement("div");
        d.className = "day";
        d.textContent = dayLabel(m.ts);
        box.appendChild(d);
        prev = null;
      }
      box.appendChild(msgEl(m, c, prev));
      prev = m;
    });
    if (wasBottom || ui.bottomLock) box.scrollTop = box.scrollHeight;
    else box.scrollTop = prevTop;
    const bottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    ui.bottomLock = bottom;
    $("to-bottom").classList.toggle("hidden", bottom);
  }

  function renderBars() {
    const c = find(ui.open);
    const rb = $("reply-bar");
    const eb = $("edit-bar");
    rb.innerHTML = "";
    eb.innerHTML = "";
    rb.classList.add("hidden");
    eb.classList.add("hidden");
    if (!c) return;
    if (ui.replyId) {
      const m = findMsg(c, ui.replyId);
      if (m) {
        const main = document.createElement("div");
        main.className = "bar-main";
        const b = document.createElement("b");
        b.textContent = "Ответ: " + (m.from === "me" ? "Вы" : m.from);
        const s = document.createElement("span");
        s.textContent = m.text || "Фото";
        main.appendChild(b);
        main.appendChild(s);
        rb.appendChild(main);
        rb.appendChild(closeBtn(function () { ui.replyId = null; renderBars(); }));
        rb.classList.remove("hidden");
      } else {
        ui.replyId = null;
      }
    }
    if (ui.editId) {
      const m = findMsg(c, ui.editId);
      if (m) {
        const main = document.createElement("div");
        main.className = "bar-main";
        const b = document.createElement("b");
        b.textContent = "Редактирование";
        const s = document.createElement("span");
        s.textContent = m.text;
        main.appendChild(b);
        main.appendChild(s);
        eb.appendChild(main);
        eb.appendChild(closeBtn(function () {
          ui.editId = null;
          $("input").value = "";
          autosize();
          renderBars();
        }));
        eb.classList.remove("hidden");
      } else {
        ui.editId = null;
      }
    }
  }

  function closeBtn(fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "icon-btn";
    b.setAttribute("aria-label", "Отмена");
    b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    b.addEventListener("click", fn);
    return b;
  }

  function renderAll() {
    applyTheme();
    renderFolders();
    renderChats();
    const c = find(ui.open);
    if (c) {
      $("empty").classList.add("hidden");
      $("chat").classList.remove("hidden");
      renderChatHead();
      renderMessages();
      renderBars();
      autosize();
    } else {
      $("empty").classList.remove("hidden");
      $("chat").classList.add("hidden");
      $("app").classList.remove("show-chat");
    }
  }

  function openChat(id) {
    const c = find(id);
    if (!c) return;
    ui.open = id;
    ui.editId = null;
    ui.replyId = null;
    ui.search = false;
    ui.sq = "";
    ui.picker = false;
    ui.bottomLock = true;
    c.unread = 0;
    $("input").value = "";
    $("chat-search-input").value = "";
    $("emoji-pick").classList.add("hidden");
    $("app").classList.add("show-chat");
    save();
    renderAll();
  }

  function closeChat() {
    ui.open = null;
    ui.editId = null;
    ui.replyId = null;
    $("app").classList.remove("show-chat");
    renderAll();
  }

  function jumpTo(id) {
    const el = document.querySelector('#messages [data-id="' + id + '"]');
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("flash");
    setTimeout(function () { el.classList.remove("flash"); }, 1200);
  }

  function setStatusLater(m) {
    setTimeout(function () {
      if (m.status === "sent") {
        m.status = "delivered";
        save();
        renderMessages();
      }
    }, 400);
  }

  function replyFor(text) {
    if (/привет|здаров|hi|hello/i.test(text)) return "Привет! :D";
    if (/\?/.test(text)) return "Хм, дай подумаю...";
    if (/шахт|самоцв|игр/i.test(text)) return "О, шахта! Уже на 10k самоцветов =)";
    return pick(LINES);
  }

  function scheduleReply(c, text) {
    if (c.type === "saved" || c.type === "channel") return;
    if (ui.typing[c.id]) return;
    const who = c.type === "group" ? pick(c.members) : c.title;
    ui.typing[c.id] = who;
    renderAll();
    setTimeout(function () {
      delete ui.typing[c.id];
      const m = mkMsg(who, replyFor(text), {});
      c.messages.push(m);
      c.messages.forEach(function (x) {
        if (x.from === "me" && x.status !== "read") x.status = "read";
      });
      const mine = c.messages.filter(function (x) { return x.from === "me"; });
      if (mine.length && Math.random() < 0.35) {
        const target = mine[mine.length - 1];
        const k = pick(REACTIONS);
        target.reactions = target.reactions || {};
        target.reactions[k] = (target.reactions[k] || []).concat([who]);
      }
      if (ui.open !== c.id) c.unread += 1;
      save();
      renderAll();
    }, 1200 + Math.random() * 1800);
  }

  function quoteOf(c, id) {
    const m = findMsg(c, id);
    if (!m) return null;
    return { id: m.id, from: m.from, text: m.text || (m.img ? "Фото" : "") };
  }

  function autosize() {
    const input = $("input");
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 140) + "px";
  }

  function sendText() {
    const c = find(ui.open);
    if (!c || c.type === "channel") return;
    const input = $("input");
    const text = input.value.trim();
    if (!text) return;
    if (text.length > MAX_LEN) {
      toast("Слишком длинное сообщение");
      return;
    }
    if (ui.editId) {
      const m = findMsg(c, ui.editId);
      if (m) {
        m.text = text;
        m.edited = true;
      }
      ui.editId = null;
    } else {
      const m = mkMsg("me", text, { replyTo: ui.replyId ? quoteOf(c, ui.replyId) : null });
      c.messages.push(m);
      ui.replyId = null;
      setStatusLater(m);
      scheduleReply(c, text);
    }
    input.value = "";
    autosize();
    ui.bottomLock = true;
    save();
    renderAll();
  }

  function sendImage(dataUrl, caption) {
    const c = find(ui.open);
    if (!c || c.type === "channel") return;
    const m = mkMsg("me", caption, { img: dataUrl, replyTo: ui.replyId ? quoteOf(c, ui.replyId) : null });
    c.messages.push(m);
    ui.replyId = null;
    setStatusLater(m);
    scheduleReply(c, caption || "фото");
    ui.bottomLock = true;
    save();
    renderAll();
  }

  function compressImage(file, cb) {
    const r = new FileReader();
    r.onload = function () {
      const img = new Image();
      img.onload = function () {
        const max = 960;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width * k));
        cv.height = Math.max(1, Math.round(img.height * k));
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { toast("Не получилось открыть картинку"); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function toggleReact(m, k) {
    m.reactions = m.reactions || {};
    const list = m.reactions[k] || [];
    const i = list.indexOf("me");
    if (i >= 0) list.splice(i, 1);
    else list.push("me");
    if (list.length) m.reactions[k] = list;
    else delete m.reactions[k];
    save();
    renderMessages();
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    $("toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("Скопировано"); }, function () { toast("Не получилось скопировать"); });
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("Скопировано"); } catch (e) { toast("Не получилось скопировать"); }
    ta.remove();
  }

  function downloadJSON(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function closeCtx() {
    $("ctx").classList.add("hidden");
    document.removeEventListener("click", outsideCtx);
    document.removeEventListener("contextmenu", outsideCtx);
  }

  function outsideCtx(e) {
    if (!$("ctx").contains(e.target)) closeCtx();
  }

  function item(label, fn, danger) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (danger) b.className = "danger";
    b.addEventListener("click", function () {
      closeCtx();
      fn();
    });
    return b;
  }

  function showCtx(x, y, items) {
    const el = $("ctx");
    el.innerHTML = "";
    items.forEach(function (i) { el.appendChild(i); });
    el.classList.remove("hidden");
    const h = el.offsetHeight;
    el.style.left = Math.max(8, Math.min(x, window.innerWidth - 238)) + "px";
    el.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + "px";
    setTimeout(function () {
      document.addEventListener("click", outsideCtx);
      document.addEventListener("contextmenu", outsideCtx);
    }, 0);
  }

  function msgMenu(c, m, x, y) {
    const items = [];
    if (c.type !== "channel") {
      const bar = document.createElement("div");
      bar.className = "ctx-react";
      REACTIONS.forEach(function (k) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = k;
        b.addEventListener("click", function () {
          closeCtx();
          toggleReact(m, k);
        });
        bar.appendChild(b);
      });
      items.push(bar);
      items.push(item("Ответить", function () {
        ui.replyId = m.id;
        ui.editId = null;
        renderBars();
        $("input").focus();
      }));
    }
    if (m.text) items.push(item("Копировать", function () { copyText(m.text); }));
    items.push(item("Переслать", function () { forwardSheet(m); }));
    if (c.type !== "channel" && m.from === "me" && m.text && now() - m.ts < EDIT_WINDOW) {
      items.push(item("Изменить", function () {
        ui.editId = m.id;
        ui.replyId = null;
        $("input").value = m.text;
        autosize();
        renderBars();
        $("input").focus();
      }));
    }
    items.push(item("Удалить", function () {
      confirmSheet("Удалить сообщение?", "Оно исчезнет с этого устройства.", "Удалить", function () {
        c.messages = c.messages.filter(function (x) { return x.id !== m.id; });
        save();
        renderAll();
      }, true);
    }, true));
    showCtx(x, y, items);
  }

  function chatMenu(id, x, y) {
    const c = find(id);
    if (!c) return;
    const items = [];
    items.push(item(c.pinned ? "Открепить" : "Закрепить", function () {
      c.pinned = !c.pinned;
      save();
      renderAll();
    }));
    items.push(item(c.muted ? "Включить звук" : "Выключить звук", function () {
      c.muted = !c.muted;
      save();
      renderAll();
    }));
    items.push(item("Экспорт чата", function () {
      downloadJSON("gemgram-" + c.title + ".json", { chat: c.title, type: c.type, messages: c.messages });
    }));
    items.push(item("Очистить историю", function () {
      confirmSheet("Очистить историю?", "Все сообщения в чате «" + c.title + "» будут удалены.", "Очистить", function () {
        c.messages = [];
        save();
        renderAll();
      }, true);
    }, true));
    if (c.type !== "saved") {
      items.push(item("Удалить чат", function () {
        confirmSheet("Удалить чат?", "Чат «" + c.title + "» и вся переписка удалятся.", "Удалить", function () {
          st.chats = st.chats.filter(function (x) { return x.id !== c.id; });
          if (ui.open === c.id) ui.open = null;
          save();
          closeChat();
        }, true);
      }, true));
    }
    showCtx(x, y, items);
  }

  function openSheet(title, build) {
    $("sheet-title").textContent = title;
    const body = $("sheet-body");
    body.innerHTML = "";
    build(body);
    $("sheet").classList.remove("hidden");
  }

  function closeSheet() {
    $("sheet").classList.add("hidden");
    $("sheet-body").innerHTML = "";
  }

  function btn(label, cls, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn" + (cls ? " " + cls : "");
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  function rowBtn(c, label, sub, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "row-btn";
    if (c) b.appendChild(avatarEl(c, ""));
    const t = document.createElement("span");
    t.textContent = label;
    if (sub) {
      const s = document.createElement("small");
      s.style.color = "var(--sub)";
      s.style.display = "block";
      s.textContent = sub;
      t.appendChild(s);
    }
    b.appendChild(t);
    b.addEventListener("click", fn);
    return b;
  }

  function confirmSheet(title, text, okLabel, fn, danger) {
    openSheet(title, function (body) {
      const p = document.createElement("div");
      p.className = "text-line";
      p.textContent = text;
      body.appendChild(p);
      const row = document.createElement("div");
      row.className = "btn-row";
      row.appendChild(btn("Отмена", "", closeSheet));
      row.appendChild(btn(okLabel, danger ? "danger" : "primary", function () {
        closeSheet();
        fn();
      }));
      body.appendChild(row);
    });
  }

  function forwardSheet(m) {
    openSheet("Переслать в...", function (body) {
      const targets = st.chats.filter(function (c) { return c.type !== "channel"; });
      if (!targets.length) body.appendChild(note("Некуда переслать"));
      targets.forEach(function (c) {
        body.appendChild(rowBtn(c, c.title, c.type === "saved" ? "Избранное" : "", function () {
          const f = mkMsg("me", m.text, { img: m.img, fwd: m.from === "me" ? st.me.name : m.from });
          c.messages.push(f);
          setStatusLater(f);
          closeSheet();
          toast("Переслано в «" + c.title + "»");
          save();
          if (ui.open === c.id) renderAll();
          else renderChats();
        }));
      });
    });
  }

  function newChatSheet() {
    openSheet("Новый чат", function (body) {
      body.appendChild(rowBtn(null, "Новая группа", "несколько участников", function () { groupSheet(); }));
      PEOPLE.concat([SUPPORT]).forEach(function (p) {
        const existing = st.chats.find(function (c) { return c.type === "user" && c.title === p.name; });
        body.appendChild(rowBtn({ color: p.color, title: p.name, type: "user" }, p.name, p.online ? "в сети" : "был(а) недавно", function () {
          closeSheet();
          if (existing) {
            openChat(existing.id);
            return;
          }
          const c = mkChat("user", p.name, p.color, { online: p.online });
          c.messages.push(mkMsg(p.name, "Привет! Это " + p.name + " :D", { ts: now() - 1000 }));
          st.chats.push(c);
          openChat(c.id);
        }));
      });
    });
  }

  function groupSheet() {
    openSheet("Новая группа", function (body) {
      const name = document.createElement("input");
      name.type = "text";
      name.placeholder = "Название группы";
      name.maxLength = 48;
      const lab = document.createElement("label");
      lab.textContent = "Название";
      lab.appendChild(name);
      body.appendChild(lab);
      const boxes = [];
      PEOPLE.forEach(function (p) {
        const row = document.createElement("label");
        row.className = "pick-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        boxes.push({ cb: cb, name: p.name });
        row.appendChild(cb);
        row.appendChild(document.createTextNode(p.name));
        body.appendChild(row);
      });
      const row = document.createElement("div");
      row.className = "btn-row";
      row.appendChild(btn("Отмена", "", closeSheet));
      row.appendChild(btn("Создать", "primary", function () {
        const members = boxes.filter(function (x) { return x.cb.checked; }).map(function (x) { return x.name; });
        if (!members.length) {
          toast("Выбери хотя бы одного участника");
          return;
        }
        const title = name.value.trim() || "Группа";
        const g = mkChat("group", title, pick(GROUP_COLORS), { members: members });
        g.messages.push(mkMsg("me", "Группа создана", { status: "read", ts: now() - 1000 }));
        st.chats.push(g);
        closeSheet();
        openChat(g.id);
      }));
      body.appendChild(row);
    });
  }

  function applyTheme() {
    let t = st.theme;
    if (t === "system") t = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.dataset.theme = t;
  }

  function settingsSheet() {
    openSheet("Настройки", function (body) {
      const nameIn = document.createElement("input");
      nameIn.type = "text";
      nameIn.value = st.me.name;
      nameIn.maxLength = 32;
      nameIn.addEventListener("change", function () {
        st.me.name = nameIn.value.trim() || "Вы";
        save();
        renderAll();
      });
      const nameLab = document.createElement("label");
      nameLab.textContent = "Имя";
      nameLab.appendChild(nameIn);
      body.appendChild(nameLab);

      const userIn = document.createElement("input");
      userIn.type = "text";
      userIn.value = st.me.username;
      userIn.maxLength = 32;
      userIn.addEventListener("change", function () {
        st.me.username = userIn.value.trim().replace(/\s+/g, "_") || "me";
        save();
      });
      const userLab = document.createElement("label");
      userLab.textContent = "Username";
      userLab.appendChild(userIn);
      body.appendChild(userLab);

      const sel = document.createElement("select");
      [["system", "Как в системе"], ["dark", "Тёмная"], ["light", "Светлая"]].forEach(function (o) {
        const op = document.createElement("option");
        op.value = o[0];
        op.textContent = o[1];
        if (st.theme === o[0]) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener("change", function () {
        st.theme = sel.value;
        save();
        applyTheme();
      });
      const selLab = document.createElement("label");
      selLab.textContent = "Тема";
      selLab.appendChild(sel);
      body.appendChild(selLab);

      if (deferredPrompt) {
        body.appendChild(btn("Установить приложение", "primary", function () {
          deferredPrompt.prompt();
          deferredPrompt = null;
          closeSheet();
        }));
      }
      const hint = document.createElement("div");
      hint.className = "text-line";
      hint.textContent = "На iPhone: Поделиться, затем «На экран Домой». На Android: меню браузера, «Установить приложение».";
      body.appendChild(hint);

      body.appendChild(btn("Экспорт всех данных", "", function () {
        downloadJSON("gemgram-backup.json", st);
      }));
      body.appendChild(btn("Удалить все данные", "danger", function () {
        confirmSheet("Удалить все данные?", "Все чаты и настройки на этом устройстве будут стёрты.", "Стереть", function () {
          localStorage.removeItem(KEY);
          st = defaults();
          ui.open = null;
          ui.typing = {};
          closeSheet();
          applyTheme();
          renderAll();
        }, true);
      }));
    });
  }

  function menuClick(e) {
    const r = $("menu-btn").getBoundingClientRect();
    showCtx(r.left, r.bottom + 4, [
      item("Настройки", settingsSheet),
      item("Новый чат", newChatSheet),
      item("Новая группа", groupSheet),
      item("Экспорт всех данных", function () { downloadJSON("gemgram-backup.json", st); })
    ]);
  }

  function toggleEmoji() {
    ui.picker = !ui.picker;
    const box = $("emoji-pick");
    box.innerHTML = "";
    if (ui.picker) {
      EMOJI.forEach(function (e) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = e;
        b.addEventListener("click", function () { insertAtCaret(e); });
        box.appendChild(b);
      });
    }
    box.classList.toggle("hidden", !ui.picker);
  }

  function insertAtCaret(text) {
    const input = $("input");
    const s = input.selectionStart || input.value.length;
    const e = input.selectionEnd || s;
    input.value = input.value.slice(0, s) + text + input.value.slice(e);
    input.focus();
    input.selectionStart = input.selectionEnd = s + text.length;
    autosize();
  }

  function startSearch() {
    ui.search = !ui.search;
    ui.sq = "";
    $("chat-search-input").value = "";
    renderAll();
    if (ui.search) $("chat-search-input").focus();
  }

  function menuGlobal() {
    menuClick();
  }

  $("search").addEventListener("input", function (e) {
    ui.q = e.target.value;
    renderChats();
  });
  $("menu-btn").addEventListener("click", menuGlobal);
  $("new-btn").addEventListener("click", newChatSheet);
  $("back-btn").addEventListener("click", closeChat);
  $("chat-menu-btn").addEventListener("click", function () {
    const r = $("chat-menu-btn").getBoundingClientRect();
    chatMenu(ui.open, r.right - 230, r.bottom + 4);
  });
  $("chat-search-btn").addEventListener("click", startSearch);
  $("chat-search-input").addEventListener("input", function (e) {
    ui.sq = e.target.value;
    renderMessages();
  });
  $("chat-search-input").addEventListener("keydown", function (e) {
    if (e.key === "Escape") startSearch();
  });
  $("to-bottom").addEventListener("click", function () {
    const box = $("messages");
    box.scrollTop = box.scrollHeight;
    ui.bottomLock = true;
    $("to-bottom").classList.add("hidden");
  });
  $("messages").addEventListener("scroll", function () {
    const box = $("messages");
    const bottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    ui.bottomLock = bottom;
    $("to-bottom").classList.toggle("hidden", bottom);
  });
  $("composer").addEventListener("submit", function (e) {
    e.preventDefault();
    sendText();
  });
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  $("input").addEventListener("input", autosize);
  $("input").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !coarse) {
      e.preventDefault();
      sendText();
    }
    if (e.key === "Escape") {
      ui.replyId = null;
      ui.editId = null;
      $("input").value = "";
      autosize();
      renderBars();
    }
  });
  $("emoji-btn").addEventListener("click", toggleEmoji);
  $("attach-btn").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function (e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.type.indexOf("image/") !== 0) {
      toast("Нужна картинка");
      return;
    }
    const caption = $("input").value.trim();
    compressImage(f, function (url) {
      sendImage(url, caption);
      $("input").value = "";
      autosize();
    });
  });
  $("sheet").addEventListener("click", function (e) {
    if (e.target === $("sheet")) closeSheet();
  });
  $("sheet-close").addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeCtx();
    if (!$("sheet").classList.contains("hidden")) closeSheet();
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) renderAll();
  });
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    if (mq.addEventListener) mq.addEventListener("change", applyTheme);
  }

  setInterval(function () {
    const ch = st.chats.find(function (c) { return c.type === "channel"; });
    if (!ch || document.hidden) return;
    ch.messages.push(mkMsg(ch.title, pick(CHANNEL_POSTS), { status: "read" }));
    if (ui.open !== ch.id) ch.unread += 1;
    save();
    renderAll();
  }, 120000);

  setInterval(function () {
    if (!document.hidden) renderChats();
  }, 30000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  applyTheme();
  renderAll();
  save();
})();
