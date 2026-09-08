/// <reference types="node" />

import { listBrandTerritories } from "../brand-territories-repository";
import { brandEvidenceTime, deriveBrandTimeline } from "../brand-evolution";
import { getDnaNodesForUser } from "../repository";
import type {
  BrandEvidenceNode,
  BrandEvolutionResult,
  CreatorDNANode,
  DnaKind,
} from "../types";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

function toEvidenceNode(node: CreatorDNANode): BrandEvidenceNode {
  const { embedding: _embedding, ...evidenceNode } = node;
  return evidenceNode;
}

function newest(nodes: CreatorDNANode[], type: DnaKind) {
  return nodes
    .filter((node) => node.type === type)
    .sort((left, right) => brandEvidenceTime(right) - brandEvidenceTime(left))
    .slice(0, 3)
    .map(toEvidenceNode);
}

export async function getBrandEvolution(
  request: Request,
): Promise<BrandEvolutionResult> {
  const user = await requireAuthenticatedUser(request);
  const [nodes, territories] = await Promise.all([
    getDnaNodesForUser(user.id),
    listBrandTerritories(user.id),
  ]);
  return {
    timeline: deriveBrandTimeline(nodes),
    currentPosition: {
      beliefs: newest(nodes, "belief"),
      themes: newest(nodes, "theme"),
      expertise: newest(nodes, "expertise"),
    },
    futureDirection: {
      label: "Declared direction",
      territories,
      goals: newest(
        nodes.filter((node) => node.sourceTitle === "Creator Foundation"),
        "goal",
      ),
    },
  };
}
