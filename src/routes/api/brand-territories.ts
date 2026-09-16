import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { getBrandTerritories } from "@/lib/creator-dna/server/get-brand-territories";
import { saveBrandTerritories } from "@/lib/creator-dna/server/save-brand-territories";
import {
  AuthenticationError,
  demoMutationResponse,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";
import { clearTrustedPlanContextsForUser } from "@/lib/creator-dna/server/plan-context-cache";

function errorResponse(error: unknown) {
  if (error instanceof AuthenticationError)
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  if (error instanceof ZodError)
    return Response.json(
      { error: "Choose between 3 and 7 unique territories." },
      { status: 400 },
    );
  return Response.json(
    { error: "Brand Territories are temporarily unavailable." },
    { status: 502 },
  );
}

export const Route = createFileRoute("/api/brand-territories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          return Response.json({
            territories: await getBrandTerritories(request),
          });
        } catch (error) {
          return errorResponse(error);
        }
      },
      PUT: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const demoGuard = demoMutationResponse(user);
          if (demoGuard) return demoGuard;
          let input: unknown;
          try {
            input = await request.json();
          } catch {
            return Response.json(
              { error: "Invalid request body." },
              { status: 400 },
            );
          }
          const territories = await saveBrandTerritories(request, input);
          clearTrustedPlanContextsForUser(user.id);
          return Response.json({ territories });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
