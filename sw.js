// FALSE LIGHT — offline cache. `node build.mjs` stamps VERSION and MUSIC with hashes of the files they cache.
const VERSION = "false-light-ff6091a486";
// The soundtrack keeps its own cache, named for the tracks rather than the release, so a code update
// doesn't throw away (and re-download) 6 MB of music.
const MUSIC = "false-light-music-6682dce2c2";
// Web fonts keep a cache of their own too, so an update doesn't leave the next offline launch without its type.
const FONTS = "false-light-fonts";
const CORE = ["./", "index.html", "app.js", "engine.js", "cards.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "sigils/venefica.webp", "sigils/nyx.webp", "sigils/eris.webp", "sigils/lilith.webp"];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the HTTP cache, so a new release can't precache a stale copy of the last one.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      // Only this game's old caches: other apps on the same origin (one github.io account) keep theirs.
      const old = (await caches.keys()).filter((k) => k.startsWith("false-light-") && k !== VERSION && k !== MUSIC && k !== FONTS);
      // Releases before the fonts had a cache of their own kept them in the release's: move them over first.
      const fonts = await caches.open(FONTS);
      for (const k of old) {
        const c = await caches.open(k);
        for (const req of await c.keys()) {
          if (!/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(req.url) || (await fonts.match(req))) continue;
          const res = await c.match(req);
          if (res) await fonts.put(req, res).catch(() => {});
        }
      }
      await Promise.all(old.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Same-origin: cache first. Fonts: cached after one online visit, so the game keeps its type offline (see fontFirst).
// Music: streamed from the network the first time while the whole file is fetched once in the background;
// after that it plays from the cache, offline included, answering the player's Range requests itself.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !font) return;
  if (!font && /\/music\/[\w-]+\.mp3$/.test(url.pathname)) return e.respondWith(track(e, url.origin + url.pathname));
  if (font) return e.respondWith(fontFirst(e));
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res && (res.status === 200 || res.type === "opaque")) cache.put(e.request, res.clone()).catch(() => {});
      return res;
    }),
  );
});

const filling = new Map();
async function track(e, key) {
  const cache = await caches.open(MUSIC);
  const hit = await cache.match(key);
  if (hit) return ranged(e.request, hit);
  if (!filling.has(key)) {
    const job = fetch(key)
      .then((res) => (res.status === 200 ? cache.put(key, res) : null))
      .catch(() => {})
      .finally(() => filling.delete(key));
    filling.set(key, job);
  }
  e.waitUntil(filling.get(key));
  return fetch(e.request);
}

// Media elements ask for byte ranges (WebKit insists on a 206 answer), so slice the cached file.
async function ranged(req, res) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") || "");
  if (!m) return res;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  let start = Number(m[1]);
  let end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (m[1] === "") (start = Math.max(0, size - Number(m[2]))), (end = size - 1);
  if (!(start <= end && start < size)) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

// Fonts are served from their cache when they're there, offline included, and refreshed behind the page every time
// they're asked for. The stylesheet is an opaque answer whose status the worker can't read, so a filter's block page
// or a bad hour at Google can land in the cache; the next good answer replaces it. An uncached font that hasn't
// answered in 3 s is given up for this launch, since the stylesheet blocks the first paint and a stalled network
// (lie-fi, a captive portal) mustn't hold the game blank; the fetch goes on and fills the cache when it lands.
async function fontFirst(e) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(e.request);
  const net = fetch(e.request).then(
    (res) => {
      if (res.status === 200 || res.type === "opaque") cache.put(e.request, res.clone()).catch(() => {});
      return res;
    },
    () => null,
  );
  e.waitUntil(net);
  if (hit) return hit;
  const res = await Promise.race([net, new Promise((ok) => setTimeout(ok, 3000))]);
  if (res) return res;
  return e.request.destination === "style" ? new Response("", { headers: { "Content-Type": "text/css" } }) : Response.error();
}
