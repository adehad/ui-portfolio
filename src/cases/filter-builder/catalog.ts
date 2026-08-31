// The attributes a filter may reference, the operators each attribute type
// permits, and lookup helpers the builder UI reads.

import type { AttributeLevel, FilterOperator } from "./filterAst";

export const attributeTypes = ["text", "int", "float", "date", "bool"] as const;
export type AttributeType = (typeof attributeTypes)[number];

export type FilterableAttribute = {
  level: AttributeLevel;
  name: string;
  type: AttributeType;
};

// Labels for the operator <select> and the read-only text mirror.
export const operatorLabels: Record<FilterOperator, string> = {
  eq: "=",
  neq: "≠",
  lt: "<",
  lte: "≤",
  gt: ">",
  gte: "≥",
  between: "between",
  in: "in",
  not_in: "not in",
  contains: "contains",
  starts_with: "starts with",
  is_null: "is empty",
  is_not_null: "is not empty",
};

// Operators that match regardless of case. The comparison operators are exact,
// so the difference has to be visible where the operator is chosen.
export const CASE_INSENSITIVE_OPERATORS: ReadonlySet<FilterOperator> = new Set([
  "contains",
  "starts_with",
]);

const VALUELESS_OPERATORS: ReadonlySet<FilterOperator> = new Set(["is_null", "is_not_null"]);

export function operatorTakesNoValue(operator: FilterOperator): boolean {
  return VALUELESS_OPERATORS.has(operator);
}

export function operatorTakesTwoValues(operator: FilterOperator): boolean {
  return operator === "between";
}

export function operatorTakesValueList(operator: FilterOperator): boolean {
  return operator === "in" || operator === "not_in";
}

const NUMERIC_OPERATORS: readonly FilterOperator[] = [
  "eq",
  "neq",
  "lt",
  "lte",
  "gt",
  "gte",
  "between",
  "in",
  "not_in",
  "is_null",
  "is_not_null",
];

export const operatorsByType: Record<AttributeType, readonly FilterOperator[]> = {
  text: ["eq", "neq", "contains", "starts_with", "in", "not_in", "is_null", "is_not_null"],
  int: NUMERIC_OPERATORS,
  float: NUMERIC_OPERATORS,
  // Substring matching on a date reads as nonsense, so dates drop it.
  date: ["eq", "neq", "lt", "lte", "gt", "gte", "between", "is_null", "is_not_null"],
  bool: ["eq", "is_null", "is_not_null"],
};

// The HTML input type for an attribute's value entry. Free text is always
// accepted; a typed input assists number and date entry.
export function inputTypeFor(type: AttributeType): "text" | "number" | "date" {
  if (type === "int" || type === "float") {
    return "number";
  }
  if (type === "date") {
    return "date";
  }
  return "text";
}

export class AttributeCatalog {
  private readonly byLevel: Record<AttributeLevel, FilterableAttribute[]>;
  private readonly lookup: Map<string, FilterableAttribute>;

  constructor(attributes: readonly FilterableAttribute[]) {
    this.byLevel = { artist: [], album: [], track: [] };
    this.lookup = new Map();
    for (const attribute of attributes) {
      this.byLevel[attribute.level].push(attribute);
      this.lookup.set(`${attribute.level}:${attribute.name}`, attribute);
    }
  }

  forLevel(level: AttributeLevel): readonly FilterableAttribute[] {
    return this.byLevel[level];
  }

  // Every attribute across all levels, ordered artist -> album -> track.
  all(): FilterableAttribute[] {
    return [...this.byLevel.artist, ...this.byLevel.album, ...this.byLevel.track];
  }

  find(level: AttributeLevel, name: string): FilterableAttribute | undefined {
    return this.lookup.get(`${level}:${name}`);
  }

  operatorsFor(level: AttributeLevel, name: string): readonly FilterOperator[] {
    const found = this.find(level, name);
    return found ? operatorsByType[found.type] : [];
  }

  typeFor(level: AttributeLevel, name: string): AttributeType | null {
    return this.find(level, name)?.type ?? null;
  }
}
