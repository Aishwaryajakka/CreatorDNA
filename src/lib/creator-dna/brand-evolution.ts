import type { BrandEvolutionPoint, CreatorDNANode, DnaKind } from "./types.ts";

const timelineKinds = new Set<DnaKind>([
  "belief",
  "experience",
  "lesson",
  "story",
  "theme",
]);

export function brandEvidenceTime(node: CreatorDNANode) {
  return Date.parse(node.sourceDate ?? node.createdAt ?? "") || 0;
}

export function deriveBrandTimeline(
  nodes: CreatorDNANode[],
): BrandEvolutionPoint[] {
  const seen = new Set<string>();
  const dated = nodes
    .filter(
      (node) =>
        Boolean(node.sourceDate) &&
        node.sourceTitle !== "Creator Foundation" &&
        timelineKinds.has(node.type),
    )
    .sort((left, right) => brandEvidenceTime(left) - brandEvidenceTime(right))
    .filter((node) => {
      const key = `${node.type}:${node.label.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (
    dated.length < 2 ||
    new Set(dated.map((node) => node.sourceDate)).size < 2
  )
    return [];
  const selected: Array<{
    node: CreatorDNANode;
    stage: BrandEvolutionPoint["stage"];
  }> = [{ node: dated[0]!, stage: "past" }];
  const middle = dated.slice(1, -1);
  const turningPoint = middle.find(
    (node) =>
      (node.type === "experience" || node.type === "lesson") &&
      /\b(chang|challeng|learn|realiz|shift|mistak|fail|turn)/i.test(
        `${node.label} ${node.summary}`,
      ),
  );
  if (turningPoint)
    selected.push({ node: turningPoint, stage: "turning_point" });
  const newer = [...dated]
    .reverse()
    .find(
      (node) =>
        node.id !== dated[0]!.id &&
        node.id !== turningPoint?.id &&
        (node.type === "belief" ||
          node.type === "lesson" ||
          node.type === "theme"),
    );
  if (newer) selected.push({ node: newer, stage: "new_position" });
  else if (dated.length > 1)
    selected.push({ node: dated[dated.length - 1]!, stage: "new_position" });

  return selected
    .sort(
      (left, right) =>
        brandEvidenceTime(left.node) - brandEvidenceTime(right.node),
    )
    .map(({ node, stage }) => ({
      id: node.id,
      date: node.sourceDate!,
      type: node.type,
      title: node.label,
      summary: node.summary,
      evidenceQuote: node.evidenceQuote ?? null,
      sourceTitle: node.sourceTitle ?? null,
      sourceDate: node.sourceDate!,
      contentId: node.contentId ?? null,
      stage,
    }));
}
