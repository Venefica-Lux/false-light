// FALSE LIGHT — offline cache. `node build.mjs` stamps VERSION and MUSIC with hashes of the files they cache.
const VERSION = "false-light-7b3ec6ba7a";
// The soundtrack keeps its own cache, named for the tracks rather than the release, so a code update
// doesn't throw away (and re-download) 6 MB of music.
const MUSIC = "false-light-music-6682dce2c2";
const CORE = ["./", "index.html", "app.js", "engine.js", "cards.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "sigils/venefica.webp", "sigils/nyx.webp", "sigils/eris.webp", "sigils/lilith.webp"];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the HTTP cache, so a new release can't precache a stale copy of the last one.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    // Only this game's old caches: other apps on the same origin (one github.io account) keep theirs.
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("false-light-") && k !== VERSION && k !== MUSIC).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// Same-origin: cache first. Fonts: cached after one online visit, so the game keeps its type offline.
// Music: streamed from the network the first time while the whole file is fetched once in the background;
// after that it plays from the cache, offline included, answering the player's Range requests itself.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !font) return;
  if (!font && /\/music\/[\w-]+\.mp3$/.test(url.pathname)) return e.respondWith(track(e, url.origin + url.pathname));
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: !font });
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
