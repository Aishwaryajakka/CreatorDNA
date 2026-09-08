import { createFileRoute } from "@tanstack/react-router";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { listRecentYouTubeVideos } from "@/lib/youtube/server";

export const Route = createFileRoute("/api/youtube/videos")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          if (process.env["NODE_ENV"] !== "production")
            console.info("[youtube]", {
              step: "videos_route_reached",
              uploadsPlaylistIdPresent: new URL(request.url).searchParams.has(
                "uploadsPlaylistId",
              ),
            });
          await requireAuthenticatedUser(request);
          const params = new URL(request.url).searchParams;
          const uploadsPlaylistId = params.get("uploadsPlaylistId");
          if (!uploadsPlaylistId)
            return Response.json(
              { error: "A channel is required." },
              { status: 400 },
            );
          return Response.json(
            await listRecentYouTubeVideos(
              uploadsPlaylistId,
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
              error: "Could not load YouTube videos.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
