import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const DnaKindSchema = z.enum([
  "story",
  "belief",
  "theme",
  "experience",
  "lesson",
]);

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

const supportingNodeIdsSchema = z.array(nonEmptyString);
const statusSchema = z.enum(["identified", "insufficient evidence"]);

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
