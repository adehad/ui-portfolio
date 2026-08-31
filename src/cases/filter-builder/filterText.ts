// Renders a filter AST as a compact, read-only sentence, e.g.
//   `Genre` = 'Jazz' AND (`Plays` > 1000 OR `Rating` ≥ 4)
// The mirror lets a user sanity-check the filter the builder produced without
// reading JSON.

import {
  operatorLabels,
  operatorTakesNoValue,
  operatorTakesTwoValues,
  operatorTakesValueList,
} from "./catalog";
import type { FilterGroup, FilterRule, FilterSubGroup, FilterValue } from "./filterAst";

function renderValue(value: FilterValue): string {
  if (value === null) {
    return "∅";
  }
  if (typeof value === "string") {
    return `'${value.replaceAll("'", "''")}'`;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

// Backticks delimit attribute names so a name containing spaces still reads as
// one token; doubled to escape, because a plausible attribute name can hold a
// quote or a parenthesis but not a backtick.
function renderAttribute(name: string): string {
  return `\`${name.replaceAll("`", "``")}\``;
}

function renderRule(rule: FilterRule): string {
  const label = operatorLabels[rule.operator];
  const attribute = renderAttribute(rule.attributeName);

  if (operatorTakesNoValue(rule.operator)) {
    return `${attribute} ${label}`;
  }
  if (operatorTakesTwoValues(rule.operator)) {
    const [low, high] = rule.values;
    return `${attribute} ${label} ${renderValue(low ?? null)} and ${renderValue(high ?? null)}`;
  }
  if (operatorTakesValueList(rule.operator)) {
    return `${attribute} ${label} [${rule.values.map(renderValue).join(", ")}]`;
  }
  return `${attribute} ${label} ${renderValue(rule.values[0] ?? null)}`;
}

function renderGroup(group: FilterGroup | FilterSubGroup, isTop: boolean): string {
  if (group.children.length === 0) {
    return isTop ? "" : "()";
  }

  const separator = group.combinator === "and" ? " AND " : " OR ";
  const parts = group.children.map((child) =>
    child.kind === "group" ? renderGroup(child, false) : renderRule(child),
  );
  const joined = parts.join(separator);

  // Parentheses make nested precedence unambiguous; the top group needs none.
  return isTop ? joined : `(${joined})`;
}

export function renderFilterText(ast: FilterGroup): string {
  return renderGroup(ast, true);
}
