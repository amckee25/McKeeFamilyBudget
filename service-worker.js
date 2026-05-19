// Family Finance — Service Worker
// Caches the app shell for offline use.
// Firebase data always goes to the network (real-time sync must stay live).

const CACHE  = 'family-finance-v1';
const ASSETS = ['./', './index.html'];

// On install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// On activate: drop old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// On fetch: network-first for Firebase/CDN, cache-first for app shell
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always network for Firebase, Google APIs, CDN scripts
  if(
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('cdnjs')
  ){
    return; // let the browser handle it normally
  }

  // Cache-first for the app shell, with network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if(response.ok){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached); // offline: use cache

      return cached || networkFetch;
    })
  );
});
