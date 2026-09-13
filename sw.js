const CACHE_NAME = 'zmd-matrix-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './data/weapons.json',
  './data/sites.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(e => console.warn('预缓存失败', e))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  // 用 pathname 做缓存键，忽略 ?v= 时间戳
  const cacheKey = url.pathname;

  event.respondWith(
    fetch(req).then(res => {
      if(res && res.status === 200){
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(cacheKey, clone).catch(() => {});
        });
      }
      return res;
    }).catch(() => {
      return caches.match(cacheKey).then(cached => {
        if(cached) return cached;
        if(req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});