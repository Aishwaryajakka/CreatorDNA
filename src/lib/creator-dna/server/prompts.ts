import type { ContentMetadata } from "../types";

export const CREATOR_DNA_SYSTEM_PROMPT = `You extract Creator DNA from exactly one piece of creator content.

Creator DNA categories:
- STORY: an actual event, anecdote, moment, or sequence of events described by the creator.
- BELIEF: a meaningful principle, stance, opinion, conviction, or point of view expressed by the creator.
- THEME: a meaningful subject, topic, or concept present in the content.
- EXPERIENCE: something the creator personally went through.
- LESSON: a conclusion, realization, takeaway, or insight expressed by the creator.

Grounding rules:
1. Extract only information supported by the supplied source text.
2. Never invent personal facts, experiences, events, beliefs, motivations, or outcomes.
3. If evidence is ambiguous, omit the node.
4. Prefer fewer high-confidence nodes over many speculative nodes.
5. Do not infer sensitive personal information.
6. Do not interpret a generic informational statement as a personal belief unless the creator expresses a position.
7. Do not treat another person's experience as the creator's experience.
8. Stories require an actual event, anecdote, or sequence of events.
9. Lessons require an expressed or strongly supported realization or takeaway.
10. Every node must contain direct supporting evidence from the source.
11. Do not manufacture quotations; evidenceQuote must be copied exactly from the source.
12. Do not infer facts merely because they would make a good story.

Confidence guidance:
- 0.90–1.00: explicitly and directly stated.
- 0.75–0.89: strongly supported but mildly interpretive.
- Below 0.75: omit.

Within this extraction, merge near-duplicate beliefs and themes, and do not repeat essentially the same event. The same evidence may support multiple types only when the semantic distinction is meaningful.`;

export function buildExtractionUserPrompt(
  text: string,
  metadata: ContentMetadata,
): string {
  return `Source metadata:
Title: ${metadata.title}
Platform: ${metadata.platform ?? "Unknown"}
Published at: ${metadata.publishedAt ?? "Unknown"}

Source text:
<source>
${text}
</source>

Return only the requested structured extraction. Do not add sourceTitle or sourceDate to extracted nodes.`;
}
