import type { DiscoveredBusiness, SearchQuery } from "@/lib/types";

export interface BusinessDiscoveryProvider {
  readonly source: "mock" | "google_places";
  discover(query: SearchQuery): Promise<DiscoveredBusiness[]>;
}
