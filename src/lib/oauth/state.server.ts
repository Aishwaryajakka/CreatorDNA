/// <reference types="node" />

import { randomBytes } from "node:crypto";

import { supabaseOAuthAdmin } from "@/lib/supabase/server";
import { decryptToken, encryptToken, hashOAuthState } from "./crypto.server";
import { oauthDiagnostic } from "./diagnostics.server";
import type { SocialProvider } from "./types";

const STATE_TTL_MS = 10 * 60 * 1000;

export type ConsumedOAuthState = {
  userId: string;
  pkceVerifier: string | null;
};

export async function createOAuthState(
  userId: string,
  provider: SocialProvider,
  pkceVerifier?: string,
): Promise<string> {
  oauthDiagnostic(provider, {
    step: "state_client_ready",
    clientType: "admin",
  });
  await supabaseOAuthAdmin
    .from("oauth_states")
    .delete()
    .lt("expires_at", new Date().toISOString());
  const state = randomBytes(32).toString("base64url");
  const { error } = await supabaseOAuthAdmin.from("oauth_states").insert({
    user_id: userId,
    provider,
    state_hash: hashOAuthState(state),
    pkce_verifier_encrypted: pkceVerifier ? encryptToken(pkceVerifier) : null,
    expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
  });
  if (error) {
    oauthDiagnostic(provider, {
      step: "state_create_failed",
      code: error.code,
      message: "OAuth state could not be stored.",
    });
    throw new Error("Unable to start OAuth connection.");
  }
  oauthDiagnostic(provider, { step: "state_created" });
  return state;
}

export async function consumeOAuthState(
  state: string,
  provider: SocialProvider,
): Promise<ConsumedOAuthState> {
  if (!state) throw new Error("Invalid OAuth state.");
  oauthDiagnostic(provider, {
    step: "state_client_ready",
    clientType: "admin",
  });
  const { data, error } = await supabaseOAuthAdmin
    .from("oauth_states")
    .delete()
    .eq("state_hash", hashOAuthState(state))
    .eq("provider", provider)
    .select("user_id,pkce_verifier_encrypted,expires_at")
    .maybeSingle();
  if (error || !data) {
    oauthDiagnostic(provider, {
      step: "state_validation_failed",
      ...(error?.code ? { code: error.code } : {}),
      message: error
        ? "OAuth state lookup failed."
        : "OAuth state was missing.",
    });
    throw new Error("Invalid OAuth state.");
  }
  if (Date.parse(data.expires_at) <= Date.now()) {
    oauthDiagnostic(provider, {
      step: "state_validation_failed",
      message: "OAuth state was expired.",
    });
    throw new Error("OAuth state has expired.");
  }
  oauthDiagnostic(provider, { step: "state_validation_succeeded" });
  return {
    userId: data.user_id,
    pkceVerifier: data.pkce_verifier_encrypted
      ? decryptToken(data.pkce_verifier_encrypted)
      : null,
  };
}
