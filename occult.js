// FALSE LIGHT — the Great Occult Expansion (2026-10-26): the Seven Spheres and the ascent through them, the two
// paths and their rites, the two accounts of the Architect and the Unsaid, the Law of the Star, the Hermetic
// correspondences and the Great Work, the Office of Seals. Data, plus pure readers of the run; engine.js runs it.
// Exodus only, and only in a run that has s.asc.occ (newGame's occult option, on by default). A run without it, an
// Endless run and every Vigil play exactly as before (occult.test.mjs replays a recorded control to prove it).
//
// Canon this follows (THE_POISONER_OF_FALSE_LIGHT.md): the Source and the Fullness, Wisdom's fall and the light
// caught below, Rex Mundi the derivative power that mistook itself for God (§2.1); "You orient toward the light. You
// do not become it" (§2.2); the Ophite current already inside the Empire (§1.3); the ritual container and the Sabbath
// (§20); the Contradiction Seat (§19.5). The seven planets are already the seven spheres the Geometry is built from,
// one a weekday (arcana.js): this file says what each sphere holds, and how a heretic gets past it.
//
// Historical sources inform it, and card text names none of them (OCCULT.md keeps the sources, and marks what is the
// game's own proposal): the soul's ascent through seven zones, giving each back the energy it lent (Corpus
// Hermeticum I; reading the zones as the planets is the commentators'); the Ophite diagram's seven rulers and the
// words that get the soul past them (Origen, Contra Celsum VI); the Sethian account of a maker who knows and keeps
// the light, and the Valentinian account of one who doesn't know there's anything above it; the planetary days,
// metals and correspondences of Renaissance magic and alchemy; the Key of Solomon's preparation and pentacles, and
// the Lesser Key's binding and its license to depart; True Will against the lust of result (Liber AL).
//
// The two paths are the game's own, and neither is the good one. One rule prices them alike: the Pull prices
// authority (making yourself law over others or the world), never refusal; the Cage prices surrender of judgment
// (handing it to an order), never devotion. What you hold is your path; there is no alignment meter.
//
// fx key added here: occ (engine.js occFx), an object of operations run in order.

import { WEEK, SIGNS, ARCANA, DIGNITY_WORD, dignity, dayPlanet, reading } from "./arcana.js";
import { ENCOUNTERS, RELICS } from "./ascension.js";

// ---------- the Seven Spheres ----------
// Each sphere holds a garment (what it lent the soul on the way down, in paraphrase), the track of the run that garment
// is, the line that track must fall to on its own day for the garment to be given back, its metal, the relic cut from
// it, and the Chain the Grammar speaks for it (a binding is a Chain you gave in to). hidden: a track the run hasn't
// shown yet (the Cage until seen, the Pull until the first chapel) can't be given back, and isn't named.
export const SPHERES = {
  moon: { name: "the Moon", glyph: "☽", garment: "increase and decrease", holds: "hollow", line: 1, metal: "silver", relic: "glass", chain: "debility", gift: { hollow: -1 }, lash: { hollow: 1 } },
  mercury: { name: "Mercury", glyph: "☿", garment: "guile", holds: "mark", line: 2, metal: "quicksilver", relic: "key", chain: "monopoly", gift: { mark: -1 }, lash: { mark: 1 } },
  venus: { name: "Venus", glyph: "♀", garment: "desire that deceives", holds: "longing", line: 1, metal: "copper", relic: "lamp", chain: "indulgence", gift: { longing: -1 }, lash: { longing: 1 } },
  sun: { name: "the Sun", glyph: "☉", garment: "the arrogance of rule", holds: "apo", line: 1, metal: "gold", relic: "halo", chain: "omnipotence", gift: { strain: -1 }, lash: { apo: 1 }, hidden: "apo" },
  mars: { name: "Mars", glyph: "♂", garment: "unholy daring", holds: "strain", line: 2, metal: "iron", relic: null, chain: "threats", gift: { strain: -1 }, lash: { strain: 1 } },
  jupiter: { name: "Jupiter", glyph: "♃", garment: "striving after wealth", holds: "favor", line: 4, metal: "tin", relic: "purse", chain: "trivial", gift: { favor: 2 }, lash: { favor: -1 } },
  saturn: { name: "Saturn", glyph: "♄", garment: "the falsehood that lies in wait", holds: "cage", line: 1, metal: "lead", relic: "crown", chain: "isolation", gift: { cage: -1 }, lash: { cage: 1 }, hidden: "cage" },
};
// The ladder, as the soul climbs it: the Moon's sphere nearest, Saturn's at the top.
export const LADDER = ["moon", "mercury", "venus", "sun", "mars", "jupiter", "saturn"];
// How a gate was passed, as the nightfall and the ladder say it.
export const MEANS = {
  given: "given back",
  named: "passed by name",
  bound: "bound",
  released: "released",
  stormed: "stormed",
  defied: "defied",
  key: "opened with the Serpent's Key",
};
export const TRACK_WORD = { hollow: "Hollow", mark: "Mark", longing: "Longing", apo: "the Pull", strain: "Strain", favor: "Favor", cage: "the Cage" };
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
export const sphereName = (p, start = false) => (start ? cap(SPHERES[p].name) : SPHERES[p].name);

// Dials (Milestone E tunes these against the sims; EXODUS.md and OCCULT.md quote the figures).
// nameAt: the Gnosis a gate passes by name at. sabbath: what the Sabbath gives. quiet: a passed gate's toll goes quiet.
// roads: the weight of the expansion's road cards in the deck.
// stair, well, rung: the chapels' stair, the second movement's well, the Trap's second rung read through the ascent.
export const OCC_TUNING = { nameAt: 6, sabbath: { strain: -2, hollow: -1 }, quiet: true, roads: 1, stair: true, well: true, rung: true };

// ---------- readers ----------
export const occOf = (s) => (s && s.asc && s.asc.occ) || null;
// The day's sphere: the Celestial Arcana's sky when the run has one (so a sky turned at the Trial counts), else the
// expansion's own, derived exactly as the Arcana's would be.
export const occDay = (s) => {
  const o = occOf(s);
  if (!o) return null;
  return s.arc ? dayPlanet(s) : WEEK[(o.wk + s.day - 1) % 7];
};
export const occSign = (s) => (s.arc ? s.arc.sign : occOf(s).sign);
export const occDignity = (s, p) => dignity(p, occSign(s));
export const riteOn = (s, k) => !!(occOf(s) && occOf(s).rites.includes(k));
// A sphere's gate: how it was passed (MEANS), or null while it still holds.
export const gateOf = (s, p) => (occOf(s) && occOf(s).spheres[p]) || null;
export const gatesPassed = (s) => (occOf(s) ? LADDER.filter((p) => occOf(s).spheres[p]).length : 0);
// Whether a sphere's track is one the run has shown (the Cage, the Pull).
export const shownTrack = (s, p) => {
  const h = SPHERES[p].hidden;
  return !h || (h === "cage" ? !!s.cageSeen : !!(s.asc && s.asc.apoSeen));
};

// The day's sky after the Seven's gates: a passed sphere's toll is quiet for the run; a bound one gives its boon even in
// exile and its toll never; a released one is quiet, and under Wisdom's account an ally (its boon even in exile); a
// warded day has neither. t is arcana.js planetToday(s); without the expansion it comes back untouched.
export function occSky(s, t) {
  const o = occOf(s);
  if (!o || !t) return t;
  if (o.warded === s.day) return { ...t, boon: false, cost: false };
  const g = o.spheres[t.p];
  let { boon, cost } = t;
  if (g && (OCC_TUNING.quiet || g === "bound" || g === "released")) cost = false;
  if (g === "bound" || (g === "released" && o.account === "wisdom")) boon = true;
  if (o.defied === s.day) cost = false;
  return { ...t, boon, cost };
}

// The expansion's own standing shapes, in the Minor Arcana's vocabulary (arcana.js minorFx): the engine reads them
// beside the Minors wherever it reads those.
export function occStanding(s) {
  const o = occOf(s);
  if (!o) return [];
  const out = [];
  if (o.rites.includes("name")) out.push({ t: "rise", k: "untag", d: 1, from: "The Taken Name" });
  if (o.account === "wisdom") out.push({ t: "rise", k: "cage", d: 1, big: true, from: "Wisdom's account" });
  return out;
}

// The deck, with the expansion: the Fast and the Sabbath keep the Whisper away (the day of the Sabbath, until nightfall).
export const occWeight = (s, c) => (c.id === "whisper" && (riteOn(s, "fast") || occOf(s).sabbath === s.day) ? 0 : c.id.startsWith("o_") ? OCC_TUNING.roads : 1);

// ---------- the Hermetic correspondences ----------
// Each relic is cut from one sphere's metal (SPHERES relic). Worked on its own sphere's day it's in its hour: no price
// when the sphere is at home or exalted in the sky's sign, its price twice in exile, as ever as a stranger.
export const sphereOfRelic = (k) => Object.keys(SPHERES).find((p) => SPHERES[p].relic === k) || null;
export function hourOf(s, k) {
  const p = sphereOfRelic(k);
  if (!occOf(s) || !p || occDay(s) !== p) return 1;
  const d = occDignity(s, p);
  return d > 0 ? 0 : d < 0 ? 2 : 1;
}
// A card's planet: its ruler, or its sign's traditional ruler (an element has none). As above, so below: a relic whose
// sphere rules the card being read can turn that reading.
export function rulerPlanet(k) {
  const r = ARCANA[k] && ARCANA[k].ruler;
  if (!r) return null;
  if (r.planet) return r.planet;
  const sign = r.sign && SIGNS.find((x) => x.k === r.sign);
  return sign ? sign.ruler : null;
}
// Whether relic k can Correspond on the card being read now: a reading, face down, reversed, ruled by its sphere.
export function corresponds(s, k) {
  const c = reading(s);
  const p = sphereOfRelic(k); // a relic with no sphere (the Breadth relics) never corresponds
  return !!(p && occOf(s) && c && c.rev && rulerPlanet(c.id) === p);
}

// The Great Work: one relic a run goes into the vessel at the first chapel (blackening: it can't be worked or
// transmuted through the second movement) and comes out at the second as its Stone, once, with a new working and a
// larger transmutation (engine.js stoneFx).
export const STONES = {
  glass: { name: "The Clear Glass", works: "this card's rolls at advantage and +1, at no price", transmute: "Longing −3" },
  key: { name: "The Serpent's Key", works: "a seal opens or an intent is answered; on the road, today's gate opens at nightfall", transmute: "Untaggable +3" },
  halo: { name: "The Mended Halo", works: "the adversary's clock −2 (outside a fight, Mark −2), and the Pull doesn't move", transmute: "the Pull −3" },
  crown: { name: "The Leaden Crown", works: "this card's rolls can't miss, and the Pull doesn't move", transmute: "the Pull −2, Mark −2" },
  lamp: { name: "The Open Lamp", works: "a spent Bond comes back, to catch you once more", transmute: "a spent Bond still stands beside you, and Longing −1" },
  purse: { name: "The Tin Purse", works: "one debt to the Seven paid, or the gilt cleared, or Favor +1", transmute: "Favor +2, and no gilt" },
};
export const inVessel = (s, k) => !!(occOf(s) && occOf(s).vessel && occOf(s).vessel.k === k);
export const isStone = (s, k) => !!(occOf(s) && occOf(s).stones.includes(k));
// The relics a chapel, a full slot or the Trial can take from you: never the one in the vessel.
export const looseRelics = (s) => s.asc.relics.filter((k) => !inVessel(s, k));

// ---------- the Law of the Star ----------
// Your orbit, read from the road: the kind of road you won most (evade, know, people), ties to people if you freed any
// of the Named, then to knowing; nothing won reads as evading (you got through).
export function orbitOf(s) {
  const n = { evade: 0, know: 0, people: 0 };
  for (const m of s.asc.met) {
    const r = ENCOUNTERS[m.id] && ENCOUNTERS[m.id].roads[m.out];
    if (r) n[r.kind]++;
  }
  const top = Math.max(n.evade, n.know, n.people);
  if (!top) return "evade";
  if (n.people === top && (s.asc.freed >= 1 || (n.know < top && n.evade < top))) return "people";
  if (n.know === top) return "know";
  return n.people === top ? "people" : "evade";
}
export const ORBIT = { evade: "getting through unseen", know: "knowing", people: "other people" };

// The path a run is walking, from the rites it holds: a Serpent's Way rite, a Way of Return rite, both, or neither.
export const PATHS = {
  serpent: "the Serpent's Way",
  return: "the Way of Return",
  between: "between the two ways",
  neither: "neither way",
};
export function pathOf(s) {
  const o = occOf(s);
  if (!o) return null;
  const sides = new Set(o.rites.map((k) => (RITES[k] ? RITES[k].path : null)).filter(Boolean));
  return sides.size === 2 ? "between" : sides.has("serpent") ? "serpent" : sides.has("return") ? "return" : "neither";
}

// ---------- the two paths ----------
// Each rite is a new decision, a limitation and a risk (engine.js reads each by riteOn at one site). The Serpent's
// rites trade in exposure, and only the Crown Taken in the Pull; the Return's dissolve a dependency for a limitation.
export const RITES = {
  refusal: {
    path: "serpent", name: "Refusal",
    gift: "Refuse: an intent you don't answer is refused instead of landing; outside a fight, today's gate is stormed",
    limit: "A refusal counts as answering: no pressing on while it lands",
    risk: "Mark +1 each refusal; a storm, Strain +1 and Mark +1",
    tag: "Mark +1 a refusal",
  },
  name: {
    path: "serpent", name: "The Taken Name",
    gift: "Every Untaggable rise is 1 bigger, and no adversary can read your Mask",
    limit: "Bonds don't catch you (they still stand beside you)",
    risk: "Nobody catches the fall",
    tag: "no Bond catches you",
  },
  crown: {
    path: "serpent", name: "The Crown Taken",
    gift: "Once a movement a miss lands as 7–9, and Activation always holds (no Gnosis from it)",
    limit: "Gnosis can't rise from the Pull 4",
    risk: "The Pull +2 now",
    tag: "the Pull +2 now",
  },
  fast: {
    path: "return", name: "The Fast",
    gift: "The False Light can't find you: no Whisper, and no card bills you Light",
    limit: "In the Festival, relief that isn't answered doesn't land; only its clock does",
    risk: "Strain with nowhere to go",
    tag: "Festival: no relief",
  },
  poverty: {
    path: "return", name: "The Vow of Poverty",
    gift: "An empty purse at nightfall doesn't end you: Favor 1",
    limit: "Favor can't rise above 3, and the Purse stays shut",
    risk: "Fracture is harder to buy off",
    tag: "Favor stops at 3",
  },
  named: {
    path: "return", name: "The Vow to the Named",
    gift: "People roads need 1 fewer (never below 2), and each of the Named freed: Longing −1",
    limit: "Disengaging costs Strain +2 (never the sixth)",
    risk: "Driven out more often",
    tag: "leaving: Strain +2",
  },
};
export const RITES_OF = (path) => Object.keys(RITES).filter((k) => RITES[k].path === path);

// What a rite does, as the card that offers it says it (one line each side of the Two Rites).
// Short enough that the two fit the prompt at the smallest phone; the limit and risk ride under each choice (tag),
// and the whole rite is on the sky sheet.
const RITE_LINE = {
  refusal: "Refusal: refuse an intent instead of answering it",
  name: "The Taken Name: Untaggable grows faster, and nobody reads your Mask",
  crown: "The Crown Taken: a miss held each movement, and Activation holds",
  fast: "The Fast: the False Light can't find you",
  poverty: "The Vow of Poverty: an empty purse never ends you",
  named: "The Vow to the Named: people roads need one fewer",
};
// The accounts of the Architect, and what each changes (the Two Accounts; occult.js readers and engine.js).
export const ACCOUNTS = {
  serpent: { name: "the Serpent's account", title: "The Serpent's account", short: "It knows, and keeps the light" },
  wisdom: { name: "Wisdom's account", title: "Wisdom's account", short: "It doesn't know there's anything above it" },
  unsaid: { name: "the Unsaid", title: "The Unsaid", short: "Neither story is the thing" },
};

// Two rites, one of each way, from those not held or laid down: picked by the seed and the chapel, as relics are.
const occHash = (str) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) (h ^= str.charCodeAt(i)), (h = Math.imul(h, 16777619) >>> 0);
  return h >>> 0;
};
export function ritePair(s) {
  const o = occOf(s);
  const free = (path) =>
    RITES_OF(path).filter((k) => !o.rites.includes(k) && !o.renounced.includes(k) && !(k === "fast" && (s.communion > 0 || s.reckoning > 0)));
  const h = occHash(`${s.seedLabel}:rites:${o.chapel}`);
  const pick = (xs, salt) => (xs.length ? xs[(h >>> salt) % xs.length] : null);
  return [pick(free("serpent"), 0), pick(free("return"), 8)];
}
const riteSide = (k) => ({
  label: RITES[k].name,
  tag: RITES[k].tag,
  fx: { occ: { rite: k }, ...(k === "crown" ? { apo: 2 } : {}) },
  text: `${RITES[k].name}. ${cap(RITES[k].gift)}. ${cap(RITES[k].limit)}.`,
});
// The account a run holds, for a card's branching text: one of ACCOUNTS, or "none" before the well.
const acct = (s) => (occOf(s) && occOf(s).account) || "none";
const by = (s, x) => (x[acct(s)] !== undefined ? x[acct(s)] : x.none);
const occRo = (text, fx) => ({ text, fx });

// ---------- the cards ----------
// frame: how app.js draws the card's border (rite, ways, account, seat, star, seal; index.html), never a rule.
// Forced dusk cards (outside the day: no Bell, no road card counted, no draw), queued only at the chapels and on
// entering the second movement (engine.js occQueue), and road cards dealt only in a run that has the expansion.
// Every build() reads a run without the expansion too, and gives the card as it stands.
export const OCC_CARDS = [
  // The first and second chapels: the stair under the chapel, after the reading.
  {
    id: "o_stair", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "stair", frame: "rite", who: "The Crypt Stair", tierText: "at dusk",
    text: "Under the chapel a stair goes down to where the old rites were kept. Upstairs the living lay a table, and nobody counts anything tonight.",
    build(s) {
      // The Sabbath is a rest: after a night already rested here it's the company, not the sleep.
      const rested = s.restedToday;
      return {
        ...this,
        right: { ...this.right, tag: rested ? "Longing −1 · no Whisper" : "a rest · no Whisper", text: rested ? "The Sabbath. You'd already slept; the bread goes round anyway. Longing −1, and the Whisper can't find you until nightfall." : this.right.text },
      };
    },
    left: { label: "Go down", tag: "Strain +1 · two rites", fx: { strain: 1, occ: { next: "o_rites" } }, text: "The stair is steep, and the dark at the bottom costs: Strain +1. Two doors. Each is a way to walk the rest of the road." },
    right: { label: "Stay with the living", fx: { occ: { sabbath: true } }, text: "The Sabbath. The bread goes round twice. Strain −2, Hollow −1, and the Whisper can't find you until nightfall." },
  },
  {
    id: "o_rites", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "ways", frame: "ways", who: "Two Rites", tierText: "at dusk",
    text: "Two doors. Neither is a reward.",
    build(s) {
      if (!occOf(s)) return this;
      const [l, r] = ritePair(s);
      if (!l || !r) return this;
      return {
        ...this,
        who: "Two Rites · the Serpent's Way ◀ ▶ the Way of Return",
        text: `◀ ${RITE_LINE[l]}. ▶ ${RITE_LINE[r]}.`,
        left: riteSide(l),
        right: riteSide(r),
      };
    },
    left: { label: "Take neither", fx: {}, text: "You go back up." },
    right: { label: "Take neither", fx: {}, text: "You go back up." },
  },
  // The second chapel: the Law of the Star, after the rite. It reads your orbit from the road you walked.
  {
    id: "o_star", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "orbit", frame: "star", who: "The Law of the Star", tierText: "at dusk",
    text: "Every road has a star over it. You've been walking yours.",
    build(s) {
      if (!occOf(s)) return this;
      const a = s.asc;
      const orbit = orbitOf(s);
      const against = orbit === "know" && a.hist.light ? ` You took the Light ${a.hist.light === 1 ? "once" : `${a.hist.light} times`}, and the Light is the opposite of knowing.`
        : orbit === "people" && a.escalated ? ` You finished ${a.escalated === 1 ? "a fight" : `${a.escalated} fights`} you could have stopped.`
        : orbit === "evade" && s.mark >= 4 ? " And they all know your face."
        : "";
      const crown = occOf(s).rites.includes("crown");
      return {
        ...this,
        text: `Every road has a star over it. Your orbit is ${ORBIT[orbit]}.${against}${crown ? " The Crown you took is the chair's will." : ""}`,
        left: { label: "Walk your orbit", tag: crown ? "the Crown laid down" : "the stop pays Gnosis", fx: { strain: 1, occ: { walk: orbit } }, text: `Initiation costs: Strain +1. Your will is ${ORBIT[orbit]}, with no hunger for how it turns out.` },
        right: { label: "Name another Will", tag: "the Pull +1 · quoted", fx: { strain: -2, favor: 1, apo: 1, occ: { claim: true } }, text: "Their will, named as yours. It's a relief, and it pays, and the Pull +1. The Oldest Trap will read it back to you." },
      };
    },
    left: { label: "Walk your orbit", fx: {} },
    right: { label: "Name another Will", fx: {} },
  },
  // The second movement's road, entered: the well past the Warrens.
  {
    id: "o_voices", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "cup", frame: "account", who: "Two Voices at the Well", tierText: "at dusk",
    text: "At the well past the Warrens, two women argue about the Architect in low voices, as if it could hear. Each is sure she knows what it is.",
    left: { label: "Hear them out", tag: "two accounts", fx: { occ: { next: "o_accounts" } }, text: "You set your bucket down." },
    right: { label: "Neither knows", tag: "the Unsaid", fx: { occ: { account: "unsaid" } }, text: "What's above the Architect isn't in either story. It isn't in any. The Unsaid: the Contradiction Seat favors you, certainty never comes for you, and there's no shortcut through the gates." },
  },
  {
    id: "o_accounts", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "eye", frame: "account", who: "The Two Accounts", tierText: "at dusk",
    text: "◀ It knows, and keeps the light: its gates open to a name, once you know enough. ▶ It doesn't know there's anything above it: the Seven can be let go.",
    left: { label: "Serpent's account", tag: "names at Gnosis 6", fx: { occ: { account: "serpent" }, gnosis: 1 }, text: "A keeper, then, and a lock with words for a key. Gnosis +1." },
    right: { label: "Wisdom's account", tag: "release · mercy keeps", fx: { occ: { account: "wisdom" }, longing: -1 }, text: "Something that doesn't know any better. It's easier to forgive. Longing −1." },
  },

  // ---------- road cards (Exodus, with the expansion only) ----------
  {
    id: "o_second", act: [2, 3], tier: 1, art: "veil", frame: "seat", who: "The Second Account", weight: 2, once: true,
    when: (s) => ["serpent", "wisdom"].includes(acct(s)),
    text: "A dyer at the vats tells it the other way round, and she's very sure.",
    build(s) {
      const text = acct(s) === "wisdom"
        ? "A dyer at the vats tells it the other way: the Architect knows exactly what it's doing. It always has."
        : "A dyer at the vats tells it the other way: the Architect doesn't know what it's doing. It never has.";
      return { ...this, text };
    },
    left: { label: "Hold to yours", fx: { strain: -1 }, text: "You've heard it before. You know what you think." },
    right: {
      label: "The Contradiction Seat",
      roll: { stat: "wits", seat: true },
      hit: occRo("She's right that neither story is the thing, and so are you. You let both go. The Unsaid.", { occ: { account: "unsaid" }, gnosis: 1 }),
      mid: occRo("One assumption was wrong. You come round to hers.", { occ: { account: "other" } }),
      miss: occRo("She says you wanted an answer too badly, and she's right. Yours stands. You're a little smaller, which helps.", { strain: 1, apo: -1 }),
    },
  },
  {
    id: "o_glint", act: [1, 2], tier: 0, art: "star", who: "The Glint", weight: 1, once: true,
    text: "A child in the dye-yard keeps a jar of glints from the gutter. She asks you where they come from.",
    build(s) {
      return {
        ...this,
        left: by(s, {
          serpent: { label: "Tell her they were taken", fx: { gnosis: 1, mark: 1 }, text: "Taken, and kept, and someone's counting. A man by the vats hears you say it." },
          wisdom: { label: "Tell her they fell", fx: { gnosis: 1, longing: 1 }, text: "Someone grieved, and they fell. She holds the jar tighter. So do you, a little." },
          unsaid: { label: "Tell her nobody knows", fx: { gnosis: 1 }, text: "From higher than anyone can say. She likes that better than any story." },
          none: { label: "Tell her they fell", fx: { gnosis: 1, mark: 1 }, text: "From somewhere higher. A man by the vats hears you say it." },
        }),
      };
    },
    left: { label: "Tell her they fell", fx: {} },
    right: { label: "Let her keep her story", fx: { longing: -1 }, text: "She'll tell it better than you would." },
  },
  {
    id: "o_well", act: [2, 3], tier: 0, art: "cup", who: "The Well", weight: 1, once: true,
    text: "The well behind the almshouse shows a sky that isn't the one overhead.",
    left: {
      label: "Look down", roll: { stat: "wits" },
      hit: occRo("It's the sky from before the Geometry. You remember it.", { gnosis: 2 }),
      mid: occRo("A glimpse, and the ache of it.", { gnosis: 1, strain: 1 }),
      miss: occRo("You look too long and come back cold.", { hollow: 1, longing: 1 }),
    },
    right: { label: "Draw water and go", fx: { hollow: -1 }, text: "Cold water, and the walk home. That's something." },
  },
  {
    id: "o_serpent", act: [1, 2], tier: 1, art: "serpent", who: "The Dye-Yard Serpent", weight: 1, once: true,
    text: "Someone painted a serpent on the indigo vat. The overseer wants it scrubbed off before the inspection.",
    build(s) {
      return acct(s) === "serpent"
        ? { ...this, right: { label: "Paint its eye back in", fx: { mark: 1, gnosis: 1, untag: 1 }, text: "You know where the eye goes. So does whoever painted it. Untaggable +1." } }
        : this;
    },
    left: { label: "Scrub it", fx: { favor: 1, untag: -1 }, text: "He pays a coin. The serpent goes grey, and stays there under the blue." },
    right: { label: "Paint its eye back in", fx: { mark: 1, gnosis: 1 }, text: "Somebody saw. Somebody else saw it looking back." },
  },
  {
    id: "o_lamp", act: [2, 3], tier: 0, art: "lantern", who: "The Lamplighter", weight: 1, once: true,
    text: "She lights the lamps the Dominion doesn't count, in streets it says aren't there.",
    build(s) {
      return {
        ...this,
        right: by(s, {
          serpent: { label: "Ask whose light it is", fx: { gnosis: 1, longing: 1 }, text: "“Stolen,” she says. “Every lamp is a little of it back.”" },
          wisdom: { label: "Ask whose light it is", fx: { longing: -1 }, text: "“Hers,” she says. “She dropped it. We're carrying it home.”" },
          none: { label: "Ask whose light it is", fx: { gnosis: 1 }, text: "She doesn't say. She hands you the taper." },
        }),
      };
    },
    left: { label: "Carry her ladder", fx: { strain: 1, cage: -1, untag: 1 }, text: "Your arms ache, and you learn streets nobody counts. Something that was closing on you doesn't, tonight." },
    right: { label: "Ask whose light it is", fx: {} },
  },
  {
    id: "o_word", act: [2, 3], tier: 0, art: "letter", who: "A Word From the Margin", weight: 2, once: true,
    when: (s) => s.asc.freed >= 1,
    text: "Someone you got out of the margin sends you a word they kept all the years they were Named.",
    left: { label: "Keep it", fx: { gnosis: 1, longing: 1 }, text: "You keep it where they kept it. It weighs exactly as much as it should." },
    right: { label: "Pass it to someone still in there", fx: { mark: 1, longing: -1 }, text: "It goes back into the margin with your name on the outside." },
  },
  {
    id: "o_eye", act: [1, 2, 3], tier: 1, art: "eye", who: "The Eye in the Seal", weight: 1, once: true,
    text: "The Office's seal on a notice by the gate. Worked into its border, very small, an Eye. Someone put it there who knew.",
    left: {
      label: "Look closer", roll: { stat: "wits" },
      hit: occRo("The Ophite Eye, the same one. They hid it in their own seal, and the seal never noticed.", { gnosis: 2, untag: 1 }),
      mid: occRo("You're sure of it. So is the clerk who sees you looking.", { gnosis: 1, mark: 1 }),
      miss: occRo("A clerk sees you looking, and writes something down.", { mark: 2 }),
    },
    right: { label: "Walk past", fx: { strain: -1 }, text: "Not today. It's been there a long time. It'll keep." },
  },
  {
    id: "o_mirror", act: [2, 3], tier: 0, art: "veil", who: "A Cracked Mirror", weight: 1, once: true,
    text: "In the chapel's cracked mirror, for a moment, something that isn't you.",
    build(s) {
      const text = by(s, {
        wisdom: "In the chapel's cracked mirror, for a moment, a woman's grief that isn't yours.",
        serpent: "In the chapel's cracked mirror, for a moment, a hand at the back of your neck that isn't there.",
        none: "In the chapel's cracked mirror, for a moment, nothing at all, which is the strangest thing it could show.",
      });
      return { ...this, text };
    },
    left: { label: "Mend it", fx: { favor: -1, longing: -1 }, text: "Glue and a borrowed clamp. It shows the room again, more or less." },
    right: { label: "Break it the rest of the way", fx: { strain: 1, gnosis: 1 }, text: "Seven pieces. You don't count them on purpose." },
  },
  {
    id: "o_table", act: [2, 3], tier: 0, art: "cup", who: "The Long Table", weight: 2, once: true,
    when: (s) => !!(occOf(s) && occOf(s).sabbaths >= 1),
    text: "The people from the Sabbath have laid the table again, in a yard the Dominion has no name for. Nobody counts the places.",
    left: { label: "Sit down", fx: { strain: -1, hollow: -1, mark: 1 }, text: "You're seen with them. You stay anyway. That's what the Fullness feels like, from here." },
    right: { label: "Bring what you have", fx: { favor: -2, longing: -1, cage: -1 }, text: "It isn't much. It goes round." },
  },
  {
    id: "o_seal", act: [1, 2, 3], tier: 1, art: "seal", frame: "seal", who: "A Seal on the Lintel", weight: 2,
    when: (s) => sealOpen(s),
    text: "Over the Office's door, a seal of the day's sphere, worked the Dominion's way.",
    build(s) {
      const o = occOf(s);
      const p = occDay(s);
      if (!o || !p) return this;
      const x = SPHERES[p];
      const [l, r] = approaches(s, p);
      const key = o.spheres[p] === "bound" ? p + "+" : p;
      const d = DIGNITY_WORD[occDignity(s, p)];
      return {
        ...this,
        who: `A Seal on the Lintel · ${sphereName(p, true)} ${x.glyph}\uFE0E`,
        text: o.spheres[p] === "bound"
          ? `Over the Office's door, ${x.name}'s seal, and your binding on it still. Today ${x.name} is ${d}.`
          : `Over the Office's door, ${x.name}'s seal, worked the Dominion's way: ${x.garment}. Today ${x.name} is ${d}, and a bargain would cost ${sealPrice(s, p)}.`,
        left: seen(approach(s, l, p), key),
        right: seen(approach(s, r, p), key),
      };
    },
    left: { label: "Command it", fx: {} },
    right: { label: "Ward the day", fx: {} },
  },
  {
    id: "o_lay", act: [2, 3], tier: 0, art: "grave", who: "Lay It Down", weight: 1, once: true,
    when: (s) => !!(occOf(s) && occOf(s).rites.length),
    text: "At a crossroads shrine, people leave what they've carried too long.",
    build(s) {
      const o = occOf(s);
      const k = o && o.rites[0];
      if (!k) return this;
      return {
        ...this,
        text: `At a crossroads shrine, people leave what they've carried too long. You could leave ${RITES[k].name.replace(/^The /, "the ")} here.`,
        left: { label: "Lay it down", tag: "Strain +2 · it's gone", fx: { strain: 2, occ: { lay: k } }, text: "It's harder to put down than it was to pick up. Strain +2. It's gone." },
      };
    },
    left: { label: "Lay it down", fx: {} },
    right: { label: "Keep walking", fx: {}, text: "Not yet. Maybe not ever." },
  },
];

// ---------- the Office of Seals ----------
// The Dominion's own seals, turned on the Seven: a seal over a door, of the day's sphere, met once (and once more
// while you hold it bound). Its approaches, by the account you hold (engine.js runs each op of the occ fx):
// Command binds (a Wits roll); Bargain takes its gift now and owes its garment back at the next fight; Ward quiets
// the day (Defy, holding Refusal: the gate passed too); Release lets it go (or unbinds it).
const fxText = (fx) => Object.entries(fx).map(([k, v]) => `${TRACK_WORD[k] || k} ${v < 0 ? "−" : "+"}${Math.abs(v)}`).join(", ");
const times = (fx, n) => Object.fromEntries(Object.entries(fx).map(([k, v]) => [k, v * n]));
export const sealPrice = (s, p) => {
  const d = occDignity(s, p);
  return d > 0 ? 1 : d < 0 ? 3 : 2;
};
export function sealOpen(s) {
  const o = occOf(s);
  const p = occDay(s);
  if (!o || !p) return false;
  const g = o.spheres[p];
  return !g ? !o.seals.includes(p) : g === "bound" && !o.seals.includes(p + "+");
}
const seen = (side, key) => {
  const tag = (fx) => ({ ...(fx || {}), occ: { ...((fx && fx.occ) || {}), seen: key } });
  return side.roll ? { ...side, hit: { ...side.hit, fx: tag(side.hit.fx) }, mid: { ...side.mid, fx: tag(side.mid.fx) }, miss: { ...side.miss, fx: tag(side.miss.fx) } } : { ...side, fx: tag(side.fx) };
};
export function approach(s, k, p) {
  const o = occOf(s);
  const x = SPHERES[p];
  const N = sphereName(p, true);
  const prepared = !!(o.prepared && o.prepared === o.chapel);
  const back = RITES_OF("return").some((r) => o.rites.includes(r));
  switch (k) {
    case "command": {
      const adv = prepared || s.asc.relics.includes(x.relic) || o.account === "serpent";
      const dis = o.account === "wisdom";
      return {
        label: "Command it", verb: "confront", tag: "binds · the Pull +1",
        roll: { stat: "wits", ...(adv && !dis ? { adv: true } : {}), ...(dis && !adv ? { dis: true } : {}) },
        hit: occRo(`${N} is bound: its boon is yours even in exile, its toll never, its gate passed. Binders owe: the Pull +1, and a Chain the Grammar will remember.`, { occ: { bind: p }, apo: 1 }),
        mid: occRo(`Bound, with a struggle. Strain +1, and the Pull +1: binders owe.`, { occ: { bind: p }, apo: 1, strain: 1 }),
        miss: occRo(`It answers, and not as you meant. Mark +1, ${fxText(x.lash)}.`, { mark: 1, ...x.lash }),
      };
    }
    case "bargain": {
      const n = sealPrice(s, p);
      return {
        label: `Bargain: ${fxText(x.gift)} now`, verb: "negotiate", tag: "a debt: next fight",
        fx: { ...x.gift, occ: { debt: p, n } },
        text: `${N} gives, and keeps a tally. It collects at your next fight's start: ${fxText(times(x.lash, n))} (never the sixth of anything).`,
      };
    }
    case "ward":
      if (o.rites.includes("refusal")) return { label: "Defy it", verb: "confront", tag: "Mark +1 · gate passed", fx: { mark: 1, occ: { defy: p } }, text: `You refuse ${x.name} its due. Today's toll is refused and its gate passed. They saw: Mark +1.` };
      return { label: "Ward the day", verb: "endure", tag: prepared ? "free · a quiet day" : "Favor −1 · quiet day", fx: { ...(prepared ? {} : { favor: -1 }), occ: { ward: true } }, text: `A pentacle chalked on the step${prepared ? ", made ready at the chapel" : ", Favor −1 for the chalk and the quiet"}. Today ${x.name} neither gives nor takes.` };
    case "release":
      return {
        label: o.spheres[p] === "bound" ? "Release it" : "Let it go", verb: "unweave", tag: `${back ? "free" : "Strain +1"} · gate passed`,
        fx: { ...(back ? {} : { strain: 1 }), occ: { release: p } },
        text: `${o.spheres[p] === "bound" ? "The binding comes off: the Pull −1, its Chain lifted. " : ""}${back ? "You know how to close a door gently." : "Closing it costs: Strain +1."} ${N}'s toll is quiet now, and its gate passed${o.account === "wisdom" ? ", and it remembers who let it go" : ""}.`,
      };
    default: // hold
      return { label: "Hold it bound", verb: "endure", tag: "it stays bound", fx: {}, text: `It stays bound. So do you, a little.` };
  }
}
// Which two approaches a seal offers, by the account held (and, for a sphere you hold bound, Release or Hold).
export function approaches(s, p) {
  const o = occOf(s);
  if (o.spheres[p] === "bound") return ["release", "hold"];
  return { serpent: ["command", "ward"], wisdom: ["bargain", "release"], unsaid: ["command", "release"] }[o.account] || ["command", "ward"];
}

// ---------- the Oldest Trap, read through the ascent ----------
// The Trap keeps its four rungs (Grandiosity, a temptation, the Gate, the Chair): the expansion picks only the second,
// from the spheres that still hold you. Precedence: the Serpent's account always meets Certainty (the jailer's story
// makes enemies of everyone); otherwise the rungs of spheres still held (Saturn's Certainty, Jupiter's Contempt,
// Venus's Exemption, Mars's Enemy), never Certainty under the Unsaid, the run's own history choosing among them; with
// all four passed, the run's history as before.
const RUNGS = [["saturn", "tr_certain"], ["jupiter", "tr_contempt"], ["venus", "tr_exempt"], ["mars", "tr_enemy"]];
export function occRung(s, pref) {
  const o = occOf(s);
  if (!OCC_TUNING.rung) return pref;
  if (o.account === "serpent") return "tr_certain";
  const unsaid = o.account === "unsaid";
  const held = RUNGS.filter(([p, id]) => !o.spheres[p] && !(unsaid && id === "tr_certain")).map(([, id]) => id);
  if (held.includes(pref)) return pref;
  if (held.length) return held[0];
  return unsaid && pref === "tr_certain" ? "tr_exempt" : pref;
}

// ---------- the endings, read through the path ----------
// No new endings: the same Way Out reads differently by the way it was walked. One line each, under the ending.
export const OCC_READINGS = {
  exodus: {
    serpent: "You took your own name and walked. Nobody gave you leave, and nobody had to.",
    return: "You kept your vows all the way to the door. Alone isn't the same as lost.",
    between: "You walked out holding both ways, and neither one held you.",
    neither: "No rite, no account, no leave asked. A door is a door.",
  },
  flicker: {
    serpent: "Refusal, one street wide, and the sun stuttered.",
    return: "You stopped it without wanting to rule it, which is why it stayed stopped.",
    between: "You broke one rule and kept the rest. That was the whole trick.",
    neither: "One street, one festival, and nobody to thank. It worked.",
  },
  saved_savior: {
    serpent: "The serpent's way ended at a gate held open for others. That surprised everyone, you most.",
    return: "Your vow kept: they went through. You stayed on this side, owed nothing.",
    between: "Sovereign enough to hold the gate, and humble enough to stay.",
    neither: "You held it. That's all, and it's everything.",
  },
  open_gate: {
    serpent: "You refused every gate that wasn't open to all of them.",
    return: "You walked the long way so the Named could walk out under their own names.",
    between: "Both ways led here: to other people.",
    neither: "Not a rite, not a story. Two names out of a margin, and an open gate.",
  },
  the_return: {
    serpent: "You came home by refusing every house that wasn't yours.",
    return: "The long way back, and every vow kept on it.",
    between: "You went out by the serpent's door and came home by the lamp's.",
    neither: "Home before the Bell, with no story about how. That's the Return too.",
  },
  crown: {
    serpent: "Untaggable and awake. You authored yourself, and stopped there.",
    return: "Awake, and owed to nobody. You could have kept walking. You didn't have to.",
  },
  ordinary: {
    serpent: "A key of your own. Sovereignty, it turns out, has an address.",
    return: "A table, a lamp, three people at the fourth hour. That was always the vow.",
  },
  rex: {
    serpent: "Sovereignty that made itself law. The chair didn't take you; you sat.",
    return: "Even a vow can become a throne, once you make others keep it.",
    between: "You held both ways, and then you held everyone.",
  },
  decree: {
    serpent: "You won, and made the winning everyone's law. The trap was never the refusing. It was the ruling.",
    return: "You opened every gate, and kept the keys. Mercy can do that.",
  },
};
export const occReading = (s, end) => {
  const path = pathOf(s);
  const x = OCC_READINGS[end];
  return (x && path && x[path]) || null;
};
