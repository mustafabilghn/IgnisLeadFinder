import type { Lead, SearchQuery, SearchRecord } from "./types";
import { getBusinessDiscoveryProvider } from "./providers/businessDiscovery";
import { findMockSeedById, pageToHtml, regenerateProceduralHtml } from "./providers/businessDiscovery/mockData";
import { analyzeWebsite } from "./websiteAnalyzer";
import { extractSignals } from "./signalExtractor";
import { computeScore } from "./scoringEngine";
import {
  createLeadStub,
  createSearch,
  findLeadByProviderId,
  getLead,
  saveAnalysis,
  updateDiscoveryFields,
  updateSearchResultCount,
} from "./leadRepository";

const ANALYSIS_CONCURRENCY = 5;

export interface PipelineResult {
  search: SearchRecord;
  leadIds: string[];
  newLeadCount: number;
}

/**
 * The end-to-end flow: discover businesses -> upsert leads -> analyze
 * (website + signals + score) only for genuinely new leads. Re-discovered
 * leads just get their raw discovery fields refreshed — no repeat website
 * fetches or LLM calls, per the cost-control requirement in the spec.
 */
export async function runSearchPipeline(query: SearchQuery): Promise<PipelineResult> {
  const provider = getBusinessDiscoveryProvider();
  const search = createSearch(query, provider.source);
  const businesses = await provider.discover(query);

  const leadIds: string[] = [];
  const newLeadIds: string[] = [];

  for (const business of businesses) {
    const existing = findLeadByProviderId(business.source, business.providerId);
    if (existing) {
      updateDiscoveryFields(existing.id, business, search.id);
      leadIds.push(existing.id);
    } else {
      const stub = createLeadStub(business, search.id);
      leadIds.push(stub.id);
      newLeadIds.push(stub.id);
    }
  }

  // Analyze new leads (bounded concurrency), matching each stub back to its source business.
  const newLeadToBusiness = new Map<string, (typeof businesses)[number]>();
  businesses.forEach((business, idx) => {
    const leadId = leadIds[idx];
    if (newLeadIds.includes(leadId)) newLeadToBusiness.set(leadId, business);
  });

  await mapWithConcurrency(newLeadIds, ANALYSIS_CONCURRENCY, async (leadId) => {
    const business = newLeadToBusiness.get(leadId);
    if (!business) return;
    await analyzeAndScoreLead(leadId, {
      website: business.website,
      mockHtml: business.mockHtml,
      mockPages: business.mockPages,
    });
  });

  updateSearchResultCount(search.id, leadIds.length);
  return { search, leadIds, newLeadCount: newLeadIds.length };
}

export async function analyzeAndScoreLead(
  leadId: string,
  input: { website: string | null; mockHtml?: string; mockPages?: { url: string; html: string }[] },
): Promise<void> {
  const analyzed = await analyzeWebsite(input);
  const signals = extractSignals(analyzed.pages, {
    websiteUnreachable: !!input.website && !analyzed.scan.reachable,
  });
  const score = computeScore(signals);
  saveAnalysis(leadId, { websiteScan: analyzed.scan, signals, score });
}

/** Re-runs website analysis + scoring for one existing lead (the "Rescan" action). */
export async function rescanLead(leadId: string): Promise<Lead | null> {
  const lead = getLead(leadId);
  if (!lead) return null;

  const mockContent = getMockContentForLead(lead);
  await analyzeAndScoreLead(leadId, { website: lead.website, ...mockContent });
  return getLead(leadId);
}

function getMockContentForLead(
  lead: Lead,
): { mockHtml?: string; mockPages?: { url: string; html: string }[] } {
  if (lead.source !== "mock" || !lead.website) return {};

  const seed = findMockSeedById(lead.providerId);
  if (seed) {
    return {
      mockHtml: seed.homepage ? pageToHtml(seed.homepage) : undefined,
      mockPages: seed.extraPage
        ? [{ url: `${lead.website}${seed.extraPage.path}`, html: pageToHtml(seed.extraPage) }]
        : undefined,
    };
  }

  if (lead.website.endsWith(".invalid")) return {}; // reproduce the same unreachable outcome

  return { mockHtml: regenerateProceduralHtml(lead.providerId, lead.name, lead.category) };
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}
