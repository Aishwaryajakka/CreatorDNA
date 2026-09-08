import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const supabase = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SECRET_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

// This follows the repository's existing local demo convention. It is never logged.
const demoPassword = process.env.DEMO_USER_PASSWORD || "Pass1234";
const foundationDate = "2026-09-01T12:00:00.000Z";

function stableUuid(value) {
  const bytes = crypto
    .createHash("sha256")
    .update(value)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function content(key, platform, publishedAt, title, nodes) {
  return {
    key,
    platform,
    publishedAt,
    title,
    rawText: nodes.map((node) => node.evidenceQuote).join("\n\n"),
    nodes,
  };
}

function node(key, type, label, summary, evidenceQuote, confidence = 0.94) {
  return { key, type, label, summary, evidenceQuote, confidence };
}

const demos = [
  {
    key: "jordan",
    name: "Jordan Lee",
    username: "jordan_wellness",
    email: "jordan.creator@example.com",
    foundation: {
      whatYouDo:
        "I am a founder, startup operator, builder, and mentor helping founders pursue ambitious work without destroying their health.",
      mainTopics:
        "Entrepreneurship, startup operations, founder performance, sustainable ambition, recovery, and long-term thinking.",
      expertise: [
        "Entrepreneurship",
        "Startup operations",
        "Founder performance",
        "Sustainable productivity",
      ],
      importantExperiences: [
        "Built companies through high-intensity startup periods.",
        "Experienced burnout while trying to sustain constant output.",
        "Changed my leadership and work habits after burnout.",
      ],
      accomplishments: [
        "Built and operated early-stage startup teams.",
        "Mentored founders through demanding growth periods.",
      ],
      failures: [
        "Confused exhaustion with commitment until burnout reduced my ability to lead.",
      ],
      perspectiveChanges: [
        "I moved from treating extreme hours as proof of ambition to treating consistency as strategy.",
        "I learned that recovery is part of performance rather than its opposite.",
      ],
      beliefs: [
        "Sustainable ambition beats unsustainable intensity.",
        "Consistency compounds better than extreme bursts.",
        "Recovery is part of performance.",
        "Founder health is a strategic advantage.",
        "Ambition should survive the long game.",
      ],
      values: [
        "Discipline",
        "Honesty",
        "Long-term thinking",
        "Sustainable performance",
        "Teaching from lived experience",
      ],
      personality: [
        "Practical",
        "Reflective",
        "Direct",
        "Founder-to-founder",
        "Skeptical of generic wellness clichés",
      ],
      goals: [
        "Help founders stay ambitious without destroying themselves.",
        "Teach sustainable performance through lived experience.",
        "Build a recognizable point of view around sustainable ambition.",
      ],
    },
    territories: [
      [
        "Entrepreneurship",
        "The lived realities of building and operating companies.",
      ],
      [
        "Sustainable Ambition",
        "Designing ambition that remains durable over a long career.",
      ],
      [
        "Founder Performance",
        "Practical systems for clear, healthy, effective leadership.",
      ],
      [
        "Long-Term Thinking",
        "Choices that compound across years rather than weeks.",
      ],
      [
        "Recovery",
        "Recovery as a strategic component of sustained performance.",
      ],
    ],
    contents: [
      content(
        "2023-linkedin",
        "linkedin",
        "2023-02-14T15:00:00.000Z",
        "The price of building something that matters",
        [
          node(
            "j23-li-intensity",
            "belief",
            "Intensity proves commitment",
            "Jordan believed unusually intense work was sometimes necessary to create early momentum.",
            "Working 80 hours is sometimes the price of building something that matters.",
          ),
          node(
            "j23-li-sacrifice",
            "theme",
            "Sacrifice before comfort",
            "Early company building was framed as a season where comfort followed commitment.",
            "When the company is fragile, the founder often has to absorb the uncertainty before the team can feel secure.",
          ),
          node(
            "j23-li-driven",
            "identity",
            "Driven founder",
            "Jordan identified with being the person willing to carry more during fragile startup stages.",
            "I wanted to be the founder who stayed when the work became inconvenient.",
          ),
        ],
      ),
      content(
        "2023-x",
        "x",
        "2023-05-09T15:00:00.000Z",
        "Momentum before balance",
        [
          node(
            "j23-x-balance",
            "belief",
            "Balance follows momentum",
            "Jordan argued that early founders should prioritize momentum before optimizing for balance.",
            "Early-stage founders should stop optimizing for balance before they've earned momentum.",
          ),
          node(
            "j23-x-speed",
            "lesson",
            "Speed creates options",
            "Fast execution was treated as a way to create leverage and future choices.",
            "Speed now can buy you options later; hesitation cannot.",
          ),
          node(
            "j23-x-ambition",
            "theme",
            "Ambition through action",
            "Ambition was expressed primarily through sustained visible action.",
            "Your calendar reveals how seriously you take the company long before your pitch deck does.",
          ),
        ],
      ),
      content(
        "2023-youtube",
        "youtube",
        "2023-09-21T15:00:00.000Z",
        "Why intense seasons are necessary when you're building from zero",
        [
          node(
            "j23-yt-zero",
            "story",
            "Building from zero",
            "Jordan described an early company period where a small team used an intense push to find initial traction.",
            "For twelve weeks, our tiny team did the work that normally belonged to three departments because there was no one else coming.",
          ),
          node(
            "j23-yt-seasons",
            "belief",
            "Intense seasons can be necessary",
            "Jordan distinguished temporary intensity from a permanent operating system.",
            "An intense season can be necessary when you're building from zero, but a season needs an end date.",
          ),
          node(
            "j23-yt-clarity",
            "lesson",
            "Name the season",
            "Leaders should define why an intense period exists and when it ends.",
            "If you ask a team to sprint, name the finish line and the reason the sprint matters.",
          ),
        ],
      ),
      content(
        "2024-linkedin",
        "linkedin",
        "2024-02-12T15:00:00.000Z",
        "Exhaustion was not proof I cared",
        [
          node(
            "j24-li-burnout",
            "experience",
            "Burnout interrupted leadership",
            "Burnout made Jordan less useful to the company he was trying to protect.",
            "I thought exhaustion was proof I cared. Then burnout made me useless to the company I was trying to save.",
          ),
          node(
            "j24-li-old-belief",
            "story",
            "Mistaking exhaustion for commitment",
            "Jordan recognized that his identity had fused commitment with visible exhaustion.",
            "I wore depletion like evidence that I was the most committed person in the room.",
          ),
          node(
            "j24-li-recovery",
            "lesson",
            "Capacity is a leadership responsibility",
            "Protecting personal capacity became part of Jordan's responsibility to the team.",
            "My energy was not a private issue; it shaped every decision the team had to live with.",
          ),
        ],
      ),
      content(
        "2024-x",
        "x",
        "2024-05-18T15:00:00.000Z",
        "Constant output is not effectiveness",
        [
          node(
            "j24-x-output",
            "belief",
            "Output is not effectiveness",
            "Jordan separated constant activity from useful effectiveness.",
            "Burnout didn't happen because I stopped caring. It happened because I confused constant output with effectiveness.",
          ),
          node(
            "j24-x-rest",
            "lesson",
            "Rest protects judgment",
            "Recovery was reframed as a way to preserve decision quality.",
            "The first thing exhaustion takes is not effort. It is judgment.",
          ),
          node(
            "j24-x-honesty",
            "value",
            "Honesty about capacity",
            "Jordan valued honest capacity signals over performative toughness.",
            "A leader who hides their limits teaches the whole company to lie about capacity.",
          ),
        ],
      ),
      content(
        "2024-youtube",
        "youtube",
        "2024-10-03T15:00:00.000Z",
        "What burnout changed about how I lead",
        [
          node(
            "j24-yt-leadership",
            "experience",
            "Leading after burnout",
            "Jordan rebuilt planning and delegation habits after burnout.",
            "After burnout, I stopped treating every problem as evidence that I personally needed to work later.",
          ),
          node(
            "j24-yt-systems",
            "lesson",
            "Systems beat heroics",
            "Repeatable systems were adopted instead of founder heroics.",
            "A company cannot call itself resilient if its operating system depends on one exhausted hero.",
          ),
          node(
            "j24-yt-trust",
            "belief",
            "Delegation builds durable teams",
            "Jordan came to see delegation as a performance system rather than loss of control.",
            "Delegation did not lower my standards; it made the standards transferable.",
          ),
        ],
      ),
      content(
        "2025-linkedin",
        "linkedin",
        "2025-01-17T15:00:00.000Z",
        "Consistency beats extreme intensity",
        [
          node(
            "j25-li-consistency",
            "belief",
            "Consistency beats extreme intensity",
            "Jordan's current operating belief favors repeatable consistency over dramatic bursts.",
            "Consistency beats extreme intensity when the game lasts ten years.",
          ),
          node(
            "j25-li-compounding",
            "theme",
            "Performance compounds",
            "Sustainable practices were framed as a compounding strategic advantage.",
            "The boring week you can repeat is often more valuable than the heroic week that empties the next month.",
          ),
          node(
            "j25-li-duration",
            "lesson",
            "Design for duration",
            "Work systems should be judged by whether they remain useful over time.",
            "Do not evaluate a routine by its best day; evaluate it by whether it survives a hard quarter.",
          ),
        ],
      ),
      content(
        "2025-x",
        "x",
        "2025-04-24T15:00:00.000Z",
        "The routine you can still follow",
        [
          node(
            "j25-x-routine",
            "belief",
            "Repeatable routines win",
            "Jordan values routines that remain workable through changing conditions.",
            "The best founder routine is the one you can still follow six months from now.",
          ),
          node(
            "j25-x-recovery",
            "lesson",
            "Recovery belongs in the plan",
            "Recovery should be designed into work rather than improvised after collapse.",
            "Recovery scheduled late is usually recovery scheduled after the damage.",
          ),
          node(
            "j25-x-discipline",
            "value",
            "Discipline includes stopping",
            "Jordan expanded discipline to include boundaries and deliberate recovery.",
            "Discipline is not only knowing when to push. It is also knowing when another hour makes tomorrow worse.",
          ),
        ],
      ),
      content(
        "2025-youtube",
        "youtube",
        "2025-08-28T15:00:00.000Z",
        "Founder performance is a long game",
        [
          node(
            "j25-yt-long-game",
            "theme",
            "Founder performance is a long game",
            "Jordan framed founder performance as a multi-year discipline.",
            "Founder performance is a long game, and your body keeps the score even when the dashboard looks green.",
          ),
          node(
            "j25-yt-cycle",
            "lesson",
            "Alternate intensity and recovery",
            "Jordan uses deliberate cycles of push and recovery rather than constant intensity.",
            "I still believe in hard pushes; I no longer believe every week should be one.",
          ),
          node(
            "j25-yt-health",
            "belief",
            "Founder health is strategic",
            "Health became a company-level strategic concern.",
            "Founder health is not a lifestyle perk. It is part of the company's risk profile.",
          ),
        ],
      ),
      content(
        "2026-linkedin",
        "linkedin",
        "2026-01-16T15:00:00.000Z",
        "Ambition that can survive real life",
        [
          node(
            "j26-li-sustainable",
            "belief",
            "Sustainable ambition",
            "Jordan believes ambition should be designed to survive real life and long time horizons.",
            "Ambition isn't the problem. Designing ambition that can survive real life is the work.",
          ),
          node(
            "j26-li-durability",
            "value",
            "Durability",
            "Jordan values durable progress over performative intensity.",
            "I want a kind of ambition that is still recognizable after a hard year, a family change, or a company setback.",
          ),
          node(
            "j26-li-teacher",
            "identity",
            "Founder-to-founder teacher",
            "Jordan now teaches performance principles from lived founder experience.",
            "I teach this as someone who learned the expensive version first.",
          ),
        ],
      ),
      content(
        "2026-x",
        "x",
        "2026-03-20T15:00:00.000Z",
        "Recovery is part of performance",
        [
          node(
            "j26-x-recovery",
            "belief",
            "Recovery enables performance",
            "Recovery is part of Jordan's definition of high performance.",
            "Recovery is not the opposite of performance. It is part of performance.",
          ),
          node(
            "j26-x-capacity",
            "lesson",
            "Protect tomorrow's capacity",
            "Today's work should not destroy tomorrow's ability to make good decisions.",
            "A productive day that steals tomorrow's judgment is borrowing at a terrible rate.",
          ),
          node(
            "j26-x-longterm",
            "theme",
            "Long-term founder capacity",
            "Jordan focuses on preserving founder capacity over long horizons.",
            "The real flex is staying useful to the mission for years.",
          ),
        ],
      ),
      content(
        "2026-youtube",
        "youtube",
        "2026-07-11T15:00:00.000Z",
        "How I think about sustainable ambition now",
        [
          node(
            "j26-yt-evolution",
            "story",
            "From intensity to sustainable ambition",
            "Jordan tells the complete evolution from heroic intensity through burnout to a durable operating philosophy.",
            "I went from believing exhaustion proved ambition to seeing recovery as one of ambition's operating requirements.",
          ),
          node(
            "j26-yt-strategy",
            "lesson",
            "Build a sustainable operating system",
            "Sustainable ambition requires systems for intensity, recovery, and honest review.",
            "My operating system now has three parts: deliberate pushes, protected recovery, and honest review.",
          ),
          node(
            "j26-yt-current",
            "identity",
            "Sustainable performance mentor",
            "Jordan's current creator identity centers on helping founders remain ambitious for the long game.",
            "The work I want to do now is help founders keep their ambition and lose the self-destruction.",
          ),
        ],
      ),
    ],
    edges: [
      ["j23-li-intensity", "j24-li-burnout", "challenged_by"],
      ["j23-x-balance", "j25-li-consistency", "evolved_into"],
      ["j24-li-burnout", "j25-yt-long-game", "led_to"],
      ["j24-yt-leadership", "j25-x-routine", "led_to"],
      ["j25-li-consistency", "j26-li-sustainable", "reinforces"],
      ["j25-x-recovery", "j26-x-recovery", "reinforces"],
      ["j25-yt-health", "j26-yt-current", "supports"],
      ["j26-li-sustainable", "j26-yt-evolution", "expressed_through"],
    ],
  },
  {
    key: "maya",
    name: "Maya Chen",
    username: "maya_ai",
    email: "maya.creator@example.com",
    foundation: {
      whatYouDo:
        "I am an AI product builder, educator, and creator who teaches practical, human-centered ways to build with AI.",
      mainTopics:
        "AI products, education technology, product building, responsible AI, human agency, and the future of learning.",
      expertise: [
        "AI products",
        "Education technology",
        "Product building",
        "Future of learning",
      ],
      importantExperiences: [
        "Built multiple AI product prototypes.",
        "Saw the gap between impressive demos and useful products.",
        "Explored how AI can improve feedback in education.",
      ],
      accomplishments: [
        "Shipped practical AI product experiments.",
        "Taught technical AI concepts to non-specialist audiences.",
      ],
      failures: [
        "Built automation-first prototypes that looked impressive but removed too much user control.",
      ],
      perspectiveChanges: [
        "I evolved from automation-first thinking toward augmentation and human agency.",
        "I learned that product context and feedback loops matter more than model demos.",
      ],
      beliefs: [
        "AI should augment human judgment.",
        "Useful AI products reduce friction without removing agency.",
        "Education should become more adaptive.",
        "Prototypes teach more than abstract speculation.",
        "Responsible AI requires product-level tradeoffs.",
      ],
      values: [
        "Usefulness",
        "Experimentation",
        "Clarity over hype",
        "Human agency",
        "Learning by building",
      ],
      personality: [
        "Practical",
        "Clear",
        "Technically accessible",
        "Skeptical of hype",
        "Builder-first",
      ],
      goals: [
        "Help people understand practical AI.",
        "Build tools that improve learning.",
        "Develop a recognizable point of view on responsible AI products.",
      ],
    },
    territories: [
      ["AI", "Practical developments in applied artificial intelligence."],
      ["Education", "How people teach, learn, and receive feedback."],
      [
        "Product Building",
        "Turning technical capability into useful products.",
      ],
      [
        "Future of Learning",
        "Adaptive, human-guided, AI-assisted learning systems.",
      ],
      [
        "Responsible AI",
        "Product choices that preserve agency, trust, and accountability.",
      ],
    ],
    contents: [
      content(
        "2023-linkedin",
        "linkedin",
        "2023-02-23T15:00:00.000Z",
        "AI will automate repetitive knowledge work",
        [
          node(
            "m23-li-automation",
            "belief",
            "Rapid knowledge-work automation",
            "Maya expected AI to automate broad categories of repetitive knowledge work quickly.",
            "AI will eliminate entire categories of repetitive knowledge work faster than most teams expect.",
          ),
          node(
            "m23-li-optimism",
            "theme",
            "Automation optimism",
            "Early AI commentary emphasized the speed and breadth of automation.",
            "We are underestimating how quickly teams will hand repeatable decisions to models.",
          ),
          node(
            "m23-li-builder",
            "identity",
            "AI experimenter",
            "Maya identified as a builder testing where model capability could remove repetitive work.",
            "I am building prototypes because the fastest way to understand this shift is to put it inside a real workflow.",
          ),
        ],
      ),
      content(
        "2023-x",
        "x",
        "2023-05-12T15:00:00.000Z",
        "AI agents and describable workflows",
        [
          node(
            "m23-x-agents",
            "belief",
            "Agents will automate describable workflows",
            "Maya believed clear workflows were strong candidates for broad agent automation.",
            "If a workflow can be described clearly, an AI agent will probably automate most of it.",
          ),
          node(
            "m23-x-spec",
            "lesson",
            "Workflow description reveals automation",
            "The ability to specify work was treated as a signal of automation potential.",
            "The better the process documentation, the closer the workflow is to agent-ready.",
          ),
          node(
            "m23-x-speed",
            "theme",
            "Fast AI adoption",
            "Maya expected organizations to adopt agents quickly once reliability improved.",
            "Adoption will look slow until reliability crosses a threshold, then feel sudden.",
          ),
        ],
      ),
      content(
        "2023-youtube",
        "youtube",
        "2023-09-14T15:00:00.000Z",
        "Why AI agents will change knowledge work",
        [
          node(
            "m23-yt-agent",
            "story",
            "Building an early AI agent",
            "Maya described a prototype that completed a multi-step research workflow.",
            "Our prototype turned a six-step research checklist into one guided agent session.",
          ),
          node(
            "m23-yt-automation",
            "belief",
            "Agents shift knowledge work",
            "Maya expected agents to absorb orchestration work around knowledge tasks.",
            "The biggest change is not one generated paragraph; it is the agent coordinating the steps around it.",
          ),
          node(
            "m23-yt-prototype",
            "lesson",
            "Prototype to learn",
            "Building prototypes was framed as the best way to test claims about AI capability.",
            "A weekend prototype taught us more about agent limits than a month of abstract debate.",
          ),
        ],
      ),
      content(
        "2024-linkedin",
        "linkedin",
        "2024-02-20T15:00:00.000Z",
        "The gap between an AI demo and a useful product",
        [
          node(
            "m24-li-demo",
            "experience",
            "Demo-to-product gap",
            "Maya saw that model capability alone did not create a useful product.",
            "The gap between an impressive AI demo and a useful product is everything around the model.",
          ),
          node(
            "m24-li-context",
            "lesson",
            "Context makes AI useful",
            "Workflow context, feedback, and product constraints became central to Maya's approach.",
            "Context, feedback loops, failure recovery, and user trust decide whether the model belongs in a product.",
          ),
          node(
            "m24-li-realism",
            "belief",
            "Capability is not usability",
            "Maya's position shifted toward product realism.",
            "A capability can be real and still be the wrong product.",
          ),
        ],
      ),
      content(
        "2024-x",
        "x",
        "2024-05-25T15:00:00.000Z",
        "Product context matters more than prompt tricks",
        [
          node(
            "m24-x-context",
            "belief",
            "Product context beats prompt tricks",
            "Maya prioritized durable product context over isolated prompt optimization.",
            "Prompt quality matters less than product context, feedback loops, and user trust.",
          ),
          node(
            "m24-x-trust",
            "value",
            "User trust",
            "Trust became a first-class product requirement.",
            "When users cannot predict failure, every magical success makes the eventual mistake feel worse.",
          ),
          node(
            "m24-x-agency",
            "lesson",
            "Design recovery and control",
            "Useful AI products need visible control and graceful recovery.",
            "Give people a way to inspect, correct, and recover; agency is a product feature.",
          ),
        ],
      ),
      content(
        "2024-youtube",
        "youtube",
        "2024-10-10T15:00:00.000Z",
        "What shipping AI products taught me",
        [
          node(
            "m24-yt-shipping",
            "experience",
            "Shipping exposed product constraints",
            "Real users revealed failures hidden by controlled demos.",
            "The demo succeeded ten times in a row; the first real customer used it in an eleventh way we had never considered.",
          ),
          node(
            "m24-yt-loops",
            "lesson",
            "Feedback loops are the product",
            "Maya learned that correction loops often matter more than first-pass generation.",
            "The correction loop became more valuable than the first answer.",
          ),
          node(
            "m24-yt-useful",
            "belief",
            "Useful AI preserves judgment",
            "Maya began favoring products that help users judge rather than simply automate outcomes.",
            "The product improved when we stopped asking how to remove the user and started asking how to improve their decision.",
          ),
        ],
      ),
      content(
        "2025-linkedin",
        "linkedin",
        "2025-01-24T15:00:00.000Z",
        "AI in education should improve feedback",
        [
          node(
            "m25-li-education",
            "belief",
            "AI should augment teachers",
            "Maya believes AI should improve learner feedback while strengthening teachers.",
            "The future of AI in education isn't replacing teachers. It's giving every learner better feedback.",
          ),
          node(
            "m25-li-feedback",
            "theme",
            "Adaptive feedback",
            "Personalized feedback became the core education opportunity.",
            "A learner should not have to wait a week to understand the misconception they formed today.",
          ),
          node(
            "m25-li-teachers",
            "value",
            "Teacher agency",
            "Maya values keeping teachers in control of educational judgment.",
            "Teachers should gain visibility and leverage, not inherit a black box they are expected to defend.",
          ),
        ],
      ),
      content(
        "2025-x",
        "x",
        "2025-04-18T15:00:00.000Z",
        "AI tutors should make teachers more powerful",
        [
          node(
            "m25-x-tutors",
            "belief",
            "AI tutors should augment",
            "Maya rejects replacement framing for AI tutors.",
            "AI tutors should make teachers more powerful, not less necessary.",
          ),
          node(
            "m25-x-agency",
            "value",
            "Human educational judgment",
            "Human judgment remains essential for goals, context, and care.",
            "A tutor can scale feedback; it cannot decide what a community should value in its education.",
          ),
          node(
            "m25-x-adaptive",
            "theme",
            "Adaptive learning",
            "Maya sees adaptive practice as a meaningful AI opportunity.",
            "The opportunity is practice that adapts without making the learner passive.",
          ),
        ],
      ),
      content(
        "2025-youtube",
        "youtube",
        "2025-08-14T15:00:00.000Z",
        "AI should augment teachers, not replace them",
        [
          node(
            "m25-yt-evolution",
            "story",
            "From replacement to augmentation",
            "Maya explained how product experience changed her automation-first position.",
            "I used to lead with what AI could replace. Shipping products made me care more about what people could do better with it.",
          ),
          node(
            "m25-yt-teacher",
            "belief",
            "Teachers guide AI-assisted learning",
            "Maya's current education position centers teacher-guided AI assistance.",
            "The strongest system gives the teacher better signals and the learner faster practice without confusing either about who is responsible.",
          ),
          node(
            "m25-yt-responsible",
            "lesson",
            "Responsibility lives in product choices",
            "Responsible AI was framed through concrete product tradeoffs.",
            "Responsible AI is not a paragraph in the launch post; it is what the product lets users inspect, refuse, and correct.",
          ),
        ],
      ),
      content(
        "2026-linkedin",
        "linkedin",
        "2026-01-29T15:00:00.000Z",
        "AI products should improve human judgment",
        [
          node(
            "m26-li-judgment",
            "belief",
            "AI should improve human judgment",
            "Maya's current position favors products that augment rather than remove human judgment.",
            "The most interesting AI products aren't the ones that remove humans. They're the ones that improve human judgment.",
          ),
          node(
            "m26-li-agency",
            "value",
            "Human agency",
            "Preserving agency is central to Maya's current product philosophy.",
            "Efficiency is not progress if the user becomes less capable of understanding or correcting the outcome.",
          ),
          node(
            "m26-li-builder",
            "identity",
            "Human-centered AI product builder",
            "Maya identifies as a builder translating model capability into useful human systems.",
            "I want to build tools that make people more capable, not merely make the workflow look automated.",
          ),
        ],
      ),
      content(
        "2026-x",
        "x",
        "2026-03-27T15:00:00.000Z",
        "Great AI leaves the user more capable",
        [
          node(
            "m26-x-capable",
            "belief",
            "Great AI increases capability",
            "Maya judges AI products by whether users become more capable.",
            "Good AI disappears into the workflow. Great AI leaves the user more capable.",
          ),
          node(
            "m26-x-friction",
            "lesson",
            "Remove friction, preserve agency",
            "Maya distinguishes reducing friction from removing meaningful control.",
            "Remove the repetitive friction, not the moment where human judgment actually matters.",
          ),
          node(
            "m26-x-clarity",
            "value",
            "Clarity over magic",
            "Maya values understandable usefulness over opaque magic.",
            "The product should feel clear before it feels magical.",
          ),
        ],
      ),
      content(
        "2026-youtube",
        "youtube",
        "2026-07-23T15:00:00.000Z",
        "The future of learning is adaptive and human-guided",
        [
          node(
            "m26-yt-learning",
            "theme",
            "Adaptive human-guided learning",
            "Maya sees the future of learning as adaptive, human-guided, and AI-assisted.",
            "The future of learning is adaptive, human-guided, and AI-assisted.",
          ),
          node(
            "m26-yt-system",
            "lesson",
            "Connect learner, teacher, and AI",
            "Effective learning products create a feedback system across learners, teachers, and AI.",
            "The AI should shorten the feedback loop for the learner and improve the signal available to the teacher.",
          ),
          node(
            "m26-yt-educator",
            "identity",
            "AI product educator",
            "Maya's current identity combines product building with practical education.",
            "My work now sits between building AI products and helping people understand the tradeoffs inside them.",
          ),
        ],
      ),
    ],
    edges: [
      ["m23-li-automation", "m24-li-demo", "challenged_by"],
      ["m23-x-agents", "m24-x-agency", "evolved_into"],
      ["m24-li-context", "m25-li-education", "led_to"],
      ["m24-yt-useful", "m25-yt-evolution", "reinforces"],
      ["m25-li-education", "m26-li-judgment", "reinforces"],
      ["m25-x-tutors", "m26-yt-learning", "supports"],
      ["m25-yt-responsible", "m26-li-builder", "supports"],
      ["m26-x-capable", "m26-yt-educator", "expressed_through"],
    ],
  },
];

async function findOrCreateUser(demo) {
  let user;
  for (let page = 1; page <= 10 && !user; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;
    user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === demo.email,
    );
    if (data.users.length < 100) break;
  }
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { display_name: demo.name, username: demo.username },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: demoPassword,
      email_confirm: true,
      user_metadata: { display_name: demo.name, username: demo.username },
    });
    if (error) throw error;
    user = data.user;
  }
  return user;
}

function buildRows(demo, userId) {
  const foundationContentId = stableUuid(
    `creator-dna-demo:${demo.key}:foundation`,
  );
  const contentRows = [
    {
      id: foundationContentId,
      user_id: userId,
      title: "Creator Foundation",
      platform: null,
      published_at: null,
      raw_text: JSON.stringify(demo.foundation),
      external_source: "demo_seed",
      external_id: `${demo.key}:foundation`,
      external_url: null,
      created_at: foundationDate,
    },
    ...demo.contents.map((item) => ({
      id: stableUuid(`creator-dna-demo:${demo.key}:content:${item.key}`),
      user_id: userId,
      title: item.title,
      platform: item.platform,
      published_at: item.publishedAt,
      raw_text: item.rawText,
      external_source: "demo_seed",
      external_id: `${demo.key}:${item.key}`,
      external_url: null,
      created_at: item.publishedAt,
    })),
  ];
  const foundationEntries = [
    ["identity", "What I do", demo.foundation.whatYouDo],
    ["theme", "Main topics", demo.foundation.mainTopics],
    ...demo.foundation.expertise.map((value) => ["expertise", value, value]),
    ...demo.foundation.importantExperiences.map((value) => [
      "experience",
      value,
      value,
    ]),
    ...demo.foundation.accomplishments.map((value) => [
      "experience",
      value,
      value,
    ]),
    ...demo.foundation.failures.map((value) => ["experience", value, value]),
    ...demo.foundation.perspectiveChanges.map((value) => [
      "lesson",
      value,
      value,
    ]),
    ...demo.foundation.beliefs.map((value) => ["belief", value, value]),
    ...demo.foundation.values.map((value) => ["value", value, value]),
    ...demo.foundation.personality.map((value) => ["identity", value, value]),
    ...demo.foundation.goals.map((value) => ["goal", value, value]),
  ];
  const nodeRows = foundationEntries.map(([type, label, summary], index) => ({
    id: stableUuid(
      `creator-dna-demo:${demo.key}:foundation-node:${index}:${type}:${label}`,
    ),
    content_id: foundationContentId,
    type,
    label,
    summary,
    evidence_quote: `Creator-declared foundation: ${summary}`,
    confidence: 1,
    source_title: "Creator Foundation",
    source_date: foundationDate,
    embedding: null,
    created_at: foundationDate,
  }));
  const nodeIdsByKey = new Map();
  for (const item of demo.contents) {
    const contentId = stableUuid(
      `creator-dna-demo:${demo.key}:content:${item.key}`,
    );
    for (const value of item.nodes) {
      const id = stableUuid(`creator-dna-demo:${demo.key}:node:${value.key}`);
      nodeIdsByKey.set(value.key, id);
      nodeRows.push({
        id,
        content_id: contentId,
        type: value.type,
        label: value.label,
        summary: value.summary,
        evidence_quote: value.evidenceQuote,
        confidence: value.confidence,
        source_title: item.title,
        source_date: item.publishedAt,
        embedding: null,
        created_at: item.publishedAt,
      });
    }
  }
  const edgeRows = demo.edges.map(([source, target, relationship]) => ({
    id: stableUuid(
      `creator-dna-demo:${demo.key}:edge:${source}:${target}:${relationship}`,
    ),
    source_node_id: nodeIdsByKey.get(source),
    target_node_id: nodeIdsByKey.get(target),
    relationship,
    created_at: foundationDate,
  }));
  return { contentRows, nodeRows, edgeRows };
}

async function withRetries(operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

async function embedNodeRows(rows) {
  const { buildDnaNodeEmbeddingText, embedTexts, EMBEDDING_DIMENSION } =
    await import("../src/lib/creator-dna/server/embeddings.ts");
  const embedded = [];
  for (let start = 0; start < rows.length; start += 20) {
    const batch = rows.slice(start, start + 20);
    const vectors = await withRetries(() =>
      embedTexts(
        batch.map((row) =>
          buildDnaNodeEmbeddingText({
            id: row.id,
            contentId: row.content_id,
            type: row.type,
            label: row.label,
            summary: row.summary,
          }),
        ),
      ),
    );
    vectors.forEach((vector, index) => {
      if (vector.length !== EMBEDDING_DIMENSION)
        throw new Error("Jina returned an invalid embedding dimension.");
      embedded.push({ ...batch[index], embedding: vector });
    });
  }
  return embedded;
}

async function seedDemo(demo) {
  const user = await findOrCreateUser(demo);
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    username: demo.username,
    display_name: demo.name,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw profileError;

  const { error: territoryError } = await supabase
    .from("brand_territories")
    .upsert(
      demo.territories.map(([name, description], position) => ({
        id: stableUuid(`creator-dna-demo:${demo.key}:territory:${name}`),
        user_id: user.id,
        name,
        normalized_name: name.toLowerCase(),
        description,
        position,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,normalized_name" },
    );
  if (territoryError) throw territoryError;

  const rows = buildRows(demo, user.id);
  const { error: contentError } = await supabase
    .from("content_items")
    .upsert(rows.contentRows, { onConflict: "id" });
  if (contentError) throw contentError;

  const embeddedNodeRows = await embedNodeRows(rows.nodeRows);
  for (let start = 0; start < embeddedNodeRows.length; start += 50) {
    const { error } = await supabase
      .from("dna_nodes")
      .upsert(embeddedNodeRows.slice(start, start + 50), { onConflict: "id" });
    if (error) throw error;
  }
  const { error: edgeError } = await supabase
    .from("dna_edges")
    .upsert(rows.edgeRows, { onConflict: "id" });
  if (edgeError) throw edgeError;
  return { demo, user, rows };
}

function vectorDimension(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string" && value.startsWith("[") && value.endsWith("]"))
    return value.slice(1, -1).split(",").length;
  return 0;
}

async function verifyDemo({ demo, user, rows }) {
  const contentIds = rows.contentRows.map((row) => row.id);
  const nodeIds = rows.nodeRows.map((row) => row.id);
  const [profile, territories, contentResult, nodesResult, edgesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,username,display_name,onboarding_completed")
        .eq("id", user.id)
        .single(),
      supabase.from("brand_territories").select("id").eq("user_id", user.id),
      supabase
        .from("content_items")
        .select("id,title,platform,published_at,raw_text")
        .eq("user_id", user.id)
        .in("id", contentIds),
      supabase
        .from("dna_nodes")
        .select("id,content_id,type,label,embedding,source_title,source_date")
        .in("id", nodeIds),
      supabase
        .from("dna_edges")
        .select("id,source_node_id,target_node_id,relationship")
        .in("source_node_id", nodeIds),
    ]);
  for (const result of [
    profile,
    territories,
    contentResult,
    nodesResult,
    edgesResult,
  ])
    if (result.error) throw result.error;
  const contents = contentResult.data;
  const nodes = nodesResult.data;
  const nodeIdSet = new Set(nodeIds);
  const edges = edgesResult.data.filter((edge) =>
    nodeIdSet.has(edge.target_node_id),
  );
  const foundation = contents.find(
    (item) => item.title === "Creator Foundation",
  );
  const foundationAnswers = foundation ? JSON.parse(foundation.raw_text) : {};
  const foundationAnswerCount = Object.values(foundationAnswers).filter(
    (value) =>
      Array.isArray(value)
        ? value.length > 0
        : Boolean(String(value || "").trim()),
  ).length;
  const dated = contents
    .map((item) => item.published_at)
    .filter(Boolean)
    .sort();
  const platformCounts = Object.fromEntries(
    ["youtube", "linkedin", "x"].map((platform) => [
      platform,
      contents.filter((item) => item.platform === platform).length,
    ]),
  );
  const nullEmbeddings = nodes.filter((item) => item.embedding == null).length;
  const invalidDimensions = nodes.filter(
    (item) => vectorDimension(item.embedding) !== 1024,
  ).length;
  const sourceYears = new Set(
    nodes.map((item) => item.source_date?.slice(0, 4)).filter(Boolean),
  );
  const requiredTypes = new Set(nodes.map((item) => item.type));
  const assertions = {
    authUser: Boolean(user.id),
    profile:
      profile.data.username === demo.username &&
      profile.data.onboarding_completed,
    foundationAnswers: foundationAnswerCount === 11,
    foundation: Boolean(foundation),
    territories: territories.data.length >= 3,
    content: contents.length === rows.contentRows.length,
    platforms: Object.values(platformCounts).every((count) => count > 0),
    nodes: nodes.length === rows.nodeRows.length,
    edges: edges.length === rows.edgeRows.length && edges.length > 0,
    embeddings: nullEmbeddings === 0 && invalidDimensions === 0,
    provenance: nodes.every((item) => item.source_title && item.source_date),
    multiYear: ["2023", "2024", "2025", "2026"].every((year) =>
      sourceYears.has(year),
    ),
    semanticTypes: requiredTypes.size >= 7,
  };
  if (Object.values(assertions).some((value) => !value))
    throw new Error(
      `${demo.name} verification failed: ${JSON.stringify(assertions)}`,
    );
  return {
    name: demo.name,
    authUser: "present",
    profile: "complete",
    foundationAnswerCount,
    foundation: "present",
    brandTerritoryCount: territories.data.length,
    contentItemCount: contents.length,
    platformCounts,
    dnaNodeCount: nodes.length,
    dnaEdgeCount: edges.length,
    nullEmbeddingCount: nullEmbeddings,
    invalidEmbeddingDimensionCount: invalidDimensions,
    earliestContentDate: dated[0],
    latestContentDate: dated.at(-1),
  };
}

async function verifyRetrieval(seeded) {
  const { embedQuery } =
    await import("../src/lib/creator-dna/server/embeddings.ts");
  const queries = {
    jordan: "working hard as a founder",
    maya: "AI replacing teachers",
  };
  const ownedIds = new Map(
    seeded.map(({ demo, rows }) => [
      demo.key,
      new Set(rows.nodeRows.map((row) => row.id)),
    ]),
  );
  const results = {};
  for (const item of seeded) {
    const vector = await withRetries(() => embedQuery(queries[item.demo.key]));
    const { data, error } = await supabase.rpc("match_dna_nodes", {
      query_embedding: vector,
      match_threshold: 0.15,
      match_count: 12,
      match_user_id: item.user.id,
    });
    if (error) throw error;
    const own = ownedIds.get(item.demo.key);
    const other = ownedIds.get(item.demo.key === "jordan" ? "maya" : "jordan");
    if (
      !data.length ||
      data.some((match) => !own.has(match.id) || other.has(match.id))
    )
      throw new Error(
        `${item.demo.name} retrieval isolation verification failed.`,
      );
    results[item.demo.key] = data.slice(0, 8).map((match) => ({
      type: match.type,
      label: match.label,
      sourceTitle: match.source_title,
      sourceDate: match.source_date,
      similarity: Number(match.similarity.toFixed(3)),
    }));
  }
  return results;
}

const seeded = [];
try {
  for (const demo of demos) {
    console.log(`Seeding ${demo.name}...`);
    seeded.push(await seedDemo(demo));
  }
  const verification = [];
  for (const item of seeded) verification.push(await verifyDemo(item));
  const retrieval = await verifyRetrieval(seeded);
  console.log(JSON.stringify({ verification, retrieval }, null, 2));
} finally {
  // Supabase uses fetch and has no persistent connection to close.
}
