// Original vector language: registration lines, apertures and deliberately broken order.
// Decorative marks carry no gameplay state. Labels and clocks remain the source of truth.
export const EMBLEMS = {
  inquisition: '<path d="M18 12h64v76H18zM30 28h40M30 38h26M30 72h40M50 44v20M40 54h20"/><circle cx="50" cy="54" r="17"/>',
  ledger: '<path d="M14 20h32q4 0 4 6q0-6 4-6h32v64H54q-4 0-4 6q0-6-4-6H14zM50 26v64M24 34h14M24 46h14M62 34h14M62 46h14M62 58h14"/>',
  shepherd: '<path d="M18 80V44a32 32 0 0 1 64 0v36M26 80V44a24 24 0 0 1 48 0v36M18 80h64M38 44v36M50 44v36M62 44v36"/><circle cx="50" cy="27" r="5"/>',
  hierarch: '<path d="M50 10v16M16 46h68M26 72h48M50 26L16 46M50 26l34 20M16 46l10 26M84 46L74 72M50 46v44"/><path d="M42 83l8 7l8-7"/><circle cx="50" cy="26" r="8"/>',
  sentinel: '<path d="M12 50L50 12l38 38L50 88zM27 50L50 27l23 23L50 73zM12 50h24M64 50h24M50 12v24M50 64v24"/><rect x="43" y="43" width="14" height="14"/>',
  grammar: '<path d="M20 16h60v68H20zM30 30h40M30 44h24M30 58h40M30 72h24M68 38v34"/><path d="M10 50h14M76 50h14"/>',
  festival: '<circle cx="50" cy="50" r="24"/><circle cx="50" cy="50" r="13"/><path d="M50 6v14M50 80v14M6 50h14M80 50h14M19 19l10 10M71 71l10 10M19 81l10-10M71 29l10-10M28 7l6 14M66 79l6 14M7 28l14 6M79 66l14 6"/>',
  trap: '<path d="M28 40V16h44v24M24 44h52v16H24zM32 60v28M68 60v28M22 88h18M60 88h18"/><path d="M12 30h12M76 30h12"/>',
  the_return: '<path d="M20 86V38a30 30 0 0 1 60 0v48M34 86V38a16 16 0 0 1 32 0v48M12 86h76M50 60v26"/><path d="M44 67l6-7l6 7"/>',
  open_gate: '<path d="M16 88V24h30M84 88V24H54M46 24v64M54 24v64M8 88h30M62 88h30M50 6v8M34 10l5 7M66 10l-5 7"/>',
  saved_savior: '<path d="M20 86V22h60v64M20 86h60M20 22l42 10v54M62 58h10M30 50v28M38 44v34M46 48v30"/>',
  exodus: '<path d="M20 86V38a30 30 0 0 1 60 0v48M20 86h60M35 86V37l30-13v62M50 60h5"/><path d="M8 92h26M66 92h26"/>',
  flicker: '<path d="M50 8v13M50 79v13M8 50h13M79 50h13M20 20l9 9M71 71l9 9"/><path d="M72 36a25 25 0 1 0-9 36M72 36L58 48l10 6l-13 18"/>',
  decree: '<path d="M28 40V16h44v24M24 44h52v16H24zM32 60v28M68 60v28M22 88h18M60 88h18"/><circle cx="50" cy="50" r="43"/><path d="M12 50h76M50 7v86"/>',
  catalogued: '<path d="M22 12h56v76H22zM32 28h36M32 40h36M32 52h36M32 64h36M32 76h36M50 12v76"/>',
  fluent: '<path d="M18 16h64v68H18zM28 30h44M28 44h44M28 58h44M28 72h44"/><path d="M40 16v68M60 16v68"/>',
  gilded: '<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="23"/><path d="M26 26l48 48M26 74l48-48M50 18v64M18 50h64"/>',
};
export function emblem(key, cls = '') {
  return `<svg class="emblem ${cls}" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${EMBLEMS[key] || EMBLEMS.exodus}</svg>`;
}
export function endingArt(key) {
  if (!EMBLEMS[key]) return '';
  const free = ['the_return','open_gate','saved_savior','exodus','flicker'].includes(key);
  return `<div class="ending-art ${free ? 'freedom' : key === 'decree' ? 'authority' : 'enclosed'}" aria-hidden="true">${emblem(key)}<span></span></div>`;
}

// The occult expansion (occult.js, 2026-10-26): the two ways' marks, in the same line language. Original marks; no
// sigil or seal of any real tradition. Neither is drawn as the good one: no bone, no gold.
Object.assign(EMBLEMS, {
  serpent_way: '<path d="M18 88V30h30v58M18 30l15-14l15 14"/><path d="M24 80q24-6 14-20q-10-14 6-20q14-5 6-16"/><path d="M50 24l7-3M50 24l5 6"/>',
  return_way: '<path d="M52 88V36q0-16 16-16q16 0 16 16v52M48 88h40"/><path d="M28 50l9 14l-9 14l-9-14zM28 42v8M18 88h20"/>',
  between_way: '<path d="M12 88V36h26v52M62 88V36q0-12 13-12q13 0 13 12v52"/><path d="M38 60h24M44 54l-6 6l6 6M56 54l6 6l-6 6"/>',
});

// The Seven Spheres as a ladder of rings, the Moon's innermost (the Ophite diagram, the Hermetic ascent). states maps
// a sphere to how its gate was passed; a passed ring is cut, a bound one doubled, a released one left open. Decorative:
// the sheet's text rows are the record (aria-hidden).
export function ladderArt(order, states, today, glyphs) {
  const rings = order
    .map((p, i) => {
      const r = 12 + i * 5.6;
      const g = states[p];
      const cls = `ring${p === today ? " today" : ""}${g ? " " + (g === "bound" ? "bound" : g === "released" ? "open" : "cut") : ""}`;
      const gap = g === "released" ? ` stroke-dasharray="${(2 * Math.PI * r * 0.86).toFixed(1)} ${(2 * Math.PI * r * 0.14).toFixed(1)}"` : g && g !== "bound" ? ` stroke-dasharray="3 2.4"` : "";
      const ring = `<circle class="${cls}" cx="50" cy="50" r="${r.toFixed(1)}"${gap}/>${g === "bound" ? `<circle class="${cls}" cx="50" cy="50" r="${(r - 1.4).toFixed(1)}"/>` : ""}`;
      const a = -Math.PI / 2 + i * ((2 * Math.PI) / 7);
      return `${ring}<text x="${(50 + r * Math.cos(a)).toFixed(1)}" y="${(50 + r * Math.sin(a) + 1.6).toFixed(1)}" class="glyph${p === today ? " today" : ""}">${glyphs[p]}︎</text>`;
    })
    .join("");
  return `<svg class="ladder" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true"><circle cx="50" cy="50" r="2.2" fill="currentColor" stroke="none"/>${rings}</svg>`;
}
