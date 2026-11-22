// FALSE LIGHT — UI. Everything that touches the DOM lives here; the rules live in engine.js.
import { EMBLEMS, emblem, endingArt, ladderArt } from "./visuals.js";
import { POLISHED_LOOPS, loopFadeCurve, loopDue } from "./audio-loops.js";
import { lockAxis, pushSample, releaseVelocity, decide } from "./swipe.js";
import {
  newGame, choose, preview, switchMask, maskCost, maskStrain, tutorialPending, currentCard, shareText, vigilCardLine, vigilNumber, nightsSurvived,
  cardCosts, resolveStir, endCause, parseChallenge, parseExodus, exodusRules, isWin, bondsEarned, migrate, LAUNCH_DAY, CARDS, METERS, MASKS, LIGHT, ENDINGS, STAT_LABEL, STATS, CARDS_PER_DAY, BONDS,
  work, canWork, transmute, canTransmute, encClock, encBestRoad, ENCOUNTERS, INTENTS, RELICS, ROADS, ACTS, VERBS, UNLOCKS, EDICTS, MAX_EDICT, pullAt, bareAt,
  skyToday, canRefuse, refuse, relicPrice, canCorrespond, correspond, canVessel, vessel, synergiesFor,
} from "./engine.js";
import {
  SPHERES, LADDER, MEANS, RITES, ACCOUNTS, PATHS, TRACK_WORD, STONES, ORBIT, occOf, occDay, pathOf, shownTrack, sphereName, riteOn, occReading, inVessel, isStone,
  hourOf, gatesPassed,
} from "./occult.js";
import { RECIPES, RIT_STATES, ritRecord, ritBook, ritEntry } from "./ritual.js";
import { PREPS, PREP_STATES, prepRecord, prepBook, prepEntry } from "./prep.js";
import { ARCANA, ARCANA_PLANNED, SIGNS, PLANETS, PLACES, DIGNITY_WORD, cardTitle, cardLine, rulerName } from "./arcana.js";

// OWNER DECISION: canonical public URLs. PLAY_URL is where shared links point when the page can't see its
// own address (inside itch.io's player or the artifact frame, or opened from a file). Empty hides the link.
// 2026-10-13: the itch.io page, the copy players are actually on. itch doesn't pass a link's #fragment into its
// player, so a dare opened there plays tonight's Vigil without the friend's score to beat.
const PLAY_URL = "https://veneficalux.itch.io/false-light";
const RULEBOOK_URL = "";
// The soundtrack: VENEFICA LUX's own tracks, shipped beside the page in music/. When they can't load
// (a single file opened from a phone's file manager), the procedural score below plays instead.
// Each Mask has her own track: NYX REVENANT, ERIS VALENTINE and LILITH ABRAXAS (2026-10-13).
const TRACKS = {
  vigil: "music/vigil.mp3", light: "music/communion.mp3", cascade: "music/geometry.mp3", sour: "music/communion-sour.mp3",
  nyx: "music/nyx.mp3", eris: "music/eris.mp3", lilith: "music/lilith.mp3",
  litany: "music/litany.mp3", architect: "music/architect.mp3", unmaking: "music/unmaking.mp3",
};

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

const META0 = { endings: {}, best: 0, plays: 0, crowns: 0, tutorialDone: false, vigils: {}, rivals: {}, hints: {}, mute: false, asc: null };
const occRecord = (o) => {
  const x = o && typeof o === "object" && !Array.isArray(o) ? o : {};
  const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  return { gates: obj(x.gates), paths: obj(x.paths), rit: ritRecord(x.rit), prep: prepRecord(x.prep) };
};
// Saved metadata outlives releases too: missing or mistyped fields take their defaults, nothing present is lost.
function loadMeta() {
  const m = store.get("fl.meta", {});
  const out = { ...META0, ...(m && typeof m === "object" && !Array.isArray(m) ? m : {}) };
  for (const k of ["endings", "vigils", "rivals", "hints"]) if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) out[k] = {};
  for (const k of ["best", "plays", "crowns"]) if (!Number.isFinite(out[k])) out[k] = 0;
  for (const [d, v] of Object.entries(out.vigils)) if (!v || typeof v !== "object") out.vigils[d] = { over: "abandoned", nights: 0, text: "" };
  // Exodus's own record (its mode id is "ascension"): runs, the furthest act, adversaries met and how, intents seen (the Adversaries sheet).
  const a = out.asc && typeof out.asc === "object" && !Array.isArray(out.asc) ? out.asc : {};
  // Exodus was public before it opened up this way (2026-10-17): anyone with a finished or a saved road keeps the map.
  const veteran = (Number.isFinite(a.runs) && a.runs > 0) || !!store.get("fl.asc", null);
  out.asc = {
    runs: Number.isFinite(a.runs) ? a.runs : 0,
    act: Number.isFinite(a.act) ? a.act : 0,
    met: a.met && typeof a.met === "object" && !Array.isArray(a.met) ? a.met : {},
    seen: a.seen && typeof a.seen === "object" && !Array.isArray(a.seen) ? a.seen : {},
    // What's been unsealed (ascension.js UNLOCKS). Anyone who walked Exodus before it opened up this way keeps the
    // whole map they already had.
    unlocked: Array.isArray(a.unlocked) ? a.unlocked.filter((k) => UNLOCKS[k]) : veteran ? Object.keys(UNLOCKS) : [],
    // Your line of heretics, newest last: { n, by, end, act, edict, won }. The last one walks into the next road.
    lineage: Array.isArray(a.lineage) ? a.lineage.filter((x) => x && typeof x.n === "string").slice(-12) : [],
    // The highest Edict unsealed (EDICTS): 0 until a Way Out.
    // Someone who walked a Way Out before Edicts existed has already earned the first.
    edict: Number.isFinite(a.edict) ? Math.max(0, Math.min(MAX_EDICT, Math.floor(a.edict))) : Object.keys(out.endings).some((k) => ENDINGS[k] && ENDINGS[k].family === "unmaking" && ENDINGS[k].win) ? 1 : 0,
    // The occult expansion (occult.js), for the codex only: knowledge, never power. gates: how often each sphere's gate
    // was passed, by what means; paths: how often each way was walked.
    occ: occRecord(a.occ),
  };
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
  meta.vigils[run.seedLabel] ??= { over: run.over, nights: nightsSurvived(run), text: shareText(run, PLAY_URL), ...(run.late ? { late: true } : {}) };
  if (store.set('fl.meta', meta)) store.del('fl.run');
}
if (run && (run.v !== 1 || run.over || !currentCard(run))) run = null;
// Exodus keeps its own slot, so a long run survives a Vigil or an Endless run played in between. `run` is
// whichever run is on screen; `reg` is the Endless or Vigil slot, `ascRun` the Exodus slot.
let ascRun = migrate(store.get("fl.asc", null));
if (ascRun && (ascRun.v !== 1 || ascRun.over || ascRun.mode !== "ascension" || !currentCard(ascRun))) ascRun = null;
if (run && run.mode === "ascension") run = null;
let reg = run;
const slotOf = (r) => (r && r.mode === "ascension" ? "fl.asc" : "fl.run");
let busy = false;
const inFrame = (() => {
  try {
    return window.top !== window;
  } catch {
    return true;
  }
})();

const saveMeta = () => store.set("fl.meta", meta);
const saveRun = () => (run && !run.over ? store.set(slotOf(run), run) : store.del(slotOf(run)));
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayISO = () => localISO(new Date());
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localISO(d);
};
// A hosted copy links to itself; the artifact frame and file:// fall back to PLAY_URL.
const shareUrl = () => (!inFrame && /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname) ? location.origin + location.pathname : PLAY_URL);

// ---------- art ----------
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  const r1 = 24, r2 = i % 2 ? 36 : 44;
  return `M${50 + r1 * Math.cos(a)} ${50 + r1 * Math.sin(a)}L${50 + r2 * Math.cos(a)} ${50 + r2 * Math.sin(a)}`;
}).join("");
// The occult expansion's seal: a heptagram {7/3}, one point for each of the Seven, inside a double ring.
const HEPTA = Array.from({ length: 7 }, (_, i) => {
  const a = -Math.PI / 2 + ((i * 3) % 7) * ((2 * Math.PI) / 7);
  return `${i ? "L" : "M"}${(50 + 26 * Math.cos(a)).toFixed(1)} ${(50 + 26 * Math.sin(a)).toFixed(1)}`;
}).join("") + "Z";
const ART = {
  // The occult expansion's own (occult.js, 2026-10-26): the crypt stair, the two ways, a star in its orbit, the seal of
  // the Seven, the vessel and the Stone. Original line marks.
  stair: '<path d="M20 90V40Q20 12 50 12Q80 12 80 40V90"/><path d="M28 90H40V78H52V66H64V54H72"/><path d="M50 28V38"/>',
  ways: '<path d="M10 90V30H44V90M10 30L27 16L44 30"/><path d="M16 82Q38 76 30 62Q22 48 38 44Q50 40 42 28"/><path d="M56 90V36Q56 20 72 20Q88 20 88 36V90"/><path d="M72 50L79 61L72 72L65 61Z" fill="currentColor"/><path d="M72 42V50"/>',
  orbit: '<ellipse cx="50" cy="52" rx="42" ry="15" transform="rotate(-18 50 52)"/><path d="M50 24L56 46L78 52L56 58L50 80L44 58L22 52L44 46Z"/><circle cx="88" cy="38" r="3.5" fill="currentColor"/>',
  seal: `<circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="33"/><path d="${HEPTA}"/><circle cx="50" cy="50" r="5" fill="currentColor"/>`,
  alembic: '<path d="M38 18H62M44 18V40Q22 52 26 72Q30 90 50 90Q70 90 74 72Q78 52 56 40V18"/><path d="M56 30Q80 24 92 46M30 70H70"/>',
  stone: '<path d="M50 10L82 36L68 88H32L18 36Z"/><path d="M18 36H82M50 10L38 36L50 88L62 36Z"/>',
  // The Celestial Arcana's own (2026-10-26): the wheel of the sky, a struck tower, an eight-pointed star.
  wheel: '<circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="14"/><path d="M50 12V36M50 64V88M12 50H36M64 50H88M23 23L40 40M60 60L77 77M77 23L60 40M40 60L23 77"/>',
  tower: '<path d="M34 90V34H66V90M30 34H70M38 34V24H62V34M44 90V72Q50 64 56 72V90"/><path d="M58 8L46 26H56L44 44" stroke-width="3"/>',
  star: '<path d="M50 8L58 42L92 50L58 58L50 92L42 58L8 50L42 42Z"/><path d="M50 26L54 46L74 50L54 54L50 74L46 54L26 50L46 46Z" opacity=".55"/>',
  relic_glass: '<circle cx="50" cy="38" r="25"/><circle cx="50" cy="38" r="17"/><path d="M45 63v27h10V63M36 38q14-16 28 0q-14 16-28 0z"/>',
  relic_key: '<circle cx="28" cy="38" r="16"/><path d="M42 45l38 34M70 70l-8 9M60 61l-8 9M17 37q11-16 22 0"/>',
  relic_halo: '<path d="M65 22a32 32 0 1 0 14 18M65 22l-8 13M79 40l-15 5"/>',
  relic_crown: '<path d="M16 76l4-42l17 20l8-24M55 30l8 24l17-20l4 42M16 84h28M56 84h28M51 12l-9 26l16 20l-12 36"/>',
  relic_lamp: '<path d="M32 30h36l4 48H28zM42 30V18h16v12M50 18V8M28 86h44M50 42l10 16l-10 14l-10-14z"/>',
  relic_purse: '<path d="M36 20h28l-6 20q24 18 22 38q-2 14-30 14T20 78q-2-20 22-38zM36 40h28M42 14l8 8l8-8"/>',

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
function face(key, adversary = null) {
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
    <g transform="${adversary ? "translate(100 246) scale(1)" : "translate(95 132) scale(1.1)"}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" filter="url(#fl-glow)" style="color:var(--art)">${adversary ? EMBLEMS[adversary] || ART[key] : ART[key] || ART.eye}</g>
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
// through a low-pass, muffled, while the Reckoning lasts. A worn Mask plays her own track, held down under a
// low-pass: the frequency you're operating from. When she seizes the wheel, the same track opens up, full and
// loud, and it outranks the Cascade: she's the one deciding. The Bare Face plays Vigil. A "track@rate" key
// plays a track slowed like tape (pitch drops with it), for a mood that has no file of its own.
// Exodus (2026-10-13): THE DOMINION · LITANY OF CHAINS for the Inquisition, opening a little each phase
// (enc_<id>_<phase>), and for the Ledger a touch slower. The Shepherd keeps Communion, slowed and held low: warmth
// that isn't. REX MUNDI · THE ARCHITECT for the Grammar, held down until the Full Stop; the Festival is Communion
// at full, the music of every Light you took, because it was always his. THE UNMAKING · THE WORLD WITHOUT A KING
// plays under the Oldest Trap, held down, and opens on a Way Out's end screen; sitting in the chair gets the
// Architect instead, slowed and muffled.
const MOOD_TRACK = {
  home: "vigil", warrens: "vigil", reckoning: "vigil", light: "light", cascade: "cascade", end: "vigil",
  worn_nyx: "nyx", worn_eris: "eris", worn_lilith: "lilith", seized_nyx: "nyx", seized_eris: "eris", seized_lilith: "lilith",
  enc_inquisition_0: "litany", enc_inquisition_1: "litany", enc_inquisition_2: "litany",
  enc_hierarch_0: "litany", enc_hierarch_1: "litany", enc_hierarch_2: "litany",
  enc_sentinel_0: "cascade@0.9", enc_sentinel_1: "cascade@0.9", enc_sentinel_2: "cascade@0.9",
  enc_ledger_0: "litany@0.92", enc_ledger_1: "litany@0.92", enc_ledger_2: "litany@0.92",
  enc_shepherd_0: "light@0.8", enc_shepherd_1: "light@0.8", enc_shepherd_2: "light@0.8",
  enc_grammar_0: "architect", enc_grammar_1: "architect", enc_festival_0: "light", enc_festival_1: "light", enc_trap_0: "unmaking",
  unmade: "unmaking", decreed: "architect@0.85",
};
const MOOD_LEVEL = {
  home: 0.3, warrens: 0.42, reckoning: 0.36, light: 0.46, cascade: 0.44, end: 0.14,
  worn_nyx: 0.36, worn_eris: 0.32, worn_lilith: 0.32, seized_nyx: 0.5, seized_eris: 0.48, seized_lilith: 0.48,
  enc_inquisition_0: 0.34, enc_inquisition_1: 0.4, enc_inquisition_2: 0.48,
  enc_hierarch_0: 0.32, enc_hierarch_1: 0.38, enc_hierarch_2: 0.46,
  enc_sentinel_0: 0.30, enc_sentinel_1: 0.36, enc_sentinel_2: 0.44,
  enc_ledger_0: 0.32, enc_ledger_1: 0.38, enc_ledger_2: 0.46,
  enc_shepherd_0: 0.3, enc_shepherd_1: 0.34, enc_shepherd_2: 0.4,
  enc_grammar_0: 0.36, enc_grammar_1: 0.46, enc_festival_0: 0.48, enc_festival_1: 0.52, enc_trap_0: 0.3,
  unmade: 0.44, decreed: 0.22,
};
const MOOD_CUT = {
  home: 18000, warrens: 18000, reckoning: 700, light: 18000, cascade: 18000, end: 500,
  worn_nyx: 2600, worn_eris: 2200, worn_lilith: 3200, seized_nyx: 18000, seized_eris: 18000, seized_lilith: 18000,
  enc_inquisition_0: 1600, enc_inquisition_1: 3200, enc_inquisition_2: 18000,
  enc_hierarch_0: 1600, enc_hierarch_1: 3000, enc_hierarch_2: 18000,
  enc_sentinel_0: 1400, enc_sentinel_1: 2400, enc_sentinel_2: 8000,
  enc_ledger_0: 1400, enc_ledger_1: 2600, enc_ledger_2: 18000,
  enc_shepherd_0: 1800, enc_shepherd_1: 1500, enc_shepherd_2: 1100,
  enc_grammar_0: 1800, enc_grammar_1: 18000, enc_festival_0: 18000, enc_festival_1: 18000, enc_trap_0: 1400,
  unmade: 18000, decreed: 900,
};
const XF = 4; // seconds: loop seams and mood changes
// Each pass streams through an <audio> element into the Web Audio graph. Decoding whole tracks into
// AudioBuffers would cost ~175 MB of PCM for the full score on a phone; a stream holds a few seconds.
const T = { bus: null, lp: null, cur: null, poll: null, wait: null, failed: false, voices: new Set() };
function voiceOf(k, fade, to = T.lp) {
  const [file, rate] = k.split("@");
  const el = new Audio(TRACKS[file]);
  el.preload = "auto";
  if (rate) {
    // Slowed like tape, so the pitch drops with it.
    el.preservesPitch = el.mozPreservesPitch = el.webkitPreservesPitch = false;
    el.defaultPlaybackRate = el.playbackRate = Number(rate);
  }
  const node = ac.createMediaElementSource(el);
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  if (!POLISHED_LOOPS.has(file)) g.gain.exponentialRampToValueAtTime(1, t + fade);
  node.connect(g).connect(to);
  const v = { k, el, node, g, ready: null };
  let refuse;
  v.ready = new Promise((ok, no) => {
    refuse = no;
    el.addEventListener("playing", () => {
      if (POLISHED_LOOPS.has(file)) g.gain.setValueCurveAtTime(loopFadeCurve("in"), ac.currentTime, fade);
      ok();
    }, { once: true });
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
  const heldGain = Math.max(0.0001, v.g.gain.value);
  v.g.gain.cancelScheduledValues(0);
  v.g.gain.setValueAtTime(heldGain, t);
  if (POLISHED_LOOPS.has(v.k.split("@")[0])) {
    const level = heldGain;
    v.g.gain.setValueCurveAtTime(loopFadeCurve("out").map((n) => n * level), t, d);
  } else v.g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  setTimeout(() => dropVoice(v), d * 1000 + 150);
}
function seams() {
  const v = T.cur;
  if (!v || !score.on || v.looping || v.el.paused) return;
  if (loopDue(v.el.currentTime, v.el.duration, v.el.playbackRate, XF)) {
    v.looping = true;
    const next = voiceOf(v.k, XF);
    // Keep the old pass audible while the stream buffers. A mood change meanwhile
    // owns the score; its stale incoming loop is discarded.
    next.ready.then(() => {
      if (!score.on || T.cur !== v) return dropVoice(next);
      T.cur = next;
      fadeVoice(v, XF);
    }).catch(() => {});
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
  // A seizure is sudden: the filter and the level open in about a second, not the usual glide.
  if (m.startsWith("seized_")) {
    T.bus.gain.setTargetAtTime(MOOD_LEVEL[m], t, 0.35);
    T.lp.frequency.setTargetAtTime(MOOD_CUT[m], t, 0.3);
  }
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
  motifTick();
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
  worn_nyx: { cut: 460, third: 130.81, thirdG: 0.1, shim: 0, sour: 7, wind: 0.045, gain: 0.055 },
  worn_eris: { cut: 460, third: 130.81, thirdG: 0.1, shim: 0, sour: 7, wind: 0.045, gain: 0.055 },
  worn_lilith: { cut: 460, third: 130.81, thirdG: 0.1, shim: 0, sour: 7, wind: 0.045, gain: 0.055 },
  seized_nyx: { cut: 230, third: 123.47, thirdG: 0.05, shim: 0, sour: 18, wind: 0.1, gain: 0.05 },
  seized_eris: { cut: 820, third: 123.47, thirdG: 0.14, shim: 0, sour: 38, wind: 0.05, gain: 0.062 },
  seized_lilith: { cut: 1700, third: 138.59, thirdG: 0.12, shim: 0.06, sour: 24, wind: 0.02, gain: 0.058 },
  end: { cut: 200, third: 130.81, thirdG: 0, shim: 0, sour: 7, wind: 0.02, gain: 0 },
  // Exodus's end screens: a Way Out (major, open, a little shimmer) and the chair (low, sour, nearly gone).
  unmade: { cut: 1300, third: 138.59, thirdG: 0.14, shim: 0.04, sour: 3, wind: 0.015, gain: 0.05 },
  decreed: { cut: 260, third: 123.47, thirdG: 0.04, shim: 0, sour: 26, wind: 0.04, gain: 0.03 },
};
// The adversaries on the procedural score: the Inquisition and the Ledger grind (sour, minor), the Shepherd glows a
// little too warm, the Grammar is a muffled drone, the Festival is all shimmer, the Oldest Trap is nearly silent.
for (const [k, m] of Object.entries({
  inquisition: { cut: 540, third: 123.47, thirdG: 0.1, shim: 0, sour: 38, wind: 0.07, gain: 0.058 },
  hierarch: { cut: 580, third: 123.47, thirdG: 0.10, shim: 0, sour: 34, wind: 0.06, gain: 0.055 },
  sentinel: { cut: 420, third: 123.47, thirdG: 0.07, shim: 0, sour: 40, wind: 0.04, gain: 0.052 },
  ledger: { cut: 500, third: 123.47, thirdG: 0.08, shim: 0, sour: 28, wind: 0.06, gain: 0.055 },
  shepherd: { cut: 900, third: 138.59, thirdG: 0.12, shim: 0.025, sour: 12, wind: 0.02, gain: 0.052 },
  grammar: { cut: 300, third: 123.47, thirdG: 0.06, shim: 0, sour: 22, wind: 0.09, gain: 0.05 },
  festival: { cut: 1800, third: 138.59, thirdG: 0.16, shim: 0.07, sour: 5, wind: 0.01, gain: 0.062 },
  trap: { cut: 220, third: 130.81, thirdG: 0.03, shim: 0, sour: 3, wind: 0.03, gain: 0.04 },
})) for (const p of [0, 1, 2]) MOODS[`enc_${k}_${p}`] = { ...m, cut: m.cut * (1 + p * 0.35) };
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
// The Reckoning card itself counts as the Reckoning: that is the moment the gold drains out. The Light outranks
// a seized Mask (in the Light no Mask answers); a seized Mask outranks the Cascade (it's the one deciding); the
// Cascade outranks a Mask merely worn.
const inLight = (s) => s.communion > 0 || s.reckoning > 0 || s.cardId === "reckoning";
// In Exodus an adversary's music outranks a Mask's (it's their room), but not the Light or the Reckoning.
const encMood = (s) => {
  const e = s.asc && s.asc.enc;
  const k = e && `enc_${e.id}_${e.phase}`;
  return k && MOOD_TRACK[k] ? k : null;
};
const runMood = (s) =>
  s.communion > 0 ? "light"
  : s.reckoning > 0 || s.cardId === "reckoning" ? "reckoning"
  : encMood(s) ? encMood(s)
  : s.maskLocked && MASKS[s.mask].seized ? "seized_" + s.mask
  : s.cascade ? "cascade"
  : MASKS[s.mask].seized ? "worn_" + s.mask : "warrens";

// ---------- the Masks' figures, for the procedural score ----------
// The tracks carry each Mask's own music. When the fallback plays instead, each Mask worn gets a figure on top of
// it, quiet while worn, loud while it holds the wheel.
// Nyx: a cold minor second sinking in the dark. Eris: a struck blade on the beat. Lilith: a high fifth that
// swells and slides like a serpent. The Bare Face has none: the Vigil is already her song. In the Light the
// figures stop, because no Mask answers there. Played through the Music toggle, like the rest of the score.
const MOTIF = {
  nyx: { every: 3400, seized: 1900, gain: 0.05, notes: [[164.81, 0], [155.56, 0.9]], dur: 2.8, type: "sine", cut: 900 },
  eris: { every: 920, seized: 620, gain: 0.035, notes: [[2349, 0], [1760, 0.012]], dur: 0.18, type: "square", cut: 4200, accent: 4 },
  lilith: { every: 5200, seized: 2600, gain: 0.03, notes: [[880, 0], [1318.5, 0.35]], dur: 3.6, type: "sine", cut: 6000, slide: 0.97 },
};
const L = { out: null, timer: null, beat: 0, k: null };
const layerFor = () =>
  score.on && score.kind === "synth" && musicOn() && run && !run.over && !$("app").hidden && !inLight(run) && MOTIF[run.mask] ? { k: run.mask, seized: !!run.maskLocked } : null;
function motifTick() {
  clearTimeout(L.timer);
  const want = layerFor();
  if (!want || document.hidden || !ac || ac.state !== "running") {
    L.k = null;
    L.timer = setTimeout(motifTick, 1000);
    return;
  }
  const m = MOTIF[want.k];
  if (L.k !== want.k) (L.k = want.k), (L.beat = 0);
  try {
    if (!L.out) {
      L.out = ac.createGain();
      L.out.gain.value = 1;
      L.out.connect(ac.destination);
    }
    const t = ac.currentTime + 0.02;
    const loud = (want.seized ? 1.8 : 1) * (m.accent && L.beat % m.accent === 0 ? 1.6 : 1);
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = m.cut;
    lp.connect(L.out);
    for (const [f, at] of m.notes) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = m.type;
      o.frequency.setValueAtTime(f, t + at);
      if (m.slide) o.frequency.exponentialRampToValueAtTime(f * m.slide, t + at + m.dur);
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(m.gain * loud, t + at + Math.min(0.6, m.dur / 3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + m.dur);
      o.connect(g).connect(lp);
      o.start(t + at);
      o.stop(t + at + m.dur + 0.05);
    }
    setTimeout(() => lp.disconnect(), (m.dur + 1.2) * 1000);
  } catch {}
  L.beat++;
  L.timer = setTimeout(motifTick, want.seized ? m.seized : m.every);
}
// The moment a Mask takes the wheel, on the procedural score: its figure, struck hard and low, once. (On the
// tracks, her own track opening up is the moment.)
function takeover(k) {
  const m = MOTIF[k];
  if (!m || !musicOn() || !ac || score.kind !== "synth") return;
  try {
    const t = ac.currentTime;
    [[m.notes[0][0] / 4, 0.12], [m.notes[0][0] / 2, 0.08], [m.notes[m.notes.length - 1][0] / 2, 0.06]].forEach(([f, g], i) => {
      const o = ac.createOscillator();
      const v = ac.createGain();
      o.type = i ? "triangle" : "sawtooth";
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.94, t + 2.4);
      v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(g, t + 0.03);
      v.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(v).connect(ac.destination);
      o.start(t);
      o.stop(t + 2.7);
    });
  } catch {}
}
// A hidden page stops the home sigil's filter animation (CSS keys off this class).
const markHidden = () => document.documentElement.classList.toggle("page-hidden", document.hidden);
document.addEventListener("visibilitychange", markHidden);
markHidden();
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
// The basics: a player with 3+ runs has met these and isn't taught them again. Lines tied to an event (the first
// Light, Activation, Bond, nightfall) aren't here: they're said the first time it happens, however many runs in.
const HINTS = ["dots", "roll", "lethal", "cost", "masks", "danger", "goal", "inspect"];
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
  // Taps read the board as drawn (under a slip, the card's own result), never a night that hasn't been shown yet.
  for (const [k, m] of Object.entries(METERS)) $("m-" + k).onclick = () => run && toast(`${m.label} ${board()[k]}/${m.max}. ${m.hint}`);
  // Every track and the Bell answer a tap the same way the meters do: what it is, where it stands, what it does.
  for (const [k, id] of Object.entries(TRACK_EL)) {
    $(id).onclick = (e) => run && !e.target.closest(".bond") && toast(TRACK_INFO[k](board()));
  }
  $("bell").onclick = () => run && toast(bellInfo(board()));
  $("sky").onclick = () => run && run.arc && skySheet(board());
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
  for (const k of Object.keys(BONDS)) $("b-" + k).onclick = () => toast(bondInfo(k));
}
// A Bond's tap: held, spent or not yet earned (the icon says so only by its opacity), what it saves, and the room at
// the House, the one Ordinary Time condition with no mark of its own on the board.
function bondInfo(k) {
  const b = BONDS[k];
  const s = run && board();
  const state = !s ? "" : s.bonds.includes(k) ? ", held" : (s.spent || []).includes(k) ? ", spent" : ", not yet earned";
  return `${b.name}${state}: ${b.hint.split(": ").slice(1).join(": ")}${s && s.flags.house ? " You have a room at the House." : ""}`;
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
// What the HUD last drew: the run, or under a slip the card's own board. Taps and the Masks guide read this.
let drawn = null;
const board = () => drawn || run;
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
  encOf(s)
    ? `The Bell is held for the fight, at card ${Math.min(s.bell + 1, CARDS_PER_DAY)} of ${CARDS_PER_DAY}: no night falls until the fight ends, and then one does.`
    : `The Bell: card ${Math.min(s.bell + 1, CARDS_PER_DAY)} of ${CARDS_PER_DAY} today. After card ${CARDS_PER_DAY}, nightfall: no Favor or a full Hollow ends the run, and a night without rest adds Hollow.`;
// view: a board to show instead of the run (the card's own result, under its slip; see commit()).
function renderHud(view = null) {
  const s = (drawn = view || run);
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
  // After fill(), which rewrites each number and would take a float with it.
  const inFight = !!encOf(s);
  for (const [k, id] of Object.entries(TRACK_EL)) {
    if (k === "cage" && !s.cageSeen) continue;
    if (lastVals[k] !== undefined && lastVals[k] !== s[k]) {
      floatDelta(inFight && (k === "untag" || k === "gnosis") ? $("t-sum") : $(id).querySelector(".n"), k, s[k] - lastVals[k]);
      if ((k === "untag" || k === "gnosis") && s[k] > lastVals[k]) coach("goal", "Fill both UNTAGGABLE and GNOSIS and you win. That's the Double Crown.");
    }
    lastVals[k] = s[k];
  }
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
  // In a fight the top bar is the fight's: who, which phase, which card of how many. The Bell is held.
  const fight = encOf(s);
  const fdef = fight && ENCOUNTERS[fight.id];
  const pname = fdef && fdef.phases[fight.phase].name;
  const phase = pname && pname !== fdef.name && !fdef.name.endsWith(pname) ? ` · ${pname.toUpperCase()}` : "";
  $("mode-lbl").textContent = s.mode === "vigil" ? `VIGIL #${vigilNumber(s.seedLabel)}`
    : fight ? `${fdef.short.toUpperCase()}${phase} · ${Math.min(fight.turn + 1, fdef.cap)}/${fdef.cap}`
    : s.mode === "ascension" ? `EXODUS ${ROMAN_ACT[s.asc.act]}${s.asc.edict ? ` · EDICT ${roman(s.asc.edict)}` : ""}` : "ENDLESS";
  if (fight) $("mode-lbl").innerHTML = `<span class="enc-name">${esc(fdef.short.toUpperCase() + phase)}</span><span class="enc-turn"> · ${Math.min(fight.turn + 1, fdef.cap)}/${fdef.cap}</span>`;
  $("night-lbl").hidden = !!fight;
  $("bell").classList.toggle("held", !!fight);
  // The sky (arcana.js): today's planet, tapped for the whole reading. Hidden in a fight, whose bar is its own.
  const sky = !!(s.arc && !fight);
  $("sky").hidden = !sky;
  if (sky) {
    const t = skyToday(s);
    $("sky").textContent = `· ${PLANETS[t.p].glyph}\uFE0E`;
    $("sky").setAttribute("aria-label", `The sky: ${PLANETS[t.p].day}, ${PLANETS[t.p].name} ${DIGNITY_WORD[t.d]} in ${SIGNS[s.arc.sign].name}. The reading.`);
  }
  const pullOn = !!(s.asc && s.asc.apoSeen && !fight);
  $("pull").hidden = !pullOn;
  if (pullOn) {
    $("pull").textContent = `· PULL ${s.apo}/6`;
    $("pull").classList.toggle("hot", s.apo >= 4);
    if (lastVals.apo !== undefined && lastVals.apo !== s.apo) floatDelta($("pull"), "apo", s.apo - lastVals.apo);
  } else if (fight && s.asc.apoSeen && lastVals.apo !== undefined && lastVals.apo !== s.apo) floatDelta($("t-sum"), "apo", s.apo - lastVals.apo);
  lastVals.apo = s.apo;
  document.body.dataset.mode = s.mode;
  document.body.dataset.act = s.asc ? s.asc.act : "";
  document.body.dataset.adversary = fight ? fight.id : "";
  document.body.classList.toggle("asc", s.mode === "ascension");
  document.body.classList.toggle("fight", !!fight);
  // A dusk or road card whose choices carry a second line (prep.js: the Hour's and the Spoils' prices, route intel):
  // the card gives up that line's height, as a fight's does, so the screen never scrolls.
  const cc = !s.over ? currentCard(s) : null;
  document.body.classList.toggle("tagged", !fight && !!cc && (["d_hour", "d_spoils"].includes(cc.id) || !!cc.intel));
  renderRelics(s);
  renderEnc(s);
  $("bell").querySelectorAll("i").forEach((i, n) => i.classList.toggle("on", n < s.bell));
  $("bell").setAttribute("aria-label", fight ? `The Bell, held for the fight: ${s.bell} of ${CARDS_PER_DAY} cards today` : `The Bell: ${s.bell} of ${CARDS_PER_DAY} cards today`);
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
  for (const k of Object.keys(MASKS)) document.body.classList.toggle("seized-" + k, !!s.maskLocked && s.mask === k);
  setSeal(s.mask);
  document.body.classList.toggle("communion", s.communion > 0);
  document.body.classList.toggle("reckoning", s.reckoning > 0 && s.communion === 0);
  document.body.classList.toggle("cascade", !!s.cascade);
  // The score follows the run, not the board: the Light's sour tail plays as the Reckoning is dealt, under the slip
  // of the card that ended the Light, as it always has.
  setMood(runMood(run));
}

function renderCard(deal = true) {
  const c = currentCard(run);
  const fight = encOf(run);
  $("say").textContent = c.text;
  $("who").textContent = c.who;
  $("art").innerHTML = face(c.art, c.enc);
  $("numeral").textContent = c.tutorial ? "0" : c.numeral || CARD_NO[c.id] || "";
  // A reversed Arcanum is drawn as it lies: upside down.
  $("art").classList.toggle("rev", !!c.flip);
  // In a fight the adversary takes the card's two ends: its intent at the top, its clock and roads at the bottom.
  $("numeral").hidden = $("tier").hidden = !!fight;
  const tone_ = c.art === "sun" ? "var(--sun)" : c.tier === 3 || c.enc ? "var(--porphyra)" : c.tier === 2 ? "var(--alert)" : "var(--magenta)";
  $("card").style.setProperty("--art", tone_);
  // The occult expansion's cards draw their own border (index.html): a rite, the two ways, an account, the Seat.
  if (c.frame) $("card").dataset.occ = c.frame;
  else delete $("card").dataset.occ;
  $("tier").textContent = c.tutorial ? "first light" : c.tierText || TIER[c.tier] || "";
  // In Exodus each choice carries a second line (choiceTag), filled by refreshChoices.
  $("go-left").innerHTML = "◀ " + esc(c.left.label) + (run.asc ? '<span class="tag"></span>' : "");
  $("go-right").innerHTML = esc(c.right.label) + " ▶" + (run.asc ? '<span class="tag"></span>' : "");
  // The Two Rites: each way in its own colour, neither of them gold.
  $("go-left").classList.toggle("way-serpent", c.frame === "ways");
  $("go-right").classList.toggle("way-return", c.frame === "ways");
  renderEnc(board());
  if (fight && fight.intent) {
    meta.asc.seen[fight.intent] = 1;
    saveMeta();
  }
  refreshChoices();
  const card = $("card");
  armedSide = null; // a choice armed on another card, or in another run, isn't this one's
  card.style.transform = "";
  card.style.opacity = "";
  if (deal) {
    card.classList.remove("enter", "nudge");
    void card.offsetWidth;
    card.classList.add(c.tutorial ? "nudge" : "enter");
  }
  showPreview(null, 0);
  if (c.art === "sun" && !c.enc) sfx.light();
  // The Light's bargain is said when it's first offered, so the first choice about it is an informed one.
  if (c.id === "whisper") coach("light", "The Light takes Strain and Hollow away now, and Gnosis can't rise while it lasts. The Reckoning comes after.", true);
  if ($("coach").hidden) coachResume(); // a line the Light cut short on an earlier card
  if (!c.tutorial) maskHint(c);
  if (previewOf("left").lethal || previewOf("right").lethal) coach("lethal", `${SKULL} marks a choice that can end your run. Drag the card or tap a choice to see the odds.`);
  if (cardCosts(run).length) coach("cost", "Some cards cost you either way. When they do, it's written under the card.");
  if (fight && fight.intent) coach("intent", "Top of the card: what the adversary does this card, and what it means to do next. A choice marked ✓ stops it.");
  if (fight && Object.keys(fight.roads).length) coach("roads", "Above the card: its clock, and your roads out. Fill a road and you can stop there; let the clock fill and it's over.");
  if (!c.tutorial && meta.plays >= 1) coach("inspect", "Tap any meter, track or the dots of the Bell to see what it means. Hold a Mask to read it.");
}

// The ☠ and crown flags on the two choices, from the preview. Called again after a Mask change, which can
// change both.
function refreshChoices() {
  const c = currentCard(run);
  for (const side of ["left", "right"]) {
    const p = previewOf(side);
    const b = $(side === "left" ? "go-left" : "go-right");
    b.classList.toggle("lethal", !!p.lethal);
    b.classList.toggle("crown", !!p.crown);
    b.classList.toggle("answers", !!(p.enc && p.enc.answers));
    b.classList.toggle("refuses", !!(p.enc && p.enc.refuses && !p.enc.answers));
    b.classList.toggle("sealed", !!(p.enc && p.enc.sealed));
    b.classList.toggle("kept", !!p.kept);
    const tag = b.querySelector(".tag");
    if (tag) {
      tag.innerHTML = choiceTag(p, c[side]) + (c.intel && c.intel[side] ? `<i class="intel">${esc(c.intel.brief[side])}</i>` : "");
      tag.hidden = !tag.innerHTML;
    }
    b.title = p.lethal ? "Can end your run" : p.crown ? "Can win the run" : "";
    b.setAttribute("aria-label", (c[side].verb ? VERBS[c[side].verb] + ": " : "") + c[side].label + spokenPreview(p) + (c.intel && c.intel[side] ? `. ${c.intel[side]}` : ""));
  }
}
// What the lit vials and the odds line show a sighted player, said in the choice's name: which meters and tracks
// move (never which way), the roll's odds, a Bond it may spend, and whether it can end or win the run.
const SPOKEN = { mark: "Mark", strain: "Strain", favor: "Favor", hollow: "Hollow", longing: "Longing", untag: "Untaggable", gnosis: "Gnosis", cage: "the Cage", apo: "the Pull" };
function spokenPreview(p) {
  const list = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
  const moved = [...p.meters, ...p.tracks].map((k) => SPOKEN[k]);
  const out = [];
  if (p.lethal) out.push(`Can end your run, ${pct(p.lethal.p)}`);
  if (p.crown) out.push(`Can win the run, ${pct(p.crown.p)}`); // both, when both: the odds line shows both
  if (p.kept) out.push(`Can end the run seated, ${pct(p.kept.p)}`);
  if (moved.length) out.push(`Moves ${list(moved)}`);
  if (p.roll) out.push(`${STAT_LABEL[p.roll.stat]} roll: ${pct(p.roll.hit)} clean, ${pct(p.roll.mid)} at a cost, ${pct(p.roll.miss)} worse`);
  for (const bd of p.bonds || []) out.push(bd.p >= 0.999 ? `Spends ${BONDS[bd.k].name}` : `${pct(bd.p)} to spend ${BONDS[bd.k].name}`);
  const e = encOf(run);
  if (p.enc && e) {
    const def = ENCOUNTERS[e.id];
    const it = e.intent && INTENTS[e.intent];
    if (it) out.unshift(p.enc.answers ? `Answers the ${it.name}` : `The ${it.name} lands`);
    if (p.enc.sealed) out.push("Sealed");
    if (p.enc.clock) out.push(def.clock.hidden && !run.cageSeen ? "Moves something that closes" : `Moves ${def.clock.label}`);
    if (p.enc.roads.length) out.push(`Moves ${list(p.enc.roads.map((k) => def.roads[k].label))}`);
    if (p.enc.resolves) out.push(`${pct(p.enc.resolves.p)} to end the fight`);
  }
  return out.map((x) => ". " + x).join("");
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
  catalogued: "the File fills", fluent: "the Grammar fills", gilded: "noon at the Festival",
};
function lethalText(l) {
  const reasons = [...new Set(l.endings.map((e) => (e === "cage" ? (run.cageSeen ? "the Cage closes" : "something closes") : END_REASON[e.startsWith("named") ? "named" : e])))];
  return reasons.join(" / ");
}

const winName = (c) => (c.endings && c.endings.length === 1 ? ENDINGS[c.endings[0]].title : "a win");
const pct = (x) => (x > 0 && x < 0.01 ? "<1" : Math.round(x * 100)) + "%";
function oddsLine(p) {
  const parts = [];
  const e = encOf(run);
  if (p.enc && e) {
    const it = e.intent && INTENTS[e.intent];
    if (it) parts.push(p.enc.answers ? `<b class="answers">✓ ${esc(it.name)}</b>` : `<b class="lands">${esc(it.name)} lands</b>`);
    if (p.enc.resolves) parts.push(`<b class="clears">${p.enc.resolves.p >= 0.999 ? "ends the fight" : pct(p.enc.resolves.p) + " ends it"}</b>`);
  }
  if (p.lethal) parts.push(`<b class="lethal">${SKULL} ${p.lethal.p >= 0.999 ? lethalText(p.lethal) : pct(p.lethal.p)}</b>`);
  if (p.crown) parts.push(`<b class="crown">${CROWN} ${p.crown.p >= 0.999 ? winName(p.crown) : pct(p.crown.p)}</b>`);
  if (p.kept) parts.push(`<b class="kept">☀ ${p.kept.p >= 0.999 ? esc(ENDINGS[p.kept.endings[0]].title) : pct(p.kept.p)}</b>`);
  for (const b of p.bonds || []) parts.push(`<b class="bondcost">${svg(BOND_ART[b.k], 6)} ${b.p >= 0.999 ? `spends ${BONDS[b.k].name}` : `${pct(b.p)} to spend ${BONDS[b.k].name}`}</b>`);
  if (p.roll) {
    const r = p.roll;
    const mod = r.stat === "fortune" ? "" : ` ${r.mod >= 0 ? "+" : "−"}${Math.abs(r.mod)}`;
    const dice = r.dice === 1 ? "1d6 · " : r.net > 0 ? "best 2 of 3 · " : r.net < 0 ? "worst 2 of 3 · " : "";
    parts.push(`${dice}<b>${STAT_LABEL[r.stat]}${mod}</b> · ${pct(r.hit)} clean · ${pct(r.mid)} cost · ${pct(r.miss)} worse`);
  }
  return parts.join(" · ");
}
// The line under the card is one line. Alone, a fact gets its full sentence; two or more share it in their short
// forms, the clocks first (the Light's, the Reckoning's, nightfall's). Two always fit; when three meet on a narrow
// phone, what runs off the end is a Mask's cost, which the lit vials and tracks still show.
const IDLE_ORDER = ["seal", "chair", "gate", "out", "reckon", "cascade", "light", "fading", "night", "rested", "wolf", "nyx", "eris"];
function idleLine() {
  const parts = cardCosts(run).map((c) => ({ ...c, cls: "costline" }));
  // State that runs on a clock the board doesn't otherwise show.
  const c = currentCard(run);
  if (run.communion > 1 && c.id !== "whisper" && c.id !== "reckoning")
    parts.push({ id: "light", cls: "statusline", text: `In the Light · ${run.communion} cards left, then the Reckoning`, short: `Light: ${run.communion} cards left` });
  if (run.bell === CARDS_PER_DAY - 1 && run.restedToday && !c.tutorial && !encOf(run))
    parts.push({ id: "rested", cls: "statusline", text: "Nightfall after this card. You rested today", short: "Nightfall: rested" });
  const many = parts.length > 1;
  if (many) parts.sort((a, b) => IDLE_ORDER.indexOf(a.id) - IDLE_ORDER.indexOf(b.id));
  return parts.map((p) => `<span class="${p.cls}">${esc(many ? p.short : p.text)}</span>`).join(" · ");
}

function showPreview(side, strength) {
  document.querySelectorAll(".meter .dot").forEach((d) => d.classList.remove("on"));
  document.querySelectorAll(".track.hot,.road.hot,#pull.lit").forEach((t) => t.classList.remove("hot", "lit"));
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
  for (const k of p.tracks) if (TRACK_EL[k] && !$(TRACK_EL[k]).hidden) $(TRACK_EL[k]).classList.add("hot");
  if (p.tracks.includes("apo")) $("pull").classList.add("lit");
  const fe = encOf(run);
  if (fe && p.tracks.some((k) => k === "untag" || k === "gnosis" || (k === "apo" && ENCOUNTERS[fe.id].clock.key !== "apo"))) $("t-sum").classList.add("hot");
  if (p.enc) {
    if (p.enc.clock) $("t-clock").classList.add("hot");
    for (const k of p.enc.roads) if ($("enc-road-" + k)) $("enc-road-" + k).classList.add("hot");
  }
  lab.innerHTML = esc(p.label) + (p.lethal ? `<span class="warn">${SKULL} ${p.lethal.p >= 0.999 ? "ends your run" : pct(p.lethal.p) + " to end your run"}</span>` : p.crown ? `<span class="win">${CROWN} ${p.crown.p >= 0.999 ? winName(p.crown) : pct(p.crown.p) + " to win"}</span>` : p.kept ? `<span class="win">☀ ${p.kept.p >= 0.999 ? esc(ENDINGS[p.kept.endings[0]].title) : pct(p.kept.p) + " to end seated"}</span>` : "");
  lab.className = "choice" + (side === "right" ? " r" : "");
  lab.style.opacity = Math.min(1, strength * 1.6);
  $("odds").innerHTML = oddsLine(p);
  coach("dots", "The lit vials are the ones this choice moves. It won't tell you which way.");
  if (p.roll) coach("roll", "This one's a dice roll, 2d6 plus a stat. The odds are under the card.");
}

// ---------- swiping ----------
// The release is judged from how the pointer was moving at the end (swipe.js), not averaged over the whole drag, and a
// drag that starts out vertical is not a swipe. Moves are only noted as they arrive; the card and its preview are
// drawn once a frame, since a fast pointer reports several times per frame and each report used to rewrite both.
function bindSwipe() {
  const card = $("card");
  let drag = null;
  let frame = 0;
  const paint = () => {
    frame = 0;
    if (!drag || drag.axis !== "x") return;
    const dx = drag.dx;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 16}deg)`;
    showPreview(dx < -18 ? "left" : dx > 18 ? "right" : null, Math.abs(dx) / 110);
  };
  card.addEventListener("pointerdown", (e) => {
    if (busy) return;
    // A new press always starts a new drag: one whose release was never seen must not leave the card unswipeable.
    cancelAnimationFrame(frame);
    frame = 0;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, axis: null, samples: [] };
    pushSample(drag.samples, e.clientX, e.timeStamp);
    try {
      card.setPointerCapture(e.pointerId);
    } catch {} // a synthetic or already-released pointer has nothing to capture
    card.classList.add("dragging");
  });
  card.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    // The samples include the moves the browser folded into this event, so a fast flick keeps its detail.
    const seen = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const p of seen.length ? seen : [e]) pushSample(drag.samples, p.clientX, p.timeStamp);
    drag.dx = e.clientX - drag.x;
    drag.axis = drag.axis || lockAxis(drag.dx, e.clientY - drag.y);
    if (drag.axis === "x" && !frame) frame = requestAnimationFrame(paint);
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    cancelAnimationFrame(frame);
    frame = 0;
    card.classList.remove("dragging");
    // A drag the system took back (pointercancel) or one that went vertical chooses nothing.
    const side = e.type === "pointerup" && d.axis === "x" ? decide(e.clientX - d.x, releaseVelocity(d.samples, e.clientX, e.timeStamp)) : null;
    if (side) commit(side);
    else {
      card.style.transform = "";
      showPreview(null, 0);
    }
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
  card.addEventListener("lostpointercapture", end); // after pointerup the drag is already over and this does nothing
  const tapChoice = (side) => {
    if (busy) return;
    // First tap previews (like a half-swipe); second tap commits.
    if (armedSide !== side) {
      armedSide = side;
      card.style.transform = `translateX(${side === "left" ? -46 : 46}px) rotate(${side === "left" ? -3 : 3}deg)`;
      showPreview(side, 1);
      return;
    }
    armedSide = null;
    commit(side);
  };
  $("go-left").onclick = () => tapChoice("left");
  $("go-right").onclick = () => tapChoice("right");
  document.addEventListener("keydown", (e) => {
    if ($("app").hidden || busy || $("layer").childElementCount) return;
    if (e.key === "ArrowLeft") tapChoice("left");
    if (e.key === "ArrowRight") tapChoice("right");
  });
  card.addEventListener("pointerdown", () => (armedSide = null));
}
// The choice a first tap (or ←/→) has armed. Anything that changes what it would do disarms it, so the second
// tap never commits on a preview that's out of date.
let armedSide = null;
function disarm() {
  armedSide = null;
  $("card").style.transform = "";
  showPreview(null, 0);
}

async function commit(side) {
  if (busy || !run || run.over) return;
  busy = true;
  disarmMask(); // its cost and ☠ were read before this card; the next tap reads them again
  const card = $("card");
  const dir = side === "left" ? -1 : 1;
  card.style.transform = `translateX(${dir * 140}%) rotate(${dir * 24}deg)`;
  card.style.opacity = "0";
  card.classList.remove("nudge");
  hideCoach();
  showPreview(null, 0);
  sfx.swipe();
  buzz(10);
  const was = encOf(run) && encOf(run).id;
  const res = choose(run, side);
  const now = encOf(run) && encOf(run).id;
  const opened = bookUnlocks(run);
  if (opened.length && !res.ending) saveMeta();
  // A fight that ended is booked in the Adversaries sheet now, before its slip, like the run's own result.
  if (res.enc && res.enc.resolved) bookMet(res.enc.id, res.enc.resolved);
  // A run that ends is recorded now, before its slip: closing the page on the slip can't take the result back
  // (or hand back a spent Vigil).
  if (res.ending) record();
  else if (res.enc && res.enc.resolved) saveMeta(), saveRun();
  else saveRun();
  // The tutorial counts as done only once its last card has resolved, not when the run starts.
  if (!meta.tutorialDone && run.tutorial && !tutorialPending(run)) {
    meta.tutorialDone = true;
    saveMeta();
  }
  await wait(220);
  // Under the slip, the board as the card left it: the night and the next Activation show on their own screens.
  renderHud(res.ending ? null : res.board);
  if (res.roll) sfx.dice();
  if (res.notes.some((n) => n.startsWith("Communion"))) sfx.light();
  await slip(res);
  if (res.enc && res.enc.resolved) await encounterEnd(res);
  if (res.ending) return finish(opened);
  if (opened.length) toast(`Unsealed for your next Exodus: ${opened.map(unlockName).join(", ")}.`);
  if (res.nightfall) await nightfall(res);
  if (run.lastEvent) await activation(run.lastEvent);
  if (now && now !== was) await encounterIntro(run);
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
const DLBL = { mark: "Mark", strain: "Strain", favor: "Favor", hollow: "Hollow", longing: "Longing", untag: "Untaggable", gnosis: "Gnosis", cage: "Cage", apo: "Pull" };

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
    let notes = night && night.notes ? res.notes.slice(0, res.notes.length - night.notes.length) : res.notes;
    let chips = chipsHtml(own);
    if (res.enc) {
      // The adversary's clock and your roads, in the same chips; a fight's outcome gets its own screen after.
      const def = ENCOUNTERS[res.enc.id];
      const chip = (label, v, good) => `<span class="chip ${good ? "good" : "bad"}">${esc(label)} ${v > 0 ? "+" : "−"}${Math.abs(v)}</span>`;
      if (res.enc.clock && !def.clock.key) chips += chip(def.clock.label, res.enc.clock, res.enc.clock < 0);
      for (const [k, v] of Object.entries(res.enc.roads)) chips += chip(def.roads[k].label, v, v > 0);
      const out = res.enc.resolved && def.outcomes[res.enc.resolved];
      if (out && out.text) notes = notes.filter((n) => !n.startsWith(out.title + "."));
    }
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
    // The key that closes the slip is spent here: without preventDefault its keypress would press whatever the
    // next dialog focuses (Run again on an end screen, Let it answer on a stir).
    const key = (e) => (e.key === "Enter" || e.key === " " || e.key.startsWith("Arrow")) && (e.preventDefault(), done());
    setTimeout(() => {
      el.addEventListener("click", done);
      document.addEventListener("keydown", key);
    }, 250);
  });
}

// While a dialog is open, the screen behind it takes no focus and leaves the accessibility tree: Tab stays inside
// the dialog, and Enter can't start a run hidden under it.
function backdrop() {
  const open = !!$("layer").childElementCount;
  for (const id of ["app", "home"]) $(id).toggleAttribute("inert", open);
}
function overlay(html, { dismiss = true, cls = "" } = {}) {
  return new Promise((resolve) => {
    const back = document.activeElement;
    const el = document.createElement("div");
    // Arming: for its first 300 ms a dialog's buttons don't take a tap or a click, so the second half of a double tap
    // meant for what was underneath can't answer it unseen (a held key's repeats are refused in key() below).
    el.className = "overlay arming" + (cls ? " " + cls : "");
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.tabIndex = -1;
    el.innerHTML = `<div class="inner">${html}</div>`;
    // Named by its heading (the ending, "Night 2 ends"), or its eyebrow when it has none.
    const title = el.querySelector(".big") || el.querySelector(".eyebrow");
    if (title) el.setAttribute("aria-label", title.textContent);
    $("layer").appendChild(el);
    backdrop();
    (el.querySelector("button:not([disabled])") || el).focus({ preventScroll: true });
    let armed = false;
    // Tab and Shift+Tab wrap inside the dialog: the page behind is inert, so without this focus would fall out of the
    // last button into the browser's own controls and the dialog would stop being keyboard-reachable.
    const trap = (e) => {
      const list = [...el.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter((n) => !n.disabled && n.tabIndex >= 0 && n.getClientRects().length);
      const at = document.activeElement;
      const edge = list.length ? list[e.shiftKey ? 0 : list.length - 1] : null;
      if (!list.length || at === el || !el.contains(at)) {
        // Focus on the dialog itself, or outside it: the first (Tab) or last (Shift+Tab) control, or the dialog if it has none.
        e.preventDefault();
        (list.length ? list[e.shiftKey ? list.length - 1 : 0] : el).focus({ preventScroll: true });
      } else if (at === edge) {
        e.preventDefault();
        list[e.shiftKey ? list.length - 1 : 0].focus({ preventScroll: true });
      }
    };
    const key = (e) => {
      if (el.parentNode !== $("layer") || $("layer").lastElementChild !== el) return;
      if (e.key === "Tab") return trap(e);
      // A held key's repeats never press a button here: only a fresh press does.
      if (e.repeat && (e.key === "Enter" || e.key === " ")) return e.preventDefault();
      if (!armed) return;
      if (dismiss && (e.key === "Enter" || e.key === " " || e.key === "Escape")) e.preventDefault(), close();
      else if (e.key === "Escape" && el.querySelector('[data-v="ok"]')) e.preventDefault(), close("ok"); // a dialog with a Close
    };
    const close = (v) => {
      el.remove();
      document.removeEventListener("keydown", key);
      backdrop();
      if (back && back.isConnected && !$("layer").childElementCount) back.focus({ preventScroll: true });
      resolve(v);
    };
    el._close = close;
    document.addEventListener("keydown", key);
    setTimeout(() => {
      armed = true;
      el.classList.remove("arming");
    }, 300);
    if (dismiss) setTimeout(() => el.addEventListener("click", () => close()), 300);
    el.querySelectorAll("[data-v]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        if (armed) close(b.dataset.v);
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
      `${head}<p class="fine">${esc(m.name)}: ${esc(m.bonus)} · ${esc(m.gift)} · ${esc(m.risk)}</p>
      <div class="row"><button class="btn primary" data-v="let" type="button">Let ${esc(m.name)} answer · wear it</button>
      <button class="btn" data-v="hold" type="button"${run.favor < 1 ? " disabled" : ""}>Hold the wheel · −1 Favor</button></div>`,
      { dismiss: false },
    );
    resolveStir(run, v === "hold");
    saveRun();
    renderHud();
    return;
  }
  if (ev.kind === "seizure") takeover(ev.mask);
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
function disarmMask() {
  armedMask = null;
  document.querySelectorAll(".mask.arm").forEach((b) => b.classList.remove("arm"));
}
function onMask(k) {
  if (busy || !run || run.over || run.mask === k || run.stir) return;
  const cost = maskStrain(run, k);
  if (cost && armedMask !== k) {
    document.querySelectorAll(".mask").forEach((b) => b.classList.remove("arm"));
    armedMask = k;
    const b = $("k-" + k);
    b.classList.add("arm");
    // A change that would Fracture you is flagged like any other choice that ends the run.
    const ends = switchMask(JSON.parse(JSON.stringify(run)), k).ending;
    // (With the skull, "+N" alone: "+N strain" was the label a tap ago, and the longer line wraps the chip.)
    b.querySelector(".cost").innerHTML = ends ? `${SKULL} tap: +${cost}` : `tap: +${cost} strain`;
    b.setAttribute("aria-label", `${MASKS[k].name}: press again to wear it for ${cost} Strain${ends ? ". It ends your run" : ""}.`);
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
  if (r.ending) return finish();
  // The new Mask changes the odds, the costs and what can kill you: the card says so before the next tap.
  refreshChoices();
  disarm();
  // One toast: what the change cost beyond its Strain (a Fracture absorbed, a Bond spent), then what it gives.
  toast([...(r.notes || []), `${MASKS[k].name}: ${MASKS[k].bonus}. ${MASKS[k].gift}.`].join(" "));
}

// ---------- Exodus: the fight in the tracks panel, the intent on the card, the relic strip ----------
const encOf = (s) => (s && s.asc && s.asc.enc) || null;
const ROMAN_ACT = { 1: "I", 2: "II", 3: "III" };
// The Edicts in force on a run, said once where they bite most: at each adversary's door.
const edictsLine = (s) => (s.asc && s.asc.edict ? `<p class="fine"><b>Edict ${roman(s.asc.edict)}.</b> ${EDICTS.slice(1, s.asc.edict + 1).map((e) => esc(e.text)).join(" ")}</p>` : "");
// A new Exodus, once a Way Out has unsealed an Edict: how hard the Dominion answers this time. The highest is offered first.
async function pickEdict() {
  const max = meta.asc.edict;
  if (!max) return 0;
  const rows = EDICTS.slice(1, max + 1).map((e, i) => `<p><b>${roman(i + 1)} · ${esc(e.name)}.</b> ${esc(e.text)}</p>`).join("");
  const btns = Array.from({ length: max + 1 }, (_, i) => max - i)
    .map((n) => `<button class="btn small${n === max ? " primary" : " ghost"}" data-v="e:${n}" type="button">${n ? `Edict ${roman(n)}` : "No Edict"}</button>`)
    .join("");
  const v = String(await overlay(`<div class="eyebrow">The Dominion answers</div><p class="line">Somebody got out. They wrote new rules for the next one.</p><div class="rules">${rows}</div><p class="fine">Each Edict brings every one above it in this list. A Way Out walked under your highest unseals the next.</p><div class="row">${btns}</div>`, { dismiss: false }));
  return /^e:\d+$/.test(v) ? +v.slice(2) : max;
}
// An intent's line, with the Shepherd's unseen Cage said as "it closes" until it's seen.
// Keeping the Fast (occult.js), the Festival's relief that isn't answered brings only its clock: it says so.
const saysOf = (s, it) => (it.relief && riteOn(s, "fast") ? it.relief : s.cageSeen ? it.says.replace(/it closes/g, "the Cage") : it.says);
// During a fight the adversary takes the tracks panel: its clock, your three roads, Longing and Bonds as ever, and
// a line for Untaggable, Gnosis, the Named and the Pull. The same four rows, so the screen never grows. The intent
// sits at the head of the card, with the next one dim beneath it.
function renderEnc(s) {
  const e = encOf(s);
  const fight = !!e;
  for (const id of ["t-untag", "t-gnosis"]) $(id).hidden = fight;
  if (fight) $("t-cage").hidden = true;
  for (const id of ["t-clock", "t-roads", "t-sum"]) $(id).hidden = !fight;
  const live = encOf(run);
  const c = run && !run.over ? currentCard(run) : null;
  const it = live && c && c.enc === live.id && live.intent && INTENTS[live.intent];
  $("intent").hidden = !it;
  if (it) {
    const nx = live.next && INTENTS[live.next];
    // A Read readied at a chapel (prep.js): the intent after next, labelled likely (a fight card can re-pick it).
    const n2 = live.read && live.next2 && INTENTS[live.next2];
    $("intent").innerHTML = `<b>▲ ${esc(it.name)}</b><span>Unless stopped: ${esc(saysOf(run, it))}</span>${nx ? `<i>Next intended: ${esc(nx.name)}</i>` : ""}${n2 ? `<i>Then, likely: ${esc(n2.name)}</i>` : ""}`;
  }
  if (!fight) return;
  const def = ENCOUNTERS[e.id];
  const v = def.clock.key ? s[def.clock.key] : e.clock;
  const unseen = !!(def.clock.hidden && !s.cageSeen);
  const clock = $("t-clock");
  clock.classList.toggle("unseen", unseen);
  clock.querySelector(".tl").textContent = unseen ? "SOMETHING CLOSES" : def.clock.label.toUpperCase();
  const sg = clock.querySelector(".segs");
  sg.style.setProperty("--n", def.clock.max);
  sg.innerHTML = Array.from({ length: def.clock.max }, (_, i) => `<i${!unseen && i < v ? ' class="on"' : ""}></i>`).join("");
  clock.querySelector(".n").textContent = unseen ? "?" : `${v}/${def.clock.max}`;
  clock.querySelector(".tl").setAttribute("aria-label", unseen ? "Something closes: you can't see how far" : `${def.clock.label} ${v} of ${def.clock.max}`);
  const lead = encBestRoad(s);
  const roads = Object.entries(def.roads);
  $("t-roads").querySelector(".roads").innerHTML = roads.length
    ? roads.map(([k, r]) => `<span class="road${k === lead ? " lead" : ""}" id="enc-road-${k}" role="img" aria-label="${esc(r.label)}: ${e.roads[k]} of ${e.need[k]}"><b>${esc(r.tag.toUpperCase())}</b><span class="pips">${Array.from({ length: e.need[k] }, (_, i) => `<i${i < e.roads[k] ? ' class="on"' : ""}></i>`).join("")}</span></span>`).join("")
    : `<span class="road"><b>RUNG ${Math.min(4, e.turn + 1)}/4</b></span>`;
  const pull = s.asc.apoSeen ? ` · PULL ${s.apo}/6` : "";
  $("t-sum").querySelector(".sum").textContent = `UNTAGGABLE ${s.untag} · GNOSIS ${s.gnosis} · NAMED FREED ${s.asc.freed}${pull}`;
}

// The second line on a choice in a fight: whether it stops the intent, which of your roads it moves, a seal's price.
// Never which way. A choice that can end the run, win it or seat you says that instead.
function choiceTag(p, ch = null) {
  if (p.lethal && p.lethal.p >= 0.999) return `${SKULL} ends your run`;
  // A choice that can win says so, with its odds: the bare escape at the gate and the chair is a roll, not a retreat.
  if (p.crown) return `${CROWN} ${p.crown.p >= 0.999 ? "" : pct(p.crown.p) + " · "}${esc(winName(p.crown))}`;
  if (p.kept) return `☀ ${p.kept.p >= 0.999 ? "kept" : pct(p.kept.p)} · ${esc(ENDINGS[p.kept.endings[0]].title)}`;
  const e = encOf(run);
  // Outside a fight, a choice can carry its own second line (the occult expansion's rules: occult.js tag).
  if (!p.enc || !e) return ch && ch.tag ? esc(ch.tag) : "";
  const def = ENCOUNTERS[e.id];
  const it = e.intent && INTENTS[e.intent];
  const bits = ch && ch.tag ? [ch.tag] : [];
  if (p.enc.sealed) bits.push("🔒 +2 strain");
  if (p.enc.verb === "flee") bits.push("disengage");
  else if (it) bits.push(p.enc.answers ? "✓ stops it" : p.enc.refuses ? "✗ refuses it" : "intent lands");
  for (const k of p.enc.roads) bits.push(def.roads[k].tag);
  if (p.enc.resolves) bits.push(p.enc.resolves.p >= 0.999 ? "ends the fight" : `${pct(p.enc.resolves.p)} ends it`);
  return bits.map(esc).join(" · ");
}

// Relics: two slots. Tap one for its sheet: what it does on this card (both sides' odds with it worked), Work it,
// Transmute, Not now. Hold it to read where it came from.
function renderRelics(s) {
  const on = s.mode === "ascension";
  $("relics").hidden = !on;
  if (!on) return;
  const a = s.asc;
  // The Refusal rite (occult.js): the Refuse control sits in the tray, a third slot, laid on a card as a working is.
  const refusing = riteOn(s, "refusal") && !s.over;
  $("relics").classList.toggle("three", refusing);
  $("relics").innerHTML = [0, 1]
    .map((i) => {
      const k = a.relics[i];
      if (!k) return `<button class="relic empty" type="button" disabled aria-label="An empty relic slot"><span><span class="rn">Empty slot</span><span class="rc">a chapel, a floorboard</span></span></button>`;
      const r = RELICS[k];
      const n = a.charges[k] || 0;
      const armed = a.armed === k || (a.armed === "clearglass" && k === "glass");
      const stone = isStone(s, k);
      const held = inVessel(s, k);
      const name = stone ? STONES[k].name : r.name;
      const works = stone ? STONES[k].works : r.works;
      const price = stone ? "no price" : priceWords(s, k);
      const rc = held ? "in the vessel" : armed ? "laid on this card" : `${"•".repeat(n) || "used"} · ${price}`;
      return `<button class="relic${n && !held ? "" : " spent"}${armed ? " armed" : ""}${stone ? " stone" : ""}${held ? " vessel" : ""}" id="r-${k}" type="button" aria-label="${esc(name)}: ${esc(works)}, for ${esc(price)}. ${held ? "In the vessel." : `${n} use${n === 1 ? "" : "s"} left${armed ? ", laid on this card" : ""}.`}">${svg(stone ? "stone" : held ? "alembic" : r.art, 5)}<span><span class="rn">${esc(name.replace(/^The /, ""))}</span><span class="rc">${esc(rc)}</span></span></button>`;
    })
    .join("") + (refusing ? refuseButton(s) : "");
  if (refusing) $("r-refuse").onclick = () => {
    if (busy || !run || run.over || run.stir) return;
    const on = !!(run.asc.occ && run.asc.occ.refuse);
    const r = refuse(run, !on);
    if (!r.ok) return toast(r.why || "Not on this card.");
    buzz(8);
    saveRun();
    renderHud(); // the previews are played out again with the refusal laid on (or lifted)
    refreshChoices();
    disarm();
    toast(r.on ? (r.kind === "gate" ? `Refusal laid on this card: whichever way you go, you storm ${sphereName(occDay(run))}'s gate. Strain +1, Mark +1.` : "Refusal laid on this card: the side that doesn't answer refuses the intent. Mark +1.") : "Refusal lifted.");
  };
  for (const k of a.relics) {
    const b = $("r-" + k);
    let press = 0;
    let held = false;
    const cancel = () => clearTimeout(press);
    b.addEventListener("pointerdown", () => {
      cancel();
      held = false;
      press = setTimeout(() => ((held = true), buzz(8), toast(RELICS[k].found)), 550);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, cancel));
    b.addEventListener("contextmenu", (e) => (e.preventDefault(), (held = true), toast(RELICS[k].found)));
    b.onclick = () => (held ? (held = false) : relicSheet(k));
  }
}
// A working's price as this card has it (engine.js relicPrice): in its sphere's hour, waived at home, doubled in exile.
function priceWords(s, k) {
  const m = hourOf(s, k);
  if (m === 1) return RELICS[k].price;
  if (m === 0) return "no price: its hour";
  const p = relicPrice(s, k);
  return Object.entries(p).map(([t, v]) => (t === "gilt" ? `gilt +${v}` : `${TRACK_WORD[t] || t} ${v < 0 ? "−" : "+"}${Math.abs(v)}`)).join(", ") + ": in exile";
}
// The Refuse control (occult.js RITES refusal): laid on, offered, or why not, in the tray's third slot.
function refuseButton(s) {
  const o = s.asc.occ;
  const can = canRefuse(s);
  const on = !!o.refuse;
  const rc = on ? "laid on this card" : can.ok ? (can.kind === "gate" ? "storm the gate" : "refuse the intent") : "not on this card";
  return `<button class="relic refuse${on ? " armed" : ""}${can.ok || on ? "" : " spent"}" id="r-refuse" type="button" aria-pressed="${on}" aria-label="Refuse: ${on ? "laid on this card. Tap to lift it." : can.ok ? (can.kind === "gate" ? "storm today's gate, Strain +1 and Mark +1." : "the side that doesn't answer refuses the intent, Mark +1." + (synergiesFor(s, "refuse").length ? " A Bond you hold will witness it: the people road +1." : "")) : esc(can.why || "nothing to refuse on this card.")}">${svg("serpent", 5)}<span><span class="rn">Refuse</span><span class="rc">${esc(rc)}</span></span></button>`;
}
// One side's odds and flags as they'd be with the working laid on (played out on a copy).
function sideWith(s, side) {
  const p = preview(s, side);
  const bits = [];
  if (p.lethal) bits.push(`${SKULL} ${pct(p.lethal.p)}`);
  if (p.crown) bits.push(`${CROWN} ${pct(p.crown.p)}`);
  if (p.enc && p.enc.answers) bits.push("✓ stops it");
  if (p.roll) bits.push(`${pct(p.roll.hit)} clean · ${pct(p.roll.miss)} worse`);
  return bits.join(" · ") || "no change you can see";
}
// The sky and the reading, as they stand: today's planet and what it does, the sign, and each card's place.
// Every line is a rule the engine applies (arcana.js), and the sheet says plainly that the sky is a convention.
function skySheet(s) {
  if (busy || !s.arc) return;
  const t = skyToday(s);
  const p = PLANETS[t.p];
  const sign = SIGNS[s.arc.sign];
  const does = [t.boon && `boon: ${p.boon}`, t.cost && `toll: ${p.cost}`].filter(Boolean).join("; ");
  const places = s.asc ? PLACES : [{ name: "Tonight's Card" }];
  const rows = s.arc.spread
    .map((c, i) => {
      const where = places[i] ? places[i].name + (places[i].over ? ` · over ${places[i].over}` : "") : "";
      const what = c.st === "down" ? "face down" : c.st === "struck" ? `${ARCANA[c.id].name}, struck: it has no say` : `<b>${esc(cardTitle(c))}</b> (ruled by ${esc(rulerName(c.id))}). ${esc(cardLine(c))}`;
      return `<p class="fine">${esc(where)}: ${what}</p>`;
    })
    .join("");
  overlay(
    `<div class="eyebrow">The sky · ${esc(sign.name)} ${sign.glyph}\uFE0E · ${sign.el}</div>
    <p class="line">${esc(p.day)}: ${esc(p.name.charAt(0).toUpperCase() + p.name.slice(1))} ${p.glyph}\uFE0E, ${DIGNITY_WORD[t.d]} in ${esc(sign.name)}. ${esc(does.charAt(0).toUpperCase() + does.slice(1))}.</p>
    <p class="fine">${esc(p.line)}</p>${rows}${spheresHtml(s)}
    <p class="fine">Seven planets rule the seven days in the old order. A planet at home or exalted in the sign gives its boon only; in exile, its toll only; elsewhere, both. A card the sky favors through its ruler comes up upright; one it afflicts, reversed. This sky is the game's convention, not where the planets are tonight. ${ARCANA_PLANNED.length ? `${78 - ARCANA_PLANNED.length} of the 78 cards are in this deck so far.` : "All 78 cards are in this deck."}</p>
    <button class="btn ghost" data-v="ok" type="button">Close</button>`,
    { dismiss: false },
  );
}
// The Seven Spheres (occult.js), text first: each sphere, what it holds, and its gate as it stands. Today's sphere is
// marked. A track the run hasn't shown (the Cage, the Pull) isn't named.
function spheresHtml(s) {
  const o = occOf(s);
  if (!o) return "";
  const today = occDay(s);
  const rows = LADDER.map((p) => {
    const x = SPHERES[p];
    const g = o.spheres[p];
    const holds = shownTrack(s, p) ? `${TRACK_WORD[x.holds]} at ${x.line} or less, fallen that day` : "something here holds you";
    const state = g ? `passed: ${MEANS[g]}` : `holds (${holds})`;
    return `<p class="fine sphere${p === today ? " today" : ""}${g ? " passed" : ""}">${x.glyph}\uFE0E <b>${esc(sphereName(p, true))}</b>${p === today ? " · tonight" : ""}: ${esc(x.garment)}. ${esc(state)}.</p>`;
  }).join("");
  const path = pathOf(s);
  const rites = o.rites.length ? o.rites.map((k) => RITES[k].name).join(", ") : "none held";
  const acc = o.account ? ACCOUNTS[o.account].name : "not yet heard";
  const states = Object.fromEntries(LADDER.filter((p) => o.spheres[p]).map((p) => [p, o.spheres[p]]));
  const glyphs = Object.fromEntries(LADDER.map((p) => [p, SPHERES[p].glyph]));
  return `<div class="eyebrow">The Seven Spheres · ${esc(PATHS[path])}</div>${ladderArt(LADDER, states, today, glyphs)}
    <p class="fine">Rites: ${esc(rites)}. The Architect: ${esc(acc)}.${o.will ? ` Your will: ${esc(ORBIT[o.will])}.` : o.claimed ? " Another's will, named as yours." : ""}${o.debts.length ? ` Owed to the Seven: ${esc(o.debts.map((d) => sphereName(d.p)).join(", "))}, at the next fight.` : ""} At nightfall the day's sphere lets you past if you've given its garment back (its track fell that day, to its line), or by another way you've found. A passed gate's toll is quiet for the run.</p>${rows}`;
}
async function relicSheet(k) {
  if (busy || !run || run.over || run.stir) return;
  const stone = isStone(run, k);
  const r = stone ? { ...RELICS[k], name: STONES[k].name, works: STONES[k].works, price: "no price, once", transmute: STONES[k].transmute } : { ...RELICS[k], price: priceWords(run, k) };
  const n = run.asc.charges[k] || 0;
  const can = canWork(run, k);
  // The occult expansion's two other actions: Correspond on a reading its sphere rules; the vessel at the first chapel.
  const cor = canCorrespond(run, k);
  const ves = canVessel(run, k);
  let lines = "";
  if (can.ok) {
    const t = JSON.parse(JSON.stringify(run));
    work(t, k);
    if (!t.over) lines = `<p class="fine">With it, this card: ◀ ${sideWith(t, "left")}<br>▶ ${sideWith(t, "right")}</p>`;
    // The Depth Pass (synergy.js): what holding this with the rest would also do, said before it is paid.
    for (const x of synergiesFor(run, "work", { k })) lines += `<p class="fine"><b>${esc(x.name)}.</b> ${esc(x.line)}</p>`;
  }
  const tc = transmute(JSON.parse(JSON.stringify(run)), k);
  const v = await overlay(
    `<div class="eyebrow">${esc(r.name)} · ${n} use${n === 1 ? "" : "s"} left</div>
    <p class="line">${esc(r.works.charAt(0).toUpperCase() + r.works.slice(1))}, for ${esc(r.price)}.</p>${lines}
    ${can.ok ? "" : `<p class="fine">${esc(can.why)}</p>`}
    <p class="fine">Transmute it toward freedom: ${esc(r.transmute)}, and Gnosis +1. It's gone for good.${tc.ending ? ` ${SKULL} That would end your run.` : ""}</p>
    ${cor.ok ? `<p class="fine"><b>As above, so below.</b> This card's ruler is ${esc(SPHERES[Object.keys(SPHERES).find((p) => SPHERES[p].relic === k)].name)}, its metal: Correspond, for one use, and it comes up upright, with no Pull.</p>` : ""}
    ${ves.ok ? `<p class="fine"><b>The Great Work.</b> Put it in the vessel: through the second movement it can't be worked or taken from you; at the next chapel it comes out as ${esc(STONES[k].name)} (${esc(STONES[k].works)}, once). One relic a run.</p>` : ""}
    <div class="row"><button class="btn primary" data-v="work" type="button"${can.ok ? "" : " disabled"}>Work it</button><button class="btn" data-v="transmute" type="button"${canTransmute(run, k).ok ? "" : " disabled"}>Transmute</button>${cor.ok ? '<button class="btn" data-v="correspond" type="button">Correspond</button>' : ""}${ves.ok ? '<button class="btn" data-v="vessel" type="button">Into the vessel</button>' : ""}<button class="btn ghost" data-v="ok" type="button">Not now</button></div>`,
    { dismiss: false },
  );
  if (!["work", "transmute", "correspond", "vessel"].includes(v)) return;
  const card = run.cardId;
  const res = v === "work" ? work(run, k) : v === "transmute" ? transmute(run, k) : v === "correspond" ? correspond(run, k) : vessel(run, k);
  if (!res.ok) return;
  disarmMask(); // its cost and ☠ were read before the working
  buzz(8);
  saveRun();
  renderHud();
  if (res.ending) return finish();
  if (run.cardId !== card || v === "correspond") renderCard(v !== "correspond");
  else refreshChoices(), disarm();
  toast(res.notes.join(" "));
}

// A fight begins: who, what it wants, how it ends either way, and what it came prepared for.
async function encounterIntro(s) {
  const e = encOf(s);
  const def = ENCOUNTERS[e.id];
  const roads = Object.values(def.roads).map((r) => r.label);
  const k = e.counter && def.counter[e.counter];
  const first = !meta.hints.encounter;
  if (first) {
    meta.hints.encounter = 1;
    saveMeta();
  }
  const v = def.clock.key ? s[def.clock.key] : e.clock;
  const unseen = def.clock.hidden && !s.cageSeen;
  const clock = def.clock.key === "apo" ? `The Pull ${v}/6: at 6 you're A Small Rex Mundi.` : unseen ? "Its clock is hidden: something closes, and you can't see how far." : `${def.clock.label} ${v}/${def.clock.max}${def.clock.end || def.clock.ends ? ": if it fills, it's over" : def.clock.full ? ": if it fills, the Audit" : ""}.`;
  await overlay(`<div class="eyebrow">${esc(ACTS[s.asc.act].name)} · ${esc(ACTS[s.asc.act].arc)}</div><h2 class="big">${esc(def.name)}</h2>
    <p class="line">${esc(def.intro)}</p>
    <p class="fine">${esc(clock)}${roads.length ? ` Your roads out: ${esc(roads.join(", "))}. Fill one and you can stop there.` : ""}</p>
    ${k ? `<p class="fine"><b>${e.counter === "mixed" ? "It couldn't read you." : "It came prepared."}</b> ${esc(k.text)}</p>` : ""}
    ${edictsLine(s)}
    ${first ? `<p class="fine">The head of each card says what it does to you this card, and what it means to do next. A choice marked ✓ stops it; the other lets it land, and builds harder if it rolls well. Fights hold the Bell: no night falls until it's over. Two from a full clock, the side that doesn't stop it becomes a way out, and you're gone before the blow lands. The last card is yours: stand on the road you built, or disengage.</p>` : ""}
    <p class="tap">Tap to begin</p>`);
}
// Still sealed for this player: roads and relics a new Exodus won't offer yet.
const sealed = () => Object.keys(UNLOCKS).filter((k) => !meta.asc.unlocked.includes(k));
const unlockName = (k) => (UNLOCKS[k].kind === "road" ? ROADS[k] : RELICS[k]).name;
// What this run has just opened for the runs after it. Booked as it happens; it never changes the run under way.
function bookUnlocks(s) {
  if (!s.asc) return [];
  const opened = sealed().filter((k) => UNLOCKS[k].opens(s));
  meta.asc.unlocked.push(...opened);
  return opened;
}
// A meeting, by how it ended: the fight's own outcome, or the run's ending when the run ended inside it.
function bookMet(id, k) {
  const m = (meta.asc.met[id] = meta.asc.met[id] || {});
  m[k] = (m[k] || 0) + 1;
}
async function encounterEnd(res) {
  const id = res.enc.id;
  const def = ENCOUNTERS[id];
  const out = def.outcomes[res.enc.resolved];
  if (!out || !out.text) return;
  if (def.roads[res.enc.resolved] || res.enc.resolved === "unfiled") sfx.light();
  await overlay(`<div class="eyebrow">${esc(def.name)}</div><h2 class="big">${esc(out.title)}</h2><p class="line">${esc(out.text)}</p><p class="tap">Tap to go on</p>`);
}

function relicGuide() {
  const held = run && run.asc ? run.asc.relics : [];
  const shut = run && run.asc ? run.asc.locked : sealed();
  const rows = Object.entries(RELICS)
    .map(([k, r]) => shut.includes(k) && !held.includes(k) ? `<div class="mrow locked">${svg(r.art, 5)}<p><b>A relic, sealed</b> · ${esc(UNLOCKS[k].hint)}</p></div>` : `<div class="mrow${held.includes(k) ? " on" : ""}">${svg(r.art, 5)}<p><b>${esc(r.name)}</b> · ${esc(r.works)}. <span class="risk">Price: ${esc(r.price)}.</span> ${r.uses} use${r.uses === 1 ? "" : "s"}, readied at a chapel. Transmuted: ${esc(r.transmute)}, Gnosis +1.<br>${esc(r.found)}</p></div>`)
    .join("");
  return overlay(`<div class="eyebrow">Relics · Exodus</div><div class="rules"><p>Confiscated things, taken back. ${run && run.asc && run.asc.edict >= 3 ? "Under Confiscation you carry one; a second means leaving it." : "You carry two; a third means leaving one."} Working a relic spends a use, and only a chapel's Prepare readies them again. Transmuting one destroys it for good, toward freedom: its own effect, and Gnosis +1. Tap a relic in play for what it would do to the card in front of you.</p>${rows}</div><div class="row"><button class="btn ghost" data-v="ok" type="button">Close</button></div>`, { dismiss: false });
}

// The Seven Spheres (occult.js), as the codex has learned them: each garment, and how often its gate was passed.
function sevenCodex() {
  const g = meta.asc.occ.gates;
  const rows = LADDER.map((p) => {
    const x = SPHERES[p];
    const by = g[p] ? Object.entries(g[p]).map(([how, n]) => `${MEANS[how] || how} ×${n}`).join(" · ") : "";
    return `<div${by ? "" : ' class="locked"'}><h4>${x.glyph}\uFE0E ${esc(sphereName(p, true))} · ${esc(x.metal)}</h4><p>Its garment: ${esc(x.garment)}. ${by ? esc(by) : "Its gate hasn't let you past yet."}</p></div>`;
  }).join("");
  const paths = Object.entries(meta.asc.occ.paths).map(([k, n]) => `${PATHS[k] || k} ×${n}`).join(" · ");
  return `<div class="eyebrow">The Seven</div>${rows}${paths ? `<div><h4>The ways walked</h4><p>${esc(paths)}</p></div>` : ""}`;
}
// The Crypt Stair workbench (ritual.js), as the codex has learned it. Five states per recipe: undiscovered,
// encountered, partial, performed, fully documented. Knowledge, never power.
const RIT_LABEL = { undiscovered: "Undiscovered", encountered: "Encountered", partial: "Partly worked", performed: "Performed", documented: "Fully documented" };
function ritCodex() {
  const rec = meta.asc.occ.rit || {};
  const rows = RECIPES.map((r) => {
    const x = ritEntry(r, rec[r.id]);
    const dim = RIT_STATES.indexOf(x.state) < 3 ? ' class="locked"' : "";
    const body = x.state === "undiscovered" ? esc(r.hint) : [x.clue ? `<i>${esc(x.clue)}</i>` : "", x.needs.length ? `Needs ${x.needs.map(esc).join("; ")}.` : "", ...x.lines.map(esc)].filter(Boolean).join(" ");
    return `<div${dim}><h4>${esc(x.name)} · ${RIT_LABEL[x.state]}</h4><p>${body}</p></div>`;
  }).join("");
  return `<div class="eyebrow">The Workbench</div>${rows}`;
}
// Strategic preparation (prep.js), as the codex has learned it: per keeper, not met, met, prepared, prepared and won.
const PREP_LABEL = { unmet: "Not met", met: "Met", prepared: "Prepared for", won: "Prepared for, and beaten" };
function prepCodex() {
  const rec = meta.asc.occ.prep || {};
  const rows = Object.keys(PREPS).map((adv) => {
    const x = prepEntry(adv, rec[adv]);
    const dim = PREP_STATES.indexOf(x.state) < 2 ? ' class="locked"' : "";
    const body = x.lines.length ? x.lines.map(esc).join(" ") : "A Prepare night at a chapel buys an hour against the next one.";
    return `<div${dim}><h4>${esc(x.name)} · ${PREP_LABEL[x.state]}</h4><p>${body}</p></div>`;
  }).join("");
  return `<div class="eyebrow">Preparation</div>${rows}`;
}
// What you've learned about the adversaries, in canon's own terms (§13): detection, danger, counter, impact.
// Knowledge, never power. Unmet ones show only where they wait.
function codex() {
  const rows = Object.entries(ENCOUNTERS)
    .map(([id, def]) => {
      const met = meta.asc.met[id];
      if (!met) return `<div class="locked"><h4>? ? ?</h4><p>${esc(def.hint)}</p></div>`;
      const seen = def.phases.flatMap((p) => p.intents || []).filter((k, i, a) => a.indexOf(k) === i && meta.asc.seen[k]);
      const outs = Object.entries(met).map(([k, n]) => `${esc(def.outcomes[k] ? def.outcomes[k].title : ENDINGS[k] ? ENDINGS[k].title : k)} ×${n}`).join(" · ");
      const counter = Object.keys(def.roads).length ? `${Object.values(def.roads).map((r) => r.label).join(", ")}; or disengage at the last card` : "Refuse what pulls. Leave the chair empty.";
      return `<div><h4>${esc(def.name)}</h4><p>${esc(def.intro)}</p>
        <p><b>Detection.</b> ${seen.length ? seen.map((k) => `${esc(INTENTS[k].name)}: ${esc(INTENTS[k].says)}, stopped by ${esc(INTENTS[k].by.map((v) => VERBS[v]).join(" or "))}`).join("; ") : "Nothing seen yet."}</p>
        <p><b>Danger.</b> ${esc(def.danger)}</p>
        <p><b>Counter.</b> ${esc(counter)}</p>
        <p class="risk"><b>Impact.</b> ${outs}</p></div>`;
    })
    .join("");
  const shut = sealed().map((k) => `<div class="locked"><h4>${UNLOCKS[k].kind === "road" ? "A road" : "A relic"}, sealed</h4><p>${esc(UNLOCKS[k].hint)}</p></div>`).join("");
  const line = meta.asc.lineage.length ? `<div class="eyebrow">Your line</div>${meta.asc.lineage.slice().reverse().map((x) => `<div${x.won ? "" : ' class="locked"'}><h4>${esc(x.n)} · ${esc(x.by)}</h4><p>${esc(ACTS[x.act] ? ACTS[x.act].name : "")}${x.edict ? ` · Edict ${roman(x.edict)}` : ""}${x.won ? " · got out" : ""}</p></div>`).join("")}` : "";
  const eds = EDICTS.slice(1).map((e, i) => (i < meta.asc.edict ? `<div><h4>Edict ${roman(i + 1)} · ${esc(e.name)}</h4><p>${esc(e.text)}</p></div>` : i === meta.asc.edict ? `<div class="locked"><h4>Edict ${roman(i + 1)}, sealed</h4><p>Walk a Way Out under ${i ? `Edict ${roman(i)}` : "no Edict"}.</p></div>` : "")).join("");
  return overlay(`<div class="eyebrow">Adversaries · Exodus</div><div class="gallery">${rows}${shut ? `<div class="eyebrow">Still sealed</div>${shut}` : ""}${sevenCodex()}${ritCodex()}${prepCodex()}<div class="eyebrow">Edicts</div>${eds}${line}</div><button class="btn ghost" data-v="ok" type="button">Close</button>`, { dismiss: false });
}

// ---------- endings ----------
// A run that just ended is booked once, the moment it ends (commit() calls this before the slip), not when its
// end screen opens: the end screen reads what was booked.
let recorded = null;
function record() {
  const s = run;
  if (recorded && recorded.s === s) return recorded;
  const e = ENDINGS[s.over];
  const n = nightsSurvived(s);
  const info = { firstFind: !meta.endings[s.over], newBest: meta.plays > 0 && n > meta.best };
  meta.endings[s.over] = (meta.endings[s.over] || 0) + 1;
  meta.plays++;
  meta.best = Math.max(meta.best, n);
  if (e.win) meta.crowns++;
  info.stillOut = nextStillOut(e.win, s.mode === "ascension");
  const text = shareText(s, shareUrl(), shareOpts(s));
  if (s.mode === "vigil") meta.vigils[s.seedLabel] = { over: s.over, nights: n, text, ...(s.late ? { late: true } : {}) };
  if (s.mode === "ascension") {
    meta.asc.runs++;
    // A Way Out walked under the highest Edict unseals the next. The early wins and By Decree don't.
    // (A friend's road at a higher Edict than yours unseals nothing: Edicts are walked one at a time.)
    if (e.win && e.family === "unmaking" && s.asc.edict === meta.asc.edict && meta.asc.edict < MAX_EDICT) info.edict = meta.asc.edict = s.asc.edict + 1;
    meta.asc.act = Math.max(meta.asc.act, s.asc.act);
    // Ended inside a fight, or at the Oldest Trap's gate or chair: that meeting is booked by the run's ending. (A fight
    // that had only just begun, on the card that ended the run, wasn't met.)
    if (s.asc.enc && s.asc.enc.turn > 0) bookMet(s.asc.enc.id, s.over);
    if (s.asc.occ) {
      const o = s.asc.occ;
      for (const [p, how] of Object.entries(o.spheres)) {
        const g = (meta.asc.occ.gates[p] = meta.asc.occ.gates[p] || {});
        g[how] = (g[how] || 0) + 1;
      }
      const path = pathOf(s);
      meta.asc.occ.paths[path] = (meta.asc.occ.paths[path] || 0) + 1;
      meta.asc.occ.rit = ritBook(meta.asc.occ.rit, s.asc.syn && s.asc.syn.rit);
      meta.asc.occ.prep = prepBook(meta.asc.occ.prep, s.asc.syn && s.asc.syn.prep);
    }
    if (s.asc.self) {
      meta.asc.lineage.push({ n: s.asc.self, by: e.title, end: s.over, act: s.asc.act, edict: s.asc.edict, won: !!e.win });
      meta.asc.lineage = meta.asc.lineage.slice(-12);
    }
  }
  if (saveMeta()) store.del(slotOf(s));
  else store.set(slotOf(s), s); // keep the completed attempt recoverable
  if (s === ascRun) ascRun = null;
  return (recorded = { s, text, info });
}
function finish(opened = []) {
  busy = true;
  hideCoach();
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const { s, text, info } = record();
  info.opened = opened;
  const e = ENDINGS[s.over];
  // Exodus's own endings have their own music: a Way Out opens The World Without a King, the chair gets the Architect.
  setMood(e.family === "unmaking" && e.win ? "unmade" : e.kept ? "decreed" : e.win ? "light" : "end");
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
    catalogued: "The Inquisition finished its catalogue.",
    fluent: "The Grammar finished its sentence, in your handwriting.",
    gilded: "The Festival reached noon with you still in it.",
    decree: s.endBy === "a_force" ? "You stopped the festival by force, and they seated you for it." : "You sat down.",
  }[k];
  return line ? line + "<br />" : "";
}
// The counter to a death, said plainly after it. Rules only: every line is something the engine does.
const END_LESSON = {
  named: "Mark comes down when you change your routine, lie low, or take a stair nobody's mapped. The Sister hides you once.",
  // A Naming the Reckoning delivered: its Mark, not the routine, is what to read next time.
  named_reckoning: "The Reckoning costs a Mark whichever way you answer, and More light only puts it off, a Mark at a time. Meet it below Mark 5.",
  fracture: "3 Favor in the purse absorbs one Fracture, and the Sponsor catches another. From Hollow 2 up, every Strain cost is 1 higher.",
  fracture_reckoning: "The Reckoning lands 3 Strain at once, 4 once the Light is a habit. Meet it with Strain low.",
  destitute: "The Bell wants at least 1 Favor in the purse. The Open Table catches one bad night.",
  collapse: "Hollow rises every night you don't rest. Sleep, the Sabbath and a meal bring it down, twice as fast bare-faced.",
  cage: "The Cage grows when help comes without terms. Ask what it costs. Name the pattern and you'll see it.",
  rex: "Every show of menace adds up. Staying small and keeping the Sabbath clear it.",
  billet: "Slipping home with a tail is a gamble. Lamps and crowds are the safe way out.",
  flag: "The old yard asks three times. Saying no out loud, at any of them, ends it.",
  corner: "Going back for the old work puts your face on the corner when the wagons come.",
  shadow: "The Enemy asks three times. Naming another goal, burning the notes or setting him down, at any of them, ends it.",
  catalogued: (s) => `Every night at Mark 3 or more fattens the File before the fight. In it, a choice marked ✓ stops the intent at the head of the card. Fill one road first, or disengage when the File is two from full. Walking out bare is only certain at Untaggable ${bareAt(s)}.`,
  fluent: "The Grammar starts higher for every Chain you gave in to on the road, and speaks those Chains twice as often. Answer what you can and build one road.",
  gilded: "The Festival starts higher for your tolerance of the Light and the gilt you owe, and two higher if you walked out of the Grammar. Keep the Light rare before the third movement.",
  decree_force: "Force stops the festival for good only with someone beside you and the Pull at 2 or less. Alone, or pulled, a hit seats you.",
  decree: (s) => `The chair is always the sure thing. The Return asks Gnosis 9, the Pull at ${pullAt(s, 1)} or less and someone beside you; the Open Gate, two of the Named freed and the Pull at ${pullAt(s, 3)} or less. Or hold the gate, or walk.`,
};
const segs = (v, n) => `<div class="segs" style="--n:${n}">${Array.from({ length: n }, (_, i) => `<i${i < v ? ' class="on"' : ""}></i>`).join("")}</div>`;

// One ending you haven't found, by its gallery hint, a different one each run: the next thing to go looking for.
// The wins keep their own progress bars, except on a win's screen, where the other win is the next question.
// Picked once per ending: the next unfound one after the last named, in a fixed order, so the pool shrinking
// under it can't land on the same one twice running. The order mixes the kinds of ending and puts the plain meter
// deaths, which find a player anyway, last: a first session's questions aren't six Namings in a row.
const STILL_OUT = ["cage", "named_hunt", "fracture_reckoning", "billet", "named_zealot", "rex", "corner", "named_scout", "shadow", "flag", "named_darvo", "named_clerk", "collapse", "destitute", "fracture", "named"];
function nextStillOut(won, asc = false) {
  // Exodus's endings are only suggested from inside Exodus, where they can be found.
  const ok = (k) => ENDINGS[k] && (asc || ENDINGS[k].family !== "unmaking");
  const other = won && Object.keys(ENDINGS).find((k) => ok(k) && ENDINGS[k].win && !meta.endings[k]);
  if (other) return other;
  const keys = [...STILL_OUT, ...Object.keys(ENDINGS).filter((k) => !STILL_OUT.includes(k))].filter((k) => ok(k) && !ENDINGS[k].win && ENDINGS[k].hint);
  const at = keys.indexOf(meta.lastOut);
  const k = [...keys.slice(at + 1), ...keys.slice(0, at + 1)].find((x) => !meta.endings[x]);
  if (k) meta.lastOut = k;
  return k;
}
const stillOut = (k) => (k ? `<p class="stillout">Still out there: <i>${esc(ENDINGS[k].hint)}</i></p>` : "");
function lesson(s) {
  const k = s.over.startsWith("named") ? (s.endBy === "reckoning" ? "named_reckoning" : "named") : s.over === "decree" && s.endBy === "a_force" ? "decree_force" : s.over;
  const l = typeof END_LESSON[k] === "function" ? END_LESSON[k](s) : END_LESSON[k];
  return l && (meta.endings[s.over] || 0) <= 3 ? `<p class="lesson">${l}</p>` : "";
}
// Exodus's road, on its end screen: each adversary and how it ended, the Named you got out, what you carried.
function ascSummary(s) {
  const a = s.asc;
  const rows = a.met.map((m) => {
    const def = ENCOUNTERS[m.id];
    const out = def.outcomes[m.out];
    return `<div><span>${esc(def.name)}: <b>${esc(out && out.title ? out.title : m.out === "fled" ? "fled" : m.out)}</b></span></div>`;
  });
  if (a.enc) rows.push(`<div><span>${esc(ENCOUNTERS[a.enc.id].name)}: <b>unfinished</b></span></div>`);
  const freed = (a.named || []).filter((x) => x.st === "free").map((x) => x.n);
  const heir = (a.named || []).find((x) => x.heir);
  if (heir) rows.push(`<div><span>${esc(heir.n)}, who walked it before you: <b>${heir.st === "free" ? "you got them out" : "still in the margin"}</b></span></div>`);
  return `<div class="crownprog"><div class="eyebrow">${a.self ? `${esc(a.self)}'s road` : "The road"} · ${esc(ACTS[a.act].name)}${a.road ? ` · ${esc(ROADS[a.road].name)}` : ""}</div>${rows.join("")}
    <div><span>The Named freed: <b>${a.freed}</b>${freed.length ? ` (${esc(freed.join(", "))})` : ""}${a.relics.length ? ` · carried: ${esc(a.relics.map((r) => RELICS[r].name).join(", "))}` : ""}</span></div></div>`;
}
// The occult expansion's reading of the ending (occult.js OCC_READINGS): the same Way Out, read by the way you walked
// it, and the facts under it. No new endings.
function occEnd(s) {
  const o = s.asc && s.asc.occ;
  if (!o) return "";
  const path = pathOf(s);
  const read = occReading(s, s.over);
  const n = gatesPassed(s);
  const how = [...new Set(Object.values(o.spheres).map((h) => MEANS[h]))].join(", ");
  const facts = `${esc(PATHS[path].charAt(0).toUpperCase() + PATHS[path].slice(1))}. Gates passed: ${n} of 7${how ? ` (${esc(how)})` : ""}.${o.will ? ` Your will: ${esc(ORBIT[o.will])}.` : o.claimed ? " Another's will, named as yours." : ""}`;
  return `${read ? `<p class="occread ${path}">${esc(read)}</p>` : ""}<p class="fine occfacts">${facts}</p>`;
}
// Order is the loop: what happened → why → go again / dare a friend → what you're collecting → what was hidden.
function endHtml(s, text, info) {
  const e = ENDINGS[s.over];
  const n = nightsSurvived(s);
  const cause = endCause(s);
  // The run's own collection: a regular run counts the endings it can reach; Exodus counts every one.
  const keys = Object.keys(ENDINGS).filter((k) => s.mode === "ascension" || ENDINGS[k].family !== "unmaking");
  const found = keys.filter((k) => meta.endings[k]).length;
  const rival = s.mode === "vigil" ? meta.rivals[s.seedLabel] : null;
  const vs = rival && rival.nights != null
    ? `<p class="vs">${n > rival.nights ? `You outlasted them: <b>${n}</b> nights to their <b>${rival.nights}</b>.` : n === rival.nights ? `Dead even: <b>${plural(n, "night")}</b> each.` : `They lasted <b>${rival.nights}</b>. You lasted <b>${n}</b>.`}</p>`
    : "";
  const d = s.asc && s.asc.dare;
  const dareVs = d ? `<p class="vs">They reached <b>${esc(ACTS[d.act].name)}</b>${d.ending && ENDINGS[d.ending] ? ` (${esc(ENDINGS[d.ending].title)})` : ""}. You reached <b>${esc(ACTS[s.asc.act].name)}</b>.</p>` : "";
  const reveal = [
    s.cage > 0 ? `<p>The Cage stood at <b>${s.cage}/8</b>${s.cageSeen ? "" : ", and you never saw it"}. It grows when you take help without terms, comply, or let a kindness hook you.</p>` : "",
    s.apo > 0 ? `<p>Menace: <b>${s.apo}/6</b>. Every show of danger drew the wolves closer.</p>` : "",
  ].join("");
  const asc = s.mode === "ascension" ? ascSummary(s) : "";
  return `<div class="eyebrow">${s.mode === "vigil" ? `Vigil #${vigilNumber(s.seedLabel)}` : s.mode === "ascension" ? `Exodus${s.asc.edict ? ` · Edict ${roman(s.asc.edict)}` : ""} · ${esc(ACTS[s.asc.act].name)}` : "Endless"} · Night ${s.day}</div>
    ${info.firstFind ? `<div class="newend">${e.win ? `Your first ${esc(e.title.replace(/^The /, ""))}` : "A new ending"}, ${found} of ${keys.length} found</div>` : ""}
    ${endingArt(s.over)}<h2 class="big">${esc(e.title)}</h2><p class="line">${esc(e.line)}</p>${occEnd(s)}
    <p class="endcause">${causeSentence(s)}${e.win ? `${esc(e.title)} on night ${s.day}.` : n === 0 ? (s.endBy === "nightfall" ? "It was your first night" : "You didn't reach the first nightfall") : `You lasted ${plural(n, "night")}`}${e.win ? "" : info.newBest ? `, <b class="best">your best yet</b>.` : meta.plays > 1 ? `. Your best is ${meta.best}.` : "."}</p>
    ${lesson(s)}
    ${vs}${dareVs}
    <div class="endact"><button class="btn primary" data-v="again" type="button">${s.mode === "ascension" ? "Walk it again" : ascRun ? "Resume Exodus" : "Walk Exodus"}</button>
    <button class="btn" data-v="share" type="button">${s.mode === "vigil" ? "Challenge a friend" : "Share result"}</button></div>
    <div class="collect" aria-label="Endings found">${keys.map((k) => `<i class="${meta.endings[k] ? "on" : ""}${k === s.over && info.firstFind ? " new" : ""}${ENDINGS[k].win ? " win" : ""}"></i>`).join("")}<span>${found} of ${keys.length} endings</span></div>
    ${stillOut(info.stillOut)}
    ${asc}
    ${info.opened && info.opened.length ? `<p class="stillout">Unsealed for your next Exodus: <b>${esc(info.opened.map(unlockName).join(", "))}</b>.</p>` : ""}
    ${info.edict ? `<p class="stillout">The Dominion answers. <b>Edict ${roman(info.edict)}, ${esc(EDICTS[info.edict].name)}</b>, is yours to take on: ${esc(EDICTS[info.edict].text)}</p>` : ""}
    ${e.win || asc ? "" : `<div class="crownprog"><div class="eyebrow">Double Crown</div><div><span>Untaggable ${s.untag}/12</span>${segs(s.untag, 12)}</div><div><span>Gnosis ${s.gnosis}/12</span>${segs(s.gnosis, 12)}</div>
    <div class="eyebrow">Ordinary Time</div><div><span>Bonds ${bondsEarned(s)}/3${s.flags.house ? " · a room" : ""}</span>${segs(bondsEarned(s) + (s.flags.house ? 1 : 0), 4)}</div></div>`}
    ${reveal ? `<div class="reveal">${reveal}</div>` : ""}
    <div class="nights" role="img" aria-label="Your nights, one tile each">${s.days.map((d) => `<i class="${esc(d)}" title="${NIGHT_TILE[d] || ""}"></i>`).join("")}</div>
    <p class="legend">${[...new Set(s.days)].map((d) => `<span><i class="${esc(d)}"></i>${NIGHT_TILE[d] || ""}</span>`).join("")}</p>
    <div class="row"><button class="btn ghost small" data-v="image" type="button">Share card</button>
    ${s.mode === "vigil" && pastNights(todayISO()).some((d) => !meta.vigils[d]) ? `<button class="btn ghost small" data-v="past" type="button">Past Vigils</button>` : ""}
    <button class="btn ghost small" data-v="home" type="button">Menu</button></div>
    ${RULEBOOK_URL ? `<a class="fine" href="${RULEBOOK_URL}" target="_blank" rel="noopener">Play the full tabletop RPG: The Poisoner of False Light</a>` : ""}`;
}

async function showEnd(s, text, info) {
  for (;;) {
    const v = await overlay(endHtml(s, text, info), { dismiss: false, cls: isWin(s) ? (s.mode === "ascension" ? "won free" : "won") : s.over === "decree" ? "kept" : "" });
    if (v === "share") await shareTextFlow(text);
    else if (v === "image") await shareImageFlow(s);
    // Endless lives on in Exodus's first act: after a Vigil (or an old Endless run) the way on is the long road.
    else if (v === "again") return start("ascension");
    else if (v === "past") return goHome(), pastVigils();
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
        await navigator.share({ files: [file], text: shareText(s, shareUrl(), shareOpts(s)) });
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
  g.fillText(s.mode === "vigil" ? `VIGIL #${vigilNumber(s.seedLabel)} · ${s.seedLabel}` : s.mode === "ascension" ? `EXODUS${s.asc.edict ? ` · EDICT ${roman(s.asc.edict)}` : ""}` : "ENDLESS", W / 2, 200);
  if (s.mode === "vigil") {
    g.save();g.strokeStyle = "#c6aa70";g.lineWidth = 2;
    for (const x of [70, W - 70]) for (const y of [250, H - 90]) {
      g.beginPath();g.moveTo(x, y - 9);g.lineTo(x + 9, y);g.lineTo(x, y + 9);g.lineTo(x - 9, y);g.closePath();g.stroke();
    }
    g.restore();
  }
  g.fillStyle = "#f7f1f6";
  g.font = '600 104px "Cormorant Garamond", Georgia, serif';
  wrap(g, e.title, W / 2, 400, W - 200, 104);
  g.font = 'italic 500 44px "Cormorant Garamond", Georgia, serif';
  g.fillStyle = "rgba(247,241,246,.72)";
  wrap(g, e.line, W / 2, 560, W - 220, 54);
  // Tonight's card, once read: the same for everyone that night, so it's what two cards side by side have in common.
  const read = vigilCardLine(s).replace(/^🃏 /, "");
  if (read) {
    g.font = '500 26px Cinzel, Georgia, serif';
    g.fillStyle = "rgba(242,195,92,.85)";
    g.fillText(`TONIGHT'S CARD · ${read.toUpperCase()}`, W / 2, 735);
  }
  g.font = '600 40px Cinzel, Georgia, serif';
  g.fillStyle = s.over === "decree" ? "#c6aa70" : isWin(s) ? (s.mode === "ascension" ? "#eee5d3" : "#f2c35c") : "#e0008f";
  g.fillText(s.over === "decree" ? "BY DECREE · KEPT" : isWin(s) ? `${s.over === "crown" ? "CROWNED" : s.over === "ordinary" ? "ORDINARY TIME" : "UNMADE"} ON NIGHT ${s.day}` : `${nightsSurvived(s)} NIGHT${nightsSurvived(s) === 1 ? "" : "S"} SURVIVED`, W / 2, 800);
  const cause = endCause(s);
  if (cause && cause.by) {
    g.font = '500 30px Inter, system-ui, sans-serif';
    g.fillStyle = "rgba(247,241,246,.7)";
    g.fillText(cause.by === "at nightfall" ? "Ended at nightfall" : `Ended by ${cause.by}`, W / 2, 848);
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
    g.fillStyle = "rgba(172,107,192,.95)"; // --porphyra-text: the Dominion's hue, light enough to read on the card
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
  delete document.body.dataset.mode;
  delete document.body.dataset.act;
  delete document.body.dataset.adversary;
  busy = false;
  if (run && run.mode === "ascension") run = reg;
  document.body.classList.remove("asc", "fight");
  setMood("home");
  $("layer").innerHTML = "";
  backdrop();
  disarmMask();
  setSeal(null);
  $("app").hidden = true;
  $("home").hidden = false;
  renderHome();
}

const isoDay = (d) => d.toISOString().slice(0, 10);
// The streak a Vigil's share carries: tonight's, played on the night and kept, counted with the nights before it.
function shareOpts(s) {
  if (s.mode !== "vigil" || s.late || s.over === "abandoned" || s.seedLabel !== todayISO()) return {};
  return { streak: vigilStreak(s.seedLabel) + (meta.vigils[s.seedLabel] ? 0 : 1) };
}
function vigilStreak(today) {
  // A night played late, from the archive, doesn't keep a streak alive.
  const kept = (d) => meta.vigils[d] && meta.vigils[d].over !== "abandoned" && !meta.vigils[d].late;
  const d = new Date(today + "T12:00:00Z");
  if (!meta.vigils[today]) d.setUTCDate(d.getUTCDate() - 1); // tonight's isn't played yet; the streak is still alive (an abandoned one breaks it)
  let n = 0;
  for (; kept(isoDay(d)); n++) d.setUTCDate(d.getUTCDate() - 1);
  return n;
}

// Every night since launch before tonight, newest first: the Vigil archive. Each is still one attempt.
function pastNights(today) {
  const out = [];
  const d = new Date(today + "T12:00:00Z");
  for (d.setUTCDate(d.getUTCDate() - 1); isoDay(d) >= LAUNCH_DAY; d.setUTCDate(d.getUTCDate() - 1)) out.push(isoDay(d));
  return out;
}
async function pastVigils() {
  const date = todayISO();
  const open = run && run.mode === "vigil" && !run.over ? run.seedLabel : null;
  const rows = pastNights(date)
    .map((d) => {
      const v = meta.vigils[d];
      const head = `<span><b>Vigil #${vigilNumber(d)}</b> · ${d}</span>`;
      if (v) return `<div class="past done"><span><b>Vigil #${vigilNumber(d)}</b> · ${d}<i>${esc(ENDINGS[v.over]?.title || "Abandoned")} · ${plural(+v.nights || 0, "night")}${v.late ? " · late" : ""}</i></span><button class="btn ghost small" data-v="share:${d}" type="button" aria-label="Share Vigil #${vigilNumber(d)}">Share</button></div>`;
      return `<div class="past">${head}<button class="btn small" data-v="play:${d}" type="button">${open === d ? "Resume" : "Play"}</button></div>`;
    })
    .join("");
  const v = await overlay(`<div class="eyebrow">Past Vigils</div><p class="fine">Every night since the first, same seed as everyone drew that night. One attempt each. A night played late doesn't count toward your streak.</p><div class="pasts">${rows}</div><button class="btn ghost" data-v="ok" type="button">Close</button>`, { dismiss: false });
  const [k, d] = String(v).split(":");
  if (k === "play") return start("vigil", d, { late: true });
  if (k === "share") {
    await shareTextFlow(meta.vigils[d].text || abandonedText(d));
    return pastVigils();
  }
}

function renderHome() {
  const date = todayISO();
  const n = vigilNumber(date);
  const done = meta.vigils[date];
  const vigRun = run && run.mode === "vigil" && !run.over ? run : null;
  const resumeEndless = run && run.mode === "endless" && !run.over;
  // A dare that was tomorrow's when the page opened is today's after midnight: read the link again so it can be played.
  if (incoming && incoming.early && incoming.date <= date) readChallenge();
  const ch = incoming;
  const streak = vigilStreak(date);
  let html = "";
  if (ch) {
    // Someone sent a Vigil. Same seed; their score, if the link carried one, is the bar to clear.
    const vn = vigilNumber(ch.date);
    const mine = meta.vigils[ch.date];
    const theirs = ch.nights == null ? "" : `They lasted <b>${plural(ch.nights, "night")}</b>${ch.ending ? ` (${esc(ENDINGS[ch.ending].title)})` : ""}. `;
    html += ch.early
      ? `<div class="challenge" id="challenge"><div class="eyebrow">A challenge · Vigil #${vn} · tomorrow</div>
      <p>${theirs}It's already tomorrow where they are. Vigil #${vn} opens here at midnight.</p></div>`
      : `<div class="challenge" id="challenge"><div class="eyebrow">A challenge · Vigil #${vn}${ch.date === date ? " · today" : ` · ${ch.date}`}</div>
      <p>${theirs}Same seed. One attempt. Can you last longer?</p>
      ${mine ?`<p>You lasted <b>${plural(+mine.nights || 0, "night")}</b> (${esc(ENDINGS[mine.over]?.title || "Abandoned")}).</p>` : vigRun && vigRun.seedLabel === ch.date ? `<button class="btn primary" id="b-challenge" type="button">Resume the challenge</button>` : `<button class="btn primary" id="b-challenge" type="button">Take the challenge</button>`}</div>`;
  }
  // Someone sent their road: the same seed, at their Edict.
  const road = incomingRoad;
  if (road) {
    const walking = ascRun && ascRun.seedLabel === road.seed;
    html += `<div class="challenge" id="road-dare"><div class="eyebrow">A road, shared · Exodus${road.edict ? ` · Edict ${roman(road.edict)}` : ""}</div>
      <p>They reached <b>${esc(ACTS[road.act].name)}</b>${road.ending && ENDINGS[road.ending] ? `: ${esc(ENDINGS[road.ending].title)}` : ""}. Same road, same draws until your choices part. The whole map is open on it.</p>
      <button class="btn primary" id="b-road" type="button">${walking ? "Resume their road" : "Walk the same road"}</button></div>`;
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
  if (pastNights(date).length) html += `<button class="sub" id="b-past" type="button">Past Vigils</button>`;
  // Exodus: the long run, in its own slot. Its first movement is the Vigil's game; then the road goes on.
  // It's the main door once tonight's Vigil is spent.
  const ascMain = !!done && !road && !(ch && !ch.early && !meta.vigils[ch.date]);
  html += `<button class="btn${ascMain ? " primary" : ""}" id="b-asc" type="button">${ascRun ? `Resume Exodus · ${esc(ACTS[ascRun.asc.act].name)}` : "Exodus"}</button>`;
  if (ascRun) html += `<button class="sub" id="b-asc-new" type="button">Abandon it and start over</button>`;
  else html += `<span class="sub">The long run. Three acts, four roads, an empty chair.</span>`;
  // Endless was folded into Exodus (2026-10-17). A run saved before that can still be finished.
  if (resumeEndless) html += `<button class="btn ghost" id="b-endless" type="button">Finish your last Endless run</button>`;
  $("menu").innerHTML = html;
  if ($("b-challenge")) $("b-challenge").onclick = () => start("vigil", ch.date);
  if ($("b-vigil")) $("b-vigil").onclick = () => start("vigil", date);
  if ($("b-vigil-old")) $("b-vigil-old").onclick = () => start("vigil", oldVig.seedLabel);
  if ($("b-vigil-done")) $("b-vigil-done").onclick = () => shareTextFlow(done.text || abandonedText(date));
  if ($("b-endless")) $("b-endless").onclick = () => start("endless");
  if ($("b-past")) $("b-past").onclick = pastVigils;
  if ($("b-road")) $("b-road").onclick = () => start("ascension", undefined, { dare: road });
  $("b-asc").onclick = () => start("ascension");
  if ($("b-asc-new"))
    $("b-asc-new").onclick = () =>
      overlay(`<div class="eyebrow">Abandon this Exodus?</div><p class="line">It's in ${esc(ACTS[ascRun.asc.act].name)}. Abandoned, it's gone.</p><div class="row"><button class="btn primary" data-v="cancel" type="button">Keep it</button><button class="btn" data-v="abandon" type="button">Abandon it</button></div>`, { dismiss: false }).then((v) => {
        if (v !== "abandon") return renderHome();
        ascRun = null;
        store.del("fl.asc");
        start("ascension");
      });
  $("btn-codex").hidden = !(meta.asc.runs || ascRun);
  const found = Object.keys(meta.endings).length;
  $("stats").innerHTML = meta.plays
    ? `<span><b>${meta.plays}</b>runs</span><span><b>${meta.crowns}</b>wins</span><span><b>${found}/${Object.keys(ENDINGS).length}</b>endings</span>${meta.asc.act ? `<span><b>${ROMAN_ACT[meta.asc.act]}</b>furthest act</span>` : `<span><b>${meta.best}</b>best nights</span>`}`
    : "";
  $("btn-sound").textContent = meta.mute ? "Sound off" : "Sound on";
  $("btn-music").textContent = meta.musicOff ? "Music off" : "Music on";
  $("btn-music").disabled = !!meta.mute;
  $("rulebook").innerHTML = RULEBOOK_URL ? `<a href="${RULEBOOK_URL}" target="_blank" rel="noopener">The full tabletop RPG →</a>` : "";
  homeDay = date;
  homeClock();
}
// The home screen is dated (tonight's Vigil, a dare that opens at midnight). Left open past midnight, or brought
// back after it, it's drawn again for the new day; otherwise its buttons would start yesterday's Vigil.
let homeDay = null;
let homeTimer = 0;
function homeClock() {
  clearTimeout(homeTimer);
  if ($("home").hidden) return;
  if (homeDay !== todayISO()) return renderHome();
  const next = new Date();
  next.setHours(24, 0, 1, 0); // a second past local midnight
  homeTimer = setTimeout(homeClock, next - new Date());
}
document.addEventListener("visibilitychange", () => document.hidden || homeClock());

// A walked-away Vigil has no score to beat, but it can still be passed on.
const abandonedText = (date) => [`FALSE LIGHT · Vigil #${vigilNumber(date)} · VENEFICA LUX`, "I walked away from this one.", `Same seed. Your turn: ${shareUrl().split("#")[0]}#vigil-${date}`].join("\n");

// A road's seed is short enough to send: eight base-36 characters.
const roadSeed = () => "ascension-" + Array.from({ length: 8 }, () => "0123456789abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 36)]).join("");
async function start(mode, date = todayISO(), { late = false, dare = null } = {}) {
  $("layer").innerHTML = "";
  backdrop();
  disarmMask();
  if (mode === "ascension") {
    // Its own slot: an Endless run or a Vigil in progress stays where it is.
    if (run && run.mode !== "ascension") reg = run;
    // A friend's road: the same seed at their Edict, with the whole map open (theirs may be bigger than yours).
    if (dare && ascRun && (ascRun.seedLabel !== dare.seed || ascRun.asc.edict !== dare.edict || exodusRules(ascRun) !== (dare.depth || 0))) {
      const v = await overlay(`<div class="eyebrow">Abandon this Exodus?</div><p class="line">Walking their road ends yours, in ${esc(ACTS[ascRun.asc.act].name)}.</p><div class="row"><button class="btn primary" data-v="cancel" type="button">Keep mine</button><button class="btn" data-v="abandon" type="button">Walk theirs</button></div>`, { dismiss: false });
      if (v !== "abandon") return goHome();
      ascRun = null;
      store.del("fl.asc");
    }
    if (!ascRun) {
      const prev = meta.asc.lineage[meta.asc.lineage.length - 1] || null;
      if (dare) {
        ascRun = newGame({ seed: dare.seed, mode, tutorial: !meta.tutorialDone, locked: [], edict: dare.edict, depth: dare.depth || false, prev });
        ascRun.asc.dare = { act: dare.act, ending: dare.ending, edict: dare.edict };
      } else {
        const edict = await pickEdict();
        ascRun = newGame({ seed: roadSeed(), mode, tutorial: !meta.tutorialDone, locked: sealed(), edict, prev });
      }
    }
    run = ascRun;
    saveRun();
    return enter();
  }
  if (run && run.mode === "ascension") run = reg;
  const resumable = run && !run.over && run.mode === mode && (mode === "endless" || run.seedLabel === date);
  if (!resumable) {
    if (mode === "vigil" && meta.vigils[date]) return goHome();
    if (run && !run.over) {
      const vig = run.mode === "vigil" ? `Vigil #${vigilNumber(run.seedLabel)}` : "your endless run";
      return overlay(`<div class="eyebrow">Abandon this run?</div><p class="line">Starting a new run ends ${vig}.${run.mode === "vigil" ? " A Vigil you walk away from still counts as your one attempt." : ""}</p><div class="row"><button class="btn primary" data-v="cancel" type="button">Keep my run</button><button class="btn" data-v="abandon" type="button">Abandon it</button></div>`, { dismiss: false }).then(v => {
        if (v !== 'abandon') return goHome();
        if (run.mode === 'vigil') {
          const previous = meta.vigils[run.seedLabel];
          meta.vigils[run.seedLabel] = { over: "abandoned", nights: nightsSurvived(run), text: abandonedText(run.seedLabel), ...(run.late ? { late: true } : {}) };
          if (!saveMeta()) {
            if (previous) meta.vigils[run.seedLabel] = previous;
            else delete meta.vigils[run.seedLabel];
            return goHome();
          }
        }
        run = reg = null;
        return start(mode, date, { late });
      });
    }
    const seed = mode === "vigil" ? date : `endless-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    run = reg = newGame({ seed, mode, tutorial: !meta.tutorialDone });
    // A night from the archive is played late: it keeps no streak. (A friend's dare for an old night is still a dare.)
    if (late) run.late = true;
    saveRun();
  }
  enter();
}
// Show the run on screen: the score, the board, the card, and anything a reload left half-asked.
function enter() {
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
    <p><b>Swipe the card</b> left or right (or tap a choice twice; on a keyboard, ← or → twice, and Enter to go on). Lit vials and tracks show what a choice will move, never which way. ${SKULL} marks a choice that can end your run.</p>
    <p><b>Four meters.</b> Mark 6: you're Named. Strain 6: you Fracture (3 Favor absorbs one). Favor 0 or Hollow 4 at nightfall: it's over. From Hollow 2 up, every Strain cost is 1 higher.</p>
    <p><b>Tap to check.</b> Tap any meter, track or the Bell in play for what it means and where it stands. Hold a Mask to read it.</p>
    <p><b>The Bell</b> (the dots, top right) counts four cards a day, then nightfall. A night takes some Strain off; a night without rest adds Hollow.</p>
    <p><b>Longing</b> is the ache the Light feeds on. At 3 or more, the False Light starts finding you.</p>
    <p><b>Rolls</b> are 2d6 + stat. 10+ clean, 7–9 at a cost, 6− the world moves. Double six is Radiance; snake eyes is Ruin. Hollow 3 rolls three dice and keeps the worst two.</p>
    <p><b>Masks</b> add +1 to a stat and carry a risk: Nyx Shade, Eris Steel, Lilith Frequency, and the Bare Face heals Hollow twice as fast. Changing is free at dawn, +1 Strain after (+1 more at Hollow 2). Under enough load a Mask can seize you: it holds until nightfall unless you pay +2 Strain to break it. Hold a Mask in play, or open the guide below, for what each one is for.</p>
    <p><b>The False Light</b> takes Strain and Hollow away, instantly. While it lasts, Gnosis can't rise. Then the Reckoning comes due, with interest, and putting it off with more Light leaves a tell: Mark +1 a dose.</p>
    <p><b>Bonds</b> are people: the Sister, the Sponsor, the Open Table. Each catches you once, from one kind of ending (Mark, Strain, a bad nightfall), then it's spent. Tap one to see what it saves.</p>
    <p><b>Win</b> one of two ways. Fill UNTAGGABLE and GNOSIS: the Double Crown. Or earn all three Bonds, get a room at the House, and rest through a night: Ordinary Time. Some things you won't see until it's too late to see them.</p>
    <p><b>Masks</b> open their own roads. Wear one and the city shows you cards it shows nobody else.</p>
    <p><b>Exodus</b> is the long run, as often as you like, in its own save slot. Its first movement is the Vigil's game, and the two wins above are early ways out of it; the Inquisition closes it. Four roads cross the second: the False Shepherd, the Ledger, the Hierarch, or the Geometry Sentinel. Rex Mundi never appears in person: his Grammar, Festival and oldest trap close the third. A fight's banner says what lands unless stopped, and its next intended move; ✓ stops it. Fill a road before the clock fills. Stop when it works, or stand on your progress at the last card. Near a full clock, Disengage leaves before the blow. A fight holds the Bell. Two relics fit beneath the Masks. At the end, an empty chair.</p>
    <p><b>The Seven Spheres.</b> In Exodus each day belongs to one of the seven planets, and each holds something of yours: the Moon your Hollow, Mercury your Mark, Venus your Longing, the Sun the Pull, Mars your Strain, Jupiter your Favor, Saturn what closes on you. At nightfall a sphere lets you past if you gave back what it holds that day (its track fell, to its line), or by a way you found; its toll goes quiet. The sky sheet (the planet's glyph, top bar) shows the ladder. Under each chapel, a stair: two rites, one of the Serpent's Way and one of the Way of Return, each a gift, a limit and a risk; or the Sabbath. At the well, two accounts of the Architect, or neither. Neither way is the right one.</p>
    <p><b>Vigil</b>: one daily run. Everyone draws from the same seed, and dice never reorder it, but your choices change which cards can appear. Share your result and the link carries the seed and your score. Missed a night? <b>Past Vigils</b> keeps every one since the first, one attempt each; a night played late doesn't count toward your streak.</p>
    <p><b>Leaving</b> a run (☰, top left) keeps it; it resumes from the menu. Starting a different run asks before it ends the old one, and a Vigil you walk away from still counts as your attempt.</p>
    <p><b>Offline.</b> Add it to your home screen from the browser's menu. Once it has opened online it plays offline; each track is kept after it first plays.</p></div>
    <div class="row"><button class="btn small" data-v="masks" type="button">The Masks</button><button class="btn small" data-v="relics" type="button">Relics</button><button class="btn small" data-v="tut" type="button">Replay the tutorial</button><button class="btn ghost small" data-v="ok" type="button">Close</button></div>`,
    { dismiss: false },
  ).then((v) => {
    if (v === "masks") return masksGuide().then(howTo);
    if (v === "relics") return relicGuide().then(howTo);
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
    .map(([k, m]) => `<div class="mrow${run && !run.over && board().mask === k ? " on" : ""}"><div class="mask-key-art" data-mask="${k}" aria-hidden="true">${k === "bare" ? svg("door", 2) : ""}</div><p><b>${m.name}</b> · ${m.bonus}. <b>${m.gift}.</b> <span class="risk">Cost: ${m.risk}.</span>${m.seized ? `<br><span class="risk">When she takes the wheel · ${m.seized}.</span>` : ""}<br>Wear it when ${m.use.charAt(0).toLowerCase()}${m.use.slice(1)}</p></div>`)
    .join("");
  return overlay(
    `<div class="eyebrow">The Masks</div><div class="rules">
    <p>Rolls are 2d6 + a stat: 10+ clean, 7–9 at a cost. Your stats: <b>${stats}</b>. A Mask adds +1 to one of them, usually around 15 points on your odds. Each choice that rolls shows its odds with the Mask you're wearing.</p>
    ${rows}
    <p><b>Changing</b> is free at dawn (the first card of each day), then +1 Strain (+1 more at Hollow 2). Mid-day it's worth paying when the card in front of you rolls a stat another Mask raises and the roll matters. A new Mask starts its clock again: Nyx's third card and Eris's fourth count from when you put it on.</p>
    <p><b>Seizure.</b> Once a day, with Strain 4+ and another meter near its limit, a Mask can try to answer for you: Eris facing a wolf, Lilith when Longing is high, otherwise Nyx. A clean roll keeps you sovereign (usually +1 Gnosis); 7–9 it stirs (let it, or hold the wheel for 1 Favor); worse, it seizes you until nightfall unless you pay +2 Strain. A seized Mask plays by its own rules, above, and its own music.</p>
    <p><b>${LIGHT.name}.</b> ${LIGHT.gift}. <span class="risk">${LIGHT.risk}.</span></p></div>
    <div class="row"><button class="btn ghost" data-v="ok" type="button">Close</button></div>`,
    { dismiss: false }, // the finger lifting off a long press must not close it
  );
}

function gallery() {
  const row = ([k, e]) => (meta.endings[k] ? `<div><h4>${esc(e.title)} · ×${meta.endings[k]}</h4><p>${esc(e.line)}</p></div>` : `<div class="locked"><h4>? ? ?</h4><p>${esc(e.hint || "Not yet found.")}</p></div>`);
  const all = Object.entries(ENDINGS);
  const rows = all.filter(([, e]) => e.family !== "unmaking").map(row).join("") + `<div class="eyebrow">Ways Out · Exodus</div>` + all.filter(([, e]) => e.family === "unmaking").map(row).join("");
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
let incomingRoad = null;
function readChallenge() {
  const today = todayISO();
  incomingRoad = parseExodus(location.hash);
  incoming = parseChallenge(location.hash, today);
  // A friend already past midnight sent tomorrow's Vigil. It can't be played here yet, but it isn't dropped:
  // the home screen says when it opens, and their score waits for that Vigil's end screen.
  if (!incoming) {
    const early = parseChallenge(location.hash, tomorrowISO());
    if (early && early.date > today) incoming = { ...early, early: true };
  }
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
  $("btn-codex").onclick = codex;
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
    navigator.serviceWorker.register("sw.js").then(watchUpdates, () => {});
  }
}

// ---------- updates ----------
// A new release's worker installs in the background and then waits: sw.js doesn't skip waiting on its own, so the
// code and caches under a run never change. The home screen is the only place that offers "Update ready"; tapping it
// tells the waiting worker to take over (SKIP_WAITING), and the page reloads once it has. The waiting-worker pattern
// is workbox-window's (MIT, https://github.com/GoogleChrome/workbox); the code is ours.
let waitingWorker = null;
let updating = false;
function offerUpdate(worker) {
  waitingWorker = worker;
  const box = $("update");
  if (!worker) return void (box.innerHTML = "");
  box.innerHTML = `<button class="btn" id="b-update" type="button">Update ready</button><span class="sub">A new version is installed. Your run is saved; this reloads the game.</span>`;
  $("b-update").onclick = () => {
    if (updating) return;
    updating = true;
    $("b-update").disabled = true;
    // The new worker takes control and controllerchange reloads the page. If it already had (another tab took it), or
    // the message is lost, reload anyway: the page is on the home screen with nothing in flight.
    worker.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => location.reload(), 4000);
  };
}
function watchUpdates(reg) {
  // Only an update counts: the first-ever worker has no controller to replace and nothing waits for it.
  const check = () => reg.waiting && navigator.serviceWorker.controller && offerUpdate(reg.waiting);
  check();
  reg.addEventListener("updatefound", () => {
    const installing = reg.installing;
    if (installing) installing.addEventListener("statechange", () => installing.state === "installed" && check());
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => updating && location.reload());
  // A game left open for days finds out about a release when it is looked at again, at most every half hour.
  let lastLook = Date.now();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || Date.now() - lastLook < 30 * 60 * 1000) return;
    lastLook = Date.now();
    reg.update().catch(() => {});
  });
}
boot();
