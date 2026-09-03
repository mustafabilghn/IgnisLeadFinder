import Link from "next/link";
import type { LeadSummary } from "@/lib/types";
import { RankBadge, RelativeLabelBadge, ScoreBadge } from "@/components/PriorityBadge";

const EVIDENCE_ROWS: { key: keyof LeadSummary; label: string }[] = [
  { key: "b2bSignal", label: "B2B" },
  { key: "dealerSignal", label: "Bayi ağı" },
  { key: "technicalSignal", label: "Teknik / özel üretim" },
  { key: "whatsappSignal", label: "WhatsApp" },
];

export function PriorityLeadCard({ lead, aiActive }: { lead: LeadSummary; aiActive: boolean }) {
  return (
    <div className="card border-ignis-200 bg-gradient-to-br from-ignis-50/60 to-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <RankBadge rank={lead.rank} />
          <RelativeLabelBadge label={lead.relativeLabel} />
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={lead.score} />
          <span className="text-xs text-stone-400">Ignis Uygunluğu</span>
        </div>
      </div>

      <Link href={`/leads/${lead.id}`} className="mt-3 block">
        <h3 className="text-lg font-semibold text-stone-900 hover:text-ignis-700 hover:underline">{lead.name}</h3>
      </Link>
      <p className="mt-0.5 text-sm text-stone-500">
        {lead.category} · {[lead.district, lead.city].filter(Boolean).join(", ")}
        {lead.rating != null && (
          <>
            {" · "}★ {lead.rating.toFixed(1)}
            {lead.reviewCount != null && ` (${lead.reviewCount})`}
          </>
        )}
      </p>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Neden?</h4>
        {lead.aiReason ? (
          <p className="mt-1 text-sm leading-relaxed text-stone-700">{lead.aiReason}</p>
        ) : aiActive ? (
          <p className="mt-1 text-sm text-stone-400">AI değerlendirmesi yükleniyor…</p>
        ) : (
          <p className="mt-1 text-sm text-stone-500">
            AI değerlendirmesi mevcut değil — aşağıdaki doğrulanmış sinyallere göre Ignis Uygunluk Puanına
            göre sıralandı.
          </p>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Kanıtlar</h4>
        <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {EVIDENCE_ROWS.map((row) => {
            const verified = !!lead[row.key];
            return (
              <li key={row.label} className="flex items-center gap-1.5">
                <span className={verified ? "text-emerald-600" : "text-stone-300"}>{verified ? "✓" : "?"}</span>
                <span className="text-stone-600">{row.label}</span>
                <span className={`text-xs ${verified ? "text-emerald-700" : "text-stone-400"}`}>
                  — {verified ? "Doğrulandı" : "Bilinmiyor"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <Link
        href={`/leads/${lead.id}`}
        className="mt-4 inline-block text-sm font-semibold text-ignis-700 hover:underline"
      >
        Bununla konuş → firmayı incele
      </Link>
    </div>
  );
}
