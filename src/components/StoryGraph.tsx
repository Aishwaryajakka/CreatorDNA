import { useId } from "react";
import {
  KIND_META,
  type LegacyDnaKind,
  type DnaKind,
  type GraphEdge,
  type GraphNode,
} from "@/lib/creator-dna";

function colorFor(kind: GraphNode["kind"]) {
  if (kind === "me") return "var(--midnight)";
  return KIND_META[kind as DnaKind].color;
}

function curve(a: GraphNode, b: GraphNode) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(len * 0.18, 9);
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId?: string | null;
  onSelect?: (node: GraphNode) => void;
  className?: string;
  compact?: boolean;
};

export function StoryGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  className = "",
  compact = false,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const neighbors = new Set<string>();
  if (selectedId) {
    for (const e of edges) {
      if (e.from === selectedId) neighbors.add(e.to);
      if (e.to === selectedId) neighbors.add(e.from);
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`dots-${gid}`}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="0.5" cy="0.5" r="0.28" fill="var(--border)" />
          </pattern>
        </defs>
        <rect
          width="100"
          height="100"
          fill={`url(#dots-${gid})`}
          opacity="0.9"
        />
        {edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const active =
            !!selectedId && (e.from === selectedId || e.to === selectedId);
          return (
            <path
              key={i}
              d={curve(a, b)}
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke={
                active
                  ? colorFor(a.kind === "me" ? b.kind : a.kind)
                  : "var(--midnight)"
              }
              strokeOpacity={active ? 0.7 : selectedId ? 0.1 : 0.18}
              strokeWidth={active ? 2 : 1.25}
              strokeLinecap="round"
              className={active ? "dash-flow" : undefined}
            />
          );
        })}
      </svg>

      {nodes.map((n) => {
        const isMe = n.kind === "me";
        const color = colorFor(n.kind);
        const dim =
          !!selectedId && !isMe && n.id !== selectedId && !neighbors.has(n.id);
        const selected = n.id === selectedId;
        const interactive = !!onSelect;
        const Tag = interactive ? "button" : "div";
        return (
          <Tag
            key={n.id}
            {...(interactive
              ? { type: "button" as const, onClick: () => onSelect?.(n) }
              : {})}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${interactive ? "cursor-pointer" : ""} transition-opacity duration-300 ${dim ? "opacity-30" : "opacity-100"}`}
          >
            {isMe ? (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-midnight text-xs font-bold tracking-[0.18em] text-background shadow-lift">
                ME
              </span>
            ) : (
              <span
                className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-2 pr-3.5 shadow-card transition-shadow hover:shadow-lift"
                style={{ borderColor: selected ? color : "var(--border)" }}
              >
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  <span className="h-2 w-2 rounded-full bg-card/80" />
                </span>
                <span
                  className={`whitespace-nowrap font-semibold text-midnight ${compact ? "text-[0.6875rem]" : "text-xs"}`}
                >
                  {n.label}
                </span>
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}

export function GraphLegend({ kinds }: { kinds: LegacyDnaKind[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {kinds.map((k) => (
        <span
          key={k}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: KIND_META[k].color }}
          />
          {KIND_META[k].plural}
        </span>
      ))}
    </div>
  );
}
