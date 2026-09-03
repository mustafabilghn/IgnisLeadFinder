// Core domain types shared across the whole app.
// Keep this file dependency-free so both server and client code can import it.

export type EvidenceClassification = "VERIFIED" | "DERIVED" | "INFERRED" | "UNKNOWN";

export interface SignalEvidence {
  key: string;
  label: string;
  classification: EvidenceClassification;
  /** Human-readable value, e.g. "Yes", "Not found", "12 product categories" */
  value: string;
  /** Where this was observed, e.g. "Website: example.com/bayilik" */
  source: string;
  /** Short quoted/paraphrased snippet backing the signal, when available */
  evidenceSnippet?: string;
  timestamp: string;
}

export type LeadStatus = "new" | "contacted" | "interested" | "meeting" | "won" | "lost";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "meeting",
  "won",
  "lost",
];

export type Priority = "very_high" | "high" | "medium" | "low";

/**
 * Candidate strength RELATIVE to the other results in the same search —
 * computed from where a lead's score falls in the current result set's
 * distribution, not from fixed absolute thresholds (that's `Priority`
 * above, kept only as a secondary reference). A lead can be "very_strong"
 * here with a score of 24/100 if everything else in that search scored
 * lower — ranking, not an absolute bar, is the point.
 */
export type RelativeLabel = "very_strong" | "strong" | "medium" | "weak";

export interface ScoreCategoryBreakdown {
  category: "b2b" | "orderComplexity" | "operational" | "channel" | "automation";
  label: string;
  score: number;
  max: number;
  reasons: string[];
}

export interface ScoreBreakdown {
  total: number;
  priority: Priority;
  categories: ScoreCategoryBreakdown[];
  positiveSignals: string[];
  unknownSignals: string[];
}

export interface WebsiteScanResult {
  url: string;
  reachable: boolean;
  https: boolean;
  title: string | null;
  pagesChecked: string[];
  scannedAt: string;
  error?: string;
  /** Only populated in mock mode, to make it obvious in the DB/API that this isn't a live fetch */
  mock?: boolean;
}

export type BusinessSource = "mock" | "google_places";

export interface DiscoveredBusiness {
  /** Stable id from the provider (place_id for Google) used for de-duplication */
  providerId: string;
  source: BusinessSource;
  name: string;
  category: string;
  address: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  /** Mock-mode only: canned homepage HTML so the analyzer never hits the network. */
  mockHtml?: string;
  /** Mock-mode only: canned "relevant" sub-pages (dealer/about/etc.) for the analyzer. */
  mockPages?: { url: string; html: string }[];
}

export interface Lead {
  id: string;
  searchId: string;
  createdAt: string;
  updatedAt: string;
  lastScannedAt: string | null;

  // Discovery data
  source: BusinessSource;
  providerId: string;
  name: string;
  category: string;
  address: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;

  // Analysis
  websiteScan: WebsiteScanResult | null;
  signals: SignalEvidence[];
  score: ScoreBreakdown;

  // AI (generated on demand, cached)
  aiSummary: string | null;
  discoveryQuestions: string[] | null;
  outreachMessage: string | null;

  // Lead management
  status: LeadStatus;
  notes: string | null;

  // AI ranking (second-stage, on top of the deterministic score — see searchPipeline/aiRankingService)
  aiRankPosition: number | null;
  aiRankReason: string | null;
}

/** Lightweight projection used for the ranked list / table view */
export interface LeadSummary {
  id: string;
  source: BusinessSource;
  name: string;
  category: string;
  district: string | null;
  city: string | null;
  website: string | null;
  score: number;
  priority: Priority;
  b2bSignal: boolean;
  dealerSignal: boolean;
  technicalSignal: boolean;
  whatsappSignal: boolean;
  hasWebsite: boolean;
  status: LeadStatus;
  rating: number | null;
  reviewCount: number | null;
  updatedAt: string;

  /** 1-based position within the current (filtered/sorted) result set. */
  rank: number;
  /** Where this lead falls relative to the other results currently shown — see RelativeLabel. */
  relativeLabel: RelativeLabel;
  /** Short grounded "why" from the AI ranking pass, when one has run for this lead's search; null otherwise. */
  aiReason: string | null;
}

export interface SearchQuery {
  country: string;
  city: string;
  district?: string;
  category: string;
  maxResults: number;
}

export interface SearchRecord extends SearchQuery {
  id: string;
  createdAt: string;
  resultCount: number;
  provider: BusinessSource;
  aiRankingGeneratedAt: string | null;
}

export interface LeadFilters {
  searchId?: string;
  minScore?: number;
  industry?: string;
  district?: string;
  b2b?: boolean;
  dealer?: boolean;
  technical?: boolean;
  whatsapp?: boolean;
  hasWebsite?: boolean;
  status?: LeadStatus;
}
