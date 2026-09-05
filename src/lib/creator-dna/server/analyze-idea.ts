/// <reference types="node" />

import type { ChatCompletionCreateParams } from "groq-sdk/resources/chat/completions";

import type { CreatorDNAMatch, StoryIntelligenceResult } from "../types";
import { StoryIntelligenceSchema } from "../validation";
import { CreatorDNAProviderError, getGroqClient, getGroqModel } from "./llm";

const framingTypes = [
  "personal story",
  "perspective evolution",
  "contrarian",
  "lesson learned",
  "reflective",
  "audience-focused",
] as const;

const storyIntelligenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    relevantStories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          supportingNodeIds: { type: "array", items: { type: "string" } },
        },
        required: ["summary", "supportingNodeIds"],
      },
    },
    previousPositions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          position: { type: "string" },
          supportingNodeIds: { type: "array", items: { type: "string" } },
        },
        required: ["position", "supportingNodeIds"],
      },
    },
    possiblePerspectiveEvolution: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["identified", "insufficient evidence"],
        },
        summary: { type: "string" },
        supportingNodeIds: { type: "array", items: { type: "string" } },
      },
      required: ["status", "summary", "supportingNodeIds"],
    },
    possibleRepetition: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["identified", "not detected", "insufficient evidence"],
        },
        summary: { type: "string" },
        supportingNodeIds: { type: "array", items: { type: "string" } },
      },
      required: ["status", "summary", "supportingNodeIds"],
    },
    threeAuthenticAngles: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          framingType: { type: "string", enum: framingTypes },
          hook: { type: "string" },
          rationale: { type: "string" },
          supportingNodeIds: { type: "array", items: { type: "string" } },
        },
        required: [
          "title",
          "framingType",
          "hook",
          "rationale",
          "supportingNodeIds",
        ],
      },
    },
  },
  required: [
    "relevantStories",
    "previousPositions",
    "possiblePerspectiveEvolution",
    "possibleRepetition",
    "threeAuthenticAngles",
  ],
} as const;

const responseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "creator_dna_story_intelligence",
    strict: true,
    schema: storyIntelligenceSchema,
  },
};

const SYSTEM_PROMPT = `You are the Story Intelligence layer for Creator DNA.
Reason only from the retrieved Creator DNA nodes supplied in the user message.

Never invent personal experiences, stories, beliefs, history, motivations, or outcomes.
Never claim the creator believes something unless retrieved evidence supports it.
Do not treat wording differences as contradictions.
Identify perspective evolution only when dated evidence reasonably supports a meaningful change.
Identify repetition only when retrieved evidence shows meaningful semantic or story overlap.
If evidence is insufficient, explicitly use the appropriate insufficient evidence status.
Every factual or personal claim must cite supportingNodeIds from the supplied nodes.
Every supportingNodeIds value must contain only IDs from the supplied nodes.
Create exactly three meaningfully different authentic angles, and ground every angle in retrieved nodes.
Do not add any node IDs that are not supplied.`;

function buildUserPrompt(
  idea: string,
  retrievedDNA: CreatorDNAMatch[],
): string {
  return `Content idea:
${idea}

Retrieved Creator DNA (the only allowed evidence):
${JSON.stringify(
  retrievedDNA.map((node) => ({
    id: node.id,
    type: node.type,
    label: node.label,
    summary: node.summary,
    evidenceQuote: node.evidenceQuote,
    sourceTitle: node.sourceTitle,
    sourceDate: node.sourceDate,
    confidence: node.confidence,
    similarity: node.similarity,
  })),
  null,
  2,
)}

Return the requested structured Story Intelligence result only.`;
}

export async function analyzeContentIdea(
  idea: string,
  retrievedDNA: CreatorDNAMatch[],
): Promise<StoryIntelligenceResult> {
  if (!idea.trim()) {
    throw new CreatorDNAProviderError("Content idea must not be empty.");
  }

  let completion;
  try {
    const params: ChatCompletionCreateParams = {
      model: getGroqModel(),
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(idea, retrievedDNA) },
      ],
      response_format: responseFormat,
    };
    completion = await getGroqClient().chat.completions.create(params);
  } catch (error) {
    if (error instanceof CreatorDNAProviderError) throw error;
    throw new CreatorDNAProviderError("Story Intelligence analysis failed.", {
      cause: error,
    });
  }

  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) {
    throw new CreatorDNAProviderError("Story Intelligence returned no result.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch (error) {
    throw new CreatorDNAProviderError(
      "Story Intelligence returned malformed JSON.",
      { cause: error },
    );
  }

  const result = StoryIntelligenceSchema.safeParse(decoded);
  if (!result.success) {
    throw new CreatorDNAProviderError(
      "Story Intelligence returned invalid structured data.",
      { cause: result.error },
    );
  }

  const [firstAngle, secondAngle, thirdAngle] =
    result.data.threeAuthenticAngles;
  if (!firstAngle || !secondAngle || !thirdAngle) {
    throw new CreatorDNAProviderError(
      "Story Intelligence returned fewer than three angles.",
    );
  }
  const normalizedResult: StoryIntelligenceResult = {
    ...result.data,
    threeAuthenticAngles: [firstAngle, secondAngle, thirdAngle],
  };
  const validNodeIds = new Set(retrievedDNA.map((node) => node.id));
  const references = collectSupportingNodeIds(normalizedResult);
  if (references.some((id) => !validNodeIds.has(id))) {
    throw new CreatorDNAProviderError(
      "Story Intelligence returned an unsupported evidence reference.",
    );
  }
  return normalizedResult;
}

function collectSupportingNodeIds(result: StoryIntelligenceResult): string[] {
  return [
    ...result.relevantStories.flatMap((item) => item.supportingNodeIds),
    ...result.previousPositions.flatMap((item) => item.supportingNodeIds),
    ...result.possiblePerspectiveEvolution.supportingNodeIds,
    ...result.possibleRepetition.supportingNodeIds,
    ...result.threeAuthenticAngles.flatMap((item) => item.supportingNodeIds),
  ];
}
