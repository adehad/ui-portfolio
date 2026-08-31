// Nested AND/OR filter builder. Renders one group: a combinator toggle, its
// conditions, and (only at the top level) its subgroups. Nesting is capped at
// two levels, matching the AST: the top group may hold subgroups, a subgroup
// may hold only rules.

import { useId } from "react";
import { freshId, withNewSubgroup, type BuilderGroup, type BuilderRule } from "./builderState";
import type { AttributeCatalog } from "./catalog";
import { PlusIcon, TrashIcon } from "./icons";
import { RuleRow } from "./RuleRow";

type FilterBuilderProps = {
  group: BuilderGroup;
  catalog: AttributeCatalog;
  onChange: (group: BuilderGroup) => void;
  depth?: number;
};

export function FilterBuilder({ group, catalog, onChange, depth = 0 }: FilterBuilderProps) {
  const uid = useId();
  const isTop = depth === 0;

  function addRule() {
    const first = catalog.all()[0];
    const rule: BuilderRule = {
      id: freshId(),
      kind: "rule",
      level: first?.level ?? "artist",
      attributeName: first?.name ?? "",
      operator: first ? (catalog.operatorsFor(first.level, first.name)[0] ?? "eq") : "eq",
      values: [],
    };
    onChange({ ...group, children: [...group.children, rule] });
  }

  function addSubgroup() {
    onChange(withNewSubgroup(group));
  }

  function removeChild(id: string) {
    onChange({ ...group, children: group.children.filter((child) => child.id !== id) });
  }

  function replaceChild(next: BuilderGroup | BuilderRule) {
    onChange({
      ...group,
      children: group.children.map((child) => (child.id === next.id ? next : child)),
    });
  }

  return (
    <div
      className={`rounded-qb-md border border-qb-line p-3 ${isTop ? "bg-qb-surface" : "bg-qb-surface-2"}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Combinator"
          className="flex overflow-hidden rounded-qb-sm border border-qb-line"
        >
          {(["and", "or"] as const).map((combinator) => (
            <label
              key={combinator}
              className={`cursor-pointer px-3 py-1 text-qb-caption font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-qb-accent ${
                group.combinator === combinator
                  ? "bg-qb-accent text-white"
                  : "bg-qb-surface text-qb-fg-muted"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={`${uid}-combinator`}
                checked={group.combinator === combinator}
                onChange={() => onChange({ ...group, combinator })}
              />
              {combinator.toUpperCase()}
            </label>
          ))}
        </div>
        <span className="text-qb-caption text-qb-fg-muted">
          {isTop
            ? "Match all/any of the conditions and groups below"
            : "Match all/any of these conditions"}
        </span>
      </div>

      {group.children.map((child) =>
        child.kind === "rule" ? (
          <RuleRow
            key={child.id}
            rule={child}
            catalog={catalog}
            onChange={replaceChild}
            onRemove={() => removeChild(child.id)}
          />
        ) : (
          <div key={child.id} className="relative mb-2 border-l-[3px] border-qb-accent pl-3">
            <button
              type="button"
              className="absolute top-2 right-2 z-[1] qb-btn px-2 text-qb-danger"
              aria-label="Remove group"
              onClick={() => removeChild(child.id)}
            >
              <TrashIcon />
            </button>
            <FilterBuilder
              group={child}
              catalog={catalog}
              onChange={replaceChild}
              depth={depth + 1}
            />
          </div>
        ),
      )}

      <div className="mt-1 flex gap-2">
        <button type="button" className="qb-btn" onClick={addRule}>
          <PlusIcon />
          Condition
        </button>
        {isTop && (
          <button type="button" className="qb-btn" onClick={addSubgroup}>
            <PlusIcon />
            Group
          </button>
        )}
      </div>
    </div>
  );
}
