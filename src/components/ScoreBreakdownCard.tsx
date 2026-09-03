import type { ScoreBreakdown } from "@/lib/types";
import { PriorityBadge } from "@/components/PriorityBadge";

export function ScoreBreakdownCard({ score }: { score: ScoreBreakdown }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-stone-900">{score.total}</div>
        <div>
          <div className="text-xs text-stone-400">/ 100 — Ignis Uygunluk Puanı</div>
          <PriorityBadge priority={score.priority} />
        </div>
      </div>

      <div className="space-y-3">
        {score.categories.map((cat) => (
          <div key={cat.category}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700">{cat.label}</span>
              <span className="text-stone-400">
                {cat.score} / {cat.max}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-ignis-500"
                style={{ width: `${cat.max > 0 ? (cat.score / cat.max) * 100 : 0}%` }}
              />
            </div>
            {cat.reasons.length > 0 && (
              <div className="mt-1 text-xs text-stone-400">{cat.reasons.join(" · ")}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Olumlu sinyaller
          </div>
          {score.positiveSignals.length === 0 ? (
            <p className="text-sm text-stone-400">Taranan sayfalarda bulunamadı.</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-600">
              {score.positiveSignals.map((s) => (
                <li key={s} className="flex gap-1.5">
                  <span className="text-emerald-600">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Bilinmiyor</div>
          {score.unknownSignals.length === 0 ? (
            <p className="text-sm text-stone-400">İşaretlenen bir şey yok.</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-600">
              {score.unknownSignals.map((s) => (
                <li key={s} className="flex gap-1.5">
                  <span className="text-stone-300">?</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
