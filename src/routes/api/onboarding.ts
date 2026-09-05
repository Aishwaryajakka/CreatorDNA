import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { saveCreatorFoundation } from "@/lib/creator-dna/server/save-foundation";
export const Route = createFileRoute("/api/onboarding")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const result = await saveCreatorFoundation(
            await request.json(),
            user.id,
          );
          return Response.json({ savedNodeCount: result.nodes.length });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          if (error instanceof ZodError)
            return Response.json(
              { error: "Please complete the required foundation fields." },
              { status: 400 },
            );
          return Response.json(
            { error: "Unable to save Creator Foundation." },
            { status: 502 },
          );
        }
      },
    },
  },
});
