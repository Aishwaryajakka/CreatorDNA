import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dna-ui";
import { authenticatedFetch } from "@/lib/supabase/client";
export const Route = createFileRoute("/onboarding")({ component: Onboarding });
const fields = [
  ["whatYouDo", "What do you do?"],
  ["mainTopics", "Main content topics"],
  ["expertise", "Areas of expertise (one per line)"],
  ["importantExperiences", "Important experiences (one per line)"],
  ["accomplishments", "Accomplishments (one per line)"],
  ["failures", "Failures or setbacks (one per line)"],
  ["perspectiveChanges", "What changed your perspective? (one per line)"],
  ["beliefs", "3–5 things you strongly believe (one per line)"],
  ["values", "Values (one per line)"],
  ["personality", "Personality traits (one per line)"],
  ["goals", "Creator goals (one per line)"],
] as const;
function Onboarding() {
  const nav = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = Object.fromEntries(
      fields.map(([key]) => [
        key,
        ["whatYouDo", "mainTopics"].includes(key)
          ? (values[key] ?? "")
          : (values[key] ?? "")
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
      ]),
    );
    const r = await authenticatedFetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) {
      setError(data.error);
      return;
    }
    void nav({ to: "/story-map" });
  }
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Creator Foundation"
        title="Start with what you know about yourself."
        subtitle="A concise foundation helps Creator DNA connect your stated perspective with what you've published."
      />
      <Panel className="max-w-3xl p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-5">
          {fields.map(([key, label]) => (
            <label
              key={key}
              className="block text-sm font-medium text-midnight"
            >
              {label}
              <textarea
                required={
                  key === "whatYouDo" ||
                  key === "mainTopics" ||
                  key === "beliefs"
                }
                value={values[key] ?? ""}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
                rows={key === "whatYouDo" || key === "mainTopics" ? 3 : 2}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5"
              />
            </label>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save foundation"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
