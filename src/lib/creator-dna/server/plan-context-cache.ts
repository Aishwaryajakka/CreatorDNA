/// <reference types="node" />

import type {
  CreatorDNAMatch,
  StoryIntelligenceResult,
  TargetPlatform,
} from "../types";
import type { BrandTerritory } from "../types";
import type { CreatorFoundation } from "../validation";

export type TrustedPlanContext = {
  retrievedDNA: CreatorDNAMatch[];
  creatorFoundation: CreatorFoundation | null;
  intendedBrandTerritories: BrandTerritory[];
  intelligence: StoryIntelligenceResult;
};

type CacheEntry = TrustedPlanContext & { expiresAt: number };

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 100;
const cache = new Map<string, CacheEntry>();

function key(userId: string, idea: string, targetPlatform: TargetPlatform) {
  return `${userId}\u0000${targetPlatform}\u0000${idea.trim()}`;
}

export function cacheTrustedPlanContext(
  userId: string,
  idea: string,
  targetPlatform: TargetPlatform,
  context: TrustedPlanContext,
) {
  const now = Date.now();
  for (const [entryKey, entry] of cache)
    if (entry.expiresAt <= now) cache.delete(entryKey);
  while (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value as string | undefined;
    if (!oldest) break;
    cache.delete(oldest);
  }
  cache.set(key(userId, idea, targetPlatform), {
    ...context,
    expiresAt: now + CACHE_TTL_MS,
  });
}

export function getTrustedPlanContext(
  userId: string,
  idea: string,
  targetPlatform: TargetPlatform,
): TrustedPlanContext | null {
  const entryKey = key(userId, idea, targetPlatform);
  const entry = cache.get(entryKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(entryKey);
    return null;
  }
  return entry;
}

export function clearTrustedPlanContextsForUser(userId: string) {
  const prefix = `${userId}\u0000`;
  for (const entryKey of cache.keys())
    if (entryKey.startsWith(prefix)) cache.delete(entryKey);
}
