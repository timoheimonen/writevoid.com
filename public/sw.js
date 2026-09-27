const VERSION = '1.0.9';
const CACHE_NAME = `writevoid-v${VERSION}`;
const ASSETS = [
  './',
  './about',
  './privacy',
  './tos',
  './style.css',
  './pages.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/og-image.png'
];

// Safari refuses to render a navigation response served by a service worker
// if that response was redirected (e.g. /privacy.html -> /privacy), so strip
// the redirect flag by rebuilding the response.
function cleanResponse(response) {
  if (!response || !response.redirected) return Promise.resolve(response);
  return response.blob().then((body) => new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(ASSETS.map((url) =>
        fetch(url, { cache: 'reload' })
          .then(cleanResponse)
          .then((response) => {
            if (!response.ok) throw new Error(`Failed to cache ${url}`);
            return cache.put(url, response);
          })
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cleanResponse(cached);
      return fetch(event.request).then(cleanResponse).then((response) => {
        // Cache valid responses for app assets
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
