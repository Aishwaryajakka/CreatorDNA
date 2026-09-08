import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function DataPulse({
  color = "chartreuse",
  className = "",
}: {
  color?: "chartreuse" | "aqua" | "green" | "blue" | "yellow";
  className?: string;
}) {
  const colors = {
    chartreuse: "bg-chartreuse shadow-[0_0_10px_#E8F31A]",
    aqua: "bg-aqua-accent shadow-[0_0_10px_#36D6C5]",
    green: "bg-creator-green shadow-[0_0_10px_#31D158]",
    blue: "bg-primary shadow-[0_0_10px_#155EEF]",
    yellow: "bg-sun-yellow shadow-[0_0_10px_#FFD83D]",
  }[color];
  return (
    <span
      aria-hidden="true"
      className={`data-pulse inline-flex h-2 w-2 rounded-full ${colors} ${className}`}
    />
  );
}

export function CircuitCorner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`circuit-corner pointer-events-none absolute h-10 w-10 ${className}`}
    />
  );
}

export function TelemetryOrbit({
  className = "",
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 240"
      className={`telemetry-orbit pointer-events-none ${className}`}
    >
      <circle cx="120" cy="120" r="44" />
      <circle cx="120" cy="120" r="78" strokeDasharray="5 9" />
      <circle cx="120" cy="120" r="108" strokeDasharray="2 12" />
      <g className={`telemetry-orbit-node ${animated ? "is-animated" : ""}`}>
        <circle cx="120" cy="12" r="5" fill="var(--chartreuse)" />
      </g>
    </svg>
  );
}

export function SignalPath({
  className = "",
  path = "M20 92 C90 12 170 172 240 72 S360 30 420 92",
}: {
  className?: string;
  path?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 440 180"
      className={`signal-path pointer-events-none ${className}`}
    >
      <path d={path} fill="none" vectorEffect="non-scaling-stroke" />
      <circle className="signal-path-dot" r="3.5" fill="var(--aqua-accent)">
        <animateMotion dur="4.8s" path={path} repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function DNAStrandGraphic({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 900"
      className={`dna-strand-graphic pointer-events-none ${className}`}
    >
      <path d="M70 220 C210 90 330 260 520 120" />
      <path d="M55 700 C210 540 370 760 570 610" />
      <path d="M110 350 C240 470 350 330 505 430" />
      <circle cx="70" cy="220" r="9" fill="var(--chartreuse)" />
      <circle cx="520" cy="120" r="12" fill="var(--creator-green)" />
      <circle cx="55" cy="700" r="10" fill="var(--sun-yellow)" />
      <circle cx="570" cy="610" r="8" fill="var(--aqua-accent)" />
      <circle cx="505" cy="430" r="7" fill="var(--creator-green)" />
    </svg>
  );
}

export function NodeConstellation({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 120"
      className={`node-constellation ${className}`}
    >
      <path d="M22 77 Q62 20 108 60 T198 39" />
      <path d="M22 77 Q83 112 142 79 L198 39" />
      <circle cx="22" cy="77" r={compact ? 5 : 7} fill="var(--story)" />
      <circle
        className="node-pulse node-pulse-delay-1"
        cx="108"
        cy="60"
        r={compact ? 6 : 9}
        fill="var(--chartreuse)"
      />
      <circle
        cx="142"
        cy="79"
        r={compact ? 4 : 6}
        fill="var(--creator-green)"
      />
      <circle
        className="node-pulse node-pulse-delay-2"
        cx="198"
        cy="39"
        r={compact ? 5 : 7}
        fill="var(--aqua-accent)"
      />
    </svg>
  );
}
