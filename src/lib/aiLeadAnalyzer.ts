import type { Lead } from "./types";
import { buildEvidencePayload, callAiModel, languageFor } from "./aiClient";

/** "Why This Lead?" — a short grounded explanation. Requires GROQ_API_KEY;
 * callAiModel throws NotConfiguredError otherwise (no fake/template text). */
export async function generateLeadSummary(lead: Lead): Promise<string> {
  const evidence = buildEvidencePayload(lead);
  const lang = languageFor(lead);

  const prompt = `Evidence (JSON):
${JSON.stringify(evidence, null, 2)}

Write a single short paragraph (80-120 words) in ${lang === "tr" ? "Turkish" : "English"} explaining
why "${evidence.name}" may or may not be worth contacting for the customer-discovery interview described
above. Ground every claim in the evidence JSON above. End with one sentence naming what is still unknown
and should be verified directly in conversation. Do not use a greeting or sign-off — just the paragraph.`;

  return callAiModel(prompt, 400);
}

/** 3 customer-discovery questions grounded in what's still unknown about this lead. */
export async function generateDiscoveryQuestions(lead: Lead): Promise<string[]> {
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

  const result = await callAiModel(prompt, 300);
  const questions = parseNumberedList(result);
  if (questions.length === 0) {
    throw new Error("Groq returned a response that couldn't be parsed into discovery questions.");
  }
  return questions;
}

function parseNumberedList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}
