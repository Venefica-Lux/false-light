// FALSE LIGHT — pure game engine. No DOM. Runs in the browser and under `node --test`.
// Rules are a compressed port of the public SIEGE edition (THE_POISONER_OF_FALSE_LIGHT.md):
// 2d6 + stat, four meters, the False Light, Masks, the Chains, UNTAGGABLE + GNOSIS.

import { CARDS, ENDINGS, SPARK_DAY, sparkDeck, heardDeck } from "./cards.js";
import {
  ARCANA, ARCANA_LIVE, SIGNS, SUITS, PLANETS, WEEK, arcOn, planetToday, reading, deal, fall, skyFor, readingCards, minorFx, courtOn, knightRoll, fxWords,
  cardTitle, cardLine,
} from "./arcana.js";
import {
  OCC_CARDS, OCC_TUNING, SPHERES, RITES, MEANS, ACCOUNTS, STONES, occOf, occDay, occSky, occStanding, occWeight, occRung, riteOn, shownTrack, sphereName,
  hourOf, corresponds, inVessel, isStone, looseRelics,
} from "./occult.js";
import {
  ASC_CARDS, ASC_ENDINGS, ENCOUNTERS, INTENTS, RELICS, ROADS, ACTS, VERBS, NAMES, NAMED_BY, COMPLY, ECHO, PAY, encBestRoad, chairEnding, nextNamed, relicPair, UNLOCKS, ORDER_ROADS,
  EDICTS, MAX_EDICT, edict, pullAt, relicCap, bareAt,
  temptation, witness, HEIRS, BOND_CARD, bondOffer,
} from "./ascension.js";
import { SYNERGIES, synergiesFor, synHost, limitKey, witnessBond, liftable } from "./synergy.js";
import { PREP_CARDS, hourOffer, spoilsOffer, prepHost, routeIntel } from "./prep.js";
import { RECIPES, RIT_LEVELS, RIT_CARDS, benchOffer, ritSee } from "./ritual.js";
import { BRD_CARDS, BRD_PLACES, BRD_PEOPLE, BRD_THREADS, brdOn, freshBrd, brdWeight, brdCall, brdEpilogue } from "./breadth.js";

// Exodus's endings join the gallery; its cards stay out of CARDS (see ascension.js).
Object.assign(ENDINGS, ASC_ENDINGS);
export { CARDS, ENDINGS, SPARK_DAY, sparkDeck, heardDeck, ASC_CARDS, ENCOUNTERS, INTENTS, RELICS, ROADS, ACTS, VERBS, UNLOCKS, EDICTS, MAX_EDICT, encBestRoad, chairEnding, nextNamed, witness, pullAt, bareAt, SYNERGIES, synergiesFor, BRD_CARDS, BRD_PLACES, BRD_PEOPLE, BRD_THREADS, brdEpilogue };

export const METERS = {
  mark: { max: 6, label: "Mark", hint: "The Warden's eye: how much they've noticed. At 6 you are Named." },
  strain: { max: 6, label: "Strain", hint: "The weight on the soul. At 6 you Fracture, unless 3 Favor takes the hit. Each night takes 1 off, 2 if you rested." },
  favor: { max: 6, label: "Favor", hint: "Coin, doors, allies. Empty at nightfall and you're Destitute." },
  hollow: { max: 4, label: "Hollow", hint: "The body's ledger. Each night without rest adds 1. From 2, every Strain cost is 1 higher. Full at nightfall and it closes." },
};
export const TRACK_MAX = { untag: 12, gnosis: 12 };
export const STATS = { steel: 2, wits: 1, shade: 0, freq: -1 };
export const STAT_LABEL = { steel: "Steel", wits: "Wits", shade: "Shade", freq: "Frequency", fortune: "Fortune" };
// bonus and risk are the short line under the Masks; gift is the Mask's own way of playing; seized is what it does
// when it takes the wheel (§9.5: the risk at full strength, the gift turned total); use is the guide's "wear it
// when"; theme is its music. Keep every line true to what applyFx, rollMods, cardCosts, the turn tick, the night
// and the Light actually do. In the Light no Mask answers: its bonus and gift go quiet, its cost doesn't.
export const MASKS = {
  bare: {
    name: "Bare Face", stat: null, bonus: "Hollow recovery ×2", risk: "+1 Strain when a wolf appears",
    gift: "Rest: a rested nightfall bare-faced clears 3 Strain, not 2",
    seized: null,
    use: "Hollow is climbing, or the night is quiet. No stat bonus, and wolves and the Geometry cost Strain. It's the road to Ordinary Time: meals and sleep count double. Its own cards trade a little Mark or Strain for Gnosis.",
  },
  nyx: {
    name: "Nyx", stat: "shade", bonus: "+1 Shade", risk: "Dissolution: +1 Strain every 3rd card",
    gift: "The Veil: the first Mark rise each day is 1 smaller",
    seized: "The Vanishing: Mark can't rise at all, and Dissolution comes every 2nd card",
    use: "Mark is climbing. Shade is hiding, slipping past, listening; it starts at 0. She takes the edge off the first look each day, and when she takes the wheel nothing sees you at all, at a price. Her cards take Mark off and build Untaggable.",
  },
  eris: {
    name: "Eris", stat: "steel", bonus: "+1 Steel", risk: "Isolation: Longing +1 on the 4th card",
    gift: "Severance: a Steel roll against a wolf moves Mark too: −1 on a clean hit, +1 on a miss",
    seized: "The Velvet Guillotine: Steel rolls at advantage, Frequency at disadvantage, and Isolation fires at once (Longing +1)",
    use: "Wolves are hunting. Steel is facing things down: your best stat and the most common roll. She wants the fight, and fights are loud both ways: a wolf beaten clean forgets you a little, a wolf that beats you tells the street. Her cards set wolves on each other, or throw a party that eases Strain and Longing.",
  },
  lilith: {
    name: "Lilith", stat: "freq", bonus: "+1 Frequency", risk: "Exposure: every Longing rise +1",
    gift: "Hunger: while Longing is 3 or more, every Gnosis rise is 1 bigger",
    seized: "The Eye Opens: Frequency rolls at advantage, every Longing rise +2, and the False Light finds you twice as easily",
    use: "You're after Gnosis. Frequency is reaching people; it starts at −1, your worst. She runs on wanting: with Longing at 3 or more every Gnosis is bigger, and Longing at 3 is also where the Light starts calling and a Mask can take the wheel. Her cards pay Gnosis and turn Strain into it. In the Light she cuts both ways: Communion clears 3 Strain, not 2, and the Reckoning adds 4, not 3.",
  },
};
// Lux Venefica: the sovereign union of Nyx, Eris, and Lilith (rules 5). Not a fifth chip on the bar, so MASKS
// stays at four keys; invoked once all three have answered (or via the Name), and fractured back into a seized
// Mask by the False Light or any choice that surrenders sovereignty (Cage).
export const VENEFICA = {
  name: "Lux Venefica",
  stat: "all",
  bonus: "+1 Shade, Steel & Frequency",
  risk: "Fractures into a seized Mask under the False Light or bondage",
  gift: "Sovereign Union: Veil softens the first Mark, immune to single-Mask Seizure, split penalties, and adversary counters",
  seized: null,
  use: "All three Masks have answered (or you claimed the Name). Unites Nyx, Eris and Lilith without split penalties. Taking the False Light or accepting bondage fractures the union into whichever Mask answers that pressure; reunify once free.",
};
export const maskOf = (k) => (k === "venefica" ? VENEFICA : MASKS[k]);
// The False Light, said the same way as a Mask in the guide: what it gives while it lasts, and what it bills.
export const LIGHT = {
  name: "The False Light",
  gift: "Communion: Hollow to 0, Strain down 2, Shade and Frequency at advantage, and every Favor rise doubled",
  risk: "Gilt: the doubled Favor is owed back at the Reckoning, and what you can't pay costs Mark +1. Gnosis can't rise, and your Mask's bonus and gift go quiet",
};
// A Mask answers outside the Light. Its cost answers everywhere.
const answers = (s) => s.communion === 0;
// Bonds: people who catch you once. Each one answers a single kind of ending, then is spent.
export const BONDS = {
  sister: { name: "The Sister", saves: "Mark", hint: "The Sister: once, when your Mark would reach 6, she hides you. Mark drops to 5." },
  sponsor: { name: "The Sponsor", saves: "Strain", hint: "The Sponsor: once, when your Strain would break you, she picks up at the fourth hour. Strain drops to 4." },
  table: { name: "The Open Table", saves: "nightfall", hint: "The Open Table: once, at a nightfall that would end you, bread and a bed. Favor 1 at least, Hollow 3 at most." },
};
export const CARDS_PER_DAY = 4;
export const LAUNCH_DAY = "2026-09-30";

// The Celestial Arcana's reading cards (arcana.js): forced only, never in any deck.
const ARC_CARDS = readingCards((k) => RELICS[k].name);
const ARC_IDS = new Set(ARC_CARDS.map((c) => c.id));
const OCC_IDS = new Set(OCC_CARDS.map((c) => c.id));
const BRD_IDS = new Set(BRD_CARDS.map((c) => c.id));
const BY_ID = Object.fromEntries([...CARDS, ...ASC_CARDS, ...ARC_CARDS, ...OCC_CARDS, ...RIT_CARDS, ...PREP_CARDS, ...BRD_CARDS, BOND_CARD].map((c) => [c.id, c]));
export const cardById = (id) => BY_ID[id];

// The Great Occult Expansion (occult.js), in a run that has it (s.asc.occ). Without it each reader below is exactly the
// Celestial Arcana's own, so a run without the expansion plays as before.
const occOn = (s) => !!(s.asc && s.asc.occ);
// The day's planet, its boon and its toll, after the Seven's gates.
export const skyToday = (s) => (occOn(s) ? occSky(s, planetToday(s)) : planetToday(s));
const boonFor = (s, p) => {
  const t = skyToday(s);
  return !!(t && t.p === p && t.boon);
};
const tollFor = (s, p) => {
  const t = skyToday(s);
  return !!(t && t.p === p && t.cost);
};
// The standing shapes (arcana.js minorFx): the Minor Arcana's, then the expansion's, in the same vocabulary.
const standing = (s) => (occOn(s) ? minorFx(s).concat(occStanding(s)) : minorFx(s));
const shaped = (s) => !!s.arc || occOn(s);

// ---------- seeded randomness (state-held, so a saved run resumes identically) ----------
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
export function rand(s) {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const d6 = (s) => 1 + Math.floor(rand(s) * 6);

export function vigilNumber(isoDate) {
  const ms = Date.parse(isoDate + "T00:00:00Z") - Date.parse(LAUNCH_DAY + "T00:00:00Z");
  return Math.floor(ms / 86400000) + 1;
}

// ---------- state ----------
// A fresh run's fields. migrate() fills any of these a saved run is missing, so a run saved by an older
// release resumes instead of failing on the first card that asks about a newer field.
const fresh = () => ({
  v: 1,
  mode: "endless",
  seedLabel: "endless",
  rng: 0,
  day: 1,
  bell: 0,
  mark: 1,
  strain: 2,
  favor: 3,
  hollow: 1,
  longing: 1,
  untag: 2,
  gnosis: 1,
  cage: 0,
  cageSeen: false,
  apo: 0,
  mask: "bare",
  maskAge: 0,
  maskLocked: false,
  seizedToday: false,
  veil: false,
  gilt: 0,
  restedToday: false,
  noRestDays: 0,
  communion: 0,
  reckoning: 0,
  tolerance: 0,
  cascade: false,
  bonds: [],
  spent: [],
  flags: {},
  recent: [],
  forced: [],
  tutorial: false,
  draws: 0,
  dayMarks: [],
  days: [],
  turns: 0,
  radiance: 0,
  ruin: 0,
  over: null,
  cardId: null,
  lastEvent: null,
});

// locked (Exodus only): what this player hasn't unsealed yet (ascension.js UNLOCKS). Fixed for the run, so the preview,
// a save and a resume all see the same map. Empty, the default, is everything open: exactly the road as before.
// edict (Exodus only): the Edicts in force, 0 to MAX_EDICT; 0, the default, is the road as before.
// prev (Exodus only): the last heretic's { n, by, won }. One who fell is among the Named. Names only, so a run with or
// without it plays the same cards with the same dice.
// arcana (default on): false plays Exodus, or a Vigil from SPARK_DAY, without the Celestial Arcana (tests and sims).
// occult (default on): false plays Exodus without the Great Occult Expansion (occult.js; tests and sims).
// depth: false plays the original road, 1 replays M3, 2 replays M4, 3 replays M5, and true or 4 starts the current rules
// (the Breadth Pass, breadth.js).
export function newGame({ seed = "endless", mode = "endless", tutorial = false, locked = [], edict: ed = 0, prev = null, arcana = true, occult = true, depth = true } = {}) {
  const s = Object.assign(fresh(), {
    mode,
    seedLabel: String(seed),
    rng: hashSeed(String(seed)),
    forced: tutorial ? ["t_dawn"] : [],
    tutorial: !!tutorial,
  });
  if (mode === "ascension") {
    s.asc = freshAsc();
    s.asc.locked = locked.filter((k) => UNLOCKS[k]);
    s.asc.edict = Math.max(0, Math.min(MAX_EDICT, Math.floor(+ed) || 0));
    if (prev && typeof prev.n === "string" && HEIRS.includes(prev.n)) s.asc.prev = { n: prev.n, by: String(prev.by || "Struck Off").slice(0, 40), won: !!prev.won };
    const h = hashSeed(s.seedLabel + ":self");
    const pool = HEIRS.filter((n) => !s.asc.prev || n !== s.asc.prev.n);
    s.asc.self = pool[h % pool.length];
    if (edict(s, 4)) s.favor -= 1; // The Tithe
    seedNamed(s);
    if (s.asc.prev && !s.asc.prev.won) s.asc.named[0] = { n: s.asc.prev.n, by: s.asc.prev.by, end: "named_clerk", st: "held", asked: false, heir: true };
    s.forced.push("a_prologue");
  }
  // The Celestial Arcana (arcana.js): Exodus reads three cards over its three movements; a Vigil from SPARK_DAY turns
  // one card for everyone keeping it. A run without s.arc (Endless, an earlier Vigil, a save from before) never has one.
  if (arcana && (mode === "ascension" || (mode === "vigil" && sparkDeck(s)))) {
    const sky = skyFor(s.seedLabel, mode);
    s.arc = { sign: sky.sign, wk: sky.wk, spread: deal(s.seedLabel, mode, sky.sign, mode === "vigil" ? 1 : 3), fool: 0, tower: false, devil: false, judged: false, death: false };
    s.forced.push(mode === "vigil" ? "r_vigil" : "r_omen");
  }
  if (mode === "ascension" && occult) s.asc.occ = freshOcc(s);
  // The Depth Pass (synergy.js): all its state lives under asc.syn, only on a run begun with it. seq numbers the fights.
  if (mode === "ascension" && occult && depth) s.asc.syn = { v: depth === 1 ? 1 : depth === 2 ? 2 : depth === 3 ? 3 : depth === 4 ? 4 : 5, seq: 0, used: {}, fired: {}, laid: null, ease: 0, witnessed: [], rit: { done: {}, seen: [], log: [] }, prep: { v: 1, hours: {}, ready: null, plus: {}, log: {}, spoils: 0 } };
  // The Breadth Pass (breadth.js): rules 4+. Its threads and people live under asc.brd.
  if (s.asc && s.asc.syn && s.asc.syn.v >= 4) s.asc.brd = freshBrd();
  // Lux Venefica (rules 5): the union of Nyx, Eris and Lilith under asc.uni.
  if (s.asc && s.asc.syn && s.asc.syn.v >= 5) s.asc.uni = freshUni();
  draw(s);
  return s;
}

// A card with build() is read through it, so the preview, the costs, the UI and the turn all see the same card.
export const currentCard = (s) => {
  const c = BY_ID[s.cardId];
  let b = c && c.build ? c.build(s) : c;
  // Strategic preparation (prep.js): the road cards carry the dossier on each keeper, only on a run with it.
  const intel = s.asc && b ? routeIntel(s, b) : null;
  if (intel) b = { ...b, intel };
  return s.asc && b ? encWrap(s, b) : b;
};

// Saved runs outlive releases. Missing or mistyped fields take a fresh run's value; nothing present is lost.
export function migrate(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return s;
  const base = fresh();
  for (const [k, v] of Object.entries(base)) {
    const have = s[k];
    if (have === undefined) s[k] = v;
    else if (Array.isArray(v) && !Array.isArray(have)) s[k] = v;
    else if (v && typeof v === "object" && !Array.isArray(v) && (!have || typeof have !== "object" || Array.isArray(have))) s[k] = v;
    else if (typeof v === "number" && !Number.isFinite(have)) s[k] = v;
  }
  if (!MASKS[s.mask] && s.mask !== "venefica") s.mask = "bare";
  if (s.stir && !MASKS[s.stir]) s.stir = null;
  s.bonds = s.bonds.filter((b) => BONDS[b]);
  s.spent = s.spent.filter((b) => BONDS[b]);
  if (s.mode === "ascension") migrateAsc(s);
  if ("arc" in s) migrateArc(s);
  if (s.asc && "occ" in s.asc) migrateOcc(s);
  if (s.asc && "syn" in s.asc) migrateSyn(s);
  if (s.asc && "brd" in s.asc) migrateBrd(s);
  if (s.asc && "uni" in s.asc) migrateUni(s);
  if (s.mask === "venefica" && !uniOn(s)) s.mask = "bare";
  if (s.asc) {
    const unavailable = (id) => {
      if (id === BOND_CARD.id) return !bondOffer(s);
      return (id === "d_hour" || id === "d_spoils") && !s.asc.syn?.prep;
    };
    s.forced = s.forced.filter((id) => !unavailable(id));
    if (!s.over && unavailable(s.cardId)) draw(s);
  }
  return s;
}
// The Breadth Pass's state (breadth.js): repaired where it can be, dropped alone where it can't (the run plays on
// without its threads), and never grafted onto a run that lacked it. It needs rules 4.
const BRD_KEYS = new Set(Object.keys(BRD_THREADS));
function migrateBrd(s) {
  const a = s.asc;
  const b = a.brd;
  if (!b || typeof b !== "object" || Array.isArray(b) || !(a.syn && a.syn.v >= 4)) {
    delete a.brd;
    if (BRD_IDS.has(s.cardId)) draw(s);
    return;
  }
  const rec = (o) => (o && typeof o === "object" && !Array.isArray(o) ? o : {});
  const draws = s.draws | 0;
  b.v = 1;
  b.t = Object.fromEntries(Object.entries(rec(b.t)).filter(([k, v]) => BRD_KEYS.has(k) && Number.isInteger(v) && v >= 0 && v <= draws));
  b.npc = Object.fromEntries(Object.entries(rec(b.npc)).filter(([k, v]) => Object.hasOwn(BRD_PEOPLE, k) && Number.isInteger(v) && v !== 0).map(([k, v]) => [k, Math.max(-2, Math.min(3, v))]));
}
const ACTIVE_MASKS = ["nyx", "eris", "lilith"];
const freshUni = () => ({ v: 1, worn: [], unlocked: false, early: false, ever: false, count: 0, fractures: 0, fracturedDay: 0, fracturedCage: 0, lastFracture: null });
export const uniOn = (s) => !!(s.asc && s.asc.syn && s.asc.syn.v >= 5 && s.asc.uni);
function migrateUni(s) {
  const a = s.asc;
  const u = a.uni;
  if (!u || typeof u !== "object" || Array.isArray(u) || !(a.syn && a.syn.v >= 5)) {
    delete a.uni;
    if (s.mask === "venefica") s.mask = "bare";
    return;
  }
  const num = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
  u.v = 1;
  u.worn = Array.isArray(u.worn) ? [...new Set(u.worn.filter((m) => ACTIVE_MASKS.includes(m)))] : [];
  u.early = u.early === true;
  u.unlocked = u.unlocked === true || ACTIVE_MASKS.every((m) => u.worn.includes(m));
  u.ever = u.ever === true;
  u.count = num(u.count);
  u.fractures = num(u.fractures);
  u.fracturedDay = num(u.fracturedDay);
  u.fracturedCage = Math.min(8, num(u.fracturedCage));
  const lf = u.lastFracture;
  u.lastFracture = lf && typeof lf === "object" && ACTIVE_MASKS.includes(lf.mask) && (lf.cause === "light" || lf.cause === "bondage")
    ? { mask: lf.mask, cause: lf.cause }
    : null;
}
// The Depth Pass's state (synergy.js): repaired where it can be, dropped where it can't (the run then plays on without
// synergies), and never grafted onto a run that didn't carry it. It needs the expansion it is part of.
function migrateSyn(s) {
  const a = s.asc;
  const y = a.syn;
  if (!y || typeof y !== "object" || Array.isArray(y) || !a.occ) {
    delete a.syn;
    s.forced = s.forced.filter((id) => id !== "o_bench");
    if (s.cardId === "o_bench") draw(s);
    return;
  }
  const rec = (o) => (o && typeof o === "object" && !Array.isArray(o) ? o : {});
  y.v = [2, 3, 4, 5].includes(y.v) ? y.v : 1;
  y.seq = Number.isInteger(y.seq) && y.seq >= 0 ? y.seq : 0;
  y.used = Object.fromEntries(Object.entries(rec(y.used)).filter(([, v]) => v === true || (Number.isInteger(v) && v > 0)));
  y.fired = Object.fromEntries(Object.entries(rec(y.fired)).filter(([k, v]) => SYNERGIES.some((x) => x.id === k) && Number.isInteger(v) && v > 0));
  if (y.laid !== "revelation") y.laid = null;
  y.ease = Number.isFinite(y.ease) ? Math.max(0, Math.min(2, Math.floor(y.ease))) : 0;
  y.witnessed = Array.isArray(y.witnessed) ? [...new Set(y.witnessed.filter((b) => typeof b === "string" && BONDS[b]))] : [];
  // The workbench's record (ritual.js): each recipe worked once, what was shown, and the last few workings.
  const known = (id) => RECIPES.some((r) => r.id === id);
  const r = rec(y.rit);
  y.rit = {
    done: Object.fromEntries(Object.entries(rec(r.done)).filter(([k, v]) => known(k) && RIT_LEVELS.includes(v))),
    seen: Array.isArray(r.seen) ? [...new Set(r.seen.filter((id) => typeof id === "string" && known(id)))] : [],
    log: (Array.isArray(r.log) ? r.log : [])
      .filter((x) => x && typeof x === "object" && known(x.id) && RIT_LEVELS.includes(x.res))
      .map((x) => ({ id: x.id, res: x.res, miss: Array.isArray(x.miss) ? x.miss.filter((m) => m === "hour" || m === "know") : [] }))
      .slice(-12),
  };
  // Strategic preparation (prep.js): its own state, dropped alone if malformed; never grafted onto a run that lacked it.
  if ("prep" in y) migratePrep(s);
  else s.forced = s.forced.filter((id) => id !== "d_hour" && id !== "d_spoils");
  const e = a.enc;
  if (e) {
    // A fight keeps its own id, and never has fewer than the run has numbered.
    if (!Number.isInteger(e.uid) || e.uid < 1) e.uid = ++y.seq;
    y.seq = Math.max(y.seq, e.uid);
    if (e.strike !== undefined) e.strike = Array.isArray(e.strike) ? [...new Set(e.strike.filter((k) => INTENTS[k]))] : [];
    if (e.cls !== undefined) e.cls = Object.fromEntries(Object.entries(rec(e.cls)).filter(([, v]) => Number.isFinite(v)));
    // A Read readied at a chapel (prep.js): a flag and the intent after next, repaired, never invented.
    if (e.read !== undefined) e.read = e.read === true;
    if (e.next2 !== undefined) e.next2 = typeof e.next2 === "string" && INTENTS[e.next2] ? e.next2 : null;
  }
}

function migratePrep(s) {
  const y = s.asc.syn;
  const p = y.prep;
  const rec = (o) => (o && typeof o === "object" && !Array.isArray(o) ? o : null);
  if (!rec(p) || !rec(p.hours) || !rec(p.plus) || !rec(p.log) || (p.ready !== null && !rec(p.ready))) {
    delete y.prep;
    s.forced = s.forced.filter((id) => id !== "d_hour" && id !== "d_spoils");
    if (s.cardId === "d_hour" || s.cardId === "d_spoils") draw(s);
    return;
  }
  p.v = 1;
  p.hours = Object.fromEntries(Object.entries(p.hours).filter(([k, v]) => (k === "1" || k === "2") && v === true));
  p.plus = Object.fromEntries(Object.entries(p.plus).filter(([k, v]) => RELICS[k] && v === 1));
  p.spoils = Number.isInteger(p.spoils) && p.spoils > 0 ? Math.min(p.spoils, 2) : 0;
  p.log = Object.fromEntries(
    Object.entries(p.log)
      .filter(([k, v]) => ENCOUNTERS[k] && rec(v))
      .map(([k, v]) => [k, { did: v.did === "strike" || v.did === "read" ? v.did : null, won: v.won === true }]),
  );
  const r = p.ready;
  if (r) {
    const ok = typeof r.enc === "string" && ENCOUNTERS[r.enc] && (r.kind === "strike" || r.kind === "read");
    p.ready = ok ? { enc: r.enc, kind: r.kind, strike: Array.isArray(r.strike) ? [...new Set(r.strike.filter((k) => INTENTS[k]))] : [] } : null;
  }
}

// ---------- dice ----------
function rollMods(s, roll) {
  const stat = roll.stat || "fortune";
  let mod = stat === "fortune" ? 0 : STATS[stat];
  const m = maskOf(s.mask);
  if (m && m.stat && (m.stat === stat || (m.stat === "all" && (stat === "shade" || stat === "steel" || stat === "freq"))) && answers(s)) mod += 1;
  mod += roll.mod || 0;
  // Yellow: one Position worse. Strength upright holds it off; reversed, it comes a Strain sooner.
  const strength = s.arc ? arcOn(s, "strength") : null;
  if (s.strain >= (strength === "rev" ? 4 : 5) && stat !== "fortune" && strength !== "up") mod -= 1;
  let adv = roll.adv ? 1 : 0;
  let dis = roll.dis ? 1 : 0;
  if (s.communion > 0 && (stat === "shade" || stat === "freq")) adv++;
  if (s.hollow >= 3) dis++;
  if (s.reckoning > 0 && stat === "wits") dis++;
  // A seized Mask (§9.5): Eris swings the Blade and can't reach anyone; the Eye opens.
  if (s.maskLocked && s.mask === "eris") {
    if (stat === "steel" && answers(s)) adv++;
    if (stat === "freq") dis++;
  }
  if (s.maskLocked && s.mask === "lilith" && stat === "freq" && answers(s)) adv++;
  if (s.asc) {
    // Exodus: what an adversary did to you (a Mask it came prepared for, a classification, your route on its
    // desk), and the Mirror of Sophia.
    const e = s.asc.enc;
    if (e && stat !== "fortune") {
      mod += (e.mods && e.mods[stat]) || 0;
      if (e.pattern === stat && e.patternAt === e.turn) dis++;
    }
    if (s.asc.armed === "glass" || s.asc.armed === "clearglass") adv++;
    if (s.asc.armed === "clearglass") mod += 1; // the Clear Glass, a Stone (occult.js)
  }
  if (s.arc) {
    // The day's sphere (arcana.js): its boon lifts the roll the Mask that answers to it lifts; the Sun's, a Hold.
    const t = skyToday(s);
    if (t && t.boon && PLANETS[t.p].stat === stat) mod += 1;
    if (roll.light && boonFor(s, "sun")) mod += 1;
    // The Moon, on each day's last card (not in a fight, which holds the Bell): the dark is yours, or it lies.
    const moon = s.bell === CARDS_PER_DAY - 1 && !(s.asc && s.asc.enc) ? arcOn(s, "moon") : null;
    if (moon === "up" && (stat === "shade" || stat === "freq")) mod += 1;
    if (moon === "rev" && stat !== "fortune") mod -= 1;
    if (roll.light && arcOn(s, "sun") === "rev") mod -= 1;
    const wheel = stat === "fortune" ? arcOn(s, "wheel") : null;
    if (wheel === "up") adv++;
    if (wheel === "rev") dis++;
    // A Knight rides for the Mask you wear (advantage, or disadvantage reversed).
    const knight = answers(s) ? courtOn(s, "knight", s.mask) : null;
    if (knight && knightRoll(s.mask) === stat) knight === "up" ? adv++ : dis++;
  }
  // The standing shapes: a pip (or what the expansion holds) shifts a roll.
  if (shaped(s)) for (const d of standing(s)) if (d.t === "roll" && (d.stat === "light" ? roll.light : d.stat === stat)) mod += d.d;
  // The Unsaid (occult.js): the Contradiction Seat favors one who holds neither story.
  if (roll.seat && occOn(s) && s.asc.occ.account === "unsaid") mod += 1;
  let dice = 2;
  if (roll.light) {
    // The Warden's Whisper: Hollow 3+ and the Light in the scene → 1d6 only.
    if (s.hollow >= 3) {
      dice = 1;
      dis--;
    } else dis++;
    if (s.flags.ward) mod += 1;
    if (s.flags.token) mod += 1; // the white token from the Lantern Rooms
  }
  const net = Math.max(-1, Math.min(1, adv - dis));
  return { stat, mod, net, dice };
}

function tierOf(total, kept, dice) {
  if (dice === 2 && kept[0] + kept[1] === 12) return "radiance";
  if (dice === 2 && kept[0] + kept[1] === 2) return "ruin";
  if (total >= 10) return "hit";
  if (total >= 7) return "mid";
  return "miss";
}

// The Severed Crown, laid on a card: nothing on it can miss. A 6− or a Ruin counts as 7–9.
const crowned = (s, t) => (s.asc && s.asc.armed === "crown" && (t === "miss" || t === "ruin") ? "mid" : t);
// The Fool (arcana.js): the first roll that would miss (upright) or hit (reversed) lands as a 7–9 instead, once a day
// in the Vigil and once a movement in Exodus (foolAt: the day, or 100 + the act).
const foolAt = (s) => (s.asc ? 100 + s.asc.act : s.day);
function fated(s, t) {
  const f = s.arc && s.arc.fool !== foolAt(s) ? arcOn(s, "fool") : null;
  if (f === "up" && (t === "miss" || t === "ruin")) return "mid";
  if (f === "rev" && (t === "hit" || t === "radiance")) return "mid";
  return t;
}
// The Crown Taken (occult.js RITES): once a movement a miss lands as 7–9 (crowned: the movement it was spent in, as foolAt).
const crownHolds = (s, t) => (riteOn(s, "crown") && s.asc.occ.crowned !== foolAt(s) && (t === "miss" || t === "ruin") ? "mid" : t);
// Gnosis can't rise from the Pull 5 (§10.4); holding the Crown Taken, from 4.
const gnosisCap = (s) => (riteOn(s, "crown") ? 4 : 5);

export function rollDice(s, roll) {
  const { stat, mod, net, dice } = rollMods(s, roll);
  const n = dice === 1 ? 1 : net === 0 ? 2 : 3;
  const raw = Array.from({ length: n }, () => d6(s));
  let kept = raw.slice();
  if (n === 3) {
    const sorted = raw.slice().sort((a, b) => a - b);
    kept = net > 0 ? sorted.slice(1) : sorted.slice(0, 2);
  }
  const total = kept.reduce((a, b) => a + b, 0) + mod;
  const was = crowned(s, tierOf(total, kept, dice));
  let tier = fated(s, was);
  if (tier !== was) s.arc.fool = foolAt(s);
  const held = roll.activation ? tier : crownHolds(s, tier);
  if (held !== tier) (s.asc.occ.crowned = foolAt(s)), (tier = held);
  return { stat, mod, net, dice: raw, kept, total, tier, fated: tier !== was || undefined };
}

// Exact outcome odds for the preview — enumerates every die face.
export function odds(s, roll) {
  const { mod, net, dice } = rollMods(s, roll);
  const n = dice === 1 ? 1 : net === 0 ? 2 : 3;
  const out = { hit: 0, mid: 0, miss: 0, radiance: 0, ruin: 0 };
  let count = 0;
  const walk = (acc) => {
    if (acc.length === n) {
      let kept = acc.slice();
      if (n === 3) {
        const sorted = acc.slice().sort((a, b) => a - b);
        kept = net > 0 ? sorted.slice(1) : sorted.slice(0, 2);
      }
      const t = crownHolds(s, fated(s, crowned(s, tierOf(kept.reduce((a, b) => a + b, 0) + mod, kept, dice))));
      out[t === "radiance" ? "hit" : t === "ruin" ? "miss" : t]++;
      if (t === "radiance" || t === "ruin") out[t]++;
      count++;
      return;
    }
    for (let f = 1; f <= 6; f++) walk([...acc, f]);
  };
  walk([]);
  return { hit: out.hit / count, mid: out.mid / count, miss: out.miss / count, radiance: out.radiance / count, ruin: out.ruin / count, mod, net, dice };
}

// ---------- effects ----------
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// The Minor Arcana's rise and fall shapes: a track's rises (or falls) 1 bigger, or those of 2 or more 1 smaller.
function shifted(s, k, v) {
  for (const d of standing(s)) {
    if (d.k !== k || (d.t === "rise" ? v <= 0 : d.t === "fall" ? v >= 0 : true)) continue;
    if (d.t === "rise" || d.t === "fall") v += Math.sign(v) * Math.sign(d.d) * (Math.abs(v) >= (d.d < 0 || d.big ? 2 : 1) ? 1 : 0);
  }
  return v;
}

function applyFx(s, fx, notes) {
  const delta = {};
  const bump = (k, v, hi) => {
    const before = s[k];
    s[k] = clamp(s[k] + v, 0, hi);
    if (s[k] !== before) delta[k] = (delta[k] || 0) + (s[k] - before);
  };
  for (const [k, raw] of Object.entries(fx || {})) {
    let v = raw;
    if (shaped(s) && typeof v === "number") v = shifted(s, k, v);
    switch (k) {
      case "strain":
        if (v >= 2 && s.arc) v += arcOn(s, "temperance") === "up" ? -1 : arcOn(s, "temperance") === "rev" ? 1 : 0;
        if (v > 0 && s.hollow >= 2) v += 1; // Hollow 2: all Strain costs +1
        bump("strain", v, 6);
        break;
      case "hollow": {
        const empress = v < 0 && s.arc ? arcOn(s, "empress") : null;
        if (empress === "up") v -= 1; // the Empress: the body is fed
        if (v < 0 && s.mask === "bare" && answers(s)) v *= 2; // Bare Face: recovery doubled
        const was = s.hollow;
        bump("hollow", v, 4);
        // Death reversed: Hollow can't fall below 1 (§19.1, the body remembers).
        if (s.arc && arcOn(s, "death") === "rev" && s.hollow < 1 && was >= 1) delta.hollow = (delta.hollow || 0) + (1 - s.hollow), (s.hollow = 1);
        if (empress === "rev" && s.hollow < was) bump("cage", 1, 8);
        break;
      }
      case "mark":
        if (v < 0 && s.arc) v = Math.min(0, v + (arcOn(s, "justice") === "up" ? -1 : arcOn(s, "justice") === "rev" ? 1 : 0));
        if (v >= 2 && s.arc && arcOn(s, "hierophant") === "rev") v += 1;
        if (v > 0 && (s.mask === "nyx" || s.mask === "venefica") && answers(s)) {
          if (s.maskLocked && s.mask === "nyx") {
            notes.push("The Vanishing: nothing sees you. Mark holds.");
            break;
          }
          const king = s.arc ? courtOn(s, "king", "nyx") : null; // the King holds the gift: two looks, or none
          if (king !== "rev" && (!s.veil || (king === "up" && !s.flags.veil2))) {
            // The Veil takes the day's first look.
            const second = !!s.veil;
            if (second) s.flags.veil2 = true;
            s.veil = true;
            v -= 1;
            notes.push(second ? "The Veil takes a second look today: Mark 1 less." : "The Veil takes the first look today: Mark 1 less.");
          }
        }
        bump("mark", v, 6);
        break;
      case "favor":
        if (v > 0 && boonFor(s, "jupiter")) v += 1; // Jupiter's largesse
        if (v > 0 && s.communion > 0) {
          // Everything is gold. It's on credit: only the doubled part is owed, and only what actually landed.
          const was = s.favor;
          bump("favor", v * 2, favorMax(s));
          const extra = Math.max(0, s.favor - was - v);
          if (extra) {
            s.gilt = (s.gilt || 0) + extra;
            notes.push(`Gilt: Favor doubled. ${s.gilt} owed at the Reckoning.`);
          }
          break;
        }
        bump("favor", v, favorMax(s));
        break;
      case "longing":
        if (v > 0 && s.mask === "lilith") {
          const queen = s.arc ? courtOn(s, "queen", "lilith") : null; // the Queen holds the risk
          v += queen === "up" ? (s.maskLocked ? 1 : 0) : queen === "rev" ? (s.maskLocked ? 3 : 2) : s.maskLocked ? 2 : 1;
        }
        if (v > 0 && tollFor(s, "venus")) v += 1;
        if (v < 0 && s.arc && arcOn(s, "lovers") === "up") v -= 1;
        {
          const was = s.longing;
          bump("longing", v, 4);
          if (s.longing > was && s.arc && arcOn(s, "lovers") === "rev") bump("cage", 1, 8);
        }
        break;
      case "untag":
        bump("untag", v, 12);
        break;
      case "gnosis":
        // §10.5: Gnosis is remembering you were never theirs. The Light is their radiance, so it can't grow there.
        if (v > 0 && s.communion > 0) {
          notes.push("In the Light, Gnosis can't rise. It only feels like it.");
          break;
        }
        if (v > 0 && s.apo >= gnosisCap(s)) {
          notes.push("Gnosis cannot rise. You have made yourself your own highest law.");
          break;
        }
        if (v >= 2 && s.arc) v += arcOn(s, "hierophant") === "up" ? -1 : arcOn(s, "hierophant") === "rev" ? 1 : 0;
        if (v > 0 && s.mask === "lilith" && s.longing >= (s.arc ? { up: 2, rev: 4 }[courtOn(s, "king", "lilith")] || 3 : 3) && answers(s)) {
          v += 1;
          notes.push("Lilith's hunger: Gnosis +1 more.");
        }
        bump("gnosis", v, 12);
        break;
      case "cage":
        if (v >= 2 && s.arc && arcOn(s, "hierophant") === "up") v -= 1;
        bump("cage", v, 8);
        break;
      case "apo":
        // Jupiter's grandeur, and the Emperor upright: the throne calls.
        if (v > 0 && s.arc) v += (tollFor(s, "jupiter") ? 1 : 0) + (arcOn(s, "emperor") === "up" ? 1 : 0);
        s.apo = clamp(s.apo + v, 0, 6);
        break;
      case "arc":
        arcFx(s, v, notes);
        break;
      case "rest":
        s.restedToday = true;
        break;
      case "reveal":
        if (!s.cageSeen) notes.push("The Cage is visible now.");
        s.cageSeen = true;
        break;
      case "commune":
        // The Fast (occult.js RITES): the Light can't find you, whichever card offers it.
        if (riteOn(s, "fast")) notes.push("The Fast: the Light can't find you.");
        else commune(s, notes);
        break;
      case "reckon":
        reckon(s, delta, notes);
        break;
      case "set":
        if (v.house && !s.flags.house) notes.push("A room at the House. It counts toward Ordinary Time.");
        Object.assign(s.flags, v);
        if (v.name && uniOn(s) && !s.asc.uni.unlocked) {
          s.asc.uni.unlocked = true;
          s.asc.uni.early = true;
          notes.push("You took the Name: Nyx, Eris and Lilith can unify as Lux Venefica now.");
        }
        break;
      case "unset":
        for (const f of [].concat(v)) {
          if (f === "house" && s.flags.house) notes.push("The room at the House is gone.");
          delete s.flags[f];
        }
        break;
      case "bond":
        if (BONDS[v] && !s.bonds.includes(v) && !(s.spent || []).includes(v)) {
          s.bonds.push(v);
          const what = BONDS[v].hint.split(": ")[1];
          notes.push(`Bond: ${BONDS[v].name}. ${what.charAt(0).toUpperCase()}${what.slice(1)}`);
        }
        break;
      case "then":
        s.forced.push(...[].concat(v));
        break;
      case "end":
        s.over = s.over || v;
        break;
      default:
        // Exodus's keys (ascension.js). In an Endless run or a Vigil no card carries them.
        if (s.asc) ascFx(s, k, v, notes);
    }
  }
  if (s.asc && delta.favor > 0) tolerated(s, delta.favor, notes);
  return delta;
}

// The reading's one choice (arcana.js readingCards): the card being read is accepted as it lies, turned over, laid
// under a sky turned one sign by a relic laid down, or struck by the Contradiction Seat. Accepting is what makes a
// card count: its effects run from then to the end of the run, and its "open" effects land now.
function arcFx(s, v, notes) {
  const a = s.arc;
  const c = a && reading(s);
  if (!c) return;
  if (v === "sky") {
    // Never the relic in the vessel (occult.js): without the expansion, the first you carry.
    const r = s.asc && looseRelics(s)[0];
    if (r) (s.asc.relics = s.asc.relics.filter((x) => x !== r)), delete s.asc.charges[r], notes.push(`You lay down ${RELICS[r].name}. It's gone.`);
    a.sign = (a.sign + 1) % 12;
    // A card a relic turned by correspondence (occult.js) stays as it was turned, as one its own movement raised does.
    for (const x of a.spread) if (x.st === "down" && !x.cor) Object.assign(x, fall(x.id, x.fell, a.sign, !!x.own));
    notes.push(`The sky turns to ${SIGNS[a.sign].name}.`);
    v = "accept";
  }
  if (v === "strike") {
    c.st = "struck";
    notes.push(`${ARCANA[c.id].name} is struck from the reading.`);
    return;
  }
  if (v === "turn") c.rev = !c.rev;
  c.st = "up";
  notes.push(`${cardTitle(c)}: ${cardLine(c)}`);
  const k = ARCANA[c.id];
  const open = k.open && k.open[c.rev ? "rev" : "up"];
  if (open) {
    const { relics, reveal, ...fx } = open;
    if (relics && s.asc) for (const r of s.asc.relics) s.asc.charges[r] = Math.max(0, (s.asc.charges[r] || 0) + relics);
    if (reveal) applyFx(s, { reveal: true }, notes);
    if (reveal && s.asc) s.asc.apoSeen = true;
    applyFx(s, fx, notes);
  }
  if (c.id === "tower") a.tower = true; // laid on the next adversary's clock
  if (c.id === "judgement") a.judged = true; // and on the next adversary's people road
  if (c.id === "devil" && c.rev) a.devil = true; // the next Chain you give in to
}

function commune(s, notes) {
  const tolerant = s.tolerance >= 2;
  s.tolerance++;
  s.hollow = tolerant ? Math.min(s.hollow, 1) : 0;
  if (s.arc && arcOn(s, "death") === "rev") s.hollow = Math.max(s.hollow, 1); // Death reversed: never below 1
  // The Sun upright: the gift is real (1 more Strain cleared), and so is the bill (the Reckoning, 1 harder).
  s.strain = clamp(s.strain - (tolerant ? 1 : s.mask === "lilith" ? 3 : 2) - (s.arc && arcOn(s, "sun") === "up" ? 1 : 0), 0, 6);
  s.communion = tolerant ? 3 : 4;
  s.longingHeld = s.longing;
  if (s.asc) s.asc.hist.light++;
  s.dayMarks.push("light");
  notes.push(tolerant ? "Communion — thinner than last time. Tolerance." : "Communion. Everything is gold.");
}

function reckon(s, delta, notes) {
  const tolerant = s.tolerance >= 3;
  const before = { hollow: s.hollow, strain: s.strain, mark: s.mark, longing: s.longing, favor: s.favor };
  s.hollow = tolerant ? 4 : 3;
  s.strain = clamp(s.strain + (tolerant || s.mask === "lilith" ? 4 : 3) + (s.arc && arcOn(s, "sun") === "up" ? 1 : 0), 0, 6);
  s.longing = clamp(s.longing + 1, 0, 4);
  s.reckoning = 4;
  notes.push("The Reckoning. Every gift reverses, with interest.");
  // Mark goes through applyFx: the Light is over, so a worn Mask answers again (Nyx's Veil, her Vanishing).
  applyFx(s, { mark: 1 }, notes);
  if (s.gilt > 0) {
    // The gold was borrowed. What the purse can't cover, they take in attention.
    const paid = Math.min(s.favor, s.gilt);
    s.favor -= paid;
    if (paid < s.gilt) applyFx(s, { mark: 1 }, notes);
    notes.push(paid < s.gilt ? `The gilt comes due: ${s.gilt} Favor owed, ${paid} paid. They come to collect the rest: Mark +1.` : `The gilt comes due: Favor −${paid}.`);
    s.gilt = 0;
  }
  for (const k of Object.keys(before)) if (s[k] !== before[k]) delta[k] = (delta[k] || 0) + s[k] - before[k];
}

// ---------- preview ----------
// What a swipe will actually do, found by playing it out on a copy of the run: every outcome of the
// roll, plus everything the choice drags along (Mask risks, the Hollow tax, nightfall, a Fracture
// absorbed). Direction stays hidden, as in the source game; *which* meters move, and whether any
// outcome ends the run, is never hidden. The unseen Cage is only ever reported as a nameless danger.
const OUTCOMES = ["radiance", "hit", "mid", "miss", "ruin"];
const TRACKED = ["mark", "strain", "favor", "hollow", "longing", "untag", "gnosis", "cage"];
// In the long road's last act the Pull (Apotheosis) is shown, so its moves are reported and lit like any track.
const TRACKED_APO = [...TRACKED, "apo"];
const tracked = (s) => (s.asc && s.asc.apoSeen ? TRACKED_APO : TRACKED);
const copy = (s) => JSON.parse(JSON.stringify(s));

export function preview(s, side) {
  const card = currentCard(s);
  const ch = card[side];
  const runs = [];
  let roll = null;
  if (ch.roll) {
    const o = odds(s, ch.roll);
    roll = { stat: ch.roll.stat || "fortune", ...o };
    const p = { radiance: o.radiance, hit: o.hit - o.radiance, mid: o.mid, miss: o.miss - o.ruin, ruin: o.ruin };
    for (const t of OUTCOMES) if (p[t] > 1e-9) runs.push({ p: p[t], res: choose(copy(s), side, { tier: t }) });
  } else runs.push({ p: 1, res: choose(copy(s), side) });
  const touched = new Set();
  let lethal = 0, crown = 0, kept = 0, fracP = 0;
  const endings = new Set();
  const wins = new Set();
  const keeps = new Set();
  const fracMasks = new Set();
  const fracCauses = new Set();
  const bonds = {};
  for (const r of runs) {
    for (const [k, v] of Object.entries(r.res.delta)) if (v) touched.add(k);
    for (const b of r.res.spent || []) bonds[b] = (bonds[b] || 0) + r.p;
    if (r.res.fractured) {
      fracP += r.p;
      fracMasks.add(r.res.fractured.mask);
      fracCauses.add(r.res.fractured.cause);
    }
    if (!r.res.ending) continue;
    if (ENDINGS[r.res.ending].win) (crown += r.p), wins.add(r.res.ending);
    else if (s.asc && ENDINGS[r.res.ending].kept) (kept += r.p), keeps.add(r.res.ending);
    else {
      lethal += r.p;
      endings.add(r.res.ending);
    }
  }
  const shown = (k) => (k === "cage" ? s.cageSeen : k === "apo" ? !!(s.asc && s.asc.apoSeen) : true);
  const out = {
    label: ch.label,
    meters: [...touched].filter((k) => k in METERS),
    tracks: [...touched].filter((k) => !(k in METERS) && shown(k)),
    roll,
    lethal: lethal > 1e-9 ? { p: Math.min(1, lethal), endings: [...endings] } : null,
    crown: crown > 1e-9 ? { p: Math.min(1, crown), endings: [...wins] } : null,
    bonds: Object.entries(bonds).map(([k, p]) => ({ k, p: Math.min(1, p) })),
  };
  if (s.asc) {
    // A "kept" ending (By Decree) is neither a death nor a win: the run ends seated.
    out.kept = kept > 1e-9 ? { p: Math.min(1, kept), endings: [...keeps] } : null;
    if (uniOn(s)) out.fracture = fracP > 1e-9 ? { p: Math.min(1, fracP), masks: [...fracMasks], causes: [...fracCauses] } : null;
    out.enc = encPreview(s, side, ch, runs);
  }
  return out;
}

// In a fight: the choice's verb, whether it answers the intent, which of the adversary's tracks it moves (never
// which way), and the odds it ends the encounter. Played out on the same copies as everything else.
function encPreview(s, side, ch, runs) {
  const e = s.asc.enc;
  if (!e || currentCard(s).enc !== e.id) return null;
  const it = e.intent && INTENTS[e.intent];
  let clock = false;
  let p = 0;
  const roads = new Set();
  const outs = new Set();
  for (const r of runs) {
    const x = r.res.enc;
    if (!x) continue;
    if (x.clock) clock = true;
    for (const k of Object.keys(x.roads)) roads.add(k);
    if (x.resolved) (p += r.p), outs.add(x.resolved);
  }
  return {
    verb: ch.verb || null,
    answers: !!(it && ch.verb && it.by.includes(ch.verb)),
    clock,
    roads: [...roads],
    resolves: p > 1e-9 ? { p: Math.min(1, p), outcomes: [...outs] } : null,
    sealed: e.sealed === side,
    refuses: runs.some((r) => r.res.enc && r.res.enc.refused),
  };
}

// Costs the current card carries whatever you choose, and what's about to happen — said before you swipe.
export function cardCosts(s) {
  const c = currentCard(s);
  const out = [];
  if (!c || c.tutorial || c.id === BOND_CARD.id || s.over) return out;
  const tax = s.hollow >= 2 ? 1 : 0;
  // short: the same fact when the line under the card has to hold more than one.
  if (s.mask === "bare" && c.tier >= 2 && wolfStrain(s, c.tier)) out.push({ id: "wolf", text: `Bare-faced before a wolf: +${wolfStrain(s, c.tier) + tax} Strain either way`, short: `Wolf, bare-faced: +${wolfStrain(s, c.tier) + tax} Strain` });
  if (s.mask === "nyx" && (s.maskAge + 1) % nyxPeriod(s) === 0) out.push({ id: "nyx", text: `Nyx dissolves you: +${1 + tax} Strain this card`, short: `Nyx: +${1 + tax} Strain` });
  if (s.mask === "eris" && erisFires(s, s.maskAge + 1)) out.push({ id: "eris", text: "Eris isolates you: Longing +1 this card", short: "Eris: Longing +1" });
  if (s.communion === 1 && c.id !== "whisper" && c.id !== "reckoning") {
    out.push(s.gilt > 0
      ? { id: "fading", text: `The Light is fading. The Reckoning comes next, and ${s.gilt} gilt Favor with it`, short: `Reckoning next · gilt ${s.gilt}` }
      : { id: "fading", text: "The Light is fading. The Reckoning comes next", short: "Reckoning next" });
  }
  if (s.bell === CARDS_PER_DAY - 1 && !s.restedToday && !(s.asc && s.asc.enc) && !c.dusk) out.push({ id: "night", text: "Nightfall after this card: Hollow +1, no rest today", short: "Nightfall: Hollow +1" });
  if (s.asc) out.push(...ascCosts(s, c, tax));
  return out;
}

// The long road's own lines under the card: a seal, a Reckoning that will land inside the fight, the Cascade feeding
// a Cage you can see, a way out offered at a near-full clock, and what the chair would give you.
function ascCosts(s, c, tax) {
  const out = [];
  const a = s.asc;
  const e = a.enc;
  if (e && c.enc === e.id) {
    const def = ENCOUNTERS[e.id];
    if (e.sealed) {
      const side = e.sealed === "left" ? "◀" : "▶";
      if (synergiesFor(s, "seal").length) out.push({ id: "seal", text: `Sealed ${side}: answering that side costs the clock −1, Strain +${1 + tax}, Longing +1 (the Velvet Intervention)`, short: `Sealed ${side}: Strain +${1 + tax}, Longing +1` });
      else out.push({ id: "seal", text: `Sealed ${e.sealed === "left" ? "◀" : "▶"}: answering that side costs +${2 + tax} Strain`, short: `Sealed ${e.sealed === "left" ? "◀" : "▶"}: +${2 + tax} Strain` });
    }
    const left = def.cap - e.turn;
    if (s.communion > 0 && s.communion <= left && c.id !== "whisper") out.push({ id: "reckon", text: `The Reckoning lands inside this fight, in ${s.communion} card${s.communion === 1 ? "" : "s"}`, short: `Reckoning in ${s.communion}` });
    const clockName = def.clock.hidden && !s.cageSeen ? "Something" : def.clock.label;
    if (!c.forcedOnly && !c.final && e.id !== "trap" && encClock(s) >= def.clock.max - 2 && ["left", "right"].some((k) => c[k].verb === "flee")) out.push({ id: "out", text: `${clockName} two from full: a way out is offered`, short: "Disengage offered" });
    if (riteOn(s, "named") && ["left", "right"].some((k) => c[k].verb === "flee")) out.push({ id: "vow", text: "Your vow to the Named: disengaging costs Strain +2 (never the sixth)", short: "Vow: Disengage +2 Strain" });
  }
  // The Bell is held through a fight; its night falls on the card that ends it.
  if (e && e.id !== "trap" && (c.stop || (c.final && c.enc === e.id))) out.push({ id: "night", text: "The fight ends on this card, and its night falls", short: "Night after this card" });
  if (s.cascade && s.cage >= 3 && s.cageSeen) out.push({ id: "cascade", text: "The Cascade: the Cage +1 every card", short: "Cascade: Cage +1" });
  // The Oldest Trap's rungs price the Pull; what it buys at the gate and the chair is said before you pay it.
  if (e && e.id === "trap" && c.enc === "trap" && c.id !== "a_gate" && c.id !== "a_chair")
    out.push(a.freed >= 1
      ? { id: "gate", text: `Ahead, the gate holds for the Named only at the Pull ${pullAt(s, 1)} or less (now ${s.apo})`, short: `Gate: Pull ≤${pullAt(s, 1)}, now ${s.apo}` }
      : { id: "gate", text: `Ahead, the Return asks the Pull ${pullAt(s, 1)} or less (now ${s.apo})`, short: `Return: Pull ≤${pullAt(s, 1)}, now ${s.apo}` });
  if (c.stop && e && e.done) {
    const t = synergiesFor(s, "stop", { finish: false })[0];
    if (t) out.push({ id: "throne", text: `Stopping here: the Pull −1, a Halo use, the next fight a step slower (${t.name}). Finishing: the Pull +1 more`, short: "Stop: Pull −1, Halo use" });
    else if (synergiesFor(s, "stop", { finish: true }).length) out.push({ id: "throne", text: "Halo and Crown carried: finishing is the Pull +1 more (The Empty Throne)", short: "Finish: Pull +1 more" });
  }
  if (c.id === "a_gate") {
    const end = chairEnding(s);
    out.push({ id: "chair", text: `Ahead, the chair: ${end ? ENDINGS[end].title : "nothing earned yet but the walk away"}`, short: `Chair: ${end ? ENDINGS[end].title : "walk away"}` });
  }
  if (c.id === "a_chair" && !chairEnding(s)) out.push({ id: "chair", text: `The Return asks Gnosis 9, the Pull ${pullAt(s, 1)} or less, and someone beside you`, short: `Return: Gnosis 9, Pull ≤${pullAt(s, 1)}, a witness` });
  return out;
}

// Dissolution: every 3rd card worn; every 2nd while Nyx holds the wheel.
// The bare-faced wolf's Strain, and whether Eris's Isolation falls on the card at this age: the Queens hold both.
const wolfStrain = (s, tier) => ({ up: tier === 2 ? 0 : 1, rev: 2 }[s.arc ? courtOn(s, "queen", "bare") : null] ?? 1);
const erisFires = (s, age) => {
  const queen = s.arc ? courtOn(s, "queen", "eris") : null;
  return !s.maskLocked && (queen === "rev" ? age % 4 === 0 : queen !== "up" && age === 4);
};
const nyxPeriod = (s) => Math.max(2, (s.maskLocked ? 2 : 3) + ({ up: 1, rev: -1 }[s.arc ? courtOn(s, "queen", "nyx") : null] || 0));

// ---------- the turn ----------
// opts.tier forces a roll's outcome; only preview() uses it, on a copy.
export function choose(s, side, opts = {}) {
  if (s.over) return null;
  // Declining an offer returns to the pending fight without spending time or the Bond.
  if (s.cardId === BOND_CARD.id && (side === "right" || !bondOffer(s))) {
    const ch = currentCard(s)[side];
    const offer = bondOffer(s);
    if (offer) s.flags[`seen_bond_${offer.bond}`] = true;
    const board = copy(s);
    draw(s);
    return { side, label: ch.label, roll: null, delta: {}, text: ch.text, notes: [], ending: null, nightfall: null, card: BOND_CARD.id, event: s.lastEvent, spent: [], board };
  }
  if (s.stir) resolveStir(s, false); // an unanswered stir means the Mask answered
  const card = currentCard(s);
  const ch = card[side];
  const notes = [];
  const keys = tracked(s);
  const before = Object.fromEntries(keys.map((k) => [k, s[k]]));
  const uniBefore = uniOn(s) ? { active: s.mask === "venefica", comm: s.communion, cage: s.cage, claimed: !!(s.asc && s.asc.occ && s.asc.occ.claimed) } : null;
  const encBefore = s.asc ? encSnap(s) : null;
  const spentBefore = (s.spent || []).length;
  const spentNow = () => (s.spent || []).slice(spentBefore);
  let roll = null;
  let branch = ch;
  if (ch.roll) {
    roll = opts.tier ? { ...rollMods(s, ch.roll), dice: [], kept: [], total: null, tier: opts.tier } : rollDice(s, ch.roll);
    // A forced outcome is where the dice landed: the Fool still catches it, as rollDice does.
    if (opts.tier && fated(s, roll.tier) !== roll.tier) (roll.tier = fated(s, roll.tier)), (roll.fated = true), (s.arc.fool = foolAt(s));
    if (opts.tier && crownHolds(s, roll.tier) !== roll.tier) (roll.tier = crownHolds(s, roll.tier)), (roll.fated = true), (s.asc.occ.crowned = foolAt(s));
    const t = roll.tier === "radiance" ? "hit" : roll.tier === "ruin" ? "miss" : roll.tier;
    branch = ch[t] || {};
    if (roll.tier === "radiance") {
      s.radiance++;
      s.dayMarks.push("radiance");
      notes.push("Radiance — the dice gift you 1 Favor.");
    }
    if (roll.tier === "ruin") {
      s.ruin++;
      notes.push("Ruin — and one thing more: +1 Strain.");
    }
  }
  // Eris's Severance cuts both ways: a wolf beaten clean forgets you a little; a fight lost is loud.
  const fight = roll && s.mask === "eris" && answers(s) && roll.stat === "steel" && card.tier >= 2;
  const severs = fight && (roll.tier === "hit" || roll.tier === "radiance");
  const loud = fight && (roll.tier === "miss" || roll.tier === "ruin");
  // delta is measured, not accumulated, so everything that moved is reported (Communion included).
  const measure = () => Object.fromEntries(keys.filter((k) => s[k] !== before[k]).map((k) => [k, s[k] - before[k]]));
  if (ch.roll) applyFx(s, ch.fx, notes);
  applyFx(s, branch.fx, notes);
  if (roll && roll.tier === "radiance") applyFx(s, { favor: 1 }, notes);
  if (roll && roll.tier === "ruin") applyFx(s, { strain: 1 }, notes);
  if (roll && shaped(s)) {
    // The standing shapes: a rider on a roll's result.
    const group = roll.tier === "radiance" ? "hit" : roll.tier === "ruin" ? "miss" : roll.tier;
    for (const d of standing(s))
      if (d.t === "tier" && d.tier === group && (d.stat === "any" ? roll.stat !== "fortune" : d.stat === roll.stat)) applyFx(s, d.fx, notes), notes.push(`${d.from}: ${fxWords(d.fx)}.`);
  }
  if (s.asc && s.asc.syn && s.asc.syn.laid) {
    // A revelation laid by the Glass pays on this card's roll (synergy.js); it never outlives the card.
    if (roll && (roll.tier === "radiance" || roll.tier === "hit")) applyFx(s, { gnosis: 1 }, notes), notes.push("The Dangerous Revelation lands: Gnosis +1.");
    else if (roll && (roll.tier === "ruin" || roll.tier === "miss")) applyFx(s, { longing: 1, mark: 1 }, notes), notes.push("The Dangerous Revelation costs you: Longing +1, Mark +1.");
    s.asc.syn.laid = null;
  }
  const eking = s.arc ? courtOn(s, "king", "eris") : null; // the King holds Severance: clean, or forgetting nothing
  if (severs && s.mark > 0 && eking !== "rev") applyFx(s, { mark: eking === "up" ? -2 : -1 }, notes), notes.push(eking === "up" ? "Severance cuts clean. The wolf forgets you: Mark −2." : "Severance holds clean. The wolf forgets you a little: Mark −1.");
  if (loud && eking !== "up") applyFx(s, { mark: eking === "rev" ? 2 : 1 }, notes), notes.push(`The fight went the other way, loudly: Mark +${eking === "rev" ? 2 : 1}.`);
  const text = branch.text || ch.text || "";

  recordWornMask(s, s.mask, notes);

  s.turns++;
  s.recent = [card.id, ...s.recent].slice(0, 10);
  if (card.once) s.flags["seen_" + card.id] = true;

  // Tutorial cards teach; they don't spend the day. Keeps a Vigil's clock identical for everyone.
  if (card.tutorial) {
    const delta = measure();
    draw(s);
    return { side, label: ch.label, roll, delta, text, notes, ending: null, nightfall: null, card: card.id, event: s.lastEvent, spent: [] };
  }

  // A reading (arcana.js) is turned at dusk, outside the day: no Bell, no road card counted, no Mask's clock, no
  // Light timers, no Cascade. Only what the card itself does, and whether that ends the run.
  if (card.dusk) {
    if (s.asc) s.asc.armed = null; // a working laid on it is spent with it
    if (occOn(s)) s.asc.occ.refuse = false;
    const fractured = maybeFracture(s, card, ch, side, roll, uniBefore, measure(), notes);
    checkEnd(s, card, notes, {});
    if (s.over) s.endBy = s.endBy || card.id;
    const board = { ...s, bonds: [...s.bonds], spent: [...(s.spent || [])], flags: { ...s.flags } };
    if (s.asc) board.asc = JSON.parse(JSON.stringify(s.asc));
    if (s.arc) board.arc = JSON.parse(JSON.stringify(s.arc));
    const delta = measure();
    if (!s.over) draw(s);
    else closeDay(s);
    const dres = { side, label: ch.label, roll, delta, text, notes, ending: s.over, nightfall: null, card: card.id, event: s.lastEvent, spent: spentNow(), board };
    if (fractured) dres.fractured = fractured;
    return dres;
  }

  // Exodus: the adversary's intent, its clock and roads, the Act's bookkeeping.
  const encTurn = s.asc ? ascTurn(s, card, ch, side, roll, before, encBefore, notes) : null;

  if (card.id !== BOND_CARD.id) turnPressure(s, card, notes);

  const fractured = maybeFracture(s, card, ch, side, roll, uniBefore, measure(), notes);

  checkEnd(s, card, notes, {});
  if (s.over) s.endBy = s.endBy || card.id;

  // The board as this card left it, before the night and the next draw: what the HUD shows under the card's
  // slip, so a day's last card isn't credited with the night, nor any card with the next card's Activation.
  // Exodus: a fight holds the Bell (it's one long scene), and the night falls when the fight ends.
  const held = !!(s.asc && encBefore);
  const fightEnds = held && !!(encTurn && encTurn.resolved);
  const board = { ...s, bell: s.over || held ? s.bell : s.bell + 1, bonds: [...s.bonds], spent: [...(s.spent || [])], flags: { ...s.flags } };
  if (s.asc) board.asc = JSON.parse(JSON.stringify(s.asc));
  if (s.arc) board.arc = JSON.parse(JSON.stringify(s.arc));
  let nightfall = null;
  if (!s.over) {
    if (!held) s.bell++;
    if (s.bell >= CARDS_PER_DAY || fightEnds) {
      // The night's own share of the turn, so the UI can say what the card did and what the night did.
      const pre = Object.fromEntries(TRACKED.map((k) => [k, s[k]]));
      const from = notes.length;
      nightfall = night(s, notes, {});
      nightfall.delta = Object.fromEntries(TRACKED.filter((k) => s[k] !== pre[k]).map((k) => [k, s[k] - pre[k]]));
      nightfall.notes = notes.slice(from);
    }
  }
  const delta = measure(); // before the next draw, whose Activation roll is reported separately
  const enc = s.asc ? encReport(s, encBefore, encTurn) : null;
  if (!s.over) draw(s);
  else if (!nightfall) closeDay(s); // night() already closed the day it ended on
  const res = { side, label: ch.label, roll, delta, text, notes, ending: s.over, nightfall, card: card.id, event: s.lastEvent, spent: spentNow(), board };
  if (fractured) res.fractured = fractured;
  if (enc) res.enc = enc;
  return res;
}

// Pressure ticks only on a regular card, never on a Bond's offer of help.
function turnPressure(s, card, notes) {
  // Mask risks
  s.maskAge++;
  const wolf = s.mask === "bare" && card.tier >= 2 ? wolfStrain(s, card.tier) : 0;
  if (wolf) applyFx(s, { strain: wolf }, notes), notes.push(`No armor: a wolf, bare-faced. +${wolf} Strain.`);
  if (s.mask === "nyx" && s.maskAge % nyxPeriod(s) === 0) applyFx(s, { strain: 1 }, notes), notes.push("Nyx: Dissolution. +1 Strain.");
  if (s.mask === "eris" && erisFires(s, s.maskAge)) applyFx(s, { longing: 1 }, notes), notes.push("Eris: power without connection. Longing +1.");

  // Apotheosis 3+: performing danger draws the wolves closer
  if (s.apo >= 3 && card.tier >= 2) applyFx(s, { mark: 1 }, notes), notes.push("They found you easier. Menace is not safety.");

  // False Light timers
  if (s.reckoning > 0 && card.id !== "reckoning") s.reckoning--;
  if (s.communion > 0 && card.id !== "whisper" && card.id !== "reckoning") {
    s.communion--;
    if (s.communion === 0) s.forced.unshift("reckoning");
  }

  // The Cascade: three accelerants and the world tightens (never announced by name)
  const acc = accelerants(s, card);
  const was = s.cascade;
  s.cascade = acc >= 3;
  if (s.cascade) {
    if (s.cage >= 3) applyFx(s, { cage: 1 }, []); // a Cage already biting compounds
    s.dayMarks.push("cascade");
  }
  if (was && !s.cascade) {
    const g = s.gnosis;
    applyFx(s, { gnosis: 1 }, notes);
    notes.push(s.gnosis > g ? "The pressure eases. Governance: Gnosis +1." : "The pressure eases.");
  }

  if (s.mark >= 5 || s.strain >= 5) s.dayMarks.push("edge");
}

export function accelerants(s, card) {
  let n = 0;
  if (s.hollow >= 3) n++;
  if (s.strain >= 4) n++;
  if (s.longing >= 3) n++;
  if (s.noRestDays >= 2) n++;
  if (s.cage >= 4) n++;
  if (s.favor === 0) n++;
  if (card && card.tier >= 2) n++;
  return n;
}

export const bondsEarned = (s) => new Set([...(s.bonds || []), ...(s.spent || [])]).size;

// Spend a Bond if it's held. Spent Bonds are recorded on the run (the preview reports them, the end screen too).
function spend(s, k, notes, text) {
  if (!s.bonds.includes(k)) return false;
  if (s.asc && s.asc.enc && s.asc.enc.isolated) return false; // the Shepherd's Isolation: nobody can reach you
  if (riteOn(s, "name")) return false; // the Taken Name (occult.js RITES): nobody catches you
  s.bonds = s.bonds.filter((b) => b !== k);
  s.spent = (s.spent || []).concat(k);
  notes.push(text);
  return true;
}

// Death upright (arcana.js), once a run: an ending by Mark or Strain that nothing else caught is a change instead.
function deathCatches(s, notes, k) {
  if (!s.arc || s.arc.death || arcOn(s, "death") !== "up") return false;
  s.arc.death = true;
  notes.push(`Death: change, not the end. ${k === "mark" ? "Mark" : "Strain"} goes to 4.`);
  applyFx(s, { gnosis: 1 }, notes);
  return true;
}
function checkEnd(s, card, notes, delta) {
  if (s.over) return;
  if (s.untag >= 12 && s.gnosis >= 12) {
    if (!s.asc) return void (s.over = "crown");
    ascOffer(s, "crown"); // in Exodus it's a door you're offered, not one you're pushed through
  }
  if (s.hollow >= 4 && s.strain === 5) s.strain = 6;
  if (s.strain >= 6) {
    if (s.favor >= 3) {
      s.favor -= 3;
      s.strain = 4;
      delta.favor = (delta.favor || 0) - 3;
      notes.push("Fracture absorbed: 3 Favor spent. Strain resets to 4.");
    } else if (spend(s, "sponsor", notes, "The Sponsor picks up at the fourth hour. Strain drops to 4. That Bond is spent.")) s.strain = 4;
    else if (deathCatches(s, notes, "strain")) s.strain = 4;
    else return void (s.over = s.reckoning > 0 ? "fracture_reckoning" : "fracture");
  }
  if (s.mark >= 6 && spend(s, "sister", notes, "The Sister hides you. Mark drops to 5. That Bond is spent.")) s.mark = 5;
  if (s.mark >= 6 && deathCatches(s, notes, "mark")) s.mark = 4;
  if (s.mark >= 6) return void (s.over = (card && card.named) || "named");
  if (s.cage >= 8) return void (s.over = "cage");
  if (s.apo >= 6) return void (s.over = "rex");
}

function closeDay(s) {
  const m = s.dayMarks;
  let glyph = "purple";
  if (m.includes("edge") || m.includes("cascade")) glyph = "red";
  if (m.includes("light")) glyph = "gold";
  if (m.includes("radiance")) glyph = "radiance";
  if (s.over) glyph = ENDINGS[s.over] && ENDINGS[s.over].win ? "crown" : "end";
  s.days.push(glyph);
  s.dayMarks = [];
}

function night(s, notes, delta) {
  const info = { day: s.day, rested: s.restedToday };
  if (occOn(s)) ascend(s, notes);
  if (!s.restedToday) {
    s.noRestDays++;
    const b = s.hollow;
    s.hollow = clamp(s.hollow + 1, 0, 4);
    if (s.hollow !== b) delta.hollow = (delta.hollow || 0) + 1;
    notes.push(tollFor(s, "saturn") ? "Nightfall without rest, on Saturn's day: Hollow +1, and no Strain clears." : "Nightfall without rest. Hollow +1.");
    if (tollFor(s, "moon") && s.longing < 4) {
      s.longing++;
      delta.longing = (delta.longing || 0) + 1;
      notes.push("The Moon's tide: Longing +1.");
    }
    // The Hermit reversed, the Star reversed: the lamp out, despair.
    if (s.arc && arcOn(s, "hermit") === "rev" && s.untag > 0) s.untag--, notes.push("The Hermit, reversed: Untaggable −1.");
    if (s.arc && arcOn(s, "star") === "rev" && s.gnosis > 0) s.gnosis--, notes.push("The Star, reversed: Gnosis −1.");
  } else {
    s.noRestDays = 0;
    // The Hermit, the Star: your own lamp, and hope, on a rested night.
    if (s.arc && arcOn(s, "hermit") === "up") applyFx(s, { untag: 1 }, notes), notes.push("The Hermit: your own lamp. Untaggable +1.");
    if (s.arc && arcOn(s, "star") === "up") {
      const g = s.gnosis;
      applyFx(s, { gnosis: 1 }, notes);
      if (s.gnosis > g) notes.push("The Star: hope. Gnosis +1.");
    }
  }
  if (shaped(s)) for (const d of standing(s)) if (d.t === "night" && d.rested === !!s.restedToday) applyFx(s, d.fx, notes), notes.push(`${d.from}: ${fxWords(d.fx)}.`);
  // Night gives a little back, even on the Warrens' thin mattresses.
  const sb = s.strain;
  // Bare Face's gift: rest lands harder when you've stopped performing.
  // Short Nights (Edict 5, Exodus): a rested night clears 1 less.
  // Saturn's boon: on his day a rested night clears 1 more.
  // Saturn's toll: on his day a night without rest clears nothing.
  s.strain = clamp(s.strain - (s.restedToday ? (s.mask === "bare" && answers(s) ? 3 + ({ up: 1, rev: -1 }[s.arc ? courtOn(s, "king", "bare") : null] || 0) : 2) - (edict(s, 5) ? 1 : 0) + (boonFor(s, "saturn") ? 1 : 0) : tollFor(s, "saturn") ? 0 : 1), 0, 6);
  if (s.strain !== sb) delta.strain = (delta.strain || 0) + (s.strain - sb);
  // The Vow of Poverty (occult.js RITES), before the Open Table is spent: an empty purse is the vow kept.
  if (s.favor === 0 && riteOn(s, "poverty")) (s.favor = 1), notes.push("The Vow of Poverty: an empty purse is the vow kept. Favor 1.");
  if ((s.favor === 0 || s.hollow >= 4) && spend(s, "table", notes, "The Open Table: bread and a bed. Favor 1 at least, Hollow 3 at most. That Bond is spent.")) {
    s.favor = Math.max(s.favor, 1);
    s.hollow = Math.min(s.hollow, 3);
  }
  if (s.favor === 0) s.over = "destitute";
  else if (s.hollow >= 4) s.over = "collapse";
  else if (s.restedToday && s.flags.house && bondsEarned(s) === 3) {
    if (!s.asc) s.over = "ordinary"; // Ordinary Time
    else ascOffer(s, "ordinary");
  }
  if (s.asc && !s.over && s.asc.act === 1 && !s.asc.enc && s.mark >= 3) s.asc.dossier++; // the Inquisition's interest
  if (s.over) s.endBy = "nightfall";
  closeDay(s);
  if (s.over) return info;
  s.day++;
  s.bell = 0;
  s.restedToday = false;
  s.seizedToday = false;
  s.maskLocked = false;
  s.veil = false;
  delete s.flags.veil2;
  if (occOn(s)) s.asc.occ.dawn = dawnOf(s);
  return info;
}

// A reading that won't read (mangled, or from a deck this release doesn't deal) is dropped, and the run plays on
// without one: exactly the game a run saved before the Arcana plays.
function migrateArc(s) {
  const a = s.arc;
  const ok = a && typeof a === "object" && !Array.isArray(a) && Number.isInteger(a.sign) && a.sign >= 0 && a.sign < 12 &&
    Number.isInteger(a.wk) && a.wk >= 0 && a.wk < 7 && Array.isArray(a.spread) && a.spread.length >= 1 &&
    a.spread.every((c) => c && ARCANA_LIVE.includes(c.id) && ["down", "up", "struck"].includes(c.st));
  if (!ok) {
    delete s.arc;
    // Its cards go with it: none left queued, and one on the table gives way to the next card.
    s.forced = s.forced.filter((id) => !ARC_IDS.has(id));
    if (ARC_IDS.has(s.cardId)) draw(s);
    return;
  }
  for (const c of a.spread) (c.rev = !!c.rev), (c.fell = !!c.fell), (c.set = [1, 0, -1].includes(c.set) ? c.set : 0), c.own ? (c.own = true) : delete c.own, c.cor ? (c.cor = true) : delete c.cor;
  a.death = !!a.death;
  a.fool = Number.isFinite(a.fool) ? a.fool : 0;
  a.tower = !!a.tower;
  a.judged = !!a.judged;
  a.devil = !!a.devil;
}

// ---------- drawing ----------
function eligible(s, c) {
  if (c.tutorial) return false;
  if (c.forcedOnly) return false;
  if (c.once && s.flags["seen_" + c.id]) return false;
  if (s.recent.includes(c.id)) return false;
  return c.when ? !!c.when(s) : true;
}

// The encounter stream. The Nth random draw of a run uses a number derived only from the seed and N,
// never from the dice stream, so rolling can't reorder the deck. Which cards are *eligible* still
// depends on the run's state (the Light finds you when you're empty; follow-ups need their setup).
// Forced cards (tutorial, the Reckoning) don't consume a draw.
export function deckRand(s) {
  const n = s.draws | 0;
  s.draws = n + 1;
  return rand({ rng: (hashSeed(s.seedLabel) ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0 });
}

export const tutorialPending = (s) => !!(s.tutorial && (s.forced.some((id) => BY_ID[id] && BY_ID[id].tutorial) || (BY_ID[s.cardId] && BY_ID[s.cardId].tutorial)));

// The day's sphere's toll on the deck: the Sun brings the Light, Mars the wolves, Mercury the Geometry.
export const skyWeight = (s, c) =>
  !shaped(s) ? 1 : (c.id === "whisper" ? (tollFor(s, "sun") ? 2 : 1) * (arcOn(s, "sun") === "rev" ? 0.5 : 1) : 1) * (c.tier === 2 && tollFor(s, "mars") ? 1.5 : 1) * (c.tier === 3 && tollFor(s, "mercury") ? 1.5 : 1) * standing(s).reduce((m, d) => (d.t === "weight" && d.tier === c.tier ? m * d.m : m), 1);

function draw(s) {
  s.lastEvent = null;
  let id = null;
  if (s.asc) ascBeforeDraw(s); // an adversary arrives at dawn
  while (s.forced.length && !id) {
    const f = s.forced.shift();
    // the bench, and the Hour (prep.js), are dealt only with something on them
    if (BY_ID[f] && !(f === "o_bench" && !benchOffer(s)) && !(f === "d_hour" && !hourOffer(s)) && !(f === "d_spoils" && !spoilsOffer(s)) && !(f === BOND_CARD.id && !bondOffer(s))) id = f;
  }
  if (!id && s.asc && s.asc.enc) id = encDraw(s);
  if (!id) {
    const pool = (s.asc ? ascPool(s) : CARDS).filter((c) => eligible(s, c));
    // A thread come due (breadth.js) takes the draw: the city remembers. It still spends the draw's number.
    const called = s.asc && brdOn(s) ? brdCall(s, pool) : null;
    // Day one is a grace day: the Geometry's heavy machinery rarely arrives before you've found your feet.
    const grace = (c) => (s.day === 1 && c.tier >= 2 ? 0.35 : 1);
    const boost = (c) => (s.asc ? ascBoost(s, c) : 1);
    const occW = (c) => (occOn(s) ? occWeight(s, c) : 1);
    const weights = pool.map((c) => grace(c) * boost(c) * skyWeight(s, c) * occW(c) * Math.max(0, typeof c.weight === "function" ? c.weight(s) : c.weight ?? 1));
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = deckRand(s) * sum;
    for (let i = 0; i < pool.length && !called; i++) {
      r -= weights[i];
      if (r <= 0) {
        id = pool[i].id;
        break;
      }
    }
    if (called) id = called;
    id = id || (pool[pool.length - 1] || CARDS.find((c) => c.id === "meal")).id;
  }
  s.cardId = id;
  if (id === "o_bench") ritSee(s);
  if (s.asc) ascAfterDraw(s); // the adversary's intent for this card, and any seal
  if (id !== BOND_CARD.id) seizure(s);
}

// Activation Seizure (§9.5): under load, who decides which frequency answers?
function seizure(s) {
  if (s.seizedToday || s.over || s.mask === "venefica") return;
  if (s.asc) {
    // No Activation on a fight's opening, stop or last card: those decide the fight, not the Mask.
    const c = currentCard(s);
    if (c && (c.stop || (c.enc && (c.forcedOnly || c.final)))) return;
  }
  if (!(s.strain >= 4 && (s.longing >= 3 || s.hollow >= 3 || s.cage >= 4))) return;
  s.seizedToday = true;
  const r = rollDice(s, { stat: "fortune", activation: true });
  // The Chariot (arcana.js): upright you hold the reins, and a seizure only stirs; reversed, a stir seizes.
  const chariot = s.arc ? arcOn(s, "chariot") : null;
  if (chariot === "up" && (r.tier === "miss" || r.tier === "ruin")) r.tier = "mid";
  else if (chariot === "rev" && r.tier === "mid") r.tier = "miss";
  // The Crown Taken (occult.js RITES): it always holds, because you've decided you're the one who decides.
  if (riteOn(s, "crown")) r.tier = "hit";
  const card = currentCard(s);
  const pick = card.tier >= 2 ? "eris" : s.longing >= 3 ? "lilith" : "nyx";
  if (r.tier === "hit" || r.tier === "radiance") {
    const grows = s.apo < gnosisCap(s) && s.communion === 0 && !riteOn(s, "crown");
    if (grows) s.gnosis = Math.min(12, s.gnosis + 1);
    s.lastEvent = { kind: "sovereign", roll: r, text: `Activation — and sovereignty holds. You choose.${grows ? " Gnosis +1." : ""}` };
  } else if (r.tier === "mid") {
    // §9.5, 7–9: a Mask begins to answer for you. Burn 1 Favor to override, or wear it.
    if (pick === s.mask) {
      s.lastEvent = { kind: "stir", roll: r, mask: pick, text: `Activation. ${MASKS[pick].name} stirs. You were already wearing it.` };
    } else {
      s.stir = pick;
      s.lastEvent = { kind: "stir", roll: r, mask: pick, choice: true, text: `Activation. ${MASKS[pick].name} starts to answer for you. Let it, or hold the wheel for 1 Favor.` };
    }
  } else {
    s.mask = pick;
    s.maskAge = 0;
    s.maskLocked = true;
    // §9.5: the Mask's risk fires at full strength. Eris's Isolation doesn't wait for the fourth card.
    if (pick === "eris") s.longing = clamp(s.longing + 1, 0, 4);
    const unlockNotes = [];
    recordWornMask(s, pick, unlockNotes);
    s.lastEvent = {
      kind: "seizure",
      roll: r,
      mask: pick,
      text: `Seizure. ${MASKS[pick].name} answers a signal you did not send. ${MASKS[pick].seized}. It holds until nightfall; breaking free costs 2 Strain.${unlockNotes.length ? " " + unlockNotes[0] : ""}`,
    };
  }
}

// ---------- masks & Lux Venefica ----------
function recordWornMask(s, m, notes = []) {
  if (!uniOn(s) || !ACTIVE_MASKS.includes(m)) return;
  const u = s.asc.uni;
  if (!u.worn.includes(m)) u.worn.push(m);
  if (!u.unlocked && ACTIVE_MASKS.every((k) => u.worn.includes(k))) {
    u.unlocked = true;
    notes.push("All three Masks have answered: Nyx, Eris and Lilith can unify as Lux Venefica.");
  }
}

// Dissociative fracture (DID mapping): taking the False Light fractures to Lilith; surrendering sovereignty
// (Cage / Claimed Will) fractures to whichever Mask answers the choice that bound you.
export function fractureMaskFor(s, card, ch, side, roll, cause, delta) {
  if (cause === "light") return "lilith";
  const verb = (ch && ch.verb) || "";
  if (verb === "confront" || (roll && roll.stat === "steel")) return "eris";
  if (verb === "ally" || (roll && roll.stat === "freq") || (delta && delta.longing) || (card && card.enc === "shepherd")) return "lilith";
  return "nyx";
}

function maybeFracture(s, card, ch, side, roll, uniBefore, delta, notes) {
  if (!uniBefore || !uniBefore.active || s.mask !== "venefica" || s.over) return null;
  const lightBreak = uniBefore.comm === 0 && s.communion > 0;
  const bondageBreak = s.cage > uniBefore.cage || (!uniBefore.claimed && !!(s.asc && s.asc.occ && s.asc.occ.claimed));
  if (!lightBreak && !bondageBreak) return null;
  const cause = lightBreak ? "light" : "bondage";
  const pick = fractureMaskFor(s, card, ch, side, roll, cause, delta);
  s.mask = pick;
  s.maskAge = 0;
  s.maskLocked = true;
  if (pick === "eris") s.longing = clamp(s.longing + 1, 0, 4);
  recordWornMask(s, pick, notes);
  const u = s.asc.uni;
  u.fractures++;
  u.fracturedDay = s.day;
  u.fracturedCage = s.cage;
  u.lastFracture = { mask: pick, cause };
  notes.push(`Dissociative fracture (${cause === "light" ? "the False Light" : "bondage"}): Lux Venefica shatters. ${MASKS[pick].name} seizes the wheel (${MASKS[pick].seized}).`);
  return { mask: pick, cause };
}

// Base Strain for changing Mask: free at dawn, 1 after, 2 to break a Seizure (§9.5, "rest of the scene"
// — here the day). maskStrain() is what the engine actually charges, Hollow 2's +1 tax included.
export function maskCost(s, m) {
  if (m === s.mask) return 0;
  if (s.maskLocked) return 2;
  if (m === "venefica") return s.asc && s.asc.enc ? 1 : s.bell === 0 ? 0 : 1;
  // An Ace read (arcana.js): its element's Mask goes on free at any hour, or reversed costs 1 more.
  const ace = s.arc ? arcOn(s, "ace_" + Object.keys(SUITS).find((k) => SUITS[k].mask === m)) : null;
  if (ace === "up") return 0;
  const base = s.asc && s.asc.enc ? 1 : s.bell === 0 ? 0 : 1; // a fight holds the Bell at dawn, but changing Masks in one is never free
  return base + (ace === "rev" ? 1 : 0);
}
export function maskStrain(s, m) {
  const c = maskCost(s, m);
  return c && s.hollow >= 2 ? c + 1 : c;
}
// Settle a stirring Mask: hold = keep your own Mask for 1 Favor; otherwise the stirring Mask is worn,
// unlocked, and can be changed at the normal cost.
export function resolveStir(s, hold) {
  if (!s.stir) return { ok: false };
  const pick = s.stir;
  s.stir = null;
  if (hold && s.favor >= 1) {
    s.favor -= 1;
    return { ok: true, held: true, mask: s.mask, delta: { favor: -1 } };
  }
  s.mask = pick;
  s.maskAge = 0;
  s.maskLocked = false;
  recordWornMask(s, pick);
  return { ok: true, held: false, mask: pick, delta: {} };
}

export function switchMask(s, m) {
  if (s.stir) resolveStir(s, false);
  if (s.over || !MASKS[m] || m === s.mask) return { ok: false };
  const cost = maskCost(s, m);
  const notes = [];
  const delta = cost ? applyFx(s, { strain: cost }, notes) : {};
  s.mask = m;
  s.maskAge = 0;
  s.maskLocked = false;
  recordWornMask(s, m, notes);
  checkEnd(s, null, notes, delta);
  if (s.over) {
    s.endBy = "mask:" + m;
    closeDay(s);
  }
  return { ok: true, cost, delta, notes, ending: s.over };
}

export function canUnify(s) {
  if (!uniOn(s) || s.over || !s.asc.uni.unlocked) return { ok: false, reason: "Locked" };
  if (s.mask === "venefica") return { ok: false, reason: "Already unified." };
  if (s.communion > 0) return { ok: false, reason: "Cannot unify inside the False Light." };
  if (s.maskLocked) return { ok: false, reason: "Break the seizure first." };
  if (s.stir) return { ok: false, reason: "Answer the stirring Mask first." };
  const u = s.asc.uni;
  if (u.fractures > 0 && s.day <= u.fracturedDay && s.cage >= u.fracturedCage) {
    return { ok: false, reason: "Fractured today: lower the Cage or wait for dawn to reunify." };
  }
  return { ok: true, cost: maskStrain(s, "venefica"), reunify: !!u.ever };
}

export function unify(s) {
  if (s.stir) resolveStir(s, false);
  const gate = canUnify(s);
  if (!gate.ok) return { ok: false, reason: gate.reason };
  const cost = maskCost(s, "venefica");
  const notes = [];
  const delta = cost ? applyFx(s, { strain: cost }, notes) : {};
  const u = s.asc.uni;
  const wasEver = u.ever;
  s.mask = "venefica";
  s.maskAge = 0;
  s.maskLocked = false;
  u.ever = true;
  u.count++;
  checkEnd(s, null, notes, delta);
  if (s.over) {
    s.endBy = "mask:venefica";
    closeDay(s);
  } else {
    notes.push(wasEver ? "Reunified as Lux Venefica." : "Nyx, Eris and Lilith converge: you stand as Lux Venefica.");
  }
  return { ok: true, cost, delta, notes, ending: s.over };
}

// ---------- Exodus: the long road ----------
// Everything below runs only when s.asc exists (mode "ascension", shown as Exodus). The data is in ascension.js.
const freshAsc = () => ({
  v: 3,
  act: 1, // 1 THE STAR, 2 DEATH, 3 TEMPERANCE
  actCards: 0, // cards drawn on the road in this act (Act II's adversary comes after four)
  road: null, // the road out of the Warrens: chapter or tithe
  enc: null, // the fight under way
  met: [], // fights finished: { id, out, finished }
  fled: [], // fights you disengaged from
  carry: 0, // driven out of the last fight: the next one starts that much higher
  after: null, // how the first fight was won (evade, know, people, fled): its aftermath on the road
  spoils: false, // won on a road: the chapel's Prepare offers a relic
  named: [], // the Named: { n, end, st: "held" | "free", asked, informed }
  freed: 0,
  relics: [],
  charges: {},
  armed: null, // a working laid on this card: glass, key, crown
  lampWitness: false, // the Ward-Keeper's Lamp, transmuted: a spent Bond still counts as a witness
  transmuted: 0,
  dossier: 0, // the Inquisition's interest, before it arrives
  offer: [], // relics on the chapel's shelf
  offered: [], // the wins you've been offered in here (crown, ordinary)
  declined: [],
  pending: [], // offers held until a fight is over
  chains: {}, // the Chains you gave in to, for the Grammar
  struck: [], // Chains a cut on the road struck from the Grammar
  escalated: 0, // fights you finished instead of stopping
  echo: null, // the last accepting choice the Oldest Trap can quote back to you
  force: false, // the Grammar was cut: the festival could be stopped by force
  apoSeen: false, // the Pull is shown
  hist: { bare: 0, nyx: 0, eris: 0, lilith: 0, light: 0, held: 0, wolves: 0, cut: 0, used: { nyx: 0, eris: 0, lilith: 0 } },
  locked: [], // roads and relics still sealed for this run (UNLOCKS); a run saved before unlocks has everything open
  edict: 0, // the Edicts in force (EDICTS): 1..edict all apply
  self: null, // this heretic's name (HEIRS); a run saved before lineage has none
  prev: null, // the last heretic: { n, by, won }
});
// The Named for this run: three of canon's names, each with the ending that put them in the margin, from the seed.
function seedNamed(s) {
  const r = { rng: hashSeed(s.seedLabel + ":named") };
  const pool = NAMES.slice();
  s.asc.named = [0, 1, 2].map(() => ({ n: pool.splice(Math.floor(rand(r) * pool.length), 1)[0], end: NAMED_BY[Math.floor(rand(r) * NAMED_BY.length)], st: "held", asked: false }));
}
function migrateAsc(s) {
  const base = freshAsc();
  if (!s.asc || typeof s.asc !== "object" || Array.isArray(s.asc)) s.asc = base;
  const a = s.asc;
  for (const [k, v] of Object.entries(base)) {
    const have = a[k];
    if (have === undefined) a[k] = v;
    else if (Array.isArray(v) && !Array.isArray(have)) a[k] = v;
    else if (v && typeof v === "object" && !Array.isArray(v) && (!have || typeof have !== "object" || Array.isArray(have))) a[k] = v;
    else if (typeof v === "number" && !Number.isFinite(have)) a[k] = v;
  }
  for (const [k, v] of Object.entries(base.hist)) if (k !== "used" && !Number.isFinite(a.hist[k])) a.hist[k] = v;
  if (!a.hist.used || typeof a.hist.used !== "object") a.hist.used = { ...base.hist.used };
  for (const m of Object.keys(base.hist.used)) if (!Number.isFinite(a.hist.used[m])) a.hist.used[m] = 0;
  if (![1, 2, 3].includes(a.act)) a.act = 1;
  if (a.road && !ROADS[a.road]) a.road = null;
  a.locked = a.locked.filter((k) => UNLOCKS[k]);
  a.edict = Math.max(0, Math.min(MAX_EDICT, Math.floor(a.edict)));
  if (typeof a.self !== "string" || !HEIRS.includes(a.self)) a.self = null;
  if (!a.prev || typeof a.prev !== "object" || typeof a.prev.n !== "string") a.prev = null;
  a.relics = a.relics.filter((r) => RELICS[r]).slice(0, 2);
  a.named = a.named.filter((x) => x && typeof x.n === "string");
  if (!a.named.length) seedNamed(s);
  for (const x of a.named) if (x.st !== "free") x.st = "held";
  a.freed = Math.max(a.freed, a.named.filter((x) => x.st === "free").length);
  if (a.enc && (typeof a.enc !== "object" || !ENCOUNTERS[a.enc.id])) a.enc = null;
  if (a.enc) {
    const e = a.enc;
    const def = ENCOUNTERS[e.id];
    if (!Number.isFinite(e.phase) || !def.phases[e.phase]) e.phase = 0;
    for (const k of ["clock", "turn"]) if (!Number.isFinite(e[k])) e[k] = 0;
    if (!e.roads || typeof e.roads !== "object") e.roads = {};
    if (!e.need || typeof e.need !== "object") e.need = {};
    for (const k of Object.keys(def.roads)) {
      if (!Number.isFinite(e.roads[k])) e.roads[k] = 0;
      if (!Number.isFinite(e.need[k])) e.need[k] = def.roads[k].need;
    }
    if (!e.mods || typeof e.mods !== "object") e.mods = {};
    if (e.intent && !INTENTS[e.intent]) e.intent = null;
    if (e.next && !INTENTS[e.next]) e.next = null;
  }
}

// ---------- the Great Occult Expansion (occult.js) ----------
// The seven tracks the spheres hold, as the day began: a garment is given back on its sphere's day only if its track
// fell that day.
const dawnOf = (s) => ({ hollow: s.hollow, mark: s.mark, longing: s.longing, apo: s.apo, strain: s.strain, favor: s.favor, cage: s.cage });
const freshOcc = (s) => {
  const sky = skyFor(s.seedLabel, "ascension");
  return {
    v: 1,
    wk: sky.wk, sign: sky.sign, // the expansion's own sky, read only in a run without the Arcana's (occult.js occDay)
    dawn: dawnOf(s),
    rites: [], // held: occult.js RITES
    renounced: [], // laid down: never offered again
    account: null, // serpent, wisdom, unsaid (the Two Accounts)
    spheres: {}, // gates passed: sphere → how (occult.js MEANS)
    warded: 0, // the day a pentacle quieted the day's sphere
    defied: 0, // the day its toll was refused
    debts: [], // owed to the Seven: { p, n }, collected at the next fight's start
    seals: [], // seals met at the Office (a sphere, or sphere+ met again while bound)
    vessel: null, // the Great Work: { k, stage }
    stones: [], // relics come out of the vessel as Stones
    will: null, // the orbit walked (the Law of the Star)
    claimed: false, // another's Will named as yours
    chapel: 0, // the chapel reached: 1 after the first movement, 2 after the second
    prepared: 0, // the chapel (1 or 2) where Prepare was last chosen
    crowned: 0, // the Crown Taken's once-a-movement miss, spent (100 + the act)
    refuse: false, // the Refuse control, laid on this card
    refusedAt: "", // the fight and phase it was last used in (once a phase)
    storm: 0, // the day a gate was stormed
    keyed: 0, // the day the Serpent's Key opened a gate
    sabbath: 0, // the day kept as a Sabbath
    sabbaths: 0,
  };
};
// An expansion state that won't read is dropped, with its cards: the run plays on as one without the expansion.
function migrateOcc(s) {
  const o = s.asc.occ;
  const ok = o && typeof o === "object" && !Array.isArray(o) && o.v === 1 && Number.isInteger(o.wk) && o.wk >= 0 && o.wk < 7 &&
    Number.isInteger(o.sign) && o.sign >= 0 && o.sign < 12 && Array.isArray(o.rites) && o.spheres && typeof o.spheres === "object" && !Array.isArray(o.spheres);
  if (!ok) {
    delete s.asc.occ;
    s.forced = s.forced.filter((id) => !OCC_IDS.has(id));
    if (OCC_IDS.has(s.cardId)) draw(s);
    return;
  }
  const base = freshOcc(s);
  for (const [k, v] of Object.entries(base)) {
    const have = o[k];
    if (have === undefined) o[k] = v;
    else if (Array.isArray(v) && !Array.isArray(have)) o[k] = v;
    else if (v && typeof v === "object" && !Array.isArray(v) && (!have || typeof have !== "object" || Array.isArray(have))) o[k] = v;
    else if (typeof v === "number" && !Number.isFinite(have)) o[k] = v;
  }
  o.rites = o.rites.filter((k) => RITES[k]);
  o.renounced = o.renounced.filter((k) => RITES[k]);
  if (!["serpent", "wisdom", "unsaid"].includes(o.account)) o.account = null;
  for (const p of Object.keys(o.spheres)) if (!SPHERES[p] || !MEANS[o.spheres[p]]) delete o.spheres[p];
  o.debts = o.debts.filter((d) => d && SPHERES[d.p] && Number.isFinite(d.n));
  o.seals = o.seals.filter((x) => typeof x === "string");
  if (o.vessel && !(typeof o.vessel === "object" && s.asc.relics.includes(o.vessel.k))) o.vessel = null;
  o.stones = o.stones.filter((k) => RELICS[k]);
  if (!["evade", "know", "people"].includes(o.will)) o.will = null;
  o.claimed = !!o.claimed;
  o.refuse = !!o.refuse;
}

// The expansion's choices are dusk cards, queued only at fixed points: behind the chapel's reading (or first, without
// one), or first of all (a pair's second card; the second movement's well). Never behind the queue (then), never at an
// Act I nightfall (the Inquisition's dawn ignores the queue), never inside a fight.
function occQueue(s, ids, anchor) {
  const at = anchor === "afterReading" && ARC_IDS.has(s.forced[0]) ? 1 : 0;
  s.forced.splice(at, 0, ...ids);
}
const favorMax = (s) => (riteOn(s, "poverty") ? 3 : 6); // the Vow of Poverty

// The expansion's fx key (occult.js): an object of operations, run in this order.
function occFx(s, v, notes) {
  const o = s.asc.occ;
  if (!o || !v || typeof v !== "object") return;
  if (v.next) s.forced.unshift(v.next);
  // Going down the stair also queues the bench behind the rites, in a run that carries the Depth Pass (ritual.js).
  if (v.next === "o_rites" && s.asc.syn && s.asc.syn.rit) s.forced.splice(1, 0, "o_bench");
  if (v.rit) ritWork(s, v, notes);
  if (v.rite && RITES[v.rite] && !o.rites.includes(v.rite)) {
    o.rites.push(v.rite);
    notes.push(`${RITES[v.rite].name}: ${RITES[v.rite].gift}.`);
    if (v.rite === "poverty" && s.favor > 3) notes.push(`You give away everything past 3 Favor: ${s.favor - 3}.`), (s.favor = 3);
  }
  if (v.lay && o.rites.includes(v.lay)) {
    o.rites = o.rites.filter((k) => k !== v.lay);
    o.renounced.push(v.lay);
    notes.push(`${RITES[v.lay].name}, laid down.`);
  }
  if (v.sabbath) {
    // A rest, not a second one: after a night already rested here, the company and not the sleep.
    applyFx(s, s.restedToday ? { longing: -1 } : OCC_TUNING.sabbath, notes);
    o.sabbath = s.day;
    o.sabbaths++;
    notes.push("The Sabbath: the Whisper can't find you until nightfall.");
  }
  if (v.account) {
    const to = v.account === "other" ? (o.account === "serpent" ? "wisdom" : "serpent") : v.account;
    if (ACCOUNTS[to]) (o.account = to), notes.push(`${ACCOUNTS[to].title}.`);
  }
  // The Office of Seals (occult.js approach): a seal met is met for good.
  if (v.seen && !o.seals.includes(v.seen)) o.seals.push(v.seen);
  if (v.bind && SPHERES[v.bind]) {
    o.spheres[v.bind] = "bound";
    const chain = SPHERES[v.bind].chain;
    s.asc.chains[chain] = (s.asc.chains[chain] || 0) + 1; // a binding is a Chain you gave in to, for the Grammar
  }
  if (v.debt && SPHERES[v.debt]) o.debts.push({ p: v.debt, n: v.n || 1 });
  if (v.ward) o.warded = s.day;
  if (v.defy && SPHERES[v.defy]) (o.defied = s.day), (o.spheres[v.defy] = "defied");
  if (v.release && SPHERES[v.release]) {
    if (o.spheres[v.release] === "bound") {
      const chain = SPHERES[v.release].chain;
      if (s.asc.chains[chain]) s.asc.chains[chain]--;
      applyFx(s, { apo: -1 }, notes);
    }
    o.spheres[v.release] = "released";
  }
  // The Law of the Star: your orbit walked (the Crown Taken unmasked, and laid down), or another's will claimed.
  if (v.walk) {
    o.will = v.walk;
    if (o.rites.includes("crown")) {
      o.rites = o.rites.filter((k) => k !== "crown");
      o.renounced.push("crown");
      applyFx(s, { apo: -2 }, notes);
      notes.push("The Crown Taken was the chair's will, not yours. You put it down: the Pull −2.");
    }
  }
  if (v.claim) o.claimed = true;
}

// The workbench (ritual.js): the card's tracks have already landed (they are the preview); this records the working and
// pays what a track can't say. miss was read when the card was built, before those tracks moved the knowledge.
function ritWork(s, v, notes) {
  const rit = s.asc.syn && s.asc.syn.rit;
  const r = RECIPES.find((x) => x.id === v.rit);
  if (!rit || !r || !RIT_LEVELS.includes(v.lv) || rit.done[r.id]) return;
  const x = r[v.lv].extra || {};
  if (x.ease) s.asc.syn.ease = Math.min(2, s.asc.syn.ease + x.ease);
  if (x.debt && SPHERES[x.debt]) s.asc.occ.debts.push({ p: x.debt, n: 1 });
  if (x.bond) {
    const b = s.spent.find((k) => BONDS[k]);
    if (b) (s.spent = s.spent.filter((k) => k !== b)), s.bonds.push(b);
  }
  rit.done[r.id] = v.lv;
  rit.log.push({ id: r.id, res: v.lv, miss: (Array.isArray(v.miss) ? v.miss : []).filter((m) => m === "hour" || m === "know") });
  rit.log = rit.log.slice(-12);
  notes.push(`${r.name}: ${r[v.lv].say}`);
}

// What the Seven are owed, collected at a fight's start: each debt's garment, as many times as its price, never the
// sixth of anything (the collection never ends the run on its own).
const OWED_CAP = { mark: 5, strain: 5, hollow: 3, cage: 7, apo: 5, longing: 4 };
function collect(s, notes) {
  const o = s.asc.occ;
  for (const d of o.debts.splice(0)) {
    const x = SPHERES[d.p];
    for (const [k, v] of Object.entries(x.lash)) {
      const was = s[k];
      applyFx(s, { [k]: v * d.n }, notes);
      if (k in OWED_CAP && s[k] > Math.max(was, OWED_CAP[k])) s[k] = Math.max(was, OWED_CAP[k]);
      if (k === "favor" && s.favor < Math.min(was, 1)) s.favor = Math.min(was, 1);
    }
    notes.push(`${sphereName(d.p, true)} collects what you owe it.`);
  }
}

// The ascent (occult.js SPHERES): at nightfall the day's sphere, if its gate still holds, is passed by the first means
// that qualifies. Its toll is quiet for the rest of the run. Given back: its track fell today, to its line or under,
// and it's a track the run has shown. Named: the Serpent's account, and enough Gnosis. The Serpent's Key, or a storm,
// laid on today.
function ascend(s, notes) {
  const o = s.asc.occ;
  const p = occDay(s);
  if (!p || o.spheres[p]) return;
  const x = SPHERES[p];
  const k = x.holds;
  const given = s[k] < o.dawn[k] && s[k] <= x.line && shownTrack(s, p) && (p !== "jupiter" || !s.gilt);
  const how = o.storm === s.day ? "stormed" : o.keyed === s.day ? "key" : given ? "given" : o.account === "serpent" && s.gnosis >= OCC_TUNING.nameAt ? "named" : null;
  if (!how) return;
  o.spheres[p] = how;
  const word = { given: `you give back ${x.garment}`, named: "you say its name, and pass", stormed: "stormed", key: "the Serpent's Key opens it" }[how];
  notes.push(`${sphereName(p, true)}'s gate: ${word}. Its toll is quiet now.`);
}

// Refusal (occult.js RITES): the Refuse control, laid on a card as a relic's working is. In a fight the side that
// doesn't answer refuses the intent instead of letting it land (Mark +1; once a phase). On the road it storms the
// day's gate (Strain +1, Mark +1; it falls at nightfall).
export function canRefuse(s) {
  const o = occOf(s);
  if (!o || s.over || !o.rites.includes("refusal")) return { ok: false, why: "" };
  if (o.refuse) return { ok: true, why: "", on: true, kind: s.asc.enc ? "intent" : "gate" };
  const c = currentCard(s);
  if (!c || c.dusk || c.tutorial) return { ok: false, why: "Nothing to refuse at dusk." };
  const e = s.asc.enc;
  if (e) {
    if (c.enc !== e.id || c.forcedOnly || c.final || c.noIntent || !e.intent) return { ok: false, why: "No intent on this card to refuse." };
    if (o.refusedAt === `${e.id}:${e.phase}`) return { ok: false, why: "Once a phase: you've refused here already." };
    return { ok: true, why: "", kind: "intent" };
  }
  if (c.forcedOnly) return { ok: false, why: "Not on this card." };
  if (o.spheres[occDay(s)]) return { ok: false, why: "Today's gate is already passed." };
  if (o.storm === s.day) return { ok: false, why: "You've stormed today's gate already." };
  return { ok: true, why: "", kind: "gate" };
}
export function refuse(s, on = true) {
  const can = canRefuse(s);
  if (!can.ok) return { ok: false, why: can.why };
  s.asc.occ.refuse = !!on;
  return { ok: true, kind: can.kind, on: !!on };
}

// The adversary's clock: its own, or a meter of the run's (the Cage, Apotheosis).
export function encClock(s) {
  const e = s.asc && s.asc.enc;
  if (!e) return 0;
  const c = ENCOUNTERS[e.id].clock;
  return c.key ? s[c.key] : e.clock;
}
function encClockAdd(s, v, notes) {
  const e = s.asc.enc;
  const c = ENCOUNTERS[e.id].clock;
  if (c.key) applyFx(s, { [c.key]: v }, notes);
  else e.clock = clamp(e.clock + v, 0, c.max);
}
const encSnap = (s) => (s.asc.enc ? { id: s.asc.enc.id, clock: encClock(s), roads: { ...s.asc.enc.roads } } : null);

// The Ledger's rule, the Tolerated Line: while it runs, every Favor you gain is also the Ledger +1.
function tolerated(s, n, notes) {
  const e = s.asc.enc;
  if (!e || ENCOUNTERS[e.id].rule !== "tolerated") return;
  e.clock = clamp(e.clock + n, 0, ENCOUNTERS[e.id].clock.max);
  notes.push(`The Tolerated Line: the Ledger +${n}.`);
}

// Free one of the Named: the one named, or the first still held. With nobody left in the margin, somebody else's.
function freeNamed(s, who, notes) {
  const a = s.asc;
  const n = (who && a.named.find((x) => x.n === who && x.st !== "free")) || a.named.find((x) => x.st !== "free");
  if (n) (n.st = "free"), (n.asked = true);
  a.freed++;
  notes.push(n ? (n.heir ? `${n.n} is out: the one who walked it before you.` : `${n.n} is out. One of the Named, freed.`) : "Somebody the roll forgot is out. One of the Named, freed.");
  if (riteOn(s, "named")) applyFx(s, { longing: -1 }, notes), notes.push("Your vow to the Named: Longing −1.");
}

function ascFx(s, k, v, notes) {
  const a = s.asc;
  const e = a.enc;
  switch (k) {
    case "clock":
      if (e) encClockAdd(s, v, notes);
      break;
    case "road":
      if (e) for (const [r, n] of Object.entries(v)) if (r in e.roads) e.roads[r] = clamp(e.roads[r] + n, 0, 9);
      break;
    case "resolve":
      if (e) e.resolve = v;
      break;
    case "spoils":
      if (e) e.spoils = true;
      break;
    case "dossier":
      a.dossier += v;
      break;
    case "free":
      for (let i = 0; i < v; i++) freeNamed(s, null, notes);
      break;
    case "freeName":
      freeNamed(s, v, notes);
      break;
    case "ask": {
      const n = a.named.find((x) => x.n === v);
      if (n) n.asked = true;
      break;
    }
    case "inform": {
      // A name you gave them: someone new in the margin, who can still be got out later.
      const used = new Set(a.named.map((x) => x.n));
      const n = NAMES.find((x) => !used.has(x));
      if (n) a.named.push({ n, end: "named_clerk", st: "held", asked: false, informed: true }), notes.push(`${n} is in the margin now.`);
      break;
    }
    case "seal":
      if (e) e.sealNext = true;
      break;
    case "classify":
      if (e) {
        // A run with synergies remembers what Classify replaced, so the Unseen Countermeasure can give it back exactly.
        if (a.syn) (e.cls = e.cls || {}), v in e.cls || (e.cls[v] = e.mods[v] || 0);
        e.mods[v] = Math.max(-1, (e.mods[v] || 0) - 1);
      }
      break;
    case "pattern":
      if (e) (e.pattern = v), (e.patternAt = e.turn + 1);
      break;
    case "relic":
      gainRelic(s, v, notes);
      break;
    case "choose":
      if (ROADS[v]) {
        a.road = v;
        enterAct(s, 2);
        notes.push(`Act II · Death. ${ROADS[v].name}.`);
        // The expansion (occult.js): the well past the Warrens, and the two accounts of the Architect.
        if (a.occ && !a.occ.account && OCC_TUNING.well) occQueue(s, ["o_voices"], "front");
        // Strategic preparation (prep.js): a night spent preparing at the first chapel buys an Hour against this road's keeper.
        if (a.syn && a.syn.prep && a.occ && a.occ.chapel === 1 && a.occ.prepared === 1) s.forced.push("d_hour");
      }
      break;
    case "camp":
      // The first chapel: you can feel the chair from here, and the Pull is shown from now on. The second: Act III.
      // Each turns the reading's next card (arcana.js): the Trial over Death, the Verdict over Temperance.
      if (s.arc && reading(s)) s.forced.unshift(a.act === 1 ? "r_trial" : "r_verdict");
      // The expansion (occult.js): the stair under the chapel, after the reading; at the second, the Law of the Star after
      // the rite, and the relic in the vessel comes out as its Stone.
      if (a.occ) {
        const o = a.occ;
        o.chapel = Math.min(2, a.act);
        if (OCC_TUNING.stair) occQueue(s, o.chapel === 2 ? ["o_stair", "o_star"] : ["o_stair"], "afterReading");
        if (o.chapel === 2 && o.vessel) {
          const k = o.vessel.k;
          o.vessel = null;
          o.stones.push(k);
          a.charges[k] = 1;
          notes.push(`${RELICS[k].name} comes out of the vessel as ${STONES[k].name}: ${STONES[k].works}, once.`);
        }
      }
      if (a.act === 1) a.apoSeen = true;
      if (a.act === 2) enterAct(s, 3), notes.push(`${ACTS[3].name}. The festival of the false sun.`);
      a.spoils = false;
      break;
    case "decline":
      if (!a.declined.includes(v)) a.declined.push(v);
      break;
    case "refill":
      if (a.occ) a.occ.prepared = a.occ.chapel;
      // A Stone works once (occult.js); a relic refined from the Spoils (prep.js) holds one use more.
      for (const r of a.relics) if (!isStone(s, r)) a.charges[r] = RELICS[r].uses + ((a.syn && a.syn.prep && a.syn.prep.plus[r]) || 0);
      if (a.relics.length) notes.push("Your relics are ready again.");
      // The second chapel's Prepare buys an Hour against the Grammar (prep.js).
      if (a.act === 3 && a.syn && a.syn.prep && a.occ) s.forced.push("d_hour");
      break;
    case "gilt":
      s.gilt = (s.gilt || 0) + v;
      if (v > 0) notes.push(`Gilt: ${s.gilt} owed at the Reckoning.`);
      break;
    case "halve": {
      const was = s.favor;
      s.favor = Math.floor(s.favor / 2);
      if (s.favor !== was) notes.push(`Favor halved: ${was} to ${s.favor}.`);
      break;
    }
    case "hollowTo":
      if (s.hollow > v) s.hollow = v;
      break;
    case "loseBond":
      if (s.bonds.length) {
        const b = s.bonds.pop();
        notes.push(`${BONDS[b].name} heard what you said. That Bond is gone: not spent, lost.`);
      }
      break;
    case "force":
      a.force = true;
      break;
    case "forceEnd":
      s.over = s.over || (s.apo <= 2 && witness(s) ? "flicker" : "decree");
      break;
    case "occ":
      occFx(s, v, notes);
      break;
    case "prep":
      prepFx(s, v, notes);
      break;
    case "brd":
      brdFx(s, v);
      break;
  }
}

// The Breadth Pass's one fx (breadth.js): a thread begun or ended, and how a person stands with you. Silent: the
// city's memory shows only in the cards it deals later. Bounded by the threads and people the data defines.
function brdFx(s, v) {
  const b = s.asc.brd;
  if (!b || !v || typeof v !== "object") return;
  if (v.clear && BRD_KEYS.has(v.clear)) delete b.t[v.clear];
  if (v.owe && BRD_KEYS.has(v.owe)) b.t[v.owe] = s.draws | 0;
  for (const [id, n] of Object.entries(v.npc || {})) {
    if (!Object.hasOwn(BRD_PEOPLE, id) || !Number.isInteger(n)) continue;
    const r = Math.max(-2, Math.min(3, (b.npc[id] | 0) + n));
    if (r) b.npc[id] = r;
    else delete b.npc[id];
  }
}

// What a preparation's price lands on this board (prep.js prices its cards' words with it): the same applyFx the
// choice runs, on a copy.
prepHost.land = (s, fx) => applyFx(JSON.parse(JSON.stringify(s)), fx, []);
// Strategic preparation's fx key (prep.js): the Hour spent, and what it readied for the next fight.
function prepFx(s, v, notes) {
  const p = s.asc.syn && s.asc.syn.prep;
  if (!p || !v || typeof v !== "object") return;
  if (v.hour === 1 || v.hour === 2) p.hours[v.hour] = true;
  if (v.spoils === "relic" || v.spoils === "cut" || v.spoils === "refine") {
    const a = s.asc;
    p.spoils = Math.min(2, p.spoils + 1);
    if (v.spoils === "cut" && v.chain && !a.struck.includes(v.chain) && a.struck.length < 6) a.struck.push(v.chain), (a.spoils = false), notes.push("A Chain struck: the Grammar can't say it.");
    if (v.spoils === "refine" && RELICS[v.relic]) {
      p.plus[v.relic] = 1;
      a.spoils = false;
      // -d3: the use is in hand at once (never past the refined uses), and still one more at each Prepare.
      const now = a.syn.v >= 3 && a.relics.includes(v.relic) && !isStone(s, v.relic);
      if (now) a.charges[v.relic] = Math.min((a.charges[v.relic] || 0) + 1, RELICS[v.relic].uses + 1);
      notes.push(`${RELICS[v.relic].name}: one use more${now ? " now, and" : ""} each time it is readied.`);
    }
  }
  if (v.ready && ENCOUNTERS[v.ready.enc]) {
    p.ready = { enc: v.ready.enc, kind: v.ready.kind === "read" ? "read" : "strike", strike: [...(v.ready.strike || [])].filter((k) => INTENTS[k]) };
    notes.push(`Ready for ${ENCOUNTERS[v.ready.enc].name || v.ready.enc}: ${p.ready.kind === "read" ? "the intent after next will show" : "one of its intents is struck"}.`);
  }
}

function enterAct(s, n) {
  const a = s.asc;
  a.act = n;
  a.actCards = 0;
  // A thread (breadth.js) whose answer can't come in the new movement is let go, so none is left waiting forever.
  if (a.brd) for (const k of Object.keys(a.brd.t)) if (!BRD_THREADS[k].cards.slice(1).some((id) => !BY_ID[id].act || BY_ID[id].act.includes(n))) delete a.brd.t[k];
}

function gainRelic(s, k, notes) {
  const a = s.asc;
  if (!RELICS[k] || a.relics.includes(k)) return;
  if (a.relics.length >= relicCap(s)) {
    // Never the relic in the vessel (occult.js).
    const gone = looseRelics(s)[0];
    if (!gone) return void notes.push(`There's no room: the vessel holds what you carry.`);
    a.relics = a.relics.filter((r) => r !== gone);
    delete a.charges[gone];
    notes.push(`You leave ${RELICS[gone].name.replace(/^The /, "the ")} behind.`);
  }
  a.relics.push(k);
  a.charges[k] = RELICS[k].uses;
  if (RELICS[k].pull) a.apoSeen = true; // it trades in Apotheosis: carrying it shows the Pull
  notes.push(`${RELICS[k].name}: ${RELICS[k].works}, for ${RELICS[k].price}.`);
}

// A win reached on the long road is offered as a card, once. During a fight it waits for the fight to end.
function ascOffer(s, k) {
  const a = s.asc;
  if (a.offered.includes(k) || a.declined.includes(k)) return;
  a.offered.push(k);
  if (a.enc) a.pending.push("a_" + k);
  else s.forced.push("a_" + k);
}

// Which Mask the run leaned on, by the rolls her +1 helped: the adversary comes ready for her. The Bare Face never
// has a +1, so she's never countered. Three Masks rolling and none over two in five: it can't decide what you are.
function counterOf(s, def) {
  if (riteOn(s, "name") || s.mask === "venefica") return null; // the Taken Name or unified Lux Venefica: there's no single-Mask file on who you are now
  const u = s.asc.hist.used;
  const masks = ["nyx", "eris", "lilith"];
  const total = masks.reduce((n, m) => n + u[m], 0);
  if (total < 4) return null;
  if (def.counter.mixed && masks.every((m) => u[m] > 0 && u[m] <= total * 0.4)) return "mixed";
  const top = masks.reduce((a, b) => (u[b] > u[a] ? b : a));
  return u[top] >= total * 0.5 && def.counter[top] ? top : null;
}

// The intents this phase can show, each as many times as its weight (a Chain you gave in to, twice as often).
// What the phase can show. A struck intent (the Unfiled Name) is out of the fight's bag, but never the last one: a bag
// the strikes would empty is the whole bag (raw: what the strikes leave, which can be nothing, for the synergy's check).
function intentBag(s, e, raw = false) {
  const a = s.asc;
  const all = (ENCOUNTERS[e.id].phases[e.phase].intents || []).filter((k) => (!INTENTS[k].when || INTENTS[k].when(s)) && !a.struck.includes(INTENTS[k].chain));
  const left = e.strike ? all.filter((k) => !e.strike.includes(k)) : all;
  const ids = left.length || raw ? left : all;
  return ids.flatMap((k) => Array((INTENTS[k].weight || 1) * (INTENTS[k].chain && a.chains[INTENTS[k].chain] ? 2 : 1)).fill(k));
}
const pick = (s, e, salt, xs) => (xs.length ? xs[hashSeed(`${s.seedLabel}:${e.id}:${salt}`) % xs.length] : null);
// The intent telegraphed for the next fight card ("next: Seal").
function telegraph(s, e) {
  e.next = pick(s, e, e.turn + 1, intentBag(s, e));
  // A Read readied at a chapel (prep.js): the intent after next, by the same pick the next turn will make if nothing
  // changes the bag. Shown as "then, likely"; a fight card can still re-pick (ascAfterDraw).
  if (e.read) e.next2 = pick(s, e, e.turn + 2, intentBag(s, e));
}

// ---------- the Depth Pass (synergy.js) ----------
synHost.bag = (s, e) => intentBag(s, e, true);
synHost.people = (e) => Object.keys(ENCOUNTERS[e.id].roads).find((k) => ENCOUNTERS[e.id].roads[k].kind === "people") || null;
// What each synergy does, inside the path that prices the card it rides: every one is a handful of ordinary fx, so the
// preview (choose on a copy), canWork (working on a copy) and checkEnd see exactly what the play will.
const SYN_FX = {
  unfiled(s, ctx, notes) {
    const e = s.asc.enc;
    (e.strike = e.strike || []).push(e.next);
    s.asc.charges.glass--;
    applyFx(s, { longing: 1 }, notes);
    telegraph(s, e);
  },
  throne(s, ctx, notes) {
    if (ctx.finish) return applyFx(s, { apo: 1 }, notes);
    s.asc.charges.halo--;
    s.asc.syn.ease = 1;
    applyFx(s, { apo: -1 }, notes);
  },
  witness(s, ctx, notes) {
    const e = s.asc.enc;
    const b = witnessBond(s);
    const road = synHost.people(e);
    e.roads[road] = Math.min(e.need[road], e.roads[road] + 1);
    s.asc.syn.witnessed.push(b);
  },
  revelation(s) {
    s.asc.syn.laid = "revelation";
  },
  countermeasure(s, ctx, notes) {
    const e = s.asc.enc;
    if (e) {
      e.pattern = null;
      for (const [k, was] of liftable(e)) e.mods[k] = was;
    } else applyFx(s, { mark: -1 }, notes);
    applyFx(s, { strain: 1 }, notes);
  },
  hand(s, ctx) {
    const e = s.asc.enc;
    const road = synHost.people(e);
    e.roads[road] = Math.min(e.need[road], e.roads[road] + 1);
  },
  velvet(s, ctx, notes) {
    applyFx(s, { clock: -1, strain: 1, longing: 1 }, notes);
  },
};
// Fire the hook's synergies in table order, each re-asked just before it fires (an earlier one can change what a later
// one needs), each at most once. The limit is spent, the count kept, and the toast names the synergy.
function synFire(s, hook, ctx, notes) {
  if (!s.asc || !s.asc.syn) return;
  for (const x of SYNERGIES) {
    if (x.hook !== hook || !x.needs(s, ctx)) continue;
    const key = limitKey(s, x);
    SYN_FX[x.id](s, ctx, notes);
    if (key && x.limit !== "none") s.asc.syn.used[key] = true;
    s.asc.syn.fired[x.id] = (s.asc.syn.fired[x.id] || 0) + 1;
    notes.push(`${x.name}: ${x.note}`);
  }
}

function startEnc(s, id) {
  const a = s.asc;
  const def = ENCOUNTERS[id];
  const e = {
    id, phase: 0, clock: 0, roads: {}, need: {}, intent: null, next: null, turn: 0, mods: {},
    pattern: null, patternAt: -1, sealNext: false, sealed: null, resolve: null, done: null, spoils: false, auditing: false, counter: null,
  };
  // A run with synergies numbers its fights: the id persists with the save, and a once-a-fight limit is kept against it.
  if (a.syn) e.uid = ++a.syn.seq;
  // People roads start with a pip if you've freed any of the Named; under No Sanctuary (Edict 7) they start empty.
  // Judgement (arcana.js), once, on the next adversary: upright the Named answer, two pips more; reversed nobody
  // rises, and its people road starts empty.
  const judged = s.arc && s.arc.judged ? arcOn(s, "judgement") : null;
  if (judged) s.arc.judged = false;
  // The Vow to the Named (occult.js RITES): people roads need 1 fewer, never below 2. A start never fills a road.
  for (const [k, r] of Object.entries(def.roads)) {
    e.need[k] = r.kind === "people" && riteOn(s, "named") ? Math.max(2, r.need - 1) : r.need;
    e.roads[k] = r.kind !== "people" || judged === "rev" ? 0 : Math.min(e.need[k] - 1, (edict(s, 7) ? 0 : Math.min(1, a.freed)) + (judged === "up" ? 2 : 0));
  }
  a.enc = e;
  // Open Files (Edict 2): the adversary's own clock starts 1 higher.
  if (!def.clock.key) e.clock = clamp(def.start(s) + a.carry + (edict(s, 2) ? 1 : 0), 0, def.clock.max - 1);
  a.carry = 0;
  // The Tower, read: the next adversary's clock starts 2 lower (upright) or 2 higher (reversed), never full.
  if (s.arc && s.arc.tower) {
    const v = arcOn(s, "tower") === "up" ? -2 : 2;
    s.arc.tower = false;
    if (def.clock.key) s[def.clock.key] = clamp(s[def.clock.key] + v, 0, def.clock.max - 1);
    else e.clock = clamp(e.clock + v, 0, def.clock.max - 1);
  }
  const c = counterOf(s, def);
  if (c) {
    const k = def.counter[c];
    e.counter = c;
    Object.assign(e.mods, k.mods || {});
    if (k.clock) e.clock = Math.max(0, e.clock + k.clock);
    if (k.cage) s.cage = Math.max(0, s.cage + k.cage);
  }
  // The Empty Throne, stopped: the fight after it begins a step later.
  if (a.syn && a.syn.ease > 0) {
    if (!def.clock.key) e.clock = clamp(e.clock - a.syn.ease, 0, def.clock.max - 1);
    a.syn.ease = 0;
  }
  // Strategic preparation (prep.js): what the Hour readied lands on its own adversary, once; on any other it is gone.
  const p = a.syn && a.syn.prep;
  if (p) {
    const r = p.ready;
    p.ready = null;
    const log = (p.log[id] ||= { did: null, won: false });
    if (r && r.enc === id) {
      if (r.kind === "read") e.read = true;
      else if (r.strike.length) e.strike = [...new Set([...(e.strike || []), ...r.strike])];
      log.did = r.kind;
    }
  }
  telegraph(s, e);
  if (def.phases[0].open) s.forced.unshift(def.phases[0].open);
}

// The Oldest Trap, four rungs: Grandiosity, the temptation the run's history calls for, the Gate, the Chair (with a
// Double Crown offer you were holding dealt just before the Gate).
function startTrap(s) {
  const a = s.asc;
  a.apoSeen = true;
  startEnc(s, "trap");
  // The expansion (occult.js occRung) picks the second rung from the spheres that still hold you.
  s.forced.unshift("tr_grand", a.occ ? occRung(s, temptation(s)) : temptation(s), ...a.pending.splice(0), "a_gate", "a_chair");
}

// An exit's own price lands with everything that shifts it (a reversed Temperance, a Hierophant, a Minor), and is
// then held under the sixth: neither exit's own price ends the run.
function exitPrice(s, k, v, notes) {
  const was = s[k];
  applyFx(s, { [k]: v }, notes);
  if (s[k] > Math.max(was, 5)) s[k] = Math.max(was, 5);
}

function resolveEnc(s, k, notes, finish = false, spoils = false) {
  const a = s.asc;
  const e = a.enc;
  const def = ENCOUNTERS[e.id];
  if (!def.outcomes[k]) k = "fled";
  const out = def.outcomes[k];
  const road = def.roads[k];
  a.enc = null;
  a.met.push({ id: e.id, out: k, finished: !!finish });
  if (a.syn && a.syn.prep && a.syn.prep.log[e.id]) a.syn.prep.log[e.id].won = !!(road || k === "unfiled");
  if (out.text) notes.push(`${out.title}. ${out.text}`);
  // A road pays by its kind (ascension.js PAY); finishing it pays that twice. Disengaging pays in knowing what you
  // walked away from; being driven out costs Mark, and the next fight starts higher. Neither exit's own price ends the
  // run: it never takes the last Favor (the fight's night would be Destitute) or the last Mark.
  if (road) for (let i = 0; i < (finish ? 2 : 1); i++) applyFx(s, PAY[road.kind], notes);
  // The Law of the Star (occult.js): on your orbit's road, stopping is pure will (Gnosis +1); finishing is the lust of
  // the result (the Pull +1 more).
  const will = a.occ && road && a.occ.will === road.kind;
  if (will && finish) applyFx(s, { apo: 1 }, notes), notes.push("Your own orbit, finished for the result: the Pull +1 more.");
  else if (will) applyFx(s, { gnosis: 1 }, notes), notes.push("Your own orbit, and you stopped: Gnosis +1.");
  // The Hanged Man (arcana.js): upright, letting go pays Gnosis +1 more and keeps your Favor; reversed, it costs
  // Strain +2, never the sixth (neither exit's own price ends the run).
  const hanged = s.arc ? arcOn(s, "hanged") : null;
  if (k === "fled") a.fled.push(e.id), applyFx(s, hanged === "up" ? { gnosis: 2 } : { gnosis: 1, favor: s.favor > 1 ? -1 : 0 }, notes);
  if (k === "fled" && hanged === "rev") exitPrice(s, "strain", Math.max(0, Math.min(2, 5 - s.strain - (s.hollow >= 2 ? 1 : 0))), notes);
  // The Vow to the Named (occult.js RITES): walking out on them costs, never the sixth.
  if (k === "fled" && riteOn(s, "named")) {
    const was = s.strain;
    exitPrice(s, "strain", Math.max(0, Math.min(2, 5 - s.strain - (s.hollow >= 2 ? 1 : 0))), notes);
    if (s.strain > was) notes.push(`Your vow: walking out on them costs Strain +${s.strain - was}.`);
  }
  if (k === "driven") (a.carry = 1), exitPrice(s, "mark", Math.max(0, Math.min(2, 5 - s.mark)), notes);
  applyFx(s, out.fx, notes);
  if (finish) a.escalated++;
  if (e.id === "inquisition") a.after = road ? road.kind : k === "fled" || k === "driven" ? "fled" : null;
  a.spoils = !!(spoils && (road || k === "unfiled"));
  if (a.spoils) a.offer = relicPair(s, `spoils:${a.act}`);
  if (s.over) return;
  // Won, the night that falls as the fight ends is a rested one.
  if (road || k === "unfiled") s.restedToday = true;
  // What comes next: the chapel's night, then the road out of the Warrens; the chapel after Act II, then Rex Mundi;
  // the Grammar to the Festival (by force, first, if you cut it); the Festival to the Oldest Trap.
  // With both ways through order still sealed, the Warrens open straight onto the almoner's crossroads.
  const routes = ORDER_ROADS.every((r) => a.locked.includes(r)) ? "a_cross" : "a_routes";
  // The Spoils (prep.js), a choice in place of the relic alone, before the chapel. Queued on the won fight and judged
  // when dealt (draw() skips them without two sides to take): the fight's night can change what the run can pay.
  const sp = a.spoils && a.syn && a.syn.prep && a.syn.prep.spoils < 2 && !s.forced.includes("d_spoils") ? ["d_spoils"] : [];
  if (e.id === "inquisition") s.forced.push(...sp, "a_camp", ...a.pending.splice(0), routes);
  else if (def.act === 2) s.forced.push(...sp, "a_camp", ...a.pending.splice(0));
  else if (e.id === "grammar") {
    startEnc(s, "festival");
    applyFx(s, { mark: -1 }, notes);
    notes.push("The festival: the patrols are distracted. Mark −1.");
    if (a.force && k === "cut") s.forced.unshift("a_force");
  } else if (e.id === "festival") startTrap(s);
}

// After a card on the long road: history, the act's count, and the fight's intent, clock, roads and phases.
function ascTurn(s, card, ch, side, roll, before, encBefore, notes) {
  const a = s.asc;
  const h = a.hist;
  h[s.mask] = (h[s.mask] || 0) + 1;
  const cm = maskOf(s.mask);
  if (roll && answers(s)) {
    if (cm.stat === "all" && ["shade", "steel", "freq"].includes(roll.stat)) {
      h.used[roll.stat === "shade" ? "nyx" : roll.stat === "steel" ? "eris" : "lilith"]++;
    } else if (cm && cm.stat === roll.stat) {
      h.used[s.mask]++;
    }
  }
  if (card.tier >= 2) h.wolves++;
  if (card.id === "whisper" && side === "left" && roll && roll.tier !== "miss" && roll.tier !== "ruin") h.held++;
  if (card.id === "cutchain" && roll && (roll.tier === "hit" || roll.tier === "radiance")) {
    h.cut++;
    // A Chain cut on the road is one the Grammar can't speak (the heaviest you gave in to; it keeps at least two).
    const heavy = Object.keys(a.chains).filter((c) => !a.struck.includes(c)).sort((x, y) => a.chains[y] - a.chains[x])[0];
    if (heavy && a.struck.length < 6) a.struck.push(heavy);
  }
  const gave = COMPLY[card.id] && COMPLY[card.id][side];
  // The Devil (arcana.js): upright every Chain you give in to counts twice; reversed, the next one is struck instead.
  if (gave && s.arc && s.arc.devil) {
    s.arc.devil = false;
    if (!a.struck.includes(gave)) a.struck.push(gave);
    notes.push("The Devil, reversed: you saw the chain as you took it. The Grammar can't speak it.");
  } else if (gave) a.chains[gave] = (a.chains[gave] || 0) + (s.arc && arcOn(s, "devil") === "up" ? 2 : 1);
  if (ECHO[card.id] === side) a.echo = ch.label;
  if (a.act === 1 && !a.enc && card.named && s.mark > before.mark) a.dossier++;
  if (!a.enc && !card.forcedOnly && !card.tutorial) a.actCards++;
  const armed = a.armed;
  a.armed = null;
  const refusing = !!(a.occ && a.occ.refuse);
  if (a.occ) a.occ.refuse = false;
  const e = a.enc;
  if (!e) {
    // Refusal on the road: today's gate is stormed (occult.js RITES).
    if (refusing) applyFx(s, { strain: 1, mark: 1 }, notes), (a.occ.storm = s.day), notes.push(`You refuse ${sphereName(occDay(s))} its due. Strain +1, Mark +1. Its gate falls at nightfall.`);
    return null;
  }
  // The stop: a road filled last card. Stop there, or finish it.
  if (card.stop && e.done) {
    const k = e.done;
    const snap = { clock: encClock(s), roads: { ...e.roads } };
    const finish = !!(ch.fx && ch.fx.finish);
    resolveEnc(s, k, notes, finish, true);
    synFire(s, "stop", { finish }, notes);
    return { intent: null, answered: false, resolved: k, snap };
  }
  if (card.enc !== e.id) return null;
  if (card.id === BOND_CARD.id) {
    const offer = bondOffer(s);
    if (!offer || !spend(s, offer.bond, notes, offer.slip)) return null;
    s.flags[`seen_bond_${offer.bond}`] = true;
    s.flags[`resolved_bond_${e.id}`] = true;
    const snap = { clock: encClock(s), roads: { ...e.roads, [offer.road]: e.need[offer.road] } };
    resolveEnc(s, offer.road, notes, false, true);
    synFire(s, "stop", { finish: false }, notes);
    return { intent: null, answered: false, resolved: offer.road, snap };
  }
  const def = ENCOUNTERS[e.id];
  const out = { intent: e.intent, answered: false };
  if (e.turn === 0 && a.occ && a.occ.debts.length) collect(s, notes); // the Seven collect as the fight opens (occult.js)
  if (e.sealed === side) {
    // Breaking a seal: the price, or, for a run with the Depth Pass whose Mask is Eris, the Velvet Intervention's price in its place.
    if (synergiesFor(s, "seal").length) synFire(s, "seal", {}, notes), notes.push("You break the seal.");
    else applyFx(s, { strain: 2 }, notes), notes.push("You break the seal.");
  }
  e.sealed = null;
  const it = e.intent && INTENTS[e.intent];
  if (it) {
    if (armed === "key") (out.answered = true), notes.push(`The Ophite Key: the ${it.name} doesn't land.`);
    else if (ch.verb && it.by.includes(ch.verb)) (out.answered = true), notes.push(`You answer the ${it.name}.`);
    else if (ch.fx && ch.fx.resolve === "fled") notes.push(`You're gone before the ${it.name} lands.`);
    else if (refusing)
      (out.answered = true), (out.refused = true), (a.occ.refusedAt = `${e.id}:${e.phase}`), notes.push(`You refuse the ${it.name}. It doesn't land, and they saw you refuse it: Mark +1.`), applyFx(s, { mark: 1 }, notes);
    else notes.push(`${def.short}: ${it.name}.`), applyFx(s, it.relief && riteOn(s, "fast") ? { clock: it.fx.clock } : it.fx, notes);
  }
  // Momentum: a side that answers builds at most +1; a side that rolled and pressed on while it landed builds +1
  // more on a hit or 7–9.
  if (encBefore && encBefore.id === e.id) {
    const gained = Object.keys(e.roads).filter((k) => e.roads[k] > encBefore.roads[k]);
    if (gained.length && out.answered) {
      let cut = gained.reduce((n, k) => n + e.roads[k] - encBefore.roads[k], 0) - 1;
      for (const k of gained) while (cut > 0 && e.roads[k] > encBefore.roads[k]) e.roads[k]--, cut--;
    } else if (gained.length && it && roll && roll.tier !== "miss" && roll.tier !== "ruin") {
      e.roads[gained[0]] += 1;
      notes.push(`You pressed on while it landed: ${def.roads[gained[0]].label} +1.`);
    }
  }
  if (out.refused) synFire(s, "refuse", {}, notes);
  e.intent = null;
  e.turn++;
  out.snap = { clock: encClock(s), roads: { ...e.roads } };
  if (s.over) return out;
  // A card that ends the fight ends it, before the clock is read: the Audit's answer, a last card, a Disengage.
  if (e.resolve) {
    const best = encBestRoad(s);
    const k = e.resolve === "best" ? best || "fled" : e.resolve;
    out.resolved = k;
    resolveEnc(s, k, notes, false, e.spoils);
    return out;
  }
  // The clock full: the adversary's ending for this phase, or its card (the Ledger's Audit). A meter's clock (the
  // Cage, the Pull) ends through checkEnd, as it always has.
  if (!def.clock.key && e.clock >= def.clock.max) {
    if (def.clock.full) {
      if (!e.auditing) (e.auditing = true), s.forced.unshift(def.clock.full);
      return out;
    }
    s.over = def.clock.ends ? def.clock.ends[e.phase] : def.clock.end;
    return out;
  }
  if (def.unfiled && def.unfiled(s)) {
    out.resolved = "unfiled";
    resolveEnc(s, "unfiled", notes, false, true);
    return out;
  }
  const full = Object.keys(e.roads).find((k) => e.roads[k] >= e.need[k]);
  if (full && !e.done) {
    // A road is full: the next card asks whether you're done (DEFINE THE STOP).
    e.done = full;
    s.forced.unshift("a_stop");
    return out;
  }
  // Phases: the next turns on its condition; by the cap the last is forced. Nothing runs forever.
  const last = def.phases.length - 1;
  let to = e.phase;
  while (to < last && def.phases[to + 1].when && def.phases[to + 1].when(e, s)) to++;
  if (e.turn >= def.cap - 1) to = last;
  if (to !== e.phase) {
    e.phase = to;
    notes.push(`${def.short}: ${def.phases[to].name}.`);
    if (def.phases[to].open) s.forced.unshift(def.phases[to].open);
  }
  telegraph(s, e);
  if (bondOffer(s)) s.forced.unshift(BOND_CARD.id);
  return out;
}

function encReport(s, b, turn) {
  const e = s.asc.enc;
  const id = (b && b.id) || (e && e.id);
  if (!id) return null;
  const now = turn && turn.snap ? turn.snap : e && e.id === id ? { clock: encClock(s), roads: e.roads } : null;
  const clock = b && now ? now.clock - b.clock : 0;
  const roads = {};
  if (b && now) for (const k of Object.keys(now.roads || {})) if (now.roads[k] !== b.roads[k]) roads[k] = now.roads[k] - b.roads[k];
  return { id, clock, roads, intent: turn ? turn.intent : null, answered: !!(turn && turn.answered), refused: !!(turn && turn.refused), resolved: (turn && turn.resolved) || null };
}

// Adversaries arrive: the Inquisition at a dawn; the others as soon as the road allows and nothing is queued.
function ascBeforeDraw(s) {
  const a = s.asc;
  if (a.enc || s.over) return;
  const act = ACTS[a.act];
  if (act.dawn ? s.bell !== 0 : s.forced.length) return;
  if (a.act === 2 && !a.road) return;
  if (a.met.some((m) => ENCOUNTERS[m.id].act === a.act)) return;
  if (!act.arrive(s)) return;
  startEnc(s, a.act === 2 ? ROADS[a.road].enc : act.enc);
}

// The rest of the long road's deck: the whole ordinary deck, plus this act's own cards (and the road's).
// With the expansion, its own road cards too (occult.js).
const ascPool = (s) => {
  const fits = (c) => !c.enc && !c.forcedOnly && (!c.act || c.act.includes(s.asc.act)) && (!c.road || c.road === s.asc.road);
  const pool = CARDS.concat(ASC_CARDS.filter(fits));
  const occ = occOn(s) ? pool.concat(OCC_CARDS.filter(fits)) : pool;
  // The Breadth Pass (breadth.js): the city's places and people, on rules 4 only.
  return brdOn(s) ? occ.concat(BRD_CARDS.filter(fits)) : occ;
};
const ascBoost = (s, c) =>
  (s.asc.act === 2 && s.asc.road ? ROADS[s.asc.road].boost[c.id] || 1 : 1) *
  (c.place && brdOn(s) ? brdWeight(s, c) : 1) *
  (uniOn(s) && c.id === "venefica1" && ACTIVE_MASKS.every((k) => s.asc.uni.worn.includes(k)) ? 4 : 1);

// The card with its own build() applied, but before the fight's last-two rule (encWrap): what the intent reads.
const rawCard = (s) => {
  const c = BY_ID[s.cardId];
  return c && c.build ? c.build(s) : c;
};
const splits = (c, k) => !!(c && k && ["left", "right"].filter((side) => c[side].verb && INTENTS[k].by.includes(c[side].verb)).length === 1);

// A fight deals from its own cards: this phase's, ones it can deal now, not the last two it dealt, preferring a card
// that the telegraphed intent splits (one side answers it, one doesn't).
function encDraw(s) {
  const e = s.asc.enc;
  const fits = (c, fresh) =>
    c.enc === e.id && !c.forcedOnly && c.phase.includes(e.phase) && (!c.when || c.when(s)) && !(c.once && s.flags["seen_" + c.id]) && (!fresh || !s.recent.slice(0, 2).includes(c.id));
  let pool = ASC_CARDS.filter((c) => fits(c, true));
  if (!pool.length) pool = ASC_CARDS.filter((c) => fits(c, false));
  if (!pool.length) return null;
  const split = pool.filter((c) => splits(c.build ? c.build(s) : c, e.next));
  if (split.length) pool = split;
  const w = pool.map((c) => Math.max(0, typeof c.weight === "function" ? c.weight(s) : c.weight ?? 1));
  let r = deckRand(s) * w.reduce((x, y) => x + y, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= w[i]) <= 0) return pool[i].id;
  return pool[pool.length - 1].id;
}

// The intent on this card (the telegraphed one, if this card splits it), and the seal a landed Seal left: it falls
// on the side that would answer, so answering costs.
function ascAfterDraw(s) {
  const e = s.asc.enc;
  if (!e) return;
  const c = rawCard(s);
  e.intent = null;
  if (!c || c.enc !== e.id || c.noIntent) return;
  if (splits(c, e.next)) e.intent = e.next;
  else {
    const bag = intentBag(s, e);
    e.intent = pick(s, e, `re${e.turn}`, bag.filter((k) => splits(c, k))) || pick(s, e, `any${e.turn}`, bag);
  }
  if (e.sealNext && !c.forcedOnly && !c.final && e.intent) {
    e.sealed = ["left", "right"].find((side) => c[side].verb && INTENTS[e.intent].by.includes(c[side].verb)) || null;
    e.sealNext = false;
  }
}

// Two from a full clock, a fight card offers a way out: its side that doesn't answer becomes Disengage.
function encWrap(s, c) {
  const e = s.asc.enc;
  if (!e || !c || c.enc !== e.id || c.forcedOnly || c.final || !e.intent || e.id === "trap") return c;
  const def = ENCOUNTERS[e.id];
  if (encClock(s) < def.clock.max - 2) return c;
  const ans = ["left", "right"].filter((side) => c[side].verb && INTENTS[e.intent].by.includes(c[side].verb));
  if (ans.length !== 1) return c;
  const other = ans[0] === "left" ? "right" : "left";
  return { ...c, [other]: { label: "Disengage", verb: "flee", fx: { resolve: "fled" }, text: "Never escalate inside a system that has already turned on you. You keep what you know and walk." } };
}

// ---------- workings ----------
// Whether a relic can be worked now, and why not. work() works it; transmute() destroys it for good, toward freedom.
export function canWork(s, k) {
  const a = s.asc;
  if (!a || s.over || !a.relics.includes(k)) return { ok: false, why: "" };
  if (s.cardId === BOND_CARD.id) return { ok: false, why: "Answer the offer of help first." };
  if (inVessel(s, k)) return { ok: false, why: "In the vessel until the second chapel." };
  const stone = isStone(s, k);
  if (!(a.charges[k] > 0)) return { ok: false, why: stone ? "A Stone works once, and this one has." : "Used up. A chapel's Prepare readies your relics again." };
  if (a.armed) return { ok: false, why: "A working is already laid on this card." };
  const e = a.enc;
  const c = currentCard(s);
  const rolls = c && ["left", "right"].some((side) => c[side].roll);
  if ((k === "glass" || k === "crown") && !rolls) return { ok: false, why: "Nothing on this card rolls." };
  const keyCard = !!(e && c && c.enc === e.id && !c.forcedOnly && !c.final && !c.noIntent && (e.sealed || e.intent));
  if (k === "key" && stone && !e) {
    if (a.occ.spheres[occDay(s)] || a.occ.keyed === s.day) return { ok: false, why: "Today's gate is already open." };
  } else if (k === "key" && !keyCard) return { ok: false, why: "No intent or seal on this card for the Key." };
  if (k === "lamp" && stone && !(s.spent || []).length) return { ok: false, why: "No spent Bond to bring back." };
  if (k === "halo" && e && e.id === "trap") return { ok: false, why: "The chair doesn't take bribes." };
  if (k === "purse" && riteOn(s, "poverty")) return { ok: false, why: "Your vow: the Purse stays shut." };
  if (RELICS[k].brd) {
    const fee = -(relicPrice(s, k).favor || 0);
    if (fee > 0 && s.favor < fee) return { ok: false, why: `${RELICS[k].name} costs ${fee} Favor, and you have ${s.favor ? "only " + s.favor : "none"}.` };
    if (((RELICS[k].fx || {}).work || {}).rest && s.restedToday) return { ok: false, why: "Tonight is already a rested one." };
  }
  const lampFee = -(relicPrice(s, k).favor || 0);
  if (k === "lamp" && !stone && s.favor < lampFee) return { ok: false, why: `The Lamp costs ${lampFee} Favor, and you have ${s.favor ? "only " + s.favor : "none"}.` };
  // A price that alone would end the run is refused: the working played out on a copy, everything it costs.
  const t = JSON.parse(JSON.stringify(s));
  working(t, k, []);
  checkEnd(t, null, [], {});
  if (t.over) return { ok: false, why: "Its price would end your run." };
  return { ok: true, why: "" };
}

// A working's price, apart from what it does. In its sphere's hour (occult.js hourOf) it's waived when the sphere is
// at home, doubled in exile; otherwise, and without the expansion, it's the price as written (RELICS price).
const RELIC_PRICE = { glass: { longing: 1 }, key: { strain: 1 }, halo: { apo: 1 }, crown: { apo: 2 }, lamp: { favor: -1 }, purse: { gilt: 3 } };
export function relicPrice(s, k) {
  const m = hourOf(s, k);
  return Object.fromEntries(Object.entries(RELIC_PRICE[k] || (RELICS[k].fx && RELICS[k].fx.price) || {}).map(([t, v]) => [t, v * m]).filter(([, v]) => v));
}
function workFx(s, k, notes) {
  const a = s.asc;
  const e = a.enc;
  if (isStone(s, k)) return stoneFx(s, k, notes);
  const price = relicPrice(s, k);
  const m = hourOf(s, k);
  if (m !== 1) notes.push(m ? `${RELICS[k].name}, worked in its sphere's exile: twice the price.` : `${RELICS[k].name}, worked in its sphere's hour: no price.`);
  switch (k) {
    case "glass":
      a.armed = "glass";
      applyFx(s, price, notes);
      notes.push("The Confessor's Glass: this card's rolls at advantage.");
      break;
    case "key":
      applyFx(s, price, notes);
      if (e && e.sealed) (e.sealed = null), notes.push("The Ophite Key: the seal opens.");
      else (a.armed = "key"), notes.push("The Ophite Key: this card's intent counts as answered.");
      break;
    case "halo":
      if (e) encClockAdd(s, -2, notes), notes.push(`The Broken Halo: ${ENCOUNTERS[e.id].clock.label} −2.`);
      else applyFx(s, { mark: -2 }, notes), notes.push("The Broken Halo: Mark −2.");
      applyFx(s, price, notes);
      break;
    case "crown":
      a.armed = "crown";
      applyFx(s, price, notes);
      notes.push("The Severed Crown: nothing on this card can miss.");
      break;
    case "lamp":
      s.cageSeen = true;
      applyFx(s, price, notes);
      applyFx(s, { cage: -2, longing: -1 }, notes);
      notes.push("The Ward-Keeper's Lamp: the Cage, plain to see. The Cage −2, Longing −1.");
      break;
    case "purse":
      applyFx(s, { favor: 3 }, notes);
      applyFx(s, price, notes);
      notes.push(price.gilt ? `The Almoner's Purse: Favor +3, and gilt ${price.gilt} owed: the Festival starts higher while you owe it, and a Reckoning collects it.` : "The Almoner's Purse: Favor +3, and nothing owed.");
      break;
    default: {
      // A Breadth relic (ascension.js RELICS fx): its working, then its price, from the table.
      const w = (RELICS[k].fx || {}).work || {};
      if (w.cage) s.cageSeen = true;
      if (w.clock && e) encClockAdd(s, w.clock, notes), notes.push(`${RELICS[k].name}: ${ENCOUNTERS[e.id].clock.label} ${w.clock}.`);
      else if (w.alt) applyFx(s, w.alt, notes), notes.push(`${RELICS[k].name}: ${fxWords(w.alt)}.`);
      if (w.fx) applyFx(s, w.fx, notes), notes.push(`${RELICS[k].name}: ${fxWords(w.fx)}.`);
      if (w.rest) applyFx(s, { rest: 1 }, notes), notes.push(`${RELICS[k].name}: it counts as a night's rest.`);
      applyFx(s, price, notes);
    }
  }
}
// A Stone's working (occult.js STONES): once, a new possibility, and no price.
function stoneFx(s, k, notes) {
  const a = s.asc;
  const e = a.enc;
  const o = a.occ;
  notes.push(`${STONES[k].name}: ${STONES[k].works}.`);
  switch (k) {
    case "glass":
      a.armed = "clearglass";
      break;
    case "key":
      if (e && e.sealed) e.sealed = null;
      else if (e) a.armed = "key";
      else o.keyed = s.day;
      break;
    case "halo":
      if (e) encClockAdd(s, -2, notes);
      else applyFx(s, { mark: -2 }, notes);
      break;
    case "crown":
      a.armed = "crown";
      break;
    case "lamp": {
      const b = s.spent[s.spent.length - 1];
      s.spent = s.spent.slice(0, -1);
      if (b && !s.bonds.includes(b)) s.bonds.push(b);
      break;
    }
    case "purse":
      if (o.debts.length) o.debts.shift();
      else if (s.gilt) s.gilt = 0;
      else applyFx(s, { favor: 1 }, notes);
      break;
  }
}
function transmuteFx(s, k, notes) {
  const a = s.asc;
  // A Stone transmutes further (occult.js STONES).
  if (isStone(s, k)) {
    a.occ.stones = a.occ.stones.filter((x) => x !== k);
    const fx = { glass: { longing: -3 }, key: { untag: 3 }, halo: { apo: -3 }, crown: { apo: -2, mark: -2 }, lamp: { longing: -1 }, purse: { favor: 2 } }[k];
    if (k === "lamp") a.lampWitness = true;
    if (k === "purse") s.gilt = 0;
    applyFx(s, fx, notes);
    applyFx(s, { gnosis: 1 }, notes);
    return;
  }
  switch (k) {
    case "glass":
      applyFx(s, { longing: -2 }, notes);
      break;
    case "key":
      applyFx(s, { untag: 2 }, notes);
      break;
    case "halo":
      applyFx(s, { apo: -2 }, notes);
      break;
    case "crown":
      applyFx(s, { apo: -1, mark: -1 }, notes);
      break;
    case "lamp":
      a.lampWitness = true;
      break;
    case "purse":
      if (s.gilt) notes.push(`Gilt cleared: ${s.gilt}.`);
      s.gilt = 0;
      break;
    default:
      // A Breadth relic: its own table (ascension.js RELICS fx).
      applyFx(s, (RELICS[k].fx || {}).transmute || {}, notes);
  }
  applyFx(s, { gnosis: 1 }, notes);
}
// Shared by work() and transmute(): the board before and after, a clock a working can fill, and the run's end.
function relicAct(s, k, act) {
  if (s.stir) resolveStir(s, false);
  const a = s.asc;
  const notes = [];
  const keys = tracked(s);
  const before = Object.fromEntries(keys.map((t) => [t, s[t]]));
  const b = encSnap(s);
  act(notes);
  const delta = Object.fromEntries(keys.filter((t) => s[t] !== before[t]).map((t) => [t, s[t] - before[t]]));
  checkEnd(s, null, notes, delta);
  if (s.over) {
    s.endBy = "relic:" + k;
    closeDay(s);
  }
  return { ok: true, delta, notes, ending: s.over, enc: b ? encReport(s, b, null) : null };
}
// A working, whole: its charge, what it does, and what it costs. canWork() plays it on a copy first.
function working(s, k, notes) {
  s.asc.charges[k]--;
  workFx(s, k, notes);
  // The Magician reversed (arcana.js): the tools turn on their worker.
  if (s.arc && arcOn(s, "magician") === "rev") applyFx(s, { strain: 1 }, notes), notes.push("The Magician, reversed: Strain +1.");
  synFire(s, "work", { k }, notes);
}
export function work(s, k) {
  const can = canWork(s, k);
  if (!can.ok) return { ok: false, why: can.why };
  return relicAct(s, k, (notes) => working(s, k, notes));
}
export function canTransmute(s, k) {
  if (!s.asc || s.over || !s.asc.relics.includes(k)) return { ok: false, why: "" };
  if (s.cardId === BOND_CARD.id) return { ok: false, why: "Answer the offer of help first." };
  if (inVessel(s, k)) return { ok: false, why: "In the vessel until the second chapel." };
  if (s.asc.armed) return { ok: false, why: "A working is already laid on this card." };
  return { ok: true, why: "" };
}
export function transmute(s, k) {
  if (!canTransmute(s, k).ok) return { ok: false };
  return relicAct(s, k, (notes) => {
    const a = s.asc;
    a.relics = a.relics.filter((r) => r !== k);
    delete a.charges[k];
    a.transmuted++;
    notes.push(isStone(s, k) ? `${STONES[k].name}, transmuted toward freedom: ${STONES[k].transmute}, and Gnosis +1. It's gone.` : `${RELICS[k].name}, transmuted toward freedom: ${RELICS[k].transmute}, and Gnosis +1. It's gone.`);
    transmuteFx(s, k, notes);
    if (s.arc && arcOn(s, "magician") === "up") applyFx(s, { gnosis: 1 }, notes), notes.push("The Magician: Gnosis +1 more.");
  });
}

// As above, so below (occult.js corresponds): on a reading of a card its sphere rules, lying reversed, a relic turns
// it upright for one of its uses, with no Pull. The card is then read as it now lies.
export function canCorrespond(s, k) {
  const a = s.asc;
  if (!a || !a.occ || s.over || !a.relics.includes(k)) return { ok: false, why: "" };
  if (!ARC_IDS.has(s.cardId) || !corresponds(s, k)) return { ok: false, why: "Only on a reading of a card its sphere rules, lying reversed." };
  if (inVessel(s, k)) return { ok: false, why: "In the vessel until the second chapel." };
  if (!(a.charges[k] > 0)) return { ok: false, why: "Used up. A chapel's Prepare readies your relics again." };
  return { ok: true, why: "" };
}
export function correspond(s, k) {
  if (!canCorrespond(s, k).ok) return { ok: false };
  return relicAct(s, k, (notes) => {
    const c = reading(s);
    s.asc.charges[k]--;
    Object.assign(c, { rev: false, set: 0, cor: true });
    notes.push(`As above, so below: ${RELICS[k].name} answers its ruler, and ${ARCANA[c.id].name} comes up upright.`);
  });
}
// The Great Work (occult.js): at the first chapel, one relic a run goes into the vessel; at the second it's a Stone.
export function canVessel(s, k) {
  const a = s.asc;
  if (!a || !a.occ || s.over || !a.relics.includes(k)) return { ok: false, why: "" };
  if (!STONES[k]) return { ok: false, why: "This one won't go in the vessel." };
  const o = a.occ;
  if (o.vessel || o.stones.length) return { ok: false, why: "One relic a run goes into the vessel." };
  if (!(o.chapel === 1 && a.act === 1)) return { ok: false, why: "Only at the first chapel, before the road goes on." };
  return { ok: true, why: "" };
}
export function vessel(s, k) {
  if (!canVessel(s, k).ok) return { ok: false };
  return relicAct(s, k, (notes) => {
    s.asc.occ.vessel = { k, stage: 1 };
    notes.push(`${RELICS[k].name} goes into the vessel. Through the second movement it can't be worked: it's blackening. At the next chapel it comes out as ${STONES[k].name}.`);
  });
}

// ---------- endings & sharing ----------
export const isWin = (s) => !!(s.over && ENDINGS[s.over] && ENDINGS[s.over].win);
export const nightsSurvived = (s) => (isWin(s) ? s.day : s.day - 1);

const END_METER = {
  named: "Mark 6/6", fracture: "Strain 6/6", fracture_reckoning: "Strain 6/6 in the Reckoning", destitute: "no Favor at nightfall",
  collapse: "Hollow 4/4 at nightfall", cage: "The Cage 8/8", rex: "Apotheosis 6/6", billet: "followed home",
  flag: "the Old Banner", corner: "the old corner",
  catalogued: "the File 6/6", fluent: "the Grammar 8/8", gilded: "the Festival 6/6", decree: "the Chair",
};
// What ended the run, in words a player can act on next time.
export function endCause(s) {
  if (!s.over || isWin(s)) return null;
  const key = s.over.startsWith("named") ? "named" : s.over;
  let by = null;
  if (s.endBy === "nightfall") by = "at nightfall";
  else if (s.endBy && s.endBy.startsWith("mask:")) by = `putting on ${(maskOf(s.endBy.slice(5)) || { name: s.endBy.slice(5) }).name}`;
  else if (s.endBy && s.endBy.startsWith("relic:")) by = `working the ${RELICS[s.endBy.slice(6)].name}`;
  else if (BY_ID[s.endBy]) by = BY_ID[s.endBy].who;
  return { by, meter: END_METER[key] || null };
}

// A Vigil challenge travels in the link's #fragment (letters, digits, '-' and '_' only, so it survives
// hosts that strip everything else): #vigil-YYYY-MM-DD[-n<nights>[-<ending>]]. No server, no account.
export function challengeHash(s) {
  if (s.mode !== "vigil") return "";
  return `vigil-${s.seedLabel}` + (s.over ? `-n${nightsSurvived(s)}-${s.over}` : "");
}
export function parseChallenge(hash, today) {
  const m = /^#?vigil-(\d{4}-\d{2}-\d{2})(?:-n(\d{1,3})(?:-([a-z_]+))?)?$/.exec(String(hash || ""));
  if (!m) return null;
  const date = m[1];
  const t = Date.parse(date + "T00:00:00Z");
  // A real calendar date (Date.parse rolls 09-31 over to 10-01), and an ending of the game's own, not an inherited key.
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== date || date < LAUNCH_DAY || date > today) return null;
  const own = (k) => Object.prototype.hasOwnProperty.call(ENDINGS, k) && !Object.prototype.hasOwnProperty.call(ASC_ENDINGS, k);
  const ending = m[3] && own(m[3]) ? m[3] : null;
  return { date, nights: m[2] === undefined ? null : Number(m[2]), ending };
}

// Exodus dares (2026-10-17): the same road for a friend. Only a short seed travels (ascension-<8 base36>); a road
// begun before short seeds shares as a plain link. The link carries the Edict and how far the sender got.
const ROAD_SEED = /^ascension-([0-9a-z]{8})$/;
export const exodusRules = (s) => s.asc && s.asc.syn ? ([2, 3, 4, 5].includes(s.asc.syn.v) ? s.asc.syn.v : 1) : 0;
export function exodusHash(s) {
  const m = s.asc && ROAD_SEED.exec(s.seedLabel);
  const version = exodusRules(s);
  return m ? `exodus-${m[1]}-e${s.asc.edict}-a${s.asc.act}` + (version ? `-d${version}` : "") + (s.over ? `-${s.over}` : "") : "";
}
export function parseExodus(hash) {
  const m = /^#?exodus-([0-9a-z]{8})-e(\d{1,2})-a([123])(?:-d(\d))?(?:-([a-z_]+))?$/.exec(String(hash || ""));
  if (!m || +m[2] > MAX_EDICT || (m[4] !== undefined && !["1", "2", "3", "4", "5"].includes(m[4]))) return null;
  const ending = m[5] && Object.prototype.hasOwnProperty.call(ENDINGS, m[5]) ? m[5] : null;
  // A bare link replays the pre-Depth rules. -d1, -d2, -d3, -d4 and -d5 keep their own preparation, breadth and union rules.
  return { seed: `ascension-${m[1]}`, edict: +m[2], act: +m[3], ending, ...(m[4] ? { depth: Number(m[4]) } : {}) };
}
// Each fight, by how it ended: a road out, a disengage, driven out; and one the run ended inside.
const fightGrid = (s) => s.asc.met.map((m) => (m.out === "fled" ? "🌫️" : m.out === "driven" ? "🩸" : "🗝️")).join("") + (s.over && s.asc.enc && s.asc.enc.turn > 0 ? "⬛" : "");

const DAY_EMOJI = { purple: "🟪", red: "🟥", gold: "🟨", radiance: "✨", end: "⬛", crown: "👑" };
// The Vigil's card is the same for everyone that night, so it goes in the share once it's been read (not before: a run
// that never reached it doesn't name it), with whether you turned it over. A struck card isn't named.
export function vigilCardLine(s) {
  const c = s.mode === "vigil" && s.arc && s.arc.spread[0];
  if (!c || c.st !== "up") return "";
  const turned = c.rev !== fall(c.id, c.fell, s.arc.sign, !!c.own).rev;
  return `🃏 ${cardTitle(c)}${turned ? " · I turned it" : ""}`;
}
// opts.streak: the Vigils in a row this one makes (app.js knows the archive); said from 2.
export function shareText(s, url = "", opts = {}) {
  const e = ENDINGS[s.over] || { title: "Still walking" };
  const n = nightsSurvived(s);
  const head = (s.mode === "vigil" ? `FALSE LIGHT · Vigil #${vigilNumber(s.seedLabel)}${s.late ? " · played late" : ""}` : s.mode === "ascension" ? `FALSE LIGHT · Exodus ${["", "I", "II", "III"][s.asc.act]}${s.asc.edict ? ` · Edict ${s.asc.edict}` : ""}` : "FALSE LIGHT · Endless") + " · VENEFICA LUX";
  const cause = endCause(s);
  const nights = isWin(s) ? `👑 ${e.title} on night ${s.day}` : `🕯️ ${n} night${n === 1 ? "" : "s"} · ${e.title}${cause && cause.by ? ` (${cause.by})` : ""}`;
  const grid = s.days.map((d) => DAY_EMOJI[d] || "🟪").join("");
  const base = String(url).split("#")[0];
  const road = s.asc ? exodusHash(s) : "";
  const link = !base ? "" : s.mode === "vigil" ? `Same seed. Beat me: ${base}#${challengeHash(s)}` : road ? `Walk the same road: ${base}#${road}` : base;
  const walked = s.asc ? [s.asc.self, fightGrid(s)].filter(Boolean).join(" · ") : "";
  const streak = s.mode === "vigil" && opts.streak >= 2 ? `🔥 ${opts.streak} Vigils in a row` : "";
  return [head, nights, grid, walked, vigilCardLine(s), `👁 ${s.gnosis}/12 · 🗝 ${s.untag}/12`, streak, link].filter(Boolean).join("\n");
}
