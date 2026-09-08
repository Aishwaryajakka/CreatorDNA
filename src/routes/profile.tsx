import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/profile";
import { PageHeader, Panel } from "@/components/dna-ui";
import { ThemeToggle } from "@/components/ThemeProvider";
export const Route = createFileRoute("/profile")({ component: ProfilePage });
function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    void authenticatedFetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setUsername(p.username ?? "");
      });
  }, []);
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
    </div>
  );
}
