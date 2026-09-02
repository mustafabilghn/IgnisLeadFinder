"use client";

import Link from "next/link";
import type { LeadSummary } from "@/lib/types";
import { PriorityBadge, ScoreBadge } from "@/components/PriorityBadge";

export function LeadTable({ leads }: { leads: LeadSummary[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Industry</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 text-center font-medium">B2B</th>
            <th className="px-4 py-3 text-center font-medium">Dealer</th>
            <th className="px-4 py-3 text-center font-medium">Order Complexity</th>
            <th className="px-4 py-3 text-center font-medium">Channels</th>
            <th className="px-4 py-3 font-medium">Ignis Fit</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, idx) => (
            <tr
              key={lead.id}
              className={`border-b border-stone-100 last:border-0 hover:bg-stone-50 ${idx === 0 ? "bg-ignis-50/40" : ""}`}
            >
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="font-medium text-stone-900 hover:text-ignis-700 hover:underline">
                  {lead.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-400">
                  {lead.rating != null && <span>★ {lead.rating.toFixed(1)}</span>}
                  {lead.reviewCount != null && <span>({lead.reviewCount})</span>}
                  {!lead.hasWebsite && <span className="text-amber-600">No website</span>}
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
              <td className="px-4 py-3 text-xs font-medium capitalize text-stone-600">{lead.status}</td>
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
