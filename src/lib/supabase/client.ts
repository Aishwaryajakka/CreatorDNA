import { createClient } from "@supabase/supabase-js";

function requiredEnv(
  name: "SUPABASE_URL" | "SUPABASE_PUBLISHABLE_KEY",
): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const supabase = createClient(
  requiredEnv("SUPABASE_URL"),
  requiredEnv("SUPABASE_PUBLISHABLE_KEY"),
);
