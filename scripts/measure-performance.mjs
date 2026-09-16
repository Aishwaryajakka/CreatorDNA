import { createClient } from "@supabase/supabase-js";

const baseUrl = process.argv[2] || "http://127.0.0.1:3000";
const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const password = process.env.DEMO_USER_PASSWORD || "Pass1234";
if (!supabaseUrl || !publishableKey)
  throw new Error("Supabase performance-test configuration is missing.");

const personas = [
  {
    name: "jordan",
    email: "jordan.creator@example.com",
    idea: "I want to create something about working hard as a founder.",
  },
  {
    name: "maya",
    email: "maya.creator@example.com",
    idea: "I want to create something about AI replacing teachers.",
  },
];

async function sessionFor(persona) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: persona.email,
    password,
  });
  if (!error && data.session)
    return { token: data.session.access_token, cleanupCookie: null };
  const response = await fetch(`${baseUrl}/api/auth/demo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ persona: persona.name }),
  });
  const body = await response.json();
  if (!response.ok || !body.session)
    throw new Error(`Unable to authenticate ${persona.email}`);
  return {
    token: body.session.access_token,
    cleanupCookie: response.headers.get("set-cookie")?.split(";")[0] ?? null,
  };
}

async function measure(token, path, init, attempts = 1) {
  let result;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const startedAt = performance.now();
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init?.body ? { "content-type": "application/json" } : {}),
      },
    });
    const text = await response.text();
    result = {
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
      bytes: Buffer.byteLength(text),
      serverTiming: response.headers.get("server-timing"),
      body: JSON.parse(text),
    };
    if (response.status !== 502) break;
  }
  return result;
}

for (const persona of personas) {
  const { token, cleanupCookie } = await sessionFor(persona);
  try {
    const storyMap = await measure(token, "/api/story-map");
    const plan = await measure(
      token,
      "/api/plan-content",
      {
        method: "POST",
        body: JSON.stringify({
          idea: persona.idea,
          targetPlatform: "linkedin",
        }),
      },
      3,
    );
    const reshape = plan.body.threeAuthenticAngles?.length
      ? await measure(token, "/api/reshape-content", {
          method: "POST",
          body: JSON.stringify({
            idea: persona.idea,
            targetPlatform: "linkedin",
            directionIndex: 0,
            reshapeMode: "stronger_point_of_view",
          }),
        })
      : null;
    console.log(
      JSON.stringify({
        persona: persona.name,
        storyMap: {
          status: storyMap.status,
          durationMs: storyMap.durationMs,
          bytes: storyMap.bytes,
          nodes: storyMap.body.nodes?.length,
        },
        plan: {
          status: plan.status,
          durationMs: plan.durationMs,
          bytes: plan.bytes,
          serverTiming: plan.serverTiming,
          directions: plan.body.threeAuthenticAngles?.length,
        },
        reshape: reshape
          ? {
              status: reshape.status,
              durationMs: reshape.durationMs,
              bytes: reshape.bytes,
              serverTiming: reshape.serverTiming,
              groundedNodes: reshape.body.groundedIn?.length,
            }
          : null,
      }),
    );
  } finally {
    if (cleanupCookie)
      await fetch(`${baseUrl}/api/auth/demo`, {
        method: "DELETE",
        headers: { cookie: cleanupCookie },
      });
  }
}
