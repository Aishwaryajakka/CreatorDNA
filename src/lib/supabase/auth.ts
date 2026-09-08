/// <reference types="node" />

import type { User } from "@supabase/supabase-js";

import { supabaseAuthServer } from "./server";

export class AuthenticationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function getAuthenticatedUser(
  request: Request,
): Promise<User | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const { data, error } = await supabaseAuthServer.auth.getUser(token);
  return error ? null : data.user;
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<User> {
  const user = await getAuthenticatedUser(request);
  if (!user) throw new AuthenticationError();
  return user;
}
