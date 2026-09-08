import { createFileRoute } from "@tanstack/react-router";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/youtube/imported")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const ids = new URL(request.url).searchParams
            .getAll("id")
            .filter(Boolean)
            .slice(0, 50);
          if (!ids.length) return Response.json({ importedIds: [] });
          const { data, error } = await supabaseServer
            .from("content_items")
            .select("external_id")
            .eq("user_id", user.id)
            .eq("external_source", "youtube")
            .in("external_id", ids);
          if (error) throw error;
          return Response.json({
            importedIds: data
              .map((row) => row.external_id)
              .filter((id): id is string => Boolean(id)),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Unable to check imported videos." },
            { status: 502 },
          );
        }
      },
    },
  },
});
