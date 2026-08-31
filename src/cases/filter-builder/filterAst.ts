// The typed filter AST the builder produces. A Zod schema enforces the 2-level
// nesting cap, and the codec below (de)serializes an AST into a compact string
// so a filter can be shared as a link.

import { z } from "zod";

// A shared string outlives the deploy that produced it, so both tables below
// are a wire contract: append to them, never reorder, or previously shared
// filters decode to the wrong combinator or level. The exported
// `combinators`/`attributeLevels` are these same arrays, so appending is the
// only safe change to either.
const COMBINATOR_BY_CODE = ["and", "or"] as const;
const LEVEL_BY_CODE = ["artist", "album", "track"] as const;

export const combinators = COMBINATOR_BY_CODE;
export type Combinator = (typeof combinators)[number];

export const attributeLevels = LEVEL_BY_CODE;
export type AttributeLevel = (typeof attributeLevels)[number];

export const filterOperators = [
  "eq",
  "neq",
  "lt",
  "lte",
  "gt",
  "gte",
  "between",
  "in",
  "not_in",
  "contains",
  "starts_with",
  "is_null",
  "is_not_null",
] as const;
export type FilterOperator = (typeof filterOperators)[number];

// Dates travel as ISO yyyy-mm-dd strings.
export type FilterValue = string | number | boolean | null;

export type FilterRule = {
  kind: "rule";
  level: AttributeLevel;
  attributeName: string;
  operator: FilterOperator;
  values: FilterValue[];
};

export type FilterSubGroup = {
  kind: "group";
  combinator: Combinator;
  children: FilterRule[];
};

export type FilterGroup = {
  kind: "group";
  combinator: Combinator;
  children: (FilterSubGroup | FilterRule)[];
};

const filterValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const filterRuleSchema = z.object({
  kind: z.literal("rule"),
  level: z.enum(attributeLevels),
  attributeName: z.string(),
  operator: z.enum(filterOperators),
  values: z.array(filterValueSchema),
});

// A subgroup may only contain rules, which is what enforces the 2-level cap
// structurally: the top group may hold subgroups, a subgroup may not.
const subGroupSchema = z.object({
  kind: z.literal("group"),
  combinator: z.enum(combinators),
  children: z.array(filterRuleSchema),
});

const topChildSchema = z.discriminatedUnion("kind", [filterRuleSchema, subGroupSchema]);

export const filterGroupSchema: z.ZodType<FilterGroup> = z.object({
  kind: z.literal("group"),
  combinator: z.enum(combinators),
  children: z.array(topChildSchema),
});

// --- Share-string serialization ---------------------------------------------

function base64UrlEncode(input: string): string {
  // btoa works on Latin-1; encode UTF-8 first so attribute names with
  // non-ASCII characters survive the round trip.
  const utf8 = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of utf8) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // encode strips the "=" padding, so this relies on atob's forgiving decode of unpadded input.
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Leading character of the string, identifying the payload format. A future
// format change bumps this and switches on it rather than guessing at the shape.
const FORMAT_VERSION = "1";

// The AST is stored positionally rather than as its full JSON: a group is
// [combinator, children] and a rule is [level, name, operator, values].
// Dropping the repeated keys keeps the encoded string roughly a third the size
// of the raw JSON, base64 included, which keeps a shared link inside the
// ~2000-character ceiling mail and chat clients impose. Operators stay
// spelled out, so a suspect string is still legible once base64-decoded.
type CompactRule = [number, string, FilterOperator, FilterValue[]];
type CompactGroup = [number, (CompactGroup | CompactRule)[]];

function toCompactRule(rule: FilterRule): CompactRule {
  return [LEVEL_BY_CODE.indexOf(rule.level), rule.attributeName, rule.operator, rule.values];
}

function toCompactGroup(group: FilterGroup | FilterSubGroup): CompactGroup {
  return [
    COMBINATOR_BY_CODE.indexOf(group.combinator),
    group.children.map((child) =>
      child.kind === "group" ? toCompactGroup(child) : toCompactRule(child),
    ),
  ];
}

// The expansion below runs on untrusted input, so it stays total: anything
// unexpected is turned into undefined and rejected by the Zod schema
// afterwards, which is the single place the shape is actually enforced.
function expandNode(node: unknown): unknown {
  if (!Array.isArray(node)) {
    return undefined;
  }
  // A group's second slot holds its children; a rule's holds its attribute
  // name. Nothing else distinguishes them.
  return Array.isArray(node[1]) ? expandGroup(node) : expandRule(node);
}

function expandGroup(node: unknown[]): unknown {
  const code = node[0];
  return {
    kind: "group",
    combinator: typeof code === "number" ? COMBINATOR_BY_CODE[code] : undefined,
    children: (node[1] as unknown[]).map(expandNode),
  };
}

function expandRule(node: unknown[]): unknown {
  const code = node[0];
  return {
    kind: "rule",
    level: typeof code === "number" ? LEVEL_BY_CODE[code] : undefined,
    attributeName: node[1],
    operator: node[2],
    values: node[3],
  };
}

export function encodeFilterToUrl(ast: FilterGroup): string {
  return FORMAT_VERSION + base64UrlEncode(JSON.stringify(toCompactGroup(ast)));
}

// Parses an untrusted share string back into a validated AST. Returns null
// (never throws) for malformed input, so a corrupt or tampered string degrades
// gracefully instead of crashing the page.
export function decodeFilterFromUrl(param: string | null | undefined): FilterGroup | null {
  if (param == null || !param.startsWith(FORMAT_VERSION)) {
    return null;
  }

  let candidate: unknown;
  try {
    candidate = expandNode(JSON.parse(base64UrlDecode(param.slice(FORMAT_VERSION.length))));
  } catch {
    return null;
  }

  const result = filterGroupSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

export function emptyFilterGroup(combinator: Combinator = "and"): FilterGroup {
  return { kind: "group", combinator, children: [] };
}
