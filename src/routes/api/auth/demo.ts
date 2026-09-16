import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createSupabaseAuthClient,
  supabaseServer,
} from "@/lib/supabase/server";

const schema = z.object({ persona: z.enum(["jordan", "maya"]) });
const cleanupCookie = "creator_dna_demo_cleanup";
const templates = {
  jordan: { username: "jordan_wellness", name: "Jordan Lee" },
  maya: { username: "maya_ai", name: "Maya Chen" },
} as const;

async function clonePersona(persona: keyof typeof templates) {
  const template = templates[persona];
  const source = await supabaseServer
    .from("profiles")
    .select("id")
    .eq("username", template.username)
    .limit(1)
    .maybeSingle();
  if (source.error || !source.data)
    throw source.error ?? new Error("Seeded persona not found.");

  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  const email = `demo-${persona}-${suffix}@creator-dna.invalid`;
  const password = `${crypto.randomUUID()}Aa1!`;
  const cleanupKey = crypto.randomUUID();
  const created = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      demo_session: true,
      demo_persona: persona,
      demo_cleanup_cookie: true,
      demo_cleanup_key: cleanupKey,
    },
    user_metadata: {
      display_name: template.name,
      username: `demo_${persona}_${suffix}`,
    },
  });
  if (created.error || !created.data.user)
    throw created.error ?? new Error("Unable to create demo session.");
  const userId = created.data.user.id;

  try {
    const profile = await supabaseServer.from("profiles").upsert({
      id: userId,
      username: `demo_${persona}_${suffix}`,
      display_name: template.name,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    });
    if (profile.error) throw profile.error;

    const content = await supabaseServer
      .from("content_items")
      .select("*")
      .eq("user_id", source.data.id);
    if (content.error) throw content.error;
    const contentIds = new Map<string, string>();
    const contentRows = (content.data ?? []).map((row) => {
      const id = crypto.randomUUID();
      contentIds.set(row.id, id);
      return { ...row, id, user_id: userId };
    });
    if (contentRows.length) {
      const inserted = await supabaseServer
        .from("content_items")
        .insert(contentRows);
      if (inserted.error) throw inserted.error;
    }

    const nodes = await supabaseServer
      .from("dna_nodes")
      .select("*")
      .in("content_id", [...contentIds.keys()]);
    if (nodes.error) throw nodes.error;
    const nodeIds = new Map<string, string>();
    const nodeRows = (nodes.data ?? []).map((row) => {
      const id = crypto.randomUUID();
      nodeIds.set(row.id, id);
      return { ...row, id, content_id: contentIds.get(row.content_id ?? "")! };
    });
    if (nodeRows.length) {
      const inserted = await supabaseServer.from("dna_nodes").insert(nodeRows);
      if (inserted.error) throw inserted.error;
    }

    const edges = await supabaseServer
      .from("dna_edges")
      .select("*")
      .in("source_node_id", [...nodeIds.keys()]);
    if (edges.error) throw edges.error;
    const edgeRows = (edges.data ?? [])
      .filter((row) => nodeIds.has(row.target_node_id))
      .map((row) => ({
        ...row,
        id: crypto.randomUUID(),
        source_node_id: nodeIds.get(row.source_node_id)!,
        target_node_id: nodeIds.get(row.target_node_id)!,
      }));
    if (edgeRows.length) {
      const inserted = await supabaseServer.from("dna_edges").insert(edgeRows);
      if (inserted.error) throw inserted.error;
    }

    const territories = await supabaseServer
      .from("brand_territories")
      .select("*")
      .eq("user_id", source.data.id);
    if (territories.error) throw territories.error;
    if (territories.data?.length) {
      const inserted = await supabaseServer.from("brand_territories").insert(
        territories.data.map((row) => ({
          ...row,
          id: crypto.randomUUID(),
          user_id: userId,
        })),
      );
      if (inserted.error) throw inserted.error;
    }

    const research = await supabaseServer
      .from("research_items")
      .select("*")
      .eq("user_id", source.data.id);
    if (research.error) throw research.error;
    if (research.data?.length) {
      const inserted = await supabaseServer.from("research_items").insert(
        research.data.map((row) => ({
          ...row,
          id: crypto.randomUUID(),
          user_id: userId,
        })),
      );
      if (inserted.error) throw inserted.error;
    }

    const session = await createSupabaseAuthClient().auth.signInWithPassword({
      email,
      password,
    });
    if (session.error || !session.data.session)
      throw session.error ?? new Error("Unable to start demo session.");
    return {
      session: session.data.session,
      cleanupCapability: `${userId}.${cleanupKey}`,
    };
  } catch (error) {
    await supabaseServer.auth.admin.deleteUser(userId);
    throw error;
  }
}

function cookieValue(request: Request, name: string) {
  const prefix = `${name}=`;
  const encoded = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function cleanupCookieHeader(request: Request, value?: string) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return value
    ? `${cleanupCookie}=${encodeURIComponent(value)}; Path=/api/auth/demo; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`
    : `${cleanupCookie}=; Path=/api/auth/demo; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function temporaryNetworkError(error: unknown) {
  const details =
    error && typeof error === "object"
      ? {
          message: "message" in error ? String(error.message) : "unknown error",
          code: "code" in error ? String(error.code) : undefined,
        }
      : { message: "unknown error", code: undefined };
  if (process.env["NODE_ENV"] !== "production")
    console.error("[external-request] failure", {
      service: "supabase",
      route: "/api/auth/demo DELETE",
      ...details,
    });
  return Response.json({ error: "temporary_network_error" }, { status: 503 });
}

export const Route = createFileRoute("/api/auth/demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return Response.json(
            { error: "Choose a demo creator." },
            { status: 400 },
          );
        try {
          const demo = await clonePersona(parsed.data.persona);
          return Response.json(
            { session: demo.session },
            {
              headers: {
                "Set-Cookie": cleanupCookieHeader(
                  request,
                  demo.cleanupCapability,
                ),
              },
            },
          );
        } catch (error) {
          console.error("[demo-session] provisioning failed", {
            persona: parsed.data.persona,
            message:
              error && typeof error === "object" && "message" in error
                ? String(error.message)
                : "unknown error",
          });
          return Response.json(
            { error: "This demo persona is temporarily unavailable." },
            { status: 503 },
          );
        }
      },
      DELETE: async ({ request }) => {
        const capability = cookieValue(request, cleanupCookie);
        const separator = capability?.indexOf(".") ?? -1;
        const userId = separator > 0 ? capability!.slice(0, separator) : "";
        const key = separator > 0 ? capability!.slice(separator + 1) : "";
        const headers = { "Set-Cookie": cleanupCookieHeader(request) };
        if (!userId || !key)
          return Response.json(
            { error: "Demo session not found." },
            { status: 404, headers },
          );

        try {
          const found = await supabaseServer.auth.admin.getUserById(userId);
          if (
            found.error ||
            !found.data.user ||
            found.data.user.app_metadata["demo_session"] !== true ||
            found.data.user.app_metadata["demo_cleanup_key"] !== key
          )
            return Response.json(
              { error: "Demo session not found." },
              { status: 404, headers },
            );

          const deleted = await supabaseServer.auth.admin.deleteUser(userId);
          if (deleted.error)
            return Response.json(
              { error: "Unable to close demo session." },
              { status: 502, headers },
            );
          return Response.json({ ok: true }, { headers });
        } catch (error) {
          return temporaryNetworkError(error);
        }
      },
    },
  },
});
