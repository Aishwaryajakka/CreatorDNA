export type DnaKind =
  | "story"
  | "belief"
  | "theme"
  | "experience"
  | "lesson"
  | "value"
  | "goal"
  | "identity"
  | "expertise";

export type TargetPlatform =
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "youtube_shorts"
  | "x"
  | "threads";

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
  sourcePlatform?: string | null;
  sourceUrl?: string | null;
  embedding?: number[] | null;
  createdAt?: string;
};

export type CreatorDNAEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
};

export type BrandTerritory = {
  id: string;
  name: string;
  description: string | null;
  position: number;
};

export type BrandEvolutionPoint = {
  id: string;
  date: string;
  type: DnaKind;
  title: string;
  summary: string;
  evidenceQuote: string | null;
  sourceTitle: string | null;
  sourceDate: string;
  contentId: string | null;
  stage: "past" | "turning_point" | "new_position";
};

export type BrandEvolutionResult = {
  timeline: BrandEvolutionPoint[];
  currentPosition: {
    beliefs: BrandEvidenceNode[];
    themes: BrandEvidenceNode[];
    expertise: BrandEvidenceNode[];
  };
  futureDirection: {
    label: "Declared direction";
    territories: BrandTerritory[];
    goals: BrandEvidenceNode[];
  };
};

export type BrandEvidenceNode = Omit<CreatorDNANode, "embedding">;

export type PlanningCreatorContext = {
  intendedBrandTerritories: BrandTerritory[];
  creatorFoundation?: {
    whatYouDo: string;
    mainTopics: string;
    expertise: string[];
    beliefs: string[];
    goals: string[];
  };
  externalResearch?: {
    headline: string;
    summary: string;
    sources: Array<{ title: string; url: string; publisher: string }>;
    whyItMatters: string;
  };
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

export type StoryIntelligenceAngle = {
  title: string;
  framingType:
    | "personal story"
    | "perspective evolution"
    | "contrarian"
    | "lesson learned"
    | "reflective"
    | "audience-focused";
  hook: string;
  rationale: string;
  supportingNodeIds: string[];
  platformPrep: {
    platform: TargetPlatform;
    hook: string;
    formatRecommendation: string;
    structure: string[];
    toneNotes: string[];
    avoid: string[];
    suggestedTitle: string | null;
  };
};

export type AlignmentState =
  "strong" | "mixed" | "weak" | "insufficient_evidence";

export type AlignmentEvidence = {
  text: string;
  supportingNodeIds: string[];
};

export type StoryIntelligenceAlignment = {
  state: AlignmentState;
  why: AlignmentEvidence[];
  watchOut: AlignmentEvidence[];
  opportunity: string;
};

export type ReshapeMode =
  "closer_to_story" | "stronger_point_of_view" | "fresh_angle";

export type ReshapeResult = {
  title: string;
  angle: string;
  platformPrep: {
    platform: TargetPlatform;
    hook?: string;
    structure?: string[];
    notes?: string[];
  };
  groundedIn: Array<{
    nodeId: string;
    type: CreatorDNANode["type"];
    label: string;
    summary?: string;
    sourceTitle?: string | null;
  }>;
};

export type StoryIntelligenceResult = {
  alignment: StoryIntelligenceAlignment;
  relevantStories: Array<{
    summary: string;
    supportingNodeIds: string[];
  }>;
  previousPositions: Array<{
    position: string;
    supportingNodeIds: string[];
  }>;
  possiblePerspectiveEvolution: {
    status: "identified" | "insufficient evidence";
    summary: string;
    supportingNodeIds: string[];
  };
  possibleRepetition: {
    status: "identified" | "not detected" | "insufficient evidence";
    summary: string;
    supportingNodeIds: string[];
  };
  threeAuthenticAngles: [
    StoryIntelligenceAngle,
    StoryIntelligenceAngle,
    StoryIntelligenceAngle,
  ];
};
