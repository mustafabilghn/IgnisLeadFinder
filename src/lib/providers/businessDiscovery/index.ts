import type { BusinessDiscoveryProvider } from "./types";
import { MockBusinessDiscoveryProvider } from "./mockProvider";
import { GooglePlacesProvider } from "./googlePlacesProvider";

export type { BusinessDiscoveryProvider } from "./types";

/**
 * Single switch point for which business data source powers discovery.
 * Swapping providers later means adding a class + a case here — nothing
 * else in the app needs to know a provider exists.
 */
export function getBusinessDiscoveryProvider(): BusinessDiscoveryProvider {
  const configured = (process.env.BUSINESS_PROVIDER || "mock").trim().toLowerCase();

  switch (configured) {
    case "google_places":
      return new GooglePlacesProvider();
    case "mock":
    default:
      return new MockBusinessDiscoveryProvider();
  }
}
