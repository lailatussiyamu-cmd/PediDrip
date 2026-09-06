/* PediDrip service worker.
 *
 * Tujuannya dua, dan yang kedua lebih penting daripada yang pertama:
 *   1. aplikasi tetap terbuka di ruangan tanpa sinyal;
 *   2. tabel dosis lama TIDAK PERNAH menang atas yang baru.
 *
 * Karena itu halaman utama memakai strategi network-first: selama ada sinyal,
 * perawat selalu mendapat tabel terbaru, dan salinan tersimpan hanya dipakai
 * ketika jaringan benar-benar tidak menjawab. Kebalikannya (cache-first) akan
 * membuat angka dosis lama bertahan di HP seseorang tanpa ada yang menyadari,
 * dan itu risiko klinis, bukan sekadar ketidaknyamanan.
 *
 * VERSI harus dinaikkan setiap kali TABEL.versi di index.html berubah.
 * scripts/check-calc.mjs memeriksa keduanya cocok.
 */
const VERSI = "2026.09.06";
const CACHE = `pedidrip-${VERSI}`;

/* Berkas inti aplikasi. Font Google sengaja tidak dimasukkan di sini supaya
   pemasangan tidak gagal total kalau jaringan sedang buruk; font di-cache
   sambil jalan di bawah. Tanpa font pun aplikasi tetap terbaca. */
const INTI = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(INTI))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

const halaman = req =>
  req.mode === "navigate" || (req.destination === "" && req.headers.get("accept")?.includes("text/html"));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const fontGoogle = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fontGoogle) return;

  /* Halaman: jaringan dulu, simpanan hanya sebagai jaring pengaman. */
  if (halaman(req)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const salinan = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", salinan));
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  /* Sisanya (ikon, font): simpanan dulu supaya cepat, lalu isi diam-diam.
     Berkas-berkas ini tidak memuat angka dosis, jadi aman disajikan dari cache. */
  e.respondWith(
    caches.match(req).then(tersimpan =>
      tersimpan ||
      fetch(req).then(res => {
        if (res.ok || res.type === "opaque") {
          const salinan = res.clone();
          caches.open(CACHE).then(c => c.put(req, salinan));
        }
        return res;
      })
    )
  );
});
