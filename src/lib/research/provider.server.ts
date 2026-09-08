/// <reference types="node" />

import { z } from "zod";

import type { ResearchSource, ResearchWindow } from "./types";

const ENDPOINT = "https://api.perplexity.ai/v1/sonar";

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

export class ResearchProviderError extends Error {}

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

export async function fetchLiveResearch(
  creatorContext: string,
  window: ResearchWindow,
): Promise<LiveResearchItem[]> {
  const apiKey = process.env["PERPLEXITY_API_KEY"]?.trim();
  if (!apiKey)
    throw new ResearchProviderError("Research provider unavailable.");

  const response = await fetch(ENDPOINT, {
    method: "POST",
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
            "Use only live search results. Return 3-5 material, recent developments relevant to the supplied creator context. Do not fill gaps from training knowledge. Every item must cite at least one source URL returned by search.",
        },
        {
          role: "user",
          content: `Derive a few focused research themes from the creator context, then find 3-5 meaningful current developments across those themes. Prioritize material announcements, research, and industry shifts. Avoid clickbait and generic trends.\n\nCreator context:\n${creatorContext}`,
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

  const body = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
    search_results?: SearchResult[];
  } | null;
  if (!response.ok)
    throw new ResearchProviderError("Live research request failed.");
  const content = body?.choices?.[0]?.message?.content;
  if (!content)
    throw new ResearchProviderError("Live research returned no result.");

  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch {
    throw new ResearchProviderError("Live research returned invalid data.");
  }
  const parsed = ProviderResultSchema.safeParse(decoded);
  if (!parsed.success)
    throw new ResearchProviderError("Live research returned invalid data.");

  const actualSources = new Map(
    (body?.search_results ?? [])
      .filter((source): source is SearchResult & { url: string } =>
        Boolean(source.url),
      )
      .map((source) => [
        normalizedUrl(source.url),
        {
          title: source.title?.trim() || publisherFor(source.url),
          url: source.url,
          publisher: publisherFor(source.url),
          publishedAt: normalizedDate(source.date),
        },
      ]),
  );

  return parsed.data.items
    .map((item) => ({
      ...item,
      publishedAt: normalizedDate(item.publishedAt),
      sources: item.sourceUrls
        .map((url) => actualSources.get(normalizedUrl(url)))
        .filter((source): source is ResearchSource => Boolean(source)),
    }))
    .filter((item) => item.sources.length > 0)
    .slice(0, 5);
}
