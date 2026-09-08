import { createFileRoute } from "@tanstack/react-router";

import { getBrandEvolution } from "@/lib/creator-dna/server/get-brand-evolution";
import { AuthenticationError } from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/brand-evolution")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return Response.json(await getBrandEvolution(request));
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Brand evolution is temporarily unavailable." },
            { status: 502 },
          );
        }
      },
    },
  },
});
