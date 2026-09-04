import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, ArrowDown, AlertTriangle, Quote } from "lucide-react";
import {
  EvidenceNote,
  KindBadge,
  PageHeader,
  Panel,
  SourceChip,
} from "@/components/dna-ui";
import { KIND_META, planResult, type DnaKind } from "@/lib/creator-dna";

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

function PlanPage() {
  const { topic: initial } = Route.useSearch();
  const [topic, setTopic] = useState(initial ?? "");
  const [submitted, setSubmitted] = useState(Boolean(initial));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Plan content"
        title="What do you want to talk about?"
        subtitle="Creator DNA looks through everything you've made, then offers a few directions grounded in your own material. You choose."
      />

      <Panel accent="var(--story)" className="p-6 sm:p-8">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="I want to create something about burnout."
            className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explore my story <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </Panel>

      {submitted ? (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel accent="var(--story)" className="p-6">
              <p className="eyebrow">Your story connection</p>
              <Quote className="mt-4 h-5 w-5 text-story" />
              <p className="mt-3 text-[0.9375rem] font-medium leading-relaxed text-midnight">
                {planResult.storyConnection.text}
              </p>
              <div className="mt-4">
                <SourceChip>{planResult.storyConnection.source}</SourceChip>
              </div>
            </Panel>

            <Panel accent="var(--belief)" className="p-6">
              <p className="eyebrow">What you've said before</p>
              <Quote className="mt-4 h-5 w-5 text-muted-foreground" />
              <p className="mt-3 text-[0.9375rem] font-medium leading-relaxed text-midnight">
                {planResult.saidBefore.text}
              </p>
              <div className="mt-4">
                <SourceChip>{planResult.saidBefore.source}</SourceChip>
              </div>
            </Panel>
          </div>

          <Panel accent="var(--evolution)" className="p-6 sm:p-8">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
              <div className="min-w-0">
                <p className="eyebrow">Perspective evolution</p>
                <h2 className="mt-2 text-xl font-bold text-midnight">
                  Your perspective evolved
                </h2>
              </div>
              <span className="shrink-0 rounded-full bg-evolution px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-midnight">
                Not a contradiction
              </span>
            </div>

            <div className="mt-7 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {planResult.evolution.map((step, idx) => (
                <div key={step.stage} className="contents">
                  <div
                    className="rounded-2xl border border-border bg-background p-5"
                    style={{
                      borderTop: `4px solid ${KIND_META[step.kind as DnaKind].color}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow">{step.stage}</span>
                      <span className="text-xs font-bold text-midnight">
                        {step.year}
                      </span>
                    </div>
                    <p className="mt-3 text-[0.9375rem] font-semibold leading-snug text-midnight">
                      {step.text}
                    </p>
                  </div>
                  {idx < planResult.evolution.length - 1 ? (
                    <div className="grid place-items-center py-1">
                      <ArrowDown className="h-5 w-5 text-muted-foreground lg:-rotate-90" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {planResult.evolutionNote}
            </p>
          </Panel>

          <Panel className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-evolution/30">
                <AlertTriangle className="h-4 w-4 text-midnight" />
              </span>
              <div className="min-w-0">
                <p className="eyebrow">Story fatigue</p>
                <p className="mt-2 text-[0.9375rem] font-semibold text-midnight">
                  You've used your "{planResult.fatigue.story}" story{" "}
                  {planResult.fatigue.times} times recently.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {planResult.fatigue.suggestion}
                </p>
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
              {planResult.angles.map((a) => (
                <Panel
                  key={a.key}
                  accent={KIND_META[a.kind].color}
                  className="flex flex-col p-6 transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-center justify-between gap-3">
                    <KindBadge kind={a.kind} label={a.label} />
                    <span className="text-sm font-extrabold text-muted-foreground">
                      {a.key}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold leading-snug text-midnight">
                    {a.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>

                  <div className="mt-6 rounded-xl bg-muted/70 p-4">
                    <EvidenceNote>Grounded in your Creator DNA</EvidenceNote>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.sources.map((s) => (
                        <SourceChip key={s}>{s}</SourceChip>
                      ))}
                    </div>
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
      ) : null}
    </div>
  );
}
