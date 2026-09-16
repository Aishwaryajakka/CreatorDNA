import { createFileRoute } from "@tanstack/react-router";

import { listBrandTerritories } from "@/lib/creator-dna/brand-territories-repository";
import { getFoundationForUser } from "@/lib/creator-dna/repository";
import { analyzeContentIdea } from "@/lib/creator-dna/server/analyze-idea";
import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";
import { PlanContentInputSchema } from "@/lib/creator-dna/validation";
import { getResearchItem } from "@/lib/research/repository.server";
import { cacheTrustedPlanContext } from "@/lib/creator-dna/server/plan-context-cache";
import { ServerTimings } from "@/lib/server-timing";
import { providerStatus } from "@/lib/creator-dna/server/llm";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/plan-content")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const timings = new ServerTimings();
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return timings.json(
            { error: "Please provide a valid content idea." },
            { status: 400 },
          );
        }

        const parsed = PlanContentInputSchema.safeParse(body);
        if (!parsed.success) {
          return timings.json(
            {
              error: "Please add a content idea and choose a target platform.",
            },
            { status: 400 },
          );
        }

        try {
          const user = await timings.measure("auth", () =>
            requireAuthenticatedUser(request),
          );
          const researchItem = parsed.data.researchItemId
            ? await timings.measure("research", () =>
                getResearchItem(user.id, parsed.data.researchItemId!),
              )
            : null;
          if (parsed.data.researchItemId && !researchItem)
            return timings.json(
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
                { onTiming: timings.record },
              ),
              timings.measure("territories", () =>
                listBrandTerritories(user.id),
              ),
              timings.measure("foundation", () =>
                getFoundationForUser(user.id),
              ),
            ]);
          const creatorContext = {
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
          };
          const intelligence = await analyzeContentIdea(
            parsed.data.idea,
            retrievedDNA,
            parsed.data.targetPlatform,
            creatorContext,
            timings.record,
          );
          cacheTrustedPlanContext(
            user.id,
            parsed.data.idea,
            parsed.data.targetPlatform,
            {
              retrievedDNA,
              creatorFoundation,
              intendedBrandTerritories,
              intelligence,
            },
          );
          return timings.json({
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
            return timings.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          }
          const upstreamStatus = providerStatus(error);
          const cause =
            error instanceof Error && error.cause instanceof Error
              ? error.cause
              : null;
          console.error("[plan-content] request failed", {
            errorName: error instanceof Error ? error.name : typeof error,
            message: error instanceof Error ? error.message : "unknown error",
            causeName: cause?.name,
            causeMessage: cause?.message,
            status:
              cause && "status" in cause
                ? String((cause as Error & { status?: unknown }).status)
                : undefined,
            stack:
              process.env["NODE_ENV"] !== "production" && error instanceof Error
                ? error.stack
                : undefined,
          });
          return timings.json(
            {
              error:
                upstreamStatus === 429
                  ? "Creator DNA is temporarily at capacity. Please try again shortly."
                  : "Creator DNA planning is temporarily unavailable. Please try again.",
              ...(upstreamStatus === 429 ? { code: "AI_RATE_LIMITED" } : {}),
            },
            { status: upstreamStatus === 429 ? 429 : 502 },
          );
        }
      },
    },
  },
});
