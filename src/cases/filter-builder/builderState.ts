// Bridges the builder UI's editable state and the typed AST: values are
// coerced from the strings the inputs produce, UI-only ids are dropped, and
// the result is validated against the shared schema.

import {
  filterGroupSchema,
  type AttributeLevel,
  type Combinator,
  type FilterGroup,
  type FilterOperator,
  type FilterRule as AstRule,
  type FilterSubGroup,
  type FilterValue,
} from "./filterAst";
import {
  operatorTakesNoValue,
  operatorTakesTwoValues,
  operatorTakesValueList,
  type AttributeCatalog,
  type AttributeType,
} from "./catalog";

// A single editable condition. Values are kept as raw strings while editing
// and coerced on Apply: `between` uses [low, high], list operators use one
// comma-separated string, others use values[0].
export type BuilderRule = {
  id: string;
  kind: "rule";
  level: AttributeLevel;
  attributeName: string;
  operator: FilterOperator;
  values: string[];
};

export type BuilderGroup = {
  id: string;
  kind: "group";
  combinator: Combinator;
  children: (BuilderGroup | BuilderRule)[];
};

let nextId = 0;
export function freshId(): string {
  nextId += 1;
  return `n${nextId}`;
}

export function emptyBuilderGroup(combinator: Combinator = "and"): BuilderGroup {
  return { id: freshId(), kind: "group", combinator, children: [] };
}

// Adding a group turns a flat rule list into "(everything so far) AND (new)":
// the existing rules move into their own subgroup keeping the combinator they
// were joined with, and the top combinator becomes the joiner between groups.
// Once a group already exists (or there is nothing to wrap) the new group
// simply appends, because a subgroup cannot hold another group.
export function withNewSubgroup(group: BuilderGroup): BuilderGroup {
  const hasGroup = group.children.some((child) => child.kind === "group");
  if (group.children.length === 0 || hasGroup) {
    return {
      ...group,
      children: [...group.children, emptyBuilderGroup(group.combinator === "and" ? "or" : "and")],
    };
  }
  const wrapped: BuilderGroup = {
    id: freshId(),
    kind: "group",
    combinator: group.combinator,
    children: group.children,
  };
  return { ...group, combinator: "and", children: [wrapped, emptyBuilderGroup("or")] };
}

function coerceValue(raw: string, type: AttributeType | null): FilterValue {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  // Number() rejects a trailing tail that parseInt/parseFloat would silently
  // drop, so a typo like "1990s" stays a string instead of becoming 1990.
  if (type === "int") {
    const n = Number(trimmed);
    return Number.isInteger(n) ? n : trimmed;
  }
  if (type === "float") {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : trimmed;
  }
  if (type === "bool") {
    // Two-state mapping is deliberate: anything but "true" is false, there
    // is no inert passthrough for bool.
    return trimmed.toLowerCase() === "true";
  }
  // text and date both travel as strings (dates are ISO yyyy-mm-dd from the
  // date input).
  return trimmed;
}

function ruleToAst(rule: BuilderRule, catalog: AttributeCatalog): AstRule {
  const type = catalog.typeFor(rule.level, rule.attributeName);

  let values: FilterValue[];
  if (operatorTakesNoValue(rule.operator)) {
    values = [];
  } else if (operatorTakesTwoValues(rule.operator)) {
    values = [coerceValue(rule.values[0] ?? "", type), coerceValue(rule.values[1] ?? "", type)];
  } else if (operatorTakesValueList(rule.operator)) {
    values = (rule.values[0] ?? "")
      .split(",")
      .map((part) => coerceValue(part, type))
      .filter((value) => value !== null);
  } else {
    values = [coerceValue(rule.values[0] ?? "", type)];
  }

  return {
    kind: "rule",
    level: rule.level,
    attributeName: rule.attributeName,
    operator: rule.operator,
    values,
  };
}

// A subgroup's AST type only holds rules. The UI cannot create a nested
// group inside a subgroup, so reaching one here is a programmer error.
function subgroupToAst(group: BuilderGroup, catalog: AttributeCatalog): FilterSubGroup {
  return {
    kind: "group",
    combinator: group.combinator,
    children: group.children.map((child) => {
      if (child.kind === "group") {
        throw new Error("a subgroup cannot contain another group");
      }
      return ruleToAst(child, catalog);
    }),
  };
}

// Convert the builder's working state into a plain AST, stripping the
// UI-only ids.
export function builderToAst(group: BuilderGroup, catalog: AttributeCatalog): FilterGroup {
  return {
    kind: "group",
    combinator: group.combinator,
    children: group.children.map((child) =>
      child.kind === "group" ? subgroupToAst(child, catalog) : ruleToAst(child, catalog),
    ),
  };
}

// Validate a builder-produced AST against the shared schema. The builder's
// widgets cannot produce an invalid shape, so a throw here is a programmer
// error, not a user error.
export function validateAst(ast: FilterGroup): FilterGroup {
  return filterGroupSchema.parse(ast);
}

// Rebuild editable state from a decoded AST (a pasted share string). Values
// become strings again; `between` keeps both, list operators re-join on commas.
function astRuleToBuilder(rule: AstRule): BuilderRule {
  let values: string[];
  if (rule.operator === "between") {
    values = [String(rule.values[0] ?? ""), String(rule.values[1] ?? "")];
  } else if (rule.operator === "in" || rule.operator === "not_in") {
    values = [rule.values.map((value) => String(value ?? "")).join(",")];
  } else if (rule.values.length > 0) {
    values = [String(rule.values[0] ?? "")];
  } else {
    values = [];
  }
  return {
    id: freshId(),
    kind: "rule",
    level: rule.level,
    attributeName: rule.attributeName,
    operator: rule.operator,
    values,
  };
}

function astSubgroupToBuilder(group: FilterSubGroup): BuilderGroup {
  return {
    id: freshId(),
    kind: "group",
    combinator: group.combinator,
    children: group.children.map(astRuleToBuilder),
  };
}

export function astToBuilder(ast: FilterGroup): BuilderGroup {
  return {
    id: freshId(),
    kind: "group",
    combinator: ast.combinator,
    children: ast.children.map((child) =>
      child.kind === "group" ? astSubgroupToBuilder(child) : astRuleToBuilder(child),
    ),
  };
}
