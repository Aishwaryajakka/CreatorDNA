import type { ContentItem, CreatorDNAMatch, CreatorDNANode } from "./types";
import type { NewContentSubmissionInput } from "./validation";
import { CreatorFoundationSchema, type CreatorFoundation } from "./validation";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  ContentItemRow,
  DnaNodeInsert,
  DnaNodeRow,
} from "@/lib/supabase/types";

export type ExternalContentIdentity = {
  source: string;
  id: string;
  url?: string | null;
};

export type ContentPlaylistAssociation = {
  playlistId: string;
  playlistTitle: string;
  playlistPosition?: number | null;
};

function toContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    publishedAt: row.published_at,
    rawText: row.raw_text,
    createdAt: row.created_at,
  };
}

function toDnaNode(row: DnaNodeRow): CreatorDNANode {
  return {
    id: row.id,
    contentId: row.content_id,
    type: row.type,
    label: row.label,
    summary: row.summary,
    evidenceQuote: row.evidence_quote,
    confidence: row.confidence,
    sourceTitle: row.source_title,
    sourceDate: row.source_date,
    embedding: row.embedding,
    createdAt: row.created_at,
  };
}

export async function insertContentItem(
  input: NewContentSubmissionInput,
  userId: string,
  external?: ExternalContentIdentity,
): Promise<ContentItem> {
  const { data, error } = await supabaseServer
    .from("content_items")
    .insert({
      user_id: userId,
      title: input.title,
      platform: input.platform ?? null,
      external_source: external?.source ?? null,
      external_id: external?.id ?? null,
      external_url: external?.url ?? null,
      published_at: input.publishedAt ?? null,
      raw_text: input.rawText,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to insert content item: ${error.message}`);
  return toContentItem(data);
}

export async function getContentItemByExternalId(
  userId: string,
  source: string,
  externalId: string,
): Promise<ContentItem | null> {
  const { data, error } = await supabaseServer
    .from("content_items")
    .select()
    .eq("user_id", userId)
    .eq("external_source", source)
    .eq("external_id", externalId)
    .maybeSingle();
  if (error)
    throw new Error(`Failed to check imported content: ${error.message}`);
  return data ? toContentItem(data) : null;
}

export async function getImportedExternalIds(
  userId: string,
  source: string,
  externalIds: string[],
): Promise<Set<string>> {
  const uniqueIds = [...new Set(externalIds)];
  if (!uniqueIds.length) return new Set();
  const { data, error } = await supabaseServer
    .from("content_items")
    .select("external_id")
    .eq("user_id", userId)
    .eq("external_source", source)
    .in("external_id", uniqueIds);
  if (error)
    throw new Error(`Failed to check imported content: ${error.message}`);
  return new Set(
    data
      .map((row) => row.external_id)
      .filter((id): id is string => Boolean(id)),
  );
}

export async function addContentItemPlaylistAssociations(
  contentId: string,
  userId: string,
  associations: ContentPlaylistAssociation[],
): Promise<void> {
  if (!associations.length) return;
  if (!(await getContentItemById(contentId, userId))) {
    throw new Error("Content item not found.");
  }
  const { error } = await supabaseServer.from("content_item_playlists").upsert(
    associations.map((association) => ({
      content_id: contentId,
      playlist_id: association.playlistId,
      playlist_title: association.playlistTitle,
      playlist_position: association.playlistPosition ?? null,
    })),
    { onConflict: "content_id,playlist_id" },
  );
  if (error)
    throw new Error(`Failed to save playlist context: ${error.message}`);
}

export async function insertDnaNodes(
  nodes: CreatorDNANode[],
  userId: string,
): Promise<CreatorDNANode[]> {
  if (nodes.length === 0) return [];

  const contentIds = [...new Set(nodes.map((node) => node.contentId))];
  if (contentIds.some((contentId) => !contentId)) {
    throw new Error("DNA nodes must belong to a content item.");
  }
  for (const contentId of contentIds) {
    if (!(await getContentItemById(contentId as string, userId))) {
      throw new Error("Content item not found.");
    }
  }

  const rows: DnaNodeInsert[] = nodes.map((node) => ({
    id: node.id,
    content_id: node.contentId ?? null,
    type: node.type,
    label: node.label,
    summary: node.summary,
    evidence_quote: node.evidenceQuote ?? null,
    confidence: node.confidence ?? null,
    source_title: node.sourceTitle ?? null,
    source_date: node.sourceDate ?? null,
    embedding: node.embedding ?? null,
    ...(node.createdAt ? { created_at: node.createdAt } : {}),
  }));
  const { data, error } = await supabaseServer
    .from("dna_nodes")
    .insert(rows)
    .select();
  if (error) throw new Error(`Failed to insert DNA nodes: ${error.message}`);
  return data.map(toDnaNode);
}

export async function deleteContentItem(
  id: string,
  userId: string,
): Promise<void> {
  const { error } = await supabaseServer
    .from("content_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to delete content item: ${error.message}`);
}

export async function updateDnaNodeEmbedding(
  nodeId: string,
  embedding: number[],
  contentId: string,
  userId: string,
): Promise<void> {
  if (!(await getContentItemById(contentId, userId))) {
    throw new Error("Content item not found.");
  }
  const { error } = await supabaseServer
    .from("dna_nodes")
    .update({ embedding })
    .eq("id", nodeId)
    .eq("content_id", contentId);
  if (error)
    throw new Error(`Failed to save DNA node embedding: ${error.message}`);
}

export async function matchDnaNodes(
  queryEmbedding: number[],
  userId: string,
  matchThreshold = 0.25,
  matchCount = 10,
): Promise<CreatorDNAMatch[]> {
  const { data, error } = await supabaseServer.rpc("match_dna_nodes", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    match_user_id: userId,
  });
  if (error) throw new Error(`Failed to search DNA nodes: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    contentId: row.content_id,
    type: row.type,
    label: row.label,
    summary: row.summary,
    evidenceQuote: row.evidence_quote,
    sourceTitle: row.source_title,
    sourceDate: row.source_date,
    confidence: row.confidence,
    similarity: row.similarity,
  }));
}

export async function getContentItemById(
  id: string,
  userId: string,
): Promise<ContentItem | null> {
  const { data, error } = await supabaseServer
    .from("content_items")
    .select()
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch content item: ${error.message}`);
  return data ? toContentItem(data) : null;
}

export async function getDnaNodesByContentId(
  contentId: string,
  userId: string,
): Promise<CreatorDNANode[]> {
  const content = await getContentItemById(contentId, userId);
  if (!content) return [];
  const { data, error } = await supabaseServer
    .from("dna_nodes")
    .select()
    .eq("content_id", contentId);
  if (error) throw new Error(`Failed to fetch DNA nodes: ${error.message}`);
  return data.map(toDnaNode);
}

export async function getDnaNodesForUser(
  userId: string,
): Promise<CreatorDNANode[]> {
  const { data: content, error: contentError } = await supabaseServer
    .from("content_items")
    .select("id,platform,external_url")
    .eq("user_id", userId);
  if (contentError)
    throw new Error(`Failed to fetch content items: ${contentError.message}`);
  const contentIds = content.map((item) => item.id);
  if (contentIds.length === 0) return [];
  const sourcesByContentId = new Map(
    content.map((item) => [
      item.id,
      { platform: item.platform, url: item.external_url },
    ]),
  );
  const { data, error } = await supabaseServer
    .from("dna_nodes")
    .select(
      "id,content_id,type,label,summary,evidence_quote,confidence,source_title,source_date,embedding,created_at",
    )
    .in("content_id", contentIds)
    .order("created_at", { ascending: true });
  if (error)
    throw new Error(`Failed to fetch Story Map nodes: ${error.message}`);
  return data.map((row) => {
    const node = toDnaNode(row);
    const source = row.content_id
      ? sourcesByContentId.get(row.content_id)
      : undefined;
    return {
      ...node,
      sourcePlatform: source?.platform ?? null,
      sourceUrl: source?.url ?? null,
    };
  });
}

export async function replaceFoundationNodes(
  foundation: CreatorFoundation,
  userId: string,
): Promise<CreatorDNANode[]> {
  const old = await supabaseServer
    .from("content_items")
    .select("id")
    .eq("user_id", userId)
    .eq("title", "Creator Foundation");
  if (old.error) throw new Error(old.error.message);
  if (old.data.length) {
    const removed = await supabaseServer
      .from("content_items")
      .delete()
      .in(
        "id",
        old.data.map((row) => row.id),
      )
      .eq("user_id", userId);
    if (removed.error) throw new Error(removed.error.message);
  }
  const content = await insertContentItem(
    { title: "Creator Foundation", rawText: JSON.stringify(foundation) },
    userId,
  );
  const date = new Date().toISOString();
  const entries: Array<{
    type: CreatorDNANode["type"];
    label: string;
    summary: string;
  }> = [
    { type: "identity", label: "What I do", summary: foundation.whatYouDo },
    { type: "theme", label: "Main topics", summary: foundation.mainTopics },
    ...foundation.expertise.map((summary) => ({
      type: "expertise" as const,
      label: summary,
      summary,
    })),
    ...foundation.importantExperiences.map((summary) => ({
      type: "experience" as const,
      label: summary,
      summary,
    })),
    ...foundation.accomplishments.map((summary) => ({
      type: "experience" as const,
      label: summary,
      summary,
    })),
    ...foundation.failures.map((summary) => ({
      type: "experience" as const,
      label: summary,
      summary,
    })),
    ...foundation.perspectiveChanges.map((summary) => ({
      type: "lesson" as const,
      label: summary,
      summary,
    })),
    ...foundation.beliefs.map((summary) => ({
      type: "belief" as const,
      label: summary,
      summary,
    })),
    ...foundation.values.map((summary) => ({
      type: "value" as const,
      label: summary,
      summary,
    })),
    ...foundation.personality.map((summary) => ({
      type: "identity" as const,
      label: summary,
      summary,
    })),
    ...foundation.goals.map((summary) => ({
      type: "goal" as const,
      label: summary,
      summary,
    })),
  ];
  return insertDnaNodes(
    entries.map((entry) => ({
      id: crypto.randomUUID(),
      contentId: content.id,
      type: entry.type,
      label: entry.label,
      summary: entry.summary,
      evidenceQuote: `Creator-declared foundation: ${entry.summary}`,
      confidence: 1,
      sourceTitle: "Creator Foundation",
      sourceDate: date,
    })),
    userId,
  );
}

export async function getFoundationForUser(
  userId: string,
): Promise<CreatorFoundation | null> {
  const { data, error } = await supabaseServer
    .from("content_items")
    .select("raw_text")
    .eq("user_id", userId)
    .eq("title", "Creator Foundation")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  try {
    const parsed: unknown = JSON.parse(data.raw_text);
    const result = CreatorFoundationSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function checkDatabaseConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const { error } = await supabaseServer
    .from("content_items")
    .select("id")
    .limit(1);
  return error ? { ok: false, error: error.message } : { ok: true };
}
