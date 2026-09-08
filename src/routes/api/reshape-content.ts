import { createFileRoute } from "@tanstack/react-router";

import { reshapeContentDirection } from "@/lib/creator-dna/server/reshape-idea";
import { ReshapeContentInputSchema } from "@/lib/creator-dna/validation";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/reshape-content")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const input = ReshapeContentInputSchema.safeParse(
            await request.json().catch(() => ({})),
          );
          if (!input.success)
            return Response.json(
              { error: "Choose a valid direction and reshape mode." },
              { status: 400 },
            );
          return Response.json(
            await reshapeContentDirection(input.data, user.id),
          );
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Couldn't reshape this direction right now." },
            { status: 502 },
          );
        }
      },
    },
  },
});
