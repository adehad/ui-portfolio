import { describe, expect, it } from "vitest";
import { AttributeCatalog } from "@/cases/filter-builder/catalog";
import {
  astToBuilder,
  builderToAst,
  emptyBuilderGroup,
  freshId,
  withNewSubgroup,
  type BuilderGroup,
  type BuilderRule,
} from "@/cases/filter-builder/builderState";
import type { FilterGroup } from "@/cases/filter-builder/filterAst";

const catalog = new AttributeCatalog([
  { level: "artist", name: "Name", type: "text" },
  { level: "artist", name: "Formed", type: "int" },
  { level: "track", name: "Rating", type: "float" },
  { level: "track", name: "Explicit", type: "bool" },
  { level: "album", name: "Released", type: "date" },
]);

function rule(partial: Partial<BuilderRule>): BuilderRule {
  return {
    id: freshId(),
    kind: "rule",
    level: "artist",
    attributeName: "Name",
    operator: "eq",
    values: [],
    ...partial,
  };
}

function astOf(builderRule: BuilderRule): FilterGroup {
  const group = emptyBuilderGroup("and");
  group.children.push(builderRule);
  return builderToAst(group, catalog);
}

function firstValues(ast: FilterGroup): unknown[] {
  const child = ast.children[0];
  if (child?.kind !== "rule") throw new Error("expected a rule");
  return child.values;
}

describe("value coercion", () => {
  it("coerces int and float strings by declared type", () => {
    expect(firstValues(astOf(rule({ attributeName: "Formed", values: ["1991"] })))).toEqual([1991]);
    expect(
      firstValues(astOf(rule({ level: "track", attributeName: "Rating", values: ["4.5"] }))),
    ).toEqual([4.5]);
  });

  it("passes a non-numeric string through untouched for a numeric attribute", () => {
    expect(firstValues(astOf(rule({ attributeName: "Formed", values: ["abc"] })))).toEqual(["abc"]);
  });

  it("rejects a partial numeric match rather than truncating it", () => {
    expect(firstValues(astOf(rule({ attributeName: "Formed", values: ["12abc"] })))).toEqual([
      "12abc",
    ]);
    expect(
      firstValues(astOf(rule({ level: "track", attributeName: "Rating", values: ["4.5.6"] }))),
    ).toEqual(["4.5.6"]);
    expect(
      firstValues(astOf(rule({ level: "track", attributeName: "Rating", values: ["1e999"] }))),
    ).toEqual(["1e999"]);
  });

  it("coerces bool from the literal string true, case-insensitively", () => {
    expect(
      firstValues(astOf(rule({ level: "track", attributeName: "Explicit", values: ["True"] }))),
    ).toEqual([true]);
    expect(
      firstValues(astOf(rule({ level: "track", attributeName: "Explicit", values: ["no"] }))),
    ).toEqual([false]);
  });

  it("keeps dates as ISO strings and empty input as null", () => {
    expect(
      firstValues(
        astOf(rule({ level: "album", attributeName: "Released", values: ["2001-05-04"] })),
      ),
    ).toEqual(["2001-05-04"]);
    expect(firstValues(astOf(rule({ values: [""] })))).toEqual([null]);
  });

  it("splits list operators on commas and drops empty entries", () => {
    expect(
      firstValues(
        astOf(rule({ attributeName: "Formed", operator: "in", values: ["1990, 2000,,"] })),
      ),
    ).toEqual([1990, 2000]);
  });

  it("takes exactly two values for between and none for is_null", () => {
    expect(
      firstValues(
        astOf(rule({ attributeName: "Formed", operator: "between", values: ["1980", "1990"] })),
      ),
    ).toEqual([1980, 1990]);
    expect(firstValues(astOf(rule({ operator: "is_null", values: ["stale"] })))).toEqual([]);
  });
});

describe("astToBuilder", () => {
  it("round-trips builder -> ast -> builder, modulo ids", () => {
    const group = emptyBuilderGroup("or");
    group.children.push(
      rule({ attributeName: "Formed", operator: "between", values: ["1980", "1990"] }),
      rule({ attributeName: "Formed", operator: "in", values: ["1990,2000"] }),
    );
    const rebuilt = builderToAst(astToBuilder(builderToAst(group, catalog)), catalog);
    expect(rebuilt).toEqual(builderToAst(group, catalog));
  });

  it("round-trips a top-level group holding a rule and a subgroup, modulo ids", () => {
    const group = emptyBuilderGroup("or");
    const subgroup: BuilderGroup = emptyBuilderGroup("and");
    subgroup.children.push(
      rule({ attributeName: "Formed", values: ["1990"] }),
      rule({ level: "track", attributeName: "Rating", operator: "gt", values: ["3"] }),
    );
    group.children.push(rule({ attributeName: "Name", values: ["x"] }), subgroup);
    const rebuilt = builderToAst(astToBuilder(builderToAst(group, catalog)), catalog);
    expect(rebuilt).toEqual(builderToAst(group, catalog));
  });

  it("throws when a subgroup contains a nested group", () => {
    const group = emptyBuilderGroup("and");
    const subgroup: BuilderGroup = emptyBuilderGroup("or");
    subgroup.children.push(emptyBuilderGroup("and"));
    group.children.push(subgroup);
    expect(() => builderToAst(group, catalog)).toThrow("a subgroup cannot contain another group");
  });

  // The comma is the only separator list operators use, so a value that
  // itself contains one cannot be told apart from a delimiter once it is
  // re-joined: this is the documented limitation of comma-separated input.
  it("cannot preserve a comma inside a list value across a round trip", () => {
    const ast: FilterGroup = {
      kind: "group",
      combinator: "and",
      children: [
        {
          kind: "rule",
          level: "artist",
          attributeName: "Name",
          operator: "in",
          values: ["a,b", "c"],
        },
      ],
    };
    const rebuilt = builderToAst(astToBuilder(ast), catalog);
    expect(firstValues(rebuilt)).toEqual(["a", "b", "c"]);
  });
});

describe("withNewSubgroup", () => {
  it("wraps loose rules into their own group and joins with AND", () => {
    const group = emptyBuilderGroup("or");
    const first = rule({ attributeName: "Name", values: ["x"] });
    const second = rule({ attributeName: "Formed", values: ["1990"] });
    group.children.push(first, second);

    const next = withNewSubgroup(group);

    expect(next.combinator).toBe("and");
    expect(next.children).toHaveLength(2);
    const [wrapped, fresh] = next.children;
    if (wrapped?.kind !== "group" || fresh?.kind !== "group")
      throw new Error("expected two groups");
    expect(wrapped.combinator).toBe("or");
    expect(wrapped.children).toEqual([first, second]);
    expect(fresh.children).toEqual([]);
  });

  it("appends without wrapping when a group already exists", () => {
    const group = emptyBuilderGroup("and");
    const existing = emptyBuilderGroup("or");
    const loose = rule({ attributeName: "Name", values: ["x"] });
    group.children.push(loose, existing);

    const next = withNewSubgroup(group);

    expect(next.combinator).toBe("and");
    expect(next.children).toHaveLength(3);
    expect(next.children[0]).toEqual(loose);
    expect(next.children[1]).toEqual(existing);
    expect(next.children[2]?.kind).toBe("group");
  });

  it("appends an empty group to an empty builder without changing the combinator", () => {
    const next = withNewSubgroup(emptyBuilderGroup("or"));
    expect(next.combinator).toBe("or");
    expect(next.children).toHaveLength(1);
    expect(next.children[0]?.kind).toBe("group");
  });
});
