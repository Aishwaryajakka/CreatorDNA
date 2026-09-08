import {
  BookOpen,
  Brain,
  Compass,
  Fingerprint,
  Heart,
  Layers3,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { LegacyDnaKind } from "@/lib/creator-dna";

export const DNA_TYPE_ICONS: Record<LegacyDnaKind, LucideIcon> = {
  story: BookOpen,
  belief: Lightbulb,
  theme: Layers3,
  experience: Compass,
  lesson: Sparkles,
  goal: Target,
  value: Heart,
  identity: Fingerprint,
  expertise: Brain,
  evolution: TrendingUp,
};

export function getDnaIconForeground(kind: LegacyDnaKind) {
  const token = kind === "evolution" ? "lesson" : kind;
  return `var(--dna-${token}-foreground)`;
}

export function getDnaBorderColor(kind: LegacyDnaKind) {
  const token = kind === "evolution" ? "lesson" : kind;
  return `var(--dna-${token}-border)`;
}
