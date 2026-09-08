import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  CalendarDays,
  ChevronDown,
  ListFilter,
  Maximize2,
  Minimize2,
  Minus,
  Network,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  KindBadge,
  PageHeader,
  Panel,
  SourceProvenance,
} from "@/components/dna-ui";
import { GraphLegend, StoryGraph } from "@/components/StoryGraph";
import {
  KIND_META,
  NODE_TYPE_COLORS,
  type DnaKind,
  type GraphEdge,
  type GraphNode,
} from "@/lib/creator-dna";
import type { CreatorDNANode } from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";
import { DataPulse, NodeConstellation } from "@/components/Motion";
import { DnaTypeIcon } from "@/components/DnaTypeIcon";
import { getDnaBorderColor, getDnaIconForeground } from "@/lib/dna-iconography";

export const Route = createFileRoute("/story-map")({
  validateSearch: z.object({
    type: z.string().optional(),
    node: z.string().optional(),
  }),
  component: StoryMapPage,
});
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

function storyMapSearchRank(node: CreatorDNANode, needle: string) {
  const label = node.label.toLowerCase();
  const type = node.type.toLowerCase();
  const typeLabel = KIND_META[node.type].label.toLowerCase();
  const summary = node.summary.toLowerCase();
  const source = node.sourceTitle?.toLowerCase() ?? "";
  if (label === needle) return -1;
  if (label.startsWith(needle)) return 0;
  if (label.includes(needle)) return 1;
  if (type.startsWith(needle) || typeLabel.startsWith(needle)) return 2;
  if (summary.includes(needle)) return 3;
  if (source.includes(needle)) return 4;
  return null;
}

function StoryMapPage() {
  const search = Route.useSearch();
  const [rawNodes, setRawNodes] = useState<CreatorDNANode[]>([]);
  const [selected, setSelected] = useState<CreatorDNANode | null>(null);
  const [filter, setFilter] = useState<DnaKind | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 });
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!legendOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!legendRef.current?.contains(event.target as Node))
        setLegendOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLegendOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [legendOpen]);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);
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
  useEffect(() => {
    if (!rawNodes.length) return;
    if (search.node) {
      const requested = rawNodes.find((node) => node.id === search.node);
      setFilter("all");
      setQuery("");
      setSearchOpen(false);
      setSelected(requested ?? null);
      return;
    }
    setFilter(
      search.type && kinds.includes(search.type as DnaKind)
        ? (search.type as DnaKind)
        : "all",
    );
    setQuery("");
    setSearchOpen(false);
    setSelected(null);
  }, [rawNodes, search.node, search.type]);
  const visible = useMemo(
    () => rawNodes.filter((n) => filter === "all" || n.type === filter),
    [rawNodes, filter],
  );
  const edges = useMemo<GraphEdge[]>(() => {
    const result: GraphEdge[] = [];
    for (let i = 0; i < visible.length; i++)
      for (
        let j = i + 1;
        j < visible.length &&
        result.length < Math.min(Math.round(visible.length * 1.25), 60);
        j++
      ) {
        const sameContent =
          visible[i]!.contentId &&
          visible[i]!.contentId === visible[j]!.contentId;
        const sameSource =
          visible[i]!.sourceTitle &&
          visible[i]!.sourceTitle === visible[j]!.sourceTitle;
        if (sameContent || sameSource)
          result.push({ from: visible[i]!.id, to: visible[j]!.id });
      }
    return result;
  }, [visible]);
  const graphNodes = useMemo(() => {
    const degrees = new Map<string, number>();
    for (const edge of edges) {
      degrees.set(edge.from, (degrees.get(edge.from) ?? 0) + 1);
      degrees.set(edge.to, (degrees.get(edge.to) ?? 0) + 1);
    }
    const positions = forceLayout(visible, edges, graphSize);
    if (visible.length === 1) {
      const node = visible[0]!;
      return [
        {
          id: node.id,
          label: node.label,
          kind: node.type,
          summary: node.summary,
          size: Math.max(
            1,
            Math.min(1.35, 0.9 + (degrees.get(node.id) ?? 0) * 0.08),
          ),
          x: 50,
          y: 50,
        } satisfies GraphNode,
      ];
    }
    return visible.map((node, index) => {
      const position = positions[index] ?? { x: 50, y: 50 };
      return {
        id: node.id,
        label: node.label,
        kind: node.type,
        summary: node.summary,
        size: Math.max(
          0.72,
          Math.min(1.5, 0.8 + (degrees.get(node.id) ?? 0) * 0.12),
        ),
        x: position.x,
        y: position.y,
      } satisfies GraphNode;
    });
  }, [edges, graphSize, visible]);
  const searchMatches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return visible
      .map((node) => ({ node, rank: storyMapSearchRank(node, needle) }))
      .filter(
        (match): match is { node: CreatorDNANode; rank: number } =>
          match.rank !== null,
      )
      .sort(
        (a, b) => a.rank - b.rank || a.node.label.localeCompare(b.node.label),
      )
      .slice(0, 8)
      .map(({ node }) => node);
  }, [query, visible]);
  useEffect(() => {
    if (selected && filter !== "all" && selected.type !== filter)
      setSelected(null);
  }, [filter, selected]);

  function changeFilter(nextFilter: DnaKind | "all") {
    setFilter(nextFilter);
    setQuery("");
    setSearchOpen(false);
    setActiveSearchIndex(0);
    setSelected((current) =>
      !current || nextFilter === "all" || current.type === nextFilter
        ? current
        : null,
    );
  }

  function selectSearchResult(node: CreatorDNANode) {
    setSelected(node);
    setQuery("");
    setSearchOpen(false);
    setActiveSearchIndex(0);
  }
  if (error)
    return <Panel className="p-8 text-sm text-destructive">{error}</Panel>;
  if (loading)
    return (
      <Panel className="telemetry-grid p-8">
        <div className="flex items-center gap-2 font-mono text-xs text-aqua-accent">
          <DataPulse color="aqua" /> MEMORY GRAPH / LOADING
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="telemetry-skeleton h-[28rem] rounded-xl border border-border" />
          <div className="space-y-3">
            <div className="telemetry-skeleton h-24 rounded-xl border border-border" />
            <div className="telemetry-skeleton h-36 rounded-xl border border-border" />
          </div>
        </div>
      </Panel>
    );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(30rem,38rem)] xl:items-start">
        <PageHeader
          title="Your Story Map"
          subtitle="A living visualization of your ideas, beliefs, experiences, and evolution."
        />
        {rawNodes.length > 0 ? (
          <div className="flex min-w-0 items-center gap-3 xl:pt-1">
            <div
              ref={searchBoxRef}
              className="relative min-w-0 flex-1"
              onBlur={(event) => {
                if (
                  !event.relatedTarget ||
                  !event.currentTarget.contains(event.relatedTarget as Node)
                )
                  setSearchOpen(false);
              }}
            >
              <label className="story-map-search-control flex h-12 min-w-0 items-center gap-3 rounded-full border border-border bg-card px-5 text-sm text-muted-foreground shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
                <Search className="h-4 w-4 shrink-0 text-primary" />
                <input
                  value={query}
                  role="combobox"
                  aria-label="Search your Story Map"
                  aria-autocomplete="list"
                  aria-expanded={searchOpen && Boolean(query.trim())}
                  aria-controls="story-map-search-results"
                  aria-activedescendant={
                    searchOpen && searchMatches[activeSearchIndex]
                      ? `story-map-search-${searchMatches[activeSearchIndex]!.id}`
                      : undefined
                  }
                  onFocus={() => setSearchOpen(Boolean(query.trim()))}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(Boolean(event.target.value.trim()));
                    setActiveSearchIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setSearchOpen(false);
                      return;
                    }
                    if (!searchMatches.length) return;
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setSearchOpen(true);
                      setActiveSearchIndex(
                        (current) => (current + 1) % searchMatches.length,
                      );
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setSearchOpen(true);
                      setActiveSearchIndex(
                        (current) =>
                          (current - 1 + searchMatches.length) %
                          searchMatches.length,
                      );
                    } else if (event.key === "Enter" && searchOpen) {
                      event.preventDefault();
                      const match = searchMatches[activeSearchIndex];
                      if (match) selectSearchResult(match);
                    }
                  }}
                  placeholder="Search your story map…"
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </label>
              {searchOpen && query.trim() && searchMatches.length ? (
                <div
                  id="story-map-search-results"
                  role="listbox"
                  aria-label="Story Map search results"
                  className="search-results-enter absolute inset-x-0 top-full z-30 mt-2 max-h-[min(24rem,55dvh)] overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lift"
                >
                  {searchMatches.map((node, index) => (
                    <button
                      key={node.id}
                      id={`story-map-search-${node.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeSearchIndex}
                      onMouseEnter={() => setActiveSearchIndex(index)}
                      onClick={() => selectSearchResult(node)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-[background-color,transform] duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring ${index === activeSearchIndex ? "bg-muted" : "hover:bg-muted/70"}`}
                    >
                      <span
                        className="semantic-node-marker grid h-8 w-8 shrink-0 place-items-center rounded-full"
                        style={{
                          color: getDnaIconForeground(node.type),
                          backgroundColor: NODE_TYPE_COLORS[node.type],
                          borderColor: getDnaBorderColor(node.type),
                        }}
                      >
                        <DnaTypeIcon kind={node.type} size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-midnight">
                          {node.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          <span
                            className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em]"
                            style={{ color: NODE_TYPE_COLORS[node.type] }}
                          >
                            {KIND_META[node.type].label}
                          </span>
                          {node.sourceTitle ? ` · ${node.sourceTitle}` : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : searchOpen && query.trim() ? (
                <p
                  id="story-map-search-results"
                  role="status"
                  className="search-results-enter absolute inset-x-0 top-full z-30 mt-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground shadow-lift"
                >
                  No matches for “{query.trim()}”
                </p>
              ) : null}
            </div>
            <div className="story-map-time-control flex h-12 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-midnight shadow-sm">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>All time</span>
              <ChevronDown className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
        ) : null}
      </div>
      {rawNodes.length === 0 ? (
        <Panel className="telemetry-grid p-10 text-center">
          <NodeConstellation className="mx-auto mb-4 w-44" />
          <h2 className="text-lg font-bold text-midnight">
            Your Story Map is empty.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your story map starts with your first piece of content.
          </p>
          <a
            href="/add-content"
            className="motion-cta glow-lime mt-5 inline-flex rounded-xl bg-chartreuse px-5 py-2.5 text-sm font-bold text-[#050811] hover:bg-white"
          >
            Add Content
          </a>
        </Panel>
      ) : (
        <>
          <div className="story-map-filters -mx-1 flex flex-nowrap items-center gap-1.5 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {["all", ...kinds].map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => changeFilter(k as DnaKind | "all")}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring ${filter === k && k === "all" ? "border-primary bg-primary text-primary-foreground" : filter === k ? "text-midnight" : "border-border bg-card text-midnight hover:border-primary/40"}`}
                style={
                  filter === k && k !== "all"
                    ? {
                        borderColor: NODE_TYPE_COLORS[k as DnaKind],
                        backgroundColor: `color-mix(in srgb, ${NODE_TYPE_COLORS[k as DnaKind]} 13%, var(--card))`,
                      }
                    : undefined
                }
              >
                {k === "all" ? (
                  <Network
                    className={`h-4 w-4 ${filter === "all" ? "text-primary-foreground" : "text-primary"}`}
                    strokeWidth={1.9}
                  />
                ) : (
                  <span
                    className="semantic-node-marker grid h-5 w-5 shrink-0 place-items-center rounded-full"
                    style={{
                      color: getDnaIconForeground(k as DnaKind),
                      backgroundColor: NODE_TYPE_COLORS[k as DnaKind],
                      borderColor: getDnaBorderColor(k as DnaKind),
                    }}
                  >
                    <DnaTypeIcon kind={k as DnaKind} size={11} />
                  </span>
                )}
                <span>
                  {k === "all" ? "All" : KIND_META[k as DnaKind].plural}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 tabular-nums ${filter === k && k === "all" ? "bg-white/20" : "bg-muted text-muted-foreground"}`}
                >
                  {
                    rawNodes.filter((node) => k === "all" || node.type === k)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>
          <ExpandedPortal active={expanded}>
            <div
              role={expanded ? "dialog" : undefined}
              aria-modal={expanded || undefined}
              aria-label={expanded ? "Expanded Story Map" : undefined}
              className={
                expanded
                  ? "graph-overlay-enter fixed inset-0 z-[100] h-dvh w-screen overflow-hidden bg-background p-3 shadow-2xl sm:p-5"
                  : "grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
              }
            >
              <Panel
                className={`relative flex min-h-0 flex-col overflow-hidden p-0 ${expanded ? "h-full" : "h-[var(--story-workspace-height)]"}`}
              >
                <div className="story-map-zoom-controls absolute left-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center rounded-xl border border-border bg-card/95 p-1 shadow-card backdrop-blur">
                  <button
                    type="button"
                    aria-label="Zoom in"
                    title="Zoom in"
                    onClick={() =>
                      setZoom((value) => Math.min(1.25, value + 0.1))
                    }
                    className="story-map-control grid h-9 w-9 place-items-center rounded-lg text-midnight transition-[background-color,transform] duration-200 hover:bg-muted active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom out"
                    title="Zoom out"
                    onClick={() =>
                      setZoom((value) => Math.max(0.8, value - 0.1))
                    }
                    className="story-map-control grid h-9 w-9 place-items-center rounded-lg text-midnight transition-[background-color,transform] duration-200 hover:bg-muted active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={
                      expanded ? "Exit graph focus mode" : "Expand graph"
                    }
                    aria-expanded={expanded}
                    title={expanded ? "Collapse graph" : "Expand graph"}
                    onClick={() => setExpanded((value) => !value)}
                    className="story-map-control grid h-9 w-9 place-items-center rounded-lg text-midnight transition-[background-color,transform] duration-200 hover:bg-muted active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {expanded ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div ref={legendRef} className="absolute right-4 top-4 z-20">
                  <button
                    type="button"
                    aria-expanded={legendOpen}
                    aria-controls="story-map-legend"
                    onClick={() => setLegendOpen((open) => !open)}
                    className="story-map-control flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 text-xs font-semibold text-midnight shadow-card backdrop-blur transition-[background-color,transform] duration-200 hover:bg-muted active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ListFilter className="h-4 w-4 text-primary" /> Legend
                  </button>
                  {legendOpen ? (
                    <div
                      id="story-map-legend"
                      className="popover-enter absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-lift"
                    >
                      <GraphLegend kinds={kinds} />
                    </div>
                  ) : null}
                </div>
                {visible.length ? (
                  <div className="story-map-canvas relative flex min-h-0 flex-1 flex-col bg-background transition-colors duration-300">
                    <StoryGraph
                      nodes={graphNodes}
                      edges={edges}
                      selectedId={selected?.id ?? null}
                      onSelect={(n) =>
                        setSelected(rawNodes.find((x) => x.id === n.id) ?? null)
                      }
                      className="h-full min-h-0"
                      compact
                      zoom={zoom}
                      onResize={setGraphSize}
                    />
                  </div>
                ) : (
                  <div className="grid min-h-0 flex-1 place-items-center bg-background p-8 text-center">
                    <div>
                      <p className="text-sm font-semibold text-midnight">
                        {filter === "all"
                          ? "No nodes yet"
                          : `No ${KIND_META[filter].label.toLowerCase()} nodes yet`}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Try another filter to explore your Story Graph.
                      </p>
                    </div>
                  </div>
                )}
                <div className="story-map-status flex h-12 shrink-0 items-center justify-center gap-3 border-t border-border bg-card px-4 text-xs text-muted-foreground sm:gap-5">
                  <span className="font-semibold text-primary">
                    {visible.length} nodes
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>{edges.length} connections</span>
                  <span className="hidden h-5 w-px bg-border sm:block" />
                  <span className="hidden sm:inline">
                    Your ideas are connected.
                  </span>
                </div>
              </Panel>
              {!expanded && selected ? (
                <DetailTransition
                  node={selected}
                  close={() => setSelected(null)}
                  onSelect={setSelected}
                  edges={edges}
                  nodes={rawNodes}
                />
              ) : !expanded ? (
                <Panel className="telemetry-grid grid p-6 xl:h-[var(--story-workspace-height)] xl:place-items-center">
                  <div>
                    <NodeConstellation
                      className="mb-5 w-32 opacity-70"
                      compact
                    />
                    <p className="eyebrow">Pick a node</p>
                    <h2 className="card-title mt-3 text-midnight">
                      Inspect grounded evidence.
                    </h2>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      Select a node to inspect its evidence and connections.
                    </p>
                  </div>
                </Panel>
              ) : null}
            </div>
          </ExpandedPortal>
        </>
      )}
    </div>
  );
}

function ExpandedPortal({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return active && typeof document !== "undefined"
    ? createPortal(children, document.body)
    : children;
}

function DetailTransition({
  node,
  close,
  edges,
  nodes,
  onSelect,
}: {
  node: CreatorDNANode;
  close: () => void;
  edges: GraphEdge[];
  nodes: CreatorDNANode[];
  onSelect: (node: CreatorDNANode) => void;
}) {
  const [displayedNode, setDisplayedNode] = useState(node);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (node.id === displayedNode.id) return;
    setPhase("exit");
    const timer = window.setTimeout(() => {
      setDisplayedNode(node);
      setPhase("enter");
    }, 80);
    return () => window.clearTimeout(timer);
  }, [displayedNode.id, node]);

  const related = edges
    .filter(
      (edge) => edge.from === displayedNode.id || edge.to === displayedNode.id,
    )
    .map((edge) =>
      nodes.find(
        (candidate) =>
          candidate.id ===
          (edge.from === displayedNode.id ? edge.to : edge.from),
      ),
    )
    .filter((candidate): candidate is CreatorDNANode => Boolean(candidate))
    .slice(0, 5);

  return (
    <Detail
      node={displayedNode}
      close={close}
      related={related}
      onSelect={onSelect}
      transitionClass={
        phase === "exit" ? "detail-content-exit" : "detail-content-enter"
      }
    />
  );
}

function stableSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function forceLayout(
  nodes: CreatorDNANode[],
  edges: GraphEdge[],
  dimensions: { width: number; height: number },
) {
  if (nodes.length <= 1) return nodes.map(() => ({ x: 50, y: 50 }));
  const aspect =
    dimensions.width > 0 && dimensions.height > 0
      ? Math.max(0.75, Math.min(2.5, dimensions.width / dimensions.height))
      : 1;
  const positions = nodes.map((node) => ({
    x: 14 + stableSeed(`${node.id}:x`) * 72,
    y: 14 + stableSeed(`${node.id}:y`) * 72,
  }));
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const links = edges
    .map((edge) => [indexById.get(edge.from), indexById.get(edge.to)] as const)
    .filter(
      (link): link is readonly [number, number] =>
        link[0] !== undefined && link[1] !== undefined,
    );
  for (let iteration = 0; iteration < 70; iteration++) {
    const velocity = positions.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i]!;
        const b = positions[j]!;
        const dx = (a.x - b.x) * aspect;
        const dy = a.y - b.y;
        const distance = Math.max(2, Math.hypot(dx, dy));
        const force = Math.min(2.5, 52 / (distance * distance));
        velocity[i]!.x += (dx / distance) * (force / aspect);
        velocity[i]!.y += (dy / distance) * force;
        velocity[j]!.x -= (dx / distance) * (force / aspect);
        velocity[j]!.y -= (dy / distance) * force;
      }
    }
    for (const [aIndex, bIndex] of links) {
      const a = positions[aIndex]!;
      const b = positions[bIndex]!;
      const dx = (b.x - a.x) * aspect;
      const dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = (distance - 24) * 0.018;
      velocity[aIndex]!.x += (dx / distance) * (force / aspect);
      velocity[aIndex]!.y += (dy / distance) * force;
      velocity[bIndex]!.x -= (dx / distance) * (force / aspect);
      velocity[bIndex]!.y -= (dy / distance) * force;
    }
    for (let i = 0; i < positions.length; i++) {
      const point = positions[i]!;
      const centerForce = 0.012;
      velocity[i]!.x += (50 - point.x) * centerForce;
      velocity[i]!.y += (50 - point.y) * centerForce;
      point.x = Math.max(5, Math.min(95, point.x + velocity[i]!.x));
      point.y = Math.max(7, Math.min(93, point.y + velocity[i]!.y));
    }
  }
  return positions;
}

function Detail({
  node,
  close,
  related,
  onSelect,
  transitionClass,
}: {
  node: CreatorDNANode;
  close: () => void;
  related: CreatorDNANode[];
  onSelect: (node: CreatorDNANode) => void;
  transitionClass: string;
}) {
  return (
    <Panel
      accent={KIND_META[node.type].color}
      className={`story-detail-panel ${transitionClass} fixed inset-x-4 bottom-4 z-40 max-h-[70dvh] overflow-y-auto p-6 xl:static xl:h-[var(--story-workspace-height)] xl:max-h-none`}
    >
      <div className="flex items-start justify-between">
        <div>
          <KindBadge kind={node.type} />
          <h2 className="card-title mt-3 text-midnight">{node.label}</h2>
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
          <dd className="story-evidence-quote mt-2 rounded-xl bg-muted/60 px-4 py-3 font-display text-[0.9375rem] italic leading-relaxed text-midnight">
            “{node.evidenceQuote || "No evidence quote available."}”
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Source</dt>
          <dd className="mt-1">
            <SourceProvenance title={node.sourceTitle} date={node.sourceDate} />
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
        {related.length ? (
          <div>
            <dt className="eyebrow">Related nodes</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {related.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-[background-color,transform,border-color] duration-150 hover:translate-x-0.5 hover:bg-muted active:translate-x-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    borderColor: `color-mix(in srgb, ${NODE_TYPE_COLORS[item.type]} 40%, transparent)`,
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2 text-midnight">
                    <span
                      className="semantic-node-marker grid h-7 w-7 shrink-0 place-items-center rounded-full transition-[filter,transform] duration-150 group-hover:scale-105 group-hover:brightness-125"
                      style={{
                        color: getDnaIconForeground(item.type),
                        backgroundColor: NODE_TYPE_COLORS[item.type],
                        borderColor: getDnaBorderColor(item.type),
                      }}
                    >
                      <DnaTypeIcon kind={item.type} size={13} />
                    </span>{" "}
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span
                    className="shrink-0 transition-[filter] duration-150 group-hover:brightness-125"
                    style={{ color: NODE_TYPE_COLORS[item.type] }}
                  >
                    {KIND_META[item.type].label}
                  </span>
                </button>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </Panel>
  );
}
