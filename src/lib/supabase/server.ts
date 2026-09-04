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

const url = process.env["SUPABASE_URL"];
if (!url) {
  throw new Error("Missing required server environment variable: SUPABASE_URL");
}

export const supabaseServer = createClient<Database>(
  url,
  requiredServerEnv("SUPABASE_SECRET_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
