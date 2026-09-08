import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Compass, Plus, Target, X } from "lucide-react";

import { DnaTypeIcon } from "@/components/DnaTypeIcon";
import { PageHeader, Panel, SourceProvenance } from "@/components/dna-ui";
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from "@/lib/creator-dna";
import type {
  BrandEvolutionResult,
  BrandTerritory,
} from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";

export const Route = createFileRoute("/brand-territories")({
  component: BrandTerritoriesPage,
});

const suggestions = [
  "AI",
  "Entrepreneurship",
  "Creator Economy",
  "Education",
  "Sustainable Ambition",
  "Product Building",
  "Future of Work",
  "Leadership",
  "Design",
  "Career",
  "Wellness",
  "Technology",
  "Storytelling",
];

type DraftTerritory = {
  id?: string;
  name: string;
  description: string;
};

async function responseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(body.error ?? "Unable to load Brand Territories.");
  return body;
}

function BrandTerritoriesPage() {
  const [territories, setTerritories] = useState<DraftTerritory[]>([]);
  const [evolution, setEvolution] = useState<BrandEvolutionResult | null>(null);
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadEvolution() {
    const response = await authenticatedFetch("/api/brand-evolution");
    setEvolution(await responseJson<BrandEvolutionResult>(response));
  }

  useEffect(() => {
    void Promise.all([
      authenticatedFetch("/api/brand-territories").then((response) =>
        responseJson<{ territories: BrandTerritory[] }>(response),
      ),
      authenticatedFetch("/api/brand-evolution").then((response) =>
        responseJson<BrandEvolutionResult>(response),
      ),
    ])
      .then(([territoryResult, evolutionResult]) => {
        setTerritories(
          territoryResult.territories.map((territory) => ({
            id: territory.id,
            name: territory.name,
            description: territory.description ?? "",
          })),
        );
        setEvolution(evolutionResult);
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Brand Territories.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const normalizedNames = useMemo(
    () => new Set(territories.map(({ name }) => name.trim().toLowerCase())),
    [territories],
  );

  function addTerritory(name: string) {
    const trimmed = name.trim();
    setMessage("");
    setError("");
    if (!trimmed || normalizedNames.has(trimmed.toLowerCase())) return;
    if (territories.length >= 7) {
      setError("You can choose up to 7 territories.");
      return;
    }
    setTerritories((current) => [
      ...current,
      { name: trimmed, description: "" },
    ]);
    setCustomName("");
  }

  async function save() {
    if (saving) return;
    if (territories.length < 3) {
      setError("Choose at least 3 territories.");
      return;
    }
    if (territories.length > 7) {
      setError("You can choose up to 7 territories.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await authenticatedFetch("/api/brand-territories", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          territories: territories.map(({ name, description }) => ({
            name,
            ...(description.trim() ? { description } : {}),
          })),
        }),
      });
      const result = await responseJson<{ territories: BrandTerritory[] }>(
        response,
      );
      setTerritories(
        result.territories.map((territory) => ({
          id: territory.id,
          name: territory.name,
          description: territory.description ?? "",
        })),
      );
      await loadEvolution();
      setMessage("Brand Territories saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save Brand Territories.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Brand Territories"
        title="What do you want people to associate you with?"
        subtitle="Choose 3–7 areas you want your body of work to become known for."
      />

      <Panel accent="var(--dna-belief)" className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-midnight">
              Selected territories
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These are intended intellectual territories, not extracted claims.
            </p>
          </div>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-midnight">
            {territories.length} of 7 selected
          </span>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {territories.map((territory, index) => (
                <div
                  key={territory.id ?? `${territory.name}-${index}`}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 shrink-0 text-primary" />
                    <input
                      aria-label={`Territory ${index + 1} name`}
                      value={territory.name}
                      maxLength={80}
                      onChange={(event) =>
                        setTerritories((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-midnight outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${territory.name}`}
                      onClick={() =>
                        setTerritories((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-midnight focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    aria-label={`${territory.name} description`}
                    value={territory.description}
                    maxLength={280}
                    placeholder="Optional: what this territory means to you"
                    onChange={(event) =>
                      setTerritories((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, description: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-midnight outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              ))}
            </div>

            <div className="mt-7">
              <p className="text-sm font-semibold text-midnight">
                Suggested territories
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => {
                  const selected = normalizedNames.has(
                    suggestion.toLowerCase(),
                  );
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={selected}
                      onClick={() => addTerritory(suggestion)}
                      className="rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-midnight transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-primary disabled:cursor-default disabled:border-primary/40 disabled:bg-primary/10 disabled:text-primary"
                    >
                      {selected ? "✓ " : "+ "}
                      {suggestion}
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              className="mt-6 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                addTerritory(customName);
              }}
            >
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="Add a custom territory"
                maxLength={80}
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-midnight outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!customName.trim() || territories.length >= 7}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-midnight hover:border-primary disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add territory
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <div aria-live="polite" className="text-sm">
                {error ? <p className="text-destructive">{error}</p> : null}
                {message ? (
                  <p className="text-creator-green">{message}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="motion-cta glow-lime rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Brand Territories"}
              </button>
            </div>
          </>
        )}
      </Panel>

      <EvolutionTimeline evolution={evolution} />
      <FutureDirection evolution={evolution} />
    </div>
  );
}

function EvolutionTimeline({
  evolution,
}: {
  evolution: BrandEvolutionResult | null;
}) {
  return (
    <Panel accent="var(--dna-experience)" className="p-6 sm:p-8">
      <h2 className="text-xl font-bold text-midnight">
        How your brand is evolving
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A compact chronology grounded in dated Creator DNA evidence.
      </p>
      {!evolution || evolution.timeline.length < 2 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
          Add more dated content to see how your thinking has evolved.
        </p>
      ) : (
        <div className="mt-7 space-y-3">
          {evolution.timeline.map((point, index) => (
            <div key={point.id}>
              <article className="grid gap-4 rounded-2xl border border-border bg-background p-5 sm:grid-cols-[8rem_1fr]">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {point.stage === "past"
                      ? "Past"
                      : point.stage === "turning_point"
                        ? "Turning point"
                        : "New position"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-midnight">
                    {new Date(point.date).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full text-midnight"
                      style={{ backgroundColor: NODE_TYPE_COLORS[point.type] }}
                    >
                      <DnaTypeIcon kind={point.type} size={14} />
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {NODE_TYPE_LABELS[point.type]}
                    </span>
                  </div>
                  <h3 className="mt-3 font-bold text-midnight">
                    {point.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {point.summary}
                  </p>
                  {point.evidenceQuote ? (
                    <blockquote className="mt-3 border-l-2 border-primary pl-3 text-sm italic text-midnight/80">
                      “{point.evidenceQuote}”
                    </blockquote>
                  ) : null}
                  <div className="mt-3">
                    <SourceProvenance
                      title={point.sourceTitle}
                      date={point.sourceDate}
                    />
                  </div>
                </div>
              </article>
              {index < evolution.timeline.length - 1 ? (
                <ArrowDown className="mx-auto my-2 h-4 w-4 text-muted-foreground" />
              ) : null}
            </div>
          ))}
          <CurrentPosition evolution={evolution} />
        </div>
      )}
    </Panel>
  );
}

function CurrentPosition({ evolution }: { evolution: BrandEvolutionResult }) {
  const groups = [
    ["Beliefs", evolution.currentPosition.beliefs],
    ["Themes", evolution.currentPosition.themes],
    ["Expertise", evolution.currentPosition.expertise],
  ] as const;
  return (
    <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <p className="text-xs font-semibold text-primary">Current position</p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {groups.map(([label, nodes]) => (
          <div key={label}>
            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
            {nodes.length ? (
              nodes.map((node) => (
                <p
                  key={node.id}
                  className="mt-2 text-sm font-medium text-midnight"
                >
                  {node.label}
                </p>
              ))
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Not enough evidence yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FutureDirection({
  evolution,
}: {
  evolution: BrandEvolutionResult | null;
}) {
  const goals = evolution?.futureDirection.goals ?? [];
  return (
    <Panel accent="var(--dna-theme)" className="p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-theme text-midnight">
          <Target className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-creator-green">
            Declared direction
          </p>
          <h2 className="mt-1 text-xl font-bold text-midnight">
            Where you're going
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These are the ideas you want your future body of work to compound
            around.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {(evolution?.futureDirection.territories ?? []).map((territory) => (
          <span
            key={territory.id}
            className="rounded-full border border-theme/40 bg-theme/10 px-3 py-2 text-sm font-semibold text-midnight"
          >
            {territory.name}
          </span>
        ))}
      </div>
      {goals.length ? (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-semibold text-midnight">
            Foundation goals
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {goals.map((goal) => (
              <p
                key={goal.id}
                className="rounded-xl border border-border bg-background p-4 text-sm text-midnight"
              >
                {goal.summary}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
