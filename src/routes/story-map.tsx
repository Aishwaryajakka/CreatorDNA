import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { KindBadge, PageHeader, Panel, SourceChip } from "@/components/dna-ui";
import { GraphLegend, StoryGraph } from "@/components/StoryGraph";
import {
  KIND_META,
  type LegacyDnaKind,
  storyMap,
  type DnaKind,
  type GraphNode,
} from "@/lib/creator-dna";

export const Route = createFileRoute("/story-map")({
  head: () => ({
    meta: [
      { title: "Your Story Map — Creator DNA" },
      {
        name: "description",
        content:
          "A living map of what you've experienced, believed, learned and shared — with the source behind every node.",
      },
      { property: "og:title", content: "Your Story Map — Creator DNA" },
      {
        property: "og:description",
        content:
          "Explore the connected stories, beliefs, themes and experiences in your DNA.",
      },
    ],
  }),
  component: StoryMapPage,
});

function StoryMapPage() {
  const [selected, setSelected] = useState<GraphNode | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Story map"
        title="Your Story Map"
        subtitle="A living map of what you've experienced, believed, learned and shared. Click any node to see where it came from."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-5 sm:p-6">
          <div className="rounded-2xl border border-border bg-background p-4">
            <StoryGraph
              nodes={storyMap.nodes}
              edges={storyMap.edges}
              selectedId={selected?.id ?? null}
              onSelect={(n) => setSelected(n.kind === "me" ? null : n)}
              className="h-[30rem] sm:h-[38rem]"
              compact
            />
          </div>
          <div className="mt-5">
            <GraphLegend
              kinds={["story", "belief", "theme", "experience", "evolution"]}
            />
          </div>
        </Panel>

        {selected ? (
          <DetailPanel node={selected} onClose={() => setSelected(null)} />
        ) : (
          <Panel className="p-6">
            <p className="eyebrow">Detail panel</p>
            <h2 className="mt-3 text-lg font-bold text-midnight">
              Pick a node
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Select any story, belief, theme or experience to see when it first
              appeared, how often you've returned to it, and exactly which
              content it came from.
            </p>
            <div className="mt-6 space-y-3">
              {(
                [
                  "story",
                  "belief",
                  "theme",
                  "experience",
                  "evolution",
                ] as LegacyDnaKind[]
              ).map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3"
                >
                  <KindBadge kind={k} label={KIND_META[k].plural} />
                  <span className="text-xs text-muted-foreground">
                    {storyMap.nodes.filter((n) => n.kind === k).length === 1
                      ? "1 node"
                      : `${storyMap.nodes.filter((n) => n.kind === k).length} nodes`}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function DetailPanel({
  node,
  onClose,
}: {
  node: GraphNode;
  onClose: () => void;
}) {
  const kind = node.kind as DnaKind;
  const max = Math.max(1, ...(node.timeline ?? []).map((t) => t.count));

  return (
    <Panel
      accent={KIND_META[kind].color}
      className="h-fit p-6 xl:sticky xl:top-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <KindBadge kind={kind} />
          <h2 className="mt-3 text-xl font-bold text-midnight">{node.label}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {node.summary ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {node.summary}
        </p>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <dt className="eyebrow">First detected</dt>
          <dd className="mt-1.5 text-sm font-semibold text-midnight">
            {node.firstDetected}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Mentioned</dt>
          <dd className="mt-1.5 text-sm font-semibold text-midnight">
            {node.mentions} times
          </dd>
        </div>
      </dl>

      {node.timeline ? (
        <div className="mt-6">
          <p className="eyebrow">Over time</p>
          <div className="mt-3 flex items-end gap-2">
            {node.timeline.map((t) => (
              <div
                key={t.period}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${20 + (t.count / max) * 52}px`,
                    backgroundColor: KIND_META[kind].color,
                  }}
                />
                <span className="text-[0.625rem] font-medium text-muted-foreground">
                  {t.period}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {node.related?.length ? (
        <div className="mt-6">
          <p className="eyebrow">Related</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {node.related.map((r) => (
              <span
                key={r}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-midnight"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {node.sources?.length ? (
        <div className="mt-6">
          <p className="eyebrow">Sources</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {node.sources.map((s) => (
              <SourceChip key={s.id}>
                {s.label} · {s.date}
              </SourceChip>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
