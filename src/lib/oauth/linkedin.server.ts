/// <reference types="node" />

import { oauthDiagnostic } from "./diagnostics.server";
import {
  providerResponseError,
  requiredOAuthEnv,
} from "./provider-error.server";

const AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USER_INFO_URL = "https://api.linkedin.com/v2/userinfo";
export const LINKEDIN_SCOPES = ["openid", "profile", "email"];

export function createLinkedInAuthorizationUrl(state: string) {
  const url = new URL(AUTHORIZATION_URL);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: requiredOAuthEnv("LINKEDIN_CLIENT_ID"),
    redirect_uri: requiredOAuthEnv("LINKEDIN_REDIRECT_URI"),
    state,
    scope: LINKEDIN_SCOPES.join(" "),
  }).toString();
  return url.toString();
}

export type LinkedInTokenResponse = {
  accessToken: string;
  expiresAt: string | null;
  scopes: string[];
};

export async function exchangeLinkedInCode(
  code: string,
): Promise<LinkedInTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: requiredOAuthEnv("LINKEDIN_CLIENT_ID"),
      client_secret: requiredOAuthEnv("LINKEDIN_CLIENT_SECRET"),
      redirect_uri: requiredOAuthEnv("LINKEDIN_REDIRECT_URI"),
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  } | null;
  oauthDiagnostic("linkedin", {
    step: "token_exchange_status",
    status: response.status,
  });
  if (!response.ok || !body?.access_token)
    throw providerResponseError(
      response.status,
      body,
      "LinkedIn authorization failed.",
    );
  return {
    accessToken: body.access_token,
    expiresAt: body.expires_in
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : null,
    scopes: body.scope?.split(/\s+/).filter(Boolean) ?? LINKEDIN_SCOPES,
  };
}

export async function fetchLinkedInUser(accessToken: string) {
  const response = await fetch(USER_INFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const body = (await response.json().catch(() => null)) as {
    sub?: string;
    name?: string;
    picture?: string;
    email?: string;
  } | null;
  oauthDiagnostic("linkedin", {
    step: "profile_fetch_status",
    status: response.status,
  });
  if (!response.ok || !body?.sub)
    throw providerResponseError(
      response.status,
      body,
      "LinkedIn profile lookup failed.",
    );
  return {
    id: body.sub,
    displayName: body.name ?? null,
    avatarUrl: body.picture ?? null,
    email: body.email ?? null,
  };
}
