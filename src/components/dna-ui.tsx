import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { KIND_META, type LegacyDnaKind } from "@/lib/creator-dna";

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
        <h1 className="text-3xl font-extrabold text-midnight sm:text-4xl">
          {title}
        </h1>
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
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-midnight">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {label ?? meta.label}
    </span>
  );
}

export function SourceChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[0.6875rem] font-medium text-muted-foreground">
      <FileText className="h-3 w-3 shrink-0" />
      {children}
    </span>
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
      className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-card ${className}`}
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

export function EvidenceNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-theme" />
      {children}
    </p>
  );
}
