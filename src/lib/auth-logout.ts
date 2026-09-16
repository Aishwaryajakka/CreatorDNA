import type { AuthError } from "@supabase/supabase-js";
import { cancelAuthenticatedRequests, supabase } from "@/lib/supabase/client";

export type LogoutSource =
  "sidebar" | "demo-exit" | "persona-switch" | "demo-build" | "start-demo";

let logoutInProgress: Promise<void> | null = null;

function alreadySignedOut(error: AuthError) {
  return (
    [401, 403, 404].includes(error.status ?? 0) ||
    error.code === "session_not_found" ||
    error.name === "AuthSessionMissingError"
  );
}

async function deleteDemoAccount() {
  const response = await fetch("/api/auth/demo", {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (response.ok || response.status === 403 || response.status === 404) return;

  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  throw new Error(body?.error ?? "Unable to close demo session.");
}

/**
 * The one application-owned session termination path. Navigation and demo UI
 * cleanup remain with the caller so auth state always settles before routing.
 */
export function logout(source: LogoutSource): Promise<void> {
  if (import.meta.env.DEV)
    console.debug("[auth] logout requested", {
      source,
      timestamp: new Date().toISOString(),
    });

  if (logoutInProgress) return logoutInProgress;

  logoutInProgress = (async () => {
    const { data } = await supabase.auth.getSession();
    const hasDemoCleanup =
      data.session?.user.app_metadata["demo_cleanup_cookie"] === true;

    // Abort protected work before the token is revoked. The generation guard in
    // authenticatedFetch also blocks requests still waiting for getSession().
    cancelAuthenticatedRequests();

    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error && !alreadySignedOut(error)) throw error;

    // The logout endpoint must run while the ephemeral user still exists. Once
    // Supabase has cleared local auth, the HttpOnly capability can safely delete
    // only the demo user that created it.
    if (hasDemoCleanup) await deleteDemoAccount();
  })().finally(() => {
    logoutInProgress = null;
  });

  return logoutInProgress;
}
