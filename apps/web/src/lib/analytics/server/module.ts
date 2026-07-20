import "server-only";

import { AnalyticsServerService } from "./service";
import { createAnalyticsWebhookStub } from "./webhooks";
import { ANALYTICS_MODULE_VERSION } from "./types";

/** Bootstrap do módulo Analytics Server (lazy / singleton). */
let bootstrapped = false;

export function getAnalyticsModule() {
  if (!bootstrapped) {
    bootstrapped = true;
  }
  return {
    version: ANALYTICS_MODULE_VERSION,
    service: AnalyticsServerService,
    webhooks: createAnalyticsWebhookStub(),
  };
}

export type AnalyticsModule = ReturnType<typeof getAnalyticsModule>;
