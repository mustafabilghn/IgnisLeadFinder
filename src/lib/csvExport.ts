import type { Lead } from "./types";
import { PRIORITY_META } from "./scoringEngine";

const HEADERS = [
  "Business Name",
  "Category",
  "Address",
  "Phone",
  "Website",
  "Google Maps URL",
  "Rating",
  "Review Count",
  "Important Signals",
  "Ignis Fit Score",
  "Priority",
  "Status",
  "Why This Lead",
];

export function leadsToCsv(leads: Lead[]): string {
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
    PRIORITY_META[lead.score.priority].label,
    lead.status,
    lead.aiSummary ?? "",
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
