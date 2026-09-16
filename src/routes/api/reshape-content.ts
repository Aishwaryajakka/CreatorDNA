import { createFileRoute } from "@tanstack/react-router";

import { reshapeContentDirection } from "@/lib/creator-dna/server/reshape-idea";
import { ReshapeContentInputSchema } from "@/lib/creator-dna/validation";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";
import { ServerTimings } from "@/lib/server-timing";
import { providerStatus } from "@/lib/creator-dna/server/llm";

export const Route = createFileRoute("/api/reshape-content")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const timings = new ServerTimings();
        try {
          const user = await timings.measure("auth", () =>
            requireAuthenticatedUser(request),
          );
          const input = ReshapeContentInputSchema.safeParse(
            await request.json().catch(() => ({})),
          );
          if (!input.success)
            return timings.json(
              { error: "Choose a valid direction and reshape mode." },
              { status: 400 },
            );
          return timings.json(
            await reshapeContentDirection(input.data, user.id, timings.record),
          );
        } catch (error) {
          if (error instanceof AuthenticationError)
            return timings.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          const upstreamStatus = providerStatus(error);
          return timings.json(
            {
              error:
                upstreamStatus === 429
                  ? "Creator DNA is temporarily at capacity. Please try this reshape again shortly."
                  : "Couldn't reshape this direction right now.",
              ...(upstreamStatus === 429 ? { code: "AI_RATE_LIMITED" } : {}),
            },
            { status: upstreamStatus === 429 ? 429 : 502 },
          );
        }
      },
    },
  },
});
