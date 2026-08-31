import {
  CASE_INSENSITIVE_OPERATORS,
  inputTypeFor,
  operatorLabels,
  operatorTakesNoValue,
  operatorTakesTwoValues,
  operatorTakesValueList,
  type AttributeCatalog,
} from "./catalog";
import type { BuilderRule } from "./builderState";
import type { AttributeLevel, FilterOperator } from "./filterAst";
import { TrashIcon } from "./icons";

type RuleRowProps = {
  rule: BuilderRule;
  catalog: AttributeCatalog;
  onChange: (rule: BuilderRule) => void;
  onRemove: () => void;
};

const LEVEL_GROUPS: { level: AttributeLevel; label: string }[] = [
  { level: "album", label: "Album" },
  { level: "track", label: "Track" },
];

export function RuleRow({ rule, catalog, onChange, onRemove }: RuleRowProps) {
  const type = catalog.typeFor(rule.level, rule.attributeName);
  const operators = catalog.operatorsFor(rule.level, rule.attributeName);
  const inputType = inputTypeFor(type ?? "text");

  function onAttributeChange(key: string) {
    // `level` is a closed enum ("artist" | "album" | "track") that can never
    // contain ":", so everything after the first colon is the attribute name.
    const separator = key.indexOf(":");
    const level = key.slice(0, separator) as AttributeLevel;
    const attributeName = key.slice(separator + 1);
    onChange({
      ...rule,
      level,
      attributeName,
      operator: catalog.operatorsFor(level, attributeName)[0] ?? "eq",
      values: [],
    });
  }

  function setValue(index: number, value: string) {
    const values = [...rule.values];
    values[index] = value;
    onChange({ ...rule, values });
  }

  return (
    <div className="mb-2 flex items-center gap-2">
      <select
        className="qb-field w-56"
        aria-label="Attribute"
        value={`${rule.level}:${rule.attributeName}`}
        onChange={(event) => onAttributeChange(event.currentTarget.value)}
      >
        {catalog.forLevel("artist").map((attribute) => (
          <option key={attribute.name} value={`artist:${attribute.name}`}>
            {attribute.name}
          </option>
        ))}
        {LEVEL_GROUPS.map(({ level, label }) => (
          <optgroup key={level} label={label}>
            {catalog.forLevel(level).map((attribute) => (
              <option key={attribute.name} value={`${level}:${attribute.name}`}>
                {attribute.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        className="qb-field w-40"
        aria-label="Operator"
        value={rule.operator}
        onChange={(event) =>
          onChange({ ...rule, operator: event.currentTarget.value as FilterOperator })
        }
      >
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {operatorLabels[operator]}
            {CASE_INSENSITIVE_OPERATORS.has(operator) ? " (any case)" : ""}
          </option>
        ))}
      </select>

      <div className="flex w-64 items-center gap-1">
        {operatorTakesNoValue(rule.operator) ? (
          <span className="text-qb-caption text-qb-fg-muted">(no value)</span>
        ) : operatorTakesTwoValues(rule.operator) ? (
          <>
            <input
              className="qb-field w-full"
              type={inputType}
              placeholder="from"
              value={rule.values[0] ?? ""}
              onChange={(event) => setValue(0, event.currentTarget.value)}
            />
            <input
              className="qb-field w-full"
              type={inputType}
              placeholder="to"
              value={rule.values[1] ?? ""}
              onChange={(event) => setValue(1, event.currentTarget.value)}
            />
          </>
        ) : operatorTakesValueList(rule.operator) ? (
          <input
            className="qb-field w-full"
            type="text"
            placeholder="comma,separated,values"
            value={rule.values[0] ?? ""}
            onChange={(event) => setValue(0, event.currentTarget.value)}
          />
        ) : (
          <input
            className="qb-field w-full"
            type={inputType}
            placeholder="value"
            value={rule.values[0] ?? ""}
            onChange={(event) => setValue(0, event.currentTarget.value)}
          />
        )}
      </div>

      <button
        type="button"
        className="qb-btn px-2 text-qb-danger"
        aria-label="Remove condition"
        onClick={onRemove}
      >
        <TrashIcon />
      </button>
    </div>
  );
}
