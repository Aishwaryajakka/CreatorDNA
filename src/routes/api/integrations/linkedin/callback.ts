import { createFileRoute } from "@tanstack/react-router";

import { encryptToken } from "@/lib/oauth/crypto.server";
import {
  oauthDiagnostic,
  safeOAuthError,
} from "@/lib/oauth/diagnostics.server";
import {
  exchangeLinkedInCode,
  fetchLinkedInUser,
} from "@/lib/oauth/linkedin.server";
import { upsertSocialConnection } from "@/lib/oauth/repository.server";
import { consumeOAuthState } from "@/lib/oauth/state.server";
import { providerResponseError } from "@/lib/oauth/provider-error.server";

function profileRedirect(request: Request, status: "connected" | "error") {
  const configured = process.env["LINKEDIN_REDIRECT_URI"];
  const url = new URL("/profile", configured || request.url);
  url.searchParams.set("linkedin", status);
  return Response.redirect(url, 302);
}

export const Route = createFileRoute("/api/integrations/linkedin/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const state = url.searchParams.get("state");
          const code = url.searchParams.get("code");
          const providerError = url.searchParams.get("error");
          oauthDiagnostic("linkedin", {
            step: "callback_received",
            codePresent: Boolean(code),
            statePresent: Boolean(state),
            providerErrorPresent: Boolean(providerError),
          });
          if (!state) {
            oauthDiagnostic("linkedin", {
              step: "state_validation_failed",
              message: "OAuth callback did not include state.",
            });
            return profileRedirect(request, "error");
          }
          const pending = await consumeOAuthState(state, "linkedin");
          oauthDiagnostic("linkedin", { step: "state_consumed" });
          if (providerError) {
            const safeError = safeOAuthError(
              providerResponseError(
                400,
                {
                  error: providerError,
                  error_description: url.searchParams.get("error_description"),
                },
                "LinkedIn authorization was not completed.",
              ),
            );
            oauthDiagnostic("linkedin", {
              step: "callback_provider_error",
              status: 400,
              ...safeError,
            });
            return profileRedirect(request, "error");
          }
          if (!code) {
            oauthDiagnostic("linkedin", {
              step: "callback_failed",
              message: "OAuth callback did not include an authorization code.",
            });
            return profileRedirect(request, "error");
          }
          oauthDiagnostic("linkedin", { step: "token_exchange_started" });
          const token = await exchangeLinkedInCode(code);
          oauthDiagnostic("linkedin", { step: "profile_fetch_started" });
          const profile = await fetchLinkedInUser(token.accessToken);
          await upsertSocialConnection(pending.userId, {
            provider: "linkedin",
            providerUserId: profile.id,
            providerUsername: null,
            providerDisplayName: profile.displayName,
            providerAvatarUrl: profile.avatarUrl,
            scopes: token.scopes,
            accessTokenEncrypted: encryptToken(token.accessToken),
            refreshTokenEncrypted: null,
            accessTokenExpiresAt: token.expiresAt,
          });
          oauthDiagnostic("linkedin", {
            step: "connection_saved",
            connectionSaved: true,
          });
          oauthDiagnostic("linkedin", {
            step: "final_redirect",
            status: 302,
          });
          return profileRedirect(request, "connected");
        } catch (error) {
          const safeError = safeOAuthError(error);
          oauthDiagnostic("linkedin", {
            step: "callback_failed",
            status: safeError.status ?? 302,
            ...safeError,
          });
          oauthDiagnostic("linkedin", { step: "final_redirect", status: 302 });
          return profileRedirect(request, "error");
        }
      },
    },
  },
});
