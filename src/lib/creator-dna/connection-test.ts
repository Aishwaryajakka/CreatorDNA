import { createServerFn } from "@tanstack/react-start";

import { checkDatabaseConnection } from "./repository";

export const testSupabaseConnection = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      return await checkDatabaseConnection();
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Database connection failed",
      };
    }
  },
);
