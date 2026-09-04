/// <reference types="node" />

import type { CreatorDNANode } from "../types";

export const DEFAULT_EMBEDDING_MODEL = "jina-embeddings-v3";
export const EMBEDDING_DIMENSION = 1024;
const JINA_EMBEDDINGS_URL = "https://api.jina.ai/v1/embeddings";

export class CreatorDNAEmbeddingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CreatorDNAEmbeddingError";
  }
}

function requiredApiKey(): string {
  const apiKey = process.env["JINA_API_KEY"];
  if (!apiKey) {
    throw new CreatorDNAEmbeddingError(
      "Embeddings are not configured. Set JINA_API_KEY on the server.",
    );
  }
  return apiKey;
}

function getModel(): string {
  return process.env["JINA_EMBEDDING_MODEL"] || DEFAULT_EMBEDDING_MODEL;
}

export function buildDnaNodeEmbeddingText(node: CreatorDNANode): string {
  return `${node.type}\n${node.label}\n${node.summary}`;
}

export function embedDocument(text: string): Promise<number[]> {
  return requestEmbeddings([text], "retrieval.passage").then(
    (embeddings) => embeddings[0] ?? [],
  );
}

export function embedQuery(text: string): Promise<number[]> {
  return requestEmbeddings([text], "retrieval.query").then(
    (embeddings) => embeddings[0] ?? [],
  );
}

/** Preserved compatibility helper; search queries use retrieval.query mode. */
export function embedText(text: string): Promise<number[]> {
  return embedQuery(text);
}

/** Preserved compatibility helper; ingestion uses retrieval.passage mode. */
export function embedTexts(texts: string[]): Promise<number[][]> {
  return requestEmbeddings(texts, "retrieval.passage");
}

async function requestEmbeddings(
  texts: string[],
  task: "retrieval.passage" | "retrieval.query",
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.some((text) => !text.trim())) {
    throw new CreatorDNAEmbeddingError("Embedding text must not be empty.");
  }

  let response: Response;
  try {
    response = await fetch(JINA_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requiredApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getModel(),
        task,
        dimensions: EMBEDDING_DIMENSION,
        input: texts,
      }),
    });
  } catch (error) {
    throw new CreatorDNAEmbeddingError("Embedding generation failed.", {
      cause: error,
    });
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new CreatorDNAEmbeddingError(
        "Embedding service is temporarily rate limited.",
      );
    }
    throw new CreatorDNAEmbeddingError("Embedding generation failed.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new CreatorDNAEmbeddingError(
      "Embedding service returned invalid data.",
      {
        cause: error,
      },
    );
  }

  const embeddings = extractEmbeddings(payload);
  if (
    embeddings.length !== texts.length ||
    embeddings.some((embedding) => embedding.length !== EMBEDDING_DIMENSION)
  ) {
    throw new CreatorDNAEmbeddingError(
      `Embedding provider returned an unexpected vector dimension; expected ${EMBEDDING_DIMENSION}.`,
    );
  }
  return embeddings;
}

function extractEmbeddings(payload: unknown): number[][] {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new CreatorDNAEmbeddingError(
      "Embedding service returned invalid data.",
    );
  }
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new CreatorDNAEmbeddingError(
      "Embedding service returned invalid data.",
    );
  }
  return data
    .sort((a, b) => {
      const aIndex = a && typeof a === "object" && "index" in a ? a.index : 0;
      const bIndex = b && typeof b === "object" && "index" in b ? b.index : 0;
      return Number(aIndex) - Number(bIndex);
    })
    .map((item) => {
      const embedding =
        item && typeof item === "object" && "embedding" in item
          ? item.embedding
          : undefined;
      if (
        !Array.isArray(embedding) ||
        embedding.some((value) => typeof value !== "number")
      ) {
        throw new CreatorDNAEmbeddingError(
          "Embedding service returned invalid data.",
        );
      }
      return embedding;
    });
}
