import { NextResponse } from "next/server";
import { listLeads } from "@/lib/leadRepository";
import type { LeadFilters, LeadStatus } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;

  const filters: LeadFilters = {
    searchId: p.get("searchId") || undefined,
    minScore: p.has("minScore") ? Number(p.get("minScore")) : undefined,
    industry: p.get("industry") || undefined,
    district: p.get("district") || undefined,
    b2b: p.get("b2b") === "1" || undefined,
    dealer: p.get("dealer") === "1" || undefined,
    technical: p.get("technical") === "1" || undefined,
    whatsapp: p.get("whatsapp") === "1" || undefined,
    hasWebsite: p.get("hasWebsite") === "1" || undefined,
    status: (p.get("status") as LeadStatus | null) || undefined,
  };

  try {
    const leads = listLeads(filters);
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("Failed to list leads:", err);
    return NextResponse.json({ error: "Firmalar yüklenemedi." }, { status: 500 });
  }
}
