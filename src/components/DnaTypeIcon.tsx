import type { LegacyDnaKind } from "@/lib/creator-dna";
import { DNA_TYPE_ICONS } from "@/lib/dna-iconography";

export function DnaTypeIcon({
  kind,
  size = 16,
  strokeWidth = 1.9,
  className = "",
}: {
  kind: LegacyDnaKind;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Icon = DNA_TYPE_ICONS[kind];
  return (
    <Icon
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
