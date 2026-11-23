// Øk versjonsnummeret når du oppdaterer appen, så hentes nye filer.
const V = "styrkelogg-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const page = r.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("index.html");
  if (page) {
    // nettverk først (får oppdateringer), cache som reserve offline
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); return x; })
      .catch(() => caches.match(r).then(m => m || caches.match("index.html"))));
    return;
  }
  // øvrige filer (ikoner, skrifter): cache først
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(x => {
    if (x && (x.ok || x.type === "opaque")) { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); }
    return x;
  }).catch(() => m)));
});
