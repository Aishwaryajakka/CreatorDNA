import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/dna-ui";
import { allThemes, libraryItems, platforms } from "@/lib/creator-dna";

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
          "Search everything you've ever said, filtered by platform, theme and date.",
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

function LibraryPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All");
  const [theme, setTheme] = useState("All");
  const [year, setYear] = useState("All");

  const years = useMemo(
    () =>
      Array.from(new Set(libraryItems.map((i) => i.date.slice(0, 4)))).sort(),
    [],
  );

  const rows = libraryItems.filter(
    (i) =>
      (platform === "All" || i.platform === platform) &&
      (theme === "All" || i.themes.includes(theme)) &&
      (year === "All" || i.date.startsWith(year)) &&
      i.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Content library"
        title="Everything you've ever said"
        subtitle="Each piece stays attached to the stories, beliefs and themes it produced, so every insight keeps its evidence."
      />

      <Panel className="p-5 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything you've ever said..."
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
            options={allThemes}
          />
          <Filter
            label="Date"
            value={year}
            onChange={setYear}
            options={years}
          />
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[54rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                "Title",
                "Platform",
                "Date",
                "Stories",
                "Beliefs",
                "Themes",
                "Status",
              ].map((h) => (
                <th key={h} className="eyebrow px-5 py-4 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr
                key={i.id}
                className="border-b border-border last:border-0 hover:bg-muted/50"
              >
                <td className="px-5 py-4 font-semibold text-midnight">
                  {i.title}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {i.platform}
                </td>
                <td className="px-5 py-4 text-muted-foreground">{i.date}</td>
                <td className="px-5 py-4">
                  <Count n={i.stories} color="var(--story)" />
                </td>
                <td className="px-5 py-4">
                  <Count n={i.beliefs} color="var(--belief)" />
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {i.themes.length ? (
                      i.themes.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-muted px-2 py-1 text-[0.6875rem] font-medium text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${statusStyle[i.status]}`}
                  >
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
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

function Count({ n, color }: { n: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-midnight">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {n}
    </span>
  );
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
      <span className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
