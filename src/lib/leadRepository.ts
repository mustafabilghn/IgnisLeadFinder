import { randomUUID } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "./db";
import type {
  DiscoveredBusiness,
  Lead,
  LeadFilters,
  LeadStatus,
  LeadSummary,
  ScoreBreakdown,
  SearchQuery,
  SearchRecord,
  SignalEvidence,
  WebsiteScanResult,
  BusinessSource,
} from "./types";

interface LeadRow {
  id: string;
  search_id: string;
  created_at: string;
  updated_at: string;
  last_scanned_at: string | null;
  source: BusinessSource;
  provider_id: string;
  name: string;
  category: string;
  address: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  google_maps_url: string | null;
  rating: number | null;
  review_count: number | null;
  website_scan_json: string | null;
  signals_json: string;
  score_total: number;
  score_priority: string;
  score_json: string;
  b2b_signal: number;
  dealer_signal: number;
  technical_signal: number;
  whatsapp_signal: number;
  has_website: number;
  ai_summary: string | null;
  discovery_questions_json: string | null;
  outreach_message: string | null;
  status: string;
  notes: string | null;
}

const DEFAULT_SCORE: ScoreBreakdown = {
  total: 0,
  priority: "low",
  categories: [],
  positiveSignals: [],
  unknownSignals: [],
};

// ── Searches ────────────────────────────────────────────────────────────

export function createSearch(query: SearchQuery, provider: BusinessSource): SearchRecord {
  const db = getDb();
  const record: SearchRecord = {
    id: randomUUID(),
    ...query,
    createdAt: new Date().toISOString(),
    resultCount: 0,
    provider,
  };
  db.prepare(
    `INSERT INTO searches (id, country, city, district, category, max_results, provider, result_count, created_at)
     VALUES (@id, @country, @city, @district, @category, @maxResults, @provider, 0, @createdAt)`,
  ).run({
    id: record.id,
    country: record.country,
    city: record.city,
    district: record.district ?? null,
    category: record.category,
    maxResults: record.maxResults,
    provider: record.provider,
    createdAt: record.createdAt,
  });
  return record;
}

export function updateSearchResultCount(searchId: string, count: number): void {
  getDb().prepare(`UPDATE searches SET result_count = ? WHERE id = ?`).run(count, searchId);
}

// ── Leads: discovery + upsert ──────────────────────────────────────────

export function findLeadByProviderId(source: BusinessSource, providerId: string): Lead | null {
  const row = getDb()
    .prepare(`SELECT * FROM leads WHERE source = ? AND provider_id = ?`)
    .get(source, providerId) as LeadRow | undefined;
  return row ? rowToLead(row) : null;
}

/** Creates a brand-new lead row with empty analysis — the pipeline fills analysis in right after. */
export function createLeadStub(business: DiscoveredBusiness, searchId: string): Lead {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(
    `INSERT INTO leads (
       id, search_id, created_at, updated_at, last_scanned_at,
       source, provider_id, name, category, address, district, city, country,
       phone, website, google_maps_url, rating, review_count,
       website_scan_json, signals_json, score_total, score_priority, score_json,
       b2b_signal, dealer_signal, technical_signal, whatsapp_signal, has_website,
       ai_summary, discovery_questions_json, outreach_message, status, notes
     ) VALUES (
       @id, @searchId, @now, @now, NULL,
       @source, @providerId, @name, @category, @address, @district, @city, @country,
       @phone, @website, @googleMapsUrl, @rating, @reviewCount,
       NULL, '[]', 0, 'low', '{}',
       0, 0, 0, 0, @hasWebsite,
       NULL, NULL, NULL, 'new', NULL
     )`,
  ).run({
    id,
    searchId,
    now,
    source: business.source,
    providerId: business.providerId,
    name: business.name,
    category: business.category,
    address: business.address,
    district: business.district,
    city: business.city,
    country: business.country,
    phone: business.phone,
    website: business.website,
    googleMapsUrl: business.googleMapsUrl,
    rating: business.rating,
    reviewCount: business.reviewCount,
    hasWebsite: business.website ? 1 : 0,
  });

  return getLead(id)!;
}

/** Re-discovered lead: refresh raw discovery fields only. Analysis is left untouched (cost control). */
export function updateDiscoveryFields(id: string, business: DiscoveredBusiness, searchId: string): void {
  getDb()
    .prepare(
      `UPDATE leads SET
         search_id = @searchId, updated_at = @now,
         name = @name, category = @category, address = @address, district = @district,
         city = @city, country = @country, phone = @phone, website = @website,
         google_maps_url = @googleMapsUrl, rating = @rating, review_count = @reviewCount,
         has_website = @hasWebsite
       WHERE id = @id`,
    )
    .run({
      id,
      searchId,
      now: new Date().toISOString(),
      name: business.name,
      category: business.category,
      address: business.address,
      district: business.district,
      city: business.city,
      country: business.country,
      phone: business.phone,
      website: business.website,
      googleMapsUrl: business.googleMapsUrl,
      rating: business.rating,
      reviewCount: business.reviewCount,
      hasWebsite: business.website ? 1 : 0,
    });
}

// ── Leads: analysis ─────────────────────────────────────────────────────

export function saveAnalysis(
  id: string,
  data: { websiteScan: WebsiteScanResult; signals: SignalEvidence[]; score: ScoreBreakdown },
): void {
  const flags = deriveFlags(data.signals);
  getDb()
    .prepare(
      `UPDATE leads SET
         updated_at = @now, last_scanned_at = @now,
         website_scan_json = @websiteScanJson, signals_json = @signalsJson,
         score_total = @scoreTotal, score_priority = @scorePriority, score_json = @scoreJson,
         b2b_signal = @b2b, dealer_signal = @dealer, technical_signal = @technical, whatsapp_signal = @whatsapp
       WHERE id = @id`,
    )
    .run({
      id,
      now: new Date().toISOString(),
      websiteScanJson: JSON.stringify(data.websiteScan),
      signalsJson: JSON.stringify(data.signals),
      scoreTotal: data.score.total,
      scorePriority: data.score.priority,
      scoreJson: JSON.stringify(data.score),
      b2b: flags.b2b ? 1 : 0,
      dealer: flags.dealer ? 1 : 0,
      technical: flags.technical ? 1 : 0,
      whatsapp: flags.whatsapp ? 1 : 0,
    });
}

function deriveFlags(signals: SignalEvidence[]) {
  const has = (key: string) =>
    signals.some((s) => s.key === key && (s.classification === "VERIFIED" || s.classification === "INFERRED"));
  return {
    b2b: ["b2b_explicit", "wholesale", "distributor", "dealer_network", "corporate_customers"].some(has),
    dealer: ["dealer_network", "become_dealer", "dealer_portal"].some(has),
    technical: ["technical_specs", "custom_production", "configurable_products", "project_based"].some(has),
    whatsapp: ["whatsapp_present", "whatsapp_orders"].some(has),
  };
}

// ── Leads: AI content ────────────────────────────────────────────────────

export function saveAiSummary(id: string, summary: string): void {
  getDb()
    .prepare(`UPDATE leads SET ai_summary = ?, updated_at = ? WHERE id = ?`)
    .run(summary, new Date().toISOString(), id);
}

export function saveDiscoveryQuestions(id: string, questions: string[]): void {
  getDb()
    .prepare(`UPDATE leads SET discovery_questions_json = ?, updated_at = ? WHERE id = ?`)
    .run(JSON.stringify(questions), new Date().toISOString(), id);
}

export function saveOutreachMessage(id: string, message: string): void {
  getDb()
    .prepare(`UPDATE leads SET outreach_message = ?, updated_at = ? WHERE id = ?`)
    .run(message, new Date().toISOString(), id);
}

// ── Leads: status / notes ────────────────────────────────────────────────

export function updateLeadStatus(
  id: string,
  patch: { status?: LeadStatus; notes?: string },
): Lead | null {
  const db = getDb();
  const current = getLead(id);
  if (!current) return null;

  db.prepare(`UPDATE leads SET status = @status, notes = @notes, updated_at = @now WHERE id = @id`).run({
    id,
    status: patch.status ?? current.status,
    notes: patch.notes !== undefined ? patch.notes : current.notes,
    now: new Date().toISOString(),
  });

  return getLead(id);
}

// ── Leads: reads ──────────────────────────────────────────────────────────

export function getLead(id: string): Lead | null {
  const row = getDb().prepare(`SELECT * FROM leads WHERE id = ?`).get(id) as LeadRow | undefined;
  return row ? rowToLead(row) : null;
}

export function listLeads(filters: LeadFilters): LeadSummary[] {
  const { where, params } = buildWhereClause(filters);
  const rows = getDb()
    .prepare(`SELECT * FROM leads ${where} ORDER BY score_total DESC, updated_at DESC`)
    .all(params) as unknown as LeadRow[];
  return rows.map(rowToSummary);
}

export function listLeadsFull(filters: LeadFilters): Lead[] {
  const { where, params } = buildWhereClause(filters);
  const rows = getDb()
    .prepare(`SELECT * FROM leads ${where} ORDER BY score_total DESC, updated_at DESC`)
    .all(params) as unknown as LeadRow[];
  return rows.map(rowToLead);
}

export function listDistinctDistricts(): string[] {
  const rows = getDb()
    .prepare(`SELECT DISTINCT district FROM leads WHERE district IS NOT NULL AND district != '' ORDER BY district`)
    .all() as unknown as { district: string }[];
  return rows.map((r) => r.district);
}

export function listDistinctIndustries(): string[] {
  const rows = getDb()
    .prepare(`SELECT DISTINCT category FROM leads WHERE category IS NOT NULL AND category != '' ORDER BY category`)
    .all() as unknown as { category: string }[];
  return rows.map((r) => r.category);
}

function buildWhereClause(filters: LeadFilters): { where: string; params: Record<string, SQLInputValue> } {
  const clauses: string[] = [];
  const params: Record<string, SQLInputValue> = {};

  if (filters.searchId) {
    clauses.push("search_id = @searchId");
    params.searchId = filters.searchId;
  }
  if (filters.minScore !== undefined) {
    clauses.push("score_total >= @minScore");
    params.minScore = filters.minScore;
  }
  if (filters.industry) {
    clauses.push("category LIKE @industry");
    params.industry = `%${filters.industry}%`;
  }
  if (filters.district) {
    clauses.push("district = @district");
    params.district = filters.district;
  }
  if (filters.b2b) clauses.push("b2b_signal = 1");
  if (filters.dealer) clauses.push("dealer_signal = 1");
  if (filters.technical) clauses.push("technical_signal = 1");
  if (filters.whatsapp) clauses.push("whatsapp_signal = 1");
  if (filters.hasWebsite) clauses.push("has_website = 1");
  if (filters.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }

  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

// ── Mapping ────────────────────────────────────────────────────────────

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    searchId: row.search_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastScannedAt: row.last_scanned_at,
    source: row.source,
    providerId: row.provider_id,
    name: row.name,
    category: row.category,
    address: row.address,
    district: row.district,
    city: row.city,
    country: row.country,
    phone: row.phone,
    website: row.website,
    googleMapsUrl: row.google_maps_url,
    rating: row.rating,
    reviewCount: row.review_count,
    websiteScan: row.website_scan_json ? JSON.parse(row.website_scan_json) : null,
    signals: row.signals_json ? JSON.parse(row.signals_json) : [],
    score: row.score_json && row.score_json !== "{}" ? JSON.parse(row.score_json) : DEFAULT_SCORE,
    aiSummary: row.ai_summary,
    discoveryQuestions: row.discovery_questions_json ? JSON.parse(row.discovery_questions_json) : null,
    outreachMessage: row.outreach_message,
    status: row.status as LeadStatus,
    notes: row.notes,
  };
}

function rowToSummary(row: LeadRow): LeadSummary {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    district: row.district,
    city: row.city,
    website: row.website,
    score: row.score_total,
    priority: row.score_priority as LeadSummary["priority"],
    b2bSignal: !!row.b2b_signal,
    dealerSignal: !!row.dealer_signal,
    technicalSignal: !!row.technical_signal,
    whatsappSignal: !!row.whatsapp_signal,
    hasWebsite: !!row.has_website,
    status: row.status as LeadStatus,
    rating: row.rating,
    reviewCount: row.review_count,
    updatedAt: row.updated_at,
  };
}
