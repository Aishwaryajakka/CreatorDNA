import { FormEvent, ReactNode, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { AdaptiveCreatorDNALogo } from "@/components/Logo";
import { supabase } from "@/lib/supabase/client";
import { useAuthState } from "@/lib/auth-state";
import { ThemeToggle } from "@/components/ThemeProvider";
import { DNAStrandGraphic, SignalPath } from "@/components/Motion";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { status } = useAuthState();
  const [identity, setIdentity] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (status === "authenticated") void navigate({ to: "/" });
  }, [navigate, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    if (forgot) {
      const result = await supabase.auth.resetPasswordForEmail(identity, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (result.error)
        setError(
          "We couldn't send that reset email. Check the address and try again.",
        );
      else
        setMessage(
          "If an account matches that email, you'll receive a password reset link shortly.",
        );
      return;
    }
    const authResult = signUp
      ? await supabase.auth.signUp({
          email: identity,
          password,
          options: { data: { display_name: displayName, username } },
        })
      : identity.includes("@")
        ? await supabase.auth.signInWithPassword({ email: identity, password })
        : await fetch("/api/auth/username-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identity, password }),
          }).then(async (response) => {
            const data = await response.json();
            return response.ok
              ? await supabase.auth.setSession(data.session)
              : { error: new Error(data.error), data: { session: null } };
          });
    setLoading(false);
    if (authResult.error) setError(authResult.error.message);
    else if (signUp && !authResult.data.session)
      setMessage(
        "Check your email to confirm your account, then come back to complete your foundation.",
      );
    else void navigate({ to: signUp ? "/onboarding" : "/" });
  }

  return (
    <main className="grid min-h-screen bg-obsidian-base lg:grid-cols-[46fr_54fr]">
      <section className="telemetry-grid relative hidden border-r border-obsidian-border bg-obsidian-surface p-10 text-foreground lg:flex lg:items-center lg:justify-center">
        <DNAStrandGraphic className="absolute inset-0 h-full w-full opacity-70" />
        <SignalPath className="absolute bottom-[12%] left-[8%] h-48 w-[84%] opacity-60" />
        <div className="relative z-10 max-w-lg">
          <div className="mb-12 flex justify-center">
            <AdaptiveCreatorDNALogo className="h-32 w-full max-w-[32rem]" />
          </div>
          <p className="eyebrow text-experience">
            Memory for your personal brand
          </p>
          <h1 className="marketing-display mt-5">
            Most AI starts with a blank prompt.
            <br />
            <span className="text-belief">Creator DNA starts with you.</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Your stories, beliefs, and evolving perspective—connected,
            searchable, and ready when your next idea arrives.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 font-mono text-xs font-semibold text-muted-foreground">
            <span className="rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-2">
              Story Graph
            </span>
            <span className="rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-2">
              Evidence-first
            </span>
            <span className="rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-2">
              Built from you
            </span>
          </div>
        </div>
        <p className="absolute bottom-10 left-10 font-mono text-xs text-muted-foreground">
          Your stories. A brighter tomorrow.
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="telemetry-edge telemetry-card w-full max-w-[29rem] rounded-2xl border border-obsidian-border bg-obsidian-card p-7 sm:p-9">
          <div className="mb-4 flex justify-end">
            <ThemeToggle
              variant="icon"
              className="grid h-10 w-10 place-items-center rounded-xl border border-obsidian-border bg-obsidian-surface text-muted-foreground transition-colors hover:border-aqua-accent/60 hover:text-foreground"
            />
          </div>
          <div className="mb-10 lg:hidden">
            <AdaptiveCreatorDNALogo showTagline={false} className="h-14 w-48" />
          </div>
          <div className="mb-8">
            <p className="eyebrow text-primary">
              {forgot
                ? "Reset access"
                : signUp
                  ? "Start your memory"
                  : "Welcome back"}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-midnight">
              {forgot
                ? "Reset your password"
                : signUp
                  ? "Create your Creator DNA"
                  : "Continue your story."}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {forgot
                ? "Enter your email and we'll send you a secure recovery link."
                : signUp
                  ? "A few minutes of foundation gives every future idea more context."
                  : "Sign in to pick up where your story left off."}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {signUp ? (
              <>
                <Field label="Display name">
                  <input
                    required
                    minLength={2}
                    maxLength={50}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </Field>
                <Field label="Username">
                  <input
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9_.]+"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value.toLowerCase())
                    }
                  />
                </Field>
              </>
            ) : null}
            <Field label={forgot || signUp ? "Email" : "Email or username"}>
              <input
                required
                type={forgot || signUp ? "email" : "text"}
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                autoComplete="username"
              />
            </Field>
            {!forgot ? (
              <Field label="Password">
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={signUp ? "new-password" : "current-password"}
                />
              </Field>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {message ? (
              <p
                role="status"
                className="flex gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {message}
              </p>
            ) : null}
            <button
              disabled={loading}
              className="motion-cta glow-lime inline-flex w-full items-center justify-center gap-2 rounded-xl bg-chartreuse px-4 py-3.5 font-sans text-sm font-black text-[#050811] hover:bg-white disabled:opacity-60"
            >
              {loading
                ? "Please wait…"
                : forgot
                  ? "Send reset link"
                  : signUp
                    ? "Create account"
                    : "Log in"}
              {!loading && !forgot ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>
          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            {!signUp && !forgot ? (
              <button
                type="button"
                onClick={() => {
                  setForgot(true);
                  setError("");
                }}
                className="font-semibold text-primary hover:underline"
              >
                Forgot password?
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setSignUp(!signUp);
                setForgot(false);
                setError("");
                setMessage("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {signUp
                ? "Already have an account? Log in"
                : "New to Creator DNA? Create account"}
            </button>
            {forgot ? (
              <button
                type="button"
                onClick={() => {
                  setForgot(false);
                  setError("");
                  setMessage("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Back to login
              </button>
            ) : null}
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole className="h-3.5 w-3.5" /> Your content stays yours.
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block font-mono text-xs font-semibold uppercase tracking-wide text-foreground">
      <span>{label}</span>
      <span className="mt-2 block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-obsidian-border [&_input]:bg-obsidian-base [&_input]:px-4 [&_input]:py-3.5 [&_input]:font-sans [&_input]:text-sm [&_input]:normal-case [&_input]:tracking-normal [&_input]:outline-none [&_input]:focus:border-aqua-accent">
        {children}
      </span>
    </label>
  );
}
