import { useMemo, useState } from "react";
import { MetadataTree } from "./components/MetadataTree";
import { StatusPanel } from "./components/StatusPanel";
import { UsagePanel } from "./components/UsagePanel";
import { useOwlbearMetadata } from "./hooks/useOwlbearMetadata";
import type { MetadataEntry } from "./metadata/analyzeMetadata";
import { filterTree } from "./metadata/search";

type Sort = "largest" | "smallest" | "az" | "za";

function sortEntries(entries: MetadataEntry[], sort: Sort) {
  return [...entries].sort((a, b) => {
    if (sort === "largest") return b.size - a.size;
    if (sort === "smallest") return a.size - b.size;
    const comparison = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    });
    return sort === "az" ? comparison : -comparison;
  });
}

export default function App() {
  const {
    status,
    analysis,
    updatedAt,
    error,
    themeError,
    refreshing,
    refresh,
  } = useOwlbearMetadata();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("largest");

  const visibleNodes = useMemo(() => {
    if (!analysis) return [];
    return filterTree(sortEntries(analysis.entries, sort), query);
  }, [analysis, query, sort]);

  if (status === "connecting") {
    return (
      <StatusPanel
        title="Connecting to Owlbear Rodeo"
        message="Waiting for the room SDK to become ready…"
      />
    );
  }

  if (status === "restricted") {
    return (
      <StatusPanel
        title="GM access required"
        message="Metadata Metrics only reveals structural room diagnostics to the GM. No metadata was read for this player."
        onRetry={() => void refresh()}
      />
    );
  }

  if (status === "error" || !analysis) {
    return (
      <StatusPanel
        title="Metadata unavailable"
        message={error ?? "No analysis is available."}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <main className="app-shell">
      <UsagePanel
        totalBytes={analysis.totalBytes}
        keyCount={analysis.keyCount}
        updatedAt={updatedAt}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
      />

      {themeError && (
        <div className="inline-notice" role="status">
          <span>{themeError}</span>
          <button onClick={() => void refresh()}>Retry</button>
        </div>
      )}

      <section className="browser-panel" aria-labelledby="key-breakdown-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Structural diagnostics</span>
            <h2 id="key-breakdown-heading">Key breakdown</h2>
          </div>
          <span className="privacy-badge">Values hidden</span>
        </div>
        <div className="controls">
          <label className="search-control">
            <span className="sr-only">Search keys and paths</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search keys or paths"
            />
          </label>
          <label>
            <span className="sr-only">Sort top-level keys</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
            >
              <option value="largest">Largest</option>
              <option value="smallest">Smallest</option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
            </select>
          </label>
        </div>

        <div className="root-row">
          <div>
            <strong>Root overhead</strong>
            <small>Braces and {Math.max(0, analysis.keyCount - 1)} commas</small>
          </div>
          <span title={`${analysis.rootOverhead} bytes`}>
            {analysis.rootOverhead} B
          </span>
        </div>

        {visibleNodes.length > 0 ? (
          <MetadataTree
            nodes={visibleNodes}
            totalBytes={analysis.totalBytes}
            searchActive={query.trim().length > 0}
          />
        ) : (
          <div className="empty-state">
            {analysis.keyCount === 0
              ? "This room has no metadata keys."
              : "No keys or paths match this search."}
          </div>
        )}
      </section>

      <details className="explanation">
        <summary>How sizes are calculated</summary>
        <div>
          <p>
            The total is the UTF-8 byte length of the room metadata’s JSON
            serialization. Each top-level entry includes its serialized key,
            colon, and serialized value; root braces and commas are listed
            separately, so the figures reconcile exactly.
          </p>
          <p>
            Nested rows show the serialized size of each value. Parent and
            child values overlap and must not be added together. The quota uses
            a conservative 16 kB = 16,000-byte limit documented by Owlbear
            Rodeo. Change the exported constant if that limit changes.
          </p>
        </div>
      </details>
      <footer>Read-only · No values displayed · No external requests</footer>
    </main>
  );
}
