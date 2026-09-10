import { createFileRoute } from "@tanstack/react-router";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { resolveYouTubeChannel, YouTubeApiError } from "@/lib/youtube/server";

export const Route = createFileRoute("/api/youtube/channel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAuthenticatedUser(request);
          const identifier =
            new URL(request.url).searchParams.get("identifier") ?? "";
          return Response.json(await resolveYouTubeChannel(identifier));
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          if (error instanceof YouTubeApiError) {
            const status =
              error.kind === "configuration"
                ? 503
                : error.kind === "input"
                  ? 400
                  : 502;
            return Response.json({ error: error.message }, { status });
          }
          console.error("[youtube]", {
            step: "channel_route_unexpected_error",
            errorName: error instanceof Error ? error.name : "UnknownError",
          });
          return Response.json(
            { error: "Unable to find that YouTube channel." },
            { status: 500 },
          );
        }
      },
    },
  },
});
