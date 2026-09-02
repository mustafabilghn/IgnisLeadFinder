import type { LeadFilters } from "./types";

export function filtersToSearchParams(filters: LeadFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.searchId) p.set("searchId", filters.searchId);
  if (filters.minScore !== undefined) p.set("minScore", String(filters.minScore));
  if (filters.industry) p.set("industry", filters.industry);
  if (filters.district) p.set("district", filters.district);
  if (filters.b2b) p.set("b2b", "1");
  if (filters.dealer) p.set("dealer", "1");
  if (filters.technical) p.set("technical", "1");
  if (filters.whatsapp) p.set("whatsapp", "1");
  if (filters.hasWebsite) p.set("hasWebsite", "1");
  if (filters.status) p.set("status", filters.status);
  return p;
}
