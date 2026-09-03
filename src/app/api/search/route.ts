import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { searchQuerySchema } from "@/lib/validation";
import { runSearchPipeline } from "@/lib/searchPipeline";
import { providerErrorResponse } from "@/lib/errors";

export async function POST(req: Request) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = searchQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await runSearchPipeline(parsed.data);
    return NextResponse.json({
      searchId: result.search.id,
      provider: result.search.provider,
      leadCount: result.leadIds.length,
      newLeadCount: result.newLeadCount,
    });
  } catch (err) {
    return providerErrorResponse(err, "Search pipeline failed:");
  }
}
