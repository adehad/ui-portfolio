import { describe, expect, it } from "vitest";
import {
  decodeFilterFromUrl,
  emptyFilterGroup,
  encodeFilterToUrl,
  filterGroupSchema,
  type FilterGroup,
} from "@/cases/filter-builder/filterAst";

const sample: FilterGroup = {
  kind: "group",
  combinator: "and",
  children: [
    {
      kind: "rule",
      level: "artist",
      attributeName: "Formed",
      operator: "gte",
      values: [1990],
    },
    {
      kind: "group",
      combinator: "or",
      children: [
        {
          kind: "rule",
          level: "track",
          attributeName: "Title",
          operator: "contains",
          values: ["rain"],
        },
        {
          kind: "rule",
          level: "album",
          attributeName: "Label",
          operator: "in",
          values: ["Alpha", "Beta"],
        },
      ],
    },
  ],
};

describe("share-string codec", () => {
  it("round-trips a filter", () => {
    expect(decodeFilterFromUrl(encodeFilterToUrl(sample))).toEqual(sample);
  });

  it("round-trips an empty group", () => {
    const empty = emptyFilterGroup("or");
    expect(decodeFilterFromUrl(encodeFilterToUrl(empty))).toEqual(empty);
  });

  it("rejects an unknown format version", () => {
    const encoded = encodeFilterToUrl(sample);
    expect(decodeFilterFromUrl(`0${encoded.slice(1)}`)).toBeNull();
  });

  it("returns null for garbage rather than throwing", () => {
    expect(decodeFilterFromUrl("1notbase64!!!")).toBeNull();
    expect(decodeFilterFromUrl("")).toBeNull();
    expect(decodeFilterFromUrl(null)).toBeNull();
    expect(decodeFilterFromUrl(undefined)).toBeNull();
  });

  it("survives non-ASCII attribute names", () => {
    const unicode: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "artist",
          attributeName: "Pays d'origine",
          operator: "eq",
          values: ["ø"],
        },
      ],
    };
    expect(decodeFilterFromUrl(encodeFilterToUrl(unicode))).toEqual(unicode);
  });

  it("round-trips boolean and null values", () => {
    const group: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "track",
          attributeName: "Explicit",
          operator: "eq",
          values: [true, false, null],
        },
      ],
    };
    expect(decodeFilterFromUrl(encodeFilterToUrl(group))).toEqual(group);
  });

  it("round-trips an is_null rule with no values", () => {
    const group: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        { kind: "rule", level: "album", attributeName: "Label", operator: "is_null", values: [] },
      ],
    };
    expect(decodeFilterFromUrl(encodeFilterToUrl(group))).toEqual(group);
  });

  it("returns null instead of throwing on a pathological deep payload", () => {
    const deep = `${"[0,[".repeat(50_000)}[0,[]]${"]]".repeat(50_000)}`;
    const encoded = `1${Buffer.from(deep).toString("base64url")}`;
    expect(() => decodeFilterFromUrl(encoded)).not.toThrow();
    expect(decodeFilterFromUrl(encoded)).toBeNull();
  });

  it("rejects a verbatim (non-compact) payload even under the current version", () => {
    const verbatim = { kind: "group", combinator: "and", children: [] };
    const encoded = `1${Buffer.from(JSON.stringify(verbatim)).toString("base64url")}`;
    expect(decodeFilterFromUrl(encoded)).toBeNull();
  });

  // Freezes the wire format: a failure here means shared strings already out
  // in the wild would break.
  it("encodes to a pinned golden string", () => {
    const golden =
      "1WzAsW1swLCJGb3JtZWQiLCJndGUiLFsxOTkwXV0sWzEsW1syLCJUaXRsZSIsImNvbnRhaW5zIixbInJhaW4iXV0sWzEsIkxhYmVsIiwiaW4iLFsiQWxwaGEiLCJCZXRhIl1dXV1dXQ";
    expect(encodeFilterToUrl(sample)).toBe(golden);
    expect(decodeFilterFromUrl(golden)).toEqual(sample);
  });
});

describe("schema depth cap", () => {
  it("rejects a group nested inside a subgroup", () => {
    const tooDeep = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "group",
          combinator: "or",
          children: [{ kind: "group", combinator: "and", children: [] }],
        },
      ],
    };
    expect(filterGroupSchema.safeParse(tooDeep).success).toBe(false);
  });
});
