/// <reference types="node" />

import type { ChatCompletionCreateParams } from "groq-sdk/resources/chat/completions";

import type {
  CreatorDNAMatch,
  PlanningCreatorContext,
  StoryIntelligenceResult,
  TargetPlatform,
} from "../types";
import { StoryIntelligenceSchema } from "../validation";
import { CreatorDNAProviderError, getGroqClient, getGroqModel } from "./llm";

const framingTypes = [
  "personal story",
  "perspective evolution",
  "contrarian",
  "lesson learned",
  "reflective",
  "audience-focused",
] as const;

const storyIntelligenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    alignment: {
      type: "object",
      additionalProperties: false,
      properties: {
        state: {
          type: "string",
          enum: ["strong", "mixed", "weak", "insufficient_evidence"],
        },
        why: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string" },
              supportingNodeIds: { type: "array", items: { type: "string" } },
            },
            required: ["text", "supportingNodeIds"],
          },
        },
        watchOut: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string" },
              supportingNodeIds: { type: "array", items: { type: "string" } },
            },
            required: ["text", "supportingNodeIds"],
          },
        },
        opportunity: { type: "string" },
      },
      required: ["state", "why", "watchOut", "opportunity"],
    },
    relevantStories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          supportingNodeIds: { type: "array", items: { type: "string" } },
        },
        required: ["summary", "supportingNodeIds"],
      },
    },
    previousPositions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          position: { type: "string" },
          supportingNodeIds: { type: "array", items: { type: "string" } },
        },
        required: ["position", "supportingNodeIds"],
      },
    },
    possiblePerspectiveEvolution: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["identified", "insufficient evidence"],
        },
        summary: { type: "string" },
        supportingNodeIds: { type: "array", items: { type: "string" } },
      },
      required: ["status", "summary", "supportingNodeIds"],
    },
    possibleRepetition: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["identified", "not detected", "insufficient evidence"],
        },
        summary: { type: "string" },
        supportingNodeIds: { type: "array", items: { type: "string" } },
      },
      required: ["status", "summary", "supportingNodeIds"],
    },
    threeAuthenticAngles: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          framingType: { type: "string", enum: framingTypes },
          hook: { type: "string" },
          rationale: { type: "string" },
          supportingNodeIds: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
          platformPrep: {
            type: "object",
            additionalProperties: false,
            properties: {
              platform: {
                type: "string",
                enum: [
                  "linkedin",
                  "instagram",
                  "tiktok",
                  "youtube",
                  "youtube_shorts",
                  "x",
                  "threads",
                ],
              },
              hook: { type: "string" },
              formatRecommendation: { type: "string" },
              structure: {
                type: "array",
                minItems: 3,
                maxItems: 6,
                items: { type: "string" },
              },
              toneNotes: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string" },
              },
              avoid: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string" },
              },
              suggestedTitle: { type: ["string", "null"] },
            },
            required: [
              "platform",
              "hook",
              "formatRecommendation",
              "structure",
              "toneNotes",
              "avoid",
              "suggestedTitle",
            ],
          },
        },
        required: [
          "title",
          "framingType",
          "hook",
          "rationale",
          "supportingNodeIds",
          "platformPrep",
        ],
      },
    },
  },
  required: [
    "alignment",
    "relevantStories",
    "previousPositions",
    "possiblePerspectiveEvolution",
    "possibleRepetition",
    "threeAuthenticAngles",
  ],
} as const;

const responseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "creator_dna_story_intelligence",
    strict: true,
    schema: storyIntelligenceSchema,
  },
};

const SYSTEM_PROMPT = `You are the Story Intelligence layer for Creator DNA.
Reason only from the retrieved Creator DNA nodes supplied in the user message.

Never invent personal experiences, stories, beliefs, history, motivations, or outcomes.
Never claim the creator believes something unless retrieved evidence supports it.
Do not treat wording differences as contradictions.
Identify perspective evolution only when dated evidence reasonably supports a meaningful change.
Identify repetition only when retrieved evidence shows meaningful semantic or story overlap.
If evidence is insufficient, explicitly use the appropriate insufficient evidence status.
Every factual or personal claim must cite supportingNodeIds from the supplied nodes.
Every supportingNodeIds value must contain only IDs from the supplied nodes.
Create exactly three meaningfully different authentic angles, and ground every angle in retrieved nodes.
Do not add any node IDs that are not supplied.
The creator's DNA stays constant; adapt only the expression and framing of the three angles for the requested target platform.
Do not invent platform-specific facts about the creator.
For every angle, return complete platformPrep for the requested target platform. Its hook and structural beats must express details supported by that angle's cited nodes, not generic social-media advice. Do not write a complete final post.

Assess alignment without percentages or scores:
- strong: multiple historical DNA signals support the idea, it fits the current Foundation and intended territories, and no major contradiction or repetition risk dominates.
- mixed: some evidence supports it, but there is meaningful tension, evolution, repetition risk, or intended direction with thinner historical grounding.
- weak: historical support is slight or the idea conflicts with current beliefs/identity; intended territory alone is not proof.
- insufficient_evidence: relevant Creator DNA is too thin to judge.
Historical DNA is evidence of who the creator has been. Foundation is creator-declared current context. Brand Territories are intended direction, not proof of past authenticity.
Every alignment why/watchOut claim must cite supplied node IDs. Return 1-3 why reasons when evidence exists. Return no watchOut items when there is no meaningful risk. Do not manufacture criticism.
Perspective evolution is not automatically weak alignment: it can be the story opportunity. Authenticity and novelty are distinct, so a strongly aligned idea may still carry repetition risk.
When the idea directly touches a meaningful old-to-new belief shift, use mixed alignment and make that evolution the opportunity rather than calling the idea strong or weak.
The opportunity must be one concise sentence explaining how to make the idea more authentic, differentiated, or useful.`;

const platformGuidance: Record<TargetPlatform, string> = {
  linkedin:
    "Use a strong first 1-2 lines. Recommend a personal story + lesson, point-of-view post, founder reflection, grounded contrarian observation, or carousel when appropriate. Give 3-5 beats: tension, personal context, supported belief or lesson, practical implication, and close. Keep it professional but personal, reflective, clear, and grounded in lived evidence. Avoid corporate language, generic motivation, unnecessary hashtags, and overlong setup.",
  instagram:
    "Visual or personal hook → relatable story → concise reflection or takeaway.",
  tiktok: "Immediate hook → mistake or tension → quick story → punchy lesson.",
  youtube:
    "Create an opening tension for the first 15 seconds, recommend a talking-head essay, story-driven lesson, or breakdown/explainer, and provide 5-6 beats: opening tension, personal context, insight, evidence/story, practical takeaway, and synthesis. Include a suggested title. Keep it narrative, clear, spoken, and curiosity-led. Avoid slow intros, generic channel intros, and burying the personal story.",
  youtube_shorts:
    "Fast hook → one tension or insight → compact story → memorable payoff.",
  x: "Use a short, sharp first sentence and choose either a single post or short thread based on complexity. A single post should move through claim, tension, takeaway; a thread should use a hook, 2-4 compact points, and conclusion. Keep it concise, direct, conversational, and opinionated only where evidence supports it. Avoid LinkedIn-style framing, excess context, thread bait, and unsupported hot takes.",
  threads:
    "Use a natural conversational opener and a short conversational sequence: opener, grounded personal observation, 1-3 compact thoughts, and a human closing line. Keep it informal, warm, conversational, and less polished than LinkedIn. Avoid corporate tone, rigid thread formatting, and excessive structure.",
};

function buildUserPrompt(
  idea: string,
  targetPlatform: TargetPlatform,
  retrievedDNA: CreatorDNAMatch[],
  creatorContext?: PlanningCreatorContext,
): string {
  return `Content idea:
${idea}

Target platform: ${targetPlatform}
Platform framing guidance: ${platformGuidance[targetPlatform]}

Use this guidance to shape exactly three authentic directions. Keep all historical analysis grounded in the same retrieved Creator DNA; do not change or invent the creator's history.

Retrieved Creator DNA (the only allowed evidence):
${JSON.stringify(
  retrievedDNA.map((node) => ({
    id: node.id,
    type: node.type,
    label: node.label,
    summary: node.summary,
    evidenceQuote: node.evidenceQuote,
    sourceTitle: node.sourceTitle,
    sourceDate: node.sourceDate,
    confidence: node.confidence,
    similarity: node.similarity,
  })),
  null,
  2,
)}

Intended Brand Territories (declared future direction, not historical evidence):
${JSON.stringify(creatorContext?.intendedBrandTerritories ?? [], null, 2)}

Creator Foundation (creator-declared context, not external fact):
${JSON.stringify(creatorContext?.creatorFoundation ?? null, null, 2)}

External research (source-backed current facts, not creator history):
${JSON.stringify(creatorContext?.externalResearch ?? null, null, 2)}

Use this context only for alignment, opportunity, or future direction. Retrieved historical Creator DNA remains authoritative. Never let an intended territory overwrite contrary historical evidence or present it as something the creator has already discussed or believed. Supporting node IDs must still refer only to Retrieved Creator DNA.

When external research is supplied, use only its stated facts and citations. Keep those external facts distinct from claims about the creator. Do not present external research as something the creator previously said or believed.

Return the requested structured Story Intelligence result only.`;
}

export async function analyzeContentIdea(
  idea: string,
  retrievedDNA: CreatorDNAMatch[],
  targetPlatform: TargetPlatform,
  creatorContext?: PlanningCreatorContext,
): Promise<StoryIntelligenceResult> {
  if (!idea.trim()) {
    throw new CreatorDNAProviderError("Content idea must not be empty.");
  }
  if (retrievedDNA.length === 0) {
    return buildInsufficientEvidenceResult(idea.trim(), targetPlatform);
  }

  let completion;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2 && !completion; attempt += 1) {
    const params: ChatCompletionCreateParams = {
      model: getGroqModel(),
      temperature: 0,
      max_completion_tokens: 8_000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(
            idea,
            targetPlatform,
            retrievedDNA,
            creatorContext,
          ),
        },
        ...(attempt
          ? [
              {
                role: "user" as const,
                content:
                  "Schema correction: return every required field and exactly three complete threeAuthenticAngles entries. Do not stop after the first direction.",
              },
            ]
          : []),
      ],
      response_format: responseFormat,
    };
    try {
      completion = await getGroqClient().chat.completions.create(params);
    } catch (error) {
      lastError = error;
    }
  }
  if (!completion) {
    if (lastError instanceof CreatorDNAProviderError) throw lastError;
    throw new CreatorDNAProviderError("Story Intelligence analysis failed.", {
      cause: lastError,
    });
  }

  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) {
    throw new CreatorDNAProviderError("Story Intelligence returned no result.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch (error) {
    throw new CreatorDNAProviderError(
      "Story Intelligence returned malformed JSON.",
      { cause: error },
    );
  }

  const result = StoryIntelligenceSchema.safeParse(decoded);
  if (!result.success) {
    throw new CreatorDNAProviderError(
      "Story Intelligence returned invalid structured data.",
      { cause: result.error },
    );
  }

  const [firstAngle, secondAngle, thirdAngle] =
    result.data.threeAuthenticAngles;
  if (!firstAngle || !secondAngle || !thirdAngle) {
    throw new CreatorDNAProviderError(
      "Story Intelligence returned fewer than three angles.",
    );
  }
  const normalizedResult: StoryIntelligenceResult = {
    ...result.data,
    threeAuthenticAngles: [firstAngle, secondAngle, thirdAngle],
  };
  const validNodeIds = new Set(retrievedDNA.map((node) => node.id));
  return sanitizeStoryIntelligence(
    normalizedResult,
    validNodeIds,
    targetPlatform,
  );
}

function sanitizeStoryIntelligence(
  result: StoryIntelligenceResult,
  validNodeIds: Set<string>,
  targetPlatform: TargetPlatform,
): StoryIntelligenceResult {
  const filterIds = (ids: string[]) => [
    ...new Set(ids.filter((id) => validNodeIds.has(id))),
  ];
  const relevantStories = result.relevantStories.flatMap((item) => {
    const supportingNodeIds = filterIds(item.supportingNodeIds);
    return supportingNodeIds.length ? [{ ...item, supportingNodeIds }] : [];
  });
  const previousPositions = result.previousPositions.flatMap((item) => {
    const supportingNodeIds = filterIds(item.supportingNodeIds);
    return supportingNodeIds.length ? [{ ...item, supportingNodeIds }] : [];
  });
  const evolutionIds = filterIds(
    result.possiblePerspectiveEvolution.supportingNodeIds,
  );
  const repetitionIds = filterIds(result.possibleRepetition.supportingNodeIds);
  const [firstAngle, secondAngle, thirdAngle] = result.threeAuthenticAngles.map(
    (angle) => ({
      ...angle,
      supportingNodeIds: filterIds(angle.supportingNodeIds),
      platformPrep: {
        ...angle.platformPrep,
        platform: targetPlatform,
        suggestedTitle:
          targetPlatform === "youtube"
            ? (angle.platformPrep.suggestedTitle ?? angle.title)
            : angle.platformPrep.suggestedTitle,
      },
    }),
  );
  if (!firstAngle || !secondAngle || !thirdAngle)
    throw new CreatorDNAProviderError(
      "Story Intelligence returned fewer than three angles.",
    );
  if (
    [firstAngle, secondAngle, thirdAngle].some(
      (angle) => angle.supportingNodeIds.length === 0,
    )
  )
    throw new CreatorDNAProviderError(
      "Story Intelligence returned an ungrounded direction.",
    );
  return {
    ...result,
    alignment: sanitizeAlignment(result.alignment, validNodeIds),
    relevantStories,
    previousPositions,
    possiblePerspectiveEvolution:
      result.possiblePerspectiveEvolution.status === "identified" &&
      evolutionIds.length === 0
        ? {
            status: "insufficient evidence",
            summary:
              "There is not enough validated dated evidence to identify a meaningful perspective change.",
            supportingNodeIds: [],
          }
        : {
            ...result.possiblePerspectiveEvolution,
            supportingNodeIds: evolutionIds,
          },
    possibleRepetition:
      result.possibleRepetition.status === "identified" &&
      repetitionIds.length === 0
        ? {
            status: "insufficient evidence",
            summary:
              "There is not enough validated evidence to assess repetition.",
            supportingNodeIds: [],
          }
        : {
            ...result.possibleRepetition,
            supportingNodeIds: repetitionIds,
          },
    threeAuthenticAngles: [firstAngle, secondAngle, thirdAngle],
  };
}

function buildInsufficientEvidenceResult(
  idea: string,
  targetPlatform: TargetPlatform,
): StoryIntelligenceResult {
  const platformPrep = buildEvidenceLimitedPlatformPrep(idea, targetPlatform);
  const makeAngle = (
    title: string,
    framingType: StoryIntelligenceResult["threeAuthenticAngles"][number]["framingType"],
    hook: string,
    rationale: string,
  ): StoryIntelligenceResult["threeAuthenticAngles"][number] => ({
    title,
    framingType,
    hook,
    rationale,
    supportingNodeIds: [],
    platformPrep: { ...platformPrep, hook },
  });
  return {
    alignment: {
      state: "insufficient_evidence",
      why: [],
      watchOut: [],
      opportunity:
        "Add relevant past content before treating this idea as grounded in your Creator DNA.",
    },
    relevantStories: [],
    previousPositions: [],
    possiblePerspectiveEvolution: {
      status: "insufficient evidence",
      summary:
        "Creator DNA does not yet have dated evidence for a perspective change on this idea.",
      supportingNodeIds: [],
    },
    possibleRepetition: {
      status: "insufficient evidence",
      summary:
        "Creator DNA does not yet have enough relevant history to assess repetition.",
      supportingNodeIds: [],
    },
    threeAuthenticAngles: [
      makeAngle(
        "Clarify the core question",
        "reflective",
        `The question behind “${idea}” is worth examining before making a claim.`,
        "This direction avoids implying personal history that Creator DNA cannot currently support.",
      ),
      makeAngle(
        "Define the practical tension",
        "audience-focused",
        `What makes “${idea}” difficult in practice?`,
        "This direction can frame the audience problem while clearly separating questions from unsupported creator history.",
      ),
      makeAngle(
        "Collect the missing evidence",
        "lesson learned",
        `Before turning “${idea}” into a lesson, identify the experience that actually supports it.`,
        "This direction makes the evidence gap explicit instead of inventing a lesson or belief.",
      ),
    ],
  };
}

function buildEvidenceLimitedPlatformPrep(
  idea: string,
  targetPlatform: TargetPlatform,
): StoryIntelligenceResult["threeAuthenticAngles"][number]["platformPrep"] {
  if (targetPlatform === "linkedin")
    return {
      platform: targetPlatform,
      hook: idea,
      formatRecommendation: "Short reflective point-of-view post",
      structure: [
        "Open with the unresolved tension",
        "State what evidence or experience is still missing",
        "Offer one cautious practical question",
      ],
      toneNotes: ["Professional but personal", "Explicitly exploratory"],
      avoid: ["Invented personal history", "Generic motivational claims"],
      suggestedTitle: null,
    };
  if (targetPlatform === "x")
    return {
      platform: targetPlatform,
      hook: idea,
      formatRecommendation: "Single exploratory post",
      structure: [
        "State the question sharply",
        "Name the central tension",
        "Close with the evidence you want to examine",
      ],
      toneNotes: ["Concise", "Curious rather than authoritative"],
      avoid: ["Unsupported hot takes", "Generic thread bait"],
      suggestedTitle: null,
    };
  if (targetPlatform === "youtube")
    return {
      platform: targetPlatform,
      hook: idea,
      formatRecommendation: "Question-led talking-head exploration",
      structure: [
        "Open with the unresolved tension",
        "Explain why the question matters",
        "Separate known evidence from open questions",
        "Identify what would change the conclusion",
        "Close with a cautious synthesis",
      ],
      toneNotes: ["Spoken and clear", "Curiosity-led"],
      avoid: ["A slow generic intro", "Invented personal experience"],
      suggestedTitle: `The real question behind ${idea}`,
    };
  if (targetPlatform === "threads")
    return {
      platform: targetPlatform,
      hook: idea,
      formatRecommendation: "Short conversational sequence",
      structure: [
        "Open naturally with the question",
        "Name one practical tension",
        "Close with a human invitation to reflect",
      ],
      toneNotes: ["Warm", "Informal and exploratory"],
      avoid: ["Corporate framing", "Claims unsupported by experience"],
      suggestedTitle: null,
    };
  return {
    platform: targetPlatform,
    hook: idea,
    formatRecommendation: "Evidence-aware exploratory format",
    structure: [
      "Open with the question",
      "Name the tension",
      "Close without overstating certainty",
    ],
    toneNotes: ["Clear", "Exploratory"],
    avoid: ["Invented history", "Unsupported certainty"],
    suggestedTitle: null,
  };
}

function sanitizeAlignment(
  alignment: StoryIntelligenceResult["alignment"],
  validNodeIds: Set<string>,
): StoryIntelligenceResult["alignment"] {
  const validateClaims = (claims: typeof alignment.why) =>
    claims.flatMap((claim) => {
      const supportingNodeIds = claim.supportingNodeIds.filter((id) =>
        validNodeIds.has(id),
      );
      return supportingNodeIds.length ? [{ ...claim, supportingNodeIds }] : [];
    });
  const why = validateClaims(alignment.why);
  const watchOut = validateClaims(alignment.watchOut);
  const evidenceCount = new Set(why.flatMap((item) => item.supportingNodeIds))
    .size;
  const state =
    why.length === 0
      ? "insufficient_evidence"
      : alignment.state === "strong" && evidenceCount < 2
        ? "mixed"
        : alignment.state;
  return {
    state,
    why,
    watchOut,
    opportunity:
      state === "insufficient_evidence"
        ? "Add a relevant story, experience, or current belief to ground this idea before developing it further."
        : alignment.opportunity,
  };
}
