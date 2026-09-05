import { createClient } from "@supabase/supabase-js";

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

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
