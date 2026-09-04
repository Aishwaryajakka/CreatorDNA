import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/dna-ui";
import { GraphLegend, StoryGraph } from "@/components/StoryGraph";
import { KIND_META, dnaSummary, homeGraph, creator } from "@/lib/creator-dna";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creator DNA — Your story, remembered" },
      {
        name: "description",
        content:
          "Creator DNA turns everything you've created into a living map of your stories, beliefs, themes and evolving perspective.",
      },
      { property: "og:title", content: "Creator DNA — Your story, remembered" },
      {
        property: "og:description",
        content:
          "Every creator has a content calendar. Creator DNA gives them a story map.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={`Welcome back, ${creator.name.split(" ")[0]}`}
        title="Your story, remembered."
        subtitle="Creator DNA turns everything you've created into a living map of your stories, beliefs, themes, and evolving perspective."
        action={
          <Link
            to="/add-content"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dnaSummary.map((s) => {
          const meta = KIND_META[s.kind];
          return (
            <Panel key={s.kind} accent={meta.color} className="p-6">
              <p className="eyebrow">{s.overrideLabel ?? meta.plural}</p>
              <p className="mt-4 text-4xl font-extrabold text-midnight">
                {s.count}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.caption}</p>
            </Panel>
          );
        })}
      </div>

      <Panel className="p-6 sm:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Your story graph</p>
            <h2 className="mt-2 text-xl font-bold text-midnight">
              Six connected pieces of who you are
            </h2>
          </div>
          <Link
            to="/story-map"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Open full map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background p-4">
          <StoryGraph
            nodes={homeGraph.nodes}
            edges={homeGraph.edges}
            className="h-[19rem] sm:h-[23rem]"
            compact
          />
        </div>
        <div className="mt-5">
          <GraphLegend
            kinds={["story", "belief", "theme", "experience", "evolution"]}
          />
        </div>
      </Panel>

      <Panel accent="var(--belief)" className="p-6 sm:p-8">
        <p className="eyebrow">Continue your story</p>
        <h2 className="mt-2 text-xl font-bold text-midnight">
          What do you want to talk about next?
        </h2>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/plan", search: { topic: topic || undefined } });
          }}
        >
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="I want to create something about burnout."
            className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-midnight px-5 py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Find my angle <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Creator DNA suggests directions grounded in what you've already said —
          you decide what to publish.
        </p>
      </Panel>
    </div>
  );
}
