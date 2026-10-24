/* Echo — демо-режим.
 * Открывается по адресу index.html?demo=1 и подменяет Supabase на локальный
 * макет в памяти. Нужен только чтобы посмотреть интерфейс без входа в аккаунт:
 * ни один запрос не уходит в сеть, реальные данные не затрагиваются.
 */
(function () {
  "use strict";
  if (!/[?&]demo\b/.test(location.search)) return;
  if (!window.supabase || !window.supabase.createClient) return;

  const M = 60 * 1000;
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const day = 24 * 60 * M;

  /* ---------- картинки-заглушки (без внешних файлов) ---------- */
  function art(a, b, c) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>' +
      '<radialGradient id="r" cx="30%" cy="20%" r="80%"><stop offset="0" stop-color="' + c + '" stop-opacity=".9"/>' +
      '<stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="800" height="800" fill="url(#g)"/><rect width="800" height="800" fill="url(#r)"/>' +
      '<circle cx="600" cy="640" r="230" fill="#fff" opacity=".07"/>' +
      '<circle cx="180" cy="140" r="120" fill="#fff" opacity=".05"/></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function stickerArt(ch, bg) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">' +
      '<circle cx="160" cy="160" r="150" fill="' + bg + '"/>' +
      '<text x="160" y="215" font-size="170" text-anchor="middle">' + ch + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const PHOTO = art("#6d28d9", "#db2777", "#a78bfa");
  const PHOTO2 = art("#1e1b4b", "#7c3aed", "#c4b5fd");
  const PHOTO3 = art("#4c1d95", "#be185d", "#f0abfc");

  const AV_ALICE = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#c084fc"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>' +
    '<rect width="200" height="200" fill="url(#g)"/>' +
    '<circle cx="100" cy="78" r="34" fill="#fff" opacity=".92"/>' +
    '<path d="M32 200c0-40 30-64 68-64s68 24 68 64z" fill="#fff" opacity=".92"/></svg>');

  const AV_ME = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#f0abfc"/><stop offset="1" stop-color="#4c1d95"/></linearGradient></defs>' +
    '<rect width="200" height="200" fill="url(#g)"/>' +
    '<circle cx="100" cy="100" r="58" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="10"/>' +
    '<circle cx="100" cy="100" r="20" fill="#fff" fill-opacity=".85"/></svg>');

  // короткий тонкий сигнал, чтобы карточка музыки в профиле была живой
  function tone() {
    const rate = 8000, sec = 2, n = rate * sec;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVEfmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, "data"); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      const amp = Math.sin(Math.PI * Math.min(1, t / sec)) * 0.16;
      v.setInt16(44 + i * 2, Math.sin(2 * Math.PI * 220 * t) * amp * 32767, true);
    }
    let bin = "";
    new Uint8Array(buf).forEach((b) => { bin += String.fromCharCode(b); });
    return "data:audio/wav;base64," + btoa(bin);
  }
  const TONE = tone();

  /* ---------- люди ---------- */
  const P = {
    me: {
      id: "11111111-1111-4111-8111-111111111111", uid: 1, username: "empty", display_name: "Emptiness",
      bio: "Дизайн, музыка и немного кода.", status_emoji: "🌙", status_text: "на связи",
      avatar_url: AV_ME, avatar_animated: false, last_seen: iso(now), hide_last_seen: false, dm_closed: false,
      profile_bg: "#4c1d95", music_url: TONE, music_title: "Night Drive — Echo", public_key: null,
      created_at: iso(now - 90 * day),
    },
    ogn: {
      id: "22222222-2222-4222-8222-222222222222", uid: 2, username: "ogn", display_name: "obesko",
      bio: "Собираю биты по ночам.", status_emoji: "🔥", status_text: "",
      avatar_url: null, avatar_animated: false, last_seen: iso(now - 40 * 1000), hide_last_seen: false, dm_closed: false,
      profile_bg: null, music_url: null, music_title: "", public_key: null, created_at: iso(now - 80 * day),
    },
    kasekop: {
      id: "33333333-3333-4333-8333-333333333333", uid: 3, username: null, display_name: "Kasekop Gaming",
      bio: "", status_emoji: "", status_text: "", avatar_url: null, avatar_animated: false,
      last_seen: iso(now - 3 * 60 * M), hide_last_seen: false, dm_closed: false,
      profile_bg: null, music_url: null, music_title: "", public_key: null, created_at: iso(now - 70 * day),
    },
    alice: {
      id: "44444444-4444-4444-8444-444444444444", uid: 4, username: "alice", display_name: "Алиса",
      bio: "Слушаю lo-fi и рисую по вечерам ✨", status_emoji: "🎧", status_text: "в наушниках",
      avatar_url: AV_ALICE, avatar_animated: false, last_seen: iso(now - 12 * 1000), hide_last_seen: false, dm_closed: false,
      profile_bg: "linear-gradient(135deg,#312e81,#a21caf)", music_url: null, music_title: "Midnight Tape — Alice",
      public_key: null, created_at: iso(now - 60 * day),
    },
    max: {
      id: "55555555-5555-4555-8555-555555555555", uid: 5, username: "maxwell", display_name: "Макс",
      bio: "Бэкенд, кофе, велосипед.", status_emoji: "", status_text: "", avatar_url: null, avatar_animated: false,
      last_seen: iso(now - 2 * day), hide_last_seen: false, dm_closed: false,
      profile_bg: null, music_url: null, music_title: "", public_key: null, created_at: iso(now - 50 * day),
    },
  };

  /* ---------- чаты ---------- */
  const C = {
    ogn: "aaaaaaa1-0000-4000-8000-000000000001",
    kasekop: "aaaaaaa2-0000-4000-8000-000000000002",
    night: "aaaaaaa3-0000-4000-8000-000000000003",
    news: "aaaaaaa4-0000-4000-8000-000000000004",
    alice: "aaaaaaa5-0000-4000-8000-000000000005",
    old: "aaaaaaa6-0000-4000-8000-000000000006",
  };

  const chats = [
    { id: C.ogn, kind: "direct", title: "", description: "", avatar_url: null, avatar_animated: false, direct_key: [P.me.id, P.ogn.id].sort().join("|"), created_by: P.ogn.id, created_at: iso(now - 40 * day) },
    { id: C.alice, kind: "direct", title: "", description: "", avatar_url: null, avatar_animated: false, direct_key: [P.me.id, P.alice.id].sort().join("|"), created_by: P.alice.id, created_at: iso(now - 30 * day) },
    { id: C.night, kind: "group", title: "Ночной эфир", description: "Плейлисты, демки и разговоры до утра", avatar_url: PHOTO2, avatar_animated: false, direct_key: null, created_by: P.ogn.id, created_at: iso(now - 25 * day) },
    { id: C.news, kind: "channel", title: "Echo News", description: "Обновления мессенджера Echo", avatar_url: PHOTO3, avatar_animated: false, direct_key: null, created_by: P.max.id, created_at: iso(now - 20 * day) },
    { id: C.kasekop, kind: "direct", title: "", description: "", avatar_url: null, avatar_animated: false, direct_key: [P.me.id, P.kasekop.id].sort().join("|"), created_by: P.kasekop.id, created_at: iso(now - 18 * day) },
    { id: C.old, kind: "group", title: "Старый проект", description: "", avatar_url: null, avatar_animated: false, direct_key: null, created_by: P.me.id, created_at: iso(now - 300 * day) },
  ];

  function member(chat, user, role, extra) {
    return Object.assign({
      chat_id: chat, user_id: user, role: role || "member", pinned: false, muted: false,
      last_read_at: iso(now - 3 * day), joined_at: iso(now - 20 * day), archived: false,
    }, extra || {});
  }

  const chat_members = [
    member(C.ogn, P.me.id, "member", { last_read_at: iso(now - 3 * M) }),
    member(C.ogn, P.ogn.id, "member", { last_read_at: iso(now - 20 * 1000) }),
    member(C.alice, P.me.id, "member", { pinned: true, last_read_at: iso(now - 2 * day) }),
    member(C.alice, P.alice.id, "member", { last_read_at: iso(now - 2 * day) }),
    member(C.night, P.me.id, "owner", { last_read_at: iso(now - 6 * M) }),
    member(C.night, P.ogn.id, "admin", { last_read_at: iso(now - 5 * M) }),
    member(C.night, P.alice.id, "member", { last_read_at: iso(now - 9 * M) }),
    member(C.night, P.max.id, "member", { last_read_at: iso(now - 2 * day) }),
    member(C.news, P.me.id, "member", { last_read_at: iso(now - 4 * day), muted: true }),
    member(C.news, P.max.id, "owner", { last_read_at: iso(now - 2 * M) }),
    member(C.news, P.ogn.id, "member", { last_read_at: iso(now - 2 * day) }),
    member(C.news, P.alice.id, "member", { last_read_at: iso(now - 2 * day) }),
    member(C.kasekop, P.me.id, "member", { last_read_at: iso(now - 6 * day) }),
    member(C.kasekop, P.kasekop.id, "member", { last_read_at: iso(now - 6 * day) }),
    member(C.old, P.me.id, "owner", { archived: true, last_read_at: iso(now - 30 * day) }),
    member(C.old, P.ogn.id, "member", { archived: true, last_read_at: iso(now - 30 * day) }),
  ];

  /* ---------- сообщения ---------- */
  let seq = 0;
  function m(chat, sender, body, at, extra) {
    seq += 1;
    return Object.assign({
      id: "bbbbbbb1-0000-4000-8000-" + String(seq).padStart(12, "0"),
      chat_id: chat, sender_id: sender, kind: "text", body: body, media_url: null, media_name: null,
      media_quality: null, reply_to: null, forwarded_from: null, edited_at: null, deleted_at: null,
      created_at: iso(at),
    }, extra || {});
  }
  const T = now;
  const messages = [
    // Алиса — личный чат
    m(C.alice, P.alice.id, "Привет! Ты уже видел новый дизайн Echo? Я вчера включила — как будто другой мессенджер 🙈", T - 2 * day - 40 * M),
    m(C.alice, P.me.id, "Видел, но пока только мельком. Что больше всего зашло?", T - 2 * day - 36 * M),
    m(C.alice, P.alice.id, "Тёмная тема, плавные анимации и то, как аккуратно сгруппированы сообщения", T - 2 * day - 35 * M),
    m(C.alice, P.me.id, "Согласен. Ещё нравится, что стикеры и реакции не разваливают ленту", T - 2 * day - 30 * M),
    m(C.alice, P.alice.id, "", T - 2 * day - 10 * M, { kind: "image", media_url: PHOTO, media_name: "набросок.png", media_quality: "high" }),
    m(C.alice, P.alice.id, "Вот, собрала палитру для новой темы 🌌", T - 2 * day - 9 * M),
    m(C.alice, P.me.id, "Огонь. Заберу в макет, если ты не против", T - 2 * day - 8 * M),
    m(C.alice, P.alice.id, "Конечно! Покажу полную версию вечером", T - 2 * day - 5 * M, { edited_at: iso(T - 2 * day - 4 * M) }),

    // obesko — личный чат
    m(C.ogn, P.ogn.id, "Слушай, у меня трек почти готов. Скинуть демку?", T - 5 * day),
    m(C.ogn, P.me.id, "Давай, только не как в прошлый раз — на 9 минут 😄", T - 5 * day + 4 * M),
    m(C.ogn, P.ogn.id, "Обещаю, будет коротко)", T - 5 * day + 5 * M),
    m(C.ogn, P.ogn.id, "", T - 4 * day, { kind: "sticker", media_url: stickerArt("🎧", "rgba(192,132,252,.22)") }),
    m(C.ogn, P.me.id, "Кстати, зацени новую группировку сообщений", T - 2 * M - 9 * M),
    m(C.ogn, P.me.id, "Когда пишешь несколько подряд — пузыри склеиваются, а время остаётся только у последнего", T - 2 * M - 9 * M + 12 * 1000),
    m(C.ogn, P.ogn.id, "Выглядит намного чище 👌", T - 2 * M - 6 * M, { reply_to: null }),
    m(C.ogn, P.ogn.id, "А реакции не мешают читать", T - 2 * M - 6 * M + 20 * 1000),
    m(C.ogn, P.ogn.id, "Скинь ещё скриншот профиля", T - 2 * M),
    m(C.ogn, P.me.id, "", T - 60 * 1000, { kind: "image", media_url: PHOTO2, media_name: "profile.png", media_quality: "high" }),
    m(C.ogn, P.ogn.id, "Красота. Особенно музыка в профиле", T - 40 * 1000),

    // Ночной эфир — группа
    m(C.night, P.ogn.id, "Всем привет! Сегодня собираем плейлист на ночь", T - 8 * M - 30 * M),
    m(C.night, P.alice.id, "Привет! У меня как раз готова подборка lo-fi", T - 8 * M - 26 * M),
    m(C.night, P.alice.id, "Ссылку кину в личку", T - 8 * M - 26 * M + 30 * 1000),
    m(C.night, P.max.id, "Только не забудьте про дедлайн — пятница", T - 8 * M - 12 * M),
    m(C.night, P.me.id, "Записал. Успеем 🙂", T - 7 * M),
    m(C.night, P.ogn.id, "Обложка для эфира", T - 6 * M - 10 * M, { kind: "image", media_url: PHOTO3, media_name: "обложка.png", media_quality: "high" }),
    m(C.night, P.alice.id, "Это лучшее, что я видела за неделю 🔥", T - 6 * M),
    m(C.night, P.ogn.id, "Спасибо! Переслал из другого чата, автору передам", T - 5 * M, { forwarded_from: "Алиса" }),
    m(C.night, P.max.id, "", T - 4 * M, { deleted_at: iso(T - 4 * M + 30 * 1000) }),

    // Echo News — канал
    m(C.news, P.max.id, "Обновление 4.2: группировка сообщений, новые реакции и ускоренная загрузка историй 🚀", T - 3 * day),
    m(C.news, P.max.id, "Что нового:\n• Пузыри склеиваются в цепочки\n• Реакции с анимацией\n• Профиль с музыкой стал быстрее\n• Тёмная тема стала мягче для глаз", T - 3 * day + 20 * 1000),
    m(C.news, P.max.id, "", T - 2 * day, { kind: "image", media_url: PHOTO, media_name: "release.png" }),
    m(C.news, P.max.id, "Спасибо, что вы с нами 💜", T - 2 * day + 40 * 1000),

    // Kasekop — личный чат
    m(C.kasekop, P.kasekop.id, "го вечером?", T - 9 * day),
    m(C.kasekop, P.me.id, "давай в 8", T - 9 * day + 3 * M),
    m(C.kasekop, P.kasekop.id, "👍", T - 9 * day + 4 * M),

    // Архив
    m(C.old, P.ogn.id, "Проект закрыт, но было круто", T - 120 * day),
    m(C.old, P.me.id, "Ага. Оставим в архиве", T - 120 * day + 5 * M),
  ];
  // проставим ответ на сообщение и «пересланное»
  messages.forEach(function (x) {
    if (x.chat_id === C.ogn && x.body === "А реакции не мешают читать") {
      x.reply_to = messages.filter(function (y) { return y.chat_id === C.ogn && y.body === "Выглядит намного чище 👌"; })[0].id;
    }
  });

  const reactions = [];
  function react(msgBody, emoji, users) {
    const msg = messages.filter(function (x) { return x.body === msgBody; })[0];
    if (!msg) return;
    users.forEach(function (u) {
      reactions.push({ message_id: msg.id, user_id: u, emoji: emoji, created_at: iso(now - 60 * M) });
    });
  }
  react("Выглядит намного чище 👌", "🔥", [P.me.id]);
  react("Выглядит намного чище 👌", "👍", [P.alice.id, P.max.id]);
  react("А реакции не мешают читать", "❤️", [P.alice.id]);
  react("Красота. Особенно музыка в профиле", "😂", [P.me.id]);
  react("Это лучшее, что я видела за неделю 🔥", "🔥", [P.me.id, P.ogn.id]);
  react("Вот, собрала палитру для новой темы 🌌", "😍", [P.me.id]);

  const stick = [
    { id: "s1", pack_id: "pack-1", url: stickerArt("🎧", "rgba(192,132,252,.22)"), animated: false, emoji: "🎧", created_at: iso(now - day) },
    { id: "s2", pack_id: "pack-1", url: stickerArt("😻", "rgba(244,114,182,.22)"), animated: false, emoji: "😻", created_at: iso(now - day) },
    { id: "s3", pack_id: "pack-1", url: stickerArt("🌙", "rgba(96,165,250,.22)"), animated: false, emoji: "🌙", created_at: iso(now - day) },
    { id: "s4", pack_id: "pack-1", url: stickerArt("✨", "rgba(250,204,21,.22)"), animated: false, emoji: "✨", created_at: iso(now - day) },
    { id: "s5", pack_id: "pack-1", url: stickerArt("💜", "rgba(167,139,250,.26)"), animated: false, emoji: "💜", created_at: iso(now - day) },
    { id: "s6", pack_id: "pack-1", url: stickerArt("🎮", "rgba(52,211,153,.2)"), animated: false, emoji: "🎮", created_at: iso(now - day) },
    { id: "s7", pack_id: "pack-1", url: stickerArt("🍕", "rgba(251,146,60,.2)"), animated: false, emoji: "🍕", created_at: iso(now - day) },
    { id: "s8", pack_id: "pack-1", url: stickerArt("😴", "rgba(148,163,184,.2)"), animated: false, emoji: "😴", created_at: iso(now - day) },
  ];

  // Демо-собеседникам выдаём настоящие P-256 ключи: иначе отправка в личный чат
  // упирается в «у собеседника ещё нет ключа шифрования». Расшифровать их никто,
  // кроме этой вкладки, не может — ключи живут только в памяти.
  function fillPeerKeys() {
    const subtle = window.crypto && window.crypto.subtle;
    if (!subtle) return;
    ["ogn", "kasekop", "alice", "max"].forEach(function (name) {
      subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]).then(function (kp) {
        return subtle.exportKey("raw", kp.publicKey);
      }).then(function (raw) {
        let s = "";
        new Uint8Array(raw).forEach(function (b) { s += String.fromCharCode(b); });
        P[name].public_key = btoa(s);
      }).catch(function () {});
    });
  }
  fillPeerKeys();

  const DB = {
    profiles: Object.values(P),
    chats: chats,
    chat_members: chat_members,
    messages: messages,
    reactions: reactions,
    sticker_packs: [{ id: "pack-1", owner_id: P.me.id, title: "Ночная подборка", short_name: "night", created_at: iso(now - day) }],
    stickers: stick,
    user_sticker_packs: [{ user_id: P.me.id, pack_id: "pack-1", added_at: iso(now - day) }],
    user_keys: [],
  };

  /* ---------- отношения при вложенном select ---------- */
  const find = (t, k, v) => DB[t].filter((x) => x[k] === v);
  const one = (t, k, v) => find(t, k, v)[0] || null;

  function embed(table, row, select) {
    const out = Object.assign({}, row);
    if (/chats\s*\(/.test(select) && row.chat_id) out.chats = one("chats", "id", row.chat_id);
    if (/profiles\s*\(/.test(select)) {
      const pid = row.user_id || row.sender_id || row.id;
      if (pid) out.profiles = one("profiles", "id", pid);
    }
    if (/reactions\s*\(/.test(select) && row.id) {
      out.reactions = find("reactions", "message_id", row.id);
    }
    if (/sticker_packs\s*\(/.test(select) && row.pack_id) {
      const pack = one("sticker_packs", "id", row.pack_id);
      if (pack) out.sticker_packs = Object.assign({}, pack, { stickers: find("stickers", "pack_id", pack.id) });
    }
    if (/stickers\s*\(/.test(select) && row.pack_id) out.stickers = find("stickers", "pack_id", row.pack_id);
    return out;
  }

  function test(row, f) {
    const v = row[f.col];
    switch (f.op) {
      case "eq": return v === f.val;
      case "neq": return v !== f.val;
      case "in": return f.val.indexOf(v) >= 0;
      case "is": return f.val === null ? v === null || v === undefined : v === f.val;
      case "lte": return v <= f.val;
      case "gte": return v >= f.val;
      case "lt": return v < f.val;
      case "gt": return v > f.val;
      case "ilike": {
        const pat = String(f.val).toLowerCase().replace(/%/g, "");
        return String(v == null ? "" : v).toLowerCase().indexOf(pat) >= 0;
      }
      default: return true;
    }
  }

  function applyOr(row, expr) {
    return String(expr).split(",").some(function (part) {
      const bits = part.split(".");
      const op = bits[0];
      const col = bits[1];
      const val = bits.slice(2).join(".");
      return test(row, { op: op, col: col, val: val });
    });
  }

  function Query(table) {
    this.table = table;
    this.filters = [];
    this.ors = [];
    this.op = "select";
    this.selectStr = "*";
    this.orderBy = null;
    this.limitN = null;
    this.singleMode = null;
    this.payload = null;
    this.upsertMode = false;
  }
  Query.prototype.select = function (s) { if (this.op === "select") this.selectStr = s || "*"; return this; };
  Query.prototype.insert = function (rows) { this.op = "insert"; this.payload = Array.isArray(rows) ? rows : [rows]; return this; };
  Query.prototype.update = function (patch) { this.op = "update"; this.payload = patch; return this; };
  Query.prototype.delete = function () { this.op = "delete"; return this; };
  Query.prototype.upsert = function (rows) { this.op = "upsert"; this.payload = Array.isArray(rows) ? rows : [rows]; this.upsertMode = true; return this; };
  Query.prototype.eq = function (c, v) { this.filters.push({ op: "eq", col: c, val: v }); return this; };
  Query.prototype.neq = function (c, v) { this.filters.push({ op: "neq", col: c, val: v }); return this; };
  Query.prototype.in = function (c, v) { this.filters.push({ op: "in", col: c, val: v }); return this; };
  Query.prototype.is = function (c, v) { this.filters.push({ op: "is", col: c, val: v }); return this; };
  Query.prototype.lt = function (c, v) { this.filters.push({ op: "lt", col: c, val: v }); return this; };
  Query.prototype.lte = function (c, v) { this.filters.push({ op: "lte", col: c, val: v }); return this; };
  Query.prototype.gte = function (c, v) { this.filters.push({ op: "gte", col: c, val: v }); return this; };
  Query.prototype.ilike = function (c, v) { this.filters.push({ op: "ilike", col: c, val: v }); return this; };
  Query.prototype.or = function (expr) { this.ors.push(expr); return this; };
  Query.prototype.order = function (c, o) { this.orderBy = { col: c, asc: !o || o.ascending !== false }; return this; };
  Query.prototype.limit = function (n) { this.limitN = n; return this; };
  Query.prototype.single = function () { this.singleMode = "single"; return this; };
  Query.prototype.maybeSingle = function () { this.singleMode = "maybe"; return this; };
  Query.prototype.run = function () {
    let rows = DB[this.table] || [];
    const me = this;
    const match = function (r) {
      if (!me.filters.every(function (f) { return test(r, f); })) return false;
      return me.ors.every(function (e) { return applyOr(r, e); });
    };
    if (this.op === "select" || this.op === "update" || this.op === "delete") {
      rows = rows.filter(match);
    }
    if (this.op === "insert" || this.op === "upsert") {
      const added = this.payload.map(function (r) {
        const row = Object.assign({ id: "gen-" + Math.random().toString(36).slice(2, 10), created_at: iso(Date.now()) }, r);
        return row;
      });
      added.forEach(function (row) {
        DB[me.table] = DB[me.table] || [];
        const key = me.table === "reactions" ? ["message_id", "user_id", "emoji"] : ["id"];
        const idx = DB[me.table].findIndex(function (x) { return key.every(function (k) { return x[k] === row[k]; }); });
        if (idx >= 0) DB[me.table][idx] = Object.assign({}, DB[me.table][idx], row);
        else DB[me.table].push(row);
      });
      rows = added;
    } else if (this.op === "update") {
      rows.forEach(function (r) { Object.assign(r, me.payload); });
      rows = rows.map(function (r) { return Object.assign({}, r); });
    } else if (this.op === "delete") {
      DB[this.table] = (DB[this.table] || []).filter(function (r) { return !match(r); });
      rows = rows.map(function (r) { return Object.assign({}, r); });
    }
    if (this.op === "select" && this.orderBy) {
      const ob = this.orderBy;
      rows = rows.slice().sort(function (a, b) {
        const x = a[ob.col], y = b[ob.col];
        if (x === y) return 0;
        return (x > y ? 1 : -1) * (ob.asc ? 1 : -1);
      });
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    if (this.op === "select") rows = rows.map(function (r) { return embed(me.table, r, me.selectStr); });
    let data = rows;
    if (this.singleMode) data = rows[0] || null;
    return { data: JSON.parse(JSON.stringify(data)), error: null, count: rows.length, status: 200 };
  };
  Query.prototype.then = function (ok, bad) {
    try { return Promise.resolve(this.run()).then(ok, bad); }
    catch (e) { return Promise.resolve({ data: null, error: { message: String(e && e.message || e) } }).then(ok, bad); }
  };

  /* ---------- realtime ---------- */
  function channel() {
    const ch = {
      on: function () { return ch; },
      subscribe: function (cb) {
        if (cb) setTimeout(function () { cb("SUBSCRIBED"); }, 30);
        return ch;
      },
      unsubscribe: function () { return Promise.resolve("ok"); },
      track: function () { return Promise.resolve("ok"); },
      untrack: function () { return Promise.resolve("ok"); },
      send: function () { return Promise.resolve("ok"); },
      presenceState: function () {
        const on = {};
        on[P.ogn.id] = [{ at: now }];
        on[P.alice.id] = [{ at: now }];
        return on;
      },
    };
    return ch;
  }

  /* ---------- rpc ---------- */
  function stats() {
    return DB.chats.map(function (c) {
      const mem = DB.chat_members.filter(function (x) { return x.chat_id === c.id && x.user_id === P.me.id; })[0];
      const list = DB.messages.filter(function (x) { return x.chat_id === c.id; })
        .sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
      const last = list[list.length - 1];
      const unread = mem ? list.filter(function (x) {
        return x.sender_id !== P.me.id && !x.deleted_at && x.created_at > mem.last_read_at;
      }).length : 0;
      return {
        chat_id: c.id, unread: unread,
        last_at: last ? last.created_at : null,
        last_kind: last ? last.kind : null,
        last_body: last ? last.body : null,
        last_sender: last ? last.sender_id : null,
        last_deleted: last ? !!last.deleted_at : false,
      };
    });
  }

  function rpc(name, args) {
    const a = args || {};
    let out = null;
    if (name === "my_chat_stats") out = stats();
    else if (name === "open_direct") {
      const other = a.other;
      const key = [P.me.id, other].sort().join("|");
      let c = DB.chats.filter(function (x) { return x.kind === "direct" && x.direct_key === key; })[0];
      if (!c) {
        c = {
          id: "gen-" + Math.random().toString(36).slice(2, 10), kind: "direct", title: "", description: "",
          avatar_url: null, avatar_animated: false, direct_key: key, created_by: P.me.id, created_at: iso(Date.now()),
        };
        DB.chats.push(c);
        DB.chat_members.push(member(c.id, P.me.id), member(c.id, other));
      }
      out = c.id;
    } else if (name === "create_chat") {
      const id = "gen-" + Math.random().toString(36).slice(2, 10);
      DB.chats.push({
        id: id, kind: a.p_kind || "group", title: a.p_title || "Новый чат", description: a.p_description || "",
        avatar_url: null, avatar_animated: false, direct_key: null, created_by: P.me.id, created_at: iso(Date.now()),
      });
      DB.chat_members.push(member(id, P.me.id, "owner"));
      (a.p_members || []).forEach(function (u) { DB.chat_members.push(member(id, u)); });
      out = id;
    } else if (name === "add_chat_member") {
      if (!DB.chat_members.some(function (x) { return x.chat_id === a.p_chat && x.user_id === a.p_user; })) {
        DB.chat_members.push(member(a.p_chat, a.p_user));
      }
      out = null;
    } else if (name === "set_username") {
      P.me.username = a.u;
      out = a.u;
    } else if (name === "set_privacy") {
      P.me.hide_last_seen = !!a.p_hide_last_seen;
      P.me.dm_closed = !!a.p_dm_closed;
      out = null;
    }
    return Promise.resolve({ data: out === undefined ? null : out, error: null, status: 200 });
  }

  const ME_USER = {
    id: P.me.id, email: "empty@echo.demo", aud: "authenticated", role: "authenticated",
    user_metadata: { full_name: P.me.display_name, name: P.me.display_name },
    app_metadata: { provider: "google" },
    identities: [{ provider: "google", id: "demo" }],
  };

  const client = {
    from: function (table) { return new Query(table); },
    rpc: rpc,
    channel: channel,
    removeChannel: function () { return Promise.resolve("ok"); },
    removeAllChannels: function () { return Promise.resolve([]); },
    getChannels: function () { return []; },
    storage: {
      from: function () {
        return {
          upload: function () { return Promise.resolve({ data: { path: "demo" }, error: null }); },
          getPublicUrl: function () { return { data: { publicUrl: "" } }; },
          remove: function () { return Promise.resolve({ data: null, error: null }); },
        };
      },
    },
    auth: {
      getSession: function () {
        // ?demo=1&auth=1 — показать экран входа вместо приложения
        const signedOut = /[?&]auth\b/.test(location.search);
        return Promise.resolve({
          data: { session: signedOut ? null : { access_token: "demo", user: ME_USER } },
          error: null,
        });
      },
      getUser: function () { return Promise.resolve({ data: { user: ME_USER }, error: null }); },
      onAuthStateChange: function () {
        return { data: { subscription: { unsubscribe: function () {} } } };
      },
      signInWithOAuth: function () { return Promise.resolve({ data: {}, error: null }); },
      setSession: function () { return Promise.resolve({ data: { session: { user: ME_USER } }, error: null }); },
      exchangeCodeForSession: function () { return Promise.resolve({ data: { session: { user: ME_USER } }, error: null }); },
      signOut: function () { return Promise.resolve({ error: null }); },
      linkIdentity: function () { return Promise.resolve({ data: {}, error: null }); },
    },
  };

  window.supabase = {
    createClient: function () { return client; },
  };
  window.__ECHO_DEMO__ = true;
})();
