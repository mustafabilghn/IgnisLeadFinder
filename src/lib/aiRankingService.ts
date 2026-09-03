import type { Lead } from "./types";
import { callAiModel, isTurkeyCountry } from "./aiClient";

/** Max candidates sent to the AI ranking pass in one call — cost control
 * per the spec: build the pool from the deterministic score first, don't
 * send every result found (a search can return up to 60). */
export const AI_RANKING_POOL_SIZE = 30;

export interface RankingCandidate {
  leadId: string;
  name: string;
  category: string;
  location: string;
  detScore: number;
  verifiedSignals: string[];
  inferredSignals: string[];
  keyUnknowns: string[];
}

export interface AiRankingEntry {
  leadId: string;
  reason: string;
}

export function buildRankingCandidate(lead: Lead): RankingCandidate {
  const verified = lead.signals.filter((s) => s.classification === "VERIFIED").map((s) => s.label);
  const inferred = lead.signals.filter((s) => s.classification === "INFERRED").map((s) => s.label);
  const keyUnknowns = lead.signals
    .filter(
      (s) => s.classification === "UNKNOWN" && ["erp_mentioned", "order_volume", "manual_order_entry"].includes(s.key),
    )
    .map((s) => s.label);

  return {
    leadId: lead.id,
    name: lead.name,
    category: lead.category,
    location: [lead.district, lead.city].filter(Boolean).join(", "),
    detScore: lead.score.total,
    verifiedSignals: verified,
    inferredSignals: inferred,
    keyUnknowns,
  };
}

const RANKING_SYSTEM_PROMPT = `You compare REAL B2B companies (evidence collected automatically from Google
Places and their own websites) against Ignis's ideal customer profile, to help
an internal team decide who to contact first for early-stage customer-discovery
interviews about B2B order-handling problems.

Ignis's ideal customer: B2B, manufacturer/distributor, dealer network,
technical products, custom production, custom sizing, configurable products,
complex/project-based orders, formal quotation processes, multiple customer
communication channels (WhatsApp/email/dealer portal), operational
coordination across departments.

Rules — follow strictly:
- Do not invent facts, people, or company characteristics beyond what's given.
- Do not assume a WhatsApp mention means orders are taken via WhatsApp unless a signal says so explicitly.
- Do not claim manual order entry unless evidence supports it.
- Weigh VERIFIED signals more than INFERRED ones; unknowns are not evidence of anything.
- The provided deterministic score is context only — never invent a new score or claim a different number.
- Reply with ONLY the JSON shape requested — no prose, no markdown fences.`;

/**
 * Second-stage, AI-assisted RANKING/interpretation on top of the already-
 * computed deterministic scores — Groq never invents a score, it only
 * orders and explains using the real evidence handed to it. Returns only
 * the candidates Groq actually ranked; the caller appends any it omitted.
 */
export async function generateAiRanking(candidates: RankingCandidate[], country: string): Promise<AiRankingEntry[]> {
  if (candidates.length === 0) return [];

  const lang = isTurkeyCountry(country) ? "tr" : "en";
  const indexed = candidates.map((c, i) => ({ id: i + 1, ...c }));

  const prompt = `Candidates (JSON array, "id" is how you must refer to each one):
${JSON.stringify(indexed, null, 2)}

Task:
1. Rank ALL ${candidates.length} candidates from strongest to weakest match for Ignis's ideal profile, using only the evidence given.
2. Do not invent a new score — "detScore" is provided only as context.
3. For each, in ranked order, write one short grounded sentence in ${
    lang === "tr" ? "Turkish" : "English"
  } explaining why, referencing only the evidence given — no invented facts, no unverified claims (e.g. never state orders are "definitely" entered manually via WhatsApp unless explicitly verified).

Reply with ONLY this JSON, including every candidate exactly once, ordered strongest first, nothing else:
{"ranking": [{"id": <number>, "reason": "<short sentence>"}, ...]}`;

  const raw = await callAiModel(prompt, 3000, RANKING_SYSTEM_PROMPT);
  const parsed = parseRankingResponse(raw, candidates.length);

  return parsed
    .map(({ id, reason }) => {
      const candidate = indexed.find((c) => c.id === id);
      return candidate ? { leadId: candidate.leadId, reason } : null;
    })
    .filter((entry): entry is AiRankingEntry => entry !== null);
}

function parseRankingResponse(raw: string, poolSize: number): { id: number; reason: string }[] {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Groq's ranking response wasn't valid JSON.");
    try {
      json = JSON.parse(match[0]);
    } catch {
      throw new Error("Groq's ranking response wasn't valid JSON.");
    }
  }

  const ranking = (json as { ranking?: unknown }).ranking;
  if (!Array.isArray(ranking)) {
    throw new Error("Groq's ranking response was missing the expected \"ranking\" array.");
  }

  const seen = new Set<number>();
  const entries: { id: number; reason: string }[] = [];
  for (const item of ranking) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { id?: unknown }).id === "number" &&
      typeof (item as { reason?: unknown }).reason === "string"
    ) {
      const id = (item as { id: number }).id;
      const reason = (item as { reason: string }).reason.trim();
      if (id >= 1 && id <= poolSize && reason && !seen.has(id)) {
        seen.add(id);
        entries.push({ id, reason });
      }
    }
  }

  if (entries.length === 0) {
    throw new Error("Groq's ranking response didn't contain any valid, usable entries.");
  }
  return entries;
}
