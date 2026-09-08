import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import {
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/supabase/auth";
import { saveCreatorFoundation } from "@/lib/creator-dna/server/save-foundation";
import { supabaseServer } from "@/lib/supabase/server";
import { CreatorFoundationSchema } from "@/lib/creator-dna/validation";

const foundationArrayFields = [
  "expertise",
  "importantExperiences",
  "accomplishments",
  "failures",
  "perspectiveChanges",
  "beliefs",
  "values",
  "personality",
  "goals",
] as const;

function normalizeFoundationInput(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const normalized = { ...(input as Record<string, unknown>) };
  for (const field of foundationArrayFields) {
    const value = normalized[field];
    if (typeof value === "string") {
      normalized[field] = value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return normalized;
}

export const Route = createFileRoute("/api/onboarding")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          const normalizedInput = normalizeFoundationInput(
            await request.json(),
          );
          const parsed = CreatorFoundationSchema.safeParse(normalizedInput);
          if (!parsed.success) {
            return Response.json(
              {
                error: "Invalid Creator Foundation data.",
                issues: parsed.error.issues.map((issue) => ({
                  field: issue.path.join(".") || "foundation",
                  message: issue.message,
                })),
              },
              { status: 400 },
            );
          }
          const result = await saveCreatorFoundation(parsed.data, user.id);
          const { error: profileError } = await supabaseServer
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", user.id);
          if (profileError) throw profileError;
          return Response.json({ savedNodeCount: result.nodes.length });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          if (error instanceof ZodError)
            return Response.json(
              {
                error: "Invalid Creator Foundation data.",
                issues: error.issues.map((issue) => ({
                  field: issue.path.join(".") || "foundation",
                  message: issue.message,
                })),
              },
              { status: 400 },
            );
          return Response.json(
            { error: "Unable to save Creator Foundation." },
            { status: 502 },
          );
        }
      },
    },
  },
});
