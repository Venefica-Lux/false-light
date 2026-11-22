// The Depth Pass: how the things a run holds change one another. Data and pure readers, like occult.js; the engine
// applies the effects (engine.js, SYN_FX) inside the same paths that already price and resolve a card, so the preview,
// the cost line and canWork see exactly what the play will do. A run carries s.asc.syn only when it was begun with them
// (Exodus, the expansion on, depth on); a run saved without it never gains them.
//
// Every synergy is a choice with a price: a spent use, a meter, a once-only limit. None adds a meter. Each Mask has one.
import { occDay, sphereOfRelic } from "./occult.js";

// The engine wires these two readers in at load: they need its tables, and it needs this file.
export const synHost = { bag: null, people: null };

const synOf = (s) => (s.asc && s.asc.syn) || null;
const synFight = (s) => {
  const e = s.asc && s.asc.enc;
  return e && !e.done ? e : null;
};
const synCarried = (s, k) => !!s.asc.relics && s.asc.relics.includes(k);
const synCharged = (s, k) => synCarried(s, k) && (s.asc.charges[k] || 0) > 0;
// A road of the fight's "people" kind that is still short of its need, else null.
const synOpenPeople = (s, e) => {
  const road = e && synHost.people ? synHost.people(e) : null;
  return road && (e.roads[road] || 0) < (e.need[road] || 0) ? road : null;
};

// Where a limit is kept. A fight is its own persisted id, never its name or how many were met.
export function limitKey(s, x) {
  if (x.limit === "run") return x.id;
  if (x.limit === "act") return `${x.id}:a${s.asc.act}`;
  if (x.limit === "fight") return s.asc.enc && s.asc.enc.uid ? `${x.id}:f${s.asc.enc.uid}` : null;
  return null;
}
const synFresh = (s, x) => {
  const k = limitKey(s, x);
  return x.limit === "none" || (k !== null && !synOf(s).used[k]);
};
// The Bond a refusal would call as a witness: the first held one that hasn't yet.
export const witnessBond = (s) => (s.bonds || []).find((b) => !synOf(s).witnessed.includes(b)) || null;
// What Classify laid on a fight that its own record can undo: [stat, value it replaced] pairs.
export const liftable = (e) => Object.entries(e.cls || {}).filter(([k, was]) => (e.mods[k] || 0) !== was);

export const SYNERGIES = [
  {
    id: "unfiled", name: "The Unfiled Name", hook: "work", limit: "fight",
    needs: (s, c) => {
      const e = synFight(s);
      if (!e || c.k !== "key" || !synCharged(s, "glass") || !e.next || !synHost.bag || !synFresh(s, SYNERGIES[0])) return false;
      return synHost.bag(s, e).some((i) => i !== e.next);
    },
    line: "Glass carried: the Key also strikes the telegraphed intent, for a Glass use and Longing +1. Once a fight.",
    note: "the next intent is struck from this fight; a Glass use and Longing +1.",
    clue: "A name that was never written down cannot be read back to you.",
  },
  {
    id: "throne", name: "The Empty Throne", hook: "stop", limit: "run",
    needs: (s, c) => synCarried(s, "halo") && synCarried(s, "crown") && (c.finish || (synCharged(s, "halo") && synFresh(s, SYNERGIES[1]))),
    line: "Halo and Crown carried: stopping is the Pull −1, next clock −1, a Halo use, once a run. Finishing: the Pull +1 more.",
    note: "the chair stays empty: the Pull −1, a Halo use, and the next fight begins a step later.",
    clue: "Two crowns and no one to wear them is a kind of refusal.",
  },
  {
    id: "witness", name: "The Witnessed Refusal", hook: "refuse", limit: "run",
    needs: (s) => {
      const e = synFight(s);
      return !!(e && synOf(s) && witnessBond(s) && synOpenPeople(s, e));
    },
    line: "A refusal that lands with a Bond held and a people road in the fight lifts that road +1. Each Bond witnesses once a run.",
    note: "someone who knows your name saw you say no; the people road +1.",
    clue: "A no is heavier when someone is standing next to it.",
  },
  {
    id: "revelation", name: "The Dangerous Revelation", hook: "work", limit: "none",
    needs: (s, c) => s.mask === "lilith" && c.k === "glass" && !synOf(s).laid,
    line: "Lilith working the Glass: a hit on the card pays Gnosis +1 (+2 with her hunger); a miss, Longing +1 and Mark +1.",
    note: "a revelation is laid on this card: a hit pays Gnosis, a miss costs Longing and Mark.",
    clue: "Seeing it clearly is not the same as being safe.",
  },
  {
    id: "countermeasure", name: "The Unseen Countermeasure", hook: "work", limit: "act",
    needs: (s, c) => {
      if (s.mask !== "nyx" || !c.k || sphereOfRelic(c.k) !== occDay(s) || !synFresh(s, SYNERGIES[4])) return false;
      const e = synFight(s);
      return e ? !!(e.pattern || liftable(e).length) : s.mark > 0;
    },
    line: "Nyx, the day's own relic: in a fight the Pattern and Classify's marks lift; on the road Mark −1. Strain +1. Once an act.",
    note: "what they had learned of you is undone; Strain +1.",
    clue: "The day's own instrument, used where no one is looking.",
  },
  {
    id: "velvet", name: "The Velvet Intervention", hook: "seal", limit: "none",
    needs: (s) => s.mask === "eris",
    line: "Eris breaking a seal pays the clock −1, Strain +1 and Longing +1 in place of Strain +2.",
    note: "the seal gives way: the clock −1, Strain +1, Longing +1 in place of Strain +2.",
    clue: "A seal opened by hand costs less than one forced.",
  },
  {
    id: "hand", name: "The Plain Hand", hook: "work", limit: "fight",
    needs: (s, c) => {
      const e = synFight(s);
      return !!(e && s.mask === "bare" && c.k === "lamp" && synOpenPeople(s, e) && synFresh(s, SYNERGIES[6]));
    },
    line: "The bare face working the Lamp in a fight lifts the people road +1, at the Lamp's own price. Once a fight.",
    note: "the lamp held out in an open hand; the people road +1.",
    clue: "Nothing hidden is the one thing they were not ready for.",
  },
];

// What a hook would fire now, in table order. [] for a run that carries no synergies. The engine fires them one by one,
// asking again after each (an earlier one can change what a later one needs); this is the view for sheets and previews.
export function synergiesFor(s, hook, ctx = {}) {
  if (!synOf(s)) return [];
  return SYNERGIES.filter((x) => x.hook === hook && x.needs(s, ctx));
}
