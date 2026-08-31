// Artist > Album > Track caret tree for search results. Top rows are the
// matching artists; expanding one lazy-loads its albums, expanding an album
// shows its track table.

import { useRef, useState } from "react";
import type { Artist } from "./data";
import type { ArtistSummary } from "./search";
import { ChevronDownIcon, ChevronRightIcon } from "./icons";

type ResultsTreeProps = {
  artists: ArtistSummary[];
  loadArtist: (artistId: string) => Promise<Artist | null>;
};

type Loaded = Map<string, Artist | null | "loading">;

function toggled(set: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function renderCell(value: string | number | boolean): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return value;
}

const TRACK_COLUMNS = ["Title", "Duration", "Plays", "Rating", "Explicit"] as const;

export function ResultsTree({ artists, loadArtist }: ResultsTreeProps) {
  const [expandedArtists, setExpandedArtists] = useState<ReadonlySet<string>>(new Set());
  const [expandedAlbums, setExpandedAlbums] = useState<ReadonlySet<string>>(new Set());
  const [loaded, setLoaded] = useState<Loaded>(new Map());
  const requested = useRef<Set<string>>(new Set());

  function toggleArtist(id: string) {
    setExpandedArtists((prev) => toggled(prev, id));
    if (!requested.current.has(id)) {
      requested.current.add(id);
      setLoaded((prev) => new Map(prev).set(id, "loading"));
      void loadArtist(id).then((artist) => setLoaded((prev) => new Map(prev).set(id, artist)));
    }
  }

  if (artists.length === 0) {
    return <p className="text-qb-fg-muted">No matching artists.</p>;
  }

  return (
    <ul className="m-0 list-none p-0">
      {artists.map(({ id, name }) => {
        const expanded = expandedArtists.has(id);
        const artist = loaded.get(id);
        return (
          <li key={id}>
            <div className="flex items-center gap-1 py-1">
              <button
                type="button"
                className="flex items-center text-qb-fg-muted"
                aria-label={expanded ? "Collapse artist" : "Expand artist"}
                aria-expanded={expanded}
                onClick={() => toggleArtist(id)}
              >
                {expanded ? <ChevronDownIcon size={18} /> : <ChevronRightIcon size={18} />}
              </button>
              <span className="font-semibold">{name}</span>
            </div>

            {expanded && artist === "loading" && (
              <output className="flex items-center gap-2 py-1 pl-6 text-qb-fg-muted">
                <span className="qb-spinner" aria-hidden="true" />
                Loading…
              </output>
            )}

            {expanded && artist != null && artist !== "loading" && (
              <ul className="m-0 list-none p-0 pl-6">
                {artist.albums.map((album) => {
                  const albumExpanded = expandedAlbums.has(album.id);
                  return (
                    <li key={album.id}>
                      <div className="flex items-center gap-1 py-1">
                        <button
                          type="button"
                          className="flex items-center text-qb-fg-muted"
                          aria-label={albumExpanded ? "Collapse album" : "Expand album"}
                          aria-expanded={albumExpanded}
                          onClick={() => setExpandedAlbums((prev) => toggled(prev, album.id))}
                        >
                          {albumExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </button>
                        <span>
                          {album.title} — {album.label}, {album.released.slice(0, 4)}
                        </span>
                        <span className="ml-2 rounded-qb-sm bg-qb-surface-2 px-2 text-qb-caption text-qb-fg-muted">
                          {album.tracks.length} track{album.tracks.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {albumExpanded && album.tracks.length > 0 && (
                        <div className="overflow-x-auto pl-6">
                          <table className="mb-2 border-collapse text-qb-caption">
                            <thead>
                              <tr>
                                {TRACK_COLUMNS.map((column) => (
                                  <th
                                    key={column}
                                    scope="col"
                                    className="border-b border-qb-line px-2 py-1 text-left font-semibold"
                                  >
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {album.tracks.map((track) => (
                                <tr key={track.id} className="even:bg-qb-surface-2">
                                  <td className="px-2 py-1">{renderCell(track.title)}</td>
                                  <td className="px-2 py-1">{renderCell(track.duration)}</td>
                                  <td className="px-2 py-1">{renderCell(track.plays)}</td>
                                  <td className="px-2 py-1">{renderCell(track.rating)}</td>
                                  <td className="px-2 py-1">{renderCell(track.explicit)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
