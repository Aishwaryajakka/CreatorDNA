import type { ReactNode } from "react";
import {
  AtSign,
  ExternalLink,
  FileText,
  Linkedin,
  UserRound,
  Youtube,
} from "lucide-react";
import { DnaTypeIcon } from "@/components/DnaTypeIcon";
import {
  KIND_META,
  NODE_TYPE_COLORS,
  type DnaKind,
  type LegacyDnaKind,
} from "@/lib/creator-dna";
import { getDnaBorderColor, getDnaIconForeground } from "@/lib/dna-iconography";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="product-page-title text-midnight">{title}</h1>
        {subtitle ? (
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function KindBadge({
  kind,
  label,
}: {
  kind: LegacyDnaKind;
  label?: string;
}) {
  const meta = KIND_META[kind];
  return (
    <span className="metadata-label inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-2.5 py-1 text-midnight">
      <span
        className="semantic-node-marker grid h-5 w-5 place-items-center rounded-full"
        style={{
          color: getDnaIconForeground(kind),
          backgroundColor: NODE_TYPE_COLORS[kind as DnaKind] ?? meta.color,
          borderColor: getDnaBorderColor(kind),
        }}
      >
        <DnaTypeIcon kind={kind} size={11} />
      </span>
      {label ?? meta.label}
    </span>
  );
}

export function SourceChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6875rem] font-medium text-muted-foreground">
      <FileText className="h-3 w-3 shrink-0" />
      {children}
    </span>
  );
}

export function SourceProvenance({
  title,
  platform,
  date,
  url,
}: {
  title?: string | null | undefined;
  platform?: string | null | undefined;
  date?: string | null | undefined;
  url?: string | null | undefined;
}) {
  const isFoundation = title === "Creator Foundation";
  const source = platform || "Manual";
  const Icon = isFoundation
    ? UserRound
    : source.toLowerCase() === "youtube"
      ? Youtube
      : source.toLowerCase() === "linkedin"
        ? Linkedin
        : source.toLowerCase() === "x"
          ? AtSign
          : FileText;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {isFoundation ? (
        <>
          <span className="font-semibold text-midnight">
            Creator Foundation
          </span>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Profile source
          </span>
        </>
      ) : url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-midnight hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {title || source}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="font-semibold text-midnight">{title || source}</span>
      )}
      {!isFoundation ? <span>{source}</span> : null}
      {date ? (
        <span>
          · {isFoundation ? "Profile updated " : ""}
          {new Date(date).toLocaleDateString()}
        </span>
      ) : null}
    </div>
  );
}

export function Panel({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <section
      className={`telemetry-edge telemetry-card relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card transition-[background-color,border-color,box-shadow] duration-200 ${className}`}
    >
      {accent ? (
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: accent }}
        />
      ) : null}
      {children}
    </section>
  );
}

export function TelemetryDeck({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`telemetry-edge telemetry-card relative overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card ${className}`}
    >
      {children}
    </div>
  );
}

export function EvidenceNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-theme" />
      {children}
    </p>
  );
}
