import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { DnaTypeIcon } from "@/components/DnaTypeIcon";
import {
  KIND_META,
  NODE_TYPE_COLORS,
  type LegacyDnaKind,
  type DnaKind,
  type GraphEdge,
  type GraphNode,
} from "@/lib/creator-dna";
import { getDnaBorderColor, getDnaIconForeground } from "@/lib/dna-iconography";

function colorFor(kind: GraphNode["kind"]) {
  if (kind === "me") return "var(--midnight)";
  return NODE_TYPE_COLORS[kind as DnaKind] ?? "#94A3B8";
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

function stableMotionDelay(value: string, range = 240) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % range;
}

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId?: string | null;
  onSelect?: (node: GraphNode) => void;
  className?: string;
  compact?: boolean;
  zoom?: number;
  onResize?: (size: { width: number; height: number }) => void;
};

export function StoryGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  className = "",
  zoom = 1,
  onResize,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const graphRef = useRef<HTMLDivElement>(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<{
    node: GraphNode;
    x: number;
    y: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 256, height: 72 });
  useLayoutEffect(() => {
    if (!hovered || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    setTooltipSize({ width: rect.width, height: rect.height });
  }, [hovered]);
  useLayoutEffect(() => {
    const element = graphRef.current;
    if (!element || !onResize || typeof ResizeObserver === "undefined") return;

    const publishSize = (width: number, height: number) => {
      const next = { width: Math.round(width), height: Math.round(height) };
      if (
        next.width === lastSizeRef.current.width &&
        next.height === lastSizeRef.current.height
      )
        return;
      lastSizeRef.current = next;
      onResize(next);
    };
    const rect = element.getBoundingClientRect();
    publishSize(rect.width, rect.height);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) publishSize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onResize]);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
  }
  const neighbors = new Set<string>();
  const focusId = selectedId ?? hovered?.node.id ?? null;
  if (focusId) {
    for (const edge of edges) {
      if (edge.from === focusId) neighbors.add(edge.to);
      if (edge.to === focusId) neighbors.add(edge.from);
    }
  }

  return (
    <div
      ref={graphRef}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0 origin-center transition-transform duration-200"
        style={{ transform: `scale(${zoom})` }}
      >
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
            className="story-graph-grid"
            width="100"
            height="100"
            fill={`url(#dots-${gid})`}
          />
          {edges.map((edge, index) => {
            const from = byId.get(edge.from);
            const to = byId.get(edge.to);
            if (!from || !to) return null;
            const active =
              !!focusId && (edge.from === focusId || edge.to === focusId);
            return (
              <path
                key={index}
                d={curve(from, to)}
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke={
                  active ? "var(--action-accent)" : "var(--muted-foreground)"
                }
                strokeOpacity={
                  active
                    ? selectedId
                      ? 0.9
                      : 0.82
                    : focusId
                      ? "var(--graph-edge-dim)"
                      : "var(--graph-edge-rest)"
                }
                strokeWidth={active ? 2.5 : 1.6}
                strokeLinecap="round"
                className={`story-graph-edge-enter ${selectedId && active ? "story-edge-flow" : ""}`}
                style={
                  {
                    "--edge-delay": `${Math.min(index, 12) * 18}ms`,
                  } as CSSProperties
                }
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const isMe = node.kind === "me";
          const color = colorFor(node.kind);
          const selected = node.id === selectedId;
          const hoveredNode = node.id === hovered?.node.id;
          const dim = selectedId
            ? !isMe && !selected && !neighbors.has(node.id)
            : hovered
              ? node.id !== hovered.node.id && !neighbors.has(node.id)
              : false;
          const interactive = !!onSelect;
          const Tag = interactive ? "button" : "div";
          const connected = degree.get(node.id) ?? 0;
          const size = isMe
            ? 64
            : connected >= 3
              ? 40
              : connected >= 1
                ? 32
                : 24;
          return (
            <Tag
              key={node.id}
              {...(interactive
                ? {
                    type: "button" as const,
                    "aria-pressed": selected,
                    onClick: () => {
                      setHovered(null);
                      onSelect?.(node);
                    },
                  }
                : {})}
              aria-label={`${KIND_META[node.kind as DnaKind]?.label ?? "DNA node"}: ${node.label}`}
              onFocus={(event) =>
                setHovered({
                  node,
                  x: event.currentTarget.getBoundingClientRect().right,
                  y: event.currentTarget.getBoundingClientRect().top,
                })
              }
              onBlur={() => setHovered(null)}
              onMouseEnter={(event) => {
                if (!interactive) return;
                setHovered({ node, x: event.clientX, y: event.clientY });
              }}
              onMouseMove={(event) => {
                if (hovered?.node.id === node.id)
                  setHovered({ node, x: event.clientX, y: event.clientY });
              }}
              onMouseLeave={() => setHovered(null)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${interactive ? "cursor-pointer" : ""} transition-[opacity,transform] duration-150 hover:scale-110 active:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected || hoveredNode ? "scale-110" : focusId && neighbors.has(node.id) ? "scale-[1.03]" : ""} ${dim ? (selectedId ? "opacity-45" : "opacity-60") : "opacity-100"}`}
            >
              {isMe ? (
                <span
                  className="story-graph-node-enter grid h-16 w-16 place-items-center rounded-full bg-midnight text-xs font-bold tracking-[0.18em] text-background shadow-lift"
                  style={
                    {
                      "--node-delay": `${stableMotionDelay(node.id)}ms`,
                    } as CSSProperties
                  }
                >
                  ME
                </span>
              ) : (
                <span
                  className="semantic-node-marker story-graph-semantic-node story-graph-node-enter relative grid place-items-center rounded-full transition-[box-shadow,transform]"
                  data-selected={selected || undefined}
                  data-hovered={hoveredNode || undefined}
                  style={
                    {
                      width: size,
                      height: size,
                      color: getDnaIconForeground(node.kind as LegacyDnaKind),
                      backgroundColor: color,
                      borderColor: getDnaBorderColor(
                        node.kind as LegacyDnaKind,
                      ),
                      "--semantic-color": color,
                      "--semantic-border": getDnaBorderColor(
                        node.kind as LegacyDnaKind,
                      ),
                      "--node-delay": `${stableMotionDelay(node.id)}ms`,
                    } as CSSProperties
                  }
                >
                  <span
                    className="story-node-breathe"
                    style={
                      {
                        "--breathe-duration": `${7 + stableMotionDelay(`${node.id}:duration`, 35) / 10}s`,
                        "--breathe-delay": `-${stableMotionDelay(`${node.id}:delay`, 60) / 10}s`,
                      } as CSSProperties
                    }
                  >
                    <DnaTypeIcon
                      kind={node.kind as DnaKind}
                      size={size <= 24 ? 12 : size <= 32 ? 15 : 18}
                    />
                  </span>
                </span>
              )}
            </Tag>
          );
        })}
      </div>
      {hovered &&
      hovered.node.id !== selectedId &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              ref={tooltipRef}
              className="graph-tooltip-enter pointer-events-none fixed z-[100] w-64 rounded-xl border border-white/10 bg-midnight px-3.5 py-3 text-left text-white shadow-2xl"
              style={(() => {
                const { width, height } = tooltipSize;
                const left =
                  hovered.x + 18 + width <= window.innerWidth
                    ? hovered.x + 18
                    : hovered.x - width - 18;
                const top =
                  hovered.y - height - 18 >= 12
                    ? hovered.y - height - 18
                    : hovered.y + 18;
                return {
                  left: Math.max(
                    12,
                    Math.min(left, window.innerWidth - width - 12),
                  ),
                  top: Math.max(
                    12,
                    Math.min(top, window.innerHeight - height - 12),
                  ),
                };
              })()}
            >
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-experience">
                {KIND_META[hovered.node.kind as DnaKind]?.label ?? "DNA node"}
              </p>
              <p className="mt-1 font-bold">{hovered.node.label}</p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function GraphLegend({ kinds }: { kinds: LegacyDnaKind[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {kinds.map((kind) => (
        <span
          key={kind}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
        >
          <span
            className="semantic-node-marker grid h-6 w-6 place-items-center rounded-full"
            style={{
              color: getDnaIconForeground(kind),
              backgroundColor: KIND_META[kind].color,
              borderColor: getDnaBorderColor(kind),
            }}
          >
            <DnaTypeIcon kind={kind} size={12} />
          </span>
          {KIND_META[kind].plural}
        </span>
      ))}
    </div>
  );
}
