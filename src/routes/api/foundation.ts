import { createFileRoute } from "@tanstack/react-router";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import {
  getFoundationForUser,
  replaceFoundationNodes,
} from "@/lib/creator-dna/repository";
import { CreatorFoundationSchema } from "@/lib/creator-dna/validation";

export const Route = createFileRoute("/api/foundation")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          return Response.json({
            foundation: await getFoundationForUser(user.id),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Unable to load foundation." },
            { status: 502 },
          );
        }
      },
      PUT: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const parsed = CreatorFoundationSchema.safeParse(
            await request.json(),
          );
          if (!parsed.success)
            return Response.json(
              { error: "Invalid foundation data." },
              { status: 400 },
            );
          const nodes = await replaceFoundationNodes(parsed.data, user.id);
          return Response.json({
            foundation: parsed.data,
            savedNodeCount: nodes.length,
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Unable to save foundation." },
            { status: 502 },
          );
        }
      },
    },
  },
});
