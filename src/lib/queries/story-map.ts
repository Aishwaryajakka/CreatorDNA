import { useQuery } from "@tanstack/react-query";

import type { CreatorDNANode } from "@/lib/creator-dna/types";
import { authenticatedFetch } from "@/lib/supabase/client";

export const storyMapQueryKey = ["user", "story-map"] as const;

export function useStoryMapQuery() {
  return useQuery({
    queryKey: storyMapQueryKey,
    queryFn: async () => {
      const response = await authenticatedFetch("/api/story-map");
      const data = (await response.json()) as {
        nodes?: CreatorDNANode[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(data.nodes))
        throw new Error(data.error ?? "Unable to load your Story Map.");
      return data.nodes;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
