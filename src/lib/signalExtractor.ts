import type { SignalEvidence } from "./types";
import { SIGNAL_DEFINITIONS, type SignalDefinition } from "./signalDefinitions";

const SNIPPET_RADIUS = 60;

/**
 * Turns raw extracted page text into the evidence log: one entry per known
 * signal, always classified as VERIFIED (found) or UNKNOWN (not found) —
 * never invented. A couple of higher-order INFERRED signals are layered on
 * top when a combination of VERIFIED signals reasonably implies them.
 */
export function extractSignals(
  pages: { url: string; text: string }[],
  opts: { websiteUnreachable: boolean },
): SignalEvidence[] {
  const now = new Date().toISOString();
  const evidence: SignalEvidence[] = [];
  const verifiedKeys = new Set<string>();

  const unreachableSource = opts.websiteUnreachable
    ? "Web sitesine ulaşılamadı — taranamadı"
    : "Kayıtlı web sitesi yok";

  for (const def of SIGNAL_DEFINITIONS) {
    let hit = pages.length > 0 ? findFirstMatch(pages, def.phrases) : null;
    if (!hit && def.proximity && pages.length > 0) {
      hit = findProximityMatch(pages, def.proximity);
    }

    if (hit) {
      verifiedKeys.add(def.key);
      evidence.push({
        key: def.key,
        label: def.label,
        classification: "VERIFIED",
        value: "Web sitesinde bulundu",
        source: `Web Sitesi: ${hit.url}`,
        evidenceSnippet: hit.snippet,
        timestamp: now,
      });
    } else {
      evidence.push({
        key: def.key,
        label: def.label,
        classification: "UNKNOWN",
        value: "Taranan sayfalarda bulunamadı",
        source: pages.length > 0 ? "Web sitesi taraması (belirtilmemiş)" : unreachableSource,
        timestamp: now,
      });
    }
  }

  // Higher-order inferred conclusions, built only from what was actually verified above.
  const complexOrderDrivers = ["custom_production", "configurable_products", "project_based"].filter(
    (k) => verifiedKeys.has(k),
  );
  if (complexOrderDrivers.length > 0) {
    evidence.push({
      key: "complex_order_process",
      label: "Karmaşık sipariş süreci",
      classification: "INFERRED",
      value: "Muhtemel",
      source: "Doğrulanmış sinyallerden türetildi",
      evidenceSnippet: `Şuna dayanıyor: ${complexOrderDrivers.join(", ")}`,
      timestamp: now,
    });
  } else {
    evidence.push({
      key: "complex_order_process",
      label: "Karmaşık sipariş süreci",
      classification: "UNKNOWN",
      value: "Yeterli kanıt yok",
      source: "Doğrulanmış sinyallerden türetildi",
      timestamp: now,
    });
  }

  const manualHandlingHints = ["whatsapp_orders", "online_order", "quotation_process"].filter((k) =>
    verifiedKeys.has(k),
  );
  if (manualHandlingHints.length > 0 && !verifiedKeys.has("erp_mentioned")) {
    evidence.push({
      key: "manual_order_handling_possible",
      label: "Olası manuel sipariş işleme",
      classification: "INFERRED",
      value: "Olası sinyal",
      source: "Doğrulanmış sinyallerden türetildi",
      evidenceSnippet: `Sipariş kanalı/kanalları bulundu (${manualHandlingHints.join(
        ", ",
      )}) ancak kamuya açık ERP/işletme yazılımı bilgisi yok — doğrudan doğrulanmalı.`,
      timestamp: now,
    });
  }

  // Always-present placeholders for things a public website can never confirm.
  evidence.push({
    key: "order_volume",
    label: "Gerçek sipariş hacmi",
    classification: "UNKNOWN",
    value: "Kamuya açık olarak belirlenemez",
    source: "N/A",
    timestamp: now,
  });
  evidence.push({
    key: "manual_order_entry",
    label: "Manuel sipariş giriş süreci",
    classification: "UNKNOWN",
    value: "Doğrudan görüşmeyle doğrulanmalı",
    source: "N/A",
    timestamp: now,
  });

  return evidence;
}

/**
 * Fallback for `def.proximity`: matches when `anchor` appears within
 * `radius` characters of any `contextWords` entry, even though no single
 * fixed phrase matched. See SignalDefinition.proximity for why this exists.
 */
function findProximityMatch(
  pages: { url: string; text: string }[],
  proximity: NonNullable<SignalDefinition["proximity"]>,
): { url: string; snippet: string } | null {
  const { anchor, contextWords, radius } = proximity;

  for (const page of pages) {
    const haystack = page.text.toLowerCase();
    let searchFrom = 0;
    let anchorIdx: number;
    while ((anchorIdx = haystack.indexOf(anchor, searchFrom)) !== -1) {
      const windowStart = Math.max(0, anchorIdx - radius);
      const windowEnd = Math.min(haystack.length, anchorIdx + anchor.length + radius);
      const window = haystack.slice(windowStart, windowEnd);

      if (contextWords.some((w) => window.includes(w))) {
        const start = Math.max(0, anchorIdx - SNIPPET_RADIUS);
        const end = Math.min(page.text.length, anchorIdx + anchor.length + SNIPPET_RADIUS);
        const snippet = `${start > 0 ? "…" : ""}${page.text.slice(start, end).trim()}${
          end < page.text.length ? "…" : ""
        }`;
        return { url: page.url, snippet };
      }
      searchFrom = anchorIdx + anchor.length;
    }
  }
  return null;
}

function findFirstMatch(
  pages: { url: string; text: string }[],
  phrases: string[],
): { url: string; snippet: string } | null {
  for (const page of pages) {
    const haystack = page.text.toLowerCase();
    for (const phrase of phrases) {
      const idx = haystack.indexOf(phrase.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - SNIPPET_RADIUS);
        const end = Math.min(page.text.length, idx + phrase.length + SNIPPET_RADIUS);
        const snippet = `${start > 0 ? "…" : ""}${page.text.slice(start, end).trim()}${
          end < page.text.length ? "…" : ""
        }`;
        return { url: page.url, snippet };
      }
    }
  }
  return null;
}
