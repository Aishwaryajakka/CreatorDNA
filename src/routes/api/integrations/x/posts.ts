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
          const posts = await getRecentXPosts(user.id);
          return Response.json({
            status: posts.length ? "success" : "empty",
            provider: "x",
            posts,
          });
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
              error.code === "x_api_access_unavailable"
                ? {
                    status: "api_access_unavailable",
                    provider: "x",
                    message:
                      "Your X account is connected. Direct post import is waiting on the required X API access and will be available once that access is approved.",
                  }
                : error.code === "x_provider_unavailable"
                  ? {
                      status: "temporary_error",
                      provider: "x",
                      message:
                        "X posts are temporarily unavailable. Please try again later.",
                    }
                  : { error: error.message, code: error.code },
              { status },
            );
          }
          return Response.json(
            {
              status: "temporary_error",
              provider: "x",
              message: "X posts are temporarily unavailable. Try again later.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
