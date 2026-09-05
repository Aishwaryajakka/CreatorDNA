import { createFileRoute } from "@tanstack/react-router";

import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/dev/search-dna-test")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!import.meta.env.DEV) return new Response(null, { status: 404 });
        const query = new URL(request.url).searchParams.get("q") ?? "";
        try {
          const user = await requireAuthenticatedUser(request);
          const matches = await searchCreatorDNA(query, user.id);
          return Response.json({
            query,
            matches: matches.map((match) => ({
              id: match.id,
              type: match.type,
              label: match.label,
              summary: match.summary,
              evidenceQuote: match.evidenceQuote,
              sourceTitle: match.sourceTitle,
              sourceDate: match.sourceDate,
              similarity: match.similarity,
            })),
          });
        } catch (error) {
          if (error instanceof AuthenticationError) {
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          }
          return Response.json(
            { error: "Creator DNA search is temporarily unavailable." },
            { status: 502 },
          );
        }
      },
    },
  },
});
