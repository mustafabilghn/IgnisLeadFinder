import Groq from "groq-sdk";
import type { Lead } from "./types";
import { GROQ_NOT_CONFIGURED_MESSAGE } from "./config";
import { NotConfiguredError } from "./errors";

// Production, general-purpose, reasoning-capable model — verified current on
// Groq's docs (console.groq.com/docs/models) as of this integration. Groq's
// Qwen offerings are preview/evaluation-only right now, so this is the
// "similar general-purpose model" the spec allows in that case.
export const AI_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new NotConfiguredError(GROQ_NOT_CONFIGURED_MESSAGE);
  return new Groq({ apiKey });
}

export const GROUNDING_SYSTEM_PROMPT = `You are helping an internal team at a company called Ignis evaluate whether a
business is worth contacting for early-stage customer-discovery interviews about
B2B order-handling problems (missing/conflicting order info, manual order entry,
disconnected communication channels).

You will be given STRUCTURED EVIDENCE collected automatically from the company's
public Google listing and website. Follow these rules strictly:
- Do not invent facts. Only use what is in the evidence provided.
- Do not invent people — no owner names, employee names, or any personal names.
- Do not invent company characteristics that aren't in the evidence.
- Do not claim that manual research, phone calls, visits, or human review were performed. You only saw the structured evidence given to you.
- Do not assume that a WhatsApp icon or link means orders are actually taken via WhatsApp — only claim that if a signal explicitly verifies it.
- Do not claim manual order entry exists unless the evidence actually supports it — otherwise call it unknown.
- Clearly distinguish verified information from inference. Use hedged language ("appears to", "publicly indicates") for anything not explicitly VERIFIED.
- Use only the provided business data and evidence — never state or imply order volume, transaction counts, revenue, or headcount, which are never observed.
- If the evidence is thin, say so plainly instead of padding with generic filler.
- Keep the tone plain, professional, and non-salesy.`;

export interface EvidencePayload {
  name: string;
  category: string;
  location: string;
  scoreTotal: number;
  priorityLabel: string;
  verifiedSignals: { label: string; snippet?: string }[];
  inferredSignals: { label: string; reason?: string }[];
  unknownSignals: string[];
  websiteReachable: boolean;
}

export function buildEvidencePayload(lead: Lead): EvidencePayload {
  const verified = lead.signals.filter((s) => s.classification === "VERIFIED");
  const inferred = lead.signals.filter((s) => s.classification === "INFERRED");
  const unknown = lead.signals.filter(
    (s) => s.classification === "UNKNOWN" && ["erp_mentioned", "order_volume", "manual_order_entry"].includes(s.key),
  );

  return {
    name: lead.name,
    category: lead.category,
    location: [lead.district, lead.city, lead.country].filter(Boolean).join(", "),
    scoreTotal: lead.score.total,
    priorityLabel: lead.score.priority,
    verifiedSignals: verified.map((s) => ({ label: s.label, snippet: s.evidenceSnippet })),
    inferredSignals: inferred.map((s) => ({ label: s.label, reason: s.evidenceSnippet })),
    unknownSignals: unknown.map((s) => s.label),
    websiteReachable: lead.websiteScan?.reachable ?? false,
  };
}

export function languageFor(lead: Lead): "tr" | "en" {
  return (lead.country || "").toLowerCase().includes("turk") ? "tr" : "en";
}

/**
 * Sole entry point into the AI provider — everything else in the app only
 * calls this, never the Groq SDK directly, so the provider can be swapped
 * again later by editing this one file. Throws NotConfiguredError if
 * GROQ_API_KEY is unset; callers must not catch that into a fake response.
 */
export async function callAiModel(userPrompt: string, maxTokens: number): Promise<string> {
  const client = getGroqClient();

  const response = await client.chat.completions.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: GROUNDING_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error("Groq returned an empty or malformed response.");
  }
  return text;
}
