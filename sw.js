const CACHE = "logboek-v5";
const ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./css/style.css",
  "./js/data.js", "./js/storage.js", "./js/analysis.js", "./js/charts.js", "./js/app.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

/* Network-first: altijd de nieuwste versie proberen te halen zolang je online bent.
   Alleen als dat mislukt (geen internet), valt hij terug op de laatst gecachte versie.
   Zo krijg je bij elke update altijd meteen de nieuwste app, en werkt-ie alsnog offline. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.startsWith("http") && !e.request.url.includes(self.location.origin)) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
