import { createFileRoute } from "@tanstack/react-router";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";
import { getDnaNodesForUser } from "@/lib/creator-dna/repository";

export const Route = createFileRoute("/api/story-map")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const nodes = await getDnaNodesForUser(user.id);
          return Response.json({
            nodes: nodes.map(({ embedding: _embedding, ...node }) => node),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Unable to load your Story Map." },
            { status: 502 },
          );
        }
      },
    },
  },
});
