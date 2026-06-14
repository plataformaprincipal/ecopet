import { INTEGRATION_ERROR_CODES, IntegrationNotConfiguredError } from "@/lib/integrations/errors";
import {
  isGoogleMapsConfigured,
  isMapboxConfigured,
} from "@/lib/integrations/env-check";
import { writeIntegrationLog } from "@/lib/integrations/log";
import { lookupCep as viaCepLookup } from "@/lib/address/cep-service";

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
  provider: "google_maps" | "mapbox" | "nominatim";
};

export type CepResult = Awaited<ReturnType<typeof viaCepLookup>>;

/** ViaCEP — API pública, sem chave */
export async function lookupCep(cep: string): Promise<CepResult> {
  try {
    const result = await viaCepLookup(cep);
    await writeIntegrationLog({
      integrationName: "viacep",
      provider: "ViaCEP",
      action: "lookup_cep",
      status: result.ok ? "OK" : "FAILED",
      errorCode: result.ok ? undefined : "CEP_NOT_FOUND",
      message: result.ok ? undefined : result.error,
    });
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha na consulta de CEP.";
    await writeIntegrationLog({
      integrationName: "viacep",
      provider: "ViaCEP",
      action: "lookup_cep",
      status: "FAILED",
      message,
    });
    return { ok: false as const, fromCache: false, error: message };
  }
}

export function assertMapsConfigured(env = process.env): "google_maps" | "mapbox" {
  if (isGoogleMapsConfigured(env)) return "google_maps";
  if (isMapboxConfigured(env)) return "mapbox";
  throw new IntegrationNotConfiguredError(
    INTEGRATION_ERROR_CODES.MAPS_NOT_CONFIGURED,
    "Mapas não configurados. Defina GOOGLE_MAPS_API_KEY ou MAPBOX_ACCESS_TOKEN."
  );
}

/** Geocodificação — não inventa coordenadas */
export async function geocodeAddress(_address: string): Promise<GeoCoordinates> {
  const provider = assertMapsConfigured();

  await writeIntegrationLog({
    integrationName: provider,
    provider: provider === "google_maps" ? "Google Maps" : "Mapbox",
    action: "geocode",
    status: "NOT_CONFIGURED",
    errorCode: INTEGRATION_ERROR_CODES.MAPS_NOT_CONFIGURED,
    message: "Geocodificação preparada — implementação pendente.",
  });

  throw new IntegrationNotConfiguredError(
    INTEGRATION_ERROR_CODES.MAPS_NOT_CONFIGURED,
    "Geocodificação não implementada nesta etapa."
  );
}
