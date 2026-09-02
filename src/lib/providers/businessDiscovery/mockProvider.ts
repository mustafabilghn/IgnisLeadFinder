import type { DiscoveredBusiness, SearchQuery } from "@/lib/types";
import type { BusinessDiscoveryProvider } from "./types";
import {
  MOCK_BUSINESS_SEEDS,
  generateProceduralBusinesses,
  pageToHtml,
  type MockBusinessSeed,
} from "./mockData";

/**
 * Clearly-labeled development provider. Returns curated, realistic-looking
 * businesses for the spec's three target searches, and procedurally
 * generates plausible ones for any other location/category so the tool
 * never breaks when there's no API credential configured.
 *
 * This NEVER pretends to be real data — every DiscoveredBusiness has
 * source: "mock", and the UI surfaces a mock-mode banner.
 */
export class MockBusinessDiscoveryProvider implements BusinessDiscoveryProvider {
  readonly source = "mock" as const;

  async discover(query: SearchQuery): Promise<DiscoveredBusiness[]> {
    // The curated set only covers Istanbul. Category words like "metal" or
    // "distributor" alone aren't geography-specific, so a match requires the
    // category AND (a matching district, or — when no district is given — at
    // least a matching city) so an unrelated search (e.g. Munich) correctly
    // falls through to the procedural generator instead of returning Istanbul
    // businesses just because a category word happens to overlap.
    const districtTokens = tokenize(query.district ?? "");
    const cityTokens = tokenize(query.city);
    const categoryTokens = tokenize(query.category);

    const curatedMatches = MOCK_BUSINESS_SEEDS.filter((seed) => {
      const categoryMatch = categoryTokens.some((t) => seed.tags.includes(t));
      if (!categoryMatch) return false;

      if (districtTokens.length > 0) {
        const seedDistrictTokens = new Set(tokenize(seed.district));
        return districtTokens.some((t) => seedDistrictTokens.has(t));
      }
      const seedCityTokens = new Set(tokenize(seed.city));
      return cityTokens.some((t) => seedCityTokens.has(t));
    });

    const seeds =
      curatedMatches.length > 0
        ? curatedMatches.slice(0, query.maxResults)
        : generateProceduralBusinesses(query.city, query.district, query.category, query.maxResults);

    return seeds.slice(0, query.maxResults).map((seed) => toDiscoveredBusiness(seed));
  }
}

function tokenize(input: string): string[] {
  return input
    .replace(/İ/g, "I") // avoid Turkish dotted-I lowercasing to a combining-mark sequence
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function toDiscoveredBusiness(seed: MockBusinessSeed): DiscoveredBusiness {
  return {
    providerId: seed.id,
    source: "mock",
    name: seed.name,
    category: seed.category,
    address: `${seed.district}, ${seed.city}`.replace(/^, /, ""),
    district: seed.district || null,
    city: seed.city,
    country: seed.country,
    phone: seed.phone,
    website: seed.website,
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${seed.id}`,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    mockHtml: seed.homepage ? pageToHtml(seed.homepage) : undefined,
    mockPages: seed.extraPage ? [{ url: `${seed.website}${seed.extraPage.path}`, html: pageToHtml(seed.extraPage) }] : undefined,
  };
}
