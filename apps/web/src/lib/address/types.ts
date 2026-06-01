export interface AddressByCepValue {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string;
  reference?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const EMPTY_ADDRESS: AddressByCepValue = {
  zipCode: "",
  street: "",
  number: "",
  district: "",
  city: "",
  state: "",
  complement: "",
  reference: "",
  latitude: null,
  longitude: null,
};

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export interface CepLookupResult {
  ok: boolean;
  fromCache: boolean;
  address?: Partial<AddressByCepValue>;
  error?: string;
  durationMs?: number;
}

/** Preparado para futuras integrações (Google Maps, OSM tiles, GPS). */
export interface GeoProviderConfig {
  nominatimEnabled: boolean;
  googleMapsApiKey?: string;
  openStreetMapEnabled: boolean;
  gpsEnabled: boolean;
}

export const DEFAULT_GEO_CONFIG: GeoProviderConfig = {
  nominatimEnabled: true,
  openStreetMapEnabled: true,
  gpsEnabled: false,
};
