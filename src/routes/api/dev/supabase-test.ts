import { createFileRoute } from "@tanstack/react-router";

import { testSupabaseConnection } from "@/lib/creator-dna/connection-test";

export const Route = createFileRoute("/api/dev/supabase-test")({
  server: {
    handlers: {
      GET: async () => {
        if (!import.meta.env.DEV) {
          return Response.json(
            { ok: false, error: "Not found" },
            { status: 404 },
          );
        }

        return Response.json(await testSupabaseConnection());
      },
    },
  },
});
