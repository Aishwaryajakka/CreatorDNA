export function DnaMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 56"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M12 6C30 12 8 22 26 28C44 34 14 44 24 50"
        stroke="var(--story)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M26 6C8 14 30 20 12 28C-4 35 26 42 16 50"
        stroke="var(--experience)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="26" cy="6" r="5" fill="var(--belief)" />
      <circle cx="10" cy="15" r="5" fill="var(--theme-color)" />
      <circle cx="27" cy="26" r="4.5" fill="var(--experience)" />
      <circle cx="11" cy="38" r="5" fill="var(--story)" />
      <circle cx="24" cy="50" r="4.5" fill="var(--evolution)" />
    </svg>
  );
}

export function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <DnaMark className="h-9 w-9 shrink-0" />
      <div className="min-w-0 leading-none">
        <div
          className={`text-[1.0625rem] font-extrabold tracking-tight ${onDark ? "text-sidebar-foreground" : "text-midnight"}`}
        >
          Creator<span className="text-primary">DNA</span>
        </div>
        <div className="mt-1 text-[0.5625rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Your stories. A brighter tomorrow.
        </div>
      </div>
    </div>
  );
}
