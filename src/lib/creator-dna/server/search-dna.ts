import type { CreatorDNAMatch } from "../types";
import { embedQuery, CreatorDNAEmbeddingError } from "./embeddings";
import { matchDnaNodes } from "../repository";

export async function searchCreatorDNA(
  query: string,
  userId: string,
  options: { matchThreshold?: number; matchCount?: number } = {},
): Promise<CreatorDNAMatch[]> {
  if (!query.trim()) {
    throw new CreatorDNAEmbeddingError("Search query must not be empty.");
  }
  const matchThreshold = options.matchThreshold ?? 0.25;
  const matchCount = options.matchCount ?? 10;
  if (matchThreshold < 0 || matchThreshold > 1 || matchCount < 1) {
    throw new CreatorDNAEmbeddingError("Invalid search options.");
  }
  const queryEmbedding = await embedQuery(query);
  return matchDnaNodes(queryEmbedding, userId, matchThreshold, matchCount);
}
