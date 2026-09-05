import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
const schema = z.object({
  identity: z.string().trim().min(1),
  password: z.string().min(6),
});
export const Route = createFileRoute("/api/auth/username-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const p = schema.safeParse(body);
        if (!p.success)
          return Response.json(
            { error: "Invalid credentials." },
            { status: 400 },
          );
        let email = p.data.identity;
        if (!email.includes("@")) {
          const row = await supabaseServer
            .from("profiles")
            .select("id")
            .eq("username", p.data.identity.toLowerCase())
            .maybeSingle();
          if (!row.data)
            return Response.json(
              { error: "Invalid credentials." },
              { status: 401 },
            );
          const u = await supabaseServer.auth.admin.getUserById(row.data.id);
          if (u.error || !u.data.user.email)
            return Response.json(
              { error: "Invalid credentials." },
              { status: 401 },
            );
          email = u.data.user.email;
        }
        const result = await supabaseServer.auth.signInWithPassword({
          email,
          password: p.data.password,
        });
        if (result.error || !result.data.session)
          return Response.json(
            { error: "Invalid credentials." },
            { status: 401 },
          );
        return Response.json({ session: result.data.session });
      },
    },
  },
});
