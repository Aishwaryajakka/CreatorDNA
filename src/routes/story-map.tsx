import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { KindBadge, PageHeader, Panel } from "@/components/dna-ui";
import { GraphLegend, StoryGraph } from "@/components/StoryGraph";
import {
  KIND_META,
  type DnaKind,
  type GraphEdge,
  type GraphNode,
} from "@/lib/creator-dna";
import type { CreatorDNANode } from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";

export const Route = createFileRoute("/story-map")({ component: StoryMapPage });
const kinds: DnaKind[] = [
  "story",
  "belief",
  "theme",
  "experience",
  "lesson",
  "value",
  "goal",
  "identity",
  "expertise",
];

function StoryMapPage() {
  const [rawNodes, setRawNodes] = useState<CreatorDNANode[]>([]);
  const [selected, setSelected] = useState<CreatorDNANode | null>(null);
  const [filter, setFilter] = useState<DnaKind | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void authenticatedFetch("/api/story-map")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (!Array.isArray(data.nodes)) {
          throw new Error("Unable to load your Story Map.");
        }
        setRawNodes(data.nodes as CreatorDNANode[]);
      })
      .catch((e: unknown) =>
        setError(
          e instanceof Error ? e.message : "Unable to load your Story Map.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const visible = useMemo(
    () => rawNodes.filter((n) => filter === "all" || n.type === filter),
    [rawNodes, filter],
  );
  const graphNodes = useMemo(
    () =>
      visible.map(
        (node, i) =>
          ({
            id: node.id,
            label: node.label,
            kind: node.type,
            summary: node.summary,
            x: 12 + ((i * 37) % 76),
            y: 12 + ((i * 53) % 76),
          }) satisfies GraphNode,
      ),
    [visible],
  );
  const edges = useMemo<GraphEdge[]>(() => {
    const result: GraphEdge[] = [];
    for (let i = 0; i < visible.length; i++)
      for (
        let j = i + 1;
        j < visible.length && result.length < Math.min(visible.length * 2, 80);
        j++
      )
        if (
          visible[i]!.contentId &&
          visible[i]!.contentId === visible[j]!.contentId
        )
          result.push({ from: visible[i]!.id, to: visible[j]!.id });
    return result;
  }, [visible]);
  if (error)
    return <Panel className="p-8 text-sm text-destructive">{error}</Panel>;
  if (loading)
    return (
      <Panel className="p-10 text-center text-sm text-muted-foreground">
        Loading your Story Map…
      </Panel>
    );
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Story map"
        title="Your Story Map"
        subtitle="A living map of what you've experienced, believed, learned and shared. Click any node to see where it came from."
      />
      {rawNodes.length === 0 ? (
        <Panel className="p-10 text-center">
          <h2 className="text-lg font-bold text-midnight">
            Your Story Map is empty.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add content to discover the stories, beliefs and lessons behind your
            work.
          </p>
          <a
            href="/add-content"
            className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Add Content
          </a>
        </Panel>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {["all", ...kinds].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k as DnaKind | "all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
              >
                {k === "all" ? "All" : KIND_META[k as DnaKind].plural}
              </button>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Panel className="p-5 sm:p-6">
              <div className="rounded-2xl border border-border bg-background p-4">
                <StoryGraph
                  nodes={graphNodes}
                  edges={edges}
                  selectedId={selected?.id ?? null}
                  onSelect={(n) =>
                    setSelected(rawNodes.find((x) => x.id === n.id) ?? null)
                  }
                  className="h-[30rem] sm:h-[38rem]"
                  compact
                />
              </div>
              <div className="mt-5">
                <GraphLegend kinds={kinds} />
              </div>
            </Panel>
            {selected ? (
              <Detail node={selected} close={() => setSelected(null)} />
            ) : (
              <Panel className="p-6">
                <p className="eyebrow">Detail panel</p>
                <h2 className="mt-3 text-lg font-bold text-midnight">
                  Pick a node
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Select a node to inspect its grounded source evidence.
                </p>
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ node, close }: { node: CreatorDNANode; close: () => void }) {
  return (
    <Panel
      accent={KIND_META[node.type].color}
      className="h-fit p-6 xl:sticky xl:top-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <KindBadge kind={node.type} />
          <h2 className="mt-3 text-xl font-bold text-midnight">{node.label}</h2>
        </div>
        <button onClick={close} aria-label="Close detail panel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {node.summary}
      </p>
      <dl className="mt-6 space-y-4 text-sm">
        <div>
          <dt className="eyebrow">Evidence</dt>
          <dd className="mt-1 italic text-midnight">
            “{node.evidenceQuote || "No evidence quote available."}”
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Source</dt>
          <dd className="mt-1 font-semibold text-midnight">
            {node.sourceTitle || "Unknown source"}
            {node.sourceDate
              ? ` · ${new Date(node.sourceDate).toLocaleDateString()}`
              : ""}
          </dd>
        </div>
        {node.confidence != null && (
          <div>
            <dt className="eyebrow">Confidence</dt>
            <dd className="mt-1 text-midnight">
              {Math.round(node.confidence * 100)}%
            </dd>
          </div>
        )}
      </dl>
    </Panel>
  );
}
