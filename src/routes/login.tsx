import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUp, setSignUp] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/" });
    });
  }, [navigate]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = signUp
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
    if (result.error) setError(result.error.message);
    else if (signUp && !result.data.session)
      setError("Check your email to confirm your account.");
    else void navigate({ to: "/" });
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to Creator DNA
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {signUp
              ? "Create your story intelligence workspace."
              : "Sign in to your story intelligence workspace."}
          </p>
        </div>
        {signUp && (
          <>
            <input
              required
              minLength={2}
              maxLength={50}
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5"
            />
            <input
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_.]+"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5"
            />
          </>
        )}
        <input
          required
          type={signUp ? "email" : "text"}
          placeholder={signUp ? "Email" : "Username or email"}
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5"
        />
        <input
          required
          minLength={6}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Please wait…" : signUp ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSignUp(!signUp);
            setError("");
          }}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {signUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </form>
    </main>
  );
}
