import type { SignalEvidence } from "@/lib/types";
import { ClassificationBadge } from "@/components/ClassificationBadge";

const ORDER = { VERIFIED: 0, INFERRED: 1, DERIVED: 2, UNKNOWN: 3 } as const;

export function EvidenceTable({ signals }: { signals: SignalEvidence[] }) {
  const sorted = [...signals].sort((a, b) => ORDER[a.classification] - ORDER[b.classification]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            <th className="py-2 pr-4 font-medium">Sinyal</th>
            <th className="py-2 pr-4 font-medium">Durum</th>
            <th className="py-2 pr-4 font-medium">Değer</th>
            <th className="py-2 font-medium">Kaynak / kanıt</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.key} className="border-b border-stone-100 align-top last:border-0">
              <td className="py-2.5 pr-4 font-medium text-stone-800">{s.label}</td>
              <td className="py-2.5 pr-4">
                <ClassificationBadge classification={s.classification} />
              </td>
              <td className="py-2.5 pr-4 text-stone-600">{s.value}</td>
              <td className="py-2.5 text-stone-500">
                <div>{s.source}</div>
                {s.evidenceSnippet && <div className="mt-0.5 italic text-stone-400">"{s.evidenceSnippet}"</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
