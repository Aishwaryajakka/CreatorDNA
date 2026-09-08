import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  AtSign,
  CheckCircle2,
  Download,
  ExternalLink,
  Linkedin,
  Link2Off,
  Loader2,
  X as CloseIcon,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/profile";
import type {
  IntegrationStatus,
  SanitizedSocialConnection,
  SocialProvider,
} from "@/lib/oauth/types";
import { PageHeader, Panel } from "@/components/dna-ui";
import { ThemeToggle } from "@/components/ThemeProvider";
export const Route = createFileRoute("/profile")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    linkedin?: "connected" | "error";
    x?: "connected" | "error";
  } => ({
    ...(search["linkedin"] === "connected" || search["linkedin"] === "error"
      ? { linkedin: search["linkedin"] }
      : {}),
    ...(search["x"] === "connected" || search["x"] === "error"
      ? { x: search["x"] }
      : {}),
  }),
  component: ProfilePage,
});
function ProfilePage() {
  const search = Route.useSearch();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(
    null,
  );
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [integrationBusy, setIntegrationBusy] = useState<SocialProvider | null>(
    null,
  );
  useEffect(() => {
    void authenticatedFetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setUsername(p.username ?? "");
      });
  }, []);
  useEffect(() => {
    void authenticatedFetch("/api/integrations")
      .then(async (response) => {
        const body = (await response.json()) as IntegrationStatus & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error ?? "Unable to load connected accounts.");
        setIntegrations(body);
      })
      .catch((error: unknown) =>
        setIntegrationMessage(
          error instanceof Error
            ? error.message
            : "Unable to load connected accounts.",
        ),
      );
  }, []);

  async function connect(provider: SocialProvider) {
    if (integrationBusy) return;
    setIntegrationBusy(provider);
    setIntegrationMessage("");
    try {
      const response = await authenticatedFetch(
        `/api/integrations/${provider}/connect`,
      );
      const body = (await response.json()) as {
        authorizationUrl?: string;
        error?: string;
      };
      if (!response.ok || !body.authorizationUrl)
        throw new Error(body.error ?? "Unable to connect account.");
      const authorizationUrl = new URL(body.authorizationUrl);
      const allowedHost =
        provider === "linkedin" ? "www.linkedin.com" : "x.com";
      if (
        authorizationUrl.protocol !== "https:" ||
        authorizationUrl.hostname !== allowedHost
      )
        throw new Error("The provider returned an invalid authorization URL.");
      window.location.assign(authorizationUrl);
    } catch (error) {
      setIntegrationMessage(
        error instanceof Error ? error.message : "Unable to connect account.",
      );
      setIntegrationBusy(null);
    }
  }

  async function disconnect(provider: SocialProvider) {
    if (integrationBusy) return;
    setIntegrationBusy(provider);
    setIntegrationMessage("");
    try {
      const response = await authenticatedFetch(
        `/api/integrations/${provider}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Unable to disconnect account.");
      setIntegrations((current) =>
        current
          ? {
              ...current,
              [provider]: {
                provider,
                available: current[provider].available,
                connected: false,
              },
            }
          : current,
      );
      setIntegrationMessage(
        `${provider === "linkedin" ? "LinkedIn" : "X"} disconnected.`,
      );
    } catch (error) {
      setIntegrationMessage(
        error instanceof Error
          ? error.message
          : "Unable to disconnect account.",
      );
    } finally {
      setIntegrationBusy(null);
    }
  }
  async function save() {
    setSaving(true);
    setMessage("");
    const r = await authenticatedFetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username }),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) {
      setMessage(data.error);
      return;
    }
    setProfile(data);
    setMessage("Profile updated.");
  }
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Profile"
        title="Manage how you appear in Creator DNA."
      />
      <div className="telemetry-edge telemetry-grid mx-auto max-w-3xl rounded-2xl border border-obsidian-border bg-obsidian-card px-6 py-5 sm:px-8">
        <p className="eyebrow text-midnight/70">Your creator workspace</p>
        <p className="mt-2 text-lg font-bold text-midnight">
          Keep your identity and appearance current.
        </p>
      </div>
      <Panel
        accent="var(--experience)"
        className="mx-auto max-w-3xl p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-experience text-lg font-bold text-midnight">
            {profile?.displayName
              ?.split(/\s+/)
              .map((x: string) => x[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "…"}
          </div>
          <div>
            <p className="font-semibold text-midnight">
              {profile?.displayName || "Loading…"}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile ? `@${profile.username}` : ""}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={
                !profile ||
                (!!profile.profileChangedAt &&
                  Date.now() - Date.parse(profile.profileChangedAt) <
                    2592000000)
              }
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={
                !profile ||
                (!!profile.profileChangedAt &&
                  Date.now() - Date.parse(profile.profileChangedAt) <
                    2592000000)
              }
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              readOnly
              value={profile?.email || ""}
              className="mt-1 w-full rounded-xl border border-input bg-muted px-3 py-2.5"
            />
          </label>
          {profile?.profileChangedAt && (
            <p className="text-sm text-muted-foreground">
              You can change your name or username again on{" "}
              {new Date(
                Date.parse(profile.profileChangedAt) + 2592000000,
              ).toLocaleDateString()}
              .
            </p>
          )}
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          <button
            onClick={() => void save()}
            disabled={
              saving ||
              !profile ||
              (!!profile.profileChangedAt &&
                Date.now() - Date.parse(profile.profileChangedAt) < 2592000000)
            }
            className="motion-cta glow-lime rounded-xl bg-chartreuse px-5 py-2.5 font-semibold text-[#050811] hover:bg-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <div>
            <p className="font-semibold text-midnight">Appearance</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the theme for your Creator DNA workspace.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Panel>
      <Panel accent="var(--primary)" className="mx-auto max-w-3xl p-6 sm:p-8">
        <h2 className="text-xl font-bold text-midnight">Connected accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect creator identities without changing how you sign in to Creator
          DNA.
        </p>
        {(search.linkedin || search.x) && (
          <p className="mt-4 rounded-xl border border-border bg-muted p-3 text-sm text-midnight">
            {search.linkedin === "connected"
              ? "LinkedIn connected successfully."
              : search.x === "connected"
                ? "X connected successfully."
                : "The account could not be connected. Please try again."}
          </p>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <IntegrationCard
            provider="linkedin"
            title="LinkedIn"
            icon={<Linkedin className="h-5 w-5" />}
            connection={integrations?.linkedin ?? null}
            busy={integrationBusy === "linkedin"}
            onConnect={connect}
            onDisconnect={disconnect}
          />
          <IntegrationCard
            provider="x"
            title="X"
            icon={<AtSign className="h-5 w-5" />}
            connection={integrations?.x ?? null}
            busy={integrationBusy === "x"}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
        {integrationMessage && (
          <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
            {integrationMessage}
          </p>
        )}
      </Panel>
    </div>
  );
}

function IntegrationCard({
  provider,
  title,
  icon,
  connection,
  busy,
  onConnect,
  onDisconnect,
}: {
  provider: SocialProvider;
  title: string;
  icon: ReactNode;
  connection:
    | SanitizedSocialConnection
    | { provider: SocialProvider; connected: false }
    | null;
  busy: boolean;
  onConnect: (provider: SocialProvider) => Promise<void>;
  onDisconnect: (provider: SocialProvider) => Promise<void>;
}) {
  const connected = connection?.connected === true ? connection : null;
  return (
    <article className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-3">
        {connected?.avatarUrl ? (
          <img
            src={connected.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary">
            {icon}
          </span>
        )}
        <div>
          <h3 className="font-bold text-midnight">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {connected
              ? `Connected as ${connected.username ? `@${connected.username}` : connected.displayName || title}`
              : "Not connected"}
          </p>
        </div>
      </div>
      {connected ? (
        <div className="mt-5 space-y-3">
          {provider === "linkedin" ? (
            <>
              <Link
                to="/add-content"
                search={{ platform: "linkedin" }}
                className="block rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                Add LinkedIn content manually
              </Link>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Direct LinkedIn post import is waiting on additional LinkedIn
                API permissions. Your account is connected, and direct import
                will be available once those permissions are approved.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/import"
                search={{ source: "x" }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                Import recent posts
              </Link>
              <Link
                to="/add-content"
                search={{ platform: "x" }}
                className="block rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold text-midnight hover:bg-muted"
              >
                Add X content manually
              </Link>
            </div>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDisconnect(provider)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-midnight hover:bg-muted disabled:opacity-50"
          >
            <Link2Off className="h-4 w-4" />
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || connection === null}
          onClick={() => void onConnect(provider)}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Connecting…" : `Connect ${title}`}
        </button>
      )}
    </article>
  );
}

type RecentXPost = {
  id: string;
  text: string;
  createdAt: string | null;
  url: string | null;
  alreadyImported: boolean;
};

type XImportResult = {
  tweetId: string;
  status: "imported" | "already_imported" | "failed";
  contentId?: string;
  error?: string;
};

export function XImportPanel({ onClose }: { onClose: () => void }) {
  const [posts, setPosts] = useState<RecentXPost[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<XImportResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [capabilityUnavailable, setCapabilityUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void authenticatedFetch("/api/integrations/x/posts")
      .then(async (response) => {
        const body = (await response.json()) as {
          posts?: RecentXPost[];
          error?: string;
          code?: string;
          status?:
            "success" | "empty" | "api_access_unavailable" | "temporary_error";
          message?: string;
        };
        if (body.status === "api_access_unavailable") {
          if (active) {
            setCapabilityUnavailable(true);
            setError("");
          }
          return;
        }
        if (!response.ok) {
          throw new Error(
            body.message ?? body.error ?? "Unable to load recent X posts.",
          );
        }
        if (active) setPosts(body.posts ?? []);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load recent X posts.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const availablePosts = posts.filter((post) => !post.alreadyImported);
  const importedCount = results.filter(
    (result) => result.status === "imported",
  ).length;
  const alreadyImportedCount = results.filter(
    (result) => result.status === "already_imported",
  ).length;
  const failedCount = results.filter(
    (result) => result.status === "failed",
  ).length;

  function togglePost(postId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  async function importSelected() {
    if (!selectedIds.size || importing) return;
    setImporting(true);
    setError("");
    setResults([]);
    try {
      const response = await authenticatedFetch("/api/integrations/x/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tweetIds: Array.from(selectedIds) }),
      });
      const body = (await response.json()) as {
        results?: XImportResult[];
        error?: string;
        code?: string;
        status?: "success" | "api_access_unavailable" | "temporary_error";
        message?: string;
      };
      if (body.status === "api_access_unavailable") {
        setCapabilityUnavailable(true);
        setError("");
        return;
      }
      if (!response.ok || !body.results) {
        if (body.code === "x_api_access_unavailable")
          setCapabilityUnavailable(true);
        throw new Error(
          body.message ??
            body.error ??
            "Unable to import the selected X posts.",
        );
      }
      setResults(body.results);
      const completedIds = new Set(
        body.results
          .filter((result) => result.status !== "failed")
          .map((result) => result.tweetId),
      );
      setPosts((current) =>
        current.map((post) =>
          completedIds.has(post.id) ? { ...post, alreadyImported: true } : post,
        ),
      );
      setSelectedIds(new Set());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to import the selected X posts.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-midnight">Import from X</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose original recent posts to add to your Creator DNA.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close X post importer"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-midnight"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading recent posts…
        </div>
      ) : capabilityUnavailable ? (
        <div className="mt-6 rounded-xl border border-border bg-muted p-4">
          <p className="text-sm font-semibold text-midnight">
            Your X account is still connected.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your X account is connected. Direct post import is waiting on the
            required X API access and will be available once that access is
            approved.
          </p>
          <Link
            to="/add-content"
            search={{ platform: "x" }}
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Add X content manually
          </Link>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-border bg-muted p-4">
          <p className="text-sm text-midnight">{error}</p>
          <Link
            to="/add-content"
            search={{ platform: "x" }}
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Add X content manually
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setSelectedIds(new Set(availablePosts.map((post) => post.id)))
              }
              disabled={!availablePosts.length || importing}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-midnight hover:bg-muted disabled:opacity-50"
            >
              Select all available
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={!selectedIds.size || importing}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-midnight hover:bg-muted disabled:opacity-50"
            >
              Clear selection
            </button>
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} selected
            </span>
          </div>

          <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {posts.length ? (
              posts.map((post) => (
                <label
                  key={post.id}
                  className={`flex gap-3 rounded-xl border p-4 ${
                    post.alreadyImported
                      ? "border-border bg-muted/60"
                      : "border-border bg-card hover:border-primary/45"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(post.id)}
                    disabled={post.alreadyImported || importing}
                    onChange={() => togglePost(post.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-pre-wrap text-sm leading-relaxed text-midnight">
                      {post.text}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {post.createdAt
                        ? formatXDate(post.createdAt)
                        : "Date unavailable"}
                      {post.url ? (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary"
                        >
                          View on X <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                      {post.alreadyImported ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-theme-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Already
                          imported
                        </span>
                      ) : null}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                No original recent posts were returned by X.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void importSelected()}
            disabled={!selectedIds.size || importing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {importing
              ? `Importing ${selectedIds.size} ${selectedIds.size === 1 ? "post" : "posts"}…`
              : "Import selected into Creator DNA"}
          </button>

          {results.length ? (
            <div className="mt-5 rounded-xl border border-theme/40 bg-theme/10 p-4">
              <p className="font-semibold text-midnight">
                Your X posts are now part of Creator DNA.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {importedCount} imported · {alreadyImportedCount} already in
                your DNA · {failedCount} failed
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {results.map((result) => (
                  <li key={result.tweetId}>
                    Post {result.tweetId}: {result.status.replace("_", " ")}
                    {result.error ? ` — ${result.error}` : ""}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/story-map"
                  search={{}}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  View Story Map
                </Link>
                <Link
                  to="/library"
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-midnight hover:bg-muted"
                >
                  View Content Library
                </Link>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function formatXDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}
