import { createFileRoute } from "@tanstack/react-router";

import { deleteSocialConnection } from "@/lib/oauth/repository.server";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/integrations/linkedin")({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          await deleteSocialConnection(user.id, "linkedin");
          return Response.json({ ok: true });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Unable to disconnect LinkedIn." },
            { status: 502 },
          );
        }
      },
    },
  },
});
