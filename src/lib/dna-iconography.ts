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

const DARK_ICON_KINDS = new Set<LegacyDnaKind>([
  "belief",
  "theme",
  "experience",
  "lesson",
  "value",
  "expertise",
  "evolution",
]);

export function getDnaIconForeground(kind: LegacyDnaKind) {
  return DARK_ICON_KINDS.has(kind) ? "#08204A" : "#FFFFFF";
}
