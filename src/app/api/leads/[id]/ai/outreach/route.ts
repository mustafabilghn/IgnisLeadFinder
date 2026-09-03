import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { getLead, saveOutreachMessage } from "@/lib/leadRepository";
import { generateOutreachMessage } from "@/lib/outreachGenerator";
import { providerErrorResponse } from "@/lib/errors";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "1";

  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });

  if (lead.outreachMessage && !forceRegenerate) {
    return NextResponse.json({ message: lead.outreachMessage, cached: true });
  }

  try {
    const text = await generateOutreachMessage(lead);
    saveOutreachMessage(id, text);
    return NextResponse.json({ message: text, cached: false });
  } catch (err) {
    return providerErrorResponse(err, "Outreach generation failed:");
  }
}
