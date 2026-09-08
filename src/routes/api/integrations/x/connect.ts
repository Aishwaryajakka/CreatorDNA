import { createFileRoute } from "@tanstack/react-router";

import { createPkcePair } from "@/lib/oauth/pkce.server";
import {
  oauthDiagnostic,
  safeOAuthError,
} from "@/lib/oauth/diagnostics.server";
import { createOAuthState } from "@/lib/oauth/state.server";
import { createXAuthorizationUrl } from "@/lib/oauth/x.server";
import {
  AuthenticationError,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";

export const Route = createFileRoute("/api/integrations/x/connect")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireAuthenticatedUser(request);
          oauthDiagnostic("x", { step: "connect_authenticated" });
          const pkce = createPkcePair();
          oauthDiagnostic("x", { step: "pkce_created" });
          const state = await createOAuthState(user.id, "x", pkce.verifier);
          oauthDiagnostic("x", {
            step: "authorization_ready",
            status: 200,
          });
          return Response.json({
            authorizationUrl: createXAuthorizationUrl(state, pkce.challenge),
          });
        } catch (error) {
          if (error instanceof AuthenticationError)
            return Response.json(
              { error: "Authentication required." },
              { status: 401 },
            );
          const safeError = safeOAuthError(error);
          oauthDiagnostic("x", {
            step: "connect_failed",
            status: safeError.status ?? 503,
            ...safeError,
          });
          return Response.json(
            { error: "X connection is not available." },
            { status: 503 },
          );
        }
      },
    },
  },
});
