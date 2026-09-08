import { createFileRoute } from "@tanstack/react-router";

import { getSanitizedConnections } from "@/lib/oauth/repository.server";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/integrations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          return Response.json(await getSanitizedConnections(user.id));
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Unable to load connected accounts." },
            { status: 502 },
          );
        }
      },
    },
  },
});
