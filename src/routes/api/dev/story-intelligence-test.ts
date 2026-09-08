import { createFileRoute } from "@tanstack/react-router";

import { analyzeContentIdea } from "@/lib/creator-dna/server/analyze-idea";
import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { AuthenticationError } from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/dev/story-intelligence-test")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!import.meta.env.DEV) return new Response(null, { status: 404 });
        const idea =
          new URL(request.url).searchParams.get("idea") ??
          "I want to talk about why shipping early matters";

        try {
          const user = await requireAuthenticatedUser(request);
          const retrievedDNA = await searchCreatorDNA(idea, user.id);
          const analysis = await analyzeContentIdea(
            idea,
            retrievedDNA,
            "linkedin",
          );
          return Response.json({
            idea,
            retrievedDNA,
            ...analysis,
          });
        } catch (error) {
          if (error instanceof AuthenticationError) {
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          }
          return Response.json(
            {
              error: "Story Intelligence is temporarily unavailable.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
