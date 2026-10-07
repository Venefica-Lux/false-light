// FALSE LIGHT — UI. Everything that touches the DOM lives here; the rules live in engine.js.
import {
  newGame, choose, preview, switchMask, maskCost, maskStrain, tutorialPending, currentCard, shareText, vigilNumber, nightsSurvived,
  cardCosts, resolveStir, endCause, parseChallenge, isWin, bondsEarned, migrate, CARDS, METERS, MASKS, ENDINGS, STAT_LABEL, STATS, CARDS_PER_DAY, BONDS,
} from "./engine.js";

// OWNER DECISION: canonical public URLs. PLAY_URL is where shared links point when the page can't see its
// own address (inside the artifact frame, or opened from a file): the public site. Empty hides the link.
const PLAY_URL = "https://venefica-lux.github.io/false-light/";
const RULEBOOK_URL = "";
// The soundtrack: VENEFICA LUX's own tracks, shipped beside the page in music/. When they can't load
// (a single file opened from a phone's file manager), the procedural score below plays instead.
const TRACKS = { vigil: "music/vigil.mp3", light: "music/communion.mp3", cascade: "music/geometry.mp3", sour: "music/communion-sour.mp3" };

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const store = {
  failed: false,
  get(k, d) {
    let v;
    try {
      v = localStorage.getItem(k);
    } catch {
      this.failed = true;
      queueMicrotask(persistenceWarning);
      return d;
    }
    if (!v) return d;
    try {
      return JSON.parse(v);
    } catch {
      // Unreadable, but storage itself works: set the bad copy aside (recoverable by hand) and start clean.
      try {
        localStorage.setItem(k + ".unreadable", v);
      } catch {}
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      this.failed = true;
      persistenceWarning();
      return false;
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
      return true;
    } catch {
      this.failed = true;
      persistenceWarning();
      return false;
    }
  },
};

function persistenceWarning() {
  let banner = document.getElementById('persistence-warning');
  if (!banner) {
    banner = document.createElement('p');
    banner.id = 'persistence-warning';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2000;margin:0;padding:8px;background:#301622;color:#fff;font:13px system-ui;text-align:center';
    document.body.appendChild(banner);
  }
  banner.textContent = 'Progress is not being saved. Keep this page open; runs and Vigil attempts may be lost on reload.';
}

const META0 = { endings: {}, best: 0, plays: 0, crowns: 0, tutorialDone: false, vigils: {}, rivals: {}, hints: {}, mute: false };
// Saved metadata outlives releases too: missing or mistyped fields take their defaults, nothing present is lost.
function loadMeta() {
  const m = store.get("fl.meta", {});
  const out = { ...META0, ...(m && typeof m === "object" && !Array.isArray(m) ? m : {}) };
  for (const k of ["endings", "vigils", "rivals", "hints"]) if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) out[k] = {};
  for (const k of ["best", "plays", "crowns"]) if (!Number.isFinite(out[k])) out[k] = 0;
  for (const [d, v] of Object.entries(out.vigils)) if (!v || typeof v !== "object") out.vigils[d] = { over: "abandoned", nights: 0, text: "" };
  return out;
}
let meta = loadMeta();
let run = migrate(store.get("fl.run", null));
// A stored result is durable even if clearing/replacing the old run failed.
// Never offer a spent daily attempt as a resumable run after reload.
if (run?.mode === 'vigil' && meta.vigils?.[run.seedLabel]) {
  store.del('fl.run');
  run = null;
}
if (run?.over && run.mode === 'vigil') {
  meta.vigils[run.seedLabel] ??= { over: run.over, nights: nightsSurvived(run), text: shareText(run, PLAY_URL) };
  if (store.set('fl.meta', meta)) store.del('fl.run');
}
if (run && (run.v !== 1 || run.over || !currentCard(run))) run = null;
let busy = false;
const inFrame = (() => {
  try {
    return window.top !== window;
  } catch {
    return true;
  }
})();

const saveMeta = () => store.set("fl.meta", meta);
const saveRun = () => (run && !run.over ? store.set("fl.run", run) : store.del("fl.run"));
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// A hosted copy links to itself; the artifact frame and file:// fall back to PLAY_URL.
const shareUrl = () => (!inFrame && /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname) ? location.origin + location.pathname : PLAY_URL);

// ---------- art ----------
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  const r1 = 24, r2 = i % 2 ? 36 : 44;
  return `M${50 + r1 * Math.cos(a)} ${50 + r1 * Math.sin(a)}L${50 + r2 * Math.cos(a)} ${50 + r2 * Math.sin(a)}`;
}).join("");
const ART = {
  eye: '<path d="M8 50Q50 12 92 50Q50 88 8 50Z"/><circle cx="50" cy="50" r="15"/><circle cx="50" cy="50" r="6" fill="currentColor"/>',
  sun: `<circle cx="50" cy="50" r="16"/><circle cx="50" cy="50" r="7" fill="currentColor"/><path d="${RAYS}"/>`,
  blade: '<path d="M50 6L58 60L50 68L42 60Z"/><path d="M28 64H72M50 68V88"/><circle cx="50" cy="92" r="3.5"/>',
  veil: '<path d="M20 18Q50 8 80 18L76 90Q62 78 50 92Q38 78 24 90Z"/><path d="M34 48Q40 43 46 48M54 48Q60 43 66 48"/>',
  serpent: '<path d="M28 88Q74 84 62 64Q52 46 34 54Q18 60 28 40Q40 16 70 20"/><path d="M70 20L80 16M70 20L78 26"/><circle cx="66" cy="21" r="2.5" fill="currentColor"/>',
  bell: '<path d="M30 70Q30 30 50 26Q70 30 70 70Z"/><path d="M22 70H78"/><circle cx="50" cy="79" r="5"/><path d="M50 16V26"/>',
  coin: '<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="24"/><path d="M50 34V66M40 42Q50 34 60 42M40 58Q50 66 60 58"/>',
  candle: '<path d="M40 46H60V90H40Z"/><path d="M50 46V38"/><path d="M50 36Q41 25 50 10Q59 25 50 36Z" fill="currentColor"/><path d="M34 90H66"/>',
  key: '<circle cx="32" cy="50" r="15"/><circle cx="32" cy="50" r="5"/><path d="M47 50H90M80 50V63M70 50V59"/>',
  chain: '<rect x="8" y="38" width="40" height="24" rx="12"/><rect x="38" y="38" width="30" height="24" rx="12" transform="rotate(90 53 50)"/><rect x="58" y="38" width="36" height="24" rx="12"/>',
  mask: '<path d="M16 32Q50 22 84 32Q84 70 50 84Q16 70 16 32Z"/><path d="M28 48Q37 41 44 50Q35 55 28 48ZM72 48Q63 41 56 50Q65 55 72 48Z" fill="currentColor"/>',
  letter: '<rect x="14" y="26" width="72" height="50" rx="3"/><path d="M14 28L50 56L86 28"/><circle cx="50" cy="62" r="7" fill="currentColor"/>',
  hood: '<path d="M50 10Q82 18 84 58L88 92H12L16 58Q18 18 50 10Z"/><path d="M34 60Q50 28 66 60Q50 74 34 60Z" fill="currentColor"/>',
  hand: '<path d="M32 60V34M43 58V24M54 58V26M65 60V36" stroke-width="7" stroke-linecap="round"/><path d="M26 56Q26 90 50 90Q72 90 72 62L82 46"/>',
  door: '<path d="M28 90V36Q28 12 50 12Q72 12 72 36V90Z"/><circle cx="62" cy="56" r="3.5" fill="currentColor"/><path d="M16 90H84"/>',
  cup: '<path d="M24 36H76Q74 68 50 72Q26 68 24 36Z"/><path d="M50 72V86M34 88H66M40 28Q36 20 42 12M52 28Q48 20 54 12M62 28Q58 20 64 12"/>',
  crown: '<path d="M16 74L20 32L37 54L50 22L63 54L80 32L84 74Z"/><path d="M16 84H84"/><circle cx="50" cy="60" r="4" fill="currentColor"/>',
  scroll: '<path d="M30 18H72Q80 18 80 26V82H34Q26 82 26 74V26Q26 18 34 18"/><path d="M38 36H68M38 48H68M38 60H58"/>',
  rose: '<circle cx="50" cy="32" r="16"/><path d="M41 32Q50 21 59 32Q50 41 41 32Z" fill="currentColor"/><path d="M50 48V92M50 72Q36 62 28 70Q38 80 50 72M50 62Q63 52 72 58"/>',
  lantern: '<path d="M36 30H64L68 78H32Z"/><path d="M30 78H70M42 30V22H58V30M50 22V10"/><path d="M50 66Q41 55 50 42Q59 55 50 66Z" fill="currentColor"/>',
  house: '<path d="M14 50L50 16L86 50"/><path d="M24 42V88H76V42"/><path d="M42 88V64H58V88"/><rect x="62" y="52" width="8" height="8"/><path d="M12 88H88"/>',
  flag: '<path d="M26 94V8"/><path d="M26 14Q44 4 58 16Q70 26 84 18V54Q70 62 58 50Q44 40 26 50Z"/><path d="M38 26L46 36M46 26L38 36" />',
  grave: '<path d="M30 88V42Q30 20 50 20Q70 20 70 42V88Z"/><path d="M50 34V66M40 45H60"/><path d="M16 88H84"/>',
  horn: '<path d="M24 86Q10 42 36 12Q30 46 46 60"/><path d="M76 86Q90 42 64 12Q70 46 54 60"/><circle cx="50" cy="72" r="6" fill="currentColor"/>',
};
const BOND_ART = { sister: "rose", sponsor: "lantern", table: "cup" };
const svg = (key, sw = 2.4) =>
  `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="round" aria-hidden="true">${ART[key] || ART.eye}</svg>`;
const MASK_ART = { bare: "door", nyx: "veil", eris: "blade", lilith: "serpent" };
const TIER = ["the Warrens", "a whisper", "a wolf", "the Geometry"];

// The card face: an engraved arch, hatched like a woodcut, the glyph inside it, ornaments at the corners.
// Drawn in a 300×400 box, which is exactly the card's 3:4.
const ARCH = "M66 318V160C66 104 104 70 150 52C196 70 234 104 234 160V318Z";
const ARCH_IN = "M75 310V162C75 113 108 82 150 64C192 82 225 113 225 162V310Z";
const corner = (x, y) => `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" transform="rotate(45 ${x} ${y})"/>`;
function face(key) {
  return `<svg class="face" viewBox="0 0 300 400" aria-hidden="true">
    <defs>
      <pattern id="fl-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0V5" stroke="currentColor" stroke-width="1.1"/></pattern>
      <filter id="fl-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g fill="none" stroke="var(--gold)">
      <rect x="12" y="12" width="276" height="376" rx="6" opacity=".5"/>
      <rect x="19" y="19" width="262" height="362" rx="3" opacity=".2"/>
      <path d="${ARCH}" fill="url(#fl-hatch)" stroke="none" style="color:var(--art)" opacity=".2"/>
      <path d="${ARCH}" opacity=".6"/>
      <path d="${ARCH_IN}" opacity=".22"/>
      <path d="M44 318H256M110 326H190" opacity=".5"/>
    </g>
    <g fill="var(--gold)" opacity=".65">${corner(12, 12)}${corner(288, 12)}${corner(12, 388)}${corner(288, 388)}</g>
    <g transform="translate(95 132) scale(1.1)" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" filter="url(#fl-glow)" style="color:var(--art)">${ART[key] || ART.eye}</g>
  </svg>`;
}
const ROMAN = [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
function roman(n) {
  let out = "";
  for (let r = n; r > 0; ) {
    const [v, l] = ROMAN.find(([v]) => v <= r);
    out += l;
    r -= v;
  }
  return out;
}
const CARD_NO = Object.fromEntries(CARDS.filter((c) => !c.tutorial).map((c, i) => [c.id, roman(i + 1)]));

// Small drawn glyphs instead of emoji, in the same line language as the card art.
const SKULL = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 1.5C4.4 1.5 2 3.9 2 7c0 1.9.9 3.2 2 4v2.2h2V12h1v1.5h2V12h1v1.2h2V11c1.1-.8 2-2.1 2-4 0-3.1-2.4-5.5-6-5.5zM5.6 6.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zM10.4 6.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"/></svg>';
const CROWN = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 12.4h12V14H2zM2.2 11.2 1.5 4l3.6 3L8 2.4 10.9 7l3.6-3-.7 7.2z"/></svg>';

// ---------- sound (WebAudio, only after a gesture) ----------
let ac = null;
function tone(freqs, dur, gain, type = "sine") {
  if (meta.mute) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime;
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain / (i + 1), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  } catch {}
}
const sfx = {
  swipe: () => tone([660], 0.09, 0.03, "triangle"),
  dice: () => tone([180, 240], 0.12, 0.05, "square"),
  bell: () => tone([196, 392 * 1.19, 587, 784 * 1.5], 3.2, 0.14),
  light: () => tone([523, 659, 784, 1046], 1.6, 0.06),
  end: () => tone([98, 147, 110], 2.6, 0.12),
};
const score = { on: false, mood: null, kind: null, n: null, toll: null };
const musicOn = () => !meta.mute && !meta.musicOff;
const markScore = (k) => {
  score.kind = k;
  document.documentElement.dataset.score = k || "";
};

// ---------- the tracks: loops crossfaded at their seams, moods crossfaded into each other ----------
// The Warrens and home play Vigil; the Light plays Communion; a Cascade plays the Geometry. When the
// Light wears off, Communion's own sour tail plays as the Reckoning comes in, then Vigil returns
// through a low-pass, muffled, while the Reckoning lasts.
const MOOD_TRACK = { home: "vigil", warrens: "vigil", reckoning: "vigil", light: "light", cascade: "cascade", end: "vigil" };
const MOOD_LEVEL = { home: 0.3, warrens: 0.42, reckoning: 0.36, light: 0.46, cascade: 0.44, end: 0.14 };
const MOOD_CUT = { home: 18000, warrens: 18000, reckoning: 700, light: 18000, cascade: 18000, end: 500 };
const XF = 4; // seconds: loop seams and mood changes
// Each pass streams through an <audio> element into the Web Audio graph. Decoding whole tracks into
// AudioBuffers would cost ~175 MB of PCM for the full score on a phone; a stream holds a few seconds.
const T = { bus: null, lp: null, cur: null, poll: null, wait: null, failed: false, voices: new Set() };
function voiceOf(k, fade, to = T.lp) {
  const el = new Audio(TRACKS[k]);
  el.preload = "auto";
  const node = ac.createMediaElementSource(el);
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + fade);
  node.connect(g).connect(to);
  const v = { k, el, node, g, ready: null };
  let refuse;
  v.ready = new Promise((ok, no) => {
    refuse = no;
    el.addEventListener("playing", ok, { once: true });
    el.addEventListener("error", () => no(new Error(`track ${k} failed`)), { once: true });
  });
  // Any track failing (offline, a partial cache) hands the whole score to the procedural fallback. So does
  // a refused play(): WebKit can refuse one made at a seam or mood change, outside the original tap.
  // An AbortError only means we dropped the voice ourselves before it started.
  v.ready.catch(() => trackFailed());
  el.play().catch((e) => e && e.name !== "AbortError" && refuse(e));
  T.voices.add(v);
  return v;
}
function dropVoice(v) {
  if (!T.voices.delete(v)) return;
  try {
    v.el.pause();
    v.el.removeAttribute("src");
    v.el.load();
    v.node.disconnect();
    v.g.disconnect();
  } catch {}
}
function fadeVoice(v, d) {
  if (!v) return;
  const t = ac.currentTime;
  v.g.gain.cancelScheduledValues(t);
  v.g.gain.setValueAtTime(Math.max(0.0001, v.g.gain.value), t);
  v.g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  setTimeout(() => dropVoice(v), d * 1000 + 150);
}
function seams() {
  const v = T.cur;
  if (!v || !score.on || !isFinite(v.el.duration) || v.el.paused) return;
  if (v.el.currentTime >= v.el.duration - XF) {
    T.cur = voiceOf(v.k, XF);
    fadeVoice(v, XF);
  }
}
function playTrack(k) {
  if (!score.on || T.failed || (T.cur && T.cur.k === k)) return;
  const old = T.cur;
  T.cur = voiceOf(k, old ? XF / 2 : 2.5);
  fadeVoice(old, XF / 2);
}
function trackFailed() {
  if (T.failed) return;
  T.failed = true;
  clearInterval(T.poll);
  clearTimeout(T.wait);
  [...T.voices].forEach(dropVoice);
  T.cur = null;
  if (score.on && score.kind === "tracks") {
    // Already running on tracks: hand over to the procedural score in the same mood.
    markScore(null);
    score.mood = null;
    startSynth();
  }
}
function trackMood(m, from) {
  const t = ac.currentTime;
  T.bus.gain.setTargetAtTime(MOOD_LEVEL[m], t, 1.2);
  T.lp.frequency.setTargetAtTime(MOOD_CUT[m], t, 0.9);
  clearTimeout(T.wait);
  if (from === "light" && m === "reckoning") {
    // The gold drains out: Communion's tail, unfiltered, then Vigil comes back muffled.
    fadeVoice(T.cur, 1.2);
    T.cur = null;
    const tail = voiceOf("sour", 0.05, T.bus);
    tail.el.addEventListener("ended", () => dropVoice(tail), { once: true });
    T.wait = setTimeout(() => score.on && score.mood === "reckoning" && playTrack("vigil"), 6500);
    return;
  }
  playTrack(MOOD_TRACK[m]);
}
function startTracks() {
  if (T.failed) return Promise.reject(new Error("tracks unavailable"));
  if (!T.bus) {
    T.bus = ac.createGain();
    T.bus.gain.value = 0.0001;
    T.lp = ac.createBiquadFilter();
    T.lp.type = "lowpass";
    T.lp.frequency.value = 18000;
    T.lp.connect(T.bus).connect(ac.destination);
  }
  const now = () => ($("app").hidden ? "home" : run ? runMood(run) : "warrens");
  T.cur = voiceOf(MOOD_TRACK[now()], 2.5);
  return T.cur.ready.then(() => {
    if (!score.on || T.failed) return;
    markScore("tracks");
    clearInterval(T.poll);
    T.poll = setInterval(seams, 500);
    score.mood = null;
    // Read the mood now, not when loading began: the player may have entered the Light meanwhile.
    setMood(now());
  });
}

function startScore() {
  if (score.on || !musicOn()) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return;
  }
  score.on = true;
  startTracks().catch(() => score.on && !score.kind && startSynth());
}

// ---------- the fallback: a procedural ambient bed that follows the run ----------
// A low A drone (two detuned saws through a breathing low-pass), a fifth, a third that turns minor or
// major with the Light, filtered noise for wind, and a far bell now and then. Moods only move targets,
// so every change is a slow glide, never a cut.
const MOODS = {
  home: { cut: 380, third: 130.81, thirdG: 0.08, shim: 0, sour: 7, wind: 0.035, gain: 0.045 },
  warrens: { cut: 460, third: 130.81, thirdG: 0.1, shim: 0, sour: 7, wind: 0.045, gain: 0.055 },
  light: { cut: 1500, third: 138.59, thirdG: 0.16, shim: 0.05, sour: 4, wind: 0.015, gain: 0.06 },
  reckoning: { cut: 240, third: 130.81, thirdG: 0.05, shim: 0, sour: 31, wind: 0.07, gain: 0.05 },
  cascade: { cut: 620, third: 123.47, thirdG: 0.12, shim: 0, sour: 46, wind: 0.08, gain: 0.06 },
  end: { cut: 200, third: 130.81, thirdG: 0, shim: 0, sour: 7, wind: 0.02, gain: 0 },
};
function startSynth() {
  try {
    const t = ac.currentTime;
    const out = ac.createGain();
    out.gain.value = 0.0001;
    out.connect(ac.destination);
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;
    lp.Q.value = 0.8;
    lp.connect(out);
    const voice = (type, f, g, det = 0) => {
      const o = ac.createOscillator();
      const v = ac.createGain();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = det;
      v.gain.value = g;
      o.connect(v).connect(lp);
      o.start(t);
      return { o, v };
    };
    const n = {
      out, lp,
      a1: voice("sawtooth", 55, 0.32, -7),
      a2: voice("sawtooth", 55, 0.32, 7),
      fifth: voice("triangle", 82.41, 0.16),
      third: voice("sine", 130.81, 0.1),
      shim: voice("sine", 659.25, 0),
    };
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 0.045;
    depth.gain.value = 120;
    lfo.connect(depth).connect(lp.frequency);
    lfo.start(t);
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 650;
    bp.Q.value = 0.5;
    n.wind = ac.createGain();
    n.wind.gain.value = 0.04;
    noise.connect(bp).connect(n.wind).connect(out);
    noise.start(t);
    n.stop = [n.a1.o, n.a2.o, n.fifth.o, n.third.o, n.shim.o, lfo, noise];
    score.n = n;
    markScore("synth");
    score.mood = null;
    setMood($("app").hidden ? "home" : run ? runMood(run) : "warrens");
    farBell();
  } catch {}
}
function setMood(m) {
  if (!score.on || !score.kind || score.mood === m) return;
  const from = score.mood;
  score.mood = m;
  document.documentElement.dataset.mood = m;
  if (score.kind === "tracks") return trackMood(m, from);
  const n = score.n, p = MOODS[m], t = ac.currentTime;
  n.out.gain.setTargetAtTime(Math.max(0.0001, p.gain), t, m === "end" ? 1.2 : 2.2);
  n.lp.frequency.setTargetAtTime(p.cut, t, 2.5);
  n.third.o.frequency.setTargetAtTime(p.third, t, 1.5);
  n.third.v.gain.setTargetAtTime(p.thirdG, t, 2);
  n.shim.v.gain.setTargetAtTime(p.shim, t, 3);
  n.a2.o.detune.setTargetAtTime(p.sour, t, 3);
  n.wind.gain.setTargetAtTime(p.wind, t, 2.5);
}
function farBell() {
  clearTimeout(score.toll);
  score.toll = setTimeout(() => {
    if (!score.on || !score.n || document.hidden) return farBell();
    // An inharmonic bell, far off, through the score's own gain so the Music toggle governs it.
    const t = ac.currentTime;
    [[196, 1], [392 * 1.19, 0.5], [587, 0.32], [1046 * 1.07, 0.15]].forEach(([f, g]) => {
      const o = ac.createOscillator();
      const v = ac.createGain();
      o.frequency.value = f;
      v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(0.09 * g, t + 0.02);
      v.gain.exponentialRampToValueAtTime(0.0001, t + 6);
      o.connect(v).connect(score.n.out);
      o.start(t);
      o.stop(t + 6.2);
    });
    farBell();
  }, 26000 + Math.random() * 30000);
}
function stopScore() {
  if (!score.on) return;
  score.on = false;
  clearTimeout(score.toll);
  clearTimeout(T.wait);
  clearInterval(T.poll);
  try {
    if (score.kind === "tracks" || T.cur) {
      if (T.bus) T.bus.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3);
      [...T.voices].forEach((v) => fadeVoice(v, 1));
      T.cur = null;
    } else if (score.n) {
      const n = score.n;
      score.n = null;
      n.out.gain.setTargetAtTime(0.0001, ac.currentTime, 0.4);
      setTimeout(() => n.stop.forEach((o) => o.stop()) || n.out.disconnect(), 1500);
    }
  } catch {}
  markScore(null);
  score.mood = null;
}
// The Reckoning card itself counts as the Reckoning: that is the moment the gold drains out.
const runMood = (s) => (s.communion > 0 ? "light" : s.reckoning > 0 || s.cardId === "reckoning" ? "reckoning" : s.cascade ? "cascade" : "warrens");
document.addEventListener("visibilitychange", () => {
  if (!ac) return;
  // Streams keep advancing on their own clock, so they pause with the page too.
  if (document.hidden) {
    ac.suspend().catch(() => {});
    T.voices.forEach((v) => v.el.pause());
  } else {
    ac.resume().catch(() => {});
    if (score.on) T.voices.forEach((v) => v.el.play().catch(() => {}));
  }
});

document.addEventListener("pointerdown", () => ac && score.on && ac.state === "suspended" && !document.hidden && ac.resume().catch(() => {}), { passive: true });

const buzz = (p) => {
  try {
    navigator.vibrate && navigator.vibrate(p);
  } catch {}
};

// ---------- coaching: one line, once, at the moment it matters ----------
const HINTS = ["dots", "roll", "lethal", "cost", "masks", "danger", "goal", "bond", "light", "inspect", "night", "activation"];
const DANGER_HINT = {
  mark: (v, m) => `Mark ${v}/${m}. At 6 you're Named.`,
  strain: (v, m) => `Strain ${v}/${m}. At 6 you Fracture.`,
  favor: (v) => `Favor ${v}. Empty at nightfall and you're Destitute.`,
  hollow: (v, m) => `Hollow ${v}/${m}. Full at nightfall and the body gives out.`,
};
let coachTimer = null;
let coachId = null;
let coachHeld = null; // a line cut short by one that can't wait; said again once there's room
function coach(id, text, first = false) {
  if (meta.hints[id] || !run || $("app").hidden) return;
  const el = $("coach");
  if (!el.hidden) {
    if (!first) return; // one at a time; an unshown hint comes back the next time it applies
    // Some hints fire only on a rise (a Bond earned), so the cut-short line is kept, not left to recur.
    // Unmarked until it's said, so a reload before then still teaches it.
    coachHeld = { id: coachId, text: el.innerHTML };
    delete meta.hints[coachId];
  }
  coachId = id;
  meta.hints[id] = 1;
  saveMeta();
  el.innerHTML = text; // fixed strings from this file, never card or user text
  el.hidden = false;
  clearTimeout(coachTimer);
  coachTimer = setTimeout(() => {
    hideCoach();
    coachResume();
  }, 5200);
  return true;
}
function hideCoach() {
  clearTimeout(coachTimer);
  $("coach").hidden = true;
}
function coachResume() {
  // Kept until it's actually said: the menu may be open, or the hint may have come round again by itself.
  if (coachHeld && (meta.hints[coachHeld.id] || coach(coachHeld.id, coachHeld.text))) coachHeld = null;
}

// ---------- HUD ----------
function buildHud() {
  $("meters").innerHTML = Object.entries(METERS)
    .map(
      ([k, m]) => `<button class="meter" id="m-${k}" type="button" aria-label="${m.label}">
        <span class="dot"></span>
        <span class="vial" style="--step:${100 / m.max}%"><span class="liquid"></span><span class="ticks"></span></span>
        <span class="lbl">${m.label.toUpperCase()}</span><span class="num"></span></button>`,
    )
    .join("");
  for (const [k, m] of Object.entries(METERS)) $("m-" + k).onclick = () => run && toast(`${m.label} ${run[k]}/${m.max}. ${m.hint}`);
  // Every track and the Bell answer a tap the same way the meters do: what it is, where it stands, what it does.
  for (const [k, id] of Object.entries(TRACK_EL)) {
    $(id).onclick = (e) => run && !e.target.closest(".bond") && toast(TRACK_INFO[k](run));
  }
  $("bell").onclick = () => run && toast(bellInfo(run));
  $("masks").innerHTML = Object.entries(MASKS)
    .map(([k, m]) => `<button class="mask" id="k-${k}" type="button">${svg(MASK_ART[k], 5)}<span class="nm">${m.name.toUpperCase()}</span><span class="cost"></span></button>`)
    .join("");
  // Tap wears a Mask; a long press opens the Masks guide instead (and swallows the click that follows it).
  for (const k of Object.keys(MASKS)) {
    const b = $("k-" + k);
    let press = 0;
    let held = false;
    const cancel = () => clearTimeout(press);
    const open = () => {
      cancel();
      if (held) return;
      held = true;
      buzz(8);
      masksGuide().then(() => (held = false)); // a keyboard tap later isn't swallowed
    };
    b.addEventListener("pointerdown", () => {
      cancel();
      held = false;
      press = setTimeout(open, 550);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, cancel));
    // Phones raise contextmenu on a long press (and may cancel the pointer first); a right-click does too.
    b.addEventListener("contextmenu", (e) => (e.preventDefault(), open()));
    b.onclick = () => (held ? (held = false) : onMask(k));
  }
  $("bell").innerHTML = Array.from({ length: CARDS_PER_DAY }, () => "<i></i>").join("");
  const segs = (id, n) => ($(id).querySelector(".segs").innerHTML = "<i></i>".repeat(n));
  segs("t-untag", 12);
  segs("t-gnosis", 12);
  segs("t-cage", 8);
  $("t-longing").querySelector(".pips").innerHTML = "<i></i>".repeat(4);
  $("bonds").innerHTML = Object.entries(BONDS).map(([k, b]) => `<button class="bond" id="b-${k}" type="button" aria-label="${b.name}">${svg(BOND_ART[k], 6)}</button>`).join("");
  for (const [k, b] of Object.entries(BONDS)) $("b-" + k).onclick = () => toast(b.hint);
}

// A number that rises off the vial or track that just changed: the result, where you're already looking.
const GOOD_UP = new Set(["favor", "untag", "gnosis"]);
function floatDelta(anchor, k, v) {
  if (!anchor || !v) return;
  const f = document.createElement("span");
  const good = GOOD_UP.has(k) ? v > 0 : v < 0;
  f.className = "float " + (good ? "good" : "bad");
  f.textContent = (v > 0 ? "+" : "−") + Math.abs(v);
  anchor.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}

let lastVals = {};
let previews = {};
const TRACK_EL = { untag: "t-untag", gnosis: "t-gnosis", longing: "t-longing", cage: "t-cage" };
const TRACK_SIZE = { untag: 12, gnosis: 12, longing: 4, cage: 8 };
const TRACK_NAME = { untag: "Untaggable", gnosis: "Gnosis", longing: "Longing", cage: "The Cage" };
// Said when a track is tapped. Rules only: every line is something the engine does.
const TRACK_INFO = {
  untag: (s) => `Untaggable ${s.untag}/12: how hard you are to file. Fill it and Gnosis together for the Double Crown.`,
  gnosis: (s) =>
    `Gnosis ${s.gnosis}/12: what you know that they can't take back. Fill it and Untaggable together for the Double Crown.${s.communion > 0 ? " In the Light it can't rise." : s.apo >= 5 ? " Menace has stopped it rising." : ""}`,
  longing: (s) => `Longing ${s.longing}/4: the ache the Light feeds on. At 3 or more, the False Light starts finding you.`,
  cage: (s) => `The Cage ${s.cage}/8. It grows when help comes without terms. At 8 it closes.`,
};
const bellInfo = (s) =>
  `The Bell: card ${Math.min(s.bell + 1, CARDS_PER_DAY)} of ${CARDS_PER_DAY} today. After card ${CARDS_PER_DAY}, nightfall: no Favor or a full Hollow ends the run, and a night without rest adds Hollow.`;
function renderHud() {
  const s = run;
  previews = {};
  for (const [k, m] of Object.entries(METERS)) {
    const el = $("m-" + k);
    el.querySelector(".liquid").style.height = (s[k] / m.max) * 100 + "%";
    el.querySelector(".num").textContent = `${s[k]}/${m.max}`;
    const danger = k === "favor" ? s.favor <= 1 : s[k] >= m.max - 1;
    el.classList.toggle("danger", danger);
    el.setAttribute("aria-label", `${m.label} ${s[k]} of ${m.max}${danger ? ", in danger" : ""}`);
    if (lastVals[k] !== undefined && lastVals[k] !== s[k]) {
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
      floatDelta(el, k, s[k] - lastVals[k]);
    }
    if (danger && lastVals[k] !== undefined) coach("danger", DANGER_HINT[k](s[k], m.max));
    lastVals[k] = s[k];
  }
  for (const [k, id] of Object.entries(TRACK_EL)) {
    if (k === "cage" && !s.cageSeen) continue;
    if (lastVals[k] !== undefined && lastVals[k] !== s[k]) {
      floatDelta($(id).querySelector(".n"), k, s[k] - lastVals[k]);
      if ((k === "untag" || k === "gnosis") && s[k] > lastVals[k]) coach("goal", "Fill both UNTAGGABLE and GNOSIS and you win. That's the Double Crown.");
    }
    lastVals[k] = s[k];
  }
  const fill = (id, v, max) => {
    $(id).querySelectorAll(".segs i,.pips i").forEach((i, n) => i.classList.toggle("on", n < v));
    $(id).querySelector(".n").textContent = `${v}/${max}`;
  };
  for (const [k, id] of Object.entries(TRACK_EL)) $(id).querySelector(".tl").setAttribute("aria-label", `${TRACK_NAME[k]} ${s[k]} of ${TRACK_SIZE[k]}`);
  fill("t-untag", s.untag, 12);
  fill("t-gnosis", s.gnosis, 12);
  fill("t-longing", s.longing, 4);
  // Gnosis can't rise in the Light or at Apotheosis 5; the track says so instead of silently not moving.
  const stalled = s.communion > 0 || s.apo >= 5;
  $("t-gnosis").classList.toggle("stalled", stalled);
  $("t-gnosis").title = stalled ? (s.communion > 0 ? "In the Light, Gnosis can't rise" : "Menace has stopped your Gnosis") : "";
  if (s.communion > 0) coach("light", "In the Light, Strain and Hollow fall away and Gnosis can't rise. The Reckoning comes after.");
  $("t-cage").hidden = !s.cageSeen;
  if (s.cageSeen) fill("t-cage", s.cage, 8);
  for (const k of Object.keys(BONDS)) {
    const b = $("b-" + k);
    const spent = (s.spent || []).includes(k);
    b.classList.toggle("on", s.bonds.includes(k));
    b.classList.toggle("spent", spent);
    b.setAttribute("aria-label", `${BONDS[k].name}: ${s.bonds.includes(k) ? "held" : spent ? "spent" : "not yet earned"}`);
  }
  if (s.bonds.length && !(lastVals.bonds >= s.bonds.length)) coach("bond", "A Bond catches you once, from one kind of ending. Earn all three, get a room at the House, rest through a night: Ordinary Time.");
  lastVals.bonds = s.bonds.length;
  $("day").textContent = s.day;
  $("mode-lbl").textContent = s.mode === "vigil" ? `VIGIL #${vigilNumber(s.seedLabel)}` : "ENDLESS";
  $("bell").querySelectorAll("i").forEach((i, n) => i.classList.toggle("on", n < s.bell));
  $("bell").setAttribute("aria-label", `The Bell: ${s.bell} of ${CARDS_PER_DAY} cards today`);
  for (const k of Object.keys(MASKS)) {
    const b = $("k-" + k);
    const c = maskStrain(s, k);
    b.classList.toggle("on", s.mask === k);
    b.setAttribute("aria-pressed", String(s.mask === k));
    b.classList.toggle("locked", s.maskLocked && s.mask !== k);
    b.querySelector(".cost").textContent = s.mask === k ? (s.maskLocked ? "seized" : "worn") : c ? `+${c} strain` : "free";
    const state = s.mask === k ? (s.maskLocked ? "seized, worn" : "worn") : c ? `wear it for ${c} Strain` : "wear it free";
    b.setAttribute("aria-label", `${MASKS[k].name}: ${state}. Hold for what it does.`);
  }
  const m = MASKS[s.mask];
  $("maskline").textContent = s.maskLocked
    ? `Seized by ${m.name} until nightfall · breaking free costs +${maskStrain(s, s.mask === "bare" ? "nyx" : "bare")} Strain`
    : `${m.name}: ${m.bonus} · ${m.risk}`;
  $("app").classList.toggle("seized", !!s.maskLocked);
  setSeal(s.mask);
  document.body.classList.toggle("communion", s.communion > 0);
  document.body.classList.toggle("reckoning", s.reckoning > 0 && s.communion === 0);
  document.body.classList.toggle("cascade", !!s.cascade);
  setMood(runMood(s));
}

function renderCard(deal = true) {
  const c = currentCard(run);
  $("say").textContent = c.text;
  $("who").textContent = c.who;
  $("art").innerHTML = face(c.art);
  $("numeral").textContent = c.tutorial ? "0" : CARD_NO[c.id] || "";
  const tone_ = c.art === "sun" ? "var(--sun)" : c.tier === 3 ? "var(--porphyra)" : c.tier === 2 ? "var(--alert)" : "var(--magenta)";
  $("card").style.setProperty("--art", tone_);
  $("tier").textContent = c.tutorial ? "first light" : TIER[c.tier] || "";
  $("go-left").innerHTML = "◀ " + esc(c.left.label);
  $("go-right").innerHTML = esc(c.right.label) + " ▶";
  for (const side of ["left", "right"]) {
    const p = previewOf(side);
    const b = $(side === "left" ? "go-left" : "go-right");
    b.classList.toggle("lethal", !!p.lethal);
    b.classList.toggle("crown", !!p.crown);
    b.title = p.lethal ? "Can end your run" : p.crown ? "Can win the run" : "";
    b.setAttribute("aria-label", c[side].label + (p.lethal ? `. Can end your run, ${pct(p.lethal.p)}` : p.crown ? `. Can win the run, ${pct(p.crown.p)}` : ""));
  }
  const card = $("card");
  card.style.transform = "";
  card.style.opacity = "";
  if (deal) {
    card.classList.remove("enter", "nudge");
    void card.offsetWidth;
    card.classList.add(c.tutorial ? "nudge" : "enter");
  }
  showPreview(null, 0);
  if (c.art === "sun") sfx.light();
  // The Light's bargain is said when it's first offered, so the first choice about it is an informed one.
  if (c.id === "whisper") coach("light", "The Light takes Strain and Hollow away now, and Gnosis can't rise while it lasts. The Reckoning comes after.", true);
  if ($("coach").hidden) coachResume(); // a line the Light cut short on an earlier card
  if (!c.tutorial) maskHint(c);
  if (previewOf("left").lethal || previewOf("right").lethal) coach("lethal", `${SKULL} marks a choice that can end your run. Drag the card or tap a choice to see the odds.`);
  if (cardCosts(run).length) coach("cost", "Some cards cost you either way. When they do, it's written under the card.");
  if (!c.tutorial && meta.plays >= 1) coach("inspect", "Tap any meter, track or the dots of the Bell to see what it means. Hold a Mask to read it.");
}

// Masks are taught at a dawn card that rolls a stat some other Mask raises, while changing is still free.
const MASK_FOR = { shade: "nyx", steel: "eris", freq: "lilith" };
function maskHint(c) {
  if (run.bell !== 0 || run.maskLocked) return;
  const stat = ["left", "right"].map((k) => c[k].roll && c[k].roll.stat).find((st) => MASK_FOR[st] && MASK_FOR[st] !== run.mask);
  if (stat) coach("masks", `${MASKS[MASK_FOR[stat]].name} adds +1 ${STAT_LABEL[stat]}, and this card rolls ${STAT_LABEL[stat]}. Tap a Mask to wear it (free at dawn), or hold it to read it.`);
  else if (run.day >= 2) coach("masks", "Masks are free to change at dawn. Each adds +1 to one stat and carries a risk. Hold one to read it.");
}

function previewOf(side) {
  return previews[side] || (previews[side] = preview(run, side));
}

const END_REASON = {
  named: "Mark hits 6", fracture: "Strain hits 6", fracture_reckoning: "Strain hits 6", destitute: "no Favor at nightfall",
  collapse: "Hollow full at nightfall", billet: "they follow you home", rex: "you become what you fought",
  flag: "you take up the old flag", corner: "the wagon takes you",
};
function lethalText(l) {
  const reasons = [...new Set(l.endings.map((e) => (e === "cage" ? (run.cageSeen ? "the Cage closes" : "something closes") : END_REASON[e.startsWith("named") ? "named" : e])))];
  return reasons.join(" / ");
}

const winName = (c) => (c.endings && c.endings.length === 1 ? ENDINGS[c.endings[0]].title : "a win");
const pct = (x) => (x > 0 && x < 0.01 ? "<1" : Math.round(x * 100)) + "%";
function oddsLine(p) {
  const parts = [];
  if (p.lethal) parts.push(`<b class="lethal">${SKULL} ${p.lethal.p >= 0.999 ? lethalText(p.lethal) : pct(p.lethal.p)}</b>`);
  if (p.crown) parts.push(`<b class="crown">${CROWN} ${p.crown.p >= 0.999 ? winName(p.crown) : pct(p.crown.p)}</b>`);
  for (const b of p.bonds || []) parts.push(`<b class="bondcost">${svg(BOND_ART[b.k], 6)} ${b.p >= 0.999 ? `spends ${BONDS[b.k].name}` : `${pct(b.p)} to spend ${BONDS[b.k].name}`}</b>`);
  if (p.roll) {
    const r = p.roll;
    const mod = r.stat === "fortune" ? "" : ` ${r.mod >= 0 ? "+" : "−"}${Math.abs(r.mod)}`;
    const dice = r.dice === 1 ? "1d6 · " : r.net > 0 ? "best 2 of 3 · " : r.net < 0 ? "worst 2 of 3 · " : "";
    parts.push(`${dice}<b>${STAT_LABEL[r.stat]}${mod}</b> · ${pct(r.hit)} clean · ${pct(r.mid)} cost · ${pct(r.miss)} worse`);
  }
  return parts.join(" · ");
}
function idleLine() {
  const lines = cardCosts(run).map((c) => `<span class="costline">${esc(c.text)}</span>`);
  // State that runs on a clock the board doesn't otherwise show.
  const c = currentCard(run);
  if (run.communion > 1 && c.id !== "whisper" && c.id !== "reckoning") lines.push(`<span class="statusline">In the Light · ${run.communion} cards left, then the Reckoning</span>`);
  if (run.bell === CARDS_PER_DAY - 1 && run.restedToday && !c.tutorial) lines.push(`<span class="statusline">Nightfall after this card. You rested today</span>`);
  return lines.join(" · ");
}

function showPreview(side, strength) {
  document.querySelectorAll(".meter .dot").forEach((d) => d.classList.remove("on"));
  document.querySelectorAll(".track.hot").forEach((t) => t.classList.remove("hot"));
  const lab = $("choice");
  $("go-left").classList.toggle("hot", side === "left");
  $("go-right").classList.toggle("hot", side === "right");
  if (!side) {
    lab.style.opacity = 0;
    $("odds").innerHTML = run ? idleLine() : "";
    return;
  }
  const p = previewOf(side);
  for (const k of p.meters) $("m-" + k).querySelector(".dot").classList.add("on");
  for (const k of p.tracks) $(TRACK_EL[k]).classList.add("hot");
  lab.innerHTML = esc(p.label) + (p.lethal ? `<span class="warn">${SKULL} ${p.lethal.p >= 0.999 ? "ends your run" : pct(p.lethal.p) + " to end your run"}</span>` : p.crown ? `<span class="win">${CROWN} ${p.crown.p >= 0.999 ? winName(p.crown) : pct(p.crown.p) + " to win"}</span>` : "");
  lab.className = "choice" + (side === "right" ? " r" : "");
  lab.style.opacity = Math.min(1, strength * 1.6);
  $("odds").innerHTML = oddsLine(p);
  coach("dots", "The lit vials are the ones this choice moves. It won't tell you which way.");
  if (p.roll) coach("roll", "This one's a dice roll, 2d6 plus a stat. The odds are under the card.");
}

// ---------- swiping ----------
function bindSwipe() {
  const card = $("card");
  let drag = null;
  card.addEventListener("pointerdown", (e) => {
    if (busy) return;
    drag = { x: e.clientX, dx: 0, t: performance.now() };
    card.setPointerCapture(e.pointerId);
    card.classList.add("dragging");
  });
  card.addEventListener("pointermove", (e) => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 16}deg)`;
    const side = drag.dx < -18 ? "left" : drag.dx > 18 ? "right" : null;
    showPreview(side, Math.abs(drag.dx) / 110);
  });
  const end = () => {
    if (!drag) return;
    card.classList.remove("dragging");
    const v = Math.abs(drag.dx) / Math.max(1, performance.now() - drag.t);
    const side = drag.dx < 0 ? "left" : "right";
    const go = Math.abs(drag.dx) > 95 || (Math.abs(drag.dx) > 40 && v > 0.6);
    drag = null;
    if (go) commit(side);
    else {
      card.style.transform = "";
      showPreview(null, 0);
    }
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
  let armed = null;
  const tapChoice = (side) => {
    if (busy) return;
    // First tap previews (like a half-swipe); second tap commits.
    if (armed !== side) {
      armed = side;
      card.style.transform = `translateX(${side === "left" ? -46 : 46}px) rotate(${side === "left" ? -3 : 3}deg)`;
      showPreview(side, 1);
      return;
    }
    armed = null;
    commit(side);
  };
  $("go-left").onclick = () => tapChoice("left");
  $("go-right").onclick = () => tapChoice("right");
  document.addEventListener("keydown", (e) => {
    if ($("app").hidden || busy || $("layer").childElementCount) return;
    if (e.key === "ArrowLeft") tapChoice("left");
    if (e.key === "ArrowRight") tapChoice("right");
  });
  card.addEventListener("pointerdown", () => (armed = null));
}

async function commit(side) {
  if (busy || !run || run.over) return;
  busy = true;
  const card = $("card");
  const dir = side === "left" ? -1 : 1;
  card.style.transform = `translateX(${dir * 140}%) rotate(${dir * 24}deg)`;
  card.style.opacity = "0";
  card.classList.remove("nudge");
  hideCoach();
  showPreview(null, 0);
  sfx.swipe();
  buzz(10);
  const res = choose(run, side);
  saveRun();
  // The tutorial counts as done only once its last card has resolved, not when the run starts.
  if (!meta.tutorialDone && run.tutorial && !tutorialPending(run)) {
    meta.tutorialDone = true;
    saveMeta();
  }
  await wait(220);
  renderHud();
  if (res.roll) sfx.dice();
  if (res.notes.some((n) => n.startsWith("Communion"))) sfx.light();
  await slip(res);
  if (res.ending) return finish();
  if (res.nightfall) await nightfall(res);
  if (run.lastEvent) await activation(run.lastEvent);
  renderHud();
  renderCard(true);
  busy = false;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function pips(n) {
  const map = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }[n];
  return Array.from({ length: 9 }, (_, i) => (map.includes(i + 1) ? "<i></i>" : "<span></span>")).join("");
}
function diceHtml(r) {
  const kept = r.kept.slice();
  return r.dice
    .map((d) => {
      const k = kept.indexOf(d);
      const on = k >= 0;
      if (on) kept.splice(k, 1);
      return `<span class="die${on ? "" : " drop"}">${pips(d)}</span>`;
    })
    .join("");
}
function chipsHtml(delta) {
  return Object.entries(delta)
    .filter(([k, v]) => v && DLBL[k] && (k !== "cage" || run.cageSeen))
    .map(([k, v]) => {
      const good = GOOD_UP.has(k) ? v > 0 : v < 0;
      return `<span class="chip ${good ? "good" : "bad"}">${DLBL[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}</span>`;
    })
    .join("");
}
const VERDICT = { radiance: "RADIANCE", hit: "CLEAN", mid: "AT A COST", miss: "THE WORLD MOVES", ruin: "RUIN" };
const DLBL = { mark: "Mark", strain: "Strain", favor: "Favor", hollow: "Hollow", longing: "Longing", untag: "Untaggable", gnosis: "Gnosis", cage: "Cage" };

function slip(res) {
  return new Promise((resolve) => {
    const el = document.createElement("div");
    el.className = "slip";
    el.setAttribute("role", "status");
    let html = "";
    if (res.roll) {
      const r = res.roll;
      const mod = r.stat === "fortune" ? "fortune" : `${STAT_LABEL[r.stat]} ${r.mod >= 0 ? "+" : "−"}${Math.abs(r.mod)}`;
      html += `<div class="dice">${diceHtml(r)}</div><div class="math">${mod} = <b>${r.total}</b></div><div class="verdict ${r.tier}">${VERDICT[r.tier]}</div>`;
    }
    html += `<p>${esc(res.text)}</p>`;
    // When the night follows (and the run goes on), its changes are shown on the nightfall screen instead.
    const night = res.nightfall && !res.ending ? res.nightfall : null;
    const nd = (night && night.delta) || {};
    // Over both key sets: a card's Strain +1 that the night takes back nets to nothing in res.delta.
    const own = Object.fromEntries([...new Set([...Object.keys(res.delta), ...Object.keys(nd)])].map((k) => [k, (res.delta[k] || 0) - (nd[k] || 0)]));
    const notes = night && night.notes ? res.notes.slice(0, res.notes.length - night.notes.length) : res.notes;
    const chips = chipsHtml(own);
    if (chips) html += `<div class="deltas">${chips}</div>`;
    if (notes.length) html += `<div class="notes">${notes.map((n) => `<span>${esc(n)}</span>`).join("")}</div>`;
    html += `<div class="tap">Tap to go on</div>`;
    el.innerHTML = html;
    $("play").appendChild(el);
    if (res.roll && (res.roll.tier === "ruin" || res.roll.tier === "miss")) buzz([20, 40, 20]);
    const done = () => {
      el.remove();
      document.removeEventListener("keydown", key);
      resolve();
    };
    const key = (e) => (e.key === "Enter" || e.key === " " || e.key.startsWith("Arrow")) && done();
    setTimeout(() => {
      el.addEventListener("click", done);
      document.addEventListener("keydown", key);
    }, 250);
  });
}

function overlay(html, { dismiss = true, cls = "" } = {}) {
  return new Promise((resolve) => {
    const back = document.activeElement;
    const el = document.createElement("div");
    el.className = "overlay" + (cls ? " " + cls : "");
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.tabIndex = -1;
    el.innerHTML = `<div class="inner">${html}</div>`;
    const title = el.querySelector(".big,.eyebrow");
    if (title) el.setAttribute("aria-label", title.textContent);
    $("layer").appendChild(el);
    (el.querySelector("button:not([disabled])") || el).focus({ preventScroll: true });
    let armed = false;
    const key = (e) => {
      if (!armed || el.parentNode !== $("layer") || $("layer").lastElementChild !== el) return;
      if (dismiss && (e.key === "Enter" || e.key === " " || e.key === "Escape")) e.preventDefault(), close();
    };
    const close = (v) => {
      el.remove();
      document.removeEventListener("keydown", key);
      if (back && back.isConnected && !$("layer").childElementCount) back.focus({ preventScroll: true });
      resolve(v);
    };
    el._close = close;
    document.addEventListener("keydown", key);
    setTimeout(() => (armed = true), 300);
    if (dismiss) setTimeout(() => el.addEventListener("click", () => close()), 300);
    el.querySelectorAll("[data-v]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        close(b.dataset.v);
      }),
    );
  });
}

function nightfall(res) {
  sfx.bell();
  buzz([30, 60, 30]);
  const nf = res.nightfall;
  const chips = nf.delta ? chipsHtml(nf.delta) : "";
  // The chips already say Hollow +1; keep only notes that add something (a Bond spent at night).
  const notes = (nf.notes || res.notes.filter((n) => n.startsWith("Nightfall"))).filter((n) => !(chips && n.startsWith("Nightfall without rest")));
  // The first nightfall says what a night does; after that the chips are enough.
  const first = !meta.hints.night;
  if (first) {
    meta.hints.night = 1;
    saveMeta();
  }
  return overlay(`<div class="eyebrow">The Bell</div><h2 class="big">Night ${run.day - 1} ends</h2>
    <p class="line">${nf.rested ? "You slept behind a barred door. The night gave something back." : "Behind the wall, just barely. You didn't really sleep, and your body noticed."}</p>
    ${chips ? `<div class="deltas">${chips}</div>` : ""}
    ${notes.map((n) => `<p class="fine">${esc(n)}</p>`).join("")}
    ${first ? `<p class="fine">Every ${CARDS_PER_DAY} cards the Bell rings. A night takes Strain off (more if you rested) and adds Hollow if you didn't. If nightfall finds you with no Favor, or Hollow full, the run ends.</p>` : ""}
    <p class="tap">Tap for dawn</p>`);
}

async function activation(ev) {
  const r = ev.roll;
  const first = !meta.hints.activation;
  if (first) {
    meta.hints.activation = 1;
    saveMeta();
  }
  const why = first
    ? `<p class="fine">Once a day, with Strain at 4 or more and another meter near its limit, a Mask tries to answer for you. The dice decide: 10+ you stay yourself, 7–9 it stirs, 6 or less it seizes you until nightfall.</p>`
    : "";
  const head = `<div class="eyebrow">Activation</div><div class="dice">${diceHtml(r)}</div>
    <h2 class="big" style="font-size:34px">${ev.kind === "seizure" ? "Seizure" : ev.kind === "stir" ? "The Mask stirs" : "Sovereignty holds"}</h2>
    <p class="line">${esc(ev.text)}</p>${why}`;
  if (ev.kind === "stir" && run.stir) {
    // §9.5, 7–9: the player decides, and the decision costs something either way.
    const m = MASKS[run.stir];
    const v = await overlay(
      `${head}<p class="fine">${esc(m.name)}: ${esc(m.bonus)} · ${esc(m.risk)}</p>
      <div class="row"><button class="btn primary" data-v="let" type="button">Let ${esc(m.name)} answer · wear it</button>
      <button class="btn" data-v="hold" type="button"${run.favor < 1 ? " disabled" : ""}>Hold the wheel · −1 Favor</button></div>`,
      { dismiss: false },
    );
    resolveStir(run, v === "hold");
    saveRun();
    renderHud();
    return;
  }
  return overlay(`${head}<p class="fine">Under load, the question isn't what you do. It's who decides.</p><p class="tap">Tap to go on</p>`);
}

// ---------- masks ----------
// The worn Mask's sigil sits faint behind the run and flares when the Mask changes (a switch or a seizure).
let sealOn = null;
function setSeal(k) {
  if (k === sealOn) return;
  const flare = sealOn !== null && k !== null;
  sealOn = k;
  document.querySelectorAll("#seal i").forEach((i) => {
    i.classList.toggle("on", i.dataset.k === k);
    i.classList.toggle("flare", flare && i.dataset.k === k);
  });
  if (flare) setTimeout(() => document.querySelectorAll("#seal i.flare").forEach((i) => i.classList.remove("flare")), 650);
}
let armedMask = null;
function onMask(k) {
  if (busy || !run || run.over || run.mask === k || run.stir) return;
  const cost = maskStrain(run, k);
  if (cost && armedMask !== k) {
    document.querySelectorAll(".mask").forEach((b) => b.classList.remove("arm"));
    armedMask = k;
    const b = $("k-" + k);
    b.classList.add("arm");
    b.querySelector(".cost").textContent = `tap: +${cost} strain`;
    setTimeout(() => {
      if (armedMask === k) {
        armedMask = null;
        b.classList.remove("arm");
        renderHud();
      }
    }, 2600);
    return;
  }
  armedMask = null;
  document.querySelectorAll(".mask").forEach((b) => b.classList.remove("arm"));
  const r = switchMask(run, k);
  buzz(8);
  saveRun();
  renderHud();
  if (r.notes && r.notes.length) toast(r.notes.join(" "));
  if (r.ending) finish();
  else toast(`${MASKS[k].name}: ${MASKS[k].bonus}`);
}

// ---------- endings ----------
function finish() {
  busy = true;
  hideCoach();
  const s = run;
  const e = ENDINGS[s.over];
  const n = nightsSurvived(s);
  const info = { firstFind: !meta.endings[s.over], newBest: meta.plays > 0 && n > meta.best };
  meta.endings[s.over] = (meta.endings[s.over] || 0) + 1;
  meta.plays++;
  meta.best = Math.max(meta.best, n);
  if (e.win) meta.crowns++;
  info.stillOut = nextStillOut(e.win);
  const text = shareText(s, shareUrl());
  if (s.mode === "vigil") meta.vigils[s.seedLabel] = { over: s.over, nights: n, text };
  if (saveMeta()) store.del("fl.run");
  else store.set("fl.run", s); // keep the completed attempt recoverable
  setMood(e.win ? "light" : "end");
  e.win ? sfx.light() : sfx.end();
  buzz(e.win ? [20, 30, 20, 30, 60] : info.firstFind ? [40, 60, 90] : [80]);
  showEnd(s, text, info);
}

// One tile per night, the same colours as the share card. Emoji stay in the pasted text, not the interface.
const NIGHT_TILE = { purple: "a quiet night", red: "a night on the edge", gold: "the Light", radiance: "radiance", end: "the end", crown: "a win" };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
// What ended the run, said as a sentence rather than a readout.
function causeSentence(s) {
  const c = endCause(s);
  if (!c) return "";
  const by = c.by && c.by !== "at nightfall" ? `<b>${esc(c.by.charAt(0).toUpperCase() + c.by.slice(1))}</b>` : null;
  const k = s.over.startsWith("named") ? "named" : s.over;
  const line = {
    named: by ? `${by} pushed your Mark to 6.` : "Your Mark reached 6.",
    fracture: by ? `${by} pushed your Strain to 6.` : "Your Strain reached 6.",
    fracture_reckoning: by ? `${by} pushed your Strain to 6 as the Light wore off.` : "Your Strain reached 6 as the Light wore off.",
    destitute: "Nightfall came and your Favor was gone.",
    collapse: "Nightfall came and your Hollow was full.",
    cage: "The Cage closed.",
    rex: "Menace made you what you fought.",
    billet: by ? `${by} followed you home.` : "They followed you home.",
    flag: "You picked up the old flag.",
    corner: "The raid on the old corner took you with it.",
  }[k];
  return line ? line + "<br />" : "";
}
// The counter to a death, said plainly after it. Rules only: every line is something the engine does.
const END_LESSON = {
  named: "Mark comes down when you change your routine, lie low, or take a stair nobody's mapped. The Sister hides you once.",
  fracture: "3 Favor in the purse absorbs one Fracture, and the Sponsor catches another. Rested nights take Strain off.",
  fracture_reckoning: "The Reckoning lands 3 Strain at once, 4 once the Light is a habit. Meet it with Strain low.",
  destitute: "The Bell wants at least 1 Favor in the purse. The Open Table catches one bad night.",
  collapse: "Hollow rises every night you don't rest. Sleep, the Sabbath and a meal bring it down, twice as fast bare-faced.",
  cage: "The Cage grows when help comes without terms. Ask what it costs. Name the pattern and you'll see it.",
  rex: "Every show of menace adds up. Staying small and keeping the Sabbath clear it.",
  billet: "Slipping home with a tail is a gamble. Lamps and crowds are the safe way out.",
  flag: "The old yard asks three times. Saying no out loud, at any of them, ends it.",
  corner: "Going back for the old work puts your face on the corner when the wagons come.",
};
const segs = (v, n) => `<div class="segs" style="--n:${n}">${Array.from({ length: n }, (_, i) => `<i${i < v ? ' class="on"' : ""}></i>`).join("")}</div>`;

// One ending you haven't found, by its gallery hint, a different one each run: the next thing to go looking for.
// The wins keep their own progress bars, except on a win's screen, where the other win is the next question.
// Picked once per ending: the next unfound one after the last named, in a fixed order, so the pool shrinking
// under it can't land on the same one twice running.
function nextStillOut(won) {
  const keys = Object.keys(ENDINGS).filter((k) => (won || !ENDINGS[k].win) && ENDINGS[k].hint);
  const at = keys.indexOf(meta.lastOut);
  const k = [...keys.slice(at + 1), ...keys.slice(0, at + 1)].find((x) => !meta.endings[x]);
  if (k) meta.lastOut = k;
  return k;
}
const stillOut = (k) => (k ? `<p class="stillout">Still out there: <i>${esc(ENDINGS[k].hint)}</i></p>` : "");
function lesson(s) {
  const k = s.over.startsWith("named") ? "named" : s.over;
  return END_LESSON[k] && (meta.endings[s.over] || 0) <= 3 ? `<p class="lesson">${END_LESSON[k]}</p>` : "";
}
// Order is the loop: what happened → why → go again / dare a friend → what you're collecting → what was hidden.
function endHtml(s, text, info) {
  const e = ENDINGS[s.over];
  const n = nightsSurvived(s);
  const cause = endCause(s);
  const keys = Object.keys(ENDINGS);
  const found = keys.filter((k) => meta.endings[k]).length;
  const rival = s.mode === "vigil" ? meta.rivals[s.seedLabel] : null;
  const vs = rival && rival.nights != null
    ? `<p class="vs">${n > rival.nights ? `You outlasted them: <b>${n}</b> nights to their <b>${rival.nights}</b>.` : n === rival.nights ? `Dead even: <b>${plural(n, "night")}</b> each.` : `They lasted <b>${rival.nights}</b>. You lasted <b>${n}</b>.`}</p>`
    : "";
  const reveal = [
    s.cage > 0 ? `<p>The Cage stood at <b>${s.cage}/8</b>${s.cageSeen ? "" : ", and you never saw it"}. It grows when you take help without terms, comply, or let a kindness hook you.</p>` : "",
    s.apo > 0 ? `<p>Menace: <b>${s.apo}/6</b>. Every show of danger drew the wolves closer.</p>` : "",
  ].join("");
  return `<div class="eyebrow">${s.mode === "vigil" ? `Vigil #${vigilNumber(s.seedLabel)}` : "Endless"} · Night ${s.day}</div>
    ${info.firstFind ? `<div class="newend">${e.win ? `Your first ${esc(e.title.replace(/^The /, ""))}` : "A new ending"}, ${found} of ${keys.length} found</div>` : ""}
    <h2 class="big">${esc(e.title)}</h2><p class="line">${esc(e.line)}</p>
    <p class="endcause">${causeSentence(s)}${e.win ? `${esc(e.title)} on night ${s.day}.` : n === 0 ? "You didn't reach the first nightfall" : `You lasted ${plural(n, "night")}`}${e.win ? "" : info.newBest ? `, <b class="best">your best yet</b>.` : meta.plays > 1 ? `. Your best is ${meta.best}.` : "."}</p>
    ${lesson(s)}
    ${vs}
    <div class="endact"><button class="btn primary" data-v="again" type="button">${s.mode === "vigil" ? "Run again · Endless" : "Run again"}</button>
    <button class="btn" data-v="share" type="button">${s.mode === "vigil" ? "Challenge a friend" : "Share result"}</button></div>
    <div class="collect" aria-label="Endings found">${keys.map((k) => `<i class="${meta.endings[k] ? "on" : ""}${k === s.over && info.firstFind ? " new" : ""}${ENDINGS[k].win ? " win" : ""}"></i>`).join("")}<span>${found} of ${keys.length} endings</span></div>
    ${stillOut(info.stillOut)}
    ${e.win ? "" : `<div class="crownprog"><div class="eyebrow">Double Crown</div><div><span>Untaggable ${s.untag}/12</span>${segs(s.untag, 12)}</div><div><span>Gnosis ${s.gnosis}/12</span>${segs(s.gnosis, 12)}</div>
    <div class="eyebrow">Ordinary Time</div><div><span>Bonds ${bondsEarned(s)}/3${s.flags.house ? " · a room" : ""}</span>${segs(bondsEarned(s) + (s.flags.house ? 1 : 0), 4)}</div></div>`}
    ${reveal ? `<div class="reveal">${reveal}</div>` : ""}
    <div class="nights" role="img" aria-label="Your nights, one tile each">${s.days.map((d) => `<i class="${esc(d)}" title="${NIGHT_TILE[d] || ""}"></i>`).join("")}</div>
    <p class="legend">${[...new Set(s.days)].map((d) => `<span><i class="${esc(d)}"></i>${NIGHT_TILE[d] || ""}</span>`).join("")}</p>
    <div class="row"><button class="btn ghost small" data-v="image" type="button">Share card</button>
    <button class="btn ghost small" data-v="home" type="button">Menu</button></div>
    ${RULEBOOK_URL ? `<a class="fine" href="${RULEBOOK_URL}" target="_blank" rel="noopener">Play the full tabletop RPG: The Poisoner of False Light</a>` : ""}`;
}

async function showEnd(s, text, info) {
  for (;;) {
    const v = await overlay(endHtml(s, text, info), { dismiss: false, cls: isWin(s) ? "won" : "" });
    if (v === "share") await shareTextFlow(text);
    else if (v === "image") await shareImageFlow(s);
    else if (v === "again") return start("endless");
    else return goHome();
  }
}

async function shareTextFlow(text) {
  if (navigator.share && !inFrame) {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("Result copied. Paste it anywhere.");
    return;
  } catch {}
  await overlay(`<div class="eyebrow">Copy your result</div><textarea class="copy" id="copybox" readonly>${esc(text)}</textarea><button class="btn" data-v="ok" type="button">Done</button>`, { dismiss: false });
}

async function shareImageFlow(s) {
  const canvas = await drawShareCard(s);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (blob && navigator.canShare && !inFrame) {
    const file = new File([blob], "false-light.png", { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: shareText(s, shareUrl()) });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
  }
  await overlay(`<div class="eyebrow">Long-press to save</div><img class="shareimg" alt="Your False Light result card" src="${canvas.toDataURL("image/png")}" /><button class="btn" data-v="ok" type="button">Done</button>`, { dismiss: false });
}

async function drawShareCard(s) {
  try {
    await document.fonts.ready;
  } catch {}
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#080609";
  g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(W / 2, 0, 40, W / 2, 0, 900);
  rg.addColorStop(0, isWin(s) ? "rgba(242,195,92,.45)" : "rgba(224,0,143,.38)");
  rg.addColorStop(1, "rgba(8,6,9,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(183,149,85,.6)";
  g.lineWidth = 3;
  g.strokeRect(40, 40, W - 80, H - 80);
  g.strokeStyle = "rgba(183,149,85,.25)";
  g.strokeRect(56, 56, W - 112, H - 112);
  g.textAlign = "center";
  const e = ENDINGS[s.over];
  g.fillStyle = "#b79555";
  g.font = '600 34px Cinzel, Georgia, serif';
  g.fillText("F A L S E   L I G H T", W / 2, 150);
  g.font = '500 26px Cinzel, Georgia, serif';
  g.fillStyle = "rgba(247,241,246,.6)";
  g.fillText(s.mode === "vigil" ? `VIGIL #${vigilNumber(s.seedLabel)}` : "ENDLESS", W / 2, 200);
  g.fillStyle = "#f7f1f6";
  g.font = '600 104px "Cormorant Garamond", Georgia, serif';
  wrap(g, e.title, W / 2, 400, W - 200, 104);
  g.font = 'italic 500 44px "Cormorant Garamond", Georgia, serif';
  g.fillStyle = "rgba(247,241,246,.72)";
  wrap(g, e.line, W / 2, 560, W - 220, 54);
  g.font = '600 40px Cinzel, Georgia, serif';
  g.fillStyle = isWin(s) ? "#f2c35c" : "#e0008f";
  g.fillText(isWin(s) ? `${s.over === "crown" ? "CROWNED" : "ORDINARY TIME"} ON NIGHT ${s.day}` : `${nightsSurvived(s)} NIGHT${nightsSurvived(s) === 1 ? "" : "S"} SURVIVED`, W / 2, 800);
  const cause = endCause(s);
  if (cause && cause.by) {
    g.font = '500 30px Inter, system-ui, sans-serif';
    g.fillStyle = "rgba(247,241,246,.7)";
    g.fillText(`Ended by ${cause.by}`, W / 2, 848);
  }
  const COL = { purple: "#8a44a0", red: "#ff4d6d", gold: "#f2c35c", radiance: "#fff3c4", end: "#2a2230", crown: "#f2c35c" };
  const days = s.days.slice(-24);
  const sz = 44, gap = 12, per = Math.min(12, days.length || 1);
  const gridTop = 890;
  days.forEach((d, i) => {
    const row = Math.floor(i / per), col = i % per;
    const rowLen = Math.min(per, days.length - row * per);
    const x0 = W / 2 - (rowLen * (sz + gap) - gap) / 2;
    g.fillStyle = COL[d] || COL.purple;
    g.fillRect(x0 + col * (sz + gap), gridTop + row * (sz + gap), sz, sz);
  });
  g.font = '500 34px Inter, system-ui, sans-serif';
  g.fillStyle = "rgba(247,241,246,.75)";
  g.fillText(`Gnosis ${s.gnosis}/12  ·  Untaggable ${s.untag}/12`, W / 2, 1075);
  if (s.cage > 0) {
    g.fillStyle = "rgba(138,68,160,.95)";
    g.fillText(s.cageSeen ? `The Cage: ${s.cage}/8` : `The Cage: ${s.cage}/8, never seen`, W / 2, 1125);
  }
  g.font = '500 26px Cinzel, Georgia, serif';
  g.fillStyle = "rgba(183,149,85,.9)";
  if (s.mode === "vigil") {
    g.font = '600 30px Cinzel, Georgia, serif';
    g.fillStyle = "#f2c35c";
    g.fillText("SAME SEED · YOUR TURN", W / 2, 1195);
  }
  g.font = '500 26px Cinzel, Georgia, serif';
  g.fillStyle = "rgba(183,149,85,.9)";
  g.fillText("A VENEFICA LUX GAME", W / 2, 1250);
  return c;
}
function wrap(g, text, x, y, max, lh) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (g.measureText(t).width > max && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  lines.push(line);
  lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
}

// ---------- home ----------
function goHome() {
  busy = false;
  setMood("home");
  $("layer").innerHTML = "";
  setSeal(null);
  $("app").hidden = true;
  $("home").hidden = false;
  renderHome();
}

const isoDay = (d) => d.toISOString().slice(0, 10);
function vigilStreak(today) {
  const kept = (d) => meta.vigils[d] && meta.vigils[d].over !== "abandoned";
  const d = new Date(today + "T12:00:00Z");
  if (!meta.vigils[today]) d.setUTCDate(d.getUTCDate() - 1); // tonight's isn't played yet; the streak is still alive (an abandoned one breaks it)
  let n = 0;
  for (; kept(isoDay(d)); n++) d.setUTCDate(d.getUTCDate() - 1);
  return n;
}

function renderHome() {
  const date = todayISO();
  const n = vigilNumber(date);
  const done = meta.vigils[date];
  const vigRun = run && run.mode === "vigil" && !run.over ? run : null;
  const resumeEndless = run && run.mode === "endless" && !run.over;
  const ch = incoming;
  const streak = vigilStreak(date);
  let html = "";
  if (ch) {
    // Someone sent a Vigil. Same seed; their score, if the link carried one, is the bar to clear.
    const vn = vigilNumber(ch.date);
    const mine = meta.vigils[ch.date];
    const theirs = ch.nights == null ? "" : `They lasted <b>${plural(ch.nights, "night")}</b>${ch.ending ? ` (${esc(ENDINGS[ch.ending].title)})` : ""}. `;
    html += `<div class="challenge" id="challenge"><div class="eyebrow">A challenge · Vigil #${vn}${ch.date === date ? " · today" : ` · ${ch.date}`}</div>
      <p>${theirs}Same seed. One attempt. Can you last longer?</p>
      ${mine ? `<p>You lasted <b>${plural(+mine.nights || 0, "night")}</b> (${esc(ENDINGS[mine.over]?.title || "Abandoned")}).</p>` : vigRun && vigRun.seedLabel === ch.date ? `<button class="btn primary" id="b-challenge" type="button">Resume the challenge</button>` : `<button class="btn primary" id="b-challenge" type="button">Take the challenge</button>`}</div>`;
  }
  // An unfinished Vigil from an earlier night stays resumable; it never hides tonight's.
  const oldVig = vigRun && vigRun.seedLabel !== date && !(ch && vigRun.seedLabel === ch.date) ? vigRun : null;
  if (oldVig) html += `<button class="btn" id="b-vigil-old" type="button">Resume Vigil #${vigilNumber(oldVig.seedLabel)}</button>`;
  if (vigRun && vigRun.seedLabel === date && !(ch && ch.date === date)) {
    html += `<button class="btn primary" id="b-vigil" type="button">Resume Vigil #${n}</button>`;
  } else if (done) {
    html += `<button class="btn" id="b-vigil-done" type="button">Vigil #${n}: ${esc(ENDINGS[done.over]?.title || "Abandoned")} · ${plural(+done.nights || 0, "night")}</button>
      <span class="sub">${streak >= 2 ? `${streak} Vigils in a row. ` : ""}Tap to challenge a friend. Next Vigil at midnight.</span>`;
  } else if (!(ch && ch.date === date)) {
    html += `<button class="btn primary" id="b-vigil" type="button">Tonight's Vigil #${n}</button>
      <span class="sub">${streak >= 2 ? `${streak} Vigils in a row so far. ` : ""}One attempt. Same seed for everyone.</span>`;
  }
  html += `<button class="btn" id="b-endless" type="button">${resumeEndless ? "Resume endless run" : "Endless run"}</button>`;
  if (resumeEndless) html += `<button class="sub" id="b-endless-new" type="button">Abandon it and start over</button>`;
  else html += `<span class="sub">As many runs as you like. A new deck every time.</span>`;
  $("menu").innerHTML = html;
  if ($("b-challenge")) $("b-challenge").onclick = () => start("vigil", ch.date);
  if ($("b-vigil")) $("b-vigil").onclick = () => start("vigil", date);
  if ($("b-vigil-old")) $("b-vigil-old").onclick = () => start("vigil", oldVig.seedLabel);
  if ($("b-vigil-done")) $("b-vigil-done").onclick = () => shareTextFlow(done.text || abandonedText(date));
  $("b-endless").onclick = () => start("endless");
  if ($("b-endless-new"))
    $("b-endless-new").onclick = () => {
      run = null;
      store.del("fl.run");
      start("endless");
    };
  const found = Object.keys(meta.endings).length;
  $("stats").innerHTML = meta.plays
    ? `<span><b>${meta.plays}</b>runs</span><span><b>${meta.best}</b>best nights</span><span><b>${found}/${Object.keys(ENDINGS).length}</b>endings</span><span><b>${meta.crowns}</b>wins</span>`
    : "";
  $("btn-sound").textContent = meta.mute ? "Sound off" : "Sound on";
  $("btn-music").textContent = meta.musicOff ? "Music off" : "Music on";
  $("btn-music").disabled = !!meta.mute;
  $("rulebook").innerHTML = RULEBOOK_URL ? `<a href="${RULEBOOK_URL}" target="_blank" rel="noopener">The full tabletop RPG →</a>` : "";
}

// A walked-away Vigil has no score to beat, but it can still be passed on.
const abandonedText = (date) => [`FALSE LIGHT · Vigil #${vigilNumber(date)} · VENEFICA LUX`, "I walked away from this one.", `Same seed. Your turn: ${shareUrl().split("#")[0]}#vigil-${date}`].join("\n");

function start(mode, date = todayISO()) {
  $("layer").innerHTML = "";
  const resumable = run && !run.over && run.mode === mode && (mode === "endless" || run.seedLabel === date);
  if (!resumable) {
    if (mode === "vigil" && meta.vigils[date]) return goHome();
    if (run && !run.over) {
      const vig = run.mode === "vigil" ? `Vigil #${vigilNumber(run.seedLabel)}` : "your endless run";
      return overlay(`<div class="eyebrow">Abandon this run?</div><p class="line">Starting a new run ends ${vig}.${run.mode === "vigil" ? " A Vigil you walk away from still counts as your one attempt." : ""}</p><div class="row"><button class="btn primary" data-v="cancel" type="button">Keep my run</button><button class="btn" data-v="abandon" type="button">Abandon it</button></div>`, { dismiss: false }).then(v => {
        if (v !== 'abandon') return goHome();
        if (run.mode === 'vigil') {
          const previous = meta.vigils[run.seedLabel];
          meta.vigils[run.seedLabel] = { over: "abandoned", nights: nightsSurvived(run), text: abandonedText(run.seedLabel) };
          if (!saveMeta()) {
            if (previous) meta.vigils[run.seedLabel] = previous;
            else delete meta.vigils[run.seedLabel];
            return goHome();
          }
        }
        run = null;
        return start(mode, date);
      });
    }
    const seed = mode === "vigil" ? date : `endless-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    run = newGame({ seed, mode, tutorial: !meta.tutorialDone });
    saveRun();
  }
  lastVals = {};
  $("home").hidden = true;
  $("app").hidden = false;
  startScore(); // start() always runs from a tap, so audio is allowed
  busy = false;
  renderHud();
  renderCard(true);
  // A stir left unanswered by a reload is asked again before anything else.
  if (run.stir && run.lastEvent && run.lastEvent.kind === "stir") {
    busy = true;
    activation(run.lastEvent).then(() => {
      busy = false;
      renderHud();
      renderCard(false);
    });
  }
}

function howTo() {
  return overlay(
    `<div class="eyebrow">How to play</div><div class="rules">
    <p><b>Swipe the card</b> left or right (or tap a choice twice). Lit vials and tracks show what a choice will move, never which way. ${SKULL} marks a choice that can end your run.</p>
    <p><b>Four meters.</b> Mark 6: you're Named. Strain 6: you Fracture (3 Favor absorbs one). Favor 0 or Hollow 4 at nightfall: it's over.</p>
    <p><b>Tap to check.</b> Tap any meter, track or the Bell in play for what it means and where it stands. Hold a Mask to read it.</p>
    <p><b>The Bell</b> (the dots, top right) counts four cards a day, then nightfall. A night takes some Strain off; a night without rest adds Hollow.</p>
    <p><b>Longing</b> is the ache the Light feeds on. At 3 or more, the False Light starts finding you.</p>
    <p><b>Rolls</b> are 2d6 + stat. 10+ clean, 7–9 at a cost, 6− the world moves. Double six is Radiance; snake eyes is Ruin. Hollow 3 rolls three dice and keeps the worst two.</p>
    <p><b>Masks</b> add +1 to a stat and carry a risk: Nyx Shade, Eris Steel, Lilith Frequency, and the Bare Face heals Hollow twice as fast. Changing is free at dawn, +1 Strain after (+1 more at Hollow 2). Under enough load a Mask can seize you: it holds until nightfall unless you pay +2 Strain to break it. Hold a Mask in play, or open the guide below, for what each one is for.</p>
    <p><b>The False Light</b> takes Strain and Hollow away, instantly. While it lasts, Gnosis can't rise. Then the Reckoning comes due, with interest, and putting it off with more Light leaves a tell: Mark +1 a dose.</p>
    <p><b>Bonds</b> are people: the Sister, the Sponsor, the Open Table. Each catches you once, from one kind of ending (Mark, Strain, a bad nightfall), then it's spent. Tap one to see what it saves.</p>
    <p><b>Win</b> one of two ways. Fill UNTAGGABLE and GNOSIS: the Double Crown. Or earn all three Bonds, get a room at the House, and rest through a night: Ordinary Time. Some things you won't see until it's too late to see them.</p>
    <p><b>Masks</b> open their own roads. Wear one and the city shows you cards it shows nobody else.</p>
    <p><b>Vigil</b>: one daily run. Everyone draws from the same seed, and dice never reorder it, but your choices change which cards can appear. Share your result and the link carries the seed and your score. <b>Endless</b>: as many as you like.</p>
    <p><b>Leaving</b> a run (☰, top left) keeps it; it resumes from the menu. Starting a different run asks before it ends the old one, and a Vigil you walk away from still counts as your attempt.</p>
    <p><b>Offline.</b> Add it to your home screen from the browser's menu. Once it has opened online it plays offline; each track is kept after it first plays.</p></div>
    <div class="row"><button class="btn small" data-v="masks" type="button">The Masks</button><button class="btn small" data-v="tut" type="button">Replay the tutorial</button><button class="btn ghost small" data-v="ok" type="button">Close</button></div>`,
    { dismiss: false },
  ).then((v) => {
    if (v === "masks") return masksGuide().then(howTo);
    if (v === "tut") {
      meta.tutorialDone = false;
      meta.hints = {};
      saveMeta();
      toast("The next new run starts with the tutorial and its hints.");
    }
  });
}

// What each Mask is for. Stats come from the engine, so the line can't drift from the rolls.
function masksGuide() {
  const sign = (v) => (v < 0 ? "−" : "+") + Math.abs(v);
  const stats = Object.entries(STATS).map(([k, v]) => `${STAT_LABEL[k]} ${sign(v)}`).join(" · ");
  const rows = Object.entries(MASKS)
    .map(([k, m]) => `<div class="mrow${run && !run.over && run.mask === k ? " on" : ""}">${svg(MASK_ART[k], 5)}<p><b>${m.name}</b> · ${m.bonus}. <span class="risk">Cost: ${m.risk}.</span><br>Wear it when ${m.use.charAt(0).toLowerCase()}${m.use.slice(1)}</p></div>`)
    .join("");
  return overlay(
    `<div class="eyebrow">The Masks</div><div class="rules">
    <p>Rolls are 2d6 + a stat: 10+ clean, 7–9 at a cost. Your stats: <b>${stats}</b>. A Mask adds +1 to one of them, usually around 15 points on your odds. Each choice that rolls shows its odds with the Mask you're wearing.</p>
    ${rows}
    <p><b>Changing</b> is free at dawn (the first card of each day), then +1 Strain (+1 more at Hollow 2). Mid-day it's worth paying when the card in front of you rolls a stat another Mask raises and the roll matters. A new Mask starts its clock again: Nyx's third card and Eris's fourth count from when you put it on.</p>
    <p><b>Seizure.</b> Once a day, with Strain 4+ and another meter near its limit, a Mask can try to answer for you: Eris facing a wolf, Lilith when Longing is high, otherwise Nyx. A clean roll keeps you sovereign (usually +1 Gnosis); 7–9 it stirs (let it, or hold the wheel for 1 Favor); worse, it seizes you until nightfall unless you pay +2 Strain.</p></div>
    <div class="row"><button class="btn ghost" data-v="ok" type="button">Close</button></div>`,
    { dismiss: false }, // the finger lifting off a long press must not close it
  );
}

function gallery() {
  const rows = Object.entries(ENDINGS)
    .map(([k, e]) => (meta.endings[k] ? `<div><h4>${esc(e.title)} · ×${meta.endings[k]}</h4><p>${esc(e.line)}</p></div>` : `<div class="locked"><h4>? ? ?</h4><p>${esc(e.hint || "Not yet found.")}</p></div>`))
    .join("");
  return overlay(`<div class="eyebrow">Endings · ${Object.keys(meta.endings).length}/${Object.keys(ENDINGS).length}</div><div class="gallery">${rows}</div><button class="btn ghost" data-v="ok" type="button">Close</button>`, { dismiss: false });
}

let toastTimer = null;
function toast(msg) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), Math.max(2600, msg.length * 55));
}

// ---------- boot ----------
let incoming = null;
function readChallenge() {
  incoming = parseChallenge(location.hash, todayISO());
  if (incoming && incoming.nights != null) {
    meta.rivals[incoming.date] = { nights: incoming.nights, ending: incoming.ending };
    saveMeta();
  }
}
function boot() {
  if (meta.plays >= 3 && !meta.hintsSeeded) {
    for (const h of HINTS) meta.hints[h] = 1;
    meta.hintsSeeded = true;
    saveMeta();
  }
  readChallenge();
  window.addEventListener("hashchange", () => {
    readChallenge();
    if (!$("home").hidden) renderHome();
  });
  buildHud();
  bindSwipe();
  $("btn-home").onclick = () => !busy && goHome();
  $("btn-how").onclick = howTo;
  $("btn-endings").onclick = gallery;
  $("btn-sound").onclick = () => {
    meta.mute = !meta.mute;
    saveMeta();
    musicOn() ? startScore() : stopScore();
    renderHome();
  };
  $("btn-music").onclick = () => {
    meta.musicOff = !meta.musicOff;
    saveMeta();
    musicOn() ? startScore() : stopScore();
    renderHome();
  };
  goHome();
  // Hosted copies install and work offline. On localhost the cache is opt-in (?sw), so local edits aren't
  // served stale; the browser gate uses it to prove the offline path.
  const swOk = location.protocol === "https:" || (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]sw\b/.test(location.search));
  if ("serviceWorker" in navigator && !inFrame && swOk) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
boot();
