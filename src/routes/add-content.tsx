import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud, Check, Loader2 } from "lucide-react";
import { KindBadge, PageHeader, Panel, SourceChip } from "@/components/dna-ui";
import { KIND_META, mockExtraction, platforms } from "@/lib/creator-dna";

export const Route = createFileRoute("/add-content")({
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
          "Paste or upload past content and see the DNA extracted from it.",
      },
    ],
  }),
  component: AddContent,
});

function AddContent() {
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);

  function analyze() {
    setState("working");
    window.setTimeout(() => setState("done"), 1100);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Build my DNA"
        title="Build your Creator DNA"
        subtitle="Add content you've already created. We'll identify the stories, beliefs, themes and experiences that make your perspective yours."
      />

      <div className="flex gap-2">
        {(
          [
            ["paste", "Paste Content"],
            ["upload", "Upload"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === key
                ? "bg-midnight text-background"
                : "border border-border bg-card text-muted-foreground hover:text-midnight"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <Panel className="p-6 sm:p-8">
          <textarea
            rows={9}
            placeholder="Paste a LinkedIn post, newsletter, transcript, script, or other content..."
            className="w-full resize-none rounded-xl border border-input bg-background p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
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
                className="w-full bg-transparent text-sm text-midnight outline-none"
              />
            </Field>
            <Field label="Platform / source">
              <select className="w-full bg-transparent text-sm text-midnight outline-none">
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
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {state === "working" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Analyze Content
          </button>
        </Panel>
      ) : (
        <Panel className="p-6 sm:p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              analyze();
            }}
            className={`grid place-items-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-input bg-background"
            }`}
          >
            <UploadCloud className="h-10 w-10 text-primary" />
            <p className="mt-4 text-sm font-semibold text-midnight">
              Drag transcripts and documents here
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              TXT · PDF · DOCX · transcript files
            </p>
            <button
              type="button"
              onClick={analyze}
              className="mt-6 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-midnight hover:bg-muted"
            >
              Browse files
            </button>
          </div>
        </Panel>
      )}

      {state === "done" ? (
        <Panel accent="var(--theme-color)" className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-theme">
              <Check className="h-3.5 w-3.5 text-midnight" />
            </span>
            <h2 className="text-lg font-bold text-midnight">DNA extracted</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Every insight below stays linked to the content it came from.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {mockExtraction.groups.map((g) => (
              <div
                key={g.kind}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <KindBadge kind={g.kind} label={KIND_META[g.kind].plural} />
                <ul className="mt-4 space-y-3">
                  {g.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <p className="text-sm font-semibold text-midnight">
                        {item}
                      </p>
                      <div className="mt-2.5">
                        <SourceChip>
                          {mockExtraction.source.label} ·{" "}
                          {mockExtraction.source.platform} ·{" "}
                          {mockExtraction.source.date}
                        </SourceChip>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

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
