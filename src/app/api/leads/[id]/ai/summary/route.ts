import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { getLead, saveAiSummary } from "@/lib/leadRepository";
import { generateLeadSummary } from "@/lib/aiLeadAnalyzer";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "1";

  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (lead.aiSummary && !forceRegenerate) {
    return NextResponse.json({ summary: lead.aiSummary, cached: true });
  }

  try {
    const { text, aiGenerated } = await generateLeadSummary(lead);
    saveAiSummary(id, text);
    return NextResponse.json({ summary: text, cached: false, aiGenerated });
  } catch (err) {
    console.error("AI summary generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate summary." },
      { status: 502 },
    );
  }
}
