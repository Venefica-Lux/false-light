// The Depth Pass's workbench: under the chapel's stair, after the two rites, a rite you hold and a relic you carry can be
// worked together once. Six recipes, each a different rite with a different relic. How it goes is decided by two things
// the player can reason about and see on the card: the day's sphere (is it the relic's own day?) and a piece of
// knowledge (something the run has already met). Both: it takes fully. One: in part. Neither: it fails, and says why.
// Every outcome has a price. The card's two sides are exactly what lands (the engine reads the same table), so the
// preview is the result; "Leave it" costs nothing, and a recipe worked is worked for the run.
//
// Data and pure readers, like synergy.js; the engine interprets `extra` (engine.js ritWork). A run carries
// s.asc.syn.rit only when it was begun with the Depth Pass. The Codex remembers what the player learned (counts of
// what was seen and done, never anything the character has), and the clues are the ones the synergies already carry.
import { occOf, occDay, sphereOfRelic, sphereName, inVessel } from "./occult.js";
import { SYNERGIES } from "./synergy.js";

export const RIT_LEVELS = ["full", "half", "dud"];
export const RIT_STATES = ["undiscovered", "encountered", "partial", "performed", "documented"];

const ritClue = (id) => SYNERGIES.find((x) => x.id === id).clue;

// Each recipe: rite and relic held; know() the knowledge it wants; clue (a synergy's own where one fits); and what each
// outcome lands: fx (tracks, exactly as the card shows them), extra (what a track can't say), say (the toast).
export const RECIPES = [
  {
    id: "unwritten", name: "The Unwritten Seal", rite: "refusal", relic: "key", syn: "unfiled",
    line: "Refusal and the Key: a seal that was never written.",
    knowLine: "what a seal is, from having met one", hint: "Meet a seal first; the Key can't open what you've never seen.",
    know: (s) => occOf(s).seals.length > 0,
    full: { fx: { untag: 2, mark: -1, strain: 1 }, extra: { ease: 1 }, say: "The name comes off the page. Nobody can read it back to you." },
    half: { fx: { untag: 1, strain: 1 }, say: "The page blurs, and the name half comes off it." },
    dud: { fx: { strain: 1, mark: 1 }, say: "You wrote it down while trying to unwrite it." },
  },
  {
    id: "blank", name: "The Blank Register", rite: "name", relic: "glass", syn: "revelation",
    line: "The Taken Name and the Glass: a page with no name on it.",
    knowLine: "what it is to be written down: a Mark of 2", hint: "Be written down first: the page wants a Mark of 2 to blank.",
    know: (s) => s.mark >= 2,
    full: { fx: { mark: -2, longing: 1 }, say: "Two lines go blank, and you can't say whose they were." },
    half: { fx: { mark: -1, longing: 1 }, say: "One line goes blank. The other holds." },
    dud: { fx: { mark: 1, longing: 1 }, say: "The Glass shows the page, and the page shows you." },
  },
  {
    id: "sun", name: "The Debt of the False Sun", rite: "crown", relic: "halo", syn: "throne",
    line: "The Crown Taken and the Halo: a light that was always borrowed.",
    knowLine: "the Pull, felt: 2", hint: "Feel the Pull first: it wants the Pull at 2.",
    know: (s) => s.apo >= 2,
    full: { fx: { apo: -2, strain: 1 }, extra: { debt: "sun" }, say: "The borrowed light goes back. The Sun will want something for it." },
    half: { fx: { apo: -1, strain: 1 }, extra: { debt: "sun" }, say: "Some of it goes back. The Sun will want something for it." },
    dud: { fx: { apo: 1, strain: 1 }, extra: { debt: "sun" }, say: "It was never the Sun's to lend. You owe it all the same." },
  },
  {
    id: "oath", name: "The Witnessed Oath", rite: "named", relic: "lamp", syn: "witness",
    line: "The Vow to the Named and the Lamp: a promise someone saw.",
    knowLine: "someone who stands beside you", hint: "Hold a Bond first: an oath wants a witness.",
    know: (s) => s.bonds.length > 0,
    full: { fx: { longing: -2, strain: 1 }, extra: { bond: 1 }, say: "Someone saw it said. A Bond comes back to stand beside you." },
    half: { fx: { longing: -1, strain: 1 }, say: "It's said, and half of it was heard." },
    dud: { fx: { longing: 1, strain: 1 }, say: "You swore to the lamp, and the lamp is not a person." },
  },
  {
    id: "severed", name: "The Severed Correspondence", rite: "fast", relic: "crown",
    clue: "What is bound to the day can be cut on its own day.",
    line: "The Fast and the Crown: a line cut at the root.",
    knowLine: "the Cage, felt: 2", hint: "Feel the Cage first: it wants the Cage at 2.",
    know: (s) => s.cage >= 2,
    full: { fx: { cage: -2, strain: 1 }, say: "The line parts clean. Nothing above you answers." },
    half: { fx: { cage: -1, strain: 1 }, say: "One strand parts. The rest holds." },
    dud: { fx: { cage: 1, strain: 1 }, say: "You cut the wrong line, and it was holding you up." },
  },
  {
    id: "vessel", name: "The Quiet Vessel", rite: "poverty", relic: "purse",
    clue: "A thing emptied on purpose holds more than a full one.",
    line: "The Vow of Poverty and the Purse: a vessel emptied on purpose.",
    knowLine: "a vessel, or a Stone made of one", hint: "Put a relic in the vessel first, or carry a Stone.",
    know: (s) => !!occOf(s).vessel || occOf(s).stones.length > 0,
    full: { fx: { strain: -2, longing: 1 }, say: "The Purse is empty and so are you; it's the first quiet you've had." },
    half: { fx: { strain: -1, longing: 1 }, say: "Half the quiet, and the want that comes with it." },
    dud: { fx: { longing: 1, hollow: 1 }, say: "It was only empty." },
  },
];
for (const r of RECIPES) r.clue = r.clue || ritClue(r.syn);
const ritKnown = (id) => RECIPES.some((r) => r.id === id);

// ---------- readers ----------
export const ritOf = (s) => (s && s.asc && s.asc.syn && s.asc.syn.rit) || null;
// How a recipe would go now: the day is the relic's sphere's own, and the knowledge it wants is held.
export function ritLevel(s, r) {
  const hour = occDay(s) === sphereOfRelic(r.relic);
  const know = !!r.know(s);
  return { level: hour && know ? "full" : hour || know ? "half" : "dud", hour, know };
}
// Whether a working's price can be paid without ending the run (the same ceilings the cards' costs keep clear of).
const RIT_CEIL = { mark: 4, strain: 4, hollow: 2, cage: 6, apo: 4, longing: 3 };
export function ritSafe(s, fx) {
  return Object.entries(fx).every(([k, v]) => !(v > 0) || !(k in RIT_CEIL) || (s[k] || 0) + v <= RIT_CEIL[k]);
}
const RIT_RANK = { full: 3, half: 2, dud: 1 };
// The recipe the bench shows now, or null: a rite held with its relic carried loose (not in the vessel), not yet worked
// this run, and its price one the run can pay. The best matched first; ties to the table's order.
export function benchOffer(s) {
  const rit = ritOf(s);
  if (!rit) return null;
  let best = null;
  for (const r of RECIPES) {
    if (rit.done[r.id] || !occOf(s).rites.includes(r.rite) || !s.asc.relics.includes(r.relic) || inVessel(s, r.relic)) continue;
    const got = ritLevel(s, r);
    if (!ritSafe(s, r[got.level].fx)) continue;
    if (!best || RIT_RANK[got.level] > RIT_RANK[best.level]) best = { recipe: r, ...got };
  }
  return best;
}
// The bench was shown: the recipe is encountered, whatever is done with it.
export function ritSee(s) {
  const offer = benchOffer(s);
  const rit = ritOf(s);
  if (offer && !rit.seen.includes(offer.recipe.id)) rit.seen.push(offer.recipe.id);
}

// ---------- the card ----------
const RIT_WORD = { full: "it takes fully", half: "it takes in part", dud: "it fails" };
const RIT_EXTRA = { ease: "the next fight's clock −1", debt: "a debt to the Sun", bond: "a spent Bond returns" };
const ritExtra = (x) => Object.keys(x || {}).map((k) => RIT_EXTRA[k]).join(" · ");
const ritTag = (r, level) => [RIT_WORD[level], ritExtra(r[level].extra)].filter(Boolean).join(" · ");
const ritCap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export const RIT_CARDS = [
  {
    id: "o_bench", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "stair", frame: "rite", who: "The Workbench", tierText: "at dusk",
    text: "A table at the foot of the stair, worn smooth by people who learned this the hard way.",
    build(s) {
      const offer = benchOffer(s);
      if (!offer) return this;
      const { recipe: r, level, hour, know } = offer;
      const day = sphereName(sphereOfRelic(r.relic));
      const hourLine = hour ? `It is ${day}'s day: the hour holds.` : `It isn't ${day}'s day. The hour is wrong.`;
      const knowLine = know ? `You know ${r.knowLine}.` : r.hint;
      const miss = [!hour && "hour", !know && "know"].filter(Boolean);
      return {
        ...this,
        who: `The Workbench · ${r.name}`,
        text: `${r.line} ${hourLine} ${knowLine}`,
        left: { label: "Work it", tag: ritTag(r, level), fx: { ...r[level].fx, occ: { rit: r.id, lv: level, miss } }, text: `${ritCap(RIT_WORD[level])}. ${r[level].say}` },
        right: { label: "Leave it", fx: {}, text: "You put the pieces back. The table keeps." },
      };
    },
    left: { label: "Work it", fx: {}, text: "" },
    right: { label: "Leave it", fx: {}, text: "You put the pieces back." },
  },
];

// ---------- the Codex: what the player learned, never what the character has ----------
const ritCount = (x) => (Number.isInteger(x) && x > 0 ? Math.min(x, 999) : 0);
export function ritRecord(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const r of RECIPES) {
    const e = raw[r.id];
    if (!e || typeof e !== "object" || Array.isArray(e)) continue;
    const m = e.miss && typeof e.miss === "object" && !Array.isArray(e.miss) ? e.miss : {};
    out[r.id] = { seen: ritCount(e.seen), dud: ritCount(e.dud), half: ritCount(e.half), full: ritCount(e.full), miss: { hour: ritCount(m.hour), know: ritCount(m.know) } };
  }
  return out;
}
// A finished run, booked onto the record (a new record; the old one isn't touched).
export function ritBook(rec, rit) {
  const out = ritRecord(rec);
  if (!rit) return out;
  const at = (id) => (out[id] ||= { seen: 0, dud: 0, half: 0, full: 0, miss: { hour: 0, know: 0 } });
  const seen = new Set([...(rit.seen || []), ...(rit.log || []).map((x) => x.id)].filter(ritKnown));
  for (const id of seen) at(id).seen++;
  for (const x of rit.log || []) {
    if (!ritKnown(x.id) || !RIT_LEVELS.includes(x.res)) continue;
    at(x.id)[x.res]++;
    for (const m of x.miss || []) if (m === "hour" || m === "know") at(x.id).miss[m]++;
  }
  return out;
}
export function ritState(e) {
  if (!e) return "undiscovered";
  if (ritCount(e.full) >= 2) return "documented";
  if (ritCount(e.full) >= 1) return "performed";
  if (ritCount(e.dud) + ritCount(e.half) > 0) return "partial";
  return ritCount(e.seen) > 0 ? "encountered" : "undiscovered";
}
// What the Codex shows of a recipe at its state: the clue once it was seen, and the needs the player has learned.
export function ritEntry(r, e) {
  const state = ritState(e);
  const m = (e && e.miss) || {};
  const rank = RIT_STATES.indexOf(state);
  const needs = [];
  if (rank >= 3 || m.hour) needs.push(`its relic's own day: ${sphereName(sphereOfRelic(r.relic))}`);
  if (rank >= 3 || m.know) needs.push(`knowing ${r.knowLine}`);
  return {
    state,
    name: rank >= 1 ? r.name : "an unnamed working",
    clue: rank >= 1 ? r.clue : null,
    needs: rank >= 2 ? needs : [],
    lines: rank >= 3 ? [r.full.say] : [],
  };
}
