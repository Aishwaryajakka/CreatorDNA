import { createFileRoute } from "@tanstack/react-router";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/content-library")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const { data: content, error: contentError } = await supabaseServer
            .from("content_items")
            .select(
              "id,title,platform,published_at,external_source,external_url,created_at",
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (contentError) throw contentError;
          const ids = (content ?? []).map((item) => item.id);
          const { data: nodes, error: nodeError } = ids.length
            ? await supabaseServer
                .from("dna_nodes")
                .select("content_id,type")
                .in("content_id", ids)
            : { data: [], error: null };
          if (nodeError) throw nodeError;
          const counts = new Map<string, Record<string, number>>();
          for (const node of nodes ?? []) {
            const byType = counts.get(node.content_id ?? "") ?? {};
            byType[node.type] = (byType[node.type] ?? 0) + 1;
            counts.set(node.content_id ?? "", byType);
          }
          return Response.json({
            items: (content ?? []).map((item) => ({
              id: item.id,
              title: item.title,
              platform:
                item.platform ??
                (item.title === "Creator Foundation"
                  ? "Creator Foundation"
                  : item.external_source === "youtube"
                    ? "YouTube"
                    : "Manual"),
              date: item.published_at ?? item.created_at,
              sourceUrl: item.external_url,
              counts: counts.get(item.id) ?? {},
            })),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          return Response.json(
            { error: "Unable to load your content library." },
            { status: 502 },
          );
        }
      },
    },
  },
});
