import type { Lead } from "./types";
import { buildEvidencePayload, callClaude, languageFor } from "./aiClient";

/** "Why This Lead?" — a short grounded explanation. Falls back to a deterministic
 * template (clearly labeled) when no ANTHROPIC_API_KEY is configured. */
export async function generateLeadSummary(lead: Lead): Promise<{ text: string; aiGenerated: boolean }> {
  const evidence = buildEvidencePayload(lead);
  const lang = languageFor(lead);

  const prompt = `Evidence (JSON):
${JSON.stringify(evidence, null, 2)}

Write a single short paragraph (80-120 words) in ${lang === "tr" ? "Turkish" : "English"} explaining
why "${evidence.name}" may or may not be worth contacting for the customer-discovery interview described
above. Ground every claim in the evidence JSON above. End with one sentence naming what is still unknown
and should be verified directly in conversation. Do not use a greeting or sign-off — just the paragraph.`;

  const result = await callClaude(prompt, 400);
  if (result) return { text: result, aiGenerated: true };

  return { text: templateSummary(evidence), aiGenerated: false };
}

/** 3 customer-discovery questions grounded in what's still unknown about this lead. */
export async function generateDiscoveryQuestions(
  lead: Lead,
): Promise<{ questions: string[]; aiGenerated: boolean }> {
  const evidence = buildEvidencePayload(lead);
  const lang = languageFor(lead);

  const prompt = `Evidence (JSON):
${JSON.stringify(evidence, null, 2)}

Write exactly 3 short, open-ended customer-discovery questions in ${
    lang === "tr" ? "Turkish" : "English"
  } to ask "${evidence.name}" in an early exploratory conversation. The goal is LEARNING about how they
currently receive, check, and process customer/dealer orders — not selling anything. Prefer questions that
probe the specific unknowns listed in the evidence (e.g. ERP usage, manual order entry) rather than generic
ones. Reply with ONLY the 3 questions, one per line, numbered "1.", "2.", "3." — no other text.`;

  const result = await callClaude(prompt, 300);
  if (result) {
    const questions = parseNumberedList(result);
    if (questions.length > 0) return { questions, aiGenerated: true };
  }

  return { questions: templateQuestions(lang), aiGenerated: false };
}

function parseNumberedList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

function templateSummary(evidence: ReturnType<typeof buildEvidencePayload>): string {
  const positives = evidence.verifiedSignals.map((s) => s.label);
  const positivesText = positives.length > 0 ? positives.slice(0, 5).join(", ") : "no strong public signals found";
  const unknownsText = evidence.unknownSignals.length > 0 ? evidence.unknownSignals.join(", ") : "none flagged";

  return (
    `[Template summary — no ANTHROPIC_API_KEY configured, so this is generated from the deterministic score only, not an LLM.] ` +
    `${evidence.name} scored ${evidence.scoreTotal}/100 (${evidence.priorityLabel}). ` +
    `Publicly visible signals: ${positivesText}. Unconfirmed: ${unknownsText}. ` +
    `These should be validated directly in conversation before treating them as fact.`
  );
}

function templateQuestions(lang: "tr" | "en"): string[] {
  if (lang === "tr") {
    return [
      "Siparişleri müşterilerinizden veya bayilerinizden hangi kanallardan alıyorsunuz?",
      "Gelen siparişlerin sisteme aktarılması ve kontrolünde hangi adımlar hâlâ manuel?",
      "Eksik veya yanlış sipariş bilgisi nedeniyle son dönemde düzeltme, gecikme veya yeniden işlem yaşadınız mı?",
    ];
  }
  return [
    "Which channels do your customers or dealers use to place orders with you today?",
    "Which steps in getting an order into your system are still manual?",
    "Have you recently dealt with delays or rework caused by missing or incorrect order information?",
  ];
}
