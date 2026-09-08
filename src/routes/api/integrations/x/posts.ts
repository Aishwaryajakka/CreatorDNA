import { createFileRoute } from "@tanstack/react-router";

import { getRecentXPosts, XPostAccessError } from "@/lib/oauth/x-posts.server";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/integrations/x/posts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          return Response.json({ posts: await getRecentXPosts(user.id) });
        } catch (error) {
          if (error instanceof AuthenticationError) {
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          }
          if (error instanceof XPostAccessError) {
            const status =
              error.code === "x_api_access_unavailable"
                ? 403
                : error.code === "x_provider_unavailable"
                  ? 502
                  : 409;
            return Response.json(
              { error: error.message, code: error.code },
              { status },
            );
          }
          return Response.json(
            { error: "Unable to load recent X posts." },
            { status: 502 },
          );
        }
      },
    },
  },
});
