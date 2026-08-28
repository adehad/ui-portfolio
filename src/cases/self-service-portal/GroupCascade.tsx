import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { childGroupsOf, descendantsOf } from "@/cases/self-service-portal/groups";
import { FolderIcon } from "@/cases/self-service-portal/icons/Folder";
import { getSelectClassNames, getSelectStyles } from "@/cases/self-service-portal/selectStyles";
import { GITLAB_SLUG_RE, toGitLabSlug } from "@/cases/self-service-portal/slugs";
import { SparklePen } from "@/cases/self-service-portal/SparklePen";

/** One selected, or to-be-created, group below the client. */
export type CascadeLevel = {
  /** The group id, or null while the level is a group the form would create. */
  id: number | null;
  name: string;
};

/** Handed to the parent on every cascade change. */
export type CascadeResolution = {
  levels: CascadeLevel[];
  /** Display names of every level below the client, deepest last. */
  pathNames: string[];
  /** The deepest level's id, or null when it is or sits under a created group. */
  deepestGroupId: number | null;
};

type CascadeOption = {
  label: string;
  /** An existing group carries its id; a created one carries the typed name. */
  value: string | number;
  kind: "child" | "deep";
};

const EMPTY_OPTIONS: CascadeOption[] = [];

const buildResolution = (levels: CascadeLevel[]): CascadeResolution => ({
  levels,
  pathNames: levels.map((level) => level.name),
  deepestGroupId: levels.at(-1)?.id ?? null,
});

/** Wrap the part of the label matching the current search input in bold. */
function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <b>{text.slice(index, index + q.length)}</b>
      {text.slice(index + q.length)}
    </>
  );
}

/** Depth-first order for the option labels: compare breadcrumb paths segment by
    segment, so a nested group sorts directly under its own parent rather than
    wherever a plain string sort would interleave it. */
export function compareBreadcrumbs(a: string, b: string): number {
  const aSegments = a.split(" / ");
  const bSegments = b.split(" / ");
  for (const [index, aSegment] of aSegments.entries()) {
    const bSegment = bSegments[index];
    if (bSegment === undefined) break;
    const bySegment = aSegment.localeCompare(bSegment, undefined, { sensitivity: "base" });
    if (bySegment !== 0) return bySegment;
  }
  // Equal shared prefix: the parent, being the shorter path, comes first.
  return aSegments.length - bSegments.length;
}

/** react-select marks the create row with this flag on the option. */
const NEW_OPTION_FLAG = "__isNew__";

function formatCascadeOption(option: CascadeOption, meta: { inputValue: string }): ReactNode {
  const isCreateRow = !!(option as Record<string, unknown>)[NEW_OPTION_FLAG];
  return (
    <span className="ssp-cascade-option">
      <FolderIcon size={14} />
      {/* The creatable select already renders the create row as Create "...". */}
      {isCreateRow ? option.label : highlightMatch(option.label, meta.inputValue)}
    </span>
  );
}

/** A typed name creates a group at that level, so reject anything that would die
    at GitLab and never offer an impossible group. */
const isValidNewName = (input: string): boolean => {
  const trimmed = input.trim();
  return !!trimmed && !trimmed.includes("/") && GITLAB_SLUG_RE.test(toGitLabSlug(trimmed));
};

/** One cascade box. Reads the child groups of its own parent, so each depth
    resolves independently. The first box also receives the deep search options. */
function CascadeLevelSelect({
  label,
  indent,
  parentId,
  deepOptions,
  value,
  disabled,
  isDarkMode,
  onSelect,
  onCreate,
  onClear,
}: {
  label: string;
  indent: number;
  parentId: number | null;
  deepOptions: CascadeOption[];
  value: CascadeLevel | null;
  disabled?: boolean;
  isDarkMode?: boolean | undefined;
  onSelect: (option: CascadeOption) => void;
  onCreate: (name: string) => void;
  onClear: () => void;
}) {
  const inputId = useId();

  const options = useMemo(() => {
    const children: CascadeOption[] = childGroupsOf(parentId).map((group) => ({
      label: group.name,
      value: group.id,
      kind: "child",
    }));
    // Tree order, so a nested group lists under its parent rather than wherever
    // the two source lists happened to place it.
    return [...children, ...deepOptions].toSorted((a, b) => compareBreadcrumbs(a.label, b.label));
  }, [parentId, deepOptions]);

  const classNames = useMemo(() => getSelectClassNames<CascadeOption, false>(), []);
  const styles = useMemo(() => getSelectStyles<CascadeOption, false>(isDarkMode), [isDarkMode]);
  const indentStyle = useMemo(() => ({ marginLeft: `${indent * 1.25}rem` }), [indent]);

  // A created level is not in options, so its display option is built from the
  // level state directly.
  const valueOption = useMemo<CascadeOption | null>(
    () => (value ? { label: value.name, value: value.id ?? value.name, kind: "child" } : null),
    [value],
  );

  return (
    <div className="ssp-cascade-level" style={indentStyle}>
      <div className="ssp-mb-1">
        <label htmlFor={inputId}>{label}</label>
      </div>
      <SparklePen active={!!value && value.id === null} seedKey={value?.name}>
        <CreatableSelect<CascadeOption, false>
          inputId={inputId}
          classNames={classNames}
          styles={styles}
          options={options}
          value={valueOption}
          isClearable={true}
          isDisabled={disabled}
          placeholder="Select a group, or type a new one..."
          isValidNewOption={isValidNewName}
          formatOptionLabel={formatCascadeOption}
          onChange={(option) => (option ? onSelect(option) : onClear())}
          onCreateOption={(input) => onCreate(input.trim())}
        />
      </SparklePen>
    </div>
  );
}

export type GroupCascadeProps = {
  /** The client group id, null while the client is a name the form would create. */
  clientId: number | null;
  /** Whether a client, existing or typed, has been chosen at all. */
  clientSelected: boolean;
  isDarkMode?: boolean;
  onResolve: (resolution: CascadeResolution) => void;
};

/** Cascading selector for the group chain below a client. One box per committed
    level plus a trailing empty one. Picking a folder or typing a name spawns the
    next box; picking a deep search result on the first box fills the whole
    ancestor chain at once. */
export function GroupCascade({
  clientId,
  clientSelected,
  isDarkMode,
  onResolve,
}: GroupCascadeProps) {
  const [levels, setLevels] = useState<CascadeLevel[]>([]);

  const descendants = useMemo(() => descendantsOf(clientId), [clientId]);
  // Deep options leave out the direct children, which already appear as the
  // first box's folder options.
  const deepOptions = useMemo<CascadeOption[]>(
    () =>
      descendants
        .filter((group) => group.breadcrumb.includes("/"))
        .map((group) => ({ label: group.breadcrumb, value: group.id, kind: "deep" })),
    [descendants],
  );

  const onResolveRef = useRef(onResolve);
  useEffect(() => {
    onResolveRef.current = onResolve;
  }, [onResolve]);

  const commit = (next: CascadeLevel[]) => {
    setLevels(next);
    onResolveRef.current(buildResolution(next));
  };

  // The parent remounts this on a client or destination change, so reporting an
  // empty resolution on mount is what clears the stale project and repo state.
  // eslint-disable-next-line react/exhaustive-effect-dependencies -- mount only
  useEffect(() => {
    onResolveRef.current(buildResolution([]));
  }, []);

  /** Walk parent links from a deep pick up to, but not including, the client.
      The visited set defends against a malformed cyclic chain. */
  const resolveChain = (deepId: number): CascadeLevel[] => {
    const byId = new Map(descendants.map((group) => [group.id, group]));
    const visited = new Set<number>();
    const chain: CascadeLevel[] = [];
    let current = byId.get(deepId);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.unshift({ id: current.id, name: current.name });
      if (current.parentId === null || current.parentId === clientId) break;
      current = byId.get(current.parentId);
    }
    return chain;
  };

  const handleSelect = (index: number, option: CascadeOption) => {
    if (option.kind === "deep") {
      commit(resolveChain(Number(option.value)));
      return;
    }
    // An existing child replaces this level and truncates the deeper ones, which
    // belonged to a branch the user has just left.
    commit([...levels.slice(0, index), { id: Number(option.value), name: option.label }]);
  };

  return (
    <div className="ssp-group-cascade">
      {Array.from({ length: levels.length + 1 }, (_, index) => (
        <CascadeLevelSelect
          key={index}
          label={index === 0 ? "Project Name" : `Subgroup ${index}`}
          indent={index}
          parentId={index === 0 ? clientId : levels[index - 1]!.id}
          deepOptions={index === 0 ? deepOptions : EMPTY_OPTIONS}
          value={levels[index] ?? null}
          disabled={index === 0 && !clientSelected}
          isDarkMode={isDarkMode}
          onSelect={(option) => handleSelect(index, option)}
          onCreate={(name) => commit([...levels.slice(0, index), { id: null, name }])}
          onClear={() => commit(levels.slice(0, index))}
        />
      ))}
    </div>
  );
}
