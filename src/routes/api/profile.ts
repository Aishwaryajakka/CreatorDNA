import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { getOrCreateProfile, updateProfile } from "@/lib/supabase/profile";

const schema = z.object({
  displayName: z.string().trim().min(2).max(50),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,30}$/),
});
export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          return Response.json(await getOrCreateProfile(user));
        } catch (e) {
          return Response.json(
            {
              error:
                e instanceof AuthenticationError
                  ? "Authentication required."
                  : "Unable to load profile.",
            },
            { status: e instanceof AuthenticationError ? 401 : 502 },
          );
        }
      },
      PATCH: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const parsed = schema.safeParse(await request.json());
          if (!parsed.success)
            return Response.json(
              { error: "Use a valid display name and username." },
              { status: 400 },
            );
          return Response.json(
            await updateProfile(
              user,
              parsed.data.displayName,
              parsed.data.username,
            ),
          );
        } catch (e) {
          if (e instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            {
              error:
                e instanceof Error ? e.message : "Unable to update profile.",
            },
            { status: 409 },
          );
        }
      },
    },
  },
});
