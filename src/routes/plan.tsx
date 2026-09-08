import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AlertTriangle, ArrowRight, Check, Quote } from "lucide-react";

import {
  EvidenceNote,
  KindBadge,
  PageHeader,
  Panel,
  SourceProvenance,
  SourceChip,
} from "@/components/dna-ui";
import type {
  CreatorDNAMatch,
  ReshapeMode,
  ReshapeResult,
  StoryIntelligenceAngle,
  StoryIntelligenceResult,
  TargetPlatform,
} from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";
import type { ResearchItem } from "@/lib/research/types";

export const Route = createFileRoute("/plan")({
  validateSearch: z.object({
    topic: z.string().optional(),
    research: z.string().uuid().optional(),
  }),
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
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "threads", label: "Threads" },
];

const platformLabels = Object.fromEntries(
  platformOptions.map((option) => [option.value, option.label]),
) as Record<TargetPlatform, string>;

function PlanPage() {
  const { topic: initial, research: researchId } = Route.useSearch();
  const [topic, setTopic] = useState(initial ?? "");
  const [researchItem, setResearchItem] = useState<ResearchItem | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform | "">("");
  const [result, setResult] = useState<PlanningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!researchId) return;
    void authenticatedFetch("/api/research")
      .then((response) => response.json())
      .then((body: { items?: ResearchItem[] }) => {
        const item = body.items?.find(
          (candidate) => candidate.id === researchId,
        );
        if (!item) return;
        setResearchItem(item);
        setTopic((current) => current || item.headline);
      });
  }, [researchId]);

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
          ...(researchId ? { researchItemId: researchId } : {}),
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
    <div
      className={`plan-workspace space-y-10 ${result ? "has-plan-results" : ""}`}
    >
      <PageHeader
        eyebrow="Plan content"
        title="What do you want to talk about?"
        subtitle="Creator DNA looks through everything you've made, then offers a few directions grounded in your own material. You choose."
      />

      {researchItem ? (
        <Panel accent="var(--aqua-accent)" className="p-4 sm:p-5">
          <p className="eyebrow">Planning from Research Pulse</p>
          <p className="mt-1 font-semibold text-midnight">
            {researchItem.headline}
          </p>
        </Panel>
      ) : null}

      <Panel accent="var(--evolution)" className="plan-prompt p-6 sm:p-8">
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
              className="motion-cta glow-lime inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-chartreuse px-6 py-4 text-sm font-bold text-[#050811] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
      ) : loading ? (
        <IntelligenceProgress />
      ) : (
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
      <div className="result-reveal space-y-8">
        <Panel accent="var(--story)" className="plan-result-intro p-5 sm:p-6">
          <p className="eyebrow">Story Intelligence</p>
          <h2 className="mt-2 text-xl font-bold text-midnight">
            Planning for: {platformLabels[result.targetPlatform]}
          </h2>
        </Panel>
        <AlignmentPanel result={result} nodes={nodesById} />
        <Panel className="p-8 sm:p-10">
          <p className="eyebrow">Not enough memory yet</p>
          <h2 className="mt-2 text-xl font-bold text-midnight">
            Creator DNA needs more of your history to make this analysis
            reliable.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Add more of your published content so future directions can be
            grounded in real stories, positions, and evidence.
          </p>
          <a
            href="/add-content"
            className="motion-cta glow-lime mt-5 inline-flex rounded-xl bg-chartreuse px-5 py-2.5 text-sm font-bold text-[#050811] hover:bg-white"
          >
            Add Content
          </a>
        </Panel>
      </div>
    );
  }

  return (
    <div className="result-reveal space-y-8">
      <Panel accent="var(--story)" className="plan-result-intro p-5 sm:p-6">
        <p className="eyebrow">Story Intelligence</p>
        <h2 className="mt-2 text-xl font-bold text-midnight">
          Planning for: {platformLabels[result.targetPlatform]}
        </h2>
      </Panel>

      <AlignmentPanel result={result} nodes={nodesById} />

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
            <DirectionCard
              key={`${angle.title}-${index}`}
              angle={angle}
              index={index}
              idea={result.idea}
              targetPlatform={result.targetPlatform}
              nodes={nodesById}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

const alignmentLabels = {
  strong: "Strong",
  mixed: "Mixed",
  weak: "Weak",
  insufficient_evidence: "Insufficient evidence",
} as const;

function AlignmentPanel({
  result,
  nodes,
}: {
  result: PlanningResponse;
  nodes: Map<string, CreatorDNAMatch>;
}) {
  const { alignment } = result;
  return (
    <Panel accent="var(--creator-green)" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Alignment</p>
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-bold text-midnight">
          {alignmentLabels[alignment.state]}
        </span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Why</p>
          {alignment.why.length ? (
            <div className="mt-3 space-y-4">
              {alignment.why.map((reason, index) => (
                <div key={`${reason.text}-${index}`}>
                  <p className="text-sm leading-relaxed text-midnight">
                    {reason.text}
                  </p>
                  <EvidenceList ids={reason.supportingNodeIds} nodes={nodes} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Creator DNA doesn&apos;t yet have enough relevant history to judge
              this idea confidently.
            </p>
          )}
        </div>
        <div>
          <p className="eyebrow">Watch out</p>
          {alignment.watchOut.length ? (
            <div className="mt-3 space-y-4">
              {alignment.watchOut.map((risk, index) => (
                <div key={`${risk.text}-${index}`}>
                  <p className="text-sm leading-relaxed text-midnight">
                    {risk.text}
                  </p>
                  <EvidenceList ids={risk.supportingNodeIds} nodes={nodes} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No meaningful evidence-backed risk was found.
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 border-t border-border pt-5">
        <p className="eyebrow">Opportunity</p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-midnight">
          {alignment.opportunity}
        </p>
      </div>
    </Panel>
  );
}

const reshapeOptions: Array<{ mode: ReshapeMode; label: string }> = [
  { mode: "closer_to_story", label: "Closer to my story" },
  { mode: "stronger_point_of_view", label: "Stronger point of view" },
  {
    mode: "fresh_angle",
    label: "Fresh angle without repeating myself",
  },
];

function DirectionCard({
  angle,
  index,
  idea,
  targetPlatform,
  nodes,
}: {
  angle: StoryIntelligenceAngle;
  index: number;
  idea: string;
  targetPlatform: TargetPlatform;
  nodes: Map<string, CreatorDNAMatch>;
}) {
  const [reshapeOpen, setReshapeOpen] = useState(false);
  const [loadingMode, setLoadingMode] = useState<ReshapeMode | null>(null);
  const [reshaped, setReshaped] = useState<ReshapeResult | null>(null);
  const [reshapeError, setReshapeError] = useState("");

  async function reshape(mode: ReshapeMode) {
    if (loadingMode) return;
    setLoadingMode(mode);
    setReshapeError("");
    try {
      const response = await authenticatedFetch("/api/reshape-content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea,
          targetPlatform,
          directionIndex: index,
          reshapeMode: mode,
        }),
      });
      const body = (await response.json()) as ReshapeResult | ErrorResponse;
      if (!response.ok || "error" in body)
        throw new Error(
          "error" in body
            ? body.error
            : "Couldn't reshape this direction right now.",
        );
      setReshaped(body);
      setReshapeOpen(false);
    } catch {
      setReshapeError("Couldn't reshape this direction right now.");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <Panel
      accent="var(--story)"
      className="creative-direction flex flex-col p-6 transition-shadow hover:shadow-lift"
    >
      <span className="eyebrow">
        Direction {String.fromCharCode(65 + index)}
      </span>
      <span className="direction-framing eyebrow">{angle.framingType}</span>
      <h3 className="mt-3 text-lg font-bold leading-snug text-midnight">
        {angle.title}
      </h3>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-midnight">
        {angle.hook}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {angle.rationale}
      </p>
      <div className="mt-5 rounded-xl border border-border bg-background/70 p-4">
        <p className="eyebrow">Platform prep</p>
        {angle.platformPrep.suggestedTitle ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Suggested title
            </p>
            <p className="mt-1 text-sm font-semibold text-midnight">
              {angle.platformPrep.suggestedTitle}
            </p>
          </div>
        ) : null}
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground">Hook</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-midnight">
            {angle.platformPrep.hook}
          </p>
        </div>
        <p className="mt-3 text-xs font-semibold text-primary">
          {angle.platformPrep.formatRecommendation}
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          {angle.platformPrep.structure.map((beat) => (
            <li key={beat}>{beat}</li>
          ))}
        </ol>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <PrepList label="Tone" items={angle.platformPrep.toneNotes} />
          <PrepList label="Avoid" items={angle.platformPrep.avoid} />
        </div>
      </div>
      <div className="mt-6 rounded-xl bg-muted/70 p-4">
        <EvidenceNote>Grounded in your Creator DNA</EvidenceNote>
        <EvidenceList ids={angle.supportingNodeIds} nodes={nodes} />
      </div>
      <button
        type="button"
        aria-expanded={reshapeOpen}
        onClick={() => setReshapeOpen((open) => !open)}
        className="mt-5 w-full rounded-xl bg-midnight px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={Boolean(loadingMode)}
      >
        {loadingMode ? "Reshaping…" : "Reshape"}
      </button>
      {reshapeOpen ? (
        <div className="popover-enter mt-2 space-y-1 rounded-xl border border-border bg-card p-2">
          {reshapeOptions.map((option) => (
            <button
              key={option.mode}
              type="button"
              disabled={Boolean(loadingMode)}
              onClick={() => void reshape(option.mode)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-midnight transition-colors hover:bg-muted disabled:opacity-60"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {reshapeError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {reshapeError}
        </p>
      ) : null}
      {reshaped ? <ReshapedDirection result={reshaped} /> : null}
    </Panel>
  );
}

function PrepList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-midnight">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function ReshapedDirection({ result }: { result: ReshapeResult }) {
  return (
    <div className="result-reveal mt-5 border-t border-border pt-5">
      <p className="eyebrow">Reshaped direction</p>
      <h4 className="mt-2 text-base font-bold text-midnight">{result.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {result.angle}
      </p>
      <div className="mt-4 rounded-xl bg-muted/70 p-4">
        <p className="eyebrow">Platform prep</p>
        {result.platformPrep.hook ? (
          <p className="mt-2 text-sm font-semibold text-midnight">
            {result.platformPrep.hook}
          </p>
        ) : null}
        {result.platformPrep.structure?.length ? (
          <ol className="mt-3 list-inside list-decimal space-y-1 text-xs text-muted-foreground">
            {result.platformPrep.structure.map((beat) => (
              <li key={beat}>{beat}</li>
            ))}
          </ol>
        ) : null}
        {result.platformPrep.notes?.map((note) => (
          <p key={note} className="mt-2 text-xs text-muted-foreground">
            {note}
          </p>
        ))}
      </div>
      <div className="mt-4">
        <EvidenceNote>Grounded in your DNA</EvidenceNote>
        <div className="mt-2 space-y-2">
          {result.groundedIn.map((node) => (
            <div
              key={node.nodeId}
              className="rounded-xl border border-border bg-muted/50 p-3"
            >
              <KindBadge kind={node.type} />
              <p className="mt-2 text-sm font-semibold text-midnight">
                {node.label}
              </p>
              {node.sourceTitle ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Source: {node.sourceTitle}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntelligenceProgress() {
  const [active, setActive] = useState(0);
  const stages = [
    "Connecting your history",
    "Reviewing relevant Creator DNA",
    "Organizing source-backed evidence",
    "Comparing perspective signals",
    "Building three directions",
  ];

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((value) => Math.min(value + 1, stages.length - 1)),
      650,
    );
    return () => window.clearInterval(timer);
  }, [stages.length]);

  return (
    <Panel className="telemetry-grid p-6 sm:p-8" accent="var(--aqua-accent)">
      <p className="eyebrow text-aqua-accent">Building Story Intelligence</p>
      <h2 className="mt-2 text-xl font-bold text-midnight">
        Connecting your idea to your creative memory.
      </h2>
      <div className="mt-6 space-y-1">
        {stages.map((stage, index) => {
          const complete = index < active;
          const current = index === active;
          return (
            <div
              key={stage}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${current ? "scan-line border-aqua-accent/50 bg-aqua-accent/10 text-midnight" : "border-transparent text-muted-foreground"}`}
            >
              <span
                className={`relative z-10 grid h-6 w-6 place-items-center rounded-full border ${complete ? "border-creator-green bg-creator-green text-[#050811]" : current ? "border-aqua-accent text-aqua-accent" : "border-border"}`}
              >
                {complete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${current ? "data-pulse bg-aqua-accent" : "bg-border"}`}
                  />
                )}
              </span>
              <span className="relative z-10 text-sm font-medium">{stage}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-5 font-mono text-[0.6875rem] text-muted-foreground">
        This sequence reflects the active planning request and does not delay
        the result.
      </p>
    </Panel>
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
      <SourceProvenance title={node.sourceTitle} date={node.sourceDate} />
      <div className="flex flex-wrap gap-2">
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
