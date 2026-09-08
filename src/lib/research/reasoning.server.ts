/// <reference types="node" />

import { z } from "zod";

import type { BrandTerritory, CreatorDNAMatch } from "@/lib/creator-dna/types";
import type { CreatorFoundation } from "@/lib/creator-dna/validation";
import {
  CreatorDNAProviderError,
  getGroqClient,
  getGroqModel,
} from "@/lib/creator-dna/server/llm";
import type { LiveResearchItem } from "./provider.server";

const LinkSchema = z.object({
  nodeId: z.string(),
  relevanceSummary: z.string().trim().min(1),
});
const ResultSchema = z.object({
  items: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      whyItMatters: z.string().trim().min(1),
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
  const completion = await getGroqClient().chat.completions.create({
    model: getGroqModel(),
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Explain why each supplied external research item matters to this creator. External facts come only from the research item. Creator claims come only from its candidate DNA nodes. Never invent facts or creator history. Use at most 3 genuinely relevant node IDs per item; zero links is allowed.",
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
  });
  const content = completion.choices[0]?.message?.content;
  if (!content)
    throw new CreatorDNAProviderError("Research interpretation failed.");
  const parsed = ResultSchema.safeParse(JSON.parse(content));
  if (!parsed.success)
    throw new CreatorDNAProviderError("Research interpretation was invalid.");

  const returnedIndexes = new Set(parsed.data.items.map((item) => item.index));
  if (
    parsed.data.items.length !== items.length ||
    returnedIndexes.size !== items.length ||
    items.some((_, index) => !returnedIndexes.has(index))
  )
    throw new CreatorDNAProviderError(
      "Research interpretation was incomplete.",
    );

  const territoryNames = new Map(
    territories.map((territory) => [
      territory.name.trim().toLowerCase(),
      territory.name,
    ]),
  );

  return parsed.data.items.map((item) => {
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
