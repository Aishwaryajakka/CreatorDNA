import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { saveCreatorContentAndDNA } from "@/lib/creator-dna/server/save-content";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/content")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "The request body must be valid JSON." },
            { status: 400 },
          );
        }

        try {
          const user = await requireAuthenticatedUser(request);
          const result = await saveCreatorContentAndDNA(
            body as {
              title: string;
              platform?: string | null;
              publishedAt?: string | null;
              rawText: string;
            },
            user.id,
          );
          return Response.json({
            contentItem: {
              id: result.contentItem.id,
              title: result.contentItem.title,
              platform: result.contentItem.platform,
              publishedAt: result.contentItem.publishedAt,
            },
            extractedDNA: result.extractedDNA,
            savedNodeCount: result.savedNodes.length,
          });
        } catch (error) {
          if (error instanceof AuthenticationError) {
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          }
          if (error instanceof ZodError) {
            return Response.json(
              { error: "Please check the content details and try again." },
              { status: 400 },
            );
          }
          return Response.json(
            { error: "Unable to save this content. Please try again." },
            { status: 502 },
          );
        }
      },
    },
  },
});
