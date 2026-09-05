import type {
  ContentItem,
  CreatorDNANode,
  ExtractedCreatorDNA,
} from "../types";
import { NewContentSubmissionInputSchema } from "../validation";
import {
  deleteContentItem,
  getContentItemById,
  getDnaNodesByContentId,
  insertContentItem,
  insertDnaNodes,
  updateDnaNodeEmbedding,
} from "../repository";
import type { ExternalContentIdentity } from "../repository";
import { extractCreatorDNA } from "./extract";
import { buildDnaNodeEmbeddingText, embedTexts } from "./embeddings";

export type SaveCreatorContentAndDNAInput = {
  title: string;
  platform?: string | null;
  publishedAt?: string | null;
  rawText: string;
  external?: ExternalContentIdentity;
};

export type SaveCreatorContentAndDNAResult = {
  contentItem: ContentItem;
  extractedDNA: ExtractedCreatorDNA;
  savedNodes: CreatorDNANode[];
};

const categoryToType = {
  stories: "story",
  beliefs: "belief",
  themes: "theme",
  experiences: "experience",
  lessons: "lesson",
} as const;

export async function saveCreatorContentAndDNA(
  input: SaveCreatorContentAndDNAInput,
  userId: string,
): Promise<SaveCreatorContentAndDNAResult> {
  const parsed = NewContentSubmissionInputSchema.parse(input);
  const contentItem = await insertContentItem(parsed, userId, input.external);

  try {
    const extractedDNA = await extractCreatorDNA(parsed.rawText, {
      title: parsed.title,
      ...(parsed.platform !== undefined ? { platform: parsed.platform } : {}),
      ...(parsed.publishedAt !== undefined
        ? { publishedAt: parsed.publishedAt }
        : {}),
    });

    const savedNodes = await insertDnaNodes(
      flattenExtractedDNA(extractedDNA, contentItem),
      userId,
    );
    const embeddings = await embedTexts(
      savedNodes.map(buildDnaNodeEmbeddingText),
    );
    await Promise.all(
      savedNodes.map((node, index) =>
        updateDnaNodeEmbedding(
          node.id,
          embeddings[index] ?? [],
          contentItem.id,
          userId,
        ),
      ),
    );
    const savedNodesWithEmbeddings = await getDnaNodesByContentId(
      contentItem.id,
      userId,
    );
    await verifySavedContentAndDNA(
      contentItem,
      savedNodesWithEmbeddings,
      userId,
    );

    return {
      contentItem,
      extractedDNA,
      savedNodes: savedNodesWithEmbeddings,
    };
  } catch (error) {
    try {
      await deleteContentItem(contentItem.id, userId);
    } catch (rollbackError) {
      throw new Error(
        "Creator DNA save failed and rollback was unsuccessful.",
        {
          cause: rollbackError,
        },
      );
    }
    throw error;
  }
}

function flattenExtractedDNA(
  extractedDNA: ExtractedCreatorDNA,
  contentItem: ContentItem,
): CreatorDNANode[] {
  return (
    Object.keys(categoryToType) as Array<keyof ExtractedCreatorDNA>
  ).flatMap((category) =>
    extractedDNA[category].map((node) => ({
      id: crypto.randomUUID(),
      contentId: contentItem.id,
      type: categoryToType[category],
      label: node.label,
      summary: node.summary,
      evidenceQuote: node.evidenceQuote,
      confidence: node.confidence,
      sourceTitle: contentItem.title,
      sourceDate: contentItem.publishedAt ?? null,
    })),
  );
}

async function verifySavedContentAndDNA(
  contentItem: ContentItem,
  savedNodes: CreatorDNANode[],
  userId: string,
): Promise<void> {
  const persistedContent = await getContentItemById(contentItem.id, userId);
  const persistedNodes = await getDnaNodesByContentId(contentItem.id, userId);

  if (!persistedContent || persistedNodes.length !== savedNodes.length) {
    throw new Error("Creator DNA persistence verification failed.");
  }

  const valid = persistedNodes.every(
    (node) =>
      node.contentId === contentItem.id &&
      node.sourceTitle === contentItem.title &&
      node.evidenceQuote != null &&
      node.evidenceQuote.length > 0 &&
      node.confidence != null &&
      node.embedding != null &&
      (contentItem.publishedAt == null ||
        node.sourceDate === contentItem.publishedAt),
  );
  if (!valid) throw new Error("Creator DNA persistence verification failed.");
}
