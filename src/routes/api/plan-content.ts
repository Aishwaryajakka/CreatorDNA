import { createFileRoute } from "@tanstack/react-router";

import { listBrandTerritories } from "@/lib/creator-dna/brand-territories-repository";
import { getFoundationForUser } from "@/lib/creator-dna/repository";
import { analyzeContentIdea } from "@/lib/creator-dna/server/analyze-idea";
import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";
import { PlanContentInputSchema } from "@/lib/creator-dna/validation";
import { getResearchItem } from "@/lib/research/repository.server";
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
          const researchItem = parsed.data.researchItemId
            ? await getResearchItem(user.id, parsed.data.researchItemId)
            : null;
          if (parsed.data.researchItemId && !researchItem)
            return Response.json(
              { error: "Research item not found." },
              { status: 404 },
            );
          const [retrievedDNA, intendedBrandTerritories, creatorFoundation] =
            await Promise.all([
              searchCreatorDNA(
                researchItem
                  ? `${parsed.data.idea}\n${researchItem.headline}\n${researchItem.summary}`
                  : parsed.data.idea,
                user.id,
              ),
              listBrandTerritories(user.id),
              getFoundationForUser(user.id),
            ]);
          const intelligence = await analyzeContentIdea(
            parsed.data.idea,
            retrievedDNA,
            parsed.data.targetPlatform,
            {
              intendedBrandTerritories,
              ...(creatorFoundation
                ? {
                    creatorFoundation: {
                      whatYouDo: creatorFoundation.whatYouDo,
                      mainTopics: creatorFoundation.mainTopics,
                      expertise: creatorFoundation.expertise,
                      beliefs: creatorFoundation.beliefs,
                      goals: creatorFoundation.goals,
                    },
                  }
                : {}),
              ...(researchItem
                ? {
                    externalResearch: {
                      headline: researchItem.headline,
                      summary: researchItem.summary,
                      sources: researchItem.sources,
                      whyItMatters: researchItem.whyItMatters,
                    },
                  }
                : {}),
            },
          );
          return Response.json({
            idea: parsed.data.idea,
            targetPlatform: parsed.data.targetPlatform,
            ...(researchItem
              ? {
                  research: {
                    id: researchItem.id,
                    headline: researchItem.headline,
                  },
                }
              : {}),
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
