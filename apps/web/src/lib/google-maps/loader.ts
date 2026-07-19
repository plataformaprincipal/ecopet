"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  getGoogleMapsPublicApiKey,
  isGoogleMapsClientReady,
} from "./config";
import type { GoogleMapsLoaderState } from "./types";

type GlobalMapsLoader = {
  promise?: Promise<typeof google>;
  state: GoogleMapsLoaderState;
  error?: string;
  optionsSet?: boolean;
};

const globalForMaps = globalThis as unknown as { __ecopetGoogleMaps?: GlobalMapsLoader };

function store(): GlobalMapsLoader {
  if (!globalForMaps.__ecopetGoogleMaps) {
    globalForMaps.__ecopetGoogleMaps = { state: "idle" };
  }
  return globalForMaps.__ecopetGoogleMaps;
}

export function getGoogleMapsLoaderState(): GoogleMapsLoaderState {
  if (typeof window === "undefined") return "unsupported";
  return store().state;
}

/**
 * Carrega Maps JS uma única vez via Dynamic Library Import (API oficial atual).
 * Não executa em SSR. Não carrega se a chave estiver ausente.
 */
export async function loadGoogleMaps(opts?: {
  language?: string;
  region?: string;
  timeoutMs?: number;
}): Promise<typeof google> {
  if (typeof window === "undefined") {
    throw new Error("GOOGLE_MAPS_SSR");
  }

  const cached = store();
  if (cached.promise && cached.state === "ready") {
    return cached.promise;
  }
  if (cached.promise && cached.state === "loading") {
    return cached.promise;
  }

  if (!isGoogleMapsClientReady()) {
    cached.state = "error";
    cached.error = "NOT_CONFIGURED";
    throw new Error("GOOGLE_MAPS_NOT_CONFIGURED");
  }

  const apiKey = getGoogleMapsPublicApiKey()!;
  cached.state = "loading";

  const languageRaw = opts?.language || document.documentElement.lang || "pt-BR";
  const language = languageRaw.startsWith("es")
    ? "es"
    : languageRaw.startsWith("en")
      ? "en"
      : "pt-BR";
  const region = opts?.region || "BR";
  const timeoutMs = opts?.timeoutMs ?? 15_000;

  if (!cached.optionsSet) {
    setOptions({
      key: apiKey,
      v: "weekly",
      language,
      region,
      libraries: ["places", "geometry", "marker"],
    });
    cached.optionsSet = true;
  }

  const promise = Promise.race([
    (async () => {
      await importLibrary("maps");
      await importLibrary("places");
      await importLibrary("geometry");
      await importLibrary("marker");
      return google;
    })(),
    new Promise<typeof google>((_, reject) => {
      setTimeout(() => reject(new Error("GOOGLE_MAPS_TIMEOUT")), timeoutMs);
    }),
  ])
    .then((g) => {
      cached.state = "ready";
      cached.error = undefined;
      return g;
    })
    .catch((err) => {
      cached.state = "error";
      cached.error = err instanceof Error ? err.message : "LOAD_FAILED";
      cached.promise = undefined;
      throw err;
    });

  cached.promise = promise;
  return promise;
}

export function resetGoogleMapsLoaderForTests() {
  globalForMaps.__ecopetGoogleMaps = { state: "idle" };
}
