(function (root) {
  var DB = "echo-local";
  var dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      if (!root.indexedDB) return reject(new Error("no indexedDB"));
      var req = root.indexedDB.open(DB, 1);
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
        if (!d.objectStoreNames.contains("outbox")) d.createObjectStore("outbox", { keyPath: "lid" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { dbp = null; reject(req.error); };
    });
    return dbp;
  }

  function run(store, mode, fn) {
    return open().then(function (d) {
      return new Promise(function (resolve, reject) {
        var t = d.transaction(store, mode);
        var req = fn(t.objectStore(store));
        t.oncomplete = function () { resolve(req ? req.result : undefined); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  root.EchoStore = {
    get: function (k) { return run("kv", "readonly", function (s) { return s.get(k); }); },
    set: function (k, v) { return run("kv", "readwrite", function (s) { s.put(v, k); return null; }); },
    outboxAdd: function (item) { return run("outbox", "readwrite", function (s) { s.put(item); return null; }); },
    outboxAll: function () { return run("outbox", "readonly", function (s) { return s.getAll(); }); },
    outboxDel: function (lid) { return run("outbox", "readwrite", function (s) { s.delete(lid); return null; }); }
  };
})(typeof window !== "undefined" ? window : globalThis);
