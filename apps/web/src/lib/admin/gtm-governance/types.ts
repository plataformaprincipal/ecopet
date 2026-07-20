export type GtmGovernanceSection =
  | "overview"
  | "backend"
  | "datalayer"
  | "tags"
  | "triggers"
  | "variables"
  | "consent"
  | "bi"
  | "modules"
  | "health"
  | "diagnostics"
  | "logs"
  | "environments"
  | "debug"
  | "exports"
  | "alerts";

export type GtmInventoryItem = {
  id: string;
  name: string;
  type: string;
  status: "RECOMMENDED" | "OPTIONAL" | "ACTIVE" | "INACTIVE" | "WARN";
  detail: string;
  module?: string;
};

export type GtmModuleStats = {
  module: string;
  label: string;
  eventCount: number;
  sampleEvents: string[];
  gtmMirror: string;
};

export type GtmAlert = {
  id: string;
  severity: "info" | "warn" | "error";
  title: string;
  detail: string;
};

export type GtmGovernanceReport = {
  generatedAt: string;
  version: string;
  overview: {
    containerConnected: boolean;
    status: string;
    environment: string;
    containerIdMasked: string | null;
    loadContainer: boolean;
    debug: boolean;
    version: string;
    build: string | null;
    lastSyncAt: string | null;
    lastErrorCode: string | null;
    avgResponseMs: number | null;
    gaConnected: boolean;
    gaStatus: string;
    antiDuplicationNote: string;
    sanitizedMessage: string;
  };
  health: {
    status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
    checks: { id: string; ok: boolean; label: string; detail: string }[];
  };
  diagnostics: {
    problems: string[];
    scripts: string[];
    consentMode: string;
    dataLayerActive: boolean;
    notes: string[];
  };
  dataLayer: {
    namespacedEvents: { name: string; purpose: string }[];
    catalogTotal: number;
    byCategory: { category: string; count: number }[];
    byModule: { module: string; count: number }[];
    recentSamples: { event: string; at: string; module?: string }[];
    discardedNote: string;
  };
  tags: GtmInventoryItem[];
  triggers: GtmInventoryItem[];
  variables: GtmInventoryItem[];
  consent: {
    defaults: Record<string, string>;
    bannerImplemented: boolean;
    cmpReady: boolean;
    lastChangeNote: string;
  };
  bi: {
    eventsByModule: { module: string; count: number }[];
    note: string;
    relatedBiHref: string;
  };
  modules: GtmModuleStats[];
  environments: {
    current: string;
    matrix: { env: string; gtmLoads: boolean; gaSends: boolean; note: string }[];
  };
  alerts: GtmAlert[];
  logs: { at: string; level: string; message: string }[];
  debug: {
    debugFlag: boolean;
    previewHint: string;
    lastErrorCode: string | null;
  };
  coverage: {
    implementedCount: number;
    catalogCount: number;
    coveragePct: number;
    implemented: {
      module: string;
      event_name: string;
      surface: string;
      confirmed_after_success: boolean;
    }[];
    notInstrumentedSample: string[];
    strategy: string;
  };
  meta: {
    dataSource: string;
    noWarehouseDuplication: true;
  };
};
