import { createClient } from "@supabase/supabase-js";

const baseUrl = process.argv[2] || "http://127.0.0.1:4320";
const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const password = process.env.DEMO_USER_PASSWORD || "Pass1234";
if (!supabaseUrl || !publishableKey)
  throw new Error("Supabase verification configuration is missing.");

const demos = [
  {
    key: "jordan",
    email: "jordan.creator@example.com",
    idea: "I want to create something about working hard as a founder.",
    allowedAlignment: ["mixed"],
  },
  {
    key: "maya",
    email: "maya.creator@example.com",
    idea: "I want to create something about AI replacing teachers.",
    allowedAlignment: ["mixed", "weak"],
  },
];

async function sessionFor(email) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session)
    throw new Error(`Unable to authenticate ${email}.`);
  return data.session.access_token;
}

async function api(token, path, init, attempts = 1) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) return body;
    lastError = new Error(
      `${path} returned ${response.status}: ${body.error || "request failed"}`,
    );
    if (response.status !== 502 || attempt === attempts) throw lastError;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
  throw lastError;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const demo of demos) {
  const token = await sessionFor(demo.email);
  const [storyMap, library, foundation, territories, evolution] =
    await Promise.all([
      api(token, "/api/story-map"),
      api(token, "/api/content-library"),
      api(token, "/api/foundation"),
      api(token, "/api/brand-territories"),
      api(token, "/api/brand-evolution"),
    ]);
  assert(storyMap.nodes?.length > 0, `${demo.key}: Story Map is empty.`);
  assert(
    storyMap.nodes.every((node) => !("embedding" in node)),
    `${demo.key}: Story Map exposed embeddings.`,
  );
  assert(
    library.items?.length >= 13,
    `${demo.key}: Content Library is incomplete.`,
  );
  assert(foundation.foundation, `${demo.key}: Foundation is missing.`);
  assert(
    Object.values(foundation.foundation).filter((value) =>
      Array.isArray(value) ? value.length : String(value || "").trim(),
    ).length === 11,
    `${demo.key}: Foundation answers are incomplete.`,
  );
  assert(
    territories.territories?.length >= 3,
    `${demo.key}: territories are incomplete.`,
  );
  assert(
    evolution.timeline?.length >= 2,
    `${demo.key}: Brand Evolution is empty.`,
  );

  const plan = await api(
    token,
    "/api/plan-content",
    {
      method: "POST",
      body: JSON.stringify({
        idea: demo.idea,
        targetPlatform: "linkedin",
      }),
    },
    3,
  );
  assert(
    plan.retrievedDNA?.length > 0,
    `${demo.key}: planning retrieval is empty.`,
  );
  assert(
    plan.threeAuthenticAngles?.length === 3,
    `${demo.key}: planning did not return 3 directions.`,
  );
  console.log(
    JSON.stringify({
      creator: demo.key,
      retrievedLabels: plan.retrievedDNA.map((node) => node.label),
      alignmentState: plan.alignment?.state,
      alignmentWhyCount: plan.alignment?.why?.length,
      evolutionStatus: plan.possiblePerspectiveEvolution?.status,
      repetitionStatus: plan.possibleRepetition?.status,
    }),
  );
  assert(
    demo.allowedAlignment.includes(plan.alignment?.state),
    `${demo.key}: unexpected alignment state ${plan.alignment?.state}.`,
  );
  const ownedIds = new Set(storyMap.nodes.map((node) => node.id));
  assert(
    plan.retrievedDNA.every((node) => ownedIds.has(node.id)),
    `${demo.key}: planning returned a node outside the user's Story Map.`,
  );
  console.log(
    `${demo.key}: core APIs ready; alignment=${plan.alignment.state}; directions=${plan.threeAuthenticAngles.length}`,
  );

  const modes =
    demo.key === "jordan"
      ? ["closer_to_story", "stronger_point_of_view", "fresh_angle"]
      : ["closer_to_story"];
  const reshape = [];
  for (const reshapeMode of modes) {
    const result = await api(
      token,
      "/api/reshape-content",
      {
        method: "POST",
        body: JSON.stringify({
          idea: demo.idea,
          targetPlatform: "linkedin",
          directionIndex: 0,
          reshapeMode,
        }),
      },
      3,
    );
    assert(
      result.title && result.angle,
      `${demo.key}: ${reshapeMode} returned no direction.`,
    );
    assert(
      result.groundedIn?.length > 0,
      `${demo.key}: ${reshapeMode} is ungrounded.`,
    );
    assert(
      result.groundedIn.every((node) => ownedIds.has(node.nodeId)),
      `${demo.key}: ${reshapeMode} returned unowned evidence.`,
    );
    reshape.push({
      mode: reshapeMode,
      groundedNodeCount: result.groundedIn.length,
    });
  }

  console.log(
    JSON.stringify({
      creator: demo.key,
      storyMapNodes: storyMap.nodes.length,
      contentLibraryItems: library.items.length,
      brandEvolutionPoints: evolution.timeline.length,
      planRetrievedNodes: plan.retrievedDNA.length,
      alignment: plan.alignment.state,
      authenticDirections: plan.threeAuthenticAngles.length,
      reshape,
    }),
  );
}
