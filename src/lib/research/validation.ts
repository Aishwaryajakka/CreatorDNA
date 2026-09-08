import { z } from "zod";

export const ResearchWindowSchema = z.enum(["24h", "7d"]);
export const ResearchPulseInputSchema = z.object({
  window: ResearchWindowSchema.default("7d"),
});

export const ResearchSourceSchema = z.object({
  title: z.string().trim().min(1),
  url: z.string().url(),
  publisher: z.string().trim().min(1),
  publishedAt: z.string().nullable(),
});
