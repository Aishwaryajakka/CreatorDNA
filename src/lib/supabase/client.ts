import { createClient } from "@supabase/supabase-js";
import { isDemoSession } from "@/lib/demo-session";

function requiredEnv(
  name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_PUBLISHABLE_KEY",
): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const supabase = createClient(
  requiredEnv("VITE_SUPABASE_URL"),
  requiredEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
);

const authenticatedRequestControllers = new Set<AbortController>();
let authenticatedRequestGeneration = 0;

export function cancelAuthenticatedRequests() {
  authenticatedRequestGeneration += 1;
  for (const controller of authenticatedRequestControllers) controller.abort();
  authenticatedRequestControllers.clear();
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const requestGeneration = authenticatedRequestGeneration;
  const method = init.method?.toUpperCase() ?? "GET";
  const path =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.pathname
        : new URL(input.url).pathname;
  const demoWriteAllowed = [
    "/api/plan-content",
    "/api/reshape-content",
    "/api/auth/demo",
  ].includes(path);
  if (
    isDemoSession() &&
    !["GET", "HEAD"].includes(method) &&
    !demoWriteAllowed
  ) {
    return new Response(
      JSON.stringify({
        error: "This action is disabled in Demo Mode to protect shared data.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
  const token = await getAccessToken();
  if (!token || requestGeneration !== authenticatedRequestGeneration) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  authenticatedRequestControllers.add(controller);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(input, { ...init, headers, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw error;
  } finally {
    init.signal?.removeEventListener("abort", abort);
    authenticatedRequestControllers.delete(controller);
  }
}
