// The filter search page: build a nested AND/OR filter, Apply to run a
// paginated search over the music fixture, and browse the Artist > Album >
// Track results tree. The filter is mirrored as text and encoded into a
// copyable share string.

import { useMemo, useState } from "react";
import { AttributeCatalog } from "./catalog";
import {
  astToBuilder,
  builderToAst,
  emptyBuilderGroup,
  validateAst,
  type BuilderGroup,
} from "./builderState";
import { musicAttributes } from "./data";
import {
  decodeFilterFromUrl,
  encodeFilterToUrl,
  type FilterGroup,
  type FilterRule,
} from "./filterAst";
import { FilterBuilder } from "./FilterBuilder";
import { renderFilterText } from "./filterText";
import { ResultsTree } from "./ResultsTree";
import { loadArtist, PAGE_SIZE, searchArtists, type SearchPage } from "./search";

export function FilterSearch() {
  const catalog = useMemo(() => new AttributeCatalog(musicAttributes), []);
  const [builder, setBuilder] = useState<BuilderGroup>(() => emptyBuilderGroup("and"));
  const [applied, setApplied] = useState<FilterGroup | null>(null);
  const [results, setResults] = useState<SearchPage | null>(null);
  const [offset, setOffset] = useState(0);
  const [searching, setSearching] = useState(false);
  const [shareString, setShareString] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [pasteRejected, setPasteRejected] = useState(false);

  const filterText = renderFilterText(builderToAst(builder, catalog));

  async function runPage(ast: FilterGroup, newOffset: number) {
    setSearching(true);
    try {
      setOffset(newOffset);
      setResults(await searchArtists(ast, newOffset));
    } finally {
      setSearching(false);
    }
  }

  async function apply() {
    const ast = validateAst(builderToAst(builder, catalog));
    setApplied(ast);
    setShareString(encodeFilterToUrl(ast));
    await runPage(ast, 0);
  }

  function ruleInCatalog(rule: FilterRule): boolean {
    return catalog.operatorsFor(rule.level, rule.attributeName).includes(rule.operator);
  }

  function astInCatalog(ast: FilterGroup): boolean {
    return ast.children.every((child) =>
      child.kind === "group" ? child.children.every(ruleInCatalog) : ruleInCatalog(child),
    );
  }

  function loadShared() {
    const ast = decodeFilterFromUrl(pasted.trim());
    if (ast === null || !astInCatalog(ast)) {
      setPasteRejected(true);
      return;
    }
    setPasteRejected(false);
    setPasted("");
    setBuilder(astToBuilder(ast));
  }

  const hasPrev = offset > 0;
  const hasNext = results !== null && offset + PAGE_SIZE < results.total;

  return (
    <div className="min-h-dvh px-8 py-6 qb-root">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 text-qb-title font-semibold">Search Artists</h1>
        <p className="mb-4 text-qb-fg-muted">
          Build a filter over the music library and browse the matching artists.
        </p>

        <FilterBuilder group={builder} catalog={catalog} onChange={setBuilder} />

        <div className="my-3 rounded-qb-md border border-qb-line bg-qb-surface px-3 py-2">
          <span className="mr-2 text-qb-caption text-qb-fg-muted">Filter:</span>
          <code className="text-qb-caption">{filterText || "(empty — matches all artists)"}</code>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="qb-btn border-qb-accent bg-qb-accent font-semibold text-white hover:bg-qb-accent"
            onClick={() => void apply()}
            disabled={searching}
          >
            Apply
            {searching && <span className="qb-spinner" aria-hidden="true" />}
          </button>

          {shareString !== null && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-qb-caption text-qb-fg-muted">Share:</span>
              <output className="block max-w-72 truncate rounded-qb-sm bg-qb-surface-2 px-2 py-1 font-mono text-qb-caption">
                {shareString}
              </output>
              <button
                type="button"
                className="qb-btn"
                onClick={() =>
                  void navigator.clipboard.writeText(shareString).catch(() => {
                    /* denied */
                  })
                }
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            className="qb-field w-72 font-mono text-qb-caption"
            type="text"
            placeholder="paste a share string"
            aria-label="Share string"
            value={pasted}
            onChange={(event) => setPasted(event.currentTarget.value)}
          />
          <button
            type="button"
            className="qb-btn"
            onClick={loadShared}
            disabled={pasted.trim() === "" || searching}
          >
            Load
          </button>
          {pasteRejected && (
            <span className="text-qb-caption text-qb-fg-muted">
              That string is not a shareable filter.
            </span>
          )}
        </div>

        {results !== null && (
          <>
            <hr className="my-4 border-qb-line" />
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-qb-body font-semibold">
                Results{" "}
                <span className="font-normal text-qb-fg-muted">({results.total} artists)</span>
              </h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="qb-btn"
                  disabled={!hasPrev || searching}
                  onClick={() =>
                    applied !== null && void runPage(applied, Math.max(0, offset - PAGE_SIZE))
                  }
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="qb-btn"
                  disabled={!hasNext || searching}
                  onClick={() => applied !== null && void runPage(applied, offset + PAGE_SIZE)}
                >
                  Next
                </button>
              </div>
            </div>
            <ResultsTree artists={results.artists} loadArtist={loadArtist} />
          </>
        )}
      </div>
    </div>
  );
}
