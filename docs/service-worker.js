const CACHE = 'rallyiq-v1';
const SCOPE = self.registration.scope; // e.g., https://user.github.io/rallyiq/
const url = new URL(SCOPE);
const BASE = url.pathname; // '/rallyiq/'

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  e.respondWith(
    caches.match(request).then(res => res || fetch(request).then(r => {
      if (request.method === 'GET' && r.status === 200 && r.type === 'basic') {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
      }
      return r;
    }).catch(() => caches.match(BASE + 'index.html'))),
  );
});
