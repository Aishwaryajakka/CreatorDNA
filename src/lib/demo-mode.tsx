import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_STORAGE_KEY } from "@/lib/demo-session";

export type DemoPersona = "jordan" | "maya";

type DemoState = {
  tourVersion: 2;
  persona: DemoPersona;
  step: number;
  skipped: boolean;
  nodeOpened: boolean;
  foundationFutureSeen: boolean;
  researchReady: boolean;
  researchSourceSeen: boolean;
  analysisStatus: "idle" | "loading" | "success";
  resultsPhase: number;
  selectedDirection: number | null;
  reshapeUsed: boolean;
  completed: boolean;
};

type DemoContextValue = DemoState & {
  active: boolean;
  begin: (persona: DemoPersona) => void;
  setStep: (step: number) => void;
  skip: () => void;
  markNodeOpened: () => void;
  showFoundationFuture: () => void;
  setFoundationFutureSeen: (seen: boolean) => void;
  markResearchReady: () => void;
  showResearchSource: () => void;
  setResearchSourceSeen: (seen: boolean) => void;
  setAnalysisStatus: (status: DemoState["analysisStatus"]) => void;
  advanceResults: () => void;
  setResultsPhase: (phase: number) => void;
  selectDirection: (index: number) => void;
  markReshapeUsed: () => void;
  complete: () => void;
  clear: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readDemoState(): DemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(
      sessionStorage.getItem(DEMO_STORAGE_KEY) ?? "null",
    ) as DemoState | null;
    return value && ["jordan", "maya"].includes(value.persona)
      ? {
          ...value,
          tourVersion: 2,
          nodeOpened: value.nodeOpened ?? false,
          foundationFutureSeen: value.foundationFutureSeen ?? false,
          researchReady: value.researchReady ?? false,
          researchSourceSeen: value.researchSourceSeen ?? false,
          analysisStatus: value.analysisStatus ?? "idle",
          resultsPhase: value.resultsPhase ?? 0,
          selectedDirection: value.selectedDirection ?? null,
          reshapeUsed: value.reshapeUsed ?? false,
          completed: value.completed ?? false,
        }
      : null;
  } catch {
    return null;
  }
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);

  useEffect(() => setState(readDemoState()), []);
  useEffect(() => {
    if (state) sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(DEMO_STORAGE_KEY);
  }, [state]);

  const value = useMemo<DemoContextValue>(
    () => ({
      tourVersion: 2,
      persona: state?.persona ?? "jordan",
      step: state?.step ?? 0,
      skipped: state?.skipped ?? false,
      nodeOpened: state?.nodeOpened ?? false,
      foundationFutureSeen: state?.foundationFutureSeen ?? false,
      researchReady: state?.researchReady ?? false,
      researchSourceSeen: state?.researchSourceSeen ?? false,
      analysisStatus: state?.analysisStatus ?? "idle",
      resultsPhase: state?.resultsPhase ?? 0,
      selectedDirection: state?.selectedDirection ?? null,
      reshapeUsed: state?.reshapeUsed ?? false,
      completed: state?.completed ?? false,
      active: Boolean(state),
      begin: (persona) =>
        setState({
          tourVersion: 2,
          persona,
          step: 0,
          skipped: false,
          nodeOpened: false,
          foundationFutureSeen: false,
          researchReady: false,
          researchSourceSeen: false,
          analysisStatus: "idle",
          resultsPhase: 0,
          selectedDirection: null,
          reshapeUsed: false,
          completed: false,
        }),
      setStep: (step) =>
        setState((current) =>
          current ? { ...current, step: Math.max(0, Math.min(7, step)) } : null,
        ),
      skip: () =>
        setState((current) => (current ? { ...current, skipped: true } : null)),
      markNodeOpened: () =>
        setState((current) =>
          current ? { ...current, nodeOpened: true } : null,
        ),
      showFoundationFuture: () =>
        setState((current) =>
          current ? { ...current, foundationFutureSeen: true } : null,
        ),
      setFoundationFutureSeen: (foundationFutureSeen) =>
        setState((current) =>
          current ? { ...current, foundationFutureSeen } : null,
        ),
      markResearchReady: () =>
        setState((current) =>
          current ? { ...current, researchReady: true } : null,
        ),
      showResearchSource: () =>
        setState((current) =>
          current ? { ...current, researchSourceSeen: true } : null,
        ),
      setResearchSourceSeen: (researchSourceSeen) =>
        setState((current) =>
          current ? { ...current, researchSourceSeen } : null,
        ),
      setAnalysisStatus: (analysisStatus) =>
        setState((current) =>
          current ? { ...current, analysisStatus } : null,
        ),
      advanceResults: () =>
        setState((current) =>
          current
            ? {
                ...current,
                resultsPhase: Math.min(2, current.resultsPhase + 1),
              }
            : null,
        ),
      setResultsPhase: (resultsPhase) =>
        setState((current) =>
          current
            ? {
                ...current,
                resultsPhase: Math.max(0, Math.min(2, resultsPhase)),
              }
            : null,
        ),
      selectDirection: (selectedDirection) =>
        setState((current) =>
          current ? { ...current, selectedDirection } : null,
        ),
      markReshapeUsed: () =>
        setState((current) =>
          current ? { ...current, reshapeUsed: true } : null,
        ),
      complete: () =>
        setState((current) =>
          current ? { ...current, completed: true } : null,
        ),
      clear: () => setState(null),
    }),
    [state],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

// The provider and its hook intentionally share this small state module.
// eslint-disable-next-line react-refresh/only-export-components
export function useDemoMode() {
  const value = useContext(DemoContext);
  if (!value)
    throw new Error("useDemoMode must be used inside DemoModeProvider");
  return value;
}

export const DEMO_PERSONAS = {
  jordan: {
    name: "Jordan Lee",
    label: "FOUNDER / THOUGHT LEADER",
    idea: "I want to create something about working hard as a founder.",
  },
  maya: {
    name: "Maya Chen",
    label: "AI EDUCATOR / BUILDER",
    idea: "I want to create something about AI replacing teachers.",
  },
} as const;
