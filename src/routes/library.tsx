import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Search, UserRound } from "lucide-react";
import { PageHeader, Panel } from "@/components/dna-ui";
import { authenticatedFetch } from "@/lib/supabase/client";
import {
  getNodeTypeColor,
  NODE_TYPE_LABELS,
  type DnaKind,
} from "@/lib/creator-dna";
import { DnaTypeIcon } from "@/components/DnaTypeIcon";
import { getDnaBorderColor, getDnaIconForeground } from "@/lib/dna-iconography";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Content Library — Creator DNA" },
      {
        name: "description",
        content:
          "Every piece of content you've added, with the stories, beliefs and themes extracted from each one.",
      },
      { property: "og:title", content: "Content Library — Creator DNA" },
      {
        property: "og:description",
        content:
          "Search content you've added or imported, filtered by platform, theme and date.",
      },
    ],
  }),
  component: LibraryPage,
});

const statusStyle: Record<string, string> = {
  Analyzed: "bg-theme/15 text-midnight",
  Processing: "bg-evolution/25 text-midnight",
  Queued: "bg-muted text-muted-foreground",
};

type LibraryRow = {
  id: string;
  title: string;
  platform: string;
  date: string;
  sourceUrl?: string | null;
  counts: Record<string, number>;
};

function LibraryPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All");
  const [theme, setTheme] = useState("All");
  const [year, setYear] = useState("All");
  const [items, setItems] = useState<LibraryRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void authenticatedFetch("/api/content-library")
      .then(async (response) => {
        const data = (await response.json()) as {
          items?: LibraryRow[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(data.error ?? "Unable to load your content library.");
        setItems(data.items ?? []);
      })
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your content library.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(
    () => Array.from(new Set(items.map((i) => i.date.slice(0, 4)))).sort(),
    [items],
  );

  const platforms = ["YouTube", "LinkedIn", "X", "Manual"];
  const themes = useMemo(
    () =>
      Array.from(
        new Set(items.flatMap((item) => Object.keys(item.counts))),
      ).sort(),
    [items],
  );
  const rows = items.filter(
    (i) =>
      (platform === "All" || i.platform === platform) &&
      (theme === "All" || (i.counts[theme] ?? 0) > 0) &&
      (year === "All" || i.date.startsWith(year)) &&
      i.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Everything Creator DNA remembers."
        subtitle="Each item you add or import stays attached to the stories, beliefs, and themes extracted from it, so every insight keeps its evidence."
      />

      <Panel className="library-controls p-5 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search content Creator DNA remembers..."
            className="w-full rounded-xl border border-input bg-background py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Filter
            label="Platform"
            value={platform}
            onChange={setPlatform}
            options={platforms}
          />
          <Filter
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={themes}
          />
          <Filter
            label="Date"
            value={year}
            onChange={setYear}
            options={years}
          />
        </div>
      </Panel>

      <Panel className="memory-archive overflow-x-auto">
        {error ? <p className="p-5 text-sm text-destructive">{error}</p> : null}
        <table className="w-full min-w-[54rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Title", "Source", "Date", "DNA extracted", "Status"].map(
                (h) => (
                  <th key={h} className="eyebrow px-5 py-4 font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, row) => (
                  <tr key={row} className="border-b border-border">
                    {Array.from({ length: 5 }).map((__, cell) => (
                      <td key={cell} className="px-5 py-4">
                        <span className="telemetry-skeleton block h-5 rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-border transition-[background-color,box-shadow] duration-[160ms] last:border-0 hover:bg-aqua-accent/5 hover:shadow-[inset_3px_0_0_var(--aqua-accent)]"
                  >
                    <td className="px-5 py-4 font-semibold text-midnight">
                      {i.title === "Creator Foundation" ? (
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <UserRound className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block">Creator Foundation</span>
                            <span className="mt-1 inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                              Profile source
                            </span>
                          </span>
                        </div>
                      ) : i.sourceUrl ? (
                        <a
                          href={i.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {i.title}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        i.title
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {i.platform === "Manual" &&
                      i.title === "Creator Foundation"
                        ? "Foundation"
                        : i.platform}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(i.date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(i.counts).length ? (
                          Object.keys(i.counts).map((t) => (
                            <span
                              key={t}
                              className="group/badge inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[0.6875rem] font-medium text-midnight transition-[filter] hover:brightness-110 hover:drop-shadow-[0_0_5px_currentColor]"
                              style={{
                                borderColor: `color-mix(in srgb, ${getDnaBorderColor(t as DnaKind)} 45%, transparent)`,
                                backgroundColor: `color-mix(in srgb, ${getNodeTypeColor(t)} 12%, transparent)`,
                              }}
                            >
                              <span
                                className="semantic-node-marker grid h-5 w-5 place-items-center rounded-full"
                                style={{
                                  color: getDnaIconForeground(t as DnaKind),
                                  backgroundColor: getNodeTypeColor(t),
                                  borderColor: getDnaBorderColor(t as DnaKind),
                                }}
                              >
                                <DnaTypeIcon kind={t as DnaKind} size={11} />
                              </span>
                              {NODE_TYPE_LABELS[
                                t as keyof typeof NODE_TYPE_LABELS
                              ] ?? t}{" "}
                              · {i.counts[t]}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${statusStyle["Analyzed"]}`}
                      >
                        Analyzed
                      </span>
                    </td>
                  </tr>
                ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  Nothing matches those filters yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-xs">
      <span className="library-filter-label font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-midnight outline-none"
      >
        <option value="All">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
