import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { KindBadge, PageHeader, Panel } from "@/components/dna-ui";
import { KIND_META, platforms } from "@/lib/creator-dna";
import type { ExtractedCreatorDNA } from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";
import { DataPulse, DNAStrandGraphic } from "@/components/Motion";

export const Route = createFileRoute("/add-content")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { platform?: "linkedin" | "x" } =>
    search["platform"] === "linkedin" || search["platform"] === "x"
      ? { platform: search["platform"] }
      : {},
  head: () => ({
    meta: [
      { title: "Build your Creator DNA — Add content" },
      {
        name: "description",
        content:
          "Add content you've already created and Creator DNA extracts the stories, beliefs, themes and experiences behind it.",
      },
      { property: "og:title", content: "Build your Creator DNA" },
      {
        property: "og:description",
        content:
          "Paste past content and see the grounded DNA extracted from it.",
      },
    ],
  }),
  component: AddContent,
});

function AddContent() {
  const search = Route.useSearch();
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [platform, setPlatform] = useState(
    search.platform === "linkedin"
      ? "LinkedIn"
      : search.platform === "x"
        ? "X"
        : (platforms[0] ?? ""),
  );
  const [publishedAt, setPublishedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestionResponse | null>(null);

  async function analyze() {
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    if (!rawText.trim()) {
      setError("Please paste some creator content.");
      return;
    }
    if (publishedAt && Number.isNaN(Date.parse(publishedAt))) {
      setError("That published date is invalid.");
      return;
    }

    setError(null);
    setResult(null);
    setState("working");
    try {
      const response = await authenticatedFetch("/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          platform: platform || null,
          publishedAt: publishedAt || null,
          rawText: rawText.trim(),
        }),
      });
      const payload = (await response.json()) as
        IngestionResponse | ErrorResponse;
      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : "Unable to save this content.",
        );
      }
      setResult(payload);
      setState("done");
    } catch (requestError) {
      setState("idle");
      setError(
        requestError instanceof TypeError
          ? "Unable to reach Creator DNA. Please try again."
          : requestError instanceof Error
            ? requestError.message
            : "Unable to save this content. Please try again.",
      );
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Build my DNA"
        title="Build your Creator DNA"
        subtitle="Add content you've already created. We'll identify the stories, beliefs, themes and experiences that make your perspective yours."
      />

      <div className="memory-intro telemetry-grid rounded-xl border border-border bg-card px-6 py-5 sm:px-8">
        <p className="eyebrow flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-theme shadow-[0_0_12px_#31D158]" />
          Build from your history
        </p>
        <h2 className="display-title mt-2 text-2xl text-midnight sm:text-3xl">
          Turn one piece of content into lasting context.
        </h2>
      </div>

      <div className="flex">
        <span className="ingestion-label rounded-lg border border-aqua-accent/40 bg-aqua-accent/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide text-aqua-accent">
          Manual content ingestion
        </span>
      </div>

      <Panel accent="var(--theme-color)" className="memory-composer p-6 sm:p-8">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={9}
          placeholder="Paste a LinkedIn post, newsletter, transcript, script, or other content..."
          className="memory-textarea w-full resize-none rounded-xl border border-input bg-background p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Content title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Why I left consulting"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full bg-transparent text-sm text-midnight outline-none"
            />
          </Field>
          <Field label="Platform / source">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-transparent text-sm text-midnight outline-none"
            >
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
              <option>Other</option>
            </select>
          </Field>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={state === "working"}
          aria-busy={state === "working"}
          className="motion-cta glow-lime mt-6 inline-flex items-center gap-2 rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811] hover:bg-white"
        >
          {state === "working" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {state === "working" ? "Analyzing content..." : "Analyze Content"}
        </button>
      </Panel>

      {state === "working" ? <ExtractionProgress /> : null}

      {state === "done" && result ? (
        <Panel accent="var(--theme-color)" className="result-reveal p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-theme">
              <Check className="h-3.5 w-3.5 text-midnight" />
            </span>
            <h2 className="text-lg font-bold text-midnight">DNA extracted</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            “{result.contentItem.title}” was added to Creator DNA with{" "}
            {result.savedNodeCount} DNA nodes.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {DNA_GROUPS.map((g) => {
              const items = result.extractedDNA[g.key];
              return (
                <div
                  key={g.key}
                  className="rounded-2xl border border-border bg-background p-5"
                >
                  <KindBadge kind={g.kind} label={KIND_META[g.kind].plural} />
                  <ul className="mt-4 space-y-3">
                    {items.length ? (
                      items.map((item) => (
                        <li
                          key={`${item.label}-${item.evidenceQuote}`}
                          className="rounded-xl border border-border bg-card p-4"
                        >
                          <p className="text-sm font-semibold text-midnight">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {item.summary}
                          </p>
                          <blockquote className="mt-3 rounded-lg border-l-2 border-primary bg-muted/60 px-3 py-2 text-xs italic leading-relaxed text-muted-foreground">
                            “{item.evidenceQuote}”
                          </blockquote>
                          <p className="mt-2 text-xs font-semibold text-muted-foreground">
                            Confidence: {Math.round(item.confidence * 100)}%
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        None detected.
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}
      {error && state !== "working" && state !== "done" ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function ExtractionProgress() {
  return (
    <Panel className="telemetry-grid p-6 sm:p-8" accent="var(--creator-green)">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1.2fr]">
        <div>
          <p className="eyebrow text-aqua-accent">Content received</p>
          <p className="mt-2 text-sm font-semibold text-midnight">
            Connecting source context…
          </p>
        </div>
        <div className="hidden font-mono text-aqua-accent sm:block">↓</div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-background p-4">
          <DNAStrandGraphic className="absolute inset-0 h-full w-full opacity-15" />
          <p className="relative flex items-center gap-2 font-mono text-xs text-creator-green">
            <DataPulse color="green" /> SCANNING FOR GROUNDED SIGNALS
          </p>
          <div className="relative mt-4 flex flex-wrap gap-2">
            {["Story", "Belief", "Theme", "Experience", "Lesson"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-lg border border-border bg-card/80 px-2.5 py-1 font-mono text-[0.625rem] text-muted-foreground"
                >
                  {label}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        DNA nodes appear only after the grounded extraction response is saved.
      </p>
    </Panel>
  );
}

type IngestionResponse = {
  contentItem: {
    id: string;
    title: string;
    platform: string | null;
    publishedAt: string | null;
  };
  extractedDNA: ExtractedCreatorDNA;
  savedNodeCount: number;
};

type ErrorResponse = { error: string };

const DNA_GROUPS = [
  { key: "stories", kind: "story" },
  { key: "beliefs", kind: "belief" },
  { key: "themes", kind: "theme" },
  { key: "experiences", kind: "experience" },
  { key: "lessons", kind: "lesson" },
] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-input bg-background px-4 py-3">
      <span className="eyebrow block">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
