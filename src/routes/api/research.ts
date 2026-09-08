import { createFileRoute } from "@tanstack/react-router";

import { isResearchProviderConfigured } from "@/lib/research/provider.server";
import { listResearchItems } from "@/lib/research/repository.server";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/research")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          return Response.json({
            items: await listResearchItems(user.id),
            providerConfigured: isResearchProviderConfigured(),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Research Pulse is temporarily unavailable." },
            { status: 502 },
          );
        }
      },
    },
  },
});
