import type { Priority, ScoreBreakdown, ScoreCategoryBreakdown, SignalEvidence } from "./types";

// Deterministic, transparent, rules-based scoring — NO LLM involved.
// Category maxes intentionally sum to exactly 100 (20 + 25 + 20 + 15 + 20).
// Some signals (e.g. dealer_network) legitimately contribute to more than one
// category, mirroring how the spec itself lists that signal under both
// "B2B fit" and "Operational complexity".
//
// Only the display label strings below are in Turkish (UI text) — signal
// keys, point values, and category maxes are unchanged from the original
// scoring design.

interface Rule {
  signalKey: string;
  points: number;
  label: string;
}

const B2B_RULES: Rule[] = [
  { signalKey: "b2b_explicit", points: 6, label: "B2B açıkça belirtilmiş" },
  { signalKey: "wholesale", points: 4, label: "Toptan satış" },
  { signalKey: "distributor", points: 4, label: "Distribütör" },
  { signalKey: "dealer_network", points: 4, label: "Bayi ağı" },
  { signalKey: "corporate_customers", points: 2, label: "Kurumsal müşteri odağı" },
];
const B2B_MAX = 20;

const ORDER_COMPLEXITY_RULES: Rule[] = [
  { signalKey: "technical_specs", points: 6, label: "Teknik özellikler yayınlanmış" },
  { signalKey: "custom_production", points: 6, label: "Özel ölçü / özel üretim" },
  { signalKey: "configurable_products", points: 5, label: "Konfigüre edilebilir ürünler" },
  { signalKey: "project_based", points: 5, label: "Proje bazlı çalışma" },
  { signalKey: "large_catalog_hint", points: 3, label: "Ürün kataloğu yayınlanmış" },
];
const ORDER_COMPLEXITY_MAX = 25;

const OPERATIONAL_RULES: Rule[] = [
  { signalKey: "dealer_network", points: 5, label: "Bayi ağı (operasyonel kapsam)" },
  { signalKey: "multiple_locations", points: 4, label: "Birden fazla lokasyon" },
  { signalKey: "sales_support", points: 3, label: "Özel satış desteği" },
  { signalKey: "production_coordination", points: 3, label: "Üretim koordinasyonu" },
  { signalKey: "quotation_process", points: 3, label: "Resmi teklif süreci" },
  { signalKey: "large_catalog_hint", points: 2, label: "Ürün kataloğu (operasyonel kapsam)" },
];
const OPERATIONAL_MAX = 20;

const CHANNEL_RULES: Rule[] = [
  { signalKey: "dealer_portal", points: 4, label: "Bayi portalı" },
  { signalKey: "online_order", points: 3, label: "Online sipariş" },
  { signalKey: "quotation_process", points: 2, label: "Teklif talebi kanalı" },
];
const CHANNEL_MAX = 15;

const AUTOMATION_RULES: Rule[] = [
  { signalKey: "erp_mentioned", points: 6, label: "Mevcut ERP/işletme yazılımı (entegrasyon hedefi)" },
  {
    signalKey: "manual_order_handling_possible",
    points: 6,
    label: "Doğrulanmış bir arka uç sistemi olmadan yapılandırılmamış sipariş kanalı",
  },
  { signalKey: "sales_support", points: 2, label: "Satış desteği koordinasyon yükü" },
  { signalKey: "production_coordination", points: 2, label: "Üretim koordinasyon yükü" },
  { signalKey: "complex_order_process", points: 4, label: "Karmaşık/özel siparişler hata ve yeniden işlem riskini artırır" },
];
const AUTOMATION_MAX = 20;

const HEADLINE_UNKNOWN_KEYS = ["erp_mentioned", "order_volume", "manual_order_entry"];

export function computeScore(signals: SignalEvidence[]): ScoreBreakdown {
  const isPositive = (key: string) => {
    const s = signals.find((x) => x.key === key);
    return !!s && (s.classification === "VERIFIED" || s.classification === "INFERRED");
  };

  const b2b = scoreCategory(signals, "b2b", "B2B / Ticari Uyum", B2B_RULES, B2B_MAX, isPositive);
  const orderComplexity = scoreCategory(
    signals,
    "orderComplexity",
    "Sipariş Karmaşıklığı",
    ORDER_COMPLEXITY_RULES,
    ORDER_COMPLEXITY_MAX,
    isPositive,
  );
  const operational = scoreCategory(
    signals,
    "operational",
    "Operasyonel / Sipariş Karmaşıklığı",
    OPERATIONAL_RULES,
    OPERATIONAL_MAX,
    isPositive,
  );
  const channel = scoreChannel(isPositive);
  const automation = scoreCategory(
    signals,
    "automation",
    "Otomasyon Fırsatı",
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
    reasons.push("Siparişler açıkça WhatsApp üzerinden alınıyor");
  } else if (isPositive("whatsapp_present")) {
    score += 2;
    reasons.push("WhatsApp kanalı mevcut (sipariş için doğrulanmadı)");
  }

  for (const rule of CHANNEL_RULES) {
    if (isPositive(rule.signalKey)) {
      score += rule.points;
      reasons.push(rule.label);
    }
  }

  return {
    category: "channel",
    label: "İletişim Kanalları",
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
  very_high: { label: "Çok Yüksek", emoji: "🔥", range: "80–100" },
  high: { label: "Yüksek", emoji: "🟠", range: "65–79" },
  medium: { label: "Orta", emoji: "🟡", range: "45–64" },
  low: { label: "Düşük", emoji: "⚪", range: "0–44" },
};
