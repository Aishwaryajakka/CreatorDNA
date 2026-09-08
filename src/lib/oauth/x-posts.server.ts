/// <reference types="node" />

import {
  getContentItemByExternalId,
  getImportedExternalIds,
} from "@/lib/creator-dna/repository";
import { saveCreatorContentAndDNA } from "@/lib/creator-dna/server/save-content";
import { getSocialConnection } from "./repository.server";
import { isTokenNearExpiry } from "./pkce.server";
import { getValidXAccessToken } from "./x.server";

const X_API_BASE_URL = "https://api.x.com/2";
const X_CONTENT_SOURCE = "x";
export const X_CONTENT_PLATFORM = "x";
const MAX_POSTS = 20;

export type XRecentPost = {
  id: string;
  text: string;
  createdAt: string | null;
  url: string | null;
  alreadyImported: boolean;
};

export type XPostImportResult = {
  tweetId: string;
  status: "imported" | "already_imported" | "failed";
  contentId?: string;
  error?: string;
};

export type XPostAccessErrorCode =
  | "x_not_connected"
  | "x_authorization_required"
  | "x_api_access_unavailable"
  | "x_provider_unavailable";

export class XPostAccessError extends Error {
  constructor(
    readonly code: XPostAccessErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "XPostAccessError";
  }
}

type XApiPost = {
  id?: string;
  text?: string;
  created_at?: string;
  author_id?: string;
};

type XPostsResponse = {
  data?: XApiPost[];
};

function canonicalXPostUrl(username: string | null, postId: string) {
  return username
    ? `https://x.com/${encodeURIComponent(username)}/status/${postId}`
    : null;
}

function xPostsDiagnostic(details: {
  step: string;
  providerUserIdPresent?: boolean;
  accessTokenPresent?: boolean;
  tokenRefreshAttempted?: boolean;
  tokenRefreshStatus?: "not_needed" | "succeeded" | "failed";
  upstreamStatus?: number;
  safeUpstreamErrorCode?: string;
  postsCount?: number;
}) {
  if (process.env["NODE_ENV"] === "production") return;
  console.info("[x-posts]", {
    step: details.step,
    ...(details.providerUserIdPresent === undefined
      ? {}
      : { providerUserIdPresent: details.providerUserIdPresent }),
    ...(details.accessTokenPresent === undefined
      ? {}
      : { accessTokenPresent: details.accessTokenPresent }),
    ...(details.tokenRefreshAttempted === undefined
      ? {}
      : { tokenRefreshAttempted: details.tokenRefreshAttempted }),
    ...(details.tokenRefreshStatus
      ? { tokenRefreshStatus: details.tokenRefreshStatus }
      : {}),
    ...(details.upstreamStatus === undefined
      ? {}
      : { upstreamStatus: details.upstreamStatus }),
    ...(details.safeUpstreamErrorCode
      ? { safeUpstreamErrorCode: details.safeUpstreamErrorCode }
      : {}),
    ...(details.postsCount === undefined
      ? {}
      : { postsCount: details.postsCount }),
  });
}

function safeProviderErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  const direct = record["error"] ?? record["code"] ?? record["title"];
  if (typeof direct === "string" && /^[a-z0-9_. -]{1,80}$/i.test(direct))
    return direct;
  const errors = record["errors"];
  if (!Array.isArray(errors) || !errors[0] || typeof errors[0] !== "object")
    return undefined;
  const nested = errors[0] as Record<string, unknown>;
  const value = nested["code"] ?? nested["title"] ?? nested["type"];
  return typeof value === "string" && /^[a-z0-9_.:/ -]{1,120}$/i.test(value)
    ? value
    : undefined;
}

async function requestXPosts(
  url: URL,
  accessToken: string,
  operation: string,
): Promise<XPostsResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
  } catch {
    xPostsDiagnostic({ step: operation });
    throw new XPostAccessError(
      "x_provider_unavailable",
      "X could not be reached. Please try again later.",
    );
  }
  const body = (await response.json().catch(() => null)) as
    XPostsResponse | Record<string, unknown> | null;
  const safeCode = safeProviderErrorCode(body);
  xPostsDiagnostic({
    step: operation,
    upstreamStatus: response.status,
    ...(safeCode ? { safeUpstreamErrorCode: safeCode } : {}),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new XPostAccessError(
        "x_authorization_required",
        "Your X authorization needs to be renewed.",
      );
    }
    if ([402, 403, 429].includes(response.status)) {
      throw new XPostAccessError(
        "x_api_access_unavailable",
        "Your X account is connected, but recent-post access is not available with the current X API plan.",
      );
    }
    throw new XPostAccessError(
      "x_provider_unavailable",
      "X posts are temporarily unavailable. Please try again later.",
    );
  }
  if (!body) {
    throw new XPostAccessError(
      "x_provider_unavailable",
      "X returned an invalid response. Please try again later.",
    );
  }
  return body as XPostsResponse;
}

async function getXConnectionContext(userId: string) {
  const connection = await getSocialConnection(userId, "x");
  if (!connection) {
    throw new XPostAccessError(
      "x_not_connected",
      "Connect your X account before importing posts.",
    );
  }
  xPostsDiagnostic({
    step: "connection_loaded",
    providerUserIdPresent: Boolean(connection.providerUserId),
  });
  if (!connection.providerUserId) {
    throw new XPostAccessError(
      "x_authorization_required",
      "Reconnect X so Creator DNA can verify your account.",
    );
  }
  const tokenRefreshAttempted = isTokenNearExpiry(
    connection.accessTokenExpiresAt,
  );
  let accessToken: string;
  try {
    accessToken = await getValidXAccessToken(userId);
    xPostsDiagnostic({
      step: "token_ready",
      accessTokenPresent: Boolean(accessToken),
      tokenRefreshAttempted,
      tokenRefreshStatus: tokenRefreshAttempted ? "succeeded" : "not_needed",
    });
  } catch {
    xPostsDiagnostic({
      step: "token_ready",
      accessTokenPresent: false,
      tokenRefreshAttempted,
      tokenRefreshStatus: "failed",
    });
    throw new XPostAccessError(
      "x_authorization_required",
      "Your X authorization needs to be renewed.",
    );
  }
  return {
    providerUserId: connection.providerUserId,
    providerUsername: connection.providerUsername,
    accessToken,
  };
}

export async function getRecentXPosts(userId: string): Promise<XRecentPost[]> {
  xPostsDiagnostic({ step: "x_posts_fetch_started" });
  const context = await getXConnectionContext(userId);
  const url = new URL(
    `${X_API_BASE_URL}/users/${encodeURIComponent(context.providerUserId)}/tweets`,
  );
  url.searchParams.set("max_results", String(MAX_POSTS));
  url.searchParams.set("exclude", "replies,retweets");
  url.searchParams.set("post.fields", "created_at");
  url.searchParams.set("expansions", "author_id");
  const body = await requestXPosts(url, context.accessToken, "recent-posts");
  const posts = (body.data ?? []).filter(
    (post): post is XApiPost & { id: string; text: string } =>
      typeof post.id === "string" &&
      typeof post.text === "string" &&
      (!post.author_id || post.author_id === context.providerUserId),
  );
  const importedIds = await getImportedExternalIds(
    userId,
    X_CONTENT_SOURCE,
    posts.map((post) => post.id),
  );
  const result = posts.slice(0, MAX_POSTS).map((post) => ({
    id: post.id,
    text: post.text,
    createdAt: post.created_at ?? null,
    url: canonicalXPostUrl(context.providerUsername, post.id),
    alreadyImported: importedIds.has(post.id),
  }));
  xPostsDiagnostic({
    step: "x_posts_fetch_complete",
    postsCount: result.length,
  });
  return result;
}

async function refetchOwnedXPosts(userId: string, tweetIds: string[]) {
  const context = await getXConnectionContext(userId);
  const url = new URL(`${X_API_BASE_URL}/tweets`);
  url.searchParams.set("ids", tweetIds.join(","));
  url.searchParams.set("post.fields", "created_at");
  url.searchParams.set("expansions", "author_id");
  const body = await requestXPosts(url, context.accessToken, "post-refetch");
  const posts = new Map<string, XRecentPost>();
  for (const post of body.data ?? []) {
    if (
      typeof post.id !== "string" ||
      typeof post.text !== "string" ||
      post.author_id !== context.providerUserId
    ) {
      continue;
    }
    posts.set(post.id, {
      id: post.id,
      text: post.text,
      createdAt: post.created_at ?? null,
      url: canonicalXPostUrl(context.providerUsername, post.id),
      alreadyImported: false,
    });
  }
  return posts;
}

function buildXPostTitle(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 72) return normalized;
  return `${normalized.slice(0, 71).trimEnd()}…`;
}

export async function importXPosts(
  tweetIds: string[],
  userId: string,
): Promise<{ results: XPostImportResult[] }> {
  const refetchedPosts = await refetchOwnedXPosts(userId, tweetIds);
  const importedIds = await getImportedExternalIds(
    userId,
    X_CONTENT_SOURCE,
    tweetIds,
  );
  const results: XPostImportResult[] = [];

  for (const tweetId of tweetIds) {
    const post = refetchedPosts.get(tweetId);
    if (!post) {
      results.push({
        tweetId,
        status: "failed",
        error:
          "This post is unavailable or does not belong to the connected X account.",
      });
      continue;
    }
    if (importedIds.has(tweetId)) {
      results.push({ tweetId, status: "already_imported" });
      continue;
    }
    if (!post.createdAt) {
      results.push({
        tweetId,
        status: "failed",
        error: "X did not provide this post's publication date.",
      });
      continue;
    }
    try {
      const saved = await saveCreatorContentAndDNA(
        {
          title: buildXPostTitle(post.text),
          platform: X_CONTENT_PLATFORM,
          publishedAt: post.createdAt,
          rawText: post.text,
          external: {
            source: X_CONTENT_SOURCE,
            id: post.id,
            url: post.url,
          },
        },
        userId,
      );
      results.push({
        tweetId,
        status: "imported",
        contentId: saved.contentItem.id,
      });
    } catch {
      const existing = await getContentItemByExternalId(
        userId,
        X_CONTENT_SOURCE,
        tweetId,
      ).catch(() => null);
      results.push(
        existing
          ? {
              tweetId,
              status: "already_imported",
              contentId: existing.id,
            }
          : {
              tweetId,
              status: "failed",
              error: "This post could not be imported. Please try again later.",
            },
      );
    }
  }
  return { results };
}
