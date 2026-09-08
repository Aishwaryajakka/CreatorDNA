/// <reference types="node" />

import { replaceBrandTerritories } from "../brand-territories-repository";
import { BrandTerritoriesInputSchema } from "../validation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export async function saveBrandTerritories(request: Request, input: unknown) {
  const user = await requireAuthenticatedUser(request);
  const parsed = BrandTerritoriesInputSchema.parse(input);
  return replaceBrandTerritories(user.id, parsed.territories);
}
