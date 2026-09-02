import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { getLead, saveDiscoveryQuestions } from "@/lib/leadRepository";
import { generateDiscoveryQuestions } from "@/lib/aiLeadAnalyzer";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "1";

  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (lead.discoveryQuestions && lead.discoveryQuestions.length > 0 && !forceRegenerate) {
    return NextResponse.json({ questions: lead.discoveryQuestions, cached: true });
  }

  try {
    const { questions, aiGenerated } = await generateDiscoveryQuestions(lead);
    saveDiscoveryQuestions(id, questions);
    return NextResponse.json({ questions, cached: false, aiGenerated });
  } catch (err) {
    console.error("Discovery question generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate discovery questions." },
      { status: 502 },
    );
  }
}
