import type { Priority } from "@/lib/types";
import { PRIORITY_META } from "@/lib/scoringEngine";

const COLORS: Record<Priority, string> = {
  very_high: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-stone-100 text-stone-600",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${COLORS[priority]}`}>
      <span>{meta.emoji}</span>
      {meta.label}
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
