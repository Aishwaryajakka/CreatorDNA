import { createFileRoute } from "@tanstack/react-router";

import {
  generateResearchPulse,
  ResearchContextError,
} from "@/lib/research/pulse.server";
import { ResearchPulseInputSchema } from "@/lib/research/validation";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/research/pulse")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const parsed = ResearchPulseInputSchema.safeParse(
            await request.json().catch(() => ({})),
          );
          if (!parsed.success)
            return Response.json(
              { error: "Choose a valid research window." },
              { status: 400 },
            );
          return Response.json({
            items: await generateResearchPulse(user.id, parsed.data.window),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          if (error instanceof ResearchContextError) {
            const missingProvider =
              error.message === "research_provider_required";
            return Response.json(
              {
                error: missingProvider
                  ? "Research Pulse requires a live research provider to surface current developments."
                  : error.message === "insufficient_creator_context"
                    ? "Add more Creator DNA or Brand Territories to make Research Pulse more relevant."
                    : "Research Pulse couldn't find enough cited current research.",
              },
              { status: missingProvider ? 503 : 409 },
            );
          }
          return Response.json(
            { error: "Research Pulse couldn't refresh right now." },
            { status: 502 },
          );
        }
      },
    },
  },
});
