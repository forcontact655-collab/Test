(function (root) {
  var TRY = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4"];
  var BITS = { 720: 2200000, 480: 1100000, 360: 650000 };

  function pickMime() {
    if (!root.MediaRecorder || !MediaRecorder.isTypeSupported) return null;
    for (var i = 0; i < TRY.length; i++) {
      if (MediaRecorder.isTypeSupported(TRY[i])) return TRY[i];
    }
    return null;
  }

  function canTranscode() {
    var v = document.createElement("video");
    var canCapture = !!(v.captureStream || v.mozCaptureStream);
    var canCanvas = !!(root.HTMLCanvasElement && HTMLCanvasElement.prototype.captureStream);
    return canCapture && canCanvas && !!pickMime();
  }

  function even(x) {
    return Math.max(2, Math.round(x / 2) * 2);
  }

  function transcode(file, height, onProgress) {
    var mime = pickMime();
    if (!mime || !canTranscode()) return Promise.reject(new Error("NO_TRANSCODE"));
    var url = URL.createObjectURL(file);
    var v = document.createElement("video");
    v.src = url;
    v.playsInline = true;
    v.preload = "auto";
    v.volume = 0;
    return new Promise(function (resolve, reject) {
      v.onloadedmetadata = function () {
        var srcH = v.videoHeight;
        var srcW = v.videoWidth;
        if (!srcH || !srcW) {
          URL.revokeObjectURL(url);
          return reject(new Error("Не удалось прочитать видео"));
        }
        var scale = Math.min(1, height / srcH);
        var w = even(srcW * scale);
        var hh = even(srcH * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = hh;
        var ctx = canvas.getContext("2d");
        var out = canvas.captureStream(30);
        var vs = v.captureStream ? v.captureStream() : v.mozCaptureStream();
        vs.getAudioTracks().forEach(function (t) { out.addTrack(t); });
        var rec = new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: BITS[height] || 1000000 });
        var chunks = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          clearInterval(timer);
          URL.revokeObjectURL(url);
          resolve(new Blob(chunks, { type: mime.split(";")[0] }));
        };
        var timer = setInterval(function () {
          if (v.readyState >= 2) ctx.drawImage(v, 0, 0, w, hh);
          if (onProgress && v.duration) onProgress(Math.min(1, v.currentTime / v.duration));
        }, 1000 / 30);
        v.onended = function () {
          if (rec.state !== "inactive") rec.stop();
        };
        v.onerror = function () {
          clearInterval(timer);
          URL.revokeObjectURL(url);
          reject(new Error("Ошибка при сжатии видео"));
        };
        rec.start(1000);
        v.play().catch(function (e) {
          clearInterval(timer);
          if (rec.state !== "inactive") rec.stop();
          URL.revokeObjectURL(url);
          reject(e);
        });
      };
      v.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Не удалось открыть видео"));
      };
    });
  }

  root.EchoMedia = { canTranscode: canTranscode, transcode: transcode, pickMime: pickMime };
})(typeof window !== "undefined" ? window : globalThis);
