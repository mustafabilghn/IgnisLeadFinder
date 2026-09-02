import Anthropic from "@anthropic-ai/sdk";
import type { Lead } from "./types";

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export const GROUNDING_SYSTEM_PROMPT = `You are helping an internal team at a company called Ignis evaluate whether a
business is worth contacting for early-stage customer-discovery interviews about
B2B order-handling problems (missing/conflicting order info, manual order entry,
disconnected communication channels).

You will be given STRUCTURED EVIDENCE collected automatically from the company's
public Google listing and website. Follow these rules strictly:
- Do not invent facts. Only use what is in the evidence provided.
- Do not invent owner names, employee names, or any personal names.
- Do not claim that manual research, phone calls, visits, or human review were performed. You only saw the structured evidence given to you.
- Clearly distinguish confirmed/verified evidence from inference or unknowns. Use hedged language ("appears to", "publicly indicates") for anything not explicitly VERIFIED.
- Never state or imply order volume, transaction counts, revenue, or headcount — these are never observed.
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

export async function callClaude(userPrompt: string, maxTokens: number): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system: GROUNDING_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text.trim() : null;
}
