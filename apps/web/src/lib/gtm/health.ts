import {
  getGtmContainerId,
  getGtmSanitizedStatus,
  isValidGtmContainerId,
  shouldLoadGtm,
} from "./config";

export function getGtmHealth() {
  const status = getGtmSanitizedStatus();
  const id = getGtmContainerId();
  return {
    alive: true,
    ready: status.status === "READY",
    configured: Boolean(id),
    idFormatOk: id ? isValidGtmContainerId(id) : false,
    loadContainer: shouldLoadGtm(),
    status: status.status,
    environment: status.environment,
    containerIdMasked: status.containerIdMasked,
    version: "1.0.0-gtm",
  };
}
