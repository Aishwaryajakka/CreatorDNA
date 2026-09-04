/// <reference types="node" />

import type { ChatCompletionCreateParams } from "groq-sdk/resources/chat/completions";

import type { ContentMetadata, ExtractedCreatorDNA } from "../types";
import {
  ExtractedCreatorDNASchema,
  ContentMetadataSchema,
} from "../validation";
import { CreatorDNAProviderError, getGroqClient, getGroqModel } from "./llm";
import {
  CREATOR_DNA_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "./prompts";

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    stories: { type: "array", items: { $ref: "#/$defs/node" } },
    beliefs: { type: "array", items: { $ref: "#/$defs/node" } },
    themes: { type: "array", items: { $ref: "#/$defs/node" } },
    experiences: { type: "array", items: { $ref: "#/$defs/node" } },
    lessons: { type: "array", items: { $ref: "#/$defs/node" } },
  },
  required: ["stories", "beliefs", "themes", "experiences", "lessons"],
  $defs: {
    node: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        summary: { type: "string" },
        evidenceQuote: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["label", "summary", "evidenceQuote", "confidence"],
    },
  },
} as const;

const responseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "creator_dna_extraction",
    strict: true,
    schema: extractionSchema,
  },
};

function normalizeProviderError(error: unknown): CreatorDNAProviderError {
  if (error instanceof CreatorDNAProviderError) return error;
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === 429) {
      return new CreatorDNAProviderError(
        "Groq is temporarily rate limited. Please try again shortly.",
        { cause: error },
      );
    }
  }
  return new CreatorDNAProviderError("Groq extraction failed.", {
    cause: error,
  });
}

export async function extractCreatorDNA(
  text: string,
  metadata: ContentMetadata,
): Promise<ExtractedCreatorDNA> {
  if (!text.trim()) {
    throw new CreatorDNAProviderError("Source text must not be empty.");
  }
  const parsed = ContentMetadataSchema.parse(metadata);
  const parsedMetadata: ContentMetadata = {
    title: parsed.title,
    ...(parsed.platform !== undefined ? { platform: parsed.platform } : {}),
    ...(parsed.publishedAt !== undefined
      ? { publishedAt: parsed.publishedAt }
      : {}),
  };

  let completion;
  try {
    const params: ChatCompletionCreateParams = {
      model: getGroqModel(),
      temperature: 0,
      messages: [
        { role: "system", content: CREATOR_DNA_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildExtractionUserPrompt(text, parsedMetadata),
        },
      ],
      response_format: responseFormat,
    };
    completion = await getGroqClient().chat.completions.create(params);
  } catch (error) {
    throw normalizeProviderError(error);
  }

  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) {
    throw new CreatorDNAProviderError("Groq returned an empty extraction.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch (error) {
    throw new CreatorDNAProviderError(
      "Groq returned malformed extraction JSON.",
      {
        cause: error,
      },
    );
  }

  const result = ExtractedCreatorDNASchema.safeParse(decoded);
  if (!result.success) {
    throw new CreatorDNAProviderError("Groq returned invalid Creator DNA.", {
      cause: result.error,
    });
  }
  return result.data;
}
