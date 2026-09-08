import type { CreatorDNANode } from "@/lib/creator-dna/types";

export type ResearchWindow = "24h" | "7d";

export type ResearchSource = {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
};

export type ResearchDnaLink = {
  relevanceSummary: string;
  node: Omit<CreatorDNANode, "embedding">;
};

export type ResearchItem = {
  id: string;
  headline: string;
  summary: string;
  publishedAt: string | null;
  category: string | null;
  sources: ResearchSource[];
  whyItMatters: string;
  matchedTerritory: string | null;
  createdAt: string;
  dnaLinks: ResearchDnaLink[];
};

export type ExternalResearchPlanningContext = {
  id: string;
  headline: string;
  summary: string;
  sources: ResearchSource[];
  whyItMatters: string;
};
