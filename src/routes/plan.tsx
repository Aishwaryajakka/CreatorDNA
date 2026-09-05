import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AlertTriangle, ArrowRight, Quote } from "lucide-react";

import {
  EvidenceNote,
  KindBadge,
  PageHeader,
  Panel,
  SourceChip,
} from "@/components/dna-ui";
import type {
  CreatorDNAMatch,
  StoryIntelligenceResult,
  TargetPlatform,
} from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";

export const Route = createFileRoute("/plan")({
  validateSearch: z.object({ topic: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Plan Content — Creator DNA" },
      {
        name: "description",
        content:
          "Say what you want to talk about and Creator DNA surfaces your own stories, past positions and three authentic angles.",
      },
      { property: "og:title", content: "Plan Content — Creator DNA" },
      {
        property: "og:description",
        content:
          "Memory to connection to perspective to an authentic direction that's yours.",
      },
    ],
  }),
  component: PlanPage,
});

const platformOptions: Array<{ value: TargetPlatform; label: string }> = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "x", label: "X" },
  { value: "threads", label: "Threads" },
];

const platformLabels = Object.fromEntries(
  platformOptions.map((option) => [option.value, option.label]),
) as Record<TargetPlatform, string>;

function PlanPage() {
  const { topic: initial } = Route.useSearch();
  const [topic, setTopic] = useState(initial ?? "");
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform | "">(
    "",
  );
  const [result, setResult] = useState<PlanningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!topic.trim()) {
      setError("Please add a content idea.");
      setResult(null);
      return;
    }
    if (!targetPlatform) {
      setError("Please choose a target platform.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch("/api/plan-content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea: topic.trim(),
          targetPlatform,
        }),
      });
      const payload = (await response.json()) as
        PlanningResponse | ErrorResponse;
      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : "Planning failed.",
        );
      }
      setResult(payload);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Unable to reach Creator DNA. Please try again."
          : requestError instanceof Error
            ? requestError.message
            : "Creator DNA planning is temporarily unavailable. Please try again.",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Plan content"
        title="What do you want to talk about?"
        subtitle="Creator DNA looks through everything you've made, then offers a few directions grounded in your own material. You choose."
      />

      <Panel accent="var(--story)" className="p-6 sm:p-8">
        <form className="flex flex-col gap-3" onSubmit={submitIdea}>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="I want to create something about burnout."
            className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm font-semibold text-midnight">
              <span className="whitespace-nowrap">Plan for</span>
              <select
                value={targetPlatform}
                onChange={(event) =>
                  setTargetPlatform(event.target.value as TargetPlatform | "")
                }
                disabled={loading}
                className="rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium outline-none focus:border-primary"
              >
                <option value="">Choose a platform</option>
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Looking through your DNA..." : "Explore my story"}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </div>
        </form>
        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}
      </Panel>

      {result ? (
        <PlanningResults result={result} />
      ) : loading ? null : (
        <InitialPlanState hasError={Boolean(error)} />
      )}
    </div>
  );
}

function PlanningResults({ result }: { result: PlanningResponse }) {
  const nodesById = new Map(result.retrievedDNA.map((node) => [node.id, node]));
  const evolution = result.possiblePerspectiveEvolution;
  const repetition = result.possibleRepetition;

  if (result.retrievedDNA.length === 0) {
    return (
      <Panel className="p-8 sm:p-10">
        <p className="eyebrow">Not enough memory yet</p>
        <h2 className="mt-2 text-xl font-bold text-midnight">
          Creator DNA needs more of your history to make this analysis reliable.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Add more of your published content so your planning results can be
          grounded in real stories, positions, and evidence.
        </p>
        <a
          href="/add-content"
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Add Content
        </a>
      </Panel>
    );
  }

  return (
    <div className="space-y-8">
      <Panel accent="var(--story)" className="p-5 sm:p-6">
        <p className="eyebrow">Story Intelligence</p>
        <h2 className="mt-2 text-xl font-bold text-midnight">
          Planning for: {platformLabels[result.targetPlatform]}
        </h2>
      </Panel>
      <section>
        <p className="eyebrow">Relevant history</p>
        <h2 className="mt-2 text-2xl font-extrabold text-midnight sm:text-3xl">
          What connects to this idea
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {result.retrievedDNA.length ? (
            result.retrievedDNA.map((node) => (
              <EvidenceCard key={node.id} node={node} />
            ))
          ) : (
            <Panel className="p-6 text-sm text-muted-foreground">
              No closely related Creator DNA was found yet.
            </Panel>
          )}
        </div>
        {result.relevantStories.length ? (
          <Panel className="mt-5 p-6 sm:p-8">
            <p className="eyebrow">Relevant stories</p>
            <div className="mt-4 space-y-5">
              {result.relevantStories.map((story, index) => (
                <div key={`${story.summary}-${index}`}>
                  <p className="text-[0.9375rem] font-medium leading-relaxed text-midnight">
                    {story.summary}
                  </p>
                  <EvidenceList
                    ids={story.supportingNodeIds}
                    nodes={nodesById}
                  />
                </div>
              ))}
            </div>
          </Panel>
        ) : null}
      </section>

      <Panel accent="var(--belief)" className="p-6 sm:p-8">
        <p className="eyebrow">What you've said before</p>
        <Quote className="mt-4 h-5 w-5 text-muted-foreground" />
        {result.previousPositions.length ? (
          <div className="mt-4 space-y-5">
            {result.previousPositions.map((position, index) => (
              <div key={`${position.position}-${index}`}>
                <p className="text-[0.9375rem] font-medium leading-relaxed text-midnight">
                  {position.position}
                </p>
                <EvidenceList
                  ids={position.supportingNodeIds}
                  nodes={nodesById}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            There is not enough retrieved evidence of a previous position yet.
          </p>
        )}
      </Panel>

      <Panel accent="var(--evolution)" className="p-6 sm:p-8">
        <p className="eyebrow">Perspective evolution</p>
        {evolution.status === "identified" ? (
          <>
            <h2 className="mt-2 text-xl font-bold text-midnight">
              Your perspective has evolved
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {evolution.summary}
            </p>
            <EvidenceList ids={evolution.supportingNodeIds} nodes={nodesById} />
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            There is not enough dated evidence to identify a meaningful change
            in perspective.
          </p>
        )}
      </Panel>

      <Panel className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-evolution/30">
            <AlertTriangle className="h-4 w-4 text-midnight" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">Repetition / story fatigue</p>
            {repetition.status === "identified" ? (
              <>
                <p className="mt-2 text-[0.9375rem] font-semibold text-midnight">
                  You&apos;ve told a similar story before
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {repetition.summary}
                </p>
                <EvidenceList
                  ids={repetition.supportingNodeIds}
                  nodes={nodesById}
                />
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {repetition.status === "not detected"
                  ? "No meaningful repetition was detected in the retrieved evidence."
                  : "There is not enough retrieved evidence to assess repetition."}
              </p>
            )}
          </div>
        </div>
      </Panel>

      <section>
        <h2 className="text-2xl font-extrabold text-midnight sm:text-3xl">
          3 ways to make this yours
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each direction is grounded in your Creator DNA — with the source
          material it leans on.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {result.threeAuthenticAngles.map((angle, index) => (
            <Panel
              key={`${angle.title}-${index}`}
              accent="var(--story)"
              className="flex flex-col p-6 transition-shadow hover:shadow-lift"
            >
              <span className="eyebrow">Direction {String.fromCharCode(65 + index)}</span>
              <span className="eyebrow">{angle.framingType}</span>
              <h3 className="mt-3 text-lg font-bold leading-snug text-midnight">
                {angle.title}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-midnight">
                {angle.hook}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {angle.rationale}
              </p>
              <div className="mt-6 rounded-xl bg-muted/70 p-4">
                <EvidenceNote>Grounded in your Creator DNA</EvidenceNote>
                <EvidenceList ids={angle.supportingNodeIds} nodes={nodesById} />
              </div>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-midnight px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Develop this angle
              </button>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}

function InitialPlanState({ hasError }: { hasError: boolean }) {
  if (hasError) return null;
  return (
    <Panel className="p-8 text-center sm:p-10">
      <p className="eyebrow">Story Intelligence</p>
      <h2 className="mt-2 text-xl font-bold text-midnight">
        Start with an idea to see what your history says.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Creator DNA will connect your idea to the stories, positions, and
        evidence you have already shared.
      </p>
    </Panel>
  );
}

function EvidenceCard({ node }: { node: CreatorDNAMatch }) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <KindBadge kind={node.type} />
        <span className="text-xs font-semibold text-muted-foreground">
          {Math.round(node.similarity * 100)}% match
        </span>
      </div>
      <h3 className="mt-3 text-base font-bold text-midnight">{node.label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {node.summary}
      </p>
      <EvidenceSource node={node} />
    </Panel>
  );
}

function EvidenceList({
  ids,
  nodes,
}: {
  ids: string[];
  nodes: Map<string, CreatorDNAMatch>;
}) {
  const evidence = ids
    .map((id) => nodes.get(id))
    .filter((node): node is CreatorDNAMatch => Boolean(node));
  return evidence.length ? (
    <div className="mt-3 space-y-2">
      {evidence.map((node) => (
        <EvidenceSource key={node.id} node={node} />
      ))}
    </div>
  ) : null;
}

function EvidenceSource({ node }: { node: CreatorDNAMatch }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/50 p-3">
      <div className="flex flex-wrap gap-2">
        <SourceChip>{node.sourceTitle ?? node.label}</SourceChip>
        {node.sourceDate ? <SourceChip>{node.sourceDate}</SourceChip> : null}
        <SourceChip>{node.type}</SourceChip>
      </div>
      {node.evidenceQuote ? (
        <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">
          “{node.evidenceQuote}”
        </p>
      ) : null}
    </div>
  );
}

type PlanningResponse = StoryIntelligenceResult & {
  idea: string;
  targetPlatform: TargetPlatform;
  retrievedDNA: CreatorDNAMatch[];
};

type ErrorResponse = { error: string };
