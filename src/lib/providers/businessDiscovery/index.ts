import type { BusinessDiscoveryProvider } from "./types";
import { MockBusinessDiscoveryProvider } from "./mockProvider";
import { GooglePlacesProvider } from "./googlePlacesProvider";
import { getBusinessProviderMode } from "@/lib/config";

export type { BusinessDiscoveryProvider } from "./types";

/**
 * Single switch point for which business data source powers discovery.
 *
 * Defaults to the REAL Google Places provider — mock data only ever runs
 * when BUSINESS_PROVIDER=mock is set explicitly (an isolated, clearly-labeled
 * developer/test mode). It is never a silent fallback for a missing API key:
 * if Google is selected (the default) but GOOGLE_MAPS_API_KEY is unset,
 * GooglePlacesProvider.discover() throws NotConfiguredError instead of this
 * factory quietly substituting mock data.
 */
export function getBusinessDiscoveryProvider(): BusinessDiscoveryProvider {
  const mode = getBusinessProviderMode();
  return mode === "mock" ? new MockBusinessDiscoveryProvider() : new GooglePlacesProvider();
}
