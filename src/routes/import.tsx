import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign, Linkedin, Loader2, Youtube } from "lucide-react";
import { z } from "zod";

import { PageHeader, Panel } from "@/components/dna-ui";
import type {
  IntegrationStatus,
  SanitizedSocialConnection,
  SocialProvider,
} from "@/lib/oauth/types";
import { authenticatedFetch } from "@/lib/supabase/client";
import { YouTubeImportWorkspace } from "@/components/import/YouTubeImportWorkspace";
import { XImportPanel } from "./profile";

const importSourceSchema = z.enum(["youtube", "linkedin", "x"]);
type ImportSource = z.infer<typeof importSourceSchema>;

export const Route = createFileRoute("/import")({
  validateSearch: z.object({
    source: importSourceSchema.catch("youtube"),
  }),
  component: ImportContentPage,
});

const providerTabs: Array<{
  value: ImportSource;
  label: string;
  icon: typeof Youtube;
}> = [
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "x", label: "X", icon: AtSign },
];

function ImportContentPage() {
  const { source } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(
    null,
  );
  const [statusError, setStatusError] = useState("");
  const [connecting, setConnecting] = useState<SocialProvider | null>(null);
  const [xPostsOpen, setXPostsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void authenticatedFetch("/api/integrations")
      .then(async (response) => {
        const body = (await response.json()) as IntegrationStatus & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error ?? "Couldn't load connected accounts.");
        if (active) setIntegrations(body);
      })
      .catch((error: unknown) => {
        if (active)
          setStatusError(
            error instanceof Error
              ? error.message
              : "Couldn't load connected accounts.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (source !== "x") setXPostsOpen(false);
  }, [source]);

  async function connect(provider: SocialProvider) {
    if (connecting) return;
    setConnecting(provider);
    setStatusError("");
    try {
      const response = await authenticatedFetch(
        `/api/integrations/${provider}/connect`,
      );
      const body = (await response.json()) as {
        authorizationUrl?: string;
        error?: string;
      };
      if (!response.ok || !body.authorizationUrl)
        throw new Error(
          body.error ??
            `${provider === "x" ? "X" : "LinkedIn"} connection could not be completed.`,
        );
      const authorizationUrl = new URL(body.authorizationUrl);
      const expectedHost =
        provider === "linkedin" ? "www.linkedin.com" : "x.com";
      if (
        authorizationUrl.protocol !== "https:" ||
        authorizationUrl.hostname !== expectedHost
      ) {
        throw new Error("The provider returned an invalid authorization URL.");
      }
      window.location.assign(authorizationUrl);
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : `${provider === "x" ? "X" : "LinkedIn"} connection could not be completed.`,
      );
      setConnecting(null);
    }
  }

  function selectSource(nextSource: ImportSource) {
    void navigate({ search: { source: nextSource }, replace: true });
  }

  function handleTabKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight")
      nextIndex = (index + 1) % providerTabs.length;
    if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + providerTabs.length) % providerTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = providerTabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextSource = providerTabs[nextIndex]?.value;
    if (!nextSource) return;
    selectSource(nextSource);
    document.getElementById(`import-tab-${nextSource}`)?.focus();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Import Content"
        title="Bring your published work into Creator DNA"
        subtitle="Import the content you've already published so Creator DNA can remember your stories, beliefs, experiences, and evolving perspective."
      />

      <div
        role="tablist"
        aria-label="Content source"
        className="flex max-w-full gap-2 overflow-x-auto rounded-xl border border-border bg-card p-1.5"
      >
        {providerTabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = source === tab.value;
          return (
            <button
              key={tab.value}
              id={`import-tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="import-provider-workspace"
              tabIndex={active ? 0 : -1}
              onClick={() => selectSource(tab.value)}
              onKeyDown={(event) => handleTabKey(event, index)}
              className={`inline-flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-midnight"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <section
        id="import-provider-workspace"
        role="tabpanel"
        aria-labelledby={`import-tab-${source}`}
        className="min-w-0"
      >
        {source === "youtube" ? (
          <YouTubeImportWorkspace showPageHeader={false} />
        ) : source === "linkedin" ? (
          <LinkedInWorkspace
            connection={integrations?.linkedin ?? null}
            loading={!integrations && !statusError}
            connecting={connecting === "linkedin"}
            onConnect={() => void connect("linkedin")}
          />
        ) : (
          <XWorkspace
            connection={integrations?.x ?? null}
            loading={!integrations && !statusError}
            connecting={connecting === "x"}
            postsOpen={xPostsOpen}
            onConnect={() => void connect("x")}
            onLoadPosts={() => setXPostsOpen(true)}
            onClosePosts={() => setXPostsOpen(false)}
          />
        )}
      </section>

      {statusError && source !== "youtube" ? (
        <p role="alert" className="text-sm text-destructive">
          {statusError}
        </p>
      ) : null}
    </div>
  );
}

function LinkedInWorkspace({
  connection,
  loading,
  connecting,
  onConnect,
}: {
  connection: IntegrationStatus["linkedin"] | null;
  loading: boolean;
  connecting: boolean;
  onConnect: () => void;
}) {
  const connected = connection?.connected === true ? connection : null;
  return (
    <ProviderWorkspace
      icon={<Linkedin className="h-5 w-5" />}
      title="Bring your LinkedIn perspective into Creator DNA."
      description="Connect LinkedIn to identify your account and make it easier to add the posts that shaped your professional story."
      connected={Boolean(connected)}
    >
      {loading ? (
        <LoadingAccount />
      ) : connected ? (
        <>
          <ConnectionIdentity connection={connected} providerLabel="LinkedIn" />
          <Link
            to="/add-content"
            search={{ platform: "linkedin" }}
            className="motion-cta mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Add LinkedIn content manually
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Direct LinkedIn post import is waiting on additional LinkedIn API
            permissions. Your account is connected, and direct import will be
            available once those permissions are approved.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            For now, paste any LinkedIn post you want Creator DNA to remember.
          </p>
        </>
      ) : (
        <ConnectButton
          label="Connect LinkedIn"
          loading={connecting}
          onClick={onConnect}
        />
      )}
    </ProviderWorkspace>
  );
}

function XWorkspace({
  connection,
  loading,
  connecting,
  postsOpen,
  onConnect,
  onLoadPosts,
  onClosePosts,
}: {
  connection: IntegrationStatus["x"] | null;
  loading: boolean;
  connecting: boolean;
  postsOpen: boolean;
  onConnect: () => void;
  onLoadPosts: () => void;
  onClosePosts: () => void;
}) {
  const connected = connection?.connected === true ? connection : null;
  return (
    <ProviderWorkspace
      icon={<AtSign className="h-5 w-5" />}
      title="Bring your recent X posts into your Story Map."
      description="Connect X to import your recent posts into Creator DNA."
      connected={Boolean(connected)}
    >
      {loading ? (
        <LoadingAccount />
      ) : connected ? (
        <>
          <ConnectionIdentity connection={connected} providerLabel="X" />
          {!postsOpen ? (
            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onLoadPosts}
                  className="motion-cta inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Load recent posts
                </button>
                <Link
                  to="/add-content"
                  search={{ platform: "x" }}
                  className="inline-flex rounded-xl border border-border px-5 py-3 text-sm font-semibold text-midnight hover:bg-muted"
                >
                  Add X content manually
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Recent-post import depends on your X API access level. Your
                connected account remains available even when direct import is
                not.
              </p>
            </div>
          ) : (
            <XImportPanel onClose={onClosePosts} />
          )}
        </>
      ) : (
        <ConnectButton
          label="Connect X"
          loading={connecting}
          onClick={onConnect}
        />
      )}
    </ProviderWorkspace>
  );
}

function ProviderWorkspace({
  icon,
  title,
  description,
  connected,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  connected: boolean;
  children: ReactNode;
}) {
  return (
    <Panel accent="var(--experience)" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <h2 className="display-title mt-5 text-2xl text-midnight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            connected
              ? "border-theme/40 bg-theme/10 text-midnight"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <div className="mt-7 border-t border-border pt-6">{children}</div>
    </Panel>
  );
}

function ConnectionIdentity({
  connection,
  providerLabel,
}: {
  connection: SanitizedSocialConnection;
  providerLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {connection.avatarUrl ? (
        <img
          src={connection.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-11 w-11 rounded-full object-cover"
        />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-full bg-muted text-primary">
          {providerLabel === "X" ? (
            <AtSign className="h-5 w-5" />
          ) : (
            <Linkedin className="h-5 w-5" />
          )}
        </span>
      )}
      <div>
        <p className="font-semibold text-midnight">
          {connection.username
            ? `@${connection.username}`
            : connection.displayName || providerLabel}
        </p>
        <p className="text-xs text-muted-foreground">Connected</p>
      </div>
    </div>
  );
}

function ConnectButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="motion-cta inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {loading ? "Connecting…" : label}
    </button>
  );
}

function LoadingAccount() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading account status…
    </div>
  );
}
