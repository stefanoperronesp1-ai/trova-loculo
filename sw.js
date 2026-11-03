/* Trova Loculo — lavoro offline */
const CACHE = 'trova-loculo-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // pacchetti cimitero: prima la rete, poi la copia salvata
  if (url.origin === location.origin && url.pathname.includes('/cimiteri/')) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // pagina: prima la rete (per gli aggiornamenti), poi la cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // resto (icone, caratteri): prima la cache
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
