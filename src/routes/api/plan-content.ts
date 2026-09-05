import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { analyzeContentIdea } from "@/lib/creator-dna/server/analyze-idea";
import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

const planRequestSchema = z.object({ idea: z.string().trim().min(1) });

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

        const parsed = planRequestSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Please add a content idea." },
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
          );
          return Response.json({
            idea: parsed.data.idea,
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
