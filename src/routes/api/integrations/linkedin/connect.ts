import { createFileRoute } from "@tanstack/react-router";

import { createLinkedInAuthorizationUrl } from "@/lib/oauth/linkedin.server";
import {
  oauthDiagnostic,
  safeOAuthError,
} from "@/lib/oauth/diagnostics.server";
import { createOAuthState } from "@/lib/oauth/state.server";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/integrations/linkedin/connect")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          oauthDiagnostic("linkedin", { step: "connect_authenticated" });
          const state = await createOAuthState(user.id, "linkedin");
          oauthDiagnostic("linkedin", {
            step: "authorization_ready",
            status: 200,
          });
          return Response.json({
            authorizationUrl: createLinkedInAuthorizationUrl(state),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          const safeError = safeOAuthError(error);
          oauthDiagnostic("linkedin", {
            step: "connect_failed",
            status: safeError.status ?? 503,
            ...safeError,
          });
          return Response.json(
            { error: "LinkedIn connection is not available." },
            { status: 503 },
          );
        }
      },
    },
  },
});
