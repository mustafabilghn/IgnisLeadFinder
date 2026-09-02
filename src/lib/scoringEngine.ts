import type { Priority, ScoreBreakdown, ScoreCategoryBreakdown, SignalEvidence } from "./types";

// Deterministic, transparent, rules-based scoring — NO LLM involved.
// Category maxes intentionally sum to exactly 100 (20 + 25 + 20 + 15 + 20).
// Some signals (e.g. dealer_network) legitimately contribute to more than one
// category, mirroring how the spec itself lists that signal under both
// "B2B fit" and "Operational complexity".

interface Rule {
  signalKey: string;
  points: number;
  label: string;
}

const B2B_RULES: Rule[] = [
  { signalKey: "b2b_explicit", points: 6, label: "B2B explicitly stated" },
  { signalKey: "wholesale", points: 4, label: "Wholesale selling" },
  { signalKey: "distributor", points: 4, label: "Distributor" },
  { signalKey: "dealer_network", points: 4, label: "Dealer network" },
  { signalKey: "corporate_customers", points: 2, label: "Corporate customer focus" },
];
const B2B_MAX = 20;

const ORDER_COMPLEXITY_RULES: Rule[] = [
  { signalKey: "technical_specs", points: 6, label: "Technical specifications published" },
  { signalKey: "custom_production", points: 6, label: "Custom-sized / custom production" },
  { signalKey: "configurable_products", points: 5, label: "Configurable products" },
  { signalKey: "project_based", points: 5, label: "Project-based work" },
  { signalKey: "large_catalog_hint", points: 3, label: "Product catalog published" },
];
const ORDER_COMPLEXITY_MAX = 25;

const OPERATIONAL_RULES: Rule[] = [
  { signalKey: "dealer_network", points: 5, label: "Dealer network (operational reach)" },
  { signalKey: "multiple_locations", points: 4, label: "Multiple locations" },
  { signalKey: "sales_support", points: 3, label: "Dedicated sales support" },
  { signalKey: "production_coordination", points: 3, label: "Production coordination" },
  { signalKey: "quotation_process", points: 3, label: "Formal quotation process" },
  { signalKey: "large_catalog_hint", points: 2, label: "Product catalog (operational breadth)" },
];
const OPERATIONAL_MAX = 20;

const CHANNEL_RULES: Rule[] = [
  { signalKey: "dealer_portal", points: 4, label: "Dealer portal" },
  { signalKey: "online_order", points: 3, label: "Online ordering" },
  { signalKey: "quotation_process", points: 2, label: "Quote-request channel" },
];
const CHANNEL_MAX = 15;

const AUTOMATION_RULES: Rule[] = [
  { signalKey: "erp_mentioned", points: 6, label: "Existing ERP/business software (integration target)" },
  {
    signalKey: "manual_order_handling_possible",
    points: 6,
    label: "Unstructured order channel(s) with no confirmed backend system",
  },
  { signalKey: "sales_support", points: 2, label: "Sales support coordination overhead" },
  { signalKey: "production_coordination", points: 2, label: "Production coordination overhead" },
  { signalKey: "complex_order_process", points: 4, label: "Complex/custom orders raise error & rework risk" },
];
const AUTOMATION_MAX = 20;

const HEADLINE_UNKNOWN_KEYS = ["erp_mentioned", "order_volume", "manual_order_entry"];

export function computeScore(signals: SignalEvidence[]): ScoreBreakdown {
  const isPositive = (key: string) => {
    const s = signals.find((x) => x.key === key);
    return !!s && (s.classification === "VERIFIED" || s.classification === "INFERRED");
  };

  const b2b = scoreCategory(signals, "b2b", "B2B / Commercial Fit", B2B_RULES, B2B_MAX, isPositive);
  const orderComplexity = scoreCategory(
    signals,
    "orderComplexity",
    "Order Complexity",
    ORDER_COMPLEXITY_RULES,
    ORDER_COMPLEXITY_MAX,
    isPositive,
  );
  const operational = scoreCategory(
    signals,
    "operational",
    "Operational / Order Complexity",
    OPERATIONAL_RULES,
    OPERATIONAL_MAX,
    isPositive,
  );
  const channel = scoreChannel(isPositive);
  const automation = scoreCategory(
    signals,
    "automation",
    "Automation Opportunity",
    AUTOMATION_RULES,
    AUTOMATION_MAX,
    isPositive,
  );

  const categories = [b2b, orderComplexity, operational, channel, automation];
  const total = Math.min(
    100,
    categories.reduce((sum, c) => sum + c.score, 0),
  );

  const positiveSignals = signals
    .filter((s) => s.classification === "VERIFIED" || s.classification === "INFERRED")
    .map((s) => s.label);

  const unknownSignals = signals
    .filter((s) => HEADLINE_UNKNOWN_KEYS.includes(s.key) && s.classification === "UNKNOWN")
    .map((s) => s.label);

  return {
    total,
    priority: priorityFor(total),
    categories,
    positiveSignals,
    unknownSignals,
  };
}

function scoreCategory(
  signals: SignalEvidence[],
  category: ScoreCategoryBreakdown["category"],
  label: string,
  rules: Rule[],
  max: number,
  isPositive: (key: string) => boolean,
): ScoreCategoryBreakdown {
  let score = 0;
  const reasons: string[] = [];
  for (const rule of rules) {
    if (isPositive(rule.signalKey)) {
      score += rule.points;
      reasons.push(rule.label);
    }
  }
  return { category, label, score: Math.min(score, max), max, reasons };
}

function scoreChannel(isPositive: (key: string) => boolean): ScoreCategoryBreakdown {
  let score = 0;
  const reasons: string[] = [];

  if (isPositive("whatsapp_orders")) {
    score += 5;
    reasons.push("Orders explicitly taken via WhatsApp");
  } else if (isPositive("whatsapp_present")) {
    score += 2;
    reasons.push("WhatsApp channel available (not confirmed for orders)");
  }

  for (const rule of CHANNEL_RULES) {
    if (isPositive(rule.signalKey)) {
      score += rule.points;
      reasons.push(rule.label);
    }
  }

  return {
    category: "channel",
    label: "Channel Complexity",
    score: Math.min(score, CHANNEL_MAX),
    max: CHANNEL_MAX,
    reasons,
  };
}

function priorityFor(total: number): Priority {
  if (total >= 80) return "very_high";
  if (total >= 65) return "high";
  if (total >= 45) return "medium";
  return "low";
}

export const PRIORITY_META: Record<Priority, { label: string; emoji: string; range: string }> = {
  very_high: { label: "Very High", emoji: "🔥", range: "80–100" },
  high: { label: "High", emoji: "🟠", range: "65–79" },
  medium: { label: "Medium", emoji: "🟡", range: "45–64" },
  low: { label: "Low", emoji: "⚪", range: "0–44" },
};
