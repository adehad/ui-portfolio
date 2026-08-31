// The fake async API the page talks to: seeded fixture behind an artificial
// latency, paginated 25 at a time like the original service.

import { compileFilter } from "./compile";
import { artists, type Artist } from "./data";
import type { FilterGroup } from "./filterAst";

export const PAGE_SIZE = 25;
const LATENCY_MS = 300;

export type ArtistSummary = { id: string; name: string };
export type SearchPage = { artists: ArtistSummary[]; total: number };

// Pure and synchronous, exported for tests; the async wrappers below only add
// latency.
export function runSearch(ast: FilterGroup, offset: number): SearchPage {
  const matches = artists.filter(compileFilter(ast));
  const start = Math.max(0, offset);
  return {
    artists: matches.slice(start, start + PAGE_SIZE).map(({ id, name }) => ({ id, name })),
    total: matches.length,
  };
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
}

export async function searchArtists(ast: FilterGroup, offset: number): Promise<SearchPage> {
  await delay();
  return runSearch(ast, offset);
}

export async function loadArtist(artistId: string): Promise<Artist | null> {
  await delay();
  return artists.find((artist) => artist.id === artistId) ?? null;
}
