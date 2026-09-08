import { createFileRoute } from "@tanstack/react-router";

import { analyzeContentIdea } from "@/lib/creator-dna/server/analyze-idea";
import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";
import { PlanContentInputSchema } from "@/lib/creator-dna/validation";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/plan-content")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "Please provide a valid content idea." },
            { status: 400 },
          );
        }

        const parsed = PlanContentInputSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            {
              error: "Please add a content idea and choose a target platform.",
            },
            { status: 400 },
          );
        }

        try {
          const user = await requireAuthenticatedUser(request);
          const retrievedDNA = await searchCreatorDNA(
            parsed.data.idea,
            user.id,
          );
          const intelligence = await analyzeContentIdea(
            parsed.data.idea,
            retrievedDNA,
            parsed.data.targetPlatform,
          );
          return Response.json({
            idea: parsed.data.idea,
            targetPlatform: parsed.data.targetPlatform,
            retrievedDNA,
            ...intelligence,
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
              error:
                "Creator DNA planning is temporarily unavailable. Please try again.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
