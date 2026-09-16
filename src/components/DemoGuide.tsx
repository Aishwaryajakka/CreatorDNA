import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";

import { DEMO_PERSONAS, useDemoMode } from "@/lib/demo-mode";
import { authenticatedFetch } from "@/lib/supabase/client";
import { useAuthState } from "@/lib/auth-state";
import { Button } from "@/components/ui/button";

type TourRoute =
  | "/"
  | "/story-map"
  | "/foundation"
  | "/brand-territories"
  | "/research"
  | "/plan";

type TourStep = {
  key: string;
  number: number;
  label: string;
  route: TourRoute;
  targetId: string | null;
  scrollBlock: ScrollLogicalPosition;
  requiredState: string;
  requiredInteraction: string | null;
  title: string;
  copy: string;
  context: string;
  primaryAction: string | null;
  canContinue: boolean;
};

type ActivationState = "locating" | "ready" | "error";

const analysisStops = [
  {
    targetId: "alignment",
    title: "What did Creator DNA find?",
    copy: (first: string) =>
      `Alignment isn't a quality score. It shows how strongly this idea connects to ${first}'s history, identity and direction.`,
    action: "Show me the tension",
  },
  {
    targetId: "watch-out",
    title: "What is worth thinking about?",
    copy: () =>
      "Watch Out surfaces tension, contradiction or repetition before you create—not a reason to abandon the idea.",
    action: "Show perspective evolution",
  },
  {
    targetId: "perspective-evolution",
    title: "Can changing your mind be authentic?",
    copy: () =>
      "Yes. Creator DNA can recognize when the change itself may be part of the story.",
    action: "Show the three directions",
  },
] as const;

function targetIsVisible(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const headerOffset = 88;
  const safeBottom = 24;
  const usableHeight = window.innerHeight - headerOffset - safeBottom;
  const visibleTop = Math.max(rect.top, headerOffset);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight - safeBottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  if (rect.height > usableHeight)
    return (
      rect.top <= window.innerHeight * 0.38 &&
      rect.bottom > headerOffset + Math.min(220, usableHeight * 0.45)
    );

  return (
    rect.top >= headerOffset - 2 &&
    rect.bottom <= window.innerHeight - safeBottom + 2 &&
    visibleHeight >= Math.min(rect.height, 120)
  );
}

function rectanglesOverlap(a: DOMRect, b: DOMRect, gap = 12) {
  return !(
    a.right + gap <= b.left ||
    a.left >= b.right + gap ||
    a.bottom + gap <= b.top ||
    a.top >= b.bottom + gap
  );
}

function guidePosition(target: HTMLElement, guide: HTMLElement): CSSProperties {
  if (window.innerWidth < 640) return {};

  const targetRect = target.getBoundingClientRect();
  const guideRect = guide.getBoundingClientRect();
  const margin = 20;
  const maxLeft = Math.max(
    margin,
    window.innerWidth - guideRect.width - margin,
  );
  const maxTop = Math.max(
    margin,
    window.innerHeight - guideRect.height - margin,
  );
  const left = margin;
  const right = maxLeft;
  const top = margin;
  const bottom = maxTop;
  const targetOnRight =
    targetRect.left + targetRect.width / 2 >= window.innerWidth / 2;
  const leftRailWidth = targetRect.left - margin * 2;
  const rightRailWidth = window.innerWidth - targetRect.right - margin * 2;
  const railTop = Math.max(
    margin,
    Math.min(window.innerHeight - guideRect.height - margin, targetRect.top),
  );

  if (targetOnRight && leftRailWidth >= 208)
    return {
      left: margin,
      right: "auto",
      top: railTop,
      bottom: "auto",
      width: Math.min(368, leftRailWidth),
    };
  if (!targetOnRight && rightRailWidth >= 208)
    return {
      left: targetRect.right + margin,
      right: "auto",
      top: railTop,
      bottom: "auto",
      width: Math.min(368, rightRailWidth),
    };
  const candidates = targetOnRight
    ? [
        { left, top: bottom },
        { left: right, top: bottom },
        { left, top },
        { left: right, top },
      ]
    : [
        { left: right, top: bottom },
        { left, top: bottom },
        { left: right, top },
        { left, top },
      ];

  const candidate =
    candidates.find(({ left: candidateLeft, top: candidateTop }) => {
      const candidateRect = new DOMRect(
        candidateLeft,
        candidateTop,
        guideRect.width,
        guideRect.height,
      );
      return !rectanglesOverlap(candidateRect, targetRect);
    }) ?? candidates[0]!;

  return {
    left: candidate.left,
    right: "auto",
    top: candidate.top,
    bottom: "auto",
  };
}

export function DemoGuide() {
  const { signOut } = useAuthState();
  const demo = useDemoMode();
  const navigate = useNavigate();
  const location = useLocation();
  const guideRef = useRef<HTMLElement>(null);
  const [guideStyle, setGuideStyle] = useState<CSSProperties>({});
  const [activation, setActivation] = useState<ActivationState>("locating");
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [settledNumber, setSettledNumber] = useState(1);
  const [retryVersion, setRetryVersion] = useState(0);
  const persona = DEMO_PERSONAS[demo.persona];
  const first = persona.name.split(" ")[0] ?? persona.name;

  const step = useMemo<TourStep>(() => {
    if (demo.completed)
      return {
        key: "completion",
        number: 8,
        label: "COMPLETE",
        route: "/plan",
        targetId: null,
        scrollBlock: "center",
        requiredState: "demo complete",
        requiredInteraction: null,
        title: "You didn't just generate content.",
        copy: demo.reshapeUsed
          ? `You used ${first}'s story to decide what comes next. Most AI starts with a prompt. Creator DNA starts with you.`
          : `You followed ${first}'s story from memory to a grounded direction. Most AI starts with a prompt. Creator DNA starts with you.`,
        context:
          "PAST CONTENT → MEMORY → CONTEXT → NEW IDEA → GROUNDED DIRECTION",
        primaryAction: null,
        canContinue: true,
      };

    if (demo.step === 0)
      return {
        key: "memory",
        number: 1,
        label: "MEMORY",
        route: "/",
        targetId: "home-graph",
        scrollBlock: "center",
        requiredState: "dashboard mounted",
        requiredInteraction: null,
        title: "What does Creator DNA remember?",
        copy: `${first} has created content for years. Creator DNA turns that history into memories it can use later.`,
        context: "CONTENT → MEMORY → CONTEXT",
        primaryAction: `See ${first}'s memories`,
        canContinue: true,
      };

    if (demo.step === 1) {
      const evidenceOpen = demo.nodeOpened;
      return {
        key: evidenceOpen ? "evidence" : "story-node",
        number: 2,
        label: "EVIDENCE",
        route: "/story-map",
        targetId: evidenceOpen ? "evidence" : "story-node",
        scrollBlock: "center",
        requiredState: evidenceOpen
          ? "evidence mounted"
          : "story graph mounted",
        requiredInteraction: evidenceOpen ? null : "open a memory",
        title: "Where did this memory come from?",
        copy: evidenceOpen
          ? "This is source-backed memory. Creator DNA can show where the memory came from."
          : `Choose the glowing memory. Creator DNA keeps the source behind what it remembers about ${first}.`,
        context: evidenceOpen ? "MEMORY → ORIGINAL SOURCE" : "TRY IT ↓",
        primaryAction: evidenceOpen ? "Who is this creator today?" : null,
        canContinue: evidenceOpen,
      };
    }

    if (demo.step === 2) {
      const future = demo.foundationFutureSeen;
      return {
        key: future ? "brand-territories" : "foundation",
        number: 3,
        label: "IDENTITY + DIRECTION",
        route: future ? "/brand-territories" : "/foundation",
        targetId: future ? "brand-territories" : "foundation",
        scrollBlock: "start",
        requiredState: future ? "territories mounted" : "foundation mounted",
        requiredInteraction: null,
        title: future
          ? `Where does ${first} want to go?`
          : `Who is ${first} today?`,
        copy: future
          ? `Brand Territories show what ${first} intentionally wants to become known for. They are direction—not proof of what ${first} has said before.`
          : `${first}'s past content shows what they've said before. Foundation tells Creator DNA how ${first} describes themselves today.`,
        context: future ? "PAST → PRESENT → FUTURE" : "PAST → PRESENT",
        primaryAction: future
          ? "See what's happening now"
          : `See where ${first} wants to go`,
        canContinue: true,
      };
    }

    if (demo.step === 3) {
      const source = demo.researchSourceSeen;
      return {
        key: source ? "research-source" : "research-result",
        number: 4,
        label: "CURRENT CONTEXT",
        route: "/research",
        targetId: source ? "research-source" : "research-result",
        scrollBlock: "center",
        requiredState: "research data mounted",
        requiredInteraction: null,
        title: source
          ? "Two different kinds of evidence"
          : "What's happening right now?",
        copy: source
          ? `Personal evidence is ${first}'s stories, beliefs and experiences. External evidence is current research from cited sources. Creator DNA keeps them separate.`
          : `Creator DNA knows ${first}'s history. Research Pulse adds current outside context related to the areas they care about.`,
        context: source
          ? "PERSONAL ≠ EXTERNAL"
          : "PERSONAL HISTORY + CURRENT CONTEXT",
        primaryAction: source ? "Now test a new idea" : "Show the real source",
        canContinue: demo.researchReady,
      };
    }

    if (demo.step === 4)
      return {
        key: "plan-input",
        number: 5,
        label: "NEW IDEA",
        route: "/plan",
        targetId: "plan-input",
        scrollBlock: "center",
        requiredState:
          demo.analysisStatus === "loading"
            ? "analysis request pending"
            : "plan input mounted",
        requiredInteraction: "real analysis succeeds",
        title:
          demo.analysisStatus === "loading"
            ? `Checking ${first}'s Creator DNA…`
            : `${first} has a new idea.`,
        copy:
          demo.analysisStatus === "loading"
            ? "Creator DNA is finding relevant memories, comparing previous beliefs, checking repetition, looking for perspective evolution, and finding grounded directions."
            : `Most AI would start writing. Creator DNA checks ${first}'s story first.`,
        context: `“${persona.idea}”`,
        primaryAction:
          demo.analysisStatus === "loading" ? null : "Analyze this idea",
        canContinue: demo.analysisStatus !== "loading",
      };

    if (demo.step === 5) {
      const stop = analysisStops[demo.resultsPhase] ?? analysisStops[0];
      return {
        key: stop.targetId,
        number: 6,
        label: "ALIGNMENT + TENSION",
        route: "/plan",
        targetId: stop.targetId,
        scrollBlock: "center",
        requiredState: "real analysis result mounted",
        requiredInteraction: null,
        title: stop.title,
        copy: stop.copy(first),
        context: stop.targetId.replaceAll("-", " ").toUpperCase(),
        primaryAction: stop.action,
        canContinue: demo.analysisStatus === "success",
      };
    }

    if (demo.step === 6) {
      const selected = demo.selectedDirection;
      return {
        key: selected === null ? "directions" : `direction-${selected}`,
        number: 7,
        label: "THREE DIRECTIONS",
        route: "/plan",
        targetId: selected === null ? "directions" : `direction-${selected}`,
        scrollBlock: "start",
        requiredState:
          selected === null ? "three directions mounted" : "direction selected",
        requiredInteraction: selected === null ? "choose one direction" : null,
        title:
          selected === null
            ? "Three ways forward."
            : "Good. Now make it more yours.",
        copy:
          selected === null
            ? `Creator DNA doesn't jump straight to writing. It gives ${first} three ways to take the idea forward, grounded in their actual history.`
            : `${first} chose Direction ${String.fromCharCode(65 + selected)}. Creator DNA can reshape that direction without forgetting the evidence behind it.`,
        context:
          selected === null ? "CHOOSE ONE DIRECTION ↓" : "✓ SELECTED DIRECTION",
        primaryAction: selected === null ? null : "Show reshape options",
        canContinue: selected !== null,
      };
    }

    return {
      key: demo.reshapeUsed ? "reshape-result" : "reshape-controls",
      number: 8,
      label: "RESHAPE",
      route: "/plan",
      targetId: demo.reshapeUsed ? "reshape-result" : "reshape-controls",
      scrollBlock: "center",
      requiredState: demo.reshapeUsed
        ? "real reshape result mounted"
        : "reshape controls mounted",
      requiredInteraction: demo.reshapeUsed ? null : "choose a reshape mode",
      title: demo.reshapeUsed
        ? "See what changed?"
        : `What should ${first} create next?`,
      copy: demo.reshapeUsed
        ? "Creator DNA reshaped the direction without throwing away the context behind it."
        : "Choose one way to reshape the selected direction.",
      context: demo.reshapeUsed
        ? "CONTEXT PRESERVED · RESHAPE COMPLETE"
        : "CHOOSE ONE REAL RESHAPE MODE ↓",
      primaryAction: demo.reshapeUsed ? "Finish demo" : null,
      canContinue: demo.reshapeUsed,
    };
  }, [demo, first, persona.idea]);

  useEffect(() => {
    if (!demo.active || demo.skipped) return;
    if (location.pathname !== step.route) void navigate({ to: step.route });
  }, [demo.active, demo.skipped, location.pathname, navigate, step.route]);

  useEffect(() => {
    if (!demo.active || demo.skipped || location.pathname !== step.route)
      return;

    setActivation("locating");
    setGuideStyle({});
    delete document.documentElement.dataset["demoTarget"];

    if (!step.targetId) {
      setSettledKey(step.key);
      setSettledNumber(step.number);
      setActivation("ready");
      return;
    }

    let cancelled = false;
    let target: HTMLElement | null = null;
    let frame = 0;
    let frameCount = 0;
    let scrolled = false;
    let resizeObserver: ResizeObserver | null = null;
    const selector = `[data-demo-target="${step.targetId}"]`;

    const settle = () => {
      if (cancelled || !target || !guideRef.current) return false;
      setGuideStyle(guidePosition(target, guideRef.current));
      if (!targetIsVisible(target)) return false;

      const targetRect = target.getBoundingClientRect();
      const guideRect = guideRef.current.getBoundingClientRect();
      if (window.innerWidth >= 640 && rectanglesOverlap(targetRect, guideRect))
        return false;

      document.documentElement.dataset["demoTarget"] = step.key;
      setSettledKey(step.key);
      setSettledNumber(step.number);
      setActivation("ready");
      return true;
    };

    const check = () => {
      if (cancelled) return;
      frameCount += 1;
      target ??= document.querySelector<HTMLElement>(selector);
      if (target && !scrolled) {
        scrolled = true;
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: step.scrollBlock,
          inline: "nearest",
        });
        resizeObserver = new ResizeObserver(() => {
          if (target && guideRef.current)
            setGuideStyle(guidePosition(target, guideRef.current));
        });
        resizeObserver.observe(target);
        if (guideRef.current) resizeObserver.observe(guideRef.current);
      }
      if (settle()) return;
      if (frameCount >= 600) {
        setActivation("error");
        return;
      }
      frame = requestAnimationFrame(check);
    };

    const keepPositioned = () => {
      if (target && guideRef.current)
        setGuideStyle(guidePosition(target, guideRef.current));
    };
    window.addEventListener("scroll", keepPositioned, { passive: true });
    window.addEventListener("resize", keepPositioned);
    frame = requestAnimationFrame(check);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", keepPositioned);
      window.removeEventListener("resize", keepPositioned);
      delete document.documentElement.dataset["demoTarget"];
    };
  }, [
    demo.active,
    demo.skipped,
    location.pathname,
    retryVersion,
    step.key,
    step.number,
    step.route,
    step.scrollBlock,
    step.targetId,
  ]);

  if (!demo.active) return null;

  const targetSettled = activation === "ready" && settledKey === step.key;
  const visibleNumber = targetSettled ? step.number : settledNumber;

  async function leave(to: "/" | "/demo" | "/login") {
    const signedOut = await signOut(
      to === "/demo"
        ? "persona-switch"
        : to === "/login"
          ? "demo-build"
          : "demo-exit",
    );
    if (!signedOut) return;
    demo.clear();
    await navigate({ to, replace: true });
  }

  function advance() {
    if (!targetSettled || !step.canContinue) return;
    if (demo.step === 2 && !demo.foundationFutureSeen) {
      demo.showFoundationFuture();
      return;
    }
    if (demo.step === 3 && !demo.researchSourceSeen) {
      demo.showResearchSource();
      return;
    }
    if (demo.step === 4) {
      document
        .querySelector<HTMLButtonElement>('[data-demo-action="plan-submit"]')
        ?.click();
      return;
    }
    if (demo.step === 5) {
      if (demo.resultsPhase < analysisStops.length - 1) demo.advanceResults();
      else demo.setStep(6);
      return;
    }
    if (demo.step === 6 && demo.selectedDirection !== null) {
      document
        .querySelector<HTMLButtonElement>(
          '[data-demo-action="reshape-toggle-selected"]',
        )
        ?.click();
      demo.setStep(7);
      return;
    }
    if (demo.step === 7 && demo.reshapeUsed) {
      demo.complete();
      return;
    }
    demo.setStep(demo.step + 1);
  }

  function goBack() {
    if (demo.step === 2 && demo.foundationFutureSeen) {
      demo.setFoundationFutureSeen(false);
      return;
    }
    if (demo.step === 3 && demo.researchSourceSeen) {
      demo.setResearchSourceSeen(false);
      return;
    }
    if (demo.step === 3) {
      demo.setFoundationFutureSeen(true);
      demo.setStep(2);
      return;
    }
    if (demo.step === 4) {
      demo.setResearchSourceSeen(true);
      demo.setStep(3);
      return;
    }
    if (demo.step === 5 && demo.resultsPhase > 0) {
      demo.setResultsPhase(demo.resultsPhase - 1);
      return;
    }
    if (demo.step === 5) {
      demo.setAnalysisStatus("idle");
      demo.setStep(4);
      return;
    }
    if (demo.step === 6) {
      demo.setResultsPhase(analysisStops.length - 1);
      demo.setStep(5);
      return;
    }
    if (demo.step === 7) {
      if (document.body.querySelector('[data-demo-target="reshape-controls"]'))
        document
          .querySelector<HTMLButtonElement>(
            '[data-demo-action="reshape-toggle-selected"]',
          )
          ?.click();
      demo.setStep(6);
      return;
    }
    demo.setStep(demo.step - 1);
  }

  const pill = (
    <details className="demo-mode-menu fixed right-3 top-3 z-[75] sm:right-5 sm:top-5">
      <summary className="demo-mode-pill flex cursor-pointer list-none items-center gap-2 rounded-full border border-aqua-accent/50 bg-obsidian-card px-4 py-2 font-mono text-[0.6875rem] font-black tracking-wider text-aqua-accent shadow-xl focus-visible:ring-2 focus-visible:ring-chartreuse [&::-webkit-details-marker]:hidden">
        <FlaskConical className="h-3.5 w-3.5" /> DEMO MODE ·{" "}
        {persona.name.toUpperCase()}
      </summary>
      <div className="mt-2 grid rounded-xl border border-obsidian-border bg-obsidian-card p-2 font-sans text-xs text-foreground shadow-2xl">
        <button
          type="button"
          onClick={() => demo.begin(demo.persona)}
          className="rounded-lg px-3 py-2 text-left hover:bg-obsidian-highlight"
        >
          Restart tour
        </button>
        <button
          type="button"
          onClick={() => void leave("/demo")}
          className="rounded-lg px-3 py-2 text-left hover:bg-obsidian-highlight"
        >
          Choose another persona
        </button>
        <button
          type="button"
          onClick={() => void leave("/")}
          className="rounded-lg px-3 py-2 text-left hover:bg-obsidian-highlight"
        >
          Exit demo
        </button>
      </div>
    </details>
  );

  if (demo.skipped) return pill;
  const locating = !targetSettled && activation !== "error";

  return (
    <>
      {pill}
      <aside
        ref={guideRef}
        style={guideStyle}
        className="demo-guide fixed inset-x-3 bottom-3 z-[70] box-border min-w-0 max-w-full max-h-[48vh] overflow-y-auto rounded-2xl border border-aqua-accent/50 bg-obsidian-card p-5 font-sans text-foreground shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:min-h-[21rem] sm:w-[23rem] sm:max-h-[calc(100vh-2.5rem)]"
        aria-label="Creator DNA guided demo"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-3 font-mono text-[0.6875rem] font-black tracking-wider">
          <span className="demo-meta text-aqua-accent">
            {targetSettled ? step.label : "DEMO TOUR"}
          </span>
          <span
            className="text-muted-foreground"
            aria-label={`Step ${visibleNumber} of 8`}
          >
            {visibleNumber} / 8
          </span>
        </div>
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-obsidian-border"
          aria-hidden="true"
        >
          <div
            className="demo-progress h-full rounded-full transition-[width] duration-300"
            style={{ width: `${(visibleNumber / 8) * 100}%` }}
          />
        </div>

        {activation === "error" ? (
          <>
            <h2 className="mt-5 font-display text-xl font-extrabold leading-tight">
              This step isn&apos;t in view yet.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The tour couldn&apos;t safely find and position the next product
              element. Your demo state is still intact.
            </p>
            <Button
              type="button"
              onClick={() => setRetryVersion((version) => version + 1)}
              variant="primary"
              size="md"
              className="demo-primary-cta mt-5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="min-w-0">Try locating it again</span>
            </Button>
          </>
        ) : locating ? (
          <div className="py-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Bringing the
              next product step into view…
            </div>
          </div>
        ) : (
          <>
            <h2 className="mt-5 font-display text-xl font-extrabold leading-tight">
              {step.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {step.copy}
            </p>
            <p className="demo-context mt-4 rounded-lg border border-obsidian-border bg-obsidian-base px-3 py-2.5 font-mono text-[0.6875rem] font-bold leading-relaxed text-aqua-accent">
              {step.context}
            </p>
            {demo.analysisStatus === "loading" && demo.step === 4 ? (
              <div className="mt-4 flex items-start gap-2 text-xs text-primary">
                <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <span>Waiting for the real analysis response…</span>
              </div>
            ) : null}
            {demo.completed ? (
              <div className="mt-5 grid gap-2">
                <Button
                  type="button"
                  onClick={() => void leave("/login")}
                  variant="primary"
                  size="md"
                  className="demo-primary-cta"
                >
                  <span className="min-w-0">Build my Creator DNA</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  onClick={() => void leave("/demo")}
                  variant="secondary"
                  size="md"
                  className="demo-secondary-cta"
                >
                  <span className="min-w-0">
                    Try {demo.persona === "jordan" ? "Maya" : "Jordan"}
                    &apos;s story →
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => void leave("/")}
                  className="py-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Return to homepage
                </button>
              </div>
            ) : (
              <div className="mt-5 grid min-w-0 gap-2">
                {step.primaryAction ? (
                  <Button
                    type="button"
                    disabled={!step.canContinue}
                    onClick={advance}
                    variant="primary"
                    size="md"
                    className="demo-primary-cta"
                  >
                    <span className="min-w-0">{step.primaryAction}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
                <button
                  type="button"
                  disabled={demo.step === 0}
                  onClick={goBack}
                  className="inline-flex min-w-0 max-w-full items-center gap-1 justify-self-start rounded-lg px-2 py-2 text-xs font-bold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:invisible"
                >
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> Back
                </button>
              </div>
            )}
            {demo.step === 1 && !demo.nodeOpened ? (
              <button
                type="button"
                onClick={() => demo.setStep(2)}
                className="mt-3 w-full text-right text-xs text-muted-foreground hover:text-foreground"
              >
                Continue without trying
              </button>
            ) : null}
            {demo.step === 7 && !demo.reshapeUsed ? (
              <button
                type="button"
                onClick={demo.complete}
                className="mt-3 w-full text-right text-xs text-muted-foreground hover:text-foreground"
              >
                Skip reshape
              </button>
            ) : null}
            {step.requiredInteraction && !step.canContinue ? (
              <p className="mt-3 text-right font-mono text-[0.625rem] text-muted-foreground">
                Waiting for you to {step.requiredInteraction}.
              </p>
            ) : null}
          </>
        )}
        {!demo.completed ? (
          <div className="mt-4 flex items-center justify-between border-t border-obsidian-border pt-3 text-[0.6875rem]">
            <button
              type="button"
              onClick={demo.skip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={() => void leave("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              Exit
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}
