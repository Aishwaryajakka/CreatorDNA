/// <reference types="node" />

import type { ChatCompletionCreateParams } from "groq-sdk/resources/chat/completions";
import { z } from "zod";

import { listBrandTerritories } from "../brand-territories-repository";
import { getFoundationForUser } from "../repository";
import type {
  CreatorDNAMatch,
  ReshapeMode,
  ReshapeResult,
  TargetPlatform,
} from "../types";
import { analyzeContentIdea } from "./analyze-idea";
import { CreatorDNAProviderError, getGroqClient, getGroqModel } from "./llm";
import { searchCreatorDNA } from "./search-dna";

const ModelResultSchema = z.object({
  title: z.string().trim().min(1),
  angle: z.string().trim().min(1),
  platformPrep: z.object({
    platform: z.enum([
      "linkedin",
      "instagram",
      "tiktok",
      "youtube",
      "youtube_shorts",
      "x",
      "threads",
    ]),
    hook: z.string().trim().min(1).nullable(),
    structure: z.array(z.string().trim().min(1)).max(5),
    notes: z.array(z.string().trim().min(1)).max(3),
  }),
  supportingNodeIds: z.array(z.string()).max(4),
});

const reshapeGuidance: Record<ReshapeMode, string> = {
  closer_to_story:
    "Make the direction more personally grounded using real stories, experiences, lessons, belief evolution, or identity from the supplied DNA. Never invent an experience.",
  stronger_point_of_view:
    "Clarify the creator's supported current stance using beliefs, values, lessons, previous positions, and perspective evolution. Do not manufacture rage bait or unsupported contrarianism.",
  fresh_angle:
    "Create a genuinely different framing that avoids the detected repetition while remaining connected to adjacent beliefs, stories, and intended Brand Territories. Do not merely rewrite the same sentence.",
};

const platformGuidance: Record<TargetPlatform, string> = {
  linkedin:
    "Provide a strong first-line hook and 3-5 professional but personal structural beats.",
  x: "Provide a concise hook, compact structure, and note whether a single post or short thread fits.",
  youtube:
    "Provide a title-style hook, opening tension, and 3-5 talking-point beats.",
  threads: "Provide a conversational hook and compact sequence.",
  instagram: "Provide a visual/personal hook and a concise sequence.",
  tiktok: "Provide an immediate hook and a compact tension-to-lesson sequence.",
  youtube_shorts:
    "Provide a fast opening hook and a compact story-to-payoff sequence.",
};

export async function reshapeContentDirection(
  input: {
    idea: string;
    targetPlatform: TargetPlatform;
    directionIndex: number;
    reshapeMode: ReshapeMode;
  },
  userId: string,
): Promise<ReshapeResult> {
  const [retrievedDNA, creatorFoundation, intendedBrandTerritories] =
    await Promise.all([
      searchCreatorDNA(input.idea, userId),
      getFoundationForUser(userId),
      listBrandTerritories(userId),
    ]);
  const intelligence = await analyzeContentIdea(
    input.idea,
    retrievedDNA,
    input.targetPlatform,
    {
      intendedBrandTerritories,
      ...(creatorFoundation
        ? {
            creatorFoundation: {
              whatYouDo: creatorFoundation.whatYouDo,
              mainTopics: creatorFoundation.mainTopics,
              expertise: creatorFoundation.expertise,
              beliefs: creatorFoundation.beliefs,
              goals: creatorFoundation.goals,
            },
          }
        : {}),
    },
  );
  const selectedDirection =
    intelligence.threeAuthenticAngles[input.directionIndex];
  if (!selectedDirection)
    throw new CreatorDNAProviderError("Selected direction was unavailable.");

  const params: ChatCompletionCreateParams = {
    model: getGroqModel(),
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Reshape one Creator DNA planning direction without writing a full post. Use only the supplied user-owned DNA as personal evidence. Never invent creator history, beliefs, expertise, or experiences. supportingNodeIds must be a subset of supplied DNA IDs. Keep the result concise.",
      },
      {
        role: "user",
        content: JSON.stringify({
          idea: input.idea,
          mode: input.reshapeMode,
          modeGuidance: reshapeGuidance[input.reshapeMode],
          targetPlatform: input.targetPlatform,
          platformGuidance: platformGuidance[input.targetPlatform],
          selectedDirection,
          alignment: intelligence.alignment,
          previousPositions: intelligence.previousPositions,
          possiblePerspectiveEvolution:
            intelligence.possiblePerspectiveEvolution,
          possibleRepetition: intelligence.possibleRepetition,
          creatorFoundation,
          intendedBrandTerritories,
          creatorDNA: retrievedDNA.map((node) => ({
            id: node.id,
            type: node.type,
            label: node.label,
            summary: node.summary,
            evidenceQuote: node.evidenceQuote,
            sourceTitle: node.sourceTitle,
            sourceDate: node.sourceDate,
          })),
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "creator_dna_reshaped_direction",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            angle: { type: "string" },
            platformPrep: {
              type: "object",
              additionalProperties: false,
              properties: {
                platform: {
                  type: "string",
                  enum: [
                    "linkedin",
                    "instagram",
                    "tiktok",
                    "youtube",
                    "youtube_shorts",
                    "x",
                    "threads",
                  ],
                },
                hook: { type: ["string", "null"] },
                structure: {
                  type: "array",
                  maxItems: 5,
                  items: { type: "string" },
                },
                notes: {
                  type: "array",
                  maxItems: 3,
                  items: { type: "string" },
                },
              },
              required: ["platform", "hook", "structure", "notes"],
            },
            supportingNodeIds: {
              type: "array",
              maxItems: 4,
              items: { type: "string" },
            },
          },
          required: ["title", "angle", "platformPrep", "supportingNodeIds"],
        },
      },
    },
  };

  let completion;
  try {
    completion = await getGroqClient().chat.completions.create(params);
  } catch (error) {
    throw new CreatorDNAProviderError("Direction reshape failed.", {
      cause: error,
    });
  }
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new CreatorDNAProviderError("Direction reshape failed.");
  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch (error) {
    throw new CreatorDNAProviderError("Direction reshape was malformed.", {
      cause: error,
    });
  }
  const parsed = ModelResultSchema.safeParse(decoded);
  if (!parsed.success)
    throw new CreatorDNAProviderError("Direction reshape was invalid.");

  const nodesById = new Map(retrievedDNA.map((node) => [node.id, node]));
  const validatedIds = parsed.data.supportingNodeIds.filter((id) =>
    nodesById.has(id),
  );
  const fallbackIds = selectedDirection.supportingNodeIds.filter((id) =>
    nodesById.has(id),
  );
  const groundedIds = [
    ...new Set(validatedIds.length ? validatedIds : fallbackIds),
  ].slice(0, 4);
  const groundedIn = groundedIds.flatMap((id) => {
    const node = nodesById.get(id);
    if (!node) return [];
    return [
      {
        nodeId: node.id,
        type: node.type,
        label: node.label,
        summary: node.summary,
        ...(node.sourceTitle !== undefined
          ? { sourceTitle: node.sourceTitle }
          : {}),
      },
    ];
  });

  return {
    title: parsed.data.title,
    angle: parsed.data.angle,
    platformPrep: {
      platform: input.targetPlatform,
      ...(parsed.data.platformPrep.hook
        ? { hook: parsed.data.platformPrep.hook }
        : {}),
      ...(parsed.data.platformPrep.structure.length
        ? { structure: parsed.data.platformPrep.structure }
        : {}),
      ...(parsed.data.platformPrep.notes.length
        ? { notes: parsed.data.platformPrep.notes }
        : {}),
    },
    groundedIn,
  };
}
