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
          return Response.json(
            {
              error:
                error instanceof YouTubeApiError
                  ? error.message
                  : "Unable to find that YouTube channel.",
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
