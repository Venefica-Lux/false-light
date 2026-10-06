// FALSE LIGHT — pure game engine. No DOM. Runs in the browser and under `node --test`.
// Rules are a compressed port of the public SIEGE edition (THE_POISONER_OF_FALSE_LIGHT.md):
// 2d6 + stat, four meters, the False Light, Masks, the Chains, UNTAGGABLE + GNOSIS.

import { CARDS, ENDINGS } from "./cards.js";

export { CARDS, ENDINGS };

export const METERS = {
  mark: { max: 6, label: "Mark", hint: "The Warden's eye. At 6 you are Named." },
  strain: { max: 6, label: "Strain", hint: "The weight on the soul. At 6 you Fracture." },
  favor: { max: 6, label: "Favor", hint: "Coin, doors, allies. Empty at nightfall and you're Destitute." },
  hollow: { max: 4, label: "Hollow", hint: "The body's ledger. Full at nightfall and it closes." },
};
export const TRACK_MAX = { untag: 12, gnosis: 12 };
export const STATS = { steel: 2, wits: 1, shade: 0, freq: -1 };
export const STAT_LABEL = { steel: "Steel", wits: "Wits", shade: "Shade", freq: "Frequency", fortune: "Fortune" };
// bonus and risk are the short line under the Masks; use is the guide's "wear it when". Keep all three true
// to what applyFx, cardCosts, the turn tick and the Light actually do.
export const MASKS = {
  bare: {
    name: "Bare Face", stat: null, bonus: "Hollow recovery ×2", risk: "+1 Strain when a wolf appears",
    use: "Hollow is climbing, or the night is quiet. No stat bonus, and wolves and the Geometry cost Strain. Its own cards trade a little Mark or Strain for Gnosis.",
  },
  nyx: {
    name: "Nyx", stat: "shade", bonus: "+1 Shade", risk: "Dissolution: +1 Strain every 3rd card",
    use: "Mark is climbing. Shade is hiding, slipping past, listening; it starts at 0. Her cards take Mark off and build Untaggable.",
  },
  eris: {
    name: "Eris", stat: "steel", bonus: "+1 Steel", risk: "Isolation: Longing +1 on the 4th card",
    use: "Wolves are hunting. Steel is facing things down: your best stat and the most common roll. Her cards set wolves on each other, or throw a party that eases Strain and Longing.",
  },
  lilith: {
    name: "Lilith", stat: "freq", bonus: "+1 Frequency", risk: "Exposure: every Longing rise +1",
    use: "You're after Gnosis and Longing is low. Frequency is reaching people; it starts at −1, your worst. Her cards pay Gnosis and turn Strain into it. In the Light she cuts both ways: Communion clears 3 Strain, not 2, and the Reckoning adds 4, not 3.",
  },
};
// Bonds: people who catch you once. Each one answers a single kind of ending, then is spent.
export const BONDS = {
  sister: { name: "The Sister", saves: "Mark", hint: "The Sister: once, when your Mark would reach 6, she hides you. Mark drops to 5." },
  sponsor: { name: "The Sponsor", saves: "Strain", hint: "The Sponsor: once, when your Strain would break you, she picks up at the fourth hour. Strain drops to 4." },
  table: { name: "The Open Table", saves: "nightfall", hint: "The Open Table: once, at a nightfall that would end you, bread and a bed. Favor 1 at least, Hollow 3 at most." },
};
export const CARDS_PER_DAY = 4;
export const LAUNCH_DAY = "2026-09-30";

const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const cardById = (id) => BY_ID[id];

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

export function newGame({ seed = "endless", mode = "endless", tutorial = false } = {}) {
  const s = Object.assign(fresh(), {
    mode,
    seedLabel: String(seed),
    rng: hashSeed(String(seed)),
    forced: tutorial ? ["t_dawn"] : [],
    tutorial: !!tutorial,
  });
  draw(s);
  return s;
}

export const currentCard = (s) => BY_ID[s.cardId];

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
  if (!MASKS[s.mask]) s.mask = "bare";
  if (s.stir && !MASKS[s.stir]) s.stir = null;
  s.bonds = s.bonds.filter((b) => BONDS[b]);
  s.spent = s.spent.filter((b) => BONDS[b]);
  return s;
}

// ---------- dice ----------
function rollMods(s, roll) {
  const stat = roll.stat || "fortune";
  let mod = stat === "fortune" ? 0 : STATS[stat];
  const m = MASKS[s.mask];
  if (m.stat && m.stat === stat) mod += 1;
  mod += roll.mod || 0;
  if (s.strain >= 5 && stat !== "fortune") mod -= 1; // Yellow: one Position worse
  let adv = roll.adv ? 1 : 0;
  let dis = roll.dis ? 1 : 0;
  if (s.communion > 0 && (stat === "shade" || stat === "freq")) adv++;
  if (s.hollow >= 3) dis++;
  if (s.reckoning > 0 && stat === "wits") dis++;
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
  return { stat, mod, net, dice: raw, kept, total, tier: tierOf(total, kept, dice) };
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
      const t = tierOf(kept.reduce((a, b) => a + b, 0) + mod, kept, dice);
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

function applyFx(s, fx, notes) {
  const delta = {};
  const bump = (k, v, hi) => {
    const before = s[k];
    s[k] = clamp(s[k] + v, 0, hi);
    if (s[k] !== before) delta[k] = (delta[k] || 0) + (s[k] - before);
  };
  for (const [k, raw] of Object.entries(fx || {})) {
    let v = raw;
    switch (k) {
      case "strain":
        if (v > 0 && s.hollow >= 2) v += 1; // Hollow 2: all Strain costs +1
        bump("strain", v, 6);
        break;
      case "hollow":
        if (v < 0 && s.mask === "bare") v *= 2; // Bare Face: recovery doubled
        bump("hollow", v, 4);
        break;
      case "mark":
      case "favor":
        bump(k, v, 6);
        break;
      case "longing":
        if (v > 0 && s.mask === "lilith") v += 1;
        bump("longing", v, 4);
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
        if (v > 0 && s.apo >= 5) {
          notes.push("Gnosis cannot rise. You have made yourself your own highest law.");
          break;
        }
        bump("gnosis", v, 12);
        break;
      case "cage":
        bump("cage", v, 8);
        break;
      case "apo":
        s.apo = clamp(s.apo + v, 0, 6);
        break;
      case "rest":
        s.restedToday = true;
        break;
      case "reveal":
        if (!s.cageSeen) notes.push("The Cage is visible now.");
        s.cageSeen = true;
        break;
      case "commune":
        commune(s, notes);
        break;
      case "reckon":
        reckon(s, delta, notes);
        break;
      case "set":
        Object.assign(s.flags, v);
        break;
      case "unset":
        for (const f of [].concat(v)) delete s.flags[f];
        break;
      case "bond":
        if (BONDS[v] && !s.bonds.includes(v) && !(s.spent || []).includes(v)) {
          s.bonds.push(v);
          notes.push(`Bond: ${BONDS[v].name}. ${BONDS[v].hint.split(": ")[1]}`);
        }
        break;
      case "then":
        s.forced.push(...[].concat(v));
        break;
      case "end":
        s.over = s.over || v;
        break;
    }
  }
  return delta;
}

function commune(s, notes) {
  const tolerant = s.tolerance >= 2;
  s.tolerance++;
  s.hollow = tolerant ? Math.min(s.hollow, 1) : 0;
  s.strain = clamp(s.strain - (tolerant ? 1 : s.mask === "lilith" ? 3 : 2), 0, 6);
  s.communion = tolerant ? 3 : 4;
  s.longingHeld = s.longing;
  s.dayMarks.push("light");
  notes.push(tolerant ? "Communion — thinner than last time. Tolerance." : "Communion. Everything is gold.");
}

function reckon(s, delta, notes) {
  const tolerant = s.tolerance >= 3;
  const before = { hollow: s.hollow, strain: s.strain, mark: s.mark, longing: s.longing };
  s.hollow = tolerant ? 4 : 3;
  s.strain = clamp(s.strain + (tolerant || s.mask === "lilith" ? 4 : 3), 0, 6);
  s.mark = clamp(s.mark + 1, 0, 6);
  s.longing = clamp(s.longing + 1, 0, 4);
  s.reckoning = 4;
  for (const k of Object.keys(before)) if (s[k] !== before[k]) delta[k] = (delta[k] || 0) + s[k] - before[k];
  notes.push("The Reckoning. Every gift reverses, with interest.");
}

// ---------- preview ----------
// What a swipe will actually do, found by playing it out on a copy of the run: every outcome of the
// roll, plus everything the choice drags along (Mask risks, the Hollow tax, nightfall, a Fracture
// absorbed). Direction stays hidden, as in the source game; *which* meters move, and whether any
// outcome ends the run, is never hidden. The unseen Cage is only ever reported as a nameless danger.
const OUTCOMES = ["radiance", "hit", "mid", "miss", "ruin"];
const TRACKED = ["mark", "strain", "favor", "hollow", "longing", "untag", "gnosis", "cage"];
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
  let lethal = 0, crown = 0;
  const endings = new Set();
  const wins = new Set();
  const bonds = {};
  for (const r of runs) {
    for (const [k, v] of Object.entries(r.res.delta)) if (v) touched.add(k);
    for (const b of r.res.spent || []) bonds[b] = (bonds[b] || 0) + r.p;
    if (!r.res.ending) continue;
    if (ENDINGS[r.res.ending].win) (crown += r.p), wins.add(r.res.ending);
    else {
      lethal += r.p;
      endings.add(r.res.ending);
    }
  }
  const shown = (k) => k !== "cage" || s.cageSeen;
  return {
    label: ch.label,
    meters: [...touched].filter((k) => k in METERS),
    tracks: [...touched].filter((k) => !(k in METERS) && shown(k)),
    roll,
    lethal: lethal > 1e-9 ? { p: Math.min(1, lethal), endings: [...endings] } : null,
    crown: crown > 1e-9 ? { p: Math.min(1, crown), endings: [...wins] } : null,
    bonds: Object.entries(bonds).map(([k, p]) => ({ k, p: Math.min(1, p) })),
  };
}

// Costs the current card carries whatever you choose, and what's about to happen — said before you swipe.
export function cardCosts(s) {
  const c = currentCard(s);
  const out = [];
  if (!c || c.tutorial || s.over) return out;
  const tax = s.hollow >= 2 ? 1 : 0;
  if (s.mask === "bare" && c.tier >= 2) out.push({ id: "wolf", text: `Bare-faced before a wolf: +${1 + tax} Strain either way` });
  if (s.mask === "nyx" && (s.maskAge + 1) % 3 === 0) out.push({ id: "nyx", text: `Nyx dissolves you: +${1 + tax} Strain this card` });
  if (s.mask === "eris" && s.maskAge + 1 === 4) out.push({ id: "eris", text: "Eris isolates you: Longing +1 this card" });
  if (s.communion === 1 && c.id !== "whisper" && c.id !== "reckoning") out.push({ id: "fading", text: "The Light is fading. The Reckoning comes next" });
  if (s.bell === CARDS_PER_DAY - 1 && !s.restedToday) out.push({ id: "night", text: "Nightfall after this card: Hollow +1, no rest today" });
  return out;
}

// ---------- the turn ----------
// opts.tier forces a roll's outcome; only preview() uses it, on a copy.
export function choose(s, side, opts = {}) {
  if (s.over) return null;
  if (s.stir) resolveStir(s, false); // an unanswered stir means the Mask answered
  const card = currentCard(s);
  const ch = card[side];
  const notes = [];
  const before = Object.fromEntries(TRACKED.map((k) => [k, s[k]]));
  const spentBefore = (s.spent || []).length;
  const spentNow = () => (s.spent || []).slice(spentBefore);
  let roll = null;
  let branch = ch;
  if (ch.roll) {
    roll = opts.tier ? { ...rollMods(s, ch.roll), dice: [], kept: [], total: null, tier: opts.tier } : rollDice(s, ch.roll);
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
  // delta is measured, not accumulated, so everything that moved is reported (Communion included).
  const measure = () => Object.fromEntries(TRACKED.filter((k) => s[k] !== before[k]).map((k) => [k, s[k] - before[k]]));
  if (ch.roll) applyFx(s, ch.fx, notes);
  applyFx(s, branch.fx, notes);
  if (roll && roll.tier === "radiance") applyFx(s, { favor: 1 }, notes);
  if (roll && roll.tier === "ruin") applyFx(s, { strain: 1 }, notes);
  const text = branch.text || ch.text || "";

  s.turns++;
  s.recent = [card.id, ...s.recent].slice(0, 10);
  if (card.once) s.flags["seen_" + card.id] = true;

  // Tutorial cards teach; they don't spend the day. Keeps a Vigil's clock identical for everyone.
  if (card.tutorial) {
    const delta = measure();
    draw(s);
    return { side, label: ch.label, roll, delta, text, notes, ending: null, nightfall: null, card: card.id, event: s.lastEvent, spent: [] };
  }

  // Mask risks
  s.maskAge++;
  if (s.mask === "bare" && card.tier >= 2) applyFx(s, { strain: 1 }, notes), notes.push("No armor: a wolf, bare-faced. +1 Strain.");
  if (s.mask === "nyx" && s.maskAge % 3 === 0) applyFx(s, { strain: 1 }, notes), notes.push("Nyx: Dissolution. +1 Strain.");
  if (s.mask === "eris" && s.maskAge === 4) applyFx(s, { longing: 1 }, notes), notes.push("Eris: power without connection. Longing +1.");

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
  if (was && !s.cascade) applyFx(s, { gnosis: 1 }, notes), notes.push("The pressure eases. Governance: Gnosis +1.");

  if (s.mark >= 5 || s.strain >= 5) s.dayMarks.push("edge");

  checkEnd(s, card, notes, {});
  if (s.over) s.endBy = s.endBy || card.id;

  let nightfall = null;
  if (!s.over) {
    s.bell++;
    if (s.bell >= CARDS_PER_DAY) nightfall = night(s, notes, {});
  }
  const delta = measure(); // before the next draw, whose Activation roll is reported separately
  if (!s.over) draw(s);
  else if (!nightfall) closeDay(s); // night() already closed the day it ended on
  return { side, label: ch.label, roll, delta, text, notes, ending: s.over, nightfall, card: card.id, event: s.lastEvent, spent: spentNow() };
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
  s.bonds = s.bonds.filter((b) => b !== k);
  s.spent = (s.spent || []).concat(k);
  notes.push(text);
  return true;
}

function checkEnd(s, card, notes, delta) {
  if (s.over) return;
  if (s.untag >= 12 && s.gnosis >= 12) return void (s.over = "crown");
  if (s.hollow >= 4 && s.strain === 5) s.strain = 6;
  if (s.strain >= 6) {
    if (s.favor >= 3) {
      s.favor -= 3;
      s.strain = 4;
      delta.favor = (delta.favor || 0) - 3;
      notes.push("Fracture absorbed: 3 Favor spent. Strain resets to 4.");
    } else if (spend(s, "sponsor", notes, "The Sponsor picks up at the fourth hour. Strain drops to 4. That Bond is spent.")) s.strain = 4;
    else return void (s.over = s.reckoning > 0 ? "fracture_reckoning" : "fracture");
  }
  if (s.mark >= 6 && spend(s, "sister", notes, "The Sister hides you. Mark drops to 5. That Bond is spent.")) s.mark = 5;
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
  if (!s.restedToday) {
    s.noRestDays++;
    const b = s.hollow;
    s.hollow = clamp(s.hollow + 1, 0, 4);
    if (s.hollow !== b) delta.hollow = (delta.hollow || 0) + 1;
    notes.push("Nightfall without rest. Hollow +1.");
  } else s.noRestDays = 0;
  // Night gives a little back, even on the Warrens' thin mattresses.
  const sb = s.strain;
  s.strain = clamp(s.strain - (s.restedToday ? 2 : 1), 0, 6);
  if (s.strain !== sb) delta.strain = (delta.strain || 0) + (s.strain - sb);
  if ((s.favor === 0 || s.hollow >= 4) && spend(s, "table", notes, "The Open Table: bread and a bed. Favor 1 at least, Hollow 3 at most. That Bond is spent.")) {
    s.favor = Math.max(s.favor, 1);
    s.hollow = Math.min(s.hollow, 3);
  }
  if (s.favor === 0) s.over = "destitute";
  else if (s.hollow >= 4) s.over = "collapse";
  else if (s.restedToday && s.flags.house && bondsEarned(s) === 3) s.over = "ordinary"; // Ordinary Time
  if (s.over) s.endBy = "nightfall";
  closeDay(s);
  if (s.over) return info;
  s.day++;
  s.bell = 0;
  s.restedToday = false;
  s.seizedToday = false;
  s.maskLocked = false;
  return info;
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

function draw(s) {
  s.lastEvent = null;
  let id = null;
  while (s.forced.length && !id) {
    const f = s.forced.shift();
    if (BY_ID[f]) id = f;
  }
  if (!id) {
    const pool = CARDS.filter((c) => eligible(s, c));
    // Day one is a grace day: the Geometry's heavy machinery rarely arrives before you've found your feet.
    const grace = (c) => (s.day === 1 && c.tier >= 2 ? 0.35 : 1);
    const weights = pool.map((c) => grace(c) * Math.max(0, typeof c.weight === "function" ? c.weight(s) : c.weight ?? 1));
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = deckRand(s) * sum;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        id = pool[i].id;
        break;
      }
    }
    id = id || (pool[pool.length - 1] || CARDS.find((c) => c.id === "meal")).id;
  }
  s.cardId = id;
  seizure(s);
}

// Activation Seizure (§9.5): under load, who decides which frequency answers?
function seizure(s) {
  if (s.seizedToday || s.over) return;
  if (!(s.strain >= 4 && (s.longing >= 3 || s.hollow >= 3 || s.cage >= 4))) return;
  s.seizedToday = true;
  const r = rollDice(s, { stat: "fortune" });
  const card = currentCard(s);
  const pick = card.tier >= 2 ? "eris" : s.longing >= 3 ? "lilith" : "nyx";
  if (r.tier === "hit" || r.tier === "radiance") {
    const grows = s.apo < 5 && s.communion === 0;
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
    s.lastEvent = {
      kind: "seizure",
      roll: r,
      mask: pick,
      text: `Seizure. ${MASKS[pick].name} answers a signal you did not send. It holds until nightfall; breaking free costs 2 Strain.`,
    };
  }
}

// ---------- masks ----------
// Base Strain for changing Mask: free at dawn, 1 after, 2 to break a Seizure (§9.5, "rest of the scene"
// — here the day). maskStrain() is what the engine actually charges, Hollow 2's +1 tax included.
export function maskCost(s, m) {
  if (m === s.mask) return 0;
  if (s.maskLocked) return 2;
  return s.bell === 0 ? 0 : 1;
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
  checkEnd(s, null, notes, delta);
  if (s.over) {
    s.endBy = "mask:" + m;
    closeDay(s);
  }
  return { ok: true, cost, delta, notes, ending: s.over };
}

// ---------- endings & sharing ----------
export const isWin = (s) => !!(s.over && ENDINGS[s.over] && ENDINGS[s.over].win);
export const nightsSurvived = (s) => (isWin(s) ? s.day : s.day - 1);

const END_METER = {
  named: "Mark 6/6", fracture: "Strain 6/6", fracture_reckoning: "Strain 6/6 in the Reckoning", destitute: "no Favor at nightfall",
  collapse: "Hollow 4/4 at nightfall", cage: "The Cage 8/8", rex: "Apotheosis 6/6", billet: "followed home",
  flag: "the Old Banner", corner: "the old corner",
};
// What ended the run, in words a player can act on next time.
export function endCause(s) {
  if (!s.over || isWin(s)) return null;
  const key = s.over.startsWith("named") ? "named" : s.over;
  let by = null;
  if (s.endBy === "nightfall") by = "at nightfall";
  else if (s.endBy && s.endBy.startsWith("mask:")) by = `putting on ${MASKS[s.endBy.slice(5)].name}`;
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
  if (Number.isNaN(Date.parse(date + "T00:00:00Z")) || date < LAUNCH_DAY || date > today) return null;
  return { date, nights: m[2] === undefined ? null : Number(m[2]), ending: m[3] && ENDINGS[m[3]] ? m[3] : null };
}

const DAY_EMOJI = { purple: "🟪", red: "🟥", gold: "🟨", radiance: "✨", end: "⬛", crown: "👑" };
export function shareText(s, url = "") {
  const e = ENDINGS[s.over] || { title: "Still walking" };
  const n = nightsSurvived(s);
  const head = (s.mode === "vigil" ? `FALSE LIGHT · Vigil #${vigilNumber(s.seedLabel)}` : "FALSE LIGHT · Endless") + " · VENEFICA LUX";
  const cause = endCause(s);
  const nights = isWin(s) ? `👑 ${e.title} on night ${s.day}` : `🕯️ ${n} night${n === 1 ? "" : "s"} · ${e.title}${cause && cause.by ? ` (${cause.by})` : ""}`;
  const grid = s.days.map((d) => DAY_EMOJI[d] || "🟪").join("");
  const base = String(url).split("#")[0];
  const link = !base ? "" : s.mode === "vigil" ? `Same seed. Beat me: ${base}#${challengeHash(s)}` : base;
  return [head, nights, grid, `👁 ${s.gnosis}/12 · 🗝 ${s.untag}/12`, link].filter(Boolean).join("\n");
}
