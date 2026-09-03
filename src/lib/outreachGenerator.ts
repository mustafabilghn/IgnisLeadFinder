import type { Lead } from "./types";
import { buildEvidencePayload, callAiModel, languageFor } from "./aiClient";

/** One short, research-oriented personalized outreach message. Never sales-y,
 * never fabricates facts or names. Requires GROQ_API_KEY. */
export async function generateOutreachMessage(lead: Lead): Promise<string> {
  const evidence = buildEvidencePayload(lead);
  const lang = languageFor(lead);

  const prompt = `Evidence (JSON):
${JSON.stringify(evidence, null, 2)}

Write one short outreach message (60-100 words) in ${
    lang === "tr" ? "Turkish" : "English"
  } to "${evidence.name}", inviting them to a brief customer-discovery conversation about how their
company currently receives, checks, and processes customer/dealer orders. Requirements:
- Research-oriented, curious tone — NOT a sales pitch, no product name, no "we can help you" claims.
- Reference at most one or two concrete public signals from the evidence (e.g. their B2B/dealer setup) if present — do not list all signals.
- Never invent a person's name or greeting beyond "Merhaba"/"Hello" — address the company, not an individual.
- Never claim you researched them manually, visited, or called.
- End with a soft ask for a few minutes of their time.
Reply with ONLY the message text.`;

  return callAiModel(prompt, 300);
}
