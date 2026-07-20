import "server-only";

import { GoogleAuth } from "google-auth-library";
import { getAnalyticsSanitizedStatus } from "@/lib/analytics/config";
import type { BiDateRange } from "./periods";

export type GaDataStatus =
  | "READY"
  | "NOT_CONFIGURED"
  | "AUTH_ERROR"
  | "API_ERROR"
  | "DISABLED";

export type GaReportRow = { dimension: string; metric: string; value: number };

export type GaInboundReport = {
  status: GaDataStatus;
  propertyIdMasked: string | null;
  measurementIdMasked: string | null;
  sanitizedMessage: string;
  realtimeActiveUsers: number | null;
  rows: GaReportRow[];
  dimensions: {
    sourceMedium: GaReportRow[];
    deviceCategory: GaReportRow[];
    country: GaReportRow[];
    pagePath: GaReportRow[];
  };
  metrics: {
    sessions: number | null;
    activeUsers: number | null;
    newUsers: number | null;
    engagementRate: number | null;
    averageSessionDuration: number | null;
    bounceRate: number | null;
    conversions: number | null;
    eventCount: number | null;
  };
  lastError: string | null;
};

function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

function maskPropertyId(id: string | null | undefined): string | null {
  if (!id || id.length < 4) return null;
  return `${id.slice(0, 2)}***${id.slice(-2)}`;
}

function parseServiceAccount(): Record<string, unknown> | null {
  const raw = env("GA4_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getGaDataApiConfig() {
  const propertyId = env("GA4_PROPERTY_ID")?.replace(/^properties\//, "") ?? null;
  const credentials = parseServiceAccount();
  const enabled = env("GA4_DATA_API_ENABLED")?.toLowerCase() !== "false";
  return {
    propertyId,
    configured: Boolean(propertyId && credentials && enabled),
    propertyIdMasked: maskPropertyId(propertyId),
    hasCredentials: Boolean(credentials),
  };
}

async function getAccessToken(): Promise<string | null> {
  const credentials = parseServiceAccount();
  if (!credentials) return null;
  try {
    const auth = new GoogleAuth({
      credentials: credentials as object,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token ?? null;
  } catch {
    return null;
  }
}

type RunReportBody = {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  limit?: number;
  orderBys?: unknown[];
};

async function runReport(
  propertyId: string,
  token: string,
  body: RunReportBody
): Promise<{ rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[] } | null> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
  };
}

async function runRealtime(
  propertyId: string,
  token: string
): Promise<number | null> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ metrics: [{ name: "activeUsers" }] }),
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    rows?: { metricValues?: { value?: string }[] }[];
  };
  const v = json.rows?.[0]?.metricValues?.[0]?.value;
  return v != null ? Number(v) : 0;
}

function mapDimMetric(
  report: Awaited<ReturnType<typeof runReport>>,
  dimIndex = 0,
  metricIndex = 0
): GaReportRow[] {
  if (!report?.rows) return [];
  return report.rows.map((row) => ({
    dimension: row.dimensionValues?.[dimIndex]?.value ?? "(not set)",
    metric: "value",
    value: Number(row.metricValues?.[metricIndex]?.value ?? 0),
  }));
}

function emptyInbound(status: GaDataStatus, message: string, lastError: string | null = null): GaInboundReport {
  const gaStatus = getAnalyticsSanitizedStatus();
  return {
    status,
    propertyIdMasked: getGaDataApiConfig().propertyIdMasked,
    measurementIdMasked: gaStatus.measurementIdMasked,
    sanitizedMessage: message,
    realtimeActiveUsers: null,
    rows: [],
    dimensions: { sourceMedium: [], deviceCategory: [], country: [], pagePath: [] },
    metrics: {
      sessions: null,
      activeUsers: null,
      newUsers: null,
      engagementRate: null,
      averageSessionDuration: null,
      bounceRate: null,
      conversions: null,
      eventCount: null,
    },
    lastError,
  };
}

/**
 * Relatórios inbound GA4 Data API.
 * Nunca persiste o warehouse do Google — só lê sob demanda com cache curto no caller.
 */
export async function fetchGaInboundReport(range: BiDateRange): Promise<GaInboundReport> {
  const cfg = getGaDataApiConfig();
  const gaStatus = getAnalyticsSanitizedStatus();

  if (!cfg.configured) {
    return emptyInbound(
      "NOT_CONFIGURED",
      "GA4 Data API não configurada. Defina GA4_PROPERTY_ID + GA4_SERVICE_ACCOUNT_JSON. Tracking client (Measurement ID) é independente.",
      null
    );
  }

  const token = await getAccessToken();
  if (!token) {
    return emptyInbound("AUTH_ERROR", "Falha de autenticação com a service account GA4.", "AUTH_ERROR");
  }

  const propertyId = cfg.propertyId!;
  const startDate = range.from.toISOString().slice(0, 10);
  const endDate = range.to.toISOString().slice(0, 10);

  try {
    const [totals, sourceMedium, device, country, pages, realtime] = await Promise.all([
      runReport(propertyId, token, {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "engagementRate" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "conversions" },
          { name: "eventCount" },
        ],
      }),
      runReport(propertyId, token, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [{ name: "sessions" }],
        limit: 10,
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      runReport(propertyId, token, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
        limit: 10,
      }),
      runReport(propertyId, token, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        limit: 10,
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
      runReport(propertyId, token, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        limit: 10,
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      }),
      runRealtime(propertyId, token),
    ]);

    if (!totals) {
      return emptyInbound("API_ERROR", "GA4 Data API retornou erro no relatório principal.", "API_ERROR");
    }

    const m = totals.rows?.[0]?.metricValues ?? [];
    const num = (i: number) => (m[i]?.value != null ? Number(m[i].value) : null);

    return {
      status: "READY",
      propertyIdMasked: cfg.propertyIdMasked,
      measurementIdMasked: gaStatus.measurementIdMasked,
      sanitizedMessage: "Relatórios GA4 carregados via Data API (sem persistir warehouse).",
      realtimeActiveUsers: realtime,
      rows: mapDimMetric(sourceMedium),
      dimensions: {
        sourceMedium: mapDimMetric(sourceMedium),
        deviceCategory: mapDimMetric(device),
        country: mapDimMetric(country),
        pagePath: mapDimMetric(pages),
      },
      metrics: {
        sessions: num(0),
        activeUsers: num(1),
        newUsers: num(2),
        engagementRate: num(3) != null ? Math.round(num(3)! * 1000) / 10 : null,
        averageSessionDuration: num(4) != null ? Math.round(num(4)!) : null,
        bounceRate: num(5) != null ? Math.round(num(5)! * 1000) / 10 : null,
        conversions: num(6),
        eventCount: num(7),
      },
      lastError: null,
    };
  } catch {
    return emptyInbound("API_ERROR", "Erro ao consultar GA4 Data API.", "API_ERROR");
  }
}
