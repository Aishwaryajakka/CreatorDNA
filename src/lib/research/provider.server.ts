/// <reference types="node" />

import { z } from "zod";

import type { ResearchSource, ResearchWindow } from "./types";

const ENDPOINT = "https://api.perplexity.ai/chat/completions";
const REQUEST_TIMEOUT_MS = 25_000;

const ProviderItemSchema = z.object({
  headline: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  publishedAt: z.string().nullable(),
  category: z.string().trim().min(1).nullable(),
  sourceUrls: z.array(z.string().url()).min(1),
});

const ProviderResultSchema = z.object({
  items: z.array(ProviderItemSchema).min(3).max(5),
});

type SearchResult = {
  title?: string;
  url?: string;
  date?: string;
};

type PerplexityResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  citations?: string[];
  search_results?: SearchResult[];
};

export type ResearchProviderErrorCode =
  | "PERPLEXITY_NOT_CONFIGURED"
  | "PERPLEXITY_TIMEOUT"
  | "PERPLEXITY_UNAVAILABLE"
  | "PERPLEXITY_UPSTREAM_ERROR"
  | "PERPLEXITY_INVALID_RESPONSE";

export class ResearchProviderError extends Error {
  constructor(
    readonly code: ResearchProviderErrorCode,
    message: string,
    readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = "ResearchProviderError";
  }
}

export function isResearchProviderConfigured() {
  return Boolean(process.env["PERPLEXITY_API_KEY"]?.trim());
}

function publisherFor(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

function normalizedUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
}

function normalizedDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export type LiveResearchItem = {
  headline: string;
  summary: string;
  publishedAt: string | null;
  category: string | null;
  sources: ResearchSource[];
};

function sanitizedProviderError(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const error = (body as Record<string, unknown>)["error"];
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  return {
    type: typeof record["type"] === "string" ? record["type"] : undefined,
    code:
      typeof record["code"] === "string" || typeof record["code"] === "number"
        ? record["code"]
        : undefined,
    message:
      typeof record["message"] === "string"
        ? record["message"].slice(0, 300)
        : undefined,
  };
}

function providerDiagnostic(details: {
  stage: string;
  status?: number;
  body?: unknown;
}) {
  console.error("[research-provider]", {
    stage: details.stage,
    ...(details.status === undefined ? {} : { status: details.status }),
    ...(details.body === undefined
      ? {}
      : { providerError: sanitizedProviderError(details.body) }),
  });
}

function decodeProviderContent(content: string): unknown {
  const trimmed = content.trim();
  const candidate = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
  return JSON.parse(candidate);
}

function sourceMapFor(body: PerplexityResponse) {
  const sources = new Map<string, ResearchSource>();
  for (const result of body.search_results ?? []) {
    if (!result.url) continue;
    sources.set(normalizedUrl(result.url), {
      title: result.title?.trim() || publisherFor(result.url),
      url: result.url,
      publisher: publisherFor(result.url),
      publishedAt: normalizedDate(result.date),
    });
  }
  for (const url of body.citations ?? []) {
    if (typeof url !== "string") continue;
    try {
      new URL(url);
    } catch {
      continue;
    }
    const key = normalizedUrl(url);
    if (!sources.has(key))
      sources.set(key, {
        title: publisherFor(url),
        url,
        publisher: publisherFor(url),
        publishedAt: null,
      });
  }
  return sources;
}

async function requestPerplexity(
  apiKey: string,
  creatorContext: string,
  window: ResearchWindow,
  retry: boolean,
): Promise<PerplexityResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        temperature: 0,
        search_recency_filter: window === "24h" ? "day" : "week",
        search_language_filter: ["en"],
        messages: [
          {
            role: "system",
            content:
              "Use only live search results. Return 3-5 material, recent developments relevant to the supplied Creator DNA context. Do not fill gaps from training knowledge. Prefer sources in this order: (1) official organization, company, government, or university sources; (2) primary announcements and reports; (3) reputable publications; and (4) social posts only when the post itself is the primary source. Every item must cite at least one exact source URL returned by search. Preserve those URLs exactly; never invent, rewrite, or substitute a supposedly better URL.",
          },
          {
            role: "user",
            content: `Derive a few focused research themes from the supplied Creator DNA, then find 3-5 meaningful current developments across those themes. Prioritize material announcements, original research, primary reports, and industry shifts. Prefer an authoritative primary source over a repost or commentary when both are available. Avoid clickbait and generic trends. Use social posts only when the post is itself the relevant primary source. Copy sourceUrls exactly from the live sources you used.\n\nCreator DNA context:\n${creatorContext}${retry ? "\n\nCorrection: Return only valid JSON matching the schema. Every sourceUrls entry must be an exact live citation URL." : ""}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "creator_dna_research_pulse",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                items: {
                  type: "array",
                  minItems: 3,
                  maxItems: 5,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      headline: { type: "string" },
                      summary: { type: "string" },
                      publishedAt: { type: ["string", "null"] },
                      category: { type: ["string", "null"] },
                      sourceUrls: {
                        type: "array",
                        minItems: 1,
                        items: { type: "string" },
                      },
                    },
                    required: [
                      "headline",
                      "summary",
                      "publishedAt",
                      "category",
                      "sourceUrls",
                    ],
                  },
                },
              },
              required: ["items"],
            },
          },
        },
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      providerDiagnostic({ stage: "request_timeout" });
      throw new ResearchProviderError(
        "PERPLEXITY_TIMEOUT",
        "Live research request timed out.",
      );
    }
    providerDiagnostic({ stage: "request_network_error" });
    throw new ResearchProviderError(
      "PERPLEXITY_UNAVAILABLE",
      "Live research provider is unavailable.",
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    providerDiagnostic({
      stage: "upstream_response",
      status: response.status,
      body,
    });
    throw new ResearchProviderError(
      "PERPLEXITY_UPSTREAM_ERROR",
      "Live research request failed.",
      response.status,
    );
  }
  if (!body || typeof body !== "object") {
    providerDiagnostic({
      stage: "response_parse",
      status: response.status,
    });
    throw new ResearchProviderError(
      "PERPLEXITY_INVALID_RESPONSE",
      "Live research returned an invalid response.",
      response.status,
    );
  }
  return body as PerplexityResponse;
}

export async function fetchLiveResearch(
  creatorContext: string,
  window: ResearchWindow,
): Promise<LiveResearchItem[]> {
  const apiKey = process.env["PERPLEXITY_API_KEY"]?.trim();
  if (!apiKey)
    throw new ResearchProviderError(
      "PERPLEXITY_NOT_CONFIGURED",
      "Research provider is not configured.",
    );

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const body = await requestPerplexity(
      apiKey,
      creatorContext,
      window,
      attempt > 0,
    );
    const content = body.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      providerDiagnostic({ stage: "response_content_missing" });
      if (attempt === 0) continue;
      throw new ResearchProviderError(
        "PERPLEXITY_INVALID_RESPONSE",
        "Live research returned no result.",
      );
    }

    let decoded: unknown;
    try {
      decoded = decodeProviderContent(content);
    } catch {
      providerDiagnostic({ stage: "response_json_invalid" });
      if (attempt === 0) continue;
      throw new ResearchProviderError(
        "PERPLEXITY_INVALID_RESPONSE",
        "Live research returned invalid data.",
      );
    }
    const parsed = ProviderResultSchema.safeParse(decoded);
    if (!parsed.success) {
      providerDiagnostic({ stage: "response_schema_invalid" });
      if (attempt === 0) continue;
      throw new ResearchProviderError(
        "PERPLEXITY_INVALID_RESPONSE",
        "Live research returned invalid data.",
      );
    }

    const actualSources = sourceMapFor(body);
    const items = parsed.data.items
      .map((item) => ({
        ...item,
        publishedAt: normalizedDate(item.publishedAt),
        sources: item.sourceUrls
          .map((url) => actualSources.get(normalizedUrl(url)))
          .filter((source): source is ResearchSource => Boolean(source)),
      }))
      .filter((item) => item.sources.length > 0)
      .slice(0, 5);
    if (items.length) return items;
    providerDiagnostic({ stage: "response_citations_missing" });
  }

  throw new ResearchProviderError(
    "PERPLEXITY_INVALID_RESPONSE",
    "Live research returned no verifiable citations.",
  );
}
