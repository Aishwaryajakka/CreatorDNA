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
import { DEMO_PERSONAS, useDemoMode } from "@/lib/demo-mode";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const demo = useDemoMode();
  const { topic: initial, research: researchId } = Route.useSearch();
  const [topic, setTopic] = useState(initial ?? "");
  const [researchItem, setResearchItem] = useState<ResearchItem | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform | "">("");
  const [result, setResult] = useState<PlanningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!demo.active || demo.step !== 4) return;
    setTopic((current) => current || DEMO_PERSONAS[demo.persona].idea);
    setTargetPlatform((current) => current || "linkedin");
  }, [demo.active, demo.persona, demo.step]);

  useEffect(() => {
    if (
      demo.active &&
      demo.step >= 4 &&
      demo.analysisStatus === "success" &&
      !result
    ) {
      demo.setAnalysisStatus("idle");
      if (demo.step > 4) demo.setStep(4);
    }
  }, [demo, result]);

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
    if (demo.active) demo.setAnalysisStatus("loading");
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
      if (demo.active) {
        demo.setAnalysisStatus("success");
        demo.setResultsPhase(0);
        demo.setStep(5);
      }
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Unable to reach Creator DNA. Please try again."
          : requestError instanceof Error
            ? requestError.message
            : "Creator DNA planning is temporarily unavailable. Please try again.",
      );
      setResult(null);
      if (demo.active) demo.setAnalysisStatus("idle");
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

      <Panel
        accent="var(--evolution)"
        className="plan-prompt p-6 sm:p-8"
        data-demo-target="plan-input"
      >
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
            <Button
              type="submit"
              data-demo-action="plan-submit"
              disabled={loading}
              aria-busy={loading}
              variant="product"
              size="xl"
              className="shrink-0"
            >
              {loading ? "LOOKING THROUGH YOUR DNA…" : "EXPLORE MY STORY"}
              {!loading ? <ArrowRight /> : null}
            </Button>
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
  const demo = useDemoMode();
  const [selectedDirection, setSelectedDirection] = useState<number | null>(
    demo.active ? demo.selectedDirection : null,
  );
  const nodesById = new Map(result.retrievedDNA.map((node) => [node.id, node]));
  const evolution = result.possiblePerspectiveEvolution;
  const repetition = result.possibleRepetition;
  const selectedAngle =
    selectedDirection === null
      ? null
      : (result.threeAuthenticAngles[selectedDirection] ?? null);

  useEffect(() => {
    if (demo.active) return;
    document.querySelector<HTMLElement>(".plan-result-intro")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }, [demo.active]);

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
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "mt-5",
            )}
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
        <p className="mt-2 text-sm text-muted-foreground">
          These are not random suggestions. They are memories from your own
          Creator DNA that relate closely to the idea.
        </p>
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

      <Panel
        accent="var(--evolution)"
        className="p-6 sm:p-8"
        data-demo-target="perspective-evolution"
      >
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

      <Panel className="p-6 sm:p-8" data-demo-target="watch-out">
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
        <div data-demo-target="directions">
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            Creator DNA doesn&apos;t jump straight to writing the post. First,
            it offers three ways you could authentically take the idea forward.
          </p>
          <h2 className="text-2xl font-extrabold text-midnight sm:text-3xl">
            3 ways to make this yours
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Each direction is grounded in your Creator DNA — with the source
            material it leans on.
          </p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {result.threeAuthenticAngles.map((angle, index) => (
            <DirectionCard
              key={`${angle.title}-${index}`}
              angle={angle}
              index={index}
              nodes={nodesById}
              selected={selectedDirection === index}
              onSelect={() => {
                setSelectedDirection(index);
                if (demo.active) demo.selectDirection(index);
              }}
            />
          ))}
        </div>
        {selectedDirection !== null && selectedAngle ? (
          <ReshapeWorkspace
            angle={selectedAngle}
            directionIndex={selectedDirection}
            idea={result.idea}
            targetPlatform={result.targetPlatform}
          />
        ) : null}
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
    <Panel
      accent="var(--creator-green)"
      className="p-6 sm:p-8"
      data-demo-target="alignment"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Alignment</p>
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-bold text-midnight">
          {alignmentLabels[alignment.state]}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Alignment measures connection to your Creator DNA—not whether an idea is
        objectively good or bad. Weak can still be a worthwhile new direction;
        it simply needs more context.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div data-demo-target="why">
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
      <div
        className="mt-6 border-t border-border pt-5"
        data-demo-target="opportunity"
      >
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
  nodes,
  selected,
  onSelect,
}: {
  angle: StoryIntelligenceAngle;
  index: number;
  nodes: Map<string, CreatorDNAMatch>;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Panel
      accent="var(--story)"
      data-demo-target={`direction-${index}`}
      data-demo-selected={selected ? "true" : undefined}
      className={`creative-direction flex flex-col p-6 transition-shadow hover:shadow-lift ${selected ? "demo-direction-selected" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">
          Direction {String.fromCharCode(65 + index)}
        </span>
        {selected ? (
          <span className="inline-flex items-center gap-1 font-mono text-[0.625rem] font-black tracking-wider text-primary">
            <Check className="h-3.5 w-3.5" /> SELECTED
          </span>
        ) : null}
      </div>
      <span className="direction-framing eyebrow">{angle.framingType}</span>
      <h3 className="mt-3 text-lg font-bold leading-snug text-midnight">
        {angle.title}
      </h3>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-midnight">
        {angle.hook}
      </p>
      <p className="eyebrow mt-5">Why it fits</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {angle.rationale}
      </p>
      <details className="mt-5 rounded-xl border border-border bg-background/70 p-4">
        <summary className="cursor-pointer font-mono text-[0.6875rem] font-black uppercase tracking-wider text-primary">
          View platform prep ↓
        </summary>
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
      </details>
      <details className="mt-6 rounded-xl bg-muted/70 p-4">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <EvidenceNote>
            Grounded in {angle.supportingNodeIds.length} Creator DNA memories ↓
          </EvidenceNote>
        </summary>
        <EvidenceList ids={angle.supportingNodeIds} nodes={nodes} />
      </details>
      <Button
        type="button"
        onClick={onSelect}
        variant="ghost"
        size="card"
        className={cn(
          "mt-5 w-full",
          selected && "border-aqua-accent bg-aqua-accent/10 text-midnight",
        )}
      >
        {selected ? "✓ SELECTED" : "SELECT DIRECTION →"}
      </Button>
    </Panel>
  );
}

function ReshapeWorkspace({
  angle,
  directionIndex,
  idea,
  targetPlatform,
}: {
  angle: StoryIntelligenceAngle;
  directionIndex: number;
  idea: string;
  targetPlatform: TargetPlatform;
}) {
  const demo = useDemoMode();
  const [workspaceOpen, setWorkspaceOpen] = useState(!demo.active);
  const [loadingMode, setLoadingMode] = useState<ReshapeMode | null>(null);
  const [reshaped, setReshaped] = useState<ReshapeResult | null>(null);
  const [reshapeError, setReshapeError] = useState("");

  useEffect(() => {
    setReshaped(null);
    setReshapeError("");
    setWorkspaceOpen(!demo.active);
  }, [demo.active, directionIndex]);

  useEffect(() => {
    if (demo.active || !workspaceOpen) return;
    document
      .querySelector<HTMLElement>('[data-demo-target="reshape-controls"]')
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
  }, [demo.active, workspaceOpen]);

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
          directionIndex,
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
      if (demo.active) demo.markReshapeUsed();
    } catch {
      setReshapeError("Couldn't reshape this direction right now.");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <Panel className="mt-6 p-5 sm:p-6" accent="var(--aqua-accent)">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Refine this direction</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Selected direction:{" "}
            <strong className="text-midnight">{angle.title}</strong>
          </p>
        </div>
        {!workspaceOpen ? (
          <Button
            type="button"
            data-demo-action="reshape-toggle-selected"
            onClick={() => setWorkspaceOpen(true)}
            variant="primary"
            size="card"
          >
            REFINE THIS DIRECTION
          </Button>
        ) : null}
      </div>
      {workspaceOpen ? (
        <div
          className="mt-5 border-t border-border pt-5"
          data-demo-target="reshape-controls"
        >
          <div className="grid gap-2 md:grid-cols-3">
            {reshapeOptions.map((option) => (
              <Button
                key={option.mode}
                type="button"
                disabled={Boolean(loadingMode)}
                onClick={() => void reshape(option.mode)}
                variant="ghost"
                size="card"
                className="h-auto min-h-9 justify-start whitespace-normal border-border px-3 py-2 text-left"
              >
                {loadingMode === option.mode ? "RESHAPING…" : option.label}
              </Button>
            ))}
          </div>
          {reshapeError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {reshapeError}
            </p>
          ) : null}
          {reshaped ? (
            <ReshapedDirection result={reshaped} whyItFits={angle.rationale} />
          ) : null}
        </div>
      ) : null}
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

function ReshapedDirection({
  result,
  whyItFits,
}: {
  result: ReshapeResult;
  whyItFits: string;
}) {
  useEffect(() => {
    document
      .querySelector<HTMLElement>('[data-demo-target="reshape-result"]')
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
  }, []);

  return (
    <div
      className="result-reveal mt-5 border-t border-border pt-5"
      data-demo-target="reshape-result"
    >
      <p className="eyebrow">Reshaped direction</p>
      <h4 className="mt-2 text-base font-bold text-midnight">{result.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {result.angle}
      </p>
      <div className="mt-5 grid gap-5 border-t border-border pt-5 md:grid-cols-2">
        <div>
          <p className="eyebrow">Why it fits</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {whyItFits}
          </p>
        </div>
        <div>
          <EvidenceNote>Grounded in your DNA</EvidenceNote>
          <div className="mt-2 divide-y divide-border">
            {result.groundedIn.map((node) => (
              <div key={node.nodeId} className="py-3 first:pt-0">
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
      <div className="mt-5 border-t border-border pt-5">
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
