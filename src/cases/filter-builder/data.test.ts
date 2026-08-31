import { describe, expect, it } from "vitest";
import { artists, generateArtists, musicAttributes } from "@/cases/filter-builder/data";

describe("music fixture", () => {
  it("is deterministic across runs", () => {
    expect(generateArtists()).toEqual(generateArtists());
  });

  it("holds 30 artists with a second results page behind the 25-per-page limit", () => {
    expect(artists).toHaveLength(30);
  });

  it("stays within the declared shape bounds", () => {
    for (const artist of artists) {
      expect(artist.albums.length).toBeGreaterThanOrEqual(2);
      expect(artist.albums.length).toBeLessThanOrEqual(4);
      for (const album of artist.albums) {
        expect(album.released).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(album.tracks.length).toBeGreaterThanOrEqual(4);
        expect(album.tracks.length).toBeLessThanOrEqual(8);
      }
    }
  });

  it("gives every artist a unique name", () => {
    expect(new Set(artists.map((artist) => artist.name)).size).toBe(artists.length);
  });

  it("declares an attribute of every type so each operator family demos", () => {
    const types = new Set(musicAttributes.map((attribute) => attribute.type));
    expect(types).toEqual(new Set(["text", "int", "float", "date", "bool"]));
  });

  it("draws every album label from a pool of at most six", () => {
    const labels = new Set(artists.flatMap((artist) => artist.albums.map((album) => album.label)));
    expect(labels.size).toBeLessThanOrEqual(6);
    expect(labels.size).toBeGreaterThan(1);
  });
});
