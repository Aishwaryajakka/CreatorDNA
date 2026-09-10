import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronDown,
  CloudUpload,
  FileText,
  GitBranch,
  History,
  Layers3,
  Menu,
  Network,
  Sparkles,
  Waypoints,
  Zap,
} from "lucide-react";
import { PageHeader, Panel, TelemetryDeck } from "@/components/dna-ui";
import { GraphLegend, StoryGraph } from "@/components/StoryGraph";
import {
  KIND_META,
  type DnaKind,
  type GraphEdge,
  type GraphNode,
} from "@/lib/creator-dna";
import type { CreatorDNANode } from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";
import { useAuthState } from "@/lib/auth-state";
import { AdaptiveCreatorDNALogo } from "@/components/Logo";
import { DnaTypeIcon } from "@/components/DnaTypeIcon";
import { getDnaBorderColor, getDnaIconForeground } from "@/lib/dna-iconography";
import { ThemeToggle } from "@/components/ThemeProvider";
import {
  DataPulse,
  NodeConstellation,
  ScrollReveal,
  SignalPath,
  TelemetryOrbit,
} from "@/components/Motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creator DNA — Your story, remembered" },
      {
        name: "description",
        content: "A living memory and decision layer for your personal brand.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { status, error, refresh } = useAuthState();
  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-wide">
          <DataPulse color="aqua" /> Loading Creator DNA…
        </span>
      </div>
    );
  if (status === "error")
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-destructive">
        <div>
          <p>{error ?? "We couldn't load your account."}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );
  return status === "unauthenticated" ? <LandingPage /> : <Dashboard />;
}

function LandingPage() {
  return (
    <div className="public-page min-h-screen bg-obsidian-base text-foreground">
      <div className="relative z-50 flex min-h-8 items-center justify-between overflow-hidden border-b border-obsidian-border bg-obsidian-base px-4 py-2 font-mono text-[0.6875rem] font-medium tracking-wide text-muted-foreground">
        <div className="hidden items-center gap-2 sm:flex">
          <DataPulse color="green" className="h-1.5 w-1.5" />
          <span className="text-creator-green">CREATOR DNA</span>
        </div>
        <div className="mx-auto flex items-center justify-center gap-2 sm:mx-0">
          <span className="status-new rounded bg-chartreuse px-2 py-0.5 text-[0.625rem] font-black tracking-widest text-[#050811]">
            NEW
          </span>
          <span className="text-foreground">Living Story Graph</span>
          <a
            href="#how-it-works"
            className="hidden items-center gap-1 font-semibold text-aqua-accent transition-colors hover:text-chartreuse sm:inline-flex"
          >
            See how it works <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <span className="hidden text-aqua-accent sm:block">
          YOUR STORIES. A BRIGHTER TOMORROW.
        </span>
      </div>
      <header className="sticky top-0 z-40 h-20 border-b border-obsidian-border bg-obsidian-base/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Creator DNA home"
            className="logo-link inline-flex rounded-lg"
          >
            <AdaptiveCreatorDNALogo
              showTagline={false}
              className="h-12 w-40 sm:w-44"
            />
          </Link>
          <nav className="hidden items-center gap-1.5 rounded-full border border-obsidian-border bg-obsidian-card/90 px-3 py-1.5 font-sans text-xs text-muted-foreground shadow-inner md:flex">
            <a
              href="#the-problem"
              className="public-nav-link rounded-full px-4 py-1.5 transition-colors hover:text-chartreuse"
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              className="public-nav-link rounded-full px-4 py-1.5 transition-colors hover:text-chartreuse"
            >
              How It Works
            </a>
            <a
              href="#story-graph"
              className="public-nav-link rounded-full px-4 py-1.5 transition-colors hover:text-chartreuse"
            >
              Story Map
            </a>
            <a
              href="#evolution"
              className="public-nav-link rounded-full px-4 py-1.5 transition-colors hover:text-chartreuse"
            >
              Evolution
            </a>
            <a
              href="#faq"
              className="public-nav-link rounded-full px-4 py-1.5 transition-colors hover:text-chartreuse"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle
              variant="icon"
              className="grid h-10 w-10 place-items-center rounded-xl border border-obsidian-border bg-obsidian-surface text-muted-foreground transition-colors hover:border-aqua-accent/60 hover:text-foreground"
            />
            <Link
              to="/login"
              className="hidden rounded-lg border border-transparent px-3 py-2 font-sans text-xs font-bold text-muted-foreground transition-colors hover:border-obsidian-border hover:text-foreground sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="motion-cta glow-lime inline-flex items-center gap-1.5 rounded-xl bg-chartreuse px-4 py-2.5 font-sans text-xs font-black uppercase tracking-wider text-[#050811] sm:px-5"
            >
              <span className="hidden sm:inline">Build my Creator DNA</span>
              <span className="sm:hidden">Build DNA</span>
              <Zap className="h-3.5 w-3.5" />
            </Link>
            <details className="group relative md:hidden">
              <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-obsidian-border bg-obsidian-surface text-foreground [&::-webkit-details-marker]:hidden">
                <Menu className="h-4 w-4" />
              </summary>
              <nav className="absolute right-0 top-12 w-48 rounded-xl border border-obsidian-border bg-obsidian-card p-2 font-sans text-xs shadow-2xl">
                {[
                  ["#the-problem", "The Problem"],
                  ["#how-it-works", "How It Works"],
                  ["#story-map", "Story Map"],
                  ["#evolution", "Evolution"],
                  ["#faq", "FAQ"],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-obsidian-surface hover:text-chartreuse"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>
      <main>
        <section className="public-hero telemetry-grid reveal relative overflow-hidden bg-obsidian-base px-4 pb-28 pt-16 sm:px-6 lg:px-8">
          <div className="hero-ambient ambient-drift-a pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[75rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/20 via-aqua-accent/10 to-transparent blur-[140px]" />
          <div className="hero-ambient pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-chartreuse/10 blur-[120px]" />
          <div className="pointer-events-none absolute -left-32 bottom-10 h-96 w-96 rounded-full bg-creator-green/10 blur-[130px]" />
          <NodeConstellation className="hero-line-one pointer-events-none absolute -left-12 top-40 hidden w-72 -rotate-12 opacity-60 md:block" />
          <NodeConstellation className="hero-line-two pointer-events-none absolute -right-16 top-72 hidden w-80 rotate-[165deg] opacity-50 md:block" />
          <TelemetryOrbit
            animated
            className="hero-ambient absolute -right-20 top-20 hidden h-72 w-72 opacity-35 lg:block"
          />
          <div className="relative mx-auto mb-16 max-w-4xl text-center">
            <p className="hero-badge telemetry-card inline-flex items-center gap-2.5 rounded-full border border-obsidian-border bg-obsidian-surface px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-aqua-accent">
              <span className="h-2 w-2 rounded-full bg-chartreuse shadow-[0_0_10px_#E8F31A]" />
              From content to context
            </p>
            <h1 className="marketing-display mt-8 text-foreground">
              <span className="hero-line-one block">Same stories.</span>
              <span className="hero-line-two creator-dna-gradient-text block">
                Bigger possibilities.
              </span>
            </h1>
            <p className="hero-copy mx-auto mt-8 max-w-2xl text-lg font-normal leading-relaxed text-muted-foreground sm:text-2xl">
              Creator DNA turns your content history into a living, intelligent
              story graph—so you can create what&apos;s next with clarity.
            </p>
            <div className="hero-actions mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/login"
                className="motion-cta glow-lime inline-flex w-full items-center justify-center gap-2 rounded-xl bg-chartreuse px-8 py-4 font-sans text-sm font-black uppercase tracking-wider text-[#050811] sm:w-auto"
              >
                Build my Creator DNA <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#story-graph"
                className="motion-secondary glow-aqua inline-flex w-full items-center justify-center gap-2 rounded-xl border border-aqua-accent/40 bg-obsidian-surface px-8 py-4 font-sans text-sm font-bold text-aqua-accent hover:border-aqua-accent hover:bg-obsidian-highlight sm:w-auto"
              >
                <Network className="h-4 w-4" /> Explore Story Graph
              </a>
            </div>
            <div className="hero-capabilities mt-12 inline-flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-obsidian-border bg-obsidian-card/80 px-6 py-3 font-mono text-xs text-muted-foreground shadow-lg sm:gap-10">
              <span className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-creator-green" /> Persistent
                creator memory
              </span>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-chartreuse" /> Source-backed
                DNA
              </span>
              <span className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-aqua-accent" /> Story Graph
                context
              </span>
            </div>
          </div>
          <div className="hero-console relative mx-auto max-w-6xl">
            <LandingGraph />
          </div>
        </section>
        <section
          id="the-problem"
          className="telemetry-grid relative border-y border-obsidian-border bg-obsidian-surface px-4 py-24 sm:px-6 lg:px-8"
        >
          <NodeConstellation
            className="pointer-events-none absolute right-[4%] top-14 w-48 opacity-10"
            compact
          />
          <div className="mx-auto max-w-7xl">
            <ScrollReveal className="mx-auto mb-16 max-w-3xl text-center">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-chartreuse">
                The architectural flaw in modern AI
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                The Blank-Prompt Problem
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Generic tools begin with the prompt in front of them. They do
                not automatically carry the source-backed history of your
                stories, beliefs, or evolving point of view.
              </p>
            </ScrollReveal>
            <ScrollReveal
              delay={140}
              className="grid items-stretch gap-8 lg:grid-cols-2"
            >
              <TelemetryDeck className="motion-card flex flex-col justify-between p-8">
                <div>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-obsidian-border pb-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-obsidian-border bg-obsidian-base text-muted-foreground">
                        <BrainCircuit className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">
                          Blank-prompt workflow
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground">
                          Isolated prompt · limited continuity
                        </p>
                      </div>
                    </div>
                    <span className="rounded border border-sun-yellow/40 bg-sun-yellow/10 px-2.5 py-1 font-mono text-[0.6875rem] font-bold text-sun-yellow">
                      CONTEXT REQUIRED
                    </span>
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    You repeatedly explain who you are, what you have lived, and
                    how you think. The useful context disappears between
                    sessions unless you rebuild it by hand.
                  </p>
                  <ul className="space-y-4 text-sm text-muted-foreground">
                    {[
                      "Past stories remain buried across individual sources",
                      "Claims can lose their link to the words that support them",
                      "Wording changes can be mistaken for a change in perspective",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-yellow" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 rounded-xl border border-obsidian-border bg-obsidian-base p-4 font-mono text-xs text-muted-foreground">
                  <span className="text-muted-foreground/60">
                    // Every session:
                  </span>
                  <br />
                  “Here is the background you need before we begin…”
                </div>
              </TelemetryDeck>
              <TelemetryDeck className="motion-card glow-electric flex flex-col justify-between border-2 border-primary p-8">
                <div>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-primary/30 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="glow-lime grid h-10 w-10 place-items-center rounded-xl bg-chartreuse text-[#050811]">
                        <Waypoints className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-extrabold text-foreground">
                          Creator DNA Engine
                        </h3>
                        <p className="font-mono text-xs text-aqua-accent">
                          Persistent Story Graph architecture
                        </p>
                      </div>
                    </div>
                    <span className="glow-lime rounded bg-chartreuse px-2.5 py-1 font-mono text-[0.6875rem] font-black uppercase tracking-wider text-[#050811]">
                      SOURCE-BACKED
                    </span>
                  </div>
                  <p className="mb-6 text-sm font-medium leading-relaxed text-foreground/85">
                    Creator DNA extracts grounded story nodes from content you
                    choose to add, preserves their evidence, and retrieves the
                    relevant history when you plan what comes next.
                  </p>
                  <ul className="space-y-4 text-sm font-medium text-foreground">
                    {[
                      [
                        "Persistent context",
                        "Your stored DNA remains available across planning sessions.",
                      ],
                      [
                        "Visible provenance",
                        "Nodes retain source titles, dates, and evidence quotes when available.",
                      ],
                      [
                        "Grounded planning",
                        "Story Intelligence reasons from retrieved nodes instead of invented history.",
                      ],
                    ].map(([title, copy]) => (
                      <li key={title} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-creator-green" />
                        <span>
                          <strong className="font-display text-chartreuse">
                            {title}:
                          </strong>{" "}
                          {copy}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 p-4 font-mono text-xs text-aqua-accent">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-chartreuse" />
                  Context comes from your private, user-scoped Story Graph.
                </div>
              </TelemetryDeck>
            </ScrollReveal>
          </div>
        </section>
        <section
          id="how-it-works"
          className="circuit-lines relative bg-obsidian-base px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <ScrollReveal className="mx-auto mb-16 max-w-3xl text-center">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-chartreuse">
                The architectural method
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                From Memory to Momentum
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                A continuous loop that transforms your existing creative history
                into better-grounded future ideas.
              </p>
            </ScrollReveal>
            <ScrollReveal className="process-sequence grid gap-8 md:grid-cols-2">
              {[
                {
                  number: "01",
                  title: "Add / Import Content",
                  copy: "Paste content directly or import supported public YouTube videos into your private content library.",
                  detail: "Source content captured",
                  color: "text-primary",
                  border: "hover:border-primary",
                  icon: <CloudUpload className="h-6 w-6" />,
                  iconClass:
                    "border-primary/40 bg-primary/20 text-primary glow-electric",
                },
                {
                  number: "02",
                  title: "Extract Creator DNA",
                  copy: "Grounded extraction identifies stories, beliefs, themes, experiences, lessons, and Foundation signals.",
                  detail: "Semantic nodes mapped",
                  color: "text-creator-green",
                  border: "hover:border-creator-green",
                  icon: <BrainCircuit className="h-6 w-6" />,
                  iconClass:
                    "border-creator-green/40 bg-creator-green/20 text-creator-green glow-green",
                },
                {
                  number: "03",
                  title: "Build Story Graph",
                  copy: "Your source-backed nodes become an explorable map of recurring ideas and connected creative history.",
                  detail: "Evidence stays visible",
                  color: "text-sun-yellow",
                  border: "hover:border-sun-yellow",
                  icon: <GitBranch className="h-6 w-6" />,
                  iconClass:
                    "border-sun-yellow/40 bg-sun-yellow/20 text-sun-yellow",
                },
                {
                  number: "04",
                  title: "Plan With Context",
                  copy: "Start with a new idea and receive three distinct directions grounded in the DNA most relevant to it.",
                  detail: "Grounded directions ready",
                  color: "text-chartreuse",
                  border: "hover:border-chartreuse",
                  icon: <Sparkles className="h-6 w-6" />,
                  iconClass:
                    "border-chartreuse/40 bg-chartreuse/20 text-chartreuse glow-lime",
                },
              ].map((step) => (
                <TelemetryDeck
                  key={step.number}
                  className={`motion-card group flex min-h-72 flex-col justify-between p-8 ${step.border}`}
                >
                  <div>
                    <div className="mb-6 flex items-center justify-between border-b border-obsidian-border pb-4">
                      <span
                        className={`font-mono text-4xl font-black transition-transform group-hover:scale-110 ${step.color}`}
                      >
                        {step.number}
                      </span>
                      <span
                        className={`grid h-12 w-12 place-items-center rounded-xl border ${step.iconClass}`}
                      >
                        {step.icon}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.copy}
                    </p>
                  </div>
                  <div
                    className={`mt-8 flex items-center gap-1 border-t border-obsidian-border pt-4 font-mono text-xs font-semibold ${step.color}`}
                  >
                    {step.detail} <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </TelemetryDeck>
              ))}
            </ScrollReveal>
          </div>
        </section>
        <section
          id="story-graph"
          className="telemetry-grid relative border-t border-obsidian-border bg-obsidian-surface px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
            <ScrollReveal className="lg:col-span-5">
              <p className="mb-5 inline-flex rounded-full border border-chartreuse/40 bg-chartreuse/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-chartreuse">
                Signature differentiation
              </p>
              <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                Every creator has a content calendar.
                <br />
                <span className="text-chartreuse underline decoration-chartreuse/40 underline-offset-8">
                  Creator DNA gives you a story map.
                </span>
              </h2>
              <p className="mb-6 mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                A calendar organizes output by deadline. Your Story Map shows
                how stories, beliefs, themes, experiences, and lessons connect
                across the work you have actually added.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 rounded-xl border border-obsidian-border bg-obsidian-card p-4 transition-colors hover:border-aqua-accent/50">
                  <GitBranch className="mt-0.5 h-5 w-5 shrink-0 text-aqua-accent" />
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">
                      Connected creative memory
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Explore related ideas without replacing or flattening the
                      source material behind them.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 rounded-xl border border-obsidian-border bg-obsidian-card p-4 transition-colors hover:border-chartreuse/50">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-chartreuse" />
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">
                      Evidence-first lineage
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Inspect the source title, date, summary, and evidence
                      quote retained for each DNA node.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={140} className="lg:col-span-7">
              <TelemetryDeck className="bg-obsidian-base p-6 shadow-2xl sm:p-8">
                <div className="mb-6 flex items-center justify-between border-b border-obsidian-border pb-4 font-mono">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-aqua-accent shadow-[0_0_8px_#36D6C5]" />
                    <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                      Node Evidence Stream
                    </span>
                  </div>
                  <span className="rounded border border-chartreuse/30 bg-chartreuse/10 px-2.5 py-0.5 text-[0.6875rem] text-chartreuse">
                    GROUNDED CONTEXT
                  </span>
                </div>
                <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-gradient-to-b before:from-chartreuse before:via-aqua-accent before:to-primary">
                  {[
                    {
                      type: "SOURCE CONTENT",
                      meta: "CONTENT LIBRARY",
                      title: "A creator adds something they have published",
                      copy: "The original text and source metadata become the grounding record.",
                      color: "text-chartreuse",
                      dot: "bg-chartreuse shadow-[0_0_10px_#E8F31A]",
                    },
                    {
                      type: "DNA EXTRACTION",
                      meta: "STORY GRAPH",
                      title: "Semantic findings retain supporting evidence",
                      copy: "Stories, beliefs, themes, experiences, and lessons stay linked to their source.",
                      color: "text-aqua-accent",
                      dot: "bg-aqua-accent shadow-[0_0_10px_#36D6C5]",
                    },
                    {
                      type: "PLANNING CONTEXT",
                      meta: "STORY INTELLIGENCE",
                      title: "Relevant DNA informs three authentic directions",
                      copy: "The planning pipeline receives retrieved evidence instead of fabricated personal history.",
                      color: "text-primary",
                      dot: "bg-primary shadow-[0_0_10px_#155EEF]",
                    },
                  ].map((item) => (
                    <div key={item.type} className="relative group">
                      <span
                        className={`absolute -left-[27px] top-2 h-3.5 w-3.5 rounded-full border-2 border-obsidian-base ${item.dot}`}
                      />
                      <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 transition-colors group-hover:border-aqua-accent/40">
                        <div className="mb-1.5 flex items-center justify-between gap-4 font-mono text-[0.6875rem] text-muted-foreground">
                          <span className={`font-bold ${item.color}`}>
                            {item.type}
                          </span>
                          <span>{item.meta}</span>
                        </div>
                        <h3 className="font-display text-sm font-bold text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.copy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TelemetryDeck>
            </ScrollReveal>
          </div>
        </section>
        <section
          id="evolution"
          className="circuit-lines relative bg-obsidian-base px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <ScrollReveal className="mx-auto mb-16 max-w-3xl text-center">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-chartreuse">
                Intellectual trajectory
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                See how your thinking changes over time.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Dated source evidence makes meaningful shifts easier to notice,
                so your next idea can build on what you have learned.
              </p>
            </ScrollReveal>
            <ScrollReveal className="evolution-sequence grid gap-8 md:grid-cols-3">
              {[
                {
                  phase: "PHASE 01 · EARLIER SOURCES",
                  title: "A position takes shape",
                  copy: "Creator DNA preserves the original story or belief with its date and supporting words.",
                  note: "Original context remains inspectable",
                  color: "text-sun-yellow",
                  border: "border-t-sun-yellow",
                  dot: "bg-sun-yellow shadow-[0_0_8px_#FFD83D]",
                },
                {
                  phase: "PHASE 02 · NEW EVIDENCE",
                  title: "The perspective develops",
                  copy: "Later sources can add nuance without treating every wording difference as a contradiction.",
                  note: "Dated evidence supports comparison",
                  color: "text-aqua-accent",
                  border: "border-t-primary",
                  dot: "bg-primary shadow-[0_0_8px_#155EEF]",
                },
                {
                  phase: "PHASE 03 · NEXT DIRECTION",
                  title: "Planning builds forward",
                  copy: "When evidence supports a meaningful shift, Story Intelligence can surface it as planning context.",
                  note: "Insufficient evidence stays explicit",
                  color: "text-chartreuse",
                  border: "border-t-chartreuse",
                  dot: "bg-chartreuse shadow-[0_0_8px_#E8F31A]",
                },
              ].map((phase) => (
                <TelemetryDeck
                  key={phase.phase}
                  className={`motion-card relative z-[1] flex min-h-80 flex-col justify-between border-t-4 p-7 ${phase.border}`}
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between border-b border-obsidian-border pb-2">
                      <span
                        className={`font-mono text-xs font-bold uppercase tracking-wider ${phase.color}`}
                      >
                        {phase.phase}
                      </span>
                      <span className={`h-3 w-3 rounded-full ${phase.dot}`} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {phase.title}
                    </h3>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {phase.copy}
                    </p>
                    <div className="mt-4 rounded-xl border border-obsidian-border bg-obsidian-base p-3.5 font-mono text-xs italic text-muted-foreground">
                      {phase.note}
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-obsidian-border pt-4 font-mono text-xs text-muted-foreground">
                    <span>Evidence state</span>
                    <span className={`font-bold ${phase.color}`}>
                      SOURCE-BACKED
                    </span>
                  </div>
                </TelemetryDeck>
              ))}
            </ScrollReveal>
          </div>
        </section>
        <section className="bg-obsidian-base px-4 py-16 sm:px-6 lg:px-8">
          <ScrollReveal className="landing-memory-cta glow-lime relative mx-auto max-w-7xl overflow-hidden rounded-3xl border-2 border-chartreuse/60 bg-gradient-to-r from-primary/20 via-obsidian-card to-obsidian-base p-10 sm:p-14">
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-96 w-96 rounded-full bg-aqua-accent/15 blur-3xl" />
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
              <div className="max-w-2xl">
                <span className="glow-lime mb-4 inline-flex rounded-full bg-chartreuse px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#050811]">
                  Living Story Graph
                </span>
                <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Your story is already there.
                  <br />
                  <span className="text-chartreuse">
                    Build the memory that connects it.
                  </span>
                </h2>
                <p className="mt-4 text-base text-muted-foreground">
                  Stop rebuilding your context from scratch. Give future ideas a
                  grounded connection to the work you have already done.
                </p>
              </div>
              <Link
                to="/login"
                className="motion-cta glow-lime inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-chartreuse px-8 py-4 font-sans text-sm font-black uppercase tracking-wider text-[#050811]"
              >
                Build my Creator DNA <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </section>
        <section
          id="faq"
          className="border-t border-obsidian-border bg-obsidian-surface px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <ScrollReveal className="mb-16 text-center">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-chartreuse">
                Clarity &amp; details
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                What the current Creator DNA MVP supports and how its grounded
                memory works.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={120} className="grid gap-6 md:grid-cols-2">
              {[
                [
                  "How is Creator DNA different from a blank AI chat?",
                  "Creator DNA retrieves relevant, source-backed nodes from your stored creative history before planning. The analysis is validated and supporting evidence remains inspectable.",
                ],
                [
                  "What does Creator DNA remember?",
                  "It remembers the semantic findings and source evidence extracted from content you add, plus the Creator Foundation you choose to save.",
                ],
                [
                  "What content can I add?",
                  "You can paste content manually, add LinkedIn or X content manually, import supported public YouTube videos and playlists, or save your Creator Foundation.",
                ],
                [
                  "Does Creator DNA generate content for me?",
                  "It helps you plan by surfacing relevant history and authentic directions. It does not generate a full post in this product flow.",
                ],
                [
                  "Can I edit my Creator Foundation?",
                  "Yes. My Foundation stays editable and updates the context behind your Story Map.",
                ],
                [
                  "Where does the evidence in my Story Map come from?",
                  "Every node is linked to the source content or Creator Foundation it came from, including a quote when available.",
                ],
                [
                  "How does Creator DNA use my content?",
                  "Your content is analyzed to create your private, user-scoped Creator DNA. Retrieval and planning use only your own stored history.",
                ],
              ].map(([question, answer]) => (
                <details
                  key={question}
                  className="landing-faq-card telemetry-edge group cursor-pointer rounded-2xl border border-obsidian-border bg-obsidian-card p-6 transition-all [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex list-none items-center justify-between gap-4 font-display text-base font-bold text-foreground">
                    {question}
                    <ChevronDown className="h-5 w-5 shrink-0 text-chartreuse transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 border-t border-obsidian-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    {answer}
                  </p>
                </details>
              ))}
            </ScrollReveal>
          </div>
        </section>
        <section
          id="build"
          className="telemetry-grid relative overflow-hidden border-t border-obsidian-border bg-obsidian-base px-4 py-28 text-center sm:px-6 lg:px-8"
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[31rem] w-[50rem] rounded-full bg-primary/15 blur-[140px]" />
            <div className="absolute h-[22rem] w-[28rem] rounded-full bg-chartreuse/10 blur-[100px]" />
          </div>
          <ScrollReveal className="relative z-10 mx-auto max-w-4xl">
            <div className="glow-lime mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border-2 border-chartreuse bg-obsidian-card">
              <Waypoints className="h-8 w-8 text-chartreuse" />
            </div>
            <h2 className="font-display text-4xl font-black leading-tight tracking-tight text-foreground sm:text-6xl">
              Turn your past into your
              <br />
              <span className="creator-dna-gradient-text">
                most powerful creative future.
              </span>
            </h2>
            <p className="mx-auto mb-10 mt-6 max-w-xl text-lg text-muted-foreground">
              Give your creative history persistent memory and start planning
              with the Story Graph behind you.
            </p>
            <Link
              to="/login"
              className="motion-cta glow-lime inline-flex items-center justify-center gap-2 rounded-xl bg-chartreuse px-8 py-4 font-sans text-sm font-black uppercase tracking-wider text-[#050811]"
            >
              Build my Creator DNA <Zap className="h-4 w-4" />
            </Link>
            <p className="mt-8 font-mono text-xs text-muted-foreground">
              Your stories stay yours. Planning stays grounded in your sources.
            </p>
          </ScrollReveal>
        </section>
      </main>
      <footer className="border-t border-obsidian-border bg-obsidian-surface px-4 py-16 font-mono text-xs text-muted-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link
                to="/"
                aria-label="Creator DNA home"
                className="logo-link inline-flex rounded-lg"
              >
                <AdaptiveCreatorDNALogo className="h-16 w-64" />
              </Link>
              <p className="mb-6 mt-4 max-w-sm font-sans text-xs leading-relaxed text-muted-foreground">
                The persistent memory layer and living Story Graph for creators
                who want to plan from their real history.
              </p>
              <span className="inline-flex items-center gap-2 rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-1.5 text-[0.6875rem]">
                <span className="h-2 w-2 rounded-full bg-creator-green" />
                Source-backed creator context
              </span>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-chartreuse">
                Product
              </h3>
              <ul className="space-y-2.5 font-sans">
                <li>
                  <a href="#story-graph" className="hover:text-chartreuse">
                    Living Story Graph
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-chartreuse">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#evolution" className="hover:text-chartreuse">
                    Perspective Evolution
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-aqua-accent">
                Create
              </h3>
              <ul className="space-y-2.5 font-sans">
                <li>
                  <Link to="/login" className="hover:text-chartreuse">
                    Add Content
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-chartreuse">
                    Import Content
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-chartreuse">
                    Plan Content
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-creator-green">
                Account
              </h3>
              <ul className="space-y-2.5 font-sans">
                <li>
                  <Link to="/login" className="hover:text-chartreuse">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-chartreuse">
                    Build my Creator DNA
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="hover:text-chartreuse">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-obsidian-border pt-8 sm:flex-row">
            <p>
              © {new Date().getFullYear()} Creator DNA · Your stories. A
              brighter tomorrow.
            </p>
            <a
              href="#story-graph"
              className="rounded-sm font-bold text-chartreuse hover:text-aqua-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-accent focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian-surface"
            >
              Build your Story Graph ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LandingGraph() {
  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary via-aqua-accent to-chartreuse opacity-25 blur-2xl" />
      <TelemetryDeck className="p-6 shadow-2xl sm:p-8">
        <div className="graph-node-enter mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-obsidian-border pb-6 font-mono [animation-delay:850ms]">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-chartreuse shadow-[0_0_10px_#E8F31A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Living Story Graph
            </span>
            <span className="rounded border border-aqua-accent/40 bg-aqua-accent/10 px-2.5 py-0.5 text-[0.625rem] font-bold text-aqua-accent">
              SOURCE-BACKED
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-chartreuse/40 bg-chartreuse/10 px-3 py-1 font-bold text-chartreuse">
              CREATOR CONTEXT
            </span>
            <span className="hidden sm:block">Stories · Beliefs · Themes</span>
          </div>
        </div>
        <div className="landing-graph-canvas circuit-lines relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-xl border border-obsidian-border bg-obsidian-base p-6 sm:min-h-[520px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-aqua-accent/15" />
          <TelemetryOrbit className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 opacity-55" />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 900 520"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="landing-strand-one"
                x1="0"
                x2="1"
                y1="0"
                y2="1"
              >
                <stop offset="0" stopColor="#155EEF" stopOpacity=".9" />
                <stop offset=".5" stopColor="#36D6C5" stopOpacity=".8" />
                <stop offset="1" stopColor="#E8F31A" stopOpacity=".95" />
              </linearGradient>
              <linearGradient
                id="landing-strand-two"
                x1="1"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0" stopColor="#FFD83D" />
                <stop offset="1" stopColor="#31D158" />
              </linearGradient>
              <filter
                id="landing-glow"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur result="blur" stdDeviation="4" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx="450"
              cy="260"
              r="130"
              fill="none"
              stroke="#172338"
              strokeDasharray="4 6"
              strokeWidth="1.5"
            />
            <circle
              cx="450"
              cy="260"
              r="220"
              fill="none"
              stroke="#172338"
              strokeDasharray="6 8"
            />
            <circle
              cx="450"
              cy="260"
              r="305"
              fill="none"
              stroke="#172338"
              opacity=".5"
            />
            <path
              className="graph-path-draw graph-path-delay-1"
              d="M80 175 Q240 55 450 210 T820 210"
              fill="none"
              filter="url(#landing-glow)"
              stroke="url(#landing-strand-one)"
              strokeWidth="3.5"
            />
            <path
              className="graph-path-draw graph-path-delay-2"
              d="M120 335 C300 420 540 105 810 150"
              fill="none"
              filter="url(#landing-glow)"
              stroke="url(#landing-strand-two)"
              strokeWidth="2.5"
            />
            <path
              className="graph-path-draw graph-path-delay-3"
              d="M270 100 L450 260 L660 350"
              fill="none"
              stroke="#155EEF"
              strokeOpacity=".65"
              strokeWidth="2"
            />
            {(
              [
                [130, 170, 8, "#155EEF"],
                [270, 100, 10, "#FFD83D"],
                [390, 210, 7, "#31D158"],
                [610, 145, 9, "#36D6C5"],
                [770, 215, 8, "#E8F31A"],
                [165, 335, 9, "#36D6C5"],
                [330, 390, 7, "#31D158"],
                [660, 350, 10, "#155EEF"],
                [795, 150, 7, "#E8F31A"],
              ] as const
            ).map(([cx, cy, r, fill], index) => (
              <g key={index} className={`landing-node-drift-${index % 3}`}>
                <circle
                  className={`graph-node-enter graph-node-delay-${(index % 3) + 1}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={fill}
                  filter="url(#landing-glow)"
                />
              </g>
            ))}
          </svg>
          <SignalPath className="absolute left-[14%] top-[29%] h-36 w-[72%] opacity-75" />
          <div className="graph-core-enter glow-lime relative z-10 max-w-sm rounded-2xl border-2 border-chartreuse bg-obsidian-surface p-6 text-center transition-transform duration-300 hover:scale-105">
            <div className="glow-lime mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-chartreuse font-display text-sm font-black text-[#050811]">
              DNA
            </div>
            <h3 className="font-display text-base font-black text-foreground">
              Your connected creative history
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Source-backed stories, beliefs, themes, experiences, and lessons
              form a living context layer.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-chartreuse/30 bg-chartreuse/10 px-3 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-wider text-chartreuse">
              <span className="h-2 w-2 rounded-full bg-chartreuse shadow-[0_0_10px_#E8F31A]" />
              Persistent narrative context
            </span>
          </div>
          <GraphHudCard
            className="left-4 top-6 sm:left-10"
            color="sun"
            title="Published source"
            detail="Original content and metadata"
          />
          <GraphHudCard
            className="bottom-6 left-4 sm:left-12"
            color="aqua"
            title="Grounded evidence"
            detail="Quotes remain attached to nodes"
          />
          <GraphHudCard
            className="right-4 top-8 sm:right-10"
            color="green"
            title="Perspective context"
            detail="Dated sources support evolution"
          />
          <GraphHudCard
            className="bottom-8 right-4 sm:right-12"
            color="blue"
            title="Planning direction"
            detail="Relevant DNA informs new ideas"
          />
        </div>
        <div className="graph-diagnostics-enter mt-6 flex flex-col items-center justify-between gap-4 font-mono text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-wrap items-center gap-6">
            <GraphLegendItem kind="belief" />
            <GraphLegendItem kind="story" />
            <GraphLegendItem kind="theme" />
            <GraphLegendItem kind="experience" />
          </div>
          <span className="flex items-center gap-1.5 font-semibold text-aqua-accent">
            Evidence-first Story Graph <GitBranch className="h-4 w-4" />
          </span>
        </div>
      </TelemetryDeck>
    </div>
  );
}

function GraphHudCard({
  className,
  color,
  title,
  detail,
}: {
  className: string;
  color: "sun" | "aqua" | "green" | "blue";
  title: string;
  detail: string;
}) {
  const styles = {
    sun: "border-sun-yellow/50 text-sun-yellow",
    aqua: "border-aqua-accent/60 text-aqua-accent glow-aqua",
    green: "border-creator-green/60 text-creator-green glow-green",
    blue: "border-primary/80 text-primary glow-electric",
  }[color];
  const dot = {
    sun: "bg-sun-yellow shadow-[0_0_10px_#FFD83D]",
    aqua: "bg-aqua-accent shadow-[0_0_10px_#36D6C5]",
    green: "bg-creator-green shadow-[0_0_10px_#31D158]",
    blue: "bg-primary shadow-[0_0_10px_#155EEF]",
  }[color];
  return (
    <div
      className={`graph-hud-enter absolute z-10 hidden max-w-[220px] rounded-xl border bg-obsidian-surface/95 p-3.5 shadow-xl backdrop-blur-md sm:block ${styles} ${className}`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span className="font-mono text-xs font-bold">{title}</span>
      </div>
      <p className="font-mono text-[0.625rem] text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

function GraphLegendItem({ kind }: { kind: DnaKind }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="semantic-node-marker grid h-6 w-6 place-items-center rounded-full"
        style={{
          color: getDnaIconForeground(kind),
          backgroundColor: KIND_META[kind].color,
          borderColor: getDnaBorderColor(kind),
        }}
      >
        <DnaTypeIcon kind={kind} size={12} />
      </span>
      {KIND_META[kind].plural}
    </span>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<CreatorDNANode[]>([]);
  const [topic, setTopic] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  useEffect(() => {
    void authenticatedFetch("/api/story-map")
      .then((response) => (response.ok ? response.json() : { nodes: [] }))
      .then((data: { nodes: CreatorDNANode[] }) => setNodes(data.nodes))
      .finally(() => setDataLoading(false));
  }, []);
  const kinds: DnaKind[] = [
    "story",
    "belief",
    "theme",
    "experience",
    "lesson",
    "goal",
  ];
  const previewNodes = nodes.slice(0, 10);
  const graphNodes: GraphNode[] = previewNodes.map((node, index) => ({
    id: node.id,
    label: node.label,
    kind: node.type,
    summary: node.summary,
    x: 16 + ((index * 43) % 68),
    y: 16 + ((index * 61) % 68),
  }));
  const graphEdges: GraphEdge[] = [];
  for (let i = 0; i < previewNodes.length; i++) {
    for (let j = i + 1; j < previewNodes.length; j++) {
      const sameContent =
        previewNodes[i]!.contentId &&
        previewNodes[i]!.contentId === previewNodes[j]!.contentId;
      const sameSource =
        previewNodes[i]!.sourceTitle &&
        previewNodes[i]!.sourceTitle === previewNodes[j]!.sourceTitle;
      if ((sameContent || sameSource) && graphEdges.length < 14)
        graphEdges.push({ from: previewNodes[i]!.id, to: previewNodes[j]!.id });
    }
  }
  const degreeById = new Map<string, number>();
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const connected =
        (nodes[i]!.contentId && nodes[i]!.contentId === nodes[j]!.contentId) ||
        (nodes[i]!.sourceTitle &&
          nodes[i]!.sourceTitle === nodes[j]!.sourceTitle);
      if (connected) {
        degreeById.set(nodes[i]!.id, (degreeById.get(nodes[i]!.id) ?? 0) + 1);
        degreeById.set(nodes[j]!.id, (degreeById.get(nodes[j]!.id) ?? 0) + 1);
      }
    }
  }
  const snapshot = nodes
    .filter((node) =>
      ["belief", "theme", "story", "experience", "lesson", "goal"].includes(
        node.type,
      ),
    )
    .sort((a, b) => (degreeById.get(b.id) ?? 0) - (degreeById.get(a.id) ?? 0))
    .slice(0, 5);
  return (
    <div className="memory-boot flex flex-col gap-10">
      <PageHeader
        eyebrow="Your creator DNA"
        title="Your story, remembered."
        subtitle="A living memory of what you've experienced, believed, learned, and shared."
      />
      <Panel accent="var(--primary)" className="order-4 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="eyebrow text-muted-foreground">
            What do you want to create next?
          </p>
        </div>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ to: "/plan", search: { topic } });
          }}
        >
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="I want to create something about…"
            className="min-h-14 min-w-0 flex-1 rounded-lg border border-input bg-background px-5 py-4 text-base text-midnight outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary focus:shadow-lift"
          />
          <button className="motion-cta inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-black text-primary-foreground transition-transform hover:bg-[#2563FF] hover:-translate-y-0.5">
            Start planning <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </Panel>
      <section className="home-knowledge telemetry-edge order-3 rounded-xl border border-border bg-card px-6 py-7 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">What Creator DNA knows</p>
            <h2 className="mt-2 text-2xl font-extrabold text-midnight">
              Your story graph is taking shape.
            </h2>
          </div>
          <Link to="/story-map" className="text-sm font-bold text-primary">
            Explore map →
          </Link>
        </div>
        <div className="home-knowledge-counts mt-5 flex flex-wrap gap-x-8 gap-y-4 border-y border-border py-5">
          {dataLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="telemetry-skeleton h-7 w-24 rounded-lg"
                />
              ))
            : kinds.map((kind) => (
                <Link
                  key={kind}
                  to="/story-map"
                  search={{ type: kind }}
                  className="group flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-muted"
                >
                  <span
                    className="semantic-node-marker grid h-7 w-7 place-items-center rounded-full"
                    style={{
                      color: getDnaIconForeground(kind),
                      backgroundColor: KIND_META[kind].color,
                      borderColor: getDnaBorderColor(kind),
                    }}
                  >
                    <DnaTypeIcon kind={kind} size={13} />
                  </span>
                  <p className="text-xl font-extrabold text-midnight">
                    {nodes.filter((node) => node.type === kind).length}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {KIND_META[kind].plural}
                  </p>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
        </div>
      </section>
      {!dataLoading && snapshot.length ? (
        <section className="order-3">
          <p className="eyebrow">What Creator DNA remembers</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {snapshot.map((node) => (
              <Link
                key={node.id}
                to="/story-map"
                search={{ node: node.id }}
                className="memory-fragment rounded-2xl border border-border bg-card p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-card"
                style={
                  {
                    "--memory-accent": KIND_META[node.type].color,
                  } as React.CSSProperties
                }
              >
                <span
                  className="semantic-node-marker grid h-7 w-7 place-items-center rounded-full"
                  style={{
                    color: getDnaIconForeground(node.type),
                    backgroundColor: KIND_META[node.type].color,
                    borderColor: getDnaBorderColor(node.type),
                  }}
                >
                  <DnaTypeIcon kind={node.type} size={13} />
                </span>
                <p className="mt-3 truncate text-sm font-bold text-midnight">
                  {node.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {KIND_META[node.type].label}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <Panel className="story-preview-panel telemetry-grid order-2 p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Story Graph preview</p>
            <h2 className="mt-2 text-xl font-bold text-midnight">
              The context behind your content.
            </h2>
          </div>
          <Link to="/story-map" className="text-sm font-bold text-primary">
            Open full map →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-border py-4 sm:grid-cols-4">
          <MemoryStat value={nodes.length} label="memories" />
          <MemoryStat value={graphEdges.length} label="connections" />
          <MemoryStat
            value={nodes.filter((node) => node.type === "belief").length}
            label="beliefs"
          />
          <MemoryStat
            value={nodes.filter((node) => node.type === "theme").length}
            label="themes"
          />
        </div>
        {dataLoading ? (
          <div className="telemetry-skeleton mt-5 h-[19rem] rounded-2xl border border-border" />
        ) : nodes.length ? (
          <div className="mt-5 rounded-2xl border border-border bg-background p-4">
            <StoryGraph
              nodes={graphNodes}
              edges={graphEdges}
              onSelect={(node) =>
                void navigate({ to: "/story-map", search: { node: node.id } })
              }
              className="h-[19rem]"
              compact
            />
          </div>
        ) : (
          <div className="relative mt-5 overflow-hidden rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <TelemetryOrbit
              animated
              className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 opacity-40"
            />
            <NodeConstellation compact className="relative mx-auto mb-2 w-36" />
            <Check className="relative mx-auto h-6 w-6 text-primary" />
            <p className="mt-3">
              Add content to start building your Story Graph.
            </p>
          </div>
        )}
        <div className="mt-4">
          <GraphLegend kinds={kinds} />
        </div>
      </Panel>
    </div>
  );
}

function MemoryStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="display-title text-2xl text-midnight">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
