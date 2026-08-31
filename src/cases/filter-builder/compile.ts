// Compiles a filter AST into a predicate over the artist hierarchy.
//
// The AST is untrusted input, so every rule resolves its attribute through the
// accessor whitelist below; an unknown attribute throws before anything is
// evaluated. Matching mirrors a SQL JOIN plus DISTINCT: an artist is flattened
// into rows (joined only to the levels the filter references), and it matches
// when any single row satisfies the whole predicate. One consequence carries
// over deliberately: "an album with A and an album with B" cannot match,
// because no single row holds both albums.

import type { Album, Artist, Track } from "./data";
import type {
  AttributeLevel,
  FilterGroup,
  FilterRule,
  FilterSubGroup,
  FilterValue,
} from "./filterAst";

export class UnknownAttributeError extends Error {}
export class UnsupportedOperatorError extends Error {}

type Row = { artist: Artist; album: Album | null; track: Track | null };

type Accessor = (row: Row) => FilterValue;

const ACCESSORS: Record<AttributeLevel, ReadonlyMap<string, Accessor>> = {
  artist: new Map<string, Accessor>([
    ["Name", (row) => row.artist.name],
    ["Country", (row) => row.artist.country],
    ["Genre", (row) => row.artist.genre],
    ["Formed", (row) => row.artist.formed],
  ]),
  album: new Map<string, Accessor>([
    ["Title", (row) => row.album?.title ?? null],
    ["Label", (row) => row.album?.label ?? null],
    ["Released", (row) => row.album?.released ?? null],
  ]),
  track: new Map<string, Accessor>([
    ["Title", (row) => row.track?.title ?? null],
    ["Duration", (row) => row.track?.duration ?? null],
    ["Plays", (row) => row.track?.plays ?? null],
    ["Rating", (row) => row.track?.rating ?? null],
    ["Explicit", (row) => row.track?.explicit ?? null],
  ]),
};

function resolveAccessor(level: AttributeLevel, name: string): Accessor {
  const accessor = ACCESSORS[level].get(name);
  if (accessor === undefined) {
    // Never echo the name into anything executable; only ever raise.
    throw new UnknownAttributeError(`'${name}' is not a filterable ${level} attribute`);
  }
  return accessor;
}

function usesLevel(group: FilterGroup | FilterSubGroup, level: AttributeLevel): boolean {
  for (const child of group.children) {
    if (child.kind === "group") {
      if (usesLevel(child, level)) {
        return true;
      }
    } else if (child.level === level) {
      return true;
    }
  }
  return false;
}

// Orders two cells of the same runtime type; mismatched types never order,
// which is how a stray string in a numeric rule matches nothing instead of
// comparing by accident. ISO yyyy-mm-dd dates order correctly as strings.
function compareValues(cell: string | number | boolean, operand: FilterValue): number | null {
  if (typeof cell === "number" && typeof operand === "number") {
    return cell - operand;
  }
  if (typeof cell === "string" && typeof operand === "string") {
    return cell < operand ? -1 : cell > operand ? 1 : 0;
  }
  return null;
}

// null = UNKNOWN: the operand cannot be compared to this cell, so neither
// the positive nor the negative form matches.
function equals(cell: string | number | boolean, operand: FilterValue): boolean | null {
  return operand === null || typeof cell !== typeof operand ? null : cell === operand;
}

// Which operators apply to which attribute type is a UI-level constraint
// enforced by the catalog's operator table; the compiler below does not
// re-check that pairing. The default branch's UnsupportedOperatorError is
// only the defensive backstop for an operator outside the known set.
function evalRule(rule: FilterRule, cell: FilterValue): boolean {
  if (rule.operator === "is_null") {
    return cell === null;
  }
  if (rule.operator === "is_not_null") {
    return cell !== null;
  }
  // SQL semantics: a comparison against NULL never matches, on either side.
  if (cell === null) {
    return false;
  }
  const first = rule.values[0] ?? null;

  switch (rule.operator) {
    case "eq":
      return equals(cell, first) === true;
    case "neq":
      return equals(cell, first) === false;
    case "lt":
    case "lte":
    case "gt":
    case "gte": {
      const ordering = compareValues(cell, first);
      if (ordering === null) {
        return false;
      }
      if (rule.operator === "lt") return ordering < 0;
      if (rule.operator === "lte") return ordering <= 0;
      if (rule.operator === "gt") return ordering > 0;
      return ordering >= 0;
    }
    case "between": {
      const low = compareValues(cell, first);
      const high = compareValues(cell, rule.values[1] ?? null);
      return low !== null && high !== null && low >= 0 && high <= 0;
    }
    case "in":
      return rule.values.some((value) => equals(cell, value) === true);
    case "not_in":
      return rule.values.every((value) => equals(cell, value) === false);
    case "contains":
      return first !== null && String(cell).toLowerCase().includes(String(first).toLowerCase());
    case "starts_with":
      return first !== null && String(cell).toLowerCase().startsWith(String(first).toLowerCase());
    default:
      throw new UnsupportedOperatorError(String(rule.operator));
  }
}

function compileRule(rule: FilterRule): (row: Row) => boolean {
  const accessor = resolveAccessor(rule.level, rule.attributeName);
  return (row) => evalRule(rule, accessor(row));
}

function compileGroup(group: FilterGroup | FilterSubGroup): (row: Row) => boolean {
  const clauses = group.children.map((child) =>
    child.kind === "group" ? compileGroup(child) : compileRule(child),
  );
  if (clauses.length === 0) {
    // An empty group is a no-op rather than an error: an empty AND matches
    // everything (nothing is constrained yet), an empty OR matches nothing.
    return group.combinator === "and" ? () => true : () => false;
  }
  return group.combinator === "and"
    ? (row) => clauses.every((clause) => clause(row))
    : (row) => clauses.some((clause) => clause(row));
}

function rowsFor(artist: Artist, joinAlbum: boolean, joinTrack: boolean): Row[] {
  if (!joinAlbum) {
    return [{ artist, album: null, track: null }];
  }
  if (!joinTrack) {
    return artist.albums.map((album) => ({ artist, album, track: null }));
  }
  return artist.albums.flatMap((album) => album.tracks.map((track) => ({ artist, album, track })));
}

export function compileFilter(ast: FilterGroup): (artist: Artist) => boolean {
  const predicate = compileGroup(ast);
  // Join only the levels the filter references, so an artist-only filter never
  // fans out into per-track rows.
  const joinTrack = usesLevel(ast, "track");
  const joinAlbum = joinTrack || usesLevel(ast, "album");
  return (artist) => rowsFor(artist, joinAlbum, joinTrack).some(predicate);
}
