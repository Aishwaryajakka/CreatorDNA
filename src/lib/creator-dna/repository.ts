import type { ContentItem, CreatorDNAMatch, CreatorDNANode } from "./types";
import type { NewContentSubmissionInput } from "./validation";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  ContentItemRow,
  DnaNodeInsert,
  DnaNodeRow,
} from "@/lib/supabase/types";

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
): Promise<ContentItem> {
  const { data, error } = await supabaseServer
    .from("content_items")
    .insert({
      title: input.title,
      platform: input.platform ?? null,
      published_at: input.publishedAt ?? null,
      raw_text: input.rawText,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to insert content item: ${error.message}`);
  return toContentItem(data);
}

export async function insertDnaNodes(
  nodes: CreatorDNANode[],
): Promise<CreatorDNANode[]> {
  if (nodes.length === 0) return [];

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

export async function deleteContentItem(id: string): Promise<void> {
  const { error } = await supabaseServer
    .from("content_items")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Failed to delete content item: ${error.message}`);
}

export async function updateDnaNodeEmbedding(
  nodeId: string,
  embedding: number[],
): Promise<void> {
  const { error } = await supabaseServer
    .from("dna_nodes")
    .update({ embedding })
    .eq("id", nodeId);
  if (error)
    throw new Error(`Failed to save DNA node embedding: ${error.message}`);
}

export async function matchDnaNodes(
  queryEmbedding: number[],
  matchThreshold = 0.25,
  matchCount = 10,
): Promise<CreatorDNAMatch[]> {
  const { data, error } = await supabaseServer.rpc("match_dna_nodes", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
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
): Promise<ContentItem | null> {
  const { data, error } = await supabaseServer
    .from("content_items")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch content item: ${error.message}`);
  return data ? toContentItem(data) : null;
}

export async function getDnaNodesByContentId(
  contentId: string,
): Promise<CreatorDNANode[]> {
  const { data, error } = await supabaseServer
    .from("dna_nodes")
    .select()
    .eq("content_id", contentId);
  if (error) throw new Error(`Failed to fetch DNA nodes: ${error.message}`);
  return data.map(toDnaNode);
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
