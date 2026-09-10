/// <reference types="node" />

import { z } from "zod";
import type { ChatCompletionCreateParams } from "groq-sdk/resources/chat/completions";

import type { BrandTerritory, CreatorDNAMatch } from "@/lib/creator-dna/types";
import type { CreatorFoundation } from "@/lib/creator-dna/validation";
import {
  CreatorDNAProviderError,
  getGroqClient,
  getGroqModel,
} from "@/lib/creator-dna/server/llm";
import type { LiveResearchItem } from "./provider.server";

const DirectAddressSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => !/\b(?:the|this|that)\s+creator\b|\bcreator['’]s\b/i.test(value),
    "User-facing Research Pulse copy must address the user directly.",
  );

const LinkSchema = z.object({
  nodeId: z.string(),
  relevanceSummary: DirectAddressSchema,
});
const ResultSchema = z.object({
  items: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      whyItMatters: DirectAddressSchema,
      matchedTerritory: z.string().trim().min(1).nullable(),
      links: z.array(LinkSchema).max(3),
    }),
  ),
});

export type ResearchInterpretation = z.infer<
  typeof ResultSchema
>["items"][number];

export async function interpretResearch(
  items: LiveResearchItem[],
  foundation: CreatorFoundation | null,
  territories: BrandTerritory[],
  candidates: CreatorDNAMatch[][],
) {
  const params: ChatCompletionCreateParams = {
    model: getGroqModel(),
    temperature: 0,
    max_completion_tokens: 5_000,
    messages: [
      {
        role: "system",
        content:
          "Explain why each supplied external research item matters directly to the authenticated user. All user-facing explanations must use second-person language such as you, your story, your Creator DNA, your Brand Territories, and your past work. Never refer to the user as 'the creator' or use 'the creator's.' External facts come only from the research item. Claims about the user come only from their candidate DNA nodes. Never invent facts, personal history, beliefs, or experience. Use at most 3 genuinely relevant node IDs per item; zero links is allowed. Do not rewrite article titles, source text, or citations.",
      },
      {
        role: "user",
        content: JSON.stringify({
          externalResearch: items,
          creatorFoundation: foundation,
          intendedBrandTerritories: territories,
          candidateCreatorDNA: candidates,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "research_creator_relevance",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  index: { type: "integer" },
                  whyItMatters: { type: "string" },
                  matchedTerritory: { type: ["string", "null"] },
                  links: {
                    type: "array",
                    maxItems: 3,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        nodeId: { type: "string" },
                        relevanceSummary: { type: "string" },
                      },
                      required: ["nodeId", "relevanceSummary"],
                    },
                  },
                },
                required: [
                  "index",
                  "whyItMatters",
                  "matchedTerritory",
                  "links",
                ],
              },
            },
          },
          required: ["items"],
        },
      },
    },
  };

  let interpreted: z.infer<typeof ResultSchema> | null = null;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2 && !interpreted; attempt += 1) {
    try {
      const completion = await getGroqClient().chat.completions.create({
        ...params,
        messages: [
          ...params.messages,
          ...(attempt
            ? [
                {
                  role: "user" as const,
                  content: `Schema correction: return exactly ${items.length} entries, one for each zero-based input index, and return valid JSON matching every required field. Address the user only as "you" or "your" in whyItMatters and relevanceSummary; never say "the creator" or "the creator's."`,
                },
              ]
            : []),
        ],
      });
      const content = completion.choices[0]?.message?.content;
      if (!content?.trim()) continue;
      let decoded: unknown;
      try {
        decoded = JSON.parse(content);
      } catch {
        continue;
      }
      const parsed = ResultSchema.safeParse(decoded);
      if (!parsed.success) continue;
      const returnedIndexes = new Set(
        parsed.data.items.map((item) => item.index),
      );
      if (
        parsed.data.items.length !== items.length ||
        returnedIndexes.size !== items.length ||
        items.some((_, index) => !returnedIndexes.has(index))
      )
        continue;
      interpreted = parsed.data;
    } catch (error) {
      lastError = error;
    }
  }
  if (!interpreted)
    throw new CreatorDNAProviderError("Research interpretation failed.", {
      cause: lastError,
    });

  const territoryNames = new Map(
    territories.map((territory) => [
      territory.name.trim().toLowerCase(),
      territory.name,
    ]),
  );

  return interpreted.items.map((item) => {
    const validIds = new Set(
      candidates[item.index]?.map((node) => node.id) ?? [],
    );
    return {
      ...item,
      matchedTerritory: item.matchedTerritory
        ? (territoryNames.get(item.matchedTerritory.trim().toLowerCase()) ??
          null)
        : null,
      links: item.links.filter((link) => validIds.has(link.nodeId)),
    };
  });
}
