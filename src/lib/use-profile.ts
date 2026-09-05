import { useEffect, useState } from "react";
import { authenticatedFetch } from "./supabase/client";
import type { Profile } from "./supabase/profile";
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    void authenticatedFetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile);
  }, []);
  return profile;
}
