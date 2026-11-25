/* Cache only this app's bundled, same-origin resources. */
const CACHE_PREFIX = 'namba-walk-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v24`;
const ROOT = new URL('./', self.registration.scope);
const ASSET_PATHS = [
  'index.html', 'style.css', 'app.js', 'storage.js', 'trip-ui.js', 'places.js', 'basemap.js', 'routes.js',
  'day-carousel.css', 'day-map.js', 'day-carousel.js', 'restaurant-ratings.js', 'dining.js', 'stop-food.js',
  'food-directory.css', 'food-directory.js',
  'shopping.css', 'shopping-data.js', 'shopping.js',
  'japanese.css', 'japanese.js',
  'favicon.svg', 'dotonbori.jpg', 'vendor/leaflet.js', 'vendor/leaflet.css',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];
const ASSET_URLS = ASSET_PATHS.map(path => new URL(path, ROOT).href);
const ASSET_SET = new Set(ASSET_URLS);
const SHELL_URL = new URL('index.html', ROOT).href;
const SHELL_PATH = new URL(SHELL_URL).pathname;

self.addEventListener('install', event => {
  const assets = ASSET_URLS.map(url => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function fetchWithOfflineCopy(request, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) {
      try { await cache.put(cacheKey, response.clone()); } catch { /* Keep serving online if storage is full. */ }
    }
    if (response.status >= 500) return (await cache.match(cacheKey)) || response;
    return response;
  } catch {
    return (await cache.match(cacheKey)) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;

  if (request.mode === 'navigate' && (url.pathname === ROOT.pathname || url.pathname === SHELL_PATH)) {
    event.respondWith(fetchWithOfflineCopy(request, SHELL_URL));
    return;
  }

  if (!ASSET_SET.has(url.href)) return;
  event.respondWith(fetchWithOfflineCopy(request, url.href));
});
