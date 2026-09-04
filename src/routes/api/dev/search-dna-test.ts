import { createFileRoute } from "@tanstack/react-router";

import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";

export const Route = createFileRoute("/api/dev/search-dna-test")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!import.meta.env.DEV) return new Response(null, { status: 404 });
        const query = new URL(request.url).searchParams.get("q") ?? "";
        try {
          const matches = await searchCreatorDNA(query);
          return Response.json({
            query,
            matches: matches.map((match) => ({
              id: match.id,
              type: match.type,
              label: match.label,
              summary: match.summary,
              evidenceQuote: match.evidenceQuote,
              sourceTitle: match.sourceTitle,
              sourceDate: match.sourceDate,
              similarity: match.similarity,
            })),
          });
        } catch {
          return Response.json(
            { error: "Creator DNA search is temporarily unavailable." },
            { status: 502 },
          );
        }
      },
    },
  },
});
