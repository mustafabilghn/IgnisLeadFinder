import type { DiscoveredBusiness, SearchQuery } from "@/lib/types";
import type { BusinessDiscoveryProvider } from "./types";
import { GOOGLE_NOT_CONFIGURED_MESSAGE } from "@/lib/config";
import { NotConfiguredError } from "@/lib/errors";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "nextPageToken",
].join(",");

const MAX_PAGES = 3; // cost control — caps a single search at 60 places

/**
 * Real provider backed by Google's Places API (New) — Text Search.
 * Requires GOOGLE_MAPS_API_KEY. Throws NotConfiguredError (never a silent
 * fallback) when the key is missing, so the caller blocks the search with a
 * clear message instead of returning nothing or substituting fake data.
 */
export class GooglePlacesProvider implements BusinessDiscoveryProvider {
  readonly source = "google_places" as const;

  async discover(query: SearchQuery): Promise<DiscoveredBusiness[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new NotConfiguredError(GOOGLE_NOT_CONFIGURED_MESSAGE);
    }

    const textQuery = [query.category, query.district, query.city, query.country]
      .filter(Boolean)
      .join(", ");

    const results: DiscoveredBusiness[] = [];
    let pageToken: string | undefined;
    let page = 0;

    do {
      const body: Record<string, unknown> = {
        textQuery,
        maxResultCount: Math.min(20, query.maxResults - results.length),
      };
      if (pageToken) body.pageToken = pageToken;

      const res = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Google Places API error (${res.status}): ${errText || res.statusText}`);
      }

      const data = (await res.json()) as GooglePlacesResponse;
      for (const place of data.places ?? []) {
        results.push(toDiscoveredBusiness(place, query));
      }

      pageToken = data.nextPageToken;
      page += 1;
      // Places API requires a short delay before a pageToken becomes valid.
      if (pageToken && results.length < query.maxResults && page < MAX_PAGES) {
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        pageToken = undefined;
      }
    } while (pageToken && results.length < query.maxResults && page < MAX_PAGES);

    return dedupeByProviderId(results).slice(0, query.maxResults);
  }
}

function dedupeByProviderId(businesses: DiscoveredBusiness[]): DiscoveredBusiness[] {
  const seen = new Set<string>();
  const out: DiscoveredBusiness[] = [];
  for (const b of businesses) {
    if (seen.has(b.providerId)) continue;
    seen.add(b.providerId);
    out.push(b);
  }
  return out;
}

interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: { longText?: string; types?: string[] }[];
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

function toDiscoveredBusiness(place: GooglePlace, query: SearchQuery): DiscoveredBusiness {
  const district = findComponent(place.addressComponents, [
    "sublocality",
    "sublocality_level_1",
    "administrative_area_level_4",
    "neighborhood",
  ]);
  const city = findComponent(place.addressComponents, ["locality", "administrative_area_level_2"]);
  const country = findComponent(place.addressComponents, ["country"]);

  return {
    providerId: place.id,
    source: "google_places",
    name: place.displayName?.text ?? "Unknown business",
    category: query.category,
    address: place.formattedAddress ?? null,
    district: district ?? query.district ?? null,
    city: city ?? query.city,
    country: country ?? query.country,
    phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
  };
}

function findComponent(components: GooglePlace["addressComponents"], types: string[]): string | null {
  if (!components) return null;
  for (const type of types) {
    const match = components.find((c) => c.types?.includes(type));
    if (match?.longText) return match.longText;
  }
  return null;
}
