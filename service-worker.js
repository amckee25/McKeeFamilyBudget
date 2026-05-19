// Family Finance — Service Worker v2
// Bumped to v2 to force cache clear and reload fresh files

const CACHE = 'family-finance-v2';

self.addEventListener('install', e => {
  // Cache the app shell immediately
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./', './index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete ALL old caches (including broken v1)
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Everything except the HTML shell goes straight to the network
  // This guarantees Firebase, CDN scripts, and icons always load fresh
  if(
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('cdnjs') ||
    url.includes('.png') ||
    url.includes('.json') ||
    url.includes('.js') && !url.includes('index')
  ){
    e.respondWith(fetch(e.request));
    return;
  }

  // HTML shell: network first so updates deploy instantly, cache as offline fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
