import { createFileRoute } from "@tanstack/react-router";

import { saveCreatorContentAndDNA } from "@/lib/creator-dna/server/save-content";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

const sampleText = `I spent months waiting for the perfect idea before launching anything.
Eventually I realized I was using planning as a way to avoid being judged.
The first version I launched was rough, but talking to real users gave me
more clarity in one week than months of thinking alone.

Now I believe action creates clarity. You don't need complete confidence
before starting — you need enough information to take the next step.`;

export const Route = createFileRoute("/api/dev/save-content-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!import.meta.env.DEV) return new Response(null, { status: 404 });

        try {
          const user = await requireAuthenticatedUser(request);
          const result = await saveCreatorContentAndDNA(
            {
              title: "Why I stopped waiting to feel ready",
              platform: "LinkedIn",
              publishedAt: "2025-01-15",
              rawText: sampleText,
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
            extractedCounts: {
              stories: result.extractedDNA.stories.length,
              beliefs: result.extractedDNA.beliefs.length,
              themes: result.extractedDNA.themes.length,
              experiences: result.extractedDNA.experiences.length,
              lessons: result.extractedDNA.lessons.length,
            },
            savedNodeCount: result.savedNodes.length,
          });
        } catch {
          return Response.json(
            { ok: false, error: "Creator DNA save failed." },
            { status: 502 },
          );
        }
      },
    },
  },
});
