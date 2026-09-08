import { z } from "zod";

export const TargetPlatformSchema = z.enum([
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
  "youtube_shorts",
  "x",
  "threads",
]);

const nonEmptyString = z.string().trim().min(1);

export const BrandTerritoryInputSchema = z.object({
  name: nonEmptyString.max(80),
  description: z.string().trim().max(280).optional(),
});

const BrandTerritoryListSchema = z
  .array(BrandTerritoryInputSchema)
  .transform((territories) => {
    const seen = new Set<string>();
    return territories.filter(({ name }) => {
      const normalized = name.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  })
  .pipe(z.array(BrandTerritoryInputSchema).min(3).max(7));

export const BrandTerritoriesInputSchema = z.object({
  territories: BrandTerritoryListSchema,
});

export type BrandTerritoriesInput = z.infer<typeof BrandTerritoriesInputSchema>;

export const DnaKindSchema = z.enum([
  "story",
  "belief",
  "theme",
  "experience",
  "lesson",
  "value",
  "goal",
  "identity",
  "expertise",
]);

export const CreatorFoundationSchema = z.object({
  whatYouDo: nonEmptyString,
  mainTopics: nonEmptyString,
  expertise: z.array(nonEmptyString).default([]),
  importantExperiences: z.array(nonEmptyString).default([]),
  accomplishments: z.array(nonEmptyString).default([]),
  failures: z.array(nonEmptyString).default([]),
  perspectiveChanges: z.array(nonEmptyString).default([]),
  beliefs: z.array(nonEmptyString).min(1).max(5),
  values: z.array(nonEmptyString).default([]),
  personality: z.array(nonEmptyString).default([]),
  goals: z.array(nonEmptyString).default([]),
});
export type CreatorFoundation = z.infer<typeof CreatorFoundationSchema>;

export const DNANodeExtractionSchema = z.object({
  label: nonEmptyString,
  summary: nonEmptyString,
  evidenceQuote: nonEmptyString,
  confidence: z.number().min(0).max(1),
});

export const ExtractedCreatorDNASchema = z.object({
  stories: z.array(DNANodeExtractionSchema),
  beliefs: z.array(DNANodeExtractionSchema),
  themes: z.array(DNANodeExtractionSchema),
  experiences: z.array(DNANodeExtractionSchema),
  lessons: z.array(DNANodeExtractionSchema),
});

export const ContentMetadataSchema = z.object({
  title: nonEmptyString,
  platform: z.string().trim().nullable().optional(),
  publishedAt: z.string().trim().nullable().optional(),
});

export const NewContentSubmissionInputSchema = ContentMetadataSchema.extend({
  rawText: nonEmptyString,
});

export type NewContentSubmissionInput = z.infer<
  typeof NewContentSubmissionInputSchema
>;

export const PlanContentInputSchema = z.object({
  idea: nonEmptyString,
  targetPlatform: TargetPlatformSchema,
  researchItemId: z.string().uuid().optional(),
});

export const ReshapeModeSchema = z.enum([
  "closer_to_story",
  "stronger_point_of_view",
  "fresh_angle",
]);

export const ReshapeContentInputSchema = z.object({
  idea: nonEmptyString,
  targetPlatform: TargetPlatformSchema,
  directionIndex: z.number().int().min(0).max(2),
  reshapeMode: ReshapeModeSchema,
});

const supportingNodeIdsSchema = z.array(nonEmptyString);
const statusSchema = z.enum(["identified", "insufficient evidence"]);
const alignmentEvidenceSchema = z.object({
  text: nonEmptyString,
  supportingNodeIds: supportingNodeIdsSchema,
});

export const StoryIntelligenceAngleSchema = z.object({
  title: nonEmptyString,
  framingType: z.enum([
    "personal story",
    "perspective evolution",
    "contrarian",
    "lesson learned",
    "reflective",
    "audience-focused",
  ]),
  hook: nonEmptyString,
  rationale: nonEmptyString,
  supportingNodeIds: supportingNodeIdsSchema,
});

export const StoryIntelligenceSchema = z.object({
  alignment: z.object({
    state: z.enum(["strong", "mixed", "weak", "insufficient_evidence"]),
    why: z.array(alignmentEvidenceSchema).max(3),
    watchOut: z.array(alignmentEvidenceSchema).max(3),
    opportunity: nonEmptyString,
  }),
  relevantStories: z.array(
    z.object({
      summary: nonEmptyString,
      supportingNodeIds: supportingNodeIdsSchema,
    }),
  ),
  previousPositions: z.array(
    z.object({
      position: nonEmptyString,
      supportingNodeIds: supportingNodeIdsSchema,
    }),
  ),
  possiblePerspectiveEvolution: z.object({
    status: statusSchema,
    summary: nonEmptyString,
    supportingNodeIds: supportingNodeIdsSchema,
  }),
  possibleRepetition: z.object({
    status: z.enum(["identified", "not detected", "insufficient evidence"]),
    summary: nonEmptyString,
    supportingNodeIds: supportingNodeIdsSchema,
  }),
  threeAuthenticAngles: z.array(StoryIntelligenceAngleSchema).length(3),
});
