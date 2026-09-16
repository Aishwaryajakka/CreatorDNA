import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw } from "lucide-react";

import { KindBadge, PageHeader, Panel, SourceLink } from "@/components/dna-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResearchItem, ResearchWindow } from "@/lib/research/types";
import { authenticatedFetch } from "@/lib/supabase/client";
import { useDemoMode } from "@/lib/demo-mode";

export const Route = createFileRoute("/research")({ component: ResearchPage });

function ResearchPage() {
  const demo = useDemoMode();
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [window, setWindow] = useState<ResearchWindow>("7d");
  const [providerConfigured, setProviderConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [contextInsufficient, setContextInsufficient] = useState(false);
  const autoRefreshed = useRef(false);
  const demoActiveAtMount = useRef(demo.active);

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
        if (
          !saved.length &&
          configured &&
          !demoActiveAtMount.current &&
          !autoRefreshed.current
        ) {
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

  useEffect(() => {
    if (demo.active && !demo.researchReady && !loading && items.length)
      demo.markResearchReady();
  }, [demo, items.length, loading]);

  return (
    <div className="space-y-8" data-demo-target="research-pulse">
      <PageHeader
        eyebrow="Research Pulse"
        title="What's happening around your story?"
        subtitle="Current developments connected to the ideas, beliefs, and territories already shaping your Creator DNA."
      />
      {demo.active ? (
        <Panel
          accent="var(--aqua-accent)"
          className="p-5 text-sm leading-relaxed text-muted-foreground"
        >
          <strong className="text-midnight">Creator DNA</strong> is personal
          evidence from your history.{" "}
          <strong className="text-midnight">Research</strong> is cited external
          evidence about what matters now. The two stay distinct.
        </Panel>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {(["24h", "7d"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              onClick={() => setWindow(value)}
              variant="filter"
              size="sm"
              className={cn(
                window === value &&
                  "border-aqua-accent bg-aqua-accent/10 text-midnight",
              )}
            >
              {value === "24h" ? "24 hours" : "7 days"}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          disabled={refreshing || !providerConfigured || demo.active}
          title={
            demo.active
              ? "Refresh is disabled to keep the shared demo data unchanged."
              : undefined
          }
          onClick={() => void refresh(window)}
          variant="product"
          size="md"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh Research Pulse
        </Button>
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
          {items.map((item, index) => (
            <ResearchCard key={item.id} item={item} featured={index === 0} />
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

function ResearchCard({
  item,
  featured,
}: {
  item: ResearchItem;
  featured: boolean;
}) {
  return (
    <Panel
      accent="var(--aqua-accent)"
      className="p-6 sm:p-8"
      data-demo-target={featured ? "research-result" : undefined}
    >
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
      <div
        className="research-source-area mt-5 rounded-xl border border-border bg-muted/50 p-4"
        data-demo-target={featured ? "research-source" : undefined}
      >
        <p className="eyebrow mb-3">Sources</p>
        <div className="flex flex-wrap gap-2">
          {item.sources.map((source, index) => (
            <SourceLink key={source.url} href={source.url}>
              {source.publisher || `Source ${index + 1}`}
            </SourceLink>
          ))}
        </div>
      </div>
      <div className="mt-7 rounded-xl border-l-4 border-aqua-accent bg-muted/60 p-5">
        <p className="eyebrow text-primary">Why this matters to your story</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-midnight">
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
        className={cn(
          buttonVariants({ variant: "primary", size: "md" }),
          "mt-6",
        )}
      >
        PLAN AROUND THIS <ArrowRight />
      </Link>
    </Panel>
  );
}
