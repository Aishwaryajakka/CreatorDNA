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
