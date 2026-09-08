/// <reference types="node" />

import { getDnaNodesForUser } from "@/lib/creator-dna/repository";
import { supabaseServer } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { LiveResearchItem } from "./provider.server";
import type { ResearchItem, ResearchSource, ResearchWindow } from "./types";
import { ResearchSourceSchema } from "./validation";

type PersistableResearch = LiveResearchItem & {
  whyItMatters: string;
  matchedTerritory: string | null;
  links: Array<{ nodeId: string; relevanceSummary: string }>;
};

function sourcesFromJson(value: Json): ResearchSource[] {
  const parsed = ResearchSourceSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

function contextFromJson(value: Json) {
  if (!value || Array.isArray(value) || typeof value !== "object")
    return { whyItMatters: "", matchedTerritory: null as string | null };
  return {
    whyItMatters:
      typeof value["whyItMatters"] === "string" ? value["whyItMatters"] : "",
    matchedTerritory:
      typeof value["matchedTerritory"] === "string"
        ? value["matchedTerritory"]
        : null,
  };
}

export async function listResearchItems(
  userId: string,
  limit = 30,
): Promise<ResearchItem[]> {
  const { data: rows, error } = await supabaseServer
    .from("research_items")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Unable to load research items.");
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const [{ data: linkRows, error: linkError }, ownedNodes] = await Promise.all([
    supabaseServer
      .from("research_item_dna_links")
      .select()
      .in("research_item_id", ids),
    getDnaNodesForUser(userId),
  ]);
  if (linkError) throw new Error("Unable to load research links.");
  const nodes = new Map(ownedNodes.map((node) => [node.id, node]));

  return rows.map((row) => {
    const context = contextFromJson(row.query_context);
    return {
      id: row.id,
      headline: row.headline,
      summary: row.summary,
      publishedAt: row.published_at,
      category: row.category,
      sources: sourcesFromJson(row.source_data),
      whyItMatters: context.whyItMatters,
      matchedTerritory: context.matchedTerritory,
      createdAt: row.created_at,
      dnaLinks: linkRows
        .filter((link) => link.research_item_id === row.id)
        .flatMap((link) => {
          const node = nodes.get(link.dna_node_id);
          if (!node) return [];
          const { embedding, ...safeNode } = node;
          void embedding;
          return [
            {
              relevanceSummary: link.relevance_summary,
              node: safeNode,
            },
          ];
        }),
    };
  });
}

export async function getResearchItem(userId: string, id: string) {
  const { data, error } = await supabaseServer
    .from("research_items")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Unable to load research item.");
  if (!data) return null;
  return (
    (await listResearchItems(userId, 100)).find((item) => item.id === id) ??
    null
  );
}

function normalizedUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()])
      if (key.startsWith("utm_")) url.searchParams.delete(key);
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
}

export async function saveResearchItems(
  userId: string,
  window: ResearchWindow,
  items: PersistableResearch[],
) {
  const existing = await listResearchItems(userId, 30);
  const existingKeys = new Set(
    existing.map((item) =>
      item.sources[0]?.url
        ? `url:${normalizedUrl(item.sources[0].url)}`
        : `headline:${item.headline.trim().toLowerCase()}`,
    ),
  );
  const ownedNodeIds = new Set(
    (await getDnaNodesForUser(userId)).map((node) => node.id),
  );

  for (const item of items) {
    const key = item.sources[0]?.url
      ? `url:${normalizedUrl(item.sources[0].url)}`
      : `headline:${item.headline.trim().toLowerCase()}`;
    if (existingKeys.has(key) || !item.sources.length) continue;
    const { data: saved, error } = await supabaseServer
      .from("research_items")
      .insert({
        user_id: userId,
        headline: item.headline,
        summary: item.summary,
        published_at: item.publishedAt,
        category: item.category,
        source_data: item.sources as unknown as Json,
        query_context: {
          window,
          whyItMatters: item.whyItMatters,
          matchedTerritory: item.matchedTerritory,
        },
      })
      .select("id")
      .single();
    if (error) throw new Error("Unable to save research item.");
    const links = item.links
      .filter((link) => ownedNodeIds.has(link.nodeId))
      .map((link) => ({
        research_item_id: saved.id,
        dna_node_id: link.nodeId,
        relevance_summary: link.relevanceSummary,
      }));
    if (links.length) {
      const { error: linkError } = await supabaseServer
        .from("research_item_dna_links")
        .insert(links);
      if (linkError) {
        await supabaseServer
          .from("research_items")
          .delete()
          .eq("id", saved.id)
          .eq("user_id", userId);
        throw new Error("Unable to save research links.");
      }
    }
    existingKeys.add(key);
  }
  return listResearchItems(userId);
}
