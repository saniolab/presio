// Minimal service worker: enough for installability ("save to home screen")
// plus a cached app shell so the client boots offline (local presentations
// already live in IndexedDB). Deliberately conservative — API calls and
// websockets are never intercepted, and the shell is refreshed network-first
// so deploys are picked up on the next load.
//
// BUILD_ID and PRECACHE are rewritten at build time by the precacheServiceWorker
// plugin in vite.config.ts. Without a precache the first offline reload finds an
// empty cache: the initial page load happens before this worker controls the
// page, so nothing it fetched was ever seen here.
const BUILD_ID = "__PRESIO_BUILD_ID__";
const PRECACHE = ["__PRESIO_PRECACHE__"];

const CACHE = `presio-shell-${BUILD_ID}`;
// Deploy-time settings, served no-store: only ever a fallback for offline.
const CONFIG_PATH = "/config.js";
const SHELL = new Set(PRECACHE);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // allSettled, not addAll: one missing file must not abandon the whole
      // shell and leave the app unable to open offline.
      .then((cache) =>
        Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" }))))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The app answers with `Vary: Origin` (its CORS middleware), and Cache API
// matching honours Vary: a module script or `crossorigin` stylesheet is fetched
// in CORS mode and carries an Origin header, so it would miss every precached
// entry and fail with no network to fall back on. Keying purely on the URL is
// what we want here — this cache only ever holds our own same-origin shell.
const MATCH = { ignoreVary: true };

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, MATCH);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request, cacheKey = request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(cacheKey, res.clone());
    return res;
  } catch {
    return (await cache.match(cacheKey, MATCH)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never touch the API or the socket transport.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/socket.io/")) return;

  // Any route renders from the same shell, so every navigation falls back to
  // the cached "/" — a deep link still opens the app without a connection.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }

  if (url.pathname === CONFIG_PATH) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Hashed build assets are immutable: cache-first. Other shell files (icons,
  // manifest) are versioned by CACHE, so a deploy re-fetches them.
  if (url.pathname.startsWith("/assets/") || SHELL.has(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
