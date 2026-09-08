/// <reference types="node" />

import { decryptToken, encryptToken } from "./crypto.server";
import { oauthDiagnostic } from "./diagnostics.server";
import { isTokenNearExpiry } from "./pkce.server";
import {
  OAuthProviderError,
  providerResponseError,
  requiredOAuthEnv,
} from "./provider-error.server";
import {
  getSocialConnection,
  updateSocialConnectionTokens,
} from "./repository.server";

const AUTHORIZATION_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const USER_URL =
  "https://api.x.com/2/users/me?user.fields=id,name,username,profile_image_url";
export const X_SCOPES = ["tweet.read", "users.read", "offline.access"];

function clientAuthorization() {
  return `Basic ${Buffer.from(
    `${requiredOAuthEnv("X_CLIENT_ID")}:${requiredOAuthEnv("X_CLIENT_SECRET")}`,
  ).toString("base64")}`;
}

export function createXAuthorizationUrl(state: string, challenge: string) {
  const url = new URL(AUTHORIZATION_URL);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: requiredOAuthEnv("X_CLIENT_ID"),
    redirect_uri: requiredOAuthEnv("X_REDIRECT_URI"),
    scope: X_SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

type XTokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
};

async function tokenRequest(
  parameters: URLSearchParams,
): Promise<XTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      authorization: clientAuthorization(),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: parameters,
  });
  const body = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  } | null;
  oauthDiagnostic("x", {
    step: "token_exchange_status",
    status: response.status,
  });
  if (!response.ok || !body?.access_token)
    throw providerResponseError(
      response.status,
      body,
      "X authorization failed.",
    );
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? null,
    expiresAt: body.expires_in
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : null,
    scopes: body.scope?.split(/\s+/).filter(Boolean) ?? X_SCOPES,
  };
}

export function exchangeXCode(code: string, verifier: string) {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: requiredOAuthEnv("X_REDIRECT_URI"),
      code_verifier: verifier,
    }),
  );
}

export async function fetchXUser(accessToken: string) {
  const response = await fetch(USER_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const body = (await response.json().catch(() => null)) as {
    data?: {
      id?: string;
      name?: string;
      username?: string;
      profile_image_url?: string;
    };
  } | null;
  oauthDiagnostic("x", {
    step: "profile_fetch_status",
    status: response.status,
  });
  if (!response.ok || !body?.data?.id)
    throw providerResponseError(
      response.status,
      body,
      "X profile lookup failed.",
    );
  return {
    id: body.data.id,
    displayName: body.data.name ?? null,
    username: body.data.username ?? null,
    avatarUrl: body.data.profile_image_url ?? null,
  };
}

export async function getValidXAccessToken(userId: string): Promise<string> {
  const connection = await getSocialConnection(userId, "x");
  if (!connection) throw new OAuthProviderError("X is not connected.");
  if (!isTokenNearExpiry(connection.accessTokenExpiresAt))
    return decryptToken(connection.accessTokenEncrypted);
  if (!connection.refreshTokenEncrypted)
    throw new OAuthProviderError("X authorization needs to be renewed.");
  const refreshed = await tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: decryptToken(connection.refreshTokenEncrypted),
    }),
  );
  await updateSocialConnectionTokens(userId, "x", {
    accessTokenEncrypted: encryptToken(refreshed.accessToken),
    refreshTokenEncrypted: refreshed.refreshToken
      ? encryptToken(refreshed.refreshToken)
      : connection.refreshTokenEncrypted,
    accessTokenExpiresAt: refreshed.expiresAt,
    scopes: refreshed.scopes,
  });
  return refreshed.accessToken;
}
