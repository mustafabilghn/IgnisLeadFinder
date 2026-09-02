import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { getLead, saveOutreachMessage } from "@/lib/leadRepository";
import { generateOutreachMessage } from "@/lib/outreachGenerator";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "1";

  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (lead.outreachMessage && !forceRegenerate) {
    return NextResponse.json({ message: lead.outreachMessage, cached: true });
  }

  try {
    const { text, aiGenerated } = await generateOutreachMessage(lead);
    saveOutreachMessage(id, text);
    return NextResponse.json({ message: text, cached: false, aiGenerated });
  } catch (err) {
    console.error("Outreach generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate outreach message." },
      { status: 502 },
    );
  }
}
