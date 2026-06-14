import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api-url.server";
import { normalizeProxySegments } from "@/lib/api-url.client";

const CONNECTION_ERROR = {
  error: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
  code: "CONNECTION",
};

function logProxy(event: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development" || process.env.ECOPET_PROXY_LOG === "1") {
    console.log(JSON.stringify({ scope: "ecopet-proxy", event, ...data, ts: new Date().toISOString() }));
  }
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

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  logProxy("forward", {
    incoming: `/api/ecopet/${pathSegments.join("/")}`,
    target: url,
    method: req.method,
  });

  try {
    const res = await fetch(url, init);
    const body = await res.text();
    const responseHeaders = new Headers();
    const resContentType = res.headers.get("content-type");
    if (resContentType) responseHeaders.set("Content-Type", resContentType);

    const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const c of setCookies) {
      responseHeaders.append("Set-Cookie", c);
    }
    const legacySetCookie = res.headers.get("set-cookie");
    if (!setCookies.length && legacySetCookie) {
      responseHeaders.append("Set-Cookie", legacySetCookie);
    }

    logProxy("response", { target: url, status: res.status });

    return new NextResponse(body, { status: res.status, headers: responseHeaders });
  } catch (err) {
    logProxy("error", { target: url, message: (err as Error).message });
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
