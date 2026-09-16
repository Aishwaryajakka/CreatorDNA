import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Check, Sparkles } from "lucide-react";

import { AdaptiveCreatorDNALogo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeProvider";
import { DEMO_PERSONAS, type DemoPersona, useDemoMode } from "@/lib/demo-mode";
import { supabase } from "@/lib/supabase/client";
import { useAuthState } from "@/lib/auth-state";

export const Route = createFileRoute("/demo")({ component: DemoPage });

const cards = [
  {
    persona: "jordan" as const,
    description:
      "Jordan writes about entrepreneurship, ambition, recovery, and building a sustainable life as a founder.",
    question:
      "How do I talk about working hard without contradicting everything I’ve said about sustainable ambition?",
    demonstrates: [
      "Perspective evolution",
      "Repetition",
      "Authentic direction",
    ],
  },
  {
    persona: "maya" as const,
    description:
      "Maya creates content about AI, education, product building, responsible AI, and the future of learning.",
    question:
      "Can I talk about AI replacing teachers without losing the perspective I’ve built around responsible AI?",
    demonstrates: [
      "Weak alignment",
      "Evidence-backed reasoning",
      "Research Pulse",
    ],
  },
];

function DemoPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const { session, signOut } = useAuthState();
  const [selected, setSelected] = useState<DemoPersona | null>(null);
  const [loading, setLoading] = useState<DemoPersona | null>(null);
  const [error, setError] = useState("");

  async function enter(persona: DemoPersona) {
    setLoading(persona);
    setError("");
    if (session) {
      const signedOut = await signOut("start-demo");
      if (!signedOut) {
        setError("We couldn't close the current session. Please try again.");
        setLoading(null);
        return;
      }
      demo.clear();
    }
    const response = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    });
    const body = (await response.json()) as {
      session?: Parameters<typeof supabase.auth.setSession>[0];
      error?: string;
    };
    if (!response.ok || !body.session) {
      setError(body.error ?? "Demo access is temporarily unavailable.");
      setLoading(null);
      return;
    }
    demo.begin(persona);
    const result = await supabase.auth.setSession(body.session);
    if (result.error) {
      demo.clear();
      setError("Demo access is temporarily unavailable.");
      setLoading(null);
      return;
    }
    await navigate({ to: "/", replace: true });
  }

  return (
    <main className="public-page telemetry-grid min-h-screen bg-obsidian-base px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          to="/"
          aria-label="Creator DNA home"
          className="logo-link rounded-lg"
        >
          <AdaptiveCreatorDNALogo showTagline={false} className="h-12 w-44" />
        </Link>
        <ThemeToggle />
      </header>
      <section className="mx-auto max-w-6xl py-16 text-center sm:py-24">
        {selected ? (
          <div className="mx-auto max-w-2xl">
            <p className="demo-selector-meta font-mono text-xs font-black tracking-wider text-aqua-accent">
              {DEMO_PERSONAS[selected].label}
            </p>
            <h1 className="mt-4 font-display text-5xl font-black text-foreground">
              {DEMO_PERSONAS[selected].name}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {selected === "jordan"
                ? "Jordan believes founders can be ambitious without burning themselves out. Now he wants to talk about working harder."
                : "Maya has built her voice around responsible AI and the future of education. Now she wants to talk about AI replacing teachers."}
            </p>
            <p className="mt-5 font-display text-2xl font-bold text-foreground">
              {selected === "jordan"
                ? "Does that fit his story—or contradict it?"
                : "Does that fit what she believes?"}
            </p>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => void enter(selected)}
              className="glow-lime mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-chartreuse px-7 py-4 text-sm font-black uppercase tracking-wider text-[var(--dna-belief-foreground)] focus-visible:ring-2 focus-visible:ring-aqua-accent disabled:opacity-60"
            >
              {loading ? "Preparing the story…" : "Find out with Creator DNA"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mx-auto mt-4 block text-xs text-muted-foreground hover:text-foreground"
            >
              Choose someone else
            </button>
            {error ? (
              <p role="alert" className="mt-5 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <p className="demo-selector-meta font-mono text-xs font-black uppercase tracking-widest text-aqua-accent">
              Guided product experience
            </p>
            <h1 className="mt-4 font-display text-4xl font-black sm:text-6xl">
              Try Creator DNA
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground sm:text-xl">
              Step inside a creator’s memory and see how their past can shape
              what they create next.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              No setup. No importing. Choose a creator and explore their Creator
              DNA.
            </p>

            <div className="mt-12 grid gap-6 text-left lg:grid-cols-2">
              {cards.map((card) => {
                const persona = DEMO_PERSONAS[card.persona];
                return (
                  <article
                    key={card.persona}
                    className="telemetry-edge telemetry-card flex flex-col rounded-2xl border border-obsidian-border bg-obsidian-card p-6 sm:p-8"
                  >
                    <p className="demo-selector-meta font-mono text-xs font-bold tracking-wider text-aqua-accent">
                      {persona.label}
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-extrabold">
                      {persona.name}
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                    <div className="mt-6 rounded-xl border border-obsidian-border bg-obsidian-base p-4">
                      <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-chartreuse">
                        The question
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-relaxed">
                        “{card.question}”
                      </p>
                    </div>
                    <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                      {card.demonstrates.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-creator-green" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={Boolean(loading)}
                      onClick={() => setSelected(card.persona)}
                      className="motion-cta mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary px-5 py-3.5 text-sm font-black uppercase tracking-wider text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {loading === card.persona
                        ? "Opening Creator DNA…"
                        : `Explore ${persona.name.split(" ")[0]}'s DNA`}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </article>
                );
              })}
            </div>
            <article className="mx-auto mt-6 flex max-w-2xl items-center gap-4 rounded-2xl border border-dashed border-obsidian-border bg-obsidian-card/60 p-6 text-left opacity-80">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-creator-green/15">
                <Sparkles className="h-5 w-5 text-creator-green" />
              </span>
              <div>
                <p className="font-mono text-xs font-bold text-creator-green">
                  COMING NEXT
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">
                  Alex Rivera · The Evolving Creator
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Career transition, identity evolution, and authentic
                  expansion.
                </p>
              </div>
            </article>
            {error ? (
              <p
                role="alert"
                className="mx-auto mt-6 max-w-xl rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}
            <p className="mt-10 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <BrainCircuit className="h-4 w-4 text-chartreuse" />
              Real seeded memories · Real evidence · Real product flows
            </p>
          </>
        )}
      </section>
    </main>
  );
}
