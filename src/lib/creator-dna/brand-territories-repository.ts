/// <reference types="node" />

import type { BrandTerritory } from "./types";
import {
  BrandTerritoriesInputSchema,
  type BrandTerritoriesInput,
} from "./validation";
import { supabaseServer } from "@/lib/supabase/server";

function toBrandTerritory(row: {
  id: string;
  name: string;
  description: string | null;
  position: number;
}): BrandTerritory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    position: row.position,
  };
}

export async function listBrandTerritories(
  userId: string,
): Promise<BrandTerritory[]> {
  const { data, error } = await supabaseServer
    .from("brand_territories")
    .select("id,name,description,position")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error)
    throw new Error(`Failed to load brand territories: ${error.message}`);
  return data.map(toBrandTerritory);
}

export async function replaceBrandTerritories(
  userId: string,
  territories: BrandTerritoriesInput["territories"],
): Promise<BrandTerritory[]> {
  const parsed = BrandTerritoriesInputSchema.parse({ territories });
  const now = new Date().toISOString();
  const { data: saved, error: saveError } = await supabaseServer
    .from("brand_territories")
    .upsert(
      parsed.territories.map((territory, position) => ({
        user_id: userId,
        name: territory.name,
        normalized_name: territory.name.toLowerCase(),
        description: territory.description || null,
        position,
        updated_at: now,
      })),
      { onConflict: "user_id,normalized_name" },
    )
    .select("id");
  if (saveError)
    throw new Error(`Failed to save brand territories: ${saveError.message}`);

  const savedIds = saved.map(({ id }) => id);
  const { error: deleteError } = await supabaseServer
    .from("brand_territories")
    .delete()
    .eq("user_id", userId)
    .not("id", "in", `(${savedIds.join(",")})`);
  if (deleteError)
    throw new Error(
      `Failed to replace brand territories: ${deleteError.message}`,
    );

  return listBrandTerritories(userId);
}

export async function deleteBrandTerritory(
  userId: string,
  territoryId: string,
): Promise<void> {
  const current = await listBrandTerritories(userId);
  if (current.length <= 3) {
    throw new Error("Choose at least 3 territories.");
  }
  const { error } = await supabaseServer
    .from("brand_territories")
    .delete()
    .eq("id", territoryId)
    .eq("user_id", userId);
  if (error)
    throw new Error(`Failed to delete brand territory: ${error.message}`);
}
