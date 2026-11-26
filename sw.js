// FALSE LIGHT — offline cache. `node build.mjs` stamps VERSION and MUSIC with hashes of the files they cache.
const VERSION = "false-light-6f1dc97ef3";
// The soundtrack keeps its own cache, named for the tracks rather than the release, so a code update
// doesn't throw away (and re-download) 21 MB of music.
const MUSIC = "false-light-music-e15a9f3dd9";
// Web fonts keep a cache of their own too, so an update doesn't leave the next offline launch without its type.
const FONTS = "false-light-fonts";
const CORE = ["./", "index.html", "app.js", "engine.js", "cards.js", "arcana.js", "ascension.js", "occult.js", "synergy.js", "ritual.js", "prep.js", "breadth.js", "audio-loops.js", "visuals.js", "swipe.js", "manifest.webmanifest", "THIRD_PARTY_NOTICES.md", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "sigils/venefica.webp", "sigils/nyx.webp", "sigils/eris.webp", "sigils/lilith.webp", "art/key-art-960.webp", "fonts/cinzel-OFL.txt", "fonts/cinzel-normal-500.woff2", "fonts/cinzel-normal-600.woff2", "fonts/cormorant-garamond-italic-500.woff2", "fonts/cormorant-garamond-normal-500.woff2", "fonts/cormorant-garamond-normal-600.woff2", "fonts/cormorantgaramond-OFL.txt", "fonts/fonts.css", "fonts/inter-OFL.txt", "fonts/inter-normal-400.woff2", "fonts/inter-normal-500.woff2", "fonts/inter-normal-600.woff2"];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the HTTP cache, so a new release can't precache a stale copy of the last one.
  // No skipWaiting here: a new release waits until the page, on its home screen, asks for it (SKIP_WAITING below),
  // so an update never swaps the code or the caches under a run in progress. The very first worker has nothing to wait for.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))));
});
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
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
// Music: the first listen streams from one download of the whole file, which is also what fills the cache;
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

// The first listen of a track is one download: the whole file, fetched without the player's Range header. One clone
// of the response fills the cache; the player is answered from the other, so it starts streaming at once and the file
// isn't fetched a second time. The player's ranges are cut from the cached file afterwards.
const filling = new Map();
async function track(e, key) {
  const cache = await caches.open(MUSIC);
  const hit = await cache.match(key);
  if (hit) return createPartialResponse(e.request, hit);
  const running = filling.get(key);
  if (running) {
    // A second request while the first listen is still downloading (a seek, a crossfade onto the same track) waits
    // for the file to land in the cache, then is cut from it. If the download failed, the network answers it.
    await running;
    const now = await cache.match(key);
    return now ? createPartialResponse(e.request, now) : fetch(e.request);
  }
  // The clone is taken the moment the headers land, before anything reads the body.
  const download = fetch(key).then((res) => ({ res, copy: res.status === 200 ? res.clone() : null }));
  const stored = download.then(({ copy }) => copy && cache.put(key, copy)).catch(() => {});
  filling.set(key, stored);
  stored.finally(() => filling.delete(key));
  e.waitUntil(stored);
  const { res } = await download;
  return answerFromStream(e.request, res, cache, key, stored);
}

// The first listener's answer, cut from the download's other clone while it is still arriving. A range that starts at
// the first byte is streamed (the media element's usual opening request, and WebKit's two-byte probe); anything else
// waits for the file to be cached and is cut from there.
async function answerFromStream(req, res, cache, key, stored) {
  if (res.status !== 200 || !res.body) return res;
  const range = req.headers.get("range");
  if (!range) return res;
  const m = /^\s*bytes=0-(\d*)\s*$/i.exec(range);
  const size = Number(res.headers.get("Content-Length"));
  if (m && size > 0 && !res.headers.get("Content-Encoding")) {
    const end = m[1] === "" ? size - 1 : Math.min(Number(m[1]), size - 1);
    const headers = new Headers(res.headers);
    headers.set("Content-Length", String(end + 1));
    headers.set("Content-Range", `bytes 0-${end}/${size}`);
    headers.set("Accept-Ranges", "bytes");
    if (!headers.has("Content-Type")) headers.set("Content-Type", "audio/mpeg");
    return new Response(end + 1 === size ? res.body : firstBytes(res.body, end + 1), { status: 206, statusText: "Partial Content", headers });
  }
  res.body.cancel().catch(() => {}); // not streamed: the cache's own branch carries the download
  await stored;
  const now = await cache.match(key);
  return now ? createPartialResponse(req, now) : fetch(req);
}

// The first n bytes of a stream, then done; the rest of the download goes on for the cache.
function firstBytes(body, n) {
  const reader = body.getReader();
  let left = n;
  return new ReadableStream({
    async pull(c) {
      const { done, value } = await reader.read();
      if (done) return c.close();
      if (value.length < left) return left -= value.length, c.enqueue(value);
      c.enqueue(value.subarray(0, left));
      c.close();
      reader.cancel().catch(() => {});
    },
    cancel: () => reader.cancel(),
  });
}

/*
  createPartialResponse, ported from Workbox's workbox-range-requests at tag v7.4.1
  (https://github.com/GoogleChrome/workbox/tree/v7.4.1/packages/workbox-range-requests/src; createPartialResponse.ts,
  utils/parseRangeHeader.ts and utils/calculateEffectiveBoundaries.ts, folded into this one function).

  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.

  The full MIT license text is in THIRD_PARTY_NOTICES.md, which ships beside this file.

  Changes from the original: plain JavaScript without Workbox's assert, logger and WorkboxError helpers; an end byte
  past the file is clamped to its last byte, and a suffix longer than the file is the whole file, as RFC 9110 14.1.2
  asks, where the original refuses with a 416; a Range header that is not a single "bytes=" range is ignored (the whole
  file answers it, as RFC 9110 14.2 allows) instead of becoming a 416; a start past the end of the file is a 416 that
  carries a Content-Range with the file's size; Accept-Ranges is set and Content-Type defaults to audio/mpeg. The slice is cut
  from the response's Blob (blob().slice()), which a browser backs with the cached file rather than a copy in memory.
*/
async function createPartialResponse(request, originalResponse) {
  // A response that is already partial has answered the range itself.
  if (originalResponse.status === 206) return originalResponse;
  const m = /^\s*bytes=(\d*)-(\d*)\s*$/i.exec(request.headers.get("range") || "");
  if (!m || (m[1] === "" && m[2] === "")) return originalResponse;
  const originalBlob = await originalResponse.blob();
  const size = originalBlob.size;
  let start, end; // inclusive byte positions
  if (m[1] === "") {
    // bytes=-N: the last N bytes.
    const last = Number(m[2]);
    if (last === 0) return unsatisfiable(size);
    start = Math.max(0, size - last);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (m[2] !== "" && Number(m[2]) < start) return originalResponse; // an invalid range is ignored
  }
  if (start >= size) return unsatisfiable(size);
  const slicedBlob = originalBlob.slice(start, end + 1);
  const headers = new Headers(originalResponse.headers);
  headers.set("Content-Length", String(slicedBlob.size));
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Accept-Ranges", "bytes");
  if (!headers.has("Content-Type")) headers.set("Content-Type", "audio/mpeg");
  return new Response(slicedBlob, {
    // Status code 206 is for a Partial Content response.
    status: 206,
    statusText: "Partial Content",
    headers,
  });
}
const unsatisfiable = (size) => new Response("", { status: 416, statusText: "Range Not Satisfiable", headers: { "Content-Range": `bytes */${size}` } });

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
