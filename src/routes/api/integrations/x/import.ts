import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { importXPosts, XPostAccessError } from "@/lib/oauth/x-posts.server";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

const requestSchema = z.object({
  tweetIds: z
    .array(
      z
        .string()
        .trim()
        .regex(/^\d{1,19}$/),
    )
    .min(1)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length),
});

export const Route = createFileRoute("/api/integrations/x/import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const parsed = requestSchema.safeParse(await request.json());
          if (!parsed.success) {
            return Response.json(
              { error: "Select between 1 and 20 unique X posts." },
              { status: 400 },
            );
          }
          return Response.json({
            status: "success",
            provider: "x",
            results: await importXPosts(parsed.data.tweetIds, user.id),
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
