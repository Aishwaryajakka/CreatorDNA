import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dna-ui";
import { Plus, X } from "lucide-react";
import { NODE_TYPE_COLORS, type DnaKind } from "@/lib/creator-dna";
import { DnaTypeIcon } from "@/components/DnaTypeIcon";
import { getDnaIconForeground } from "@/lib/dna-iconography";
import { authenticatedFetch } from "@/lib/supabase/client";
import {
  CreatorFoundationSchema,
  type CreatorFoundation,
} from "@/lib/creator-dna/validation";

export const Route = createFileRoute("/foundation")({
  component: FoundationPage,
});

const fields: Array<[keyof CreatorFoundation, string, string, boolean]> = [
  ["whatYouDo", "What you do", "Describe your work.", true],
  ["mainTopics", "Main topics", "The themes you return to.", true],
  ["importantExperiences", "Important experiences", "One per line.", false],
  ["accomplishments", "Accomplishments", "One per line.", false],
  ["failures", "Failures or setbacks", "One per line.", false],
  ["perspectiveChanges", "Perspective changes", "One per line.", false],
  ["beliefs", "Beliefs", "One per line.", true],
  ["values", "Values", "One per line.", false],
  ["personality", "Personality", "One per line.", false],
  ["expertise", "Expertise", "One per line.", false],
  ["goals", "Goals", "One per line.", false],
];

const tabs = [
  {
    id: "identity",
    kind: "identity" as DnaKind,
    label: "Identity",
    keys: ["whatYouDo", "mainTopics", "expertise", "personality"] as const,
    color: NODE_TYPE_COLORS.identity,
  },
  {
    id: "story",
    kind: "experience" as DnaKind,
    label: "Story",
    keys: [
      "importantExperiences",
      "accomplishments",
      "failures",
      "perspectiveChanges",
    ] as const,
    color: NODE_TYPE_COLORS.experience,
  },
  {
    id: "beliefs",
    kind: "belief" as DnaKind,
    label: "Beliefs & Values",
    keys: ["beliefs", "values"] as const,
    color: NODE_TYPE_COLORS.belief,
  },
  {
    id: "direction",
    kind: "goal" as DnaKind,
    label: "Direction",
    keys: ["goals"] as const,
    color: NODE_TYPE_COLORS.goal,
  },
];

const listKeys = new Set<keyof CreatorFoundation>([
  "mainTopics",
  "importantExperiences",
  "accomplishments",
  "failures",
  "perspectiveChanges",
  "beliefs",
  "values",
  "personality",
  "expertise",
  "goals",
]);

function FoundationPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Loading…");
  const [activeTab, setActiveTab] = useState("identity");
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    void authenticatedFetch("/api/foundation").then(async (response) => {
      const data = (await response.json()) as {
        foundation?: CreatorFoundation;
      };
      if (data.foundation)
        setForm(
          Object.fromEntries(
            fields.map(([key]) => [
              key,
              Array.isArray(data.foundation![key])
                ? data.foundation![key].join("\n")
                : data.foundation![key],
            ]),
          ),
        );
      setStatus("");
    });
  }, []);
  async function save() {
    const input = Object.fromEntries(
      fields.map(([key, , , required]) => [
        key,
        required
          ? (form[key] ?? "")
          : (form[key] ?? "")
              .split("\n")
              .map((v) => v.trim())
              .filter(Boolean),
      ]),
    );
    const parsed = CreatorFoundationSchema.safeParse(input);
    if (!parsed.success) {
      setStatus("Please complete the required fields.");
      return;
    }
    setStatus("Saving…");
    const response = await authenticatedFetch("/api/foundation", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (response.ok) {
      setStatus("Saved ✓");
      setEditing(false);
    } else setStatus("Unable to save foundation.");
  }
  const tab = tabs.find((item) => item.id === activeTab) ?? tabs[0]!;
  const visibleFields = fields.filter(([key]) =>
    (tab.keys as readonly string[]).includes(key),
  );
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My Foundation"
        title="The context behind your content."
        subtitle="Keep the foundation of your Creator DNA current. These answers stay editable and continue grounding your Story Map."
      />
      <Panel className="overflow-hidden" accent={tab.color}>
        <div
          role="tablist"
          aria-label="Foundation sections"
          className="flex overflow-x-auto border-b border-border bg-muted/30 p-2"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${activeTab === item.id ? "bg-card text-midnight shadow-card" : "text-muted-foreground hover:text-midnight"}`}
            >
              <span
                className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full"
                style={{
                  color: getDnaIconForeground(item.kind),
                  backgroundColor: item.color,
                }}
              >
                <DnaTypeIcon kind={item.kind} size={12} />
              </span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{
                color: getDnaIconForeground(tab.kind),
                backgroundColor: tab.color,
              }}
            >
              <DnaTypeIcon kind={tab.kind} size={17} />
            </span>
            <div>
              <p className="text-lg font-bold text-midnight">{tab.label}</p>
              <p className="text-sm text-muted-foreground">
                Keep this part of your creator context current.
              </p>
              {tab.id === "beliefs" ? (
                <p className="mt-1 text-xs font-semibold text-primary">
                  {
                    (form["beliefs"] ?? "")
                      .split("\n")
                      .filter((value) => value.trim()).length
                  }{" "}
                  / 5 beliefs
                </p>
              ) : null}
            </div>
          </div>
          {editing ? (
            <div
              key="foundation-edit"
              className="detail-content-enter mx-auto max-w-3xl space-y-5"
            >
              {visibleFields.map(([key, label, hint, required]) =>
                listKeys.has(key) ? (
                  <ListField
                    key={key}
                    label={label}
                    hint={hint}
                    value={form[key] ?? ""}
                    max={key === "beliefs" ? 5 : undefined}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, [key]: value }))
                    }
                  />
                ) : (
                  <label
                    key={key}
                    className="block font-mono text-xs font-semibold uppercase tracking-wide text-midnight"
                  >
                    {label}
                    {required ? (
                      <span className="ml-1 text-primary">*</span>
                    ) : null}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {hint}
                    </span>
                    <textarea
                      rows={4}
                      value={form[key] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 font-sans text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
                    />
                  </label>
                ),
              )}
              <div className="sticky bottom-4 mt-8 flex items-center justify-end gap-4 rounded-xl border border-border bg-card/95 p-3 backdrop-blur">
                <span
                  className={`text-sm ${status.startsWith("Saved") ? "saved-pulse text-creator-green" : "text-muted-foreground"}`}
                >
                  {status}
                </span>
                <button
                  type="button"
                  onClick={() => void save()}
                  className="motion-cta glow-lime rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811]"
                >
                  Save changes
                </button>
              </div>
            </div>
          ) : (
            <div
              key="foundation-read"
              className="detail-content-enter mx-auto max-w-3xl"
            >
              <ReadMode fields={visibleFields} form={form} />
              <div className="mt-8 flex items-center justify-end gap-4 border-t border-border pt-6">
                <span className="text-sm text-muted-foreground">{status}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("");
                    setEditing(true);
                  }}
                  className="motion-cta glow-lime rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811]"
                >
                  Edit {tab.label}
                </button>
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function ReadMode({
  fields,
  form,
}: {
  fields: Array<[keyof CreatorFoundation, string, string, boolean]>;
  form: Record<string, string>;
}) {
  return (
    <div className="divide-y divide-border">
      {fields.map(([key, label, hint]) => {
        const values = (form[key] ?? "")
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);
        return (
          <section
            key={key}
            className="grid gap-2 py-5 first:pt-0 sm:grid-cols-[12rem_1fr] sm:gap-8"
          >
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-midnight">
                {label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
            {listKeys.has(key) ? (
              values.length ? (
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {values.map((value) => (
                    <p
                      key={value}
                      className="flex items-start gap-2 text-sm leading-relaxed text-midnight"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            key === "beliefs"
                              ? NODE_TYPE_COLORS.belief
                              : key === "values"
                                ? NODE_TYPE_COLORS.value
                                : NODE_TYPE_COLORS.identity,
                        }}
                      />
                      {value}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not added yet.</p>
              )
            ) : (
              <p className="text-sm leading-relaxed text-midnight">
                {form[key] || "Not added yet."}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ListField({
  label,
  hint,
  value,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  max?: number | undefined;
  onChange: (value: string) => void;
}) {
  const items = value ? value.split("\n") : [];
  const update = (index: number, next: string) => {
    const values = value.split("\n");
    values[index] = next;
    onChange(values.join("\n"));
  };
  return (
    <div className="text-sm font-semibold text-midnight">
      <div className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        {max ? (
          <span className="text-xs font-medium text-muted-foreground">
            {items.filter((item) => item.trim()).length} / {max}
          </span>
        ) : null}
      </div>
      <span className="mt-1 block text-xs font-normal text-muted-foreground">
        {hint}
      </span>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div
            key={`${index}-${item}`}
            className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <input
              value={item}
              onChange={(event) => update(index, event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none"
            />
            <button
              type="button"
              aria-label={`Remove ${label} item`}
              onClick={() =>
                onChange(
                  items
                    .filter((_, itemIndex) => itemIndex !== index)
                    .join("\n"),
                )
              }
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!max || items.length < max ? (
          <button
            type="button"
            onClick={() => onChange([...items, ""].join("\n"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-input px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        ) : null}
      </div>
    </div>
  );
}
