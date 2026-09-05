import { checkDatabaseConnection } from "./repository";

export async function testSupabaseConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    return await checkDatabaseConnection();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Database connection failed",
    };
  }
}
