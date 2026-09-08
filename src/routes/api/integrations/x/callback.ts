import { createFileRoute } from "@tanstack/react-router";

import { encryptToken } from "@/lib/oauth/crypto.server";
import {
  oauthDiagnostic,
  safeOAuthError,
} from "@/lib/oauth/diagnostics.server";
import { upsertSocialConnection } from "@/lib/oauth/repository.server";
import { consumeOAuthState } from "@/lib/oauth/state.server";
import { exchangeXCode, fetchXUser } from "@/lib/oauth/x.server";
import { providerResponseError } from "@/lib/oauth/provider-error.server";

function profileRedirect(request: Request, status: "connected" | "error") {
  const configured = process.env["X_REDIRECT_URI"];
  const url = new URL("/profile", configured || request.url);
  url.searchParams.set("x", status);
  return Response.redirect(url, 302);
}

export const Route = createFileRoute("/api/integrations/x/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const state = url.searchParams.get("state");
          const code = url.searchParams.get("code");
          const providerError = url.searchParams.get("error");
          oauthDiagnostic("x", {
            step: "callback_received",
            codePresent: Boolean(code),
            statePresent: Boolean(state),
            providerErrorPresent: Boolean(providerError),
          });
          if (!state) {
            oauthDiagnostic("x", {
              step: "state_validation_failed",
              message: "OAuth callback did not include state.",
            });
            return profileRedirect(request, "error");
          }
          const pending = await consumeOAuthState(state, "x");
          oauthDiagnostic("x", { step: "state_consumed" });
          if (providerError) {
            const safeError = safeOAuthError(
              providerResponseError(
                400,
                {
                  error: providerError,
                  error_description: url.searchParams.get("error_description"),
                },
                "X authorization was not completed.",
              ),
            );
            oauthDiagnostic("x", {
              step: "callback_provider_error",
              status: 400,
              ...safeError,
            });
            return profileRedirect(request, "error");
          }
          if (!code) {
            oauthDiagnostic("x", {
              step: "callback_failed",
              message: "OAuth callback did not include an authorization code.",
            });
            return profileRedirect(request, "error");
          }
          if (!pending.pkceVerifier) {
            oauthDiagnostic("x", {
              step: "callback_failed",
              message: "OAuth state did not include a PKCE verifier.",
            });
            return profileRedirect(request, "error");
          }
          oauthDiagnostic("x", { step: "token_exchange_started" });
          const token = await exchangeXCode(code, pending.pkceVerifier);
          oauthDiagnostic("x", { step: "profile_fetch_started" });
          const profile = await fetchXUser(token.accessToken);
          await upsertSocialConnection(pending.userId, {
            provider: "x",
            providerUserId: profile.id,
            providerUsername: profile.username,
            providerDisplayName: profile.displayName,
            providerAvatarUrl: profile.avatarUrl,
            scopes: token.scopes,
            accessTokenEncrypted: encryptToken(token.accessToken),
            refreshTokenEncrypted: token.refreshToken
              ? encryptToken(token.refreshToken)
              : null,
            accessTokenExpiresAt: token.expiresAt,
          });
          oauthDiagnostic("x", {
            step: "connection_saved",
            connectionSaved: true,
          });
          oauthDiagnostic("x", {
            step: "final_redirect",
            status: 302,
          });
          return profileRedirect(request, "connected");
        } catch (error) {
          const safeError = safeOAuthError(error);
          oauthDiagnostic("x", {
            step: "callback_failed",
            status: safeError.status ?? 302,
            ...safeError,
          });
          oauthDiagnostic("x", { step: "final_redirect", status: 302 });
          return profileRedirect(request, "error");
        }
      },
    },
  },
});
