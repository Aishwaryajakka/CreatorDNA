import type { User } from "@supabase/supabase-js";
import { supabaseServer } from "./server";

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  profileChangedAt: string | null;
};
export function toProfile(
  row: {
    id: string;
    username: string;
    display_name: string;
    profile_changed_at: string | null;
  },
  user: User,
): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: user.email ?? "",
    profileChangedAt: row.profile_changed_at,
  };
}
export async function getOrCreateProfile(
  user: User,
  input?: { username: string; displayName: string },
): Promise<Profile> {
  const existing = await supabaseServer
    .from("profiles")
    .select("id,username,display_name,profile_changed_at")
    .eq("id", user.id)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return toProfile(existing.data, user);
  if (!input) throw new Error("Profile setup is required.");
  const created = await supabaseServer
    .from("profiles")
    .insert({
      id: user.id,
      username: input.username,
      display_name: input.displayName,
    })
    .select("id,username,display_name,profile_changed_at")
    .single();
  if (created.error) throw new Error(created.error.message);
  return toProfile(created.data, user);
}
export async function updateProfile(
  user: User,
  displayName: string,
  username: string,
): Promise<Profile> {
  const current = await getOrCreateProfile(user);
  if (
    current.profileChangedAt &&
    Date.now() - Date.parse(current.profileChangedAt) < 30 * 24 * 60 * 60 * 1000
  )
    throw new Error(
      `Profile changes are locked until ${new Date(Date.parse(current.profileChangedAt) + 30 * 24 * 60 * 60 * 1000).toISOString()}.`,
    );
  const result = await supabaseServer
    .from("profiles")
    .update({
      display_name: displayName,
      username,
      updated_at: new Date().toISOString(),
      profile_changed_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id,username,display_name,profile_changed_at")
    .single();
  if (result.error) throw new Error(result.error.message);
  return toProfile(result.data, user);
}
