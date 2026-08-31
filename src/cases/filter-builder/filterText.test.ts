import { describe, expect, it } from "vitest";
import { emptyFilterGroup, type FilterGroup } from "@/cases/filter-builder/filterAst";
import { renderFilterText } from "@/cases/filter-builder/filterText";

describe("renderFilterText", () => {
  it("renders an empty top group as an empty string", () => {
    expect(renderFilterText(emptyFilterGroup("and"))).toBe("");
  });

  it("quotes attribute names in backticks and strings in doubled single quotes", () => {
    const ast: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "album",
          attributeName: "Label",
          operator: "eq",
          values: ["Rock 'n' Roll"],
        },
      ],
    };
    expect(renderFilterText(ast)).toBe("`Label` = 'Rock ''n'' Roll'");
  });

  it("renders between, list and valueless operators", () => {
    const ast: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "artist",
          attributeName: "Formed",
          operator: "between",
          values: [1980, 1990],
        },
        {
          kind: "rule",
          level: "album",
          attributeName: "Label",
          operator: "in",
          values: ["Alpha", "Beta"],
        },
        { kind: "rule", level: "track", attributeName: "Rating", operator: "is_null", values: [] },
      ],
    };
    expect(renderFilterText(ast)).toBe(
      "`Formed` between 1980 and 1990 AND `Label` in ['Alpha', 'Beta'] AND `Rating` is empty",
    );
  });

  it("renders an explicit null value", () => {
    const ast: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        { kind: "rule", level: "artist", attributeName: "Formed", operator: "eq", values: [null] },
      ],
    };
    expect(renderFilterText(ast)).toBe("`Formed` = ∅");
  });

  it("doubles a backtick inside an attribute name", () => {
    const ast: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "artist",
          attributeName: "Weird`Name",
          operator: "eq",
          values: ["x"],
        },
      ],
    };
    expect(renderFilterText(ast)).toBe("`Weird``Name` = 'x'");
  });

  it("parenthesizes subgroups and joins with the group combinator", () => {
    const ast: FilterGroup = {
      kind: "group",
      combinator: "or",
      children: [
        { kind: "rule", level: "track", attributeName: "Explicit", operator: "eq", values: [true] },
        {
          kind: "group",
          combinator: "and",
          children: [
            {
              kind: "rule",
              level: "track",
              attributeName: "Plays",
              operator: "gt",
              values: [1000],
            },
            {
              kind: "rule",
              level: "track",
              attributeName: "Duration",
              operator: "lte",
              values: [300],
            },
          ],
        },
      ],
    };
    expect(renderFilterText(ast)).toBe(
      "`Explicit` = true OR (`Plays` > 1000 AND `Duration` ≤ 300)",
    );
  });
});
