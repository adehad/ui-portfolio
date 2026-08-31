// The Artist > Album > Track fixture the demo searches, generated from a
// seeded per-case Faker instance so builds stay byte-stable, and the attribute
// schema the catalog and compiler share.

import { en, Faker } from "@faker-js/faker";
import type { FilterableAttribute } from "./catalog";

export type Track = {
  readonly id: string;
  readonly title: string;
  readonly duration: number;
  readonly plays: number;
  readonly rating: number;
  readonly explicit: boolean;
};

export type Album = {
  readonly id: string;
  readonly title: string;
  readonly label: string;
  readonly released: string;
  readonly tracks: readonly Track[];
};

export type Artist = {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly genre: string;
  readonly formed: number;
  readonly albums: readonly Album[];
};

export const musicAttributes: readonly FilterableAttribute[] = [
  { level: "artist", name: "Name", type: "text" },
  { level: "artist", name: "Country", type: "text" },
  { level: "artist", name: "Genre", type: "text" },
  { level: "artist", name: "Formed", type: "int" },
  { level: "album", name: "Title", type: "text" },
  { level: "album", name: "Label", type: "text" },
  { level: "album", name: "Released", type: "date" },
  { level: "track", name: "Title", type: "text" },
  { level: "track", name: "Duration", type: "int" },
  { level: "track", name: "Plays", type: "int" },
  { level: "track", name: "Rating", type: "float" },
  { level: "track", name: "Explicit", type: "bool" },
];

const SEED = 20260831;
const ARTIST_COUNT = 30;

export function generateArtists(): readonly Artist[] {
  // A case-local instance rather than the shared faker singleton, so another
  // case reseeding the global cannot shift this fixture between builds.
  const faker = new Faker({ locale: en });
  faker.seed(SEED);

  // Six labels shared across all albums keeps the value set small enough for
  // the `in` operator to demo well.
  const labels = Array.from({ length: 6 }, () => faker.company.name());

  const seen = new Set<string>();
  const unique = (make: () => string): string => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = make();
      if (!seen.has(candidate)) {
        seen.add(candidate);
        return candidate;
      }
    }
    const fallback = `${make()} ${seen.size}`;
    seen.add(fallback);
    return fallback;
  };

  const makeTrack = (): Track => ({
    id: faker.string.alphanumeric(8),
    title: faker.music.songName(),
    duration: faker.number.int({ min: 90, max: 600 }),
    plays: faker.number.int({ min: 0, max: 5_000_000 }),
    rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    explicit: faker.datatype.boolean({ probability: 0.2 }),
  });

  const makeAlbum = (): Album => ({
    id: faker.string.alphanumeric(8),
    title: faker.music.album(),
    label: faker.helpers.arrayElement(labels),
    released: faker.date
      .between({ from: "1970-01-01", to: "2025-12-31" })
      .toISOString()
      .slice(0, 10),
    tracks: Array.from({ length: faker.number.int({ min: 4, max: 8 }) }, makeTrack),
  });

  return Array.from({ length: ARTIST_COUNT }, (): Artist => ({
    id: faker.string.alphanumeric(8),
    name: unique(() => faker.music.artist()),
    country: faker.location.country(),
    genre: faker.music.genre(),
    formed: faker.number.int({ min: 1960, max: 2020 }),
    albums: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, makeAlbum),
  }));
}

export const artists: readonly Artist[] = generateArtists();
