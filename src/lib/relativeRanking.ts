import type { RelativeLabel } from "./types";

/**
 * Deterministic, non-AI computation of how strong a lead is RELATIVE to the
 * other leads in the same result set — this is what makes the app
 * "ranking-first" instead of judging every lead against a fixed 0-100 bar.
 * A search where the best score is 31 will still show that lead as
 * "very_strong" (top of its own pool); a search where the best score is 90
 * needs a real 90 to earn the same label. Ties (equal scores) always get
 * the same label, computed from how many OTHER scores beat this one rather
 * than raw list position.
 */
export function computeRelativeLabel(score: number, allScoresDesc: number[]): RelativeLabel {
  if (score <= 0) return "weak";
  if (allScoresDesc.length <= 1) return "very_strong";

  const higherCount = allScoresDesc.filter((s) => s > score).length;
  const percentileFromTop = higherCount / allScoresDesc.length; // 0 = best possible

  if (percentileFromTop <= 0.25) return "very_strong";
  if (percentileFromTop <= 0.5) return "strong";
  if (percentileFromTop <= 0.75) return "medium";
  return "weak";
}

export const RELATIVE_LABEL_META: Record<RelativeLabel, { label: string; emoji: string }> = {
  very_strong: { label: "Çok Güçlü Aday", emoji: "🔥" },
  strong: { label: "Güçlü Aday", emoji: "🟠" },
  medium: { label: "Orta Seviye Aday", emoji: "🟡" },
  weak: { label: "Zayıf Aday", emoji: "⚪" },
};
