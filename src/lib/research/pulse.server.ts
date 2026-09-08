/// <reference types="node" />

import { listBrandTerritories } from "@/lib/creator-dna/brand-territories-repository";
import {
  getDnaNodesForUser,
  getFoundationForUser,
} from "@/lib/creator-dna/repository";
import { searchCreatorDNA } from "@/lib/creator-dna/server/search-dna";
import {
  fetchLiveResearch,
  isResearchProviderConfigured,
} from "./provider.server";
import { saveResearchItems } from "./repository.server";
import { interpretResearch } from "./reasoning.server";
import type { ResearchWindow } from "./types";

export class ResearchContextError extends Error {}

const usefulTypes = new Set([
  "theme",
  "belief",
  "expertise",
  "story",
  "experience",
  "lesson",
  "goal",
  "identity",
]);

export async function generateResearchPulse(
  userId: string,
  window: ResearchWindow,
) {
  if (!isResearchProviderConfigured())
    throw new ResearchContextError("research_provider_required");

  const [foundation, territories, allNodes] = await Promise.all([
    getFoundationForUser(userId),
    listBrandTerritories(userId),
    getDnaNodesForUser(userId),
  ]);
  const nodes = allNodes
    .filter((node) => usefulTypes.has(node.type))
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, 18);
  if (!territories.length && nodes.length < 3)
    throw new ResearchContextError("insufficient_creator_context");

  const context = JSON.stringify({
    foundation: foundation
      ? {
          whatYouDo: foundation.whatYouDo,
          mainTopics: foundation.mainTopics,
          expertise: foundation.expertise.slice(0, 5),
          beliefs: foundation.beliefs.slice(0, 5),
          goals: foundation.goals.slice(0, 5),
        }
      : null,
    intendedBrandTerritories: territories,
    historicalCreatorDNA: nodes.map((node) => ({
      type: node.type,
      label: node.label,
      summary: node.summary,
    })),
  });
  const liveItems = await fetchLiveResearch(context, window);
  if (!liveItems.length)
    throw new ResearchContextError("no_cited_research_found");

  const candidates = await Promise.all(
    liveItems.map((item) =>
      searchCreatorDNA(`${item.headline}\n${item.summary}`, userId, {
        matchCount: 6,
        matchThreshold: 0.3,
      }).catch(() => []),
    ),
  );
  const interpretations = await interpretResearch(
    liveItems,
    foundation,
    territories,
    candidates,
  );
  const byIndex = new Map(interpretations.map((item) => [item.index, item]));
  return saveResearchItems(
    userId,
    window,
    liveItems.flatMap((item, index) => {
      const interpretation = byIndex.get(index);
      return interpretation ? [{ ...item, ...interpretation }] : [];
    }),
  );
}
