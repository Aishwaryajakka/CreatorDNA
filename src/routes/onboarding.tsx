import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Youtube } from "lucide-react";
import { PageHeader, Panel } from "@/components/dna-ui";
import { authenticatedFetch } from "@/lib/supabase/client";
import { useAuthState } from "@/lib/auth-state";
import { CircuitCorner } from "@/components/Motion";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

type FoundationField = [
  key: string,
  label: string,
  hint: string,
  required: boolean,
];
type FoundationStep = {
  title: string;
  copy: string;
  fields: FoundationField[];
};

const steps: FoundationStep[] = [
  {
    title: "Who you are",
    copy: "Start with the work and subjects people know you for.",
    fields: [
      [
        "whatYouDo",
        "What do you do?",
        "Describe your work in a sentence or two.",
        true,
      ],
      [
        "mainTopics",
        "What do you talk about?",
        "The themes you return to most.",
        true,
      ],
    ],
  },
  {
    title: "Your story",
    copy: "The experiences that shaped the way you create.",
    fields: [
      ["importantExperiences", "Important experiences", "One per line", false],
      ["accomplishments", "Accomplishments", "One per line", false],
      ["failures", "Failures or setbacks", "One per line", false],
      [
        "perspectiveChanges",
        "What changed your perspective?",
        "One per line",
        false,
      ],
    ],
  },
  {
    title: "What you believe",
    copy: "Your point of view is what makes your work recognisable.",
    fields: [
      [
        "beliefs",
        "What do you strongly believe?",
        "Add 3–5 beliefs, one per line",
        true,
      ],
      ["values", "Values", "One per line", false],
      ["personality", "Personality traits", "One per line", false],
    ],
  },
  {
    title: "Where you're going",
    copy: "Give the next chapter somewhere to point.",
    fields: [
      ["expertise", "Areas of expertise", "One per line", false],
      ["goals", "Creator goals", "One per line", false],
    ],
  },
];

function Onboarding() {
  const { refresh } = useAuthState();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const current = steps[step] ?? steps[0]!;
  const body = useMemo(
    () =>
      Object.fromEntries(
        steps
          .flatMap((item) => item.fields)
          .map(([key]) => [
            key,
            ["whatYouDo", "mainTopics"].includes(key)
              ? (values[key] ?? "")
              : (values[key] ?? "")
                  .split("\n")
                  .map((value) => value.trim())
                  .filter(Boolean),
          ]),
      ),
    [values],
  );
  function next() {
    const missing = current.fields.find(
      ([key, , , required]) => required && !values[key]?.trim(),
    );
    if (missing) {
      setError(`Please add ${missing[1].toLowerCase()}.`);
      return;
    }
    setError("");
    setDirection("forward");
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }
  async function saveFoundation() {
    const missing = current.fields.find(
      ([key, , , required]) => required && !values[key]?.trim(),
    );
    if (missing) {
      setError(`Please add ${missing[1].toLowerCase()}.`);
      return;
    }
    setSaving(true);
    setError("");
    const response = await authenticatedFetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as {
      error?: string;
      issues?: Array<{ field: string; message: string }>;
    };
    setSaving(false);
    if (!response.ok) {
      const firstIssue = result.issues?.[0];
      setError(
        firstIssue
          ? `${firstIssue.field}: ${firstIssue.message}`
          : (result.error ?? "Unable to save your foundation."),
      );
      return;
    }
    await refresh();
    setStep(steps.length);
  }
  if (step === steps.length)
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <Panel accent="var(--experience)" className="p-8 text-center sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-experience text-midnight">
            <Check />
          </span>
          <p className="eyebrow mt-6 text-experience">Foundation saved</p>
          <h1 className="mt-3 text-3xl font-extrabold text-midnight">
            Your story has a starting point.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Now bring in the content that will make your Creator DNA richer over
            time.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/import"
              search={{ source: "youtube" }}
              className="motion-cta glow-lime inline-flex items-center justify-center gap-2 rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811] hover:bg-white"
            >
              <Youtube className="h-4 w-4" /> Import Content
            </Link>
            <Link
              to="/add-content"
              className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-bold text-midnight"
            >
              Add content manually
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-muted-foreground"
            >
              Go to app
            </Link>
          </div>
        </Panel>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Creator Foundation"
        title="Let's build the foundation of your Creator DNA."
        subtitle="A few minutes here gives every future idea more context. You can keep editing this foundation later."
      />
      <div
        className="flex items-center gap-2"
        aria-label={`Step ${step + 1} of ${steps.length}`}
      >
        {steps.map((item, index) => (
          <div key={item.title} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all duration-300 ${index <= step ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
            >
              {index + 1}
            </span>
            <span
              className={`hidden text-xs font-semibold sm:block ${index === step ? "text-midnight" : "text-muted-foreground"}`}
            >
              {item.title}
            </span>
            {index < steps.length - 1 ? (
              <span className="h-px flex-1 bg-border" />
            ) : null}
          </div>
        ))}
      </div>
      <Panel
        key={step}
        className={`${direction === "forward" ? "onboarding-step-enter" : "onboarding-step-back"} p-6 sm:p-8`}
      >
        <CircuitCorner className="right-4 top-4 rotate-90 opacity-35" />
        <p className="eyebrow">
          Step {step + 1} of {steps.length}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-midnight">
          {current.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{current.copy}</p>
        <div className="mt-8 space-y-5">
          {current.fields.map(([key, label, hint, required]) => (
            <label
              key={key}
              className="block text-sm font-semibold text-midnight"
            >
              {label}
              {required ? <span className="ml-1 text-primary">*</span> : null}
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {hint}
              </span>
              <textarea
                required={required}
                value={values[key] ?? ""}
                onChange={(event) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    [key]: event.target.value,
                  }))
                }
                rows={key === "whatYouDo" || key === "mainTopics" ? 4 : 3}
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm font-normal outline-none focus:border-primary"
              />
            </label>
          ))}
        </div>
        {error ? (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setDirection("back");
              setStep((value) => Math.max(0, value - 1));
            }}
            disabled={step === 0 || saving}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="motion-cta glow-lime inline-flex items-center gap-2 rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811] hover:bg-white"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void saveFoundation()}
              disabled={saving}
              className="motion-cta glow-lime inline-flex items-center gap-2 rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811] hover:bg-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save foundation"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </Panel>
      <p className="text-center text-xs text-muted-foreground">
        You can bring YouTube, LinkedIn, or X content in after your foundation
        is saved.
      </p>
    </div>
  );
}
