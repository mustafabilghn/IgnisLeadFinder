import { NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/apiAuth";
import { getSearch, listLeadsForRanking, saveAiRanking } from "@/lib/leadRepository";
import { AI_RANKING_POOL_SIZE, buildRankingCandidate, generateAiRanking } from "@/lib/aiRankingService";
import { providerErrorResponse } from "@/lib/errors";

/**
 * Second-stage AI ranking for one search's results — deterministic scoring
 * already happened during /api/search; this only reorders/explains the top
 * candidates using Groq, on top of scores that never change here. Cached on
 * the search record (ai_ranking_generated_at) so revisiting the results
 * page or changing filters never re-calls Groq; pass ?regenerate=1 to force
 * a fresh pass.
 */
export async function POST(req: Request, { params }: { params: Promise<{ searchId: string }> }) {
  const authError = checkApiAuth(req);
  if (authError) return authError;

  const { searchId } = await params;
  const url = new URL(req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "1";

  const search = getSearch(searchId);
  if (!search) return NextResponse.json({ error: "Arama bulunamadı" }, { status: 404 });

  if (search.aiRankingGeneratedAt && !forceRegenerate) {
    return NextResponse.json({ generatedAt: search.aiRankingGeneratedAt, cached: true });
  }

  const allLeads = listLeadsForRanking(searchId);
  if (allLeads.length === 0) {
    return NextResponse.json({ generatedAt: null, cached: false, rankedCount: 0 });
  }

  const pool = allLeads.slice(0, AI_RANKING_POOL_SIZE);

  try {
    const candidates = pool.map(buildRankingCandidate);
    const ranked = await generateAiRanking(candidates, search.country);

    // Safety net: any candidate Groq didn't mention keeps its deterministic-score position, appended after the ones it did rank.
    const rankedIds = new Set(ranked.map((r) => r.leadId));
    const omitted = pool.filter((lead) => !rankedIds.has(lead.id)).map((lead) => ({ leadId: lead.id, reason: "" }));

    saveAiRanking(searchId, [...ranked, ...omitted]);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      cached: false,
      rankedCount: ranked.length,
      poolSize: pool.length,
    });
  } catch (err) {
    return providerErrorResponse(err, "AI ranking failed:");
  }
}
