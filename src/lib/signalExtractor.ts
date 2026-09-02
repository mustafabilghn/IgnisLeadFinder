import type { SignalEvidence } from "./types";
import { SIGNAL_DEFINITIONS } from "./signalDefinitions";

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
    ? "Website unreachable — could not be scanned"
    : "No website on file";

  for (const def of SIGNAL_DEFINITIONS) {
    const hit = pages.length > 0 ? findFirstMatch(pages, def.phrases) : null;

    if (hit) {
      verifiedKeys.add(def.key);
      evidence.push({
        key: def.key,
        label: def.label,
        classification: "VERIFIED",
        value: "Found on website",
        source: `Website: ${hit.url}`,
        evidenceSnippet: hit.snippet,
        timestamp: now,
      });
    } else {
      evidence.push({
        key: def.key,
        label: def.label,
        classification: "UNKNOWN",
        value: "Not found on scanned pages",
        source: pages.length > 0 ? "Website scan (not mentioned)" : unreachableSource,
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
      label: "Complex order process",
      classification: "INFERRED",
      value: "Likely",
      source: "Derived from verified signals",
      evidenceSnippet: `Based on: ${complexOrderDrivers.join(", ")}`,
      timestamp: now,
    });
  } else {
    evidence.push({
      key: "complex_order_process",
      label: "Complex order process",
      classification: "UNKNOWN",
      value: "Not enough evidence",
      source: "Derived from verified signals",
      timestamp: now,
    });
  }

  const manualHandlingHints = ["whatsapp_orders", "online_order", "quotation_process"].filter((k) =>
    verifiedKeys.has(k),
  );
  if (manualHandlingHints.length > 0 && !verifiedKeys.has("erp_mentioned")) {
    evidence.push({
      key: "manual_order_handling_possible",
      label: "Possible manual order handling",
      classification: "INFERRED",
      value: "Possible signal",
      source: "Derived from verified signals",
      evidenceSnippet: `Order channel(s) found (${manualHandlingHints.join(
        ", ",
      )}) with no public mention of ERP/business software — should be verified directly.`,
      timestamp: now,
    });
  }

  // Always-present placeholders for things a public website can never confirm.
  evidence.push({
    key: "order_volume",
    label: "Actual order volume",
    classification: "UNKNOWN",
    value: "Not publicly determinable",
    source: "N/A",
    timestamp: now,
  });
  evidence.push({
    key: "manual_order_entry",
    label: "Manual order entry process",
    classification: "UNKNOWN",
    value: "Requires direct conversation to confirm",
    source: "N/A",
    timestamp: now,
  });

  return evidence;
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
