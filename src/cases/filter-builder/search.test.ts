import { describe, expect, it } from "vitest";
import { artists } from "@/cases/filter-builder/data";
import { emptyFilterGroup, type FilterGroup } from "@/cases/filter-builder/filterAst";
import { loadArtist, PAGE_SIZE, runSearch } from "@/cases/filter-builder/search";

describe("runSearch pagination", () => {
  it("pages the 30-artist fixture as 25 then 5", () => {
    const first = runSearch(emptyFilterGroup("and"), 0);
    expect(first.total).toBe(30);
    expect(first.artists).toHaveLength(PAGE_SIZE);
    const second = runSearch(emptyFilterGroup("and"), PAGE_SIZE);
    expect(second.artists).toHaveLength(5);
  });

  it("matches nothing on an empty OR", () => {
    expect(runSearch(emptyFilterGroup("or"), 0).total).toBe(0);
  });

  it("keeps the total when a rule doesn't narrow anything", () => {
    const ast: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "artist",
          attributeName: "Formed",
          operator: "between",
          values: [1960, 2020],
        },
      ],
    };
    expect(runSearch(ast, 0).total).toBe(30);
  });

  it("narrows to the artist matching an exact name from the fixture", () => {
    const target = artists[0];
    if (target === undefined) {
      throw new Error("fixture is empty");
    }
    const ast: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "artist",
          attributeName: "Name",
          operator: "eq",
          values: [target.name],
        },
      ],
    };
    const page = runSearch(ast, 0);
    expect(page.total).toBeGreaterThanOrEqual(1);
    expect(page.artists.map((artist) => artist.id)).toContain(target.id);
  });

  it("returns an empty page with the unchanged total when offset is past the end", () => {
    const page = runSearch(emptyFilterGroup("and"), 1000);
    expect(page.artists).toHaveLength(0);
    expect(page.total).toBe(30);
  });

  it("clamps a negative offset to the start of the results", () => {
    const negative = runSearch(emptyFilterGroup("and"), -10);
    const start = runSearch(emptyFilterGroup("and"), 0);
    expect(negative.artists).toEqual(start.artists);
  });
});

describe("loadArtist", () => {
  it("resolves an artist by id and null for an unknown id", async () => {
    const target = artists[0];
    if (target === undefined) {
      throw new Error("fixture is empty");
    }
    const found = await loadArtist(target.id);
    expect(found?.id).toBe(target.id);
    expect(await loadArtist("nope")).toBeNull();
  });
});
