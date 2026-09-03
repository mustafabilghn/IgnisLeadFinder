import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { leadPatchSchema } from "@/lib/validation";
import { getLead, updateLeadStatus } from "@/lib/leadRepository";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const parsed = leadPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz güncelleme", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = updateLeadStatus(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });
  return NextResponse.json({ lead: updated });
}
