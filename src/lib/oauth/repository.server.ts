/// <reference types="node" />

import { supabaseOAuthAdmin } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type {
  IntegrationStatus,
  SanitizedSocialConnection,
  SocialProvider,
} from "./types";
import { isOAuthProviderAvailable } from "./provider-error.server";
import { oauthDiagnostic } from "./diagnostics.server";

export type StoredSocialConnection = {
  id: string;
  userId: string;
  provider: SocialProvider;
  providerUserId: string | null;
  providerUsername: string | null;
  providerDisplayName: string | null;
  providerAvatarUrl: string | null;
  scopes: string[];
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  accessTokenExpiresAt: string | null;
  connectedAt: string;
};

function scopesFromJson(value: Json): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .flatMap((item) => item.split(/[,\s]+/).filter(Boolean))
    : [];
}

function toStored(row: {
  id: string;
  user_id: string;
  provider: SocialProvider;
  provider_user_id: string | null;
  provider_username: string | null;
  provider_display_name: string | null;
  provider_avatar_url: string | null;
  scopes: Json;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  access_token_expires_at: string | null;
  connected_at: string;
}): StoredSocialConnection {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    providerUsername: row.provider_username,
    providerDisplayName: row.provider_display_name,
    providerAvatarUrl: row.provider_avatar_url,
    scopes: scopesFromJson(row.scopes),
    accessTokenEncrypted: row.access_token_encrypted,
    refreshTokenEncrypted: row.refresh_token_encrypted,
    accessTokenExpiresAt: row.access_token_expires_at,
    connectedAt: row.connected_at,
  };
}

export async function getSocialConnection(
  userId: string,
  provider: SocialProvider,
): Promise<StoredSocialConnection | null> {
  const { data, error } = await supabaseOAuthAdmin
    .from("social_connections")
    .select()
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error("Unable to load social connection.");
  return data ? toStored(data) : null;
}

export type SocialConnectionInput = {
  provider: SocialProvider;
  providerUserId: string | null;
  providerUsername: string | null;
  providerDisplayName: string | null;
  providerAvatarUrl: string | null;
  scopes: string[];
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  accessTokenExpiresAt: string | null;
  metadata?: Json;
};

export async function upsertSocialConnection(
  userId: string,
  input: SocialConnectionInput,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabaseOAuthAdmin.from("social_connections").upsert(
    {
      user_id: userId,
      provider: input.provider,
      provider_user_id: input.providerUserId,
      provider_username: input.providerUsername,
      provider_display_name: input.providerDisplayName,
      provider_avatar_url: input.providerAvatarUrl,
      scopes: input.scopes,
      access_token_encrypted: input.accessTokenEncrypted,
      refresh_token_encrypted: input.refreshTokenEncrypted,
      access_token_expires_at: input.accessTokenExpiresAt,
      metadata: input.metadata ?? {},
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,provider" },
  );
  if (error) {
    oauthDiagnostic(input.provider, {
      step: "db_upsert_failed",
      code: error.code,
      message: "Social connection could not be saved.",
    });
    throw new Error("Unable to save social connection.");
  }
  oauthDiagnostic(input.provider, { step: "db_upsert_succeeded" });
}

export async function updateSocialConnectionTokens(
  userId: string,
  provider: SocialProvider,
  input: {
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string | null;
    accessTokenExpiresAt: string | null;
    scopes?: string[];
  },
): Promise<void> {
  const { error } = await supabaseOAuthAdmin
    .from("social_connections")
    .update({
      access_token_encrypted: input.accessTokenEncrypted,
      refresh_token_encrypted: input.refreshTokenEncrypted,
      access_token_expires_at: input.accessTokenExpiresAt,
      updated_at: new Date().toISOString(),
      ...(input.scopes ? { scopes: input.scopes } : {}),
    })
    .eq("user_id", userId)
    .eq("provider", provider);
  if (error) throw new Error("Unable to update social connection.");
}

export async function deleteSocialConnection(
  userId: string,
  provider: SocialProvider,
): Promise<void> {
  const { error } = await supabaseOAuthAdmin
    .from("social_connections")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);
  if (error) throw new Error("Unable to disconnect social account.");
}

function sanitize(
  connection: StoredSocialConnection,
): SanitizedSocialConnection {
  return {
    provider: connection.provider,
    available: true,
    connected: true,
    displayName: connection.providerDisplayName,
    username: connection.providerUsername,
    avatarUrl: connection.providerAvatarUrl,
    scopes: connection.scopes,
    connectedAt: connection.connectedAt,
  };
}

export async function getSanitizedConnections(
  userId: string,
): Promise<IntegrationStatus> {
  const [linkedin, x] = await Promise.all([
    getSocialConnection(userId, "linkedin"),
    getSocialConnection(userId, "x"),
  ]);
  return {
    linkedin: linkedin
      ? sanitize(linkedin)
      : {
          provider: "linkedin",
          available: isOAuthProviderAvailable("linkedin"),
          connected: false,
        },
    x: x
      ? sanitize(x)
      : {
          provider: "x",
          available: isOAuthProviderAvailable("x"),
          connected: false,
        },
  };
}
