import type { CSSProperties } from "react";

/**
 * A Sector owns one brand hue. Setting `--cdp-sector` on the Sector's root
 * surface is the whole application of it: every tile, edge, tint and accent
 * beneath derives from that one property through color-mix in tokens.css, so
 * no component has to know which Sector it is rendering inside.
 */
const SECTOR_HEXES: Record<string, string> = {
  "drug-delivery": "#9f8fc4",
  "medical-therapy": "#57c2e3",
  "life-sciences": "#8fc685",
  consumer: "#f18759",
};

const FALLBACK_HEX = "#57c2e3";

// Built once at module load, because an object literal in JSX is a fresh prop
// on every render.
const SECTOR_STYLES: Record<string, CSSProperties> = Object.fromEntries(
  Object.entries(SECTOR_HEXES).map(([id, hex]) => [id, { "--cdp-sector": hex } as CSSProperties]),
);

const FALLBACK_STYLE = { "--cdp-sector": FALLBACK_HEX } as CSSProperties;

export function sectorStyle(sectorId: string): CSSProperties {
  return SECTOR_STYLES[sectorId] ?? FALLBACK_STYLE;
}
