import { createFileRoute } from "@tanstack/react-router";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { listYouTubePlaylists, YouTubeApiError } from "@/lib/youtube/server";

export const Route = createFileRoute("/api/youtube/playlists")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAuthenticatedUser(request);
          const params = new URL(request.url).searchParams;
          const channelId = params.get("channelId");
          if (!channelId)
            return Response.json(
              { error: "A channel is required." },
              { status: 400 },
            );
          return Response.json(
            await listYouTubePlaylists(
              channelId,
              params.get("pageToken") ?? undefined,
            ),
          );
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
                  : "Unable to load playlists.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
