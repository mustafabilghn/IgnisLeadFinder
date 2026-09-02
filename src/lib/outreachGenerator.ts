import type { Lead } from "./types";
import { buildEvidencePayload, callClaude, languageFor } from "./aiClient";

/** One short, research-oriented personalized outreach message. Never sales-y,
 * never fabricates facts or names. Falls back to a generic template without an API key. */
export async function generateOutreachMessage(lead: Lead): Promise<{ text: string; aiGenerated: boolean }> {
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

  const result = await callClaude(prompt, 300);
  if (result) return { text: result, aiGenerated: true };

  return { text: templateMessage(evidence, lang), aiGenerated: false };
}

function templateMessage(evidence: ReturnType<typeof buildEvidencePayload>, lang: "tr" | "en"): string {
  if (lang === "tr") {
    return (
      `[Şablon mesaj — ANTHROPIC_API_KEY tanımlı değil.] Merhaba, ${evidence.name} şirketinizin B2B/bayi tarafındaki ` +
      `çalışma yapısı dikkatimi çekti. B2B sipariş süreçlerinin nasıl yürütüldüğü üzerine bir müşteri araştırması ` +
      `yapıyorum. Özellikle siparişlerin alınması, kontrol edilmesi ve sisteme aktarılması sırasında şirketlerin hangi ` +
      `işleri hâlâ manuel yaptığını anlamaya çalışıyorum. Bu konuda birkaç dakikalık görüşünüzü paylaşabilir misiniz?`
    );
  }
  return (
    `[Template message — ANTHROPIC_API_KEY not configured.] Hello, I noticed ${evidence.name}'s B2B/dealer-facing ` +
    `setup and I'm researching how companies currently handle B2B order processes — specifically which steps in ` +
    `receiving, checking, and entering customer/dealer orders are still manual. Would you be open to sharing a few ` +
    `minutes on this?`
  );
}
