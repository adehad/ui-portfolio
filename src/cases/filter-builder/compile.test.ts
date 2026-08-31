import { describe, expect, it } from "vitest";
import { compileFilter, UnknownAttributeError } from "@/cases/filter-builder/compile";
import {
  emptyFilterGroup,
  type FilterGroup,
  type FilterRule,
} from "@/cases/filter-builder/filterAst";
import { musicAttributes, type Album, type Artist, type Track } from "@/cases/filter-builder/data";

let nextId = 0;
function id(): string {
  nextId += 1;
  return `t${nextId}`;
}

function track(partial: Partial<Track>): Track {
  return {
    id: id(),
    title: "Song",
    duration: 200,
    plays: 100,
    rating: 3,
    explicit: false,
    ...partial,
  };
}

function album(partial: Partial<Album>): Album {
  return {
    id: id(),
    title: "Album",
    label: "Alpha",
    released: "2000-01-01",
    tracks: [],
    ...partial,
  };
}

function artist(partial: Partial<Artist>): Artist {
  return {
    id: id(),
    name: "Band",
    country: "Norway",
    genre: "Jazz",
    formed: 1990,
    albums: [],
    ...partial,
  };
}

function rule(partial: Partial<FilterRule>): FilterRule {
  return {
    kind: "rule",
    level: "artist",
    attributeName: "Name",
    operator: "eq",
    values: [],
    ...partial,
  };
}

function group(children: FilterGroup["children"], combinator: "and" | "or" = "and"): FilterGroup {
  return { kind: "group", combinator, children };
}

describe("empty-group semantics", () => {
  it("matches everything on an empty AND and nothing on an empty OR", () => {
    const anyone = artist({});
    expect(compileFilter(emptyFilterGroup("and"))(anyone)).toBe(true);
    expect(compileFilter(emptyFilterGroup("or"))(anyone)).toBe(false);
  });
});

describe("whitelist", () => {
  it("rejects an unknown attribute before evaluating anything", () => {
    const ast = group([rule({ attributeName: "'; DROP TABLE artists; --" })]);
    expect(() => compileFilter(ast)).toThrow(UnknownAttributeError);
  });

  it("rejects a known name used at the wrong level", () => {
    const ast = group([rule({ level: "artist", attributeName: "Rating" })]);
    expect(() => compileFilter(ast)).toThrow(UnknownAttributeError);
  });
});

describe("operators", () => {
  const subject = artist({
    name: "The Example",
    formed: 1985,
    albums: [
      album({
        label: "Alpha",
        released: "1991-06-15",
        tracks: [track({ plays: 50, rating: 4.5 })],
      }),
      album({
        label: "Beta",
        released: "2003-02-01",
        tracks: [track({ plays: 9000, explicit: true })],
      }),
    ],
  });

  const cases: [FilterRule, boolean][] = [
    [rule({ attributeName: "Formed", operator: "eq", values: [1985] }), true],
    [rule({ attributeName: "Formed", operator: "neq", values: [1985] }), false],
    [rule({ attributeName: "Formed", operator: "lt", values: [1985] }), false],
    [rule({ attributeName: "Formed", operator: "lte", values: [1985] }), true],
    [rule({ attributeName: "Formed", operator: "gt", values: [1980] }), true],
    [rule({ attributeName: "Formed", operator: "between", values: [1980, 1990] }), true],
    [rule({ attributeName: "Formed", operator: "between", values: [1990, 1980] }), false],
    [rule({ attributeName: "Formed", operator: "in", values: [1985, 2000] }), true],
    [rule({ attributeName: "Formed", operator: "not_in", values: [1985, 2000] }), false],
    [rule({ attributeName: "Name", operator: "contains", values: ["EXAMPLE"] }), true],
    [rule({ attributeName: "Name", operator: "starts_with", values: ["the ex"] }), true],
    [rule({ attributeName: "Name", operator: "starts_with", values: ["example"] }), false],
    [rule({ attributeName: "Name", operator: "is_null", values: [] }), false],
    [rule({ attributeName: "Name", operator: "is_not_null", values: [] }), true],
    // ISO dates order correctly as strings.
    [
      rule({ level: "album", attributeName: "Released", operator: "lt", values: ["2000-01-01"] }),
      true,
    ],
    [
      rule({
        level: "album",
        attributeName: "Released",
        operator: "between",
        values: ["2003-01-01", "2003-12-31"],
      }),
      true,
    ],
    [rule({ level: "track", attributeName: "Explicit", operator: "eq", values: [true] }), true],
    [rule({ level: "track", attributeName: "Rating", operator: "gte", values: [4.5] }), true],
    // A null operand (blank input) matches nothing, mirroring SQL comparisons
    // with NULL.
    [rule({ attributeName: "Formed", operator: "eq", values: [null] }), false],
    [rule({ attributeName: "Formed", operator: "eq", values: [] }), false],
    // A type-mismatched operand (non-numeric text in a numeric rule) orders
    // against nothing and matches nothing.
    [rule({ attributeName: "Formed", operator: "gt", values: ["abc"] }), false],
    // A type-mismatched or null operand is UNKNOWN, not "not equal": neq and
    // not_in must not fall back to matching everything.
    [rule({ attributeName: "Formed", operator: "neq", values: ["abc"] }), false],
    [rule({ attributeName: "Formed", operator: "neq", values: [null] }), false],
    [rule({ attributeName: "Formed", operator: "not_in", values: ["abc", 2000] }), false],
    [rule({ attributeName: "Formed", operator: "not_in", values: [null] }), false],
    // The De Morgan complement of `in []` matching nothing: an empty list has
    // no member the cell fails to differ from, so not_in [] matches everything.
    [rule({ attributeName: "Formed", operator: "not_in", values: [] }), true],
  ];

  it.each(cases.map(([r, expected]) => [r.attributeName, r.operator, expected, r] as const))(
    "%s %s -> %s",
    (_name, _operator, expected, r) => {
      expect(compileFilter(group([r]))(subject)).toBe(expected);
    },
  );
});

describe("join semantics", () => {
  it("does not match an artist with no albums on an album-level rule", () => {
    const empty = artist({ albums: [] });
    const ast = group([
      rule({ level: "album", attributeName: "Label", operator: "eq", values: ["Alpha"] }),
    ]);
    expect(compileFilter(ast)(empty)).toBe(false);
  });

  it("matches when any single row satisfies the whole predicate", () => {
    const subject = artist({
      albums: [album({ label: "Alpha", tracks: [track({ plays: 10 })] })],
    });
    const ast = group([
      rule({ level: "album", attributeName: "Label", operator: "eq", values: ["Alpha"] }),
      rule({ level: "track", attributeName: "Plays", operator: "lt", values: [100] }),
    ]);
    expect(compileFilter(ast)(subject)).toBe(true);
  });

  it("cannot express one album with A and another with B (the ported JOIN quirk)", () => {
    const subject = artist({
      albums: [album({ label: "Alpha" }), album({ label: "Beta" })],
    });
    const ast = group([
      rule({ level: "album", attributeName: "Label", operator: "eq", values: ["Alpha"] }),
      rule({ level: "album", attributeName: "Label", operator: "eq", values: ["Beta"] }),
    ]);
    expect(compileFilter(ast)(subject)).toBe(false);
  });
});

describe("attribute schema parity", () => {
  it.each(musicAttributes.map((attribute) => [attribute.level, attribute.name] as const))(
    "%s %s resolves to an accessor",
    (level, name) => {
      const ast = group([rule({ level, attributeName: name, operator: "is_not_null" })]);
      expect(() => compileFilter(ast)).not.toThrow();
    },
  );
});

describe("nested subgroups", () => {
  it("joins to track level when the only track rule lives inside a subgroup", () => {
    const subject = artist({ albums: [album({ tracks: [track({ plays: 5000 })] })] });
    const ast = group([
      {
        kind: "group",
        combinator: "or",
        children: [
          rule({ level: "track", attributeName: "Plays", operator: "gt", values: [1000] }),
        ],
      },
    ]);
    expect(compileFilter(ast)(subject)).toBe(true);
  });

  it("joins to album level when the only album rule lives inside a subgroup", () => {
    const subject = artist({ albums: [album({ label: "Gamma" })] });
    const ast = group([
      {
        kind: "group",
        combinator: "or",
        children: [
          rule({ level: "album", attributeName: "Label", operator: "eq", values: ["Gamma"] }),
        ],
      },
    ]);
    expect(compileFilter(ast)(subject)).toBe(true);
  });

  it("an empty OR subgroup matches nothing, even alongside a passing artist rule", () => {
    const subject = artist({ name: "The Example" });
    const ast = group([
      rule({ attributeName: "Name", operator: "eq", values: ["The Example"] }),
      { kind: "group", combinator: "or", children: [] },
    ]);
    expect(compileFilter(ast)(subject)).toBe(false);
  });
});
