import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api-url.server";
import { normalizeProxySegments } from "@/lib/api-url.client";

const CONNECTION_ERROR = {
  error: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
  code: "CONNECTION",
};

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function logProxy(event: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development" || process.env.ECOPET_PROXY_LOG === "1") {
    console.log(
      JSON.stringify({
        scope: "ecopet-proxy",
        event,
        ...data,
        ts: new Date().toISOString(),
      })
    );
  }
}

function buildForwardHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  const allow = [
    "content-type",
    "accept",
    "authorization",
    "cookie",
    "user-agent",
    "x-request-id",
    "x-correlation-id",
  ];
  for (const name of allow) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const backend = getServerApiUrl();
  if (!backend) {
    logProxy("config_missing", { path: pathSegments.join("/") });
    return NextResponse.json(
      { error: "API não configurada. Defina API_INTERNAL_URL.", code: "CONFIG" },
      { status: 503 }
    );
  }

  const normalized = normalizeProxySegments(pathSegments);
  const targetPath = normalized.join("/");
  const url = `${backend.replace(/\/$/, "")}/api/${targetPath}${req.nextUrl.search}`;

  const headers = buildForwardHeaders(req);
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    init.body = req.body;
    init.duplex = "half";
  }

  logProxy("forward", {
    incoming: `/api/ecopet/${pathSegments.join("/")}`,
    targetPath: `/api/${targetPath}`,
    method: req.method,
    cookiePresent: Boolean(req.headers.get("cookie")),
    authorizationPresent: Boolean(req.headers.get("authorization")),
  });

  try {
    const res = await fetch(url, init);
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (HOP_BY_HOP.has(key.toLowerCase())) return;
      if (key.toLowerCase() === "set-cookie") return;
      responseHeaders.append(key, value);
    });

    const setCookies =
      typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const c of setCookies) {
      responseHeaders.append("Set-Cookie", c);
    }
    const legacySetCookie = res.headers.get("set-cookie");
    if (!setCookies.length && legacySetCookie) {
      responseHeaders.append("Set-Cookie", legacySetCookie);
    }

    logProxy("response", {
      targetPath: `/api/${targetPath}`,
      backendStatus: res.status,
      contentType: res.headers.get("content-type"),
    });

    // Streaming / binary: não materializar o body
    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    logProxy("error", {
      targetPath: `/api/${targetPath}`,
      message: (err as Error).message,
    });
    return NextResponse.json(CONNECTION_ERROR, { status: 503 });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
