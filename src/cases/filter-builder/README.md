# Filter builder

A nested AND/OR filter builder over a three-level data hierarchy, rebuilt as a
portfolio case. The original shipped in a client web application as a search
page over stored tabular data; this rebuild ports its shapes and behavior onto
a generated music library (Artist > Album > Track) with the backend replaced by
an in-memory data layer.

Open `04 Filter Builder/Search`. Add conditions, group them, Apply, expand the
results. The panel under the builder mirrors the filter as a readable sentence,
and the share string round-trips the whole filter through a compact versioned
codec. Paste one into the box to load it back.

## How it works

- `filterAst.ts`: the typed AST plus its Zod schema. One level of subgrouping,
  enforced structurally twice over. A subgroup's children are typed rules-only,
  so a third level neither parses nor typechecks. Also the share-string codec:
  positional encoding with a format-version prefix and append-only code tables,
  roughly a third the size of the raw JSON. Decoding is total. Anything malformed
  returns null, and the Zod schema is the single place shape is enforced. A
  golden test freezes the wire format so shared strings keep decoding across
  edits.
- `catalog.ts`: which operators each attribute type permits, and the
  `AttributeCatalog` the UI reads.
- `builderState.ts`: editable rows (raw strings) to and from the AST. Values
  coerce by declared attribute type at Apply time. Numeric coercion requires
  the whole string to be numeric, so a typo like "1990s" stays a string and
  matches nothing rather than becoming 1990.
- `filterText.ts`: the read-only text mirror. Text flows one way, out; it is
  never parsed back.
- `data.ts`: 30 artists from a case-local seeded Faker instance, so builds are
  byte-stable and a second results page exists behind the 25-per-page limit.
- `compile.ts`: the predicate compiler. Every attribute resolves through an
  accessor whitelist or compilation throws; equality uses three-valued logic,
  so a null or type-mismatched operand matches neither the positive nor the
  negative form; empty AND matches everything, empty OR matches nothing;
  matching flattens an artist into joined rows and succeeds when any single
  row satisfies the whole predicate. Two inner-join consequences worth
  knowing: "is empty" on an album or track attribute can never match (joining
  that level excludes artists without it), and a freshly added empty OR
  subgroup zeroes an AND filter until it gains a rule. The text mirror shows
  the `()` that causes it.
- `search.ts`: the fake async API. About 300ms of latency and 25-per-page
  pagination, so the spinner and Previous/Next behave like the real service.
- `FilterBuilder.tsx` / `RuleRow.tsx` / `ResultsTree.tsx` / `FilterSearch.tsx`:
  the recursive builder, the operator-driven value inputs, the lazy caret
  tree, and the page that ties them together.

## Deviations from the source

- A Svelte and Bootstrap frontend rebuilt as React 19 + Tailwind v4 (`qb-`
  token namespace).
- The HTTP backend (attribute catalog, search, per-item fetch against a real
  database) is an in-memory dataset and predicate compiler. The SQL operator
  switch becomes a predicate switch with the same whitelist discipline and
  empty-group semantics. LIKE autoescaping has no in-memory counterpart;
  substring operators are plain case-insensitive string matching.
- The original gated the attribute catalog behind a dataset-type selector;
  that gate is dropped and all three levels are always available.
- Adding a group wraps the rules built so far into their own parentheses and
  makes AND the joiner, so the mirror reads `(existing filter) AND (new
group)`. The original appended the group as one more sibling joined by the
  top combinator, which could not express "everything so far AND this group".
- Page-level error alerts are dropped. The dropdowns and typed inputs cannot
  express an invalid filter and there is no network to fail; compiler errors
  throw as programmer errors. The one visible failure message is the paste
  box rejecting a share string that is malformed or names attributes this
  catalog does not have.
- URL persistence via pushState becomes a visible share-string readout and
  paste box, because stories run inside Storybook's iframe.
- The predicate compiler has unit tests here; the original's SQL compiler
  shipped without them.
- Numeric value coercion requires the whole string to be numeric; the source
  used prefix-parsing (`parseInt`), which turned "1990s" into 1990. Here it
  passes through as a string and matches nothing.
- Carried over deliberately: list-operator values split on commas with no
  escaping, so a value containing a comma is unrepresentable; and the
  join-style matching cannot express "an album with A and a different album
  with B" (a correlated-EXISTS compiler was designed but never shipped).
- Value autocomplete never existed in the shipped frontend and is out of scope
  here too.
