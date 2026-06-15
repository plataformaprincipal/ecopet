import { getObservabilityProviders } from "./providers";

export function getAnalyticsStatus() {
  return getObservabilityProviders();
}
