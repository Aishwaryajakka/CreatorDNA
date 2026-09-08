import { createFileRoute } from "@tanstack/react-router";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import {
  listYouTubePlaylistVideos,
  YouTubeApiError,
} from "@/lib/youtube/server";

export const Route = createFileRoute("/api/youtube/playlist-videos")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAuthenticatedUser(request);
          const params = new URL(request.url).searchParams;
          const playlistId = params.get("playlistId");
          if (!playlistId)
            return Response.json(
              { error: "A playlist is required." },
              { status: 400 },
            );
          return Response.json(
            await listYouTubePlaylistVideos(
              playlistId,
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
                  : "Unable to load playlist videos.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
