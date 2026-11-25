/* Cache only this app's bundled, same-origin resources. */
const CACHE_PREFIX = 'namba-walk-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v26`;
const ROOT = new URL('./', self.registration.scope);
const AUDIO_PATHS = Object.entries({ everyday: 8, transport: 7, food: 9, shopping: 7, hotel: 7, help: 7 })
  .flatMap(([group, count]) => Array.from({ length: count }, (_, index) => `japanese-audio/${group}-${index + 1}.mp3`));
const ASSET_PATHS = [
  'index.html', 'style.css', 'app.js', 'storage.js', 'trip-ui.js', 'places.js', 'basemap.js', 'routes.js',
  'day-carousel.css', 'day-map.js', 'day-carousel.js', 'restaurant-ratings.js', 'dining.js', 'stop-food.js',
  'food-directory.css', 'food-directory.js',
  'shopping.css', 'shopping-data.js', 'shopping.js',
  'japanese.css', 'japanese.js', 'japanese-audio/NOTICE.txt', ...AUDIO_PATHS,
  'favicon.svg', 'dotonbori.jpg', 'vendor/leaflet.js', 'vendor/leaflet.css',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];
const ASSET_URLS = ASSET_PATHS.map(path => new URL(path, ROOT).href);
const ASSET_SET = new Set(ASSET_URLS);
const AUDIO_SET = new Set(AUDIO_PATHS.map(path => new URL(path, ROOT).href));
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

async function serveAudio(request, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey);
  if (!cached) return fetch(request);

  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/i);
  if (!range || (!range[1] && !range[2])) return cached;

  const body = await cached.blob();
  const lastByte = body.size - 1;
  const start = range[1] ? Number(range[1]) : Math.max(0, body.size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(lastByte, Number(range[2])) : lastByte;
  if (start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${body.size}` } });
  }

  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${body.size}`,
      'Content-Length': String(end - start + 1),
      'Content-Type': 'audio/mpeg'
    }
  });
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
  event.respondWith(AUDIO_SET.has(url.href) ? serveAudio(request, url.href) : fetchWithOfflineCopy(request, url.href));
});
