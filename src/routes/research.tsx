import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";

import { KindBadge, PageHeader, Panel } from "@/components/dna-ui";
import type { ResearchItem, ResearchWindow } from "@/lib/research/types";
import { authenticatedFetch } from "@/lib/supabase/client";

export const Route = createFileRoute("/research")({ component: ResearchPage });

function ResearchPage() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [window, setWindow] = useState<ResearchWindow>("7d");
  const [providerConfigured, setProviderConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [contextInsufficient, setContextInsufficient] = useState(false);
  const autoRefreshed = useRef(false);

  const refresh = useCallback(async (selectedWindow: ResearchWindow) => {
    setRefreshing(true);
    setMessage("");
    setContextInsufficient(false);
    try {
      const response = await authenticatedFetch("/api/research/pulse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ window: selectedWindow }),
      });
      const body = (await response.json()) as {
        items?: ResearchItem[];
        error?: string;
        code?: string;
      };
      if (!response.ok || !body.items) {
        setContextInsufficient(body.code === "INSUFFICIENT_CREATOR_CONTEXT");
        throw new Error(
          body.error ?? "Research Pulse couldn't refresh right now.",
        );
      }
      setContextInsufficient(false);
      setItems(body.items);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Research Pulse couldn't refresh right now.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void authenticatedFetch("/api/research")
      .then(async (response) => {
        const body = (await response.json()) as {
          items?: ResearchItem[];
          providerConfigured?: boolean;
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error ?? "Unable to load research.");
        if (!active) return;
        const saved = body.items ?? [];
        const configured = body.providerConfigured === true;
        setItems(saved);
        setProviderConfigured(configured);
        if (!saved.length && configured && !autoRefreshed.current) {
          autoRefreshed.current = true;
          void refresh("7d");
        }
      })
      .catch((error: unknown) => {
        if (active)
          setMessage(
            error instanceof Error ? error.message : "Unable to load research.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Research Pulse"
        title="What's happening around your story?"
        subtitle="Current developments connected to the ideas, beliefs, and territories already shaping your Creator DNA."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {(["24h", "7d"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setWindow(value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${window === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {value === "24h" ? "24 hours" : "7 days"}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={refreshing || !providerConfigured}
          onClick={() => void refresh(window)}
          className="motion-cta inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh Research Pulse
        </button>
      </div>

      {!providerConfigured ? (
        <Panel className="p-7">
          <p className="font-semibold text-midnight">
            Research Pulse requires a live research provider to surface current
            developments.
          </p>
        </Panel>
      ) : null}
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      {refreshing ? (
        <Panel className="p-7 text-sm text-muted-foreground">
          Researching what matters to your story...
        </Panel>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading saved research…</p>
      ) : items.length ? (
        <div className="space-y-6">
          {items.map((item) => (
            <ResearchCard key={item.id} item={item} />
          ))}
        </div>
      ) : !refreshing && providerConfigured && contextInsufficient ? (
        <Panel className="p-7">
          <p className="font-semibold text-midnight">
            Add more Creator DNA or Brand Territories to make Research Pulse
            more relevant.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/brand-territories"
              className="text-sm font-semibold text-primary"
            >
              Brand Territories
            </Link>
            <Link
              to="/add-content"
              search={{}}
              className="text-sm font-semibold text-primary"
            >
              Add Content
            </Link>
          </div>
        </Panel>
      ) : !refreshing && providerConfigured && !message ? (
        <Panel className="p-7">
          <p className="font-semibold text-midnight">No saved research yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Refresh Research Pulse to find current developments connected to
            your Creator DNA.
          </p>
        </Panel>
      ) : null}
    </div>
  );
}

function ResearchCard({ item }: { item: ResearchItem }) {
  return (
    <Panel accent="var(--aqua-accent)" className="p-6 sm:p-8">
      <p className="eyebrow">Source / what happened</p>
      <h2 className="mt-2 text-2xl font-bold text-midnight">{item.headline}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {item.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {item.publishedAt ? (
          <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
        ) : null}
        {item.category ? <span>· {item.category}</span> : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted"
          >
            {source.publisher} <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
      <div className="mt-7 border-t border-border pt-6">
        <p className="eyebrow">Why this matters to you</p>
        <p className="mt-2 text-sm leading-relaxed text-midnight">
          {item.whyItMatters}
        </p>
        {item.matchedTerritory ? (
          <p className="mt-3 text-xs font-semibold text-primary">
            Brand Territory: {item.matchedTerritory}
          </p>
        ) : null}
      </div>
      {item.dnaLinks.length ? (
        <div className="mt-6">
          <p className="eyebrow">Connected to your DNA</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {item.dnaLinks.map((link) => (
              <div
                key={link.node.id}
                className="rounded-xl border border-border bg-muted/60 p-4"
              >
                <KindBadge kind={link.node.type} />
                <p className="mt-2 text-sm font-semibold text-midnight">
                  {link.node.label}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {link.relevanceSummary}
                </p>
                {link.node.sourceTitle ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Source: {link.node.sourceTitle}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Link
        to="/plan"
        search={{ research: item.id }}
        className="motion-cta mt-6 inline-flex items-center gap-2 rounded-xl bg-chartreuse px-5 py-3 text-sm font-bold text-[#050811]"
      >
        Plan around this <ArrowRight className="h-4 w-4" />
      </Link>
    </Panel>
  );
}
