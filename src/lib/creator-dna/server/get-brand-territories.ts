/// <reference types="node" />

import { listBrandTerritories } from "../brand-territories-repository";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export async function getBrandTerritories(request: Request) {
  const user = await requireAuthenticatedUser(request);
  return listBrandTerritories(user.id);
}
