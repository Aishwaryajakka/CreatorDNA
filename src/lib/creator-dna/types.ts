export type DnaKind = "story" | "belief" | "theme" | "experience" | "lesson";

export type ContentItem = {
  id: string;
  title: string;
  platform?: string | null;
  publishedAt?: string | null;
  rawText: string;
  createdAt?: string;
};

export type DNANodeExtraction = {
  label: string;
  summary: string;
  evidenceQuote: string;
  confidence: number;
};

export type ExtractedCreatorDNA = {
  stories: DNANodeExtraction[];
  beliefs: DNANodeExtraction[];
  themes: DNANodeExtraction[];
  experiences: DNANodeExtraction[];
  lessons: DNANodeExtraction[];
};

export type CreatorDNANode = {
  id: string;
  contentId?: string | null;
  type: DnaKind;
  label: string;
  summary: string;
  evidenceQuote?: string | null;
  confidence?: number | null;
  sourceTitle?: string | null;
  sourceDate?: string | null;
  embedding?: number[] | null;
  createdAt?: string;
};

export type CreatorDNAEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
};

export type CreatorDNAMatch = {
  id: string;
  contentId?: string | null;
  type: DnaKind;
  label: string;
  summary: string;
  evidenceQuote?: string | null;
  sourceTitle?: string | null;
  sourceDate?: string | null;
  confidence?: number | null;
  similarity: number;
};

export type ContentMetadata = {
  title: string;
  platform?: string | null;
  publishedAt?: string | null;
};
