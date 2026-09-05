import { CreatorFoundationSchema, type CreatorFoundation } from "../validation";
import {
  deleteContentItem,
  replaceFoundationNodes,
  updateDnaNodeEmbedding,
} from "../repository";
import { buildDnaNodeEmbeddingText, embedTexts } from "./embeddings";
export async function saveCreatorFoundation(input: unknown, userId: string) {
  const foundation = CreatorFoundationSchema.parse(input);
  const nodes = await replaceFoundationNodes(foundation, userId);
  const contentId = nodes[0]?.contentId;
  if (!contentId) return { nodes };
  try {
    const embeddings = await embedTexts(nodes.map(buildDnaNodeEmbeddingText));
    await Promise.all(
      nodes.map((node, i) =>
        updateDnaNodeEmbedding(node.id, embeddings[i] ?? [], contentId, userId),
      ),
    );
    return { nodes };
  } catch (error) {
    await deleteContentItem(contentId, userId);
    throw error;
  }
}
