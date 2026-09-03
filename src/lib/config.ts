/**
 * Single source of truth for "is a real external provider actually usable
 * right now" — read server-side only. The app must never guess or silently
 * substitute fake data when these are false; every caller either blocks
 * with GOOGLE_NOT_CONFIGURED_MESSAGE / GROQ_NOT_CONFIGURED_MESSAGE or,
 * for business discovery only, requires an explicit BUSINESS_PROVIDER=mock
 * opt-in for local/offline development.
 */

export type BusinessProviderMode = "mock" | "google_places";

export function getBusinessProviderMode(): BusinessProviderMode {
  const raw = (process.env.BUSINESS_PROVIDER || "google_places").trim().toLowerCase();
  return raw === "mock" ? "mock" : "google_places";
}

export function isGoogleConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export const GOOGLE_NOT_CONFIGURED_MESSAGE =
  "Google Places API is not configured. Add GOOGLE_MAPS_API_KEY to the server environment before searching for real businesses.";

export const GROQ_NOT_CONFIGURED_MESSAGE = "Groq API is not configured. Add GROQ_API_KEY to enable AI analysis.";

export interface AppStatus {
  businessMode: BusinessProviderMode;
  googleConfigured: boolean;
  groqConfigured: boolean;
  /** True only when search will actually return real data right now. */
  realDataActive: boolean;
}

export function getAppStatus(): AppStatus {
  const businessMode = getBusinessProviderMode();
  const googleConfigured = isGoogleConfigured();
  return {
    businessMode,
    googleConfigured,
    groqConfigured: isGroqConfigured(),
    realDataActive: businessMode === "google_places" && googleConfigured,
  };
}
