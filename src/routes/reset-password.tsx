import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, LockKeyhole } from "lucide-react";
import { AdaptiveCreatorDNALogo } from "@/components/Logo";
import { supabase } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeProvider";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")
        setReady(true);
    });
    void supabase.auth
      .getSession()
      .then(({ data }) => setReady(Boolean(data.session)));
    return () => listener.subscription.unsubscribe();
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (result.error)
      setError(
        "This recovery link may be expired. Request a new one and try again.",
      );
    else setSuccess(true);
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            aria-label="Creator DNA home"
            className="logo-link inline-flex rounded-lg"
          >
            <AdaptiveCreatorDNALogo showTagline={false} className="h-14 w-48" />
          </Link>
          <ThemeToggle
            variant="icon"
            className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          />
        </div>
        <div className="mt-12 rounded-2xl border border-border bg-card p-7 shadow-card sm:p-9">
          <p className="eyebrow text-primary">Account security</p>
          <h1 className="mt-3 text-3xl font-extrabold text-midnight">
            Set a new password
          </h1>
          {success ? (
            <div className="mt-6">
              <p className="flex gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Your password has been updated.
              </p>
              <button
                type="button"
                onClick={() => void navigate({ to: "/" })}
                className="motion-cta glow-lime mt-6 w-full rounded-xl bg-chartreuse px-4 py-3.5 text-sm font-bold text-[#050811] hover:bg-white"
              >
                Continue to Creator DNA
              </button>
            </div>
          ) : !ready ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Open the password recovery link from your email to continue. If it
              has expired, return to login and request a new one.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-midnight">
                New password
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 outline-none focus:border-primary"
                />
              </label>
              <label className="block text-sm font-semibold text-midnight">
                Confirm password
                <input
                  required
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 outline-none focus:border-primary"
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <button
                disabled={loading}
                className="motion-cta glow-lime w-full rounded-xl bg-chartreuse px-4 py-3.5 text-sm font-bold text-[#050811] hover:bg-white disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <LockKeyhole className="h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
