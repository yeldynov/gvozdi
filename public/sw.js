// Network-first: always fresh when online, last copy when offline.
const CACHE = 'gvozdi-v1';
// Each route's HTML lists its JS chunks; warming these lets every tab open offline.
const ROUTES = ['/', '/practice', '/progress', '/settings', '/session', '/onboarding', '/account', '/history', '/history/x', '/achievement/x', '/journal', '/read/guide', '/contact'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// The page posts 'warm' on every load; chunks from older deploys are dropped afterwards.
self.addEventListener('message', (e) => {
  if (e.data === 'warm') e.waitUntil(warm());
});

async function warm() {
  const cache = await caches.open(CACHE);
  const keep = new Set();
  for (const route of ROUTES) {
    const res = await fetch(route).catch(() => null);
    if (!res?.ok) return; // offline or failing: keep what we have
    const html = await res.clone().text();
    await cache.put(route, res);
    for (const [, src] of html.matchAll(/src="(\/_expo\/static\/js\/[^"]+)"/g)) keep.add(new URL(src, self.location.origin).href);
  }
  for (const url of keep) if (!(await cache.match(url))) await cache.add(url);
  for (const req of await cache.keys()) if (req.url.includes('/_expo/static/js/') && !keep.has(req.url)) await cache.delete(req);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin || req.url.includes('/api/')) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone(); // before the page starts reading the body
          e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
        }
        return res;
      })
      // Offline deep links fall back to the cached shell, which routes on the client.
      .catch(() => caches.match(req).then((hit) => hit ?? (req.mode === 'navigate' ? caches.match('/') : Response.error()))),
  );
});
