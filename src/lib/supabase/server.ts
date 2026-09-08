/// <reference types="node" />

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// SERVER-ONLY: never import this module from browser components or client routes.
// The secret key bypasses Supabase Row Level Security and must remain private.
function requiredServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

function createServerClient(
  keyName: "SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SECRET_KEY",
) {
  return createClient<Database>(
    requiredServerEnv("SUPABASE_URL"),
    requiredServerEnv(keyName),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

// General trusted server client. Existing server repositories use this export.
export const supabaseServer = createServerClient("SUPABASE_SECRET_KEY");

// Request-auth client. Passing a user's access token to auth.getUser() stays
// isolated from the secret-key client used for privileged database operations.
export const supabaseAuthServer = createServerClient(
  "SUPABASE_PUBLISHABLE_KEY",
);

// Dedicated server-secret client for OAuth state and encrypted token storage.
// It is never given a user session or a request Authorization header.
export const supabaseOAuthAdmin = createServerClient("SUPABASE_SECRET_KEY");
