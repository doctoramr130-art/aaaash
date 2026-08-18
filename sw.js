const CACHE = "aash-v3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];
// مكتبات React/Babel من الـ CDN. بنكاشيها كمان عشان التطبيق يشتغل حتى من غير نت
// بعد أول فتحة ناجحة، وميوقفش لو الـ CDN بطيء أو مش متاح مؤقتًا.
const CDN_ASSETS = [
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js",
  "https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => {
      // كل أصل بيتكاش لوحده، عشان لو واحد فشل (مثلاً مفيش نت وقت التثبيت)
      // الباقي يفضل يتكاش وميوقفش تسجيل الـ service worker كله.
      const all = [...ASSETS, ...CDN_ASSETS].map((url) =>
        fetch(url, { mode: url.startsWith("http") ? "cors" : "same-origin" })
          .then((resp) => {
            if (resp && resp.status === 200) return c.put(url, resp);
          })
          .catch(() => {})
      );
      return Promise.all(all);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => cached || caches.match("./index.html"));
      return cached || network;
    })
  );
});
