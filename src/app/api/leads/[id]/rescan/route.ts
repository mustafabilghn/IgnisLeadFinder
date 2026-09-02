import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { rescanLead } from "@/lib/searchPipeline";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { id } = await params;

  try {
    const lead = await rescanLead(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (err) {
    console.error("Rescan failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Rescan failed unexpectedly." },
      { status: 502 },
    );
  }
}
