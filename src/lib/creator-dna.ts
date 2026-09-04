/**
 * Mock Creator DNA dataset.
 *
 * This module is the single seam between UI and data. Everything the screens
 * render comes from these typed structures, so they can later be served by a
 * database, LLM extraction pipeline, embeddings retrieval and graph logic
 * without touching the components.
 */

export type DnaKind = "story" | "belief" | "theme" | "experience" | "evolution";

export const KIND_META: Record<
  DnaKind,
  { label: string; plural: string; color: string; token: string }
> = {
  story: {
    label: "Story",
    plural: "Stories",
    color: "var(--story)",
    token: "story",
  },
  belief: {
    label: "Belief",
    plural: "Beliefs",
    color: "var(--belief)",
    token: "belief",
  },
  theme: {
    label: "Theme",
    plural: "Themes",
    color: "var(--theme-color)",
    token: "theme",
  },
  experience: {
    label: "Experience",
    plural: "Experiences",
    color: "var(--experience)",
    token: "experience",
  },
  evolution: {
    label: "Evolution",
    plural: "Perspective evolution",
    color: "var(--evolution)",
    token: "evolution",
  },
};

export type SourceRef = {
  id: string;
  label: string;
  platform: string;
  date: string;
};

export type GraphNode = {
  id: string;
  label: string;
  kind: DnaKind | "me";
  /** normalized layout position, 0-100 in both axes */
  x: number;
  y: number;
  size?: number;
  firstDetected?: string;
  mentions?: number;
  summary?: string;
  related?: string[];
  sources?: SourceRef[];
  timeline?: { period: string; count: number }[];
};

export type GraphEdge = { from: string; to: string };

export const creator = {
  name: "Aishwarya Jakka",
  handle: "@creatordna",
  role: "Founder · Writes about building",
};

export const dnaSummary = [
  { kind: "story" as DnaKind, count: 12, caption: "discovered" },
  { kind: "belief" as DnaKind, count: 18, caption: "discovered" },
  { kind: "theme" as DnaKind, count: 7, caption: "recurring" },
  {
    kind: "experience" as DnaKind,
    count: 24,
    caption: "pieces analyzed",
    overrideLabel: "Content",
  },
];

export const homeGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: "h1", label: "Leaving my first job", kind: "story", x: 20, y: 26 },
    {
      id: "h2",
      label: "Start before you're ready",
      kind: "belief",
      x: 48,
      y: 14,
    },
    { id: "h3", label: "Entrepreneurship", kind: "theme", x: 72, y: 30 },
    { id: "h4", label: "Burnout", kind: "experience", x: 30, y: 68 },
    {
      id: "h5",
      label: "Consistency > intensity",
      kind: "evolution",
      x: 62,
      y: 74,
    },
    { id: "h6", label: "Building in public", kind: "theme", x: 86, y: 58 },
  ],
  edges: [
    { from: "h1", to: "h2" },
    { from: "h2", to: "h3" },
    { from: "h1", to: "h4" },
    { from: "h4", to: "h5" },
    { from: "h5", to: "h3" },
    { from: "h3", to: "h6" },
    { from: "h6", to: "h5" },
  ],
};

export const storyMap: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: "me", label: "ME", kind: "me", x: 50, y: 50, size: 46 },

    {
      id: "s1",
      label: "Leaving consulting",
      kind: "story",
      x: 22,
      y: 22,
      firstDetected: "January 2024",
      mentions: 5,
      summary:
        "You left a stable consulting career to start a company, describing the decision as terrifying but clarifying.",
      related: ["Action creates clarity", "Entrepreneurship", "Risk"],
      sources: [
        { id: "p2", label: "Post #2", platform: "LinkedIn", date: "Jan 2024" },
        {
          id: "n5",
          label: "Newsletter #5",
          platform: "Newsletter",
          date: "Feb 2024",
        },
      ],
      timeline: [
        { period: "Q1 2024", count: 2 },
        { period: "Q3 2024", count: 1 },
        { period: "Q1 2025", count: 2 },
      ],
    },
    {
      id: "s2",
      label: "First customer",
      kind: "story",
      x: 78,
      y: 20,
      firstDetected: "April 2024",
      mentions: 7,
      summary:
        "The story of your first paying customer — a cold DM that turned into a contract three weeks later.",
      related: [
        "Validate before quitting",
        "Entrepreneurship",
        "Building in public",
      ],
      sources: [
        { id: "p9", label: "Post #9", platform: "LinkedIn", date: "Apr 2024" },
        { id: "v3", label: "Video #3", platform: "YouTube", date: "Jun 2024" },
        {
          id: "pod7",
          label: "Podcast #7",
          platform: "Podcast",
          date: "Sep 2024",
        },
      ],
      timeline: [
        { period: "Q2 2024", count: 2 },
        { period: "Q4 2024", count: 2 },
        { period: "Q1 2025", count: 3 },
      ],
    },
    {
      id: "s3",
      label: "Failed product launch",
      kind: "story",
      x: 16,
      y: 74,
      firstDetected: "August 2024",
      mentions: 3,
      summary:
        "A launch that reached almost nobody, which you later reframed as your cheapest piece of market research.",
      related: ["Action creates clarity", "Risk"],
      sources: [
        {
          id: "n11",
          label: "Newsletter #11",
          platform: "Newsletter",
          date: "Aug 2024",
        },
      ],
      timeline: [
        { period: "Q3 2024", count: 2 },
        { period: "Q2 2025", count: 1 },
      ],
    },
    {
      id: "s4",
      label: "Burnout",
      kind: "experience",
      x: 50,
      y: 84,
      firstDetected: "May 2024",
      mentions: 4,
      summary:
        "In 2024 you described working extremely long hours while building your first company, and eventually burning out.",
      related: ["Consistency beats intensity", "Career growth"],
      sources: [
        {
          id: "pod14",
          label: "Podcast #14",
          platform: "Podcast",
          date: "May 2024",
        },
        {
          id: "p21",
          label: "Post #21",
          platform: "LinkedIn",
          date: "Jul 2024",
        },
      ],
      timeline: [
        { period: "Q2 2024", count: 2 },
        { period: "Q4 2024", count: 1 },
        { period: "Q2 2025", count: 1 },
      ],
    },

    {
      id: "b1",
      label: "Action creates clarity",
      kind: "belief",
      x: 40,
      y: 16,
      firstDetected: "March 2024",
      mentions: 6,
      summary:
        "You repeatedly argue that thinking your way to certainty is slower than doing something small and observing the result.",
      related: ["First product launch", "Entrepreneurship", "Fear of failure"],
      sources: [
        { id: "p4", label: "Post #4", platform: "LinkedIn", date: "Mar 2024" },
        { id: "v8", label: "Video #8", platform: "YouTube", date: "Jul 2024" },
        {
          id: "n12",
          label: "Newsletter #12",
          platform: "Newsletter",
          date: "Nov 2024",
        },
      ],
      timeline: [
        { period: "Q1 2024", count: 1 },
        { period: "Q3 2024", count: 2 },
        { period: "Q4 2024", count: 1 },
        { period: "Q1 2025", count: 2 },
      ],
    },
    {
      id: "b2",
      label: "Validate before quitting",
      kind: "belief",
      x: 84,
      y: 44,
      firstDetected: "February 2024",
      mentions: 4,
      summary:
        "You advise creators to find proof of demand before making irreversible decisions about their income.",
      related: ["First customer", "Risk", "Career transitions"],
      sources: [
        { id: "p6", label: "Post #6", platform: "LinkedIn", date: "Feb 2024" },
        {
          id: "pod7b",
          label: "Podcast #7",
          platform: "Podcast",
          date: "Sep 2024",
        },
      ],
      timeline: [
        { period: "Q1 2024", count: 2 },
        { period: "Q3 2024", count: 1 },
        { period: "Q2 2025", count: 1 },
      ],
    },
    {
      id: "b3",
      label: "Consistency beats intensity",
      kind: "evolution",
      x: 72,
      y: 76,
      firstDetected: "January 2025",
      mentions: 5,
      summary:
        "After burnout, your position shifted from working harder to protecting a pace you can repeat for years.",
      related: ["Burnout", "Career growth", "Building in public"],
      sources: [
        {
          id: "p31",
          label: "Post #31",
          platform: "LinkedIn",
          date: "Jan 2025",
        },
        {
          id: "v14",
          label: "Video #14",
          platform: "YouTube",
          date: "Mar 2025",
        },
      ],
      timeline: [
        { period: "Q1 2025", count: 3 },
        { period: "Q2 2025", count: 2 },
      ],
    },

    {
      id: "t1",
      label: "Entrepreneurship",
      kind: "theme",
      x: 60,
      y: 32,
      firstDetected: "January 2024",
      mentions: 19,
      summary:
        "Your most recurring theme — starting, selling and surviving your own company.",
      related: ["Leaving consulting", "First customer", "Risk"],
      sources: [
        {
          id: "many1",
          label: "19 pieces",
          platform: "All platforms",
          date: "2023 — 2025",
        },
      ],
      timeline: [
        { period: "2023", count: 4 },
        { period: "2024", count: 9 },
        { period: "2025", count: 6 },
      ],
    },
    {
      id: "t2",
      label: "Career growth",
      kind: "theme",
      x: 30,
      y: 46,
      firstDetected: "March 2023",
      mentions: 11,
      summary:
        "How people move between roles, identities and definitions of success.",
      related: ["Leaving consulting", "Burnout"],
      sources: [
        {
          id: "many2",
          label: "11 pieces",
          platform: "All platforms",
          date: "2023 — 2025",
        },
      ],
      timeline: [
        { period: "2023", count: 5 },
        { period: "2024", count: 3 },
        { period: "2025", count: 3 },
      ],
    },
    {
      id: "t3",
      label: "Building in public",
      kind: "theme",
      x: 88,
      y: 66,
      firstDetected: "June 2024",
      mentions: 8,
      summary:
        "Sharing unfinished work, and what that visibility does to your decisions.",
      related: ["First customer", "Consistency beats intensity"],
      sources: [
        {
          id: "many3",
          label: "8 pieces",
          platform: "All platforms",
          date: "2024 — 2025",
        },
      ],
      timeline: [
        { period: "2024", count: 4 },
        { period: "2025", count: 4 },
      ],
    },
    {
      id: "t4",
      label: "Risk",
      kind: "theme",
      x: 34,
      y: 66,
      firstDetected: "May 2023",
      mentions: 9,
      summary:
        "What you're willing to lose, and how you size a bet before taking it.",
      related: ["Failed product launch", "Validate before quitting"],
      sources: [
        {
          id: "many4",
          label: "9 pieces",
          platform: "All platforms",
          date: "2023 — 2025",
        },
      ],
      timeline: [
        { period: "2023", count: 3 },
        { period: "2024", count: 4 },
        { period: "2025", count: 2 },
      ],
    },
  ],
  edges: [
    { from: "me", to: "s1" },
    { from: "me", to: "s2" },
    { from: "me", to: "b1" },
    { from: "me", to: "t1" },
    { from: "me", to: "s4" },
    { from: "me", to: "b3" },
    { from: "s1", to: "b1" },
    { from: "s1", to: "t2" },
    { from: "s2", to: "b2" },
    { from: "s2", to: "t1" },
    { from: "s3", to: "t4" },
    { from: "s3", to: "b1" },
    { from: "s4", to: "b3" },
    { from: "s4", to: "t2" },
    { from: "b1", to: "t1" },
    { from: "b2", to: "t4" },
    { from: "b3", to: "t3" },
    { from: "t1", to: "t3" },
    { from: "t4", to: "t2" },
    { from: "b2", to: "t1" },
  ],
};

export type LibraryItem = {
  id: string;
  title: string;
  platform: string;
  date: string;
  stories: number;
  beliefs: number;
  themes: string[];
  status: "Analyzed" | "Processing" | "Queued";
};

export const libraryItems: LibraryItem[] = [
  {
    id: "c1",
    title: "Why I left consulting at 27",
    platform: "LinkedIn",
    date: "2024-01-18",
    stories: 2,
    beliefs: 3,
    themes: ["Entrepreneurship", "Career growth"],
    status: "Analyzed",
  },
  {
    id: "c2",
    title: "The cold DM that became my first customer",
    platform: "LinkedIn",
    date: "2024-04-09",
    stories: 1,
    beliefs: 2,
    themes: ["Entrepreneurship", "Risk"],
    status: "Analyzed",
  },
  {
    id: "c3",
    title: "Burnout, honestly",
    platform: "Podcast",
    date: "2024-05-22",
    stories: 3,
    beliefs: 2,
    themes: ["Career growth"],
    status: "Analyzed",
  },
  {
    id: "c4",
    title: "Nobody came to my launch",
    platform: "Newsletter",
    date: "2024-08-03",
    stories: 1,
    beliefs: 1,
    themes: ["Risk", "Entrepreneurship"],
    status: "Analyzed",
  },
  {
    id: "c5",
    title: "Building in public changed my roadmap",
    platform: "YouTube",
    date: "2024-11-14",
    stories: 2,
    beliefs: 2,
    themes: ["Building in public"],
    status: "Analyzed",
  },
  {
    id: "c6",
    title: "Consistency beats intensity",
    platform: "LinkedIn",
    date: "2025-01-07",
    stories: 1,
    beliefs: 3,
    themes: ["Career growth", "Building in public"],
    status: "Analyzed",
  },
  {
    id: "c7",
    title: "What I'd tell my 2023 self",
    platform: "Newsletter",
    date: "2025-03-19",
    stories: 2,
    beliefs: 2,
    themes: ["Career growth"],
    status: "Processing",
  },
  {
    id: "c8",
    title: "Founder pacing — full transcript",
    platform: "Podcast",
    date: "2025-06-02",
    stories: 0,
    beliefs: 0,
    themes: [],
    status: "Queued",
  },
];

export const platforms = ["LinkedIn", "Newsletter", "Podcast", "YouTube"];
export const allThemes = [
  "Entrepreneurship",
  "Career growth",
  "Building in public",
  "Risk",
];

/** Mock extraction result returned after "analyzing" pasted content. */
export const mockExtraction = {
  source: { label: "Post #34", platform: "LinkedIn", date: "Sep 2026" },
  groups: [
    {
      kind: "story" as DnaKind,
      items: ["Leaving consulting to start a company"],
    },
    {
      kind: "belief" as DnaKind,
      items: [
        "Action creates clarity",
        "Validate before making irreversible decisions",
      ],
    },
    {
      kind: "theme" as DnaKind,
      items: ["Entrepreneurship", "Risk", "Career transitions"],
    },
    {
      kind: "experience" as DnaKind,
      items: ["Six-month transition into entrepreneurship"],
    },
  ],
};

export const planResult = {
  storyConnection: {
    text: "In 2024, you talked about working extremely long hours while building your first company and eventually burning out.",
    source: "Podcast #14 · May 2024",
  },
  saidBefore: {
    text: "You previously argued that working harder solves most early startup problems.",
    source: "LinkedIn Post #8 · 2023",
  },
  evolution: [
    {
      stage: "THEN",
      year: "2023",
      text: "Working harder solves most problems.",
      kind: "story",
    },
    { stage: "EXPERIENCE", year: "2024", text: "Burnout", kind: "experience" },
    {
      stage: "NOW",
      year: "2025",
      text: "Consistency beats extreme intensity.",
      kind: "evolution",
    },
  ],
  evolutionNote:
    "This isn't necessarily a contradiction. Your experience appears to have changed how you think about sustainable work.",
  fatigue: {
    story: "first customer",
    times: 4,
    suggestion:
      "Try your failed product launch story instead — it's only appeared once this year.",
  },
  angles: [
    {
      key: "A",
      kind: "story" as DnaKind,
      label: "Personal story",
      title: "The moment I realized working harder wasn't working",
      body: "Use your 2024 burnout experience to tell the moment your perspective changed.",
      sources: ["Podcast #14 · May 2024", "Post #21 · Jul 2024"],
    },
    {
      key: "B",
      kind: "evolution" as DnaKind,
      label: "Evolution",
      title: "I used to think working harder was always the answer",
      body: "Contrast your 2023 belief with what your burnout experience taught you.",
      sources: ["LinkedIn Post #8 · 2023", "Post #31 · Jan 2025"],
    },
    {
      key: "C",
      kind: "theme" as DnaKind,
      label: "Contrarian",
      title: "Burnout isn't proof that you're working hard enough",
      body: "Challenge hustle culture using your own experience and current belief around consistency.",
      sources: ["Post #31 · Jan 2025", "Video #14 · Mar 2025"],
    },
  ],
};
