import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { getLead, saveAiSummary } from "@/lib/leadRepository";
import { generateLeadSummary } from "@/lib/aiLeadAnalyzer";
import { providerErrorResponse } from "@/lib/errors";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "1";

  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  if (lead.aiSummary && !forceRegenerate) {
    return NextResponse.json({ summary: lead.aiSummary, cached: true });
  }

  try {
    const text = await generateLeadSummary(lead);
    saveAiSummary(id, text);
    return NextResponse.json({ summary: text, cached: false });
  } catch (err) {
    return providerErrorResponse(err, "AI summary generation failed:");
  }
}
