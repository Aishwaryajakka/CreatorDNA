import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { importYouTubeVideos } from "@/lib/youtube/server/import";

const selectionSchema = z.object({
  videoId: z.string().trim().min(1).max(32),
  playlistId: z.string().trim().min(1).optional(),
  playlistTitle: z.string().trim().min(1).optional(),
  playlistPosition: z.number().int().nonnegative().optional(),
});
const requestSchema = z.object({
  selections: z.array(selectionSchema).min(1).max(25),
});

export const Route = createFileRoute("/api/youtube/import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const parsed = requestSchema.safeParse(await request.json());
          if (!parsed.success)
            return Response.json(
              { error: "Select between 1 and 25 videos." },
              { status: 400 },
            );
          return Response.json(
            await importYouTubeVideos(
              parsed.data.selections.map((selection) => ({
                videoId: selection.videoId,
                ...(selection.playlistId
                  ? { playlistId: selection.playlistId }
                  : {}),
                ...(selection.playlistTitle
                  ? { playlistTitle: selection.playlistTitle }
                  : {}),
                ...(selection.playlistPosition !== undefined
                  ? { playlistPosition: selection.playlistPosition }
                  : {}),
              })),
              user.id,
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
                error instanceof Error
                  ? error.message
                  : "Unable to import YouTube videos.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
