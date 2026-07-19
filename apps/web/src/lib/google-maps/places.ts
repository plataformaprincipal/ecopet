import type { StructuredAddress } from "./types";

type AddressComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types?: string[];
};

function comp(
  components: AddressComponent[],
  type: string,
  useShort = false
): string {
  const found = components.find((c) => c.types?.includes(type));
  if (!found) return "";
  if (useShort) return found.short_name || found.shortText || found.long_name || found.longText || "";
  return found.long_name || found.longText || found.short_name || found.shortText || "";
}

/**
 * Converte componentes Google Places (legado PlaceResult ou novo Place)
 * em endereço estruturado EcoPet.
 */
export function parseGoogleAddressComponents(
  components: AddressComponent[],
  extras?: {
    formattedAddress?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
  }
): StructuredAddress {
  const streetNumber = comp(components, "street_number");
  const route = comp(components, "route");
  const neighborhood =
    comp(components, "sublocality_level_1") ||
    comp(components, "sublocality") ||
    comp(components, "neighborhood") ||
    comp(components, "administrative_area_level_4");
  const city =
    comp(components, "administrative_area_level_2") ||
    comp(components, "locality");
  const state = comp(components, "administrative_area_level_1", true);
  const postalCode = comp(components, "postal_code");
  const country = comp(components, "country", true) || "BR";
  const complement = comp(components, "subpremise");

  return {
    postalCode,
    street: route,
    number: streetNumber,
    complement: complement || undefined,
    neighborhood,
    city,
    state,
    country: country || "BR",
    formattedAddress: extras?.formattedAddress,
    placeId: extras?.placeId,
    latitude: extras?.lat ?? null,
    longitude: extras?.lng ?? null,
    geocodingSource: "GOOGLE",
  };
}

/** PlaceResult legado (AutocompleteService / PlacesService). */
export function parseLegacyPlaceResult(place: {
  address_components?: AddressComponent[];
  formatted_address?: string;
  place_id?: string;
  geometry?: { location?: { lat: () => number; lng: () => number } | LatLngLike };
}): StructuredAddress | null {
  if (!place.address_components?.length) return null;
  const loc = place.geometry?.location;
  let lat: number | undefined;
  let lng: number | undefined;
  if (loc) {
    if (typeof (loc as { lat: () => number }).lat === "function") {
      lat = (loc as { lat: () => number }).lat();
      lng = (loc as { lng: () => number }).lng();
    } else {
      lat = (loc as LatLngLike).lat;
      lng = (loc as LatLngLike).lng;
    }
  }
  return parseGoogleAddressComponents(place.address_components, {
    formattedAddress: place.formatted_address,
    placeId: place.place_id,
    lat,
    lng,
  });
}

type LatLngLike = { lat: number; lng: number };

export function structuredToAddressByCepFields(addr: StructuredAddress) {
  return {
    zipCode: addr.postalCode,
    street: addr.street,
    number: addr.number,
    district: addr.neighborhood,
    city: addr.city,
    state: addr.state,
    complement: addr.complement || "",
    latitude: addr.latitude ?? null,
    longitude: addr.longitude ?? null,
  };
}
