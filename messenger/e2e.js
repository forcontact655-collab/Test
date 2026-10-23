(function (root) {
  var enc = new TextEncoder();
  var dec = new TextDecoder();
  var subtle = root.crypto.subtle;
  var PREFIX = "e2e1:";
  var CURVE = { name: "ECDH", namedCurve: "P-256" };

  function b64(buf) {
    var b = new Uint8Array(buf);
    var s = "";
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function unb64(str) {
    var s = atob(str);
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
  async function generate() {
    var kp = await subtle.generateKey(CURVE, false, ["deriveBits"]);
    var pub = await subtle.exportKey("raw", kp.publicKey);
    return { privateKey: kp.privateKey, publicKey: b64(pub) };
  }
  async function deriveChatKey(privateKey, peerPublicB64) {
    var peer = await subtle.importKey("raw", unb64(peerPublicB64), CURVE, true, []);
    var bits = await subtle.deriveBits({ name: "ECDH", public: peer }, privateKey, 256);
    var hk = await subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
    return subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode("echo-dm-v1") },
      hk,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function encrypt(key, text) {
    var iv = root.crypto.getRandomValues(new Uint8Array(12));
    var ct = await subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(text));
    return PREFIX + b64(iv) + "." + b64(ct);
  }
  function isEncrypted(body) {
    return typeof body === "string" && body.indexOf(PREFIX) === 0;
  }
  async function decrypt(key, body) {
    var rest = body.slice(PREFIX.length);
    var i = rest.indexOf(".");
    var iv = unb64(rest.slice(0, i));
    var ct = unb64(rest.slice(i + 1));
    var pt = await subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct);
    return dec.decode(pt);
  }
  root.EchoE2E = { generate: generate, deriveChatKey: deriveChatKey, encrypt: encrypt, decrypt: decrypt, isEncrypted: isEncrypted, PREFIX: PREFIX };
})(typeof window !== "undefined" ? window : globalThis);
