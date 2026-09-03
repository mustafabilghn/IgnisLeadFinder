"use client";

import Link from "next/link";
import type { LeadSummary, LeadStatus } from "@/lib/types";
import { PriorityBadge, ScoreBadge } from "@/components/PriorityBadge";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Yeni",
  contacted: "İletişime Geçildi",
  interested: "İlgileniyor",
  meeting: "Görüşme",
  won: "Kazanıldı",
  lost: "Kaybedildi",
};

export function LeadTable({ leads }: { leads: LeadSummary[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[950px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <th className="px-4 py-3 text-center font-medium">Sıra</th>
            <th className="px-4 py-3 font-medium">Firma</th>
            <th className="px-4 py-3 font-medium">Sektör</th>
            <th className="px-4 py-3 font-medium">Konum</th>
            <th className="px-4 py-3 text-center font-medium">B2B</th>
            <th className="px-4 py-3 text-center font-medium">Bayi</th>
            <th className="px-4 py-3 text-center font-medium">Sipariş Karmaşıklığı</th>
            <th className="px-4 py-3 text-center font-medium">İletişim Kanalları</th>
            <th className="px-4 py-3 font-medium">Ignis Uygunluğu</th>
            <th className="px-4 py-3 font-medium">Öncelik</th>
            <th className="px-4 py-3 font-medium">Durum</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
              <td className="px-4 py-3 text-center text-xs text-stone-400">#{lead.rank}</td>
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="font-medium text-stone-900 hover:text-ignis-700 hover:underline">
                  {lead.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-400">
                  {lead.rating != null && <span>★ {lead.rating.toFixed(1)}</span>}
                  {lead.reviewCount != null && <span>({lead.reviewCount})</span>}
                  {!lead.hasWebsite && <span className="text-amber-600">Web sitesi yok</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-stone-600">{lead.category}</td>
              <td className="px-4 py-3 text-stone-600">{[lead.district, lead.city].filter(Boolean).join(", ")}</td>
              <td className="px-4 py-3 text-center">{lead.b2bSignal ? <Check /> : <Dash />}</td>
              <td className="px-4 py-3 text-center">{lead.dealerSignal ? <Check /> : <Dash />}</td>
              <td className="px-4 py-3 text-center">{lead.technicalSignal ? <Check /> : <Dash />}</td>
              <td className="px-4 py-3 text-center">{lead.whatsappSignal ? <Check /> : <Dash />}</td>
              <td className="px-4 py-3">
                <ScoreBadge score={lead.score} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={lead.priority} />
              </td>
              <td className="px-4 py-3 text-xs font-medium text-stone-600">{STATUS_LABELS[lead.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Check() {
  return <span className="text-emerald-600">✓</span>;
}
function Dash() {
  return <span className="text-stone-300">–</span>;
}
