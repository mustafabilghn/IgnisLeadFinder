import type { Priority, RelativeLabel } from "@/lib/types";
import { PRIORITY_META } from "@/lib/scoringEngine";
import { RELATIVE_LABEL_META } from "@/lib/relativeRanking";

const COLORS: Record<Priority, string> = {
  very_high: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-stone-100 text-stone-600",
};

/** Secondary/reference badge — the fixed 0-100 bar. Primary UI now leads with RelativeLabelBadge + rank instead. */
export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${COLORS[priority]}`}>
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

const RELATIVE_COLORS: Record<RelativeLabel, string> = {
  very_strong: "bg-red-100 text-red-800",
  strong: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  weak: "bg-stone-100 text-stone-600",
};

/** Primary qualitative badge — candidate strength RELATIVE to this search's other results, not a fixed bar. */
export function RelativeLabelBadge({ label }: { label: RelativeLabel }) {
  const meta = RELATIVE_LABEL_META[label];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${RELATIVE_COLORS[label]}`}>
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ignis-100 px-2.5 py-1 text-xs font-bold text-ignis-800">
      #{rank} Öncelikli
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 font-semibold text-stone-900">
      {score}
      <span className="text-xs font-normal text-stone-400">/100</span>
    </span>
  );
}
