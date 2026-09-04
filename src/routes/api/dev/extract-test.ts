import { createFileRoute } from "@tanstack/react-router";

import { extractCreatorDNA } from "@/lib/creator-dna/server/extract";

const sampleText = `I spent months waiting for the perfect idea before launching anything.
Eventually I realized I was using planning as a way to avoid being judged.
The first version I launched was rough, but talking to real users gave me
more clarity in one week than months of thinking alone.

Now I believe action creates clarity. You don't need complete confidence
before starting — you need enough information to take the next step.`;

export const Route = createFileRoute("/api/dev/extract-test")({
  server: {
    handlers: {
      GET: async () => {
        if (!import.meta.env.DEV) {
          return new Response(null, { status: 404 });
        }

        try {
          const result = await extractCreatorDNA(sampleText, {
            title: "Why I stopped waiting to feel ready",
            platform: "LinkedIn",
            publishedAt: "2025-01-15",
          });
          return Response.json(result);
        } catch (error) {
          return Response.json(
            {
              ok: false,
              error:
                error instanceof Error ? error.message : "Extraction failed.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
