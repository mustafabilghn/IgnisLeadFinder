import type { Lead, LeadStatus, RelativeLabel } from "./types";
import { PRIORITY_META } from "./scoringEngine";
import { RELATIVE_LABEL_META } from "./relativeRanking";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Yeni",
  contacted: "İletişime Geçildi",
  interested: "İlgileniyor",
  meeting: "Görüşme",
  won: "Kazanıldı",
  lost: "Kaybedildi",
};

const HEADERS = [
  "Firma Adı",
  "Sektör",
  "Adres",
  "Telefon",
  "Web Sitesi",
  "Google Haritalar URL",
  "Puan",
  "Değerlendirme Sayısı",
  "Önemli Sinyaller",
  "Ignis Uygunluk Puanı",
  "Sıra",
  "Göreceli Değerlendirme",
  "Öncelik",
  "Durum",
  "Neden Bu Firma",
];

export function leadsToCsv(leads: (Lead & { rank: number; relativeLabel: RelativeLabel })[]): string {
  const rows = leads.map((lead) => [
    lead.name,
    lead.category,
    lead.address ?? "",
    lead.phone ?? "",
    lead.website ?? "",
    lead.googleMapsUrl ?? "",
    lead.rating != null ? String(lead.rating) : "",
    lead.reviewCount != null ? String(lead.reviewCount) : "",
    lead.score.positiveSignals.join("; "),
    String(lead.score.total),
    String(lead.rank),
    RELATIVE_LABEL_META[lead.relativeLabel].label,
    PRIORITY_META[lead.score.priority].label,
    STATUS_LABELS[lead.status],
    lead.aiRankReason || lead.aiSummary || "",
  ]);

  const lines = [HEADERS, ...rows].map((row) => row.map(csvEscape).join(","));
  return lines.join("\r\n");
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
