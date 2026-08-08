/**
 * Official Vercel Deployment Protection bypass for E2E runners.
 * Uses VERCEL_AUTOMATION_BYPASS_SECRET when present (e.g. via --env-file).
 * Never logs the secret.
 *
 * Also forces public DNS for lookup: some Windows resolvers ENOTFOUND
 * homolog.eccopet.com while 8.8.8.8 resolves it (CNAME → Vercel).
 */
import dns from "dns";
import { Resolver } from "dns/promises";

const publicResolver = new Resolver();
publicResolver.setServers(["8.8.8.8", "1.1.1.1"]);
const originalLookup = dns.lookup.bind(dns);
dns.lookup = (hostname, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  publicResolver
    .resolve4(hostname)
    .then((addrs) => {
      if (!addrs?.length) {
        return originalLookup(hostname, options, callback);
      }
      if (options && options.all) {
        callback(
          null,
          addrs.map((address) => ({ address, family: 4 }))
        );
        return;
      }
      callback(null, addrs[0], 4);
    })
    .catch(() => originalLookup(hostname, options, callback));
};

const bypassCookieJar = new Map();

function rememberBypassCookies(res) {
  const raw =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const single = res.headers.get("set-cookie");
  const list = raw.length ? raw : single ? [single] : [];
  for (const c of list) {
    const part = String(c).split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) {
      const name = part.slice(0, eq);
      // Keep session + Vercel protection cookies
      bypassCookieJar.set(name, part.slice(eq + 1));
    }
  }
}

/**
 * Header interno EccoPet para E2E Preview (rate-limit IP sintético).
 * Usa E2E_TEST_SECRET — NÃO reutiliza VERCEL_AUTOMATION_BYPASS_SECRET.
 */
export function applyEcopetE2eTestHeaders(headers = {}) {
  const secret = process.env.E2E_TEST_SECRET;
  const out = { ...headers };
  if (secret && String(secret).trim()) {
    out["x-ecopet-e2e-test"] = String(secret).trim();
  }
  return out;
}

export function applyVercelBypassHeaders(headers = {}) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const out = applyEcopetE2eTestHeaders({ ...headers });
  if (secret && String(secret).trim()) {
    out["x-vercel-protection-bypass"] = secret;
    out["x-vercel-set-bypass-cookie"] = "true";
  }
  if (bypassCookieJar.size) {
    const bypassCookies = [...bypassCookieJar.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    const existing = out.Cookie || out.cookie || "";
    out.Cookie = existing ? `${existing}; ${bypassCookies}` : bypassCookies;
    delete out.cookie;
  }
  return out;
}

/**
 * fetch() that applies official bypass headers and follows redirects with cookies.
 */
export async function fetchWithVercelBypass(url, init = {}) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret || !String(secret).trim()) {
    return fetch(url, init);
  }

  let current = url;
  let method = init.method || "GET";
  let body = init.body;
  const baseHeaders = init.headers || {};

  for (let hop = 0; hop < 8; hop++) {
    const headers = applyVercelBypassHeaders(
      baseHeaders instanceof Headers
        ? Object.fromEntries(baseHeaders.entries())
        : { ...baseHeaders }
    );
    const res = await fetch(current, {
      ...init,
      method,
      body,
      headers,
      redirect: "manual",
    });
    rememberBypassCookies(res);

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      current = new URL(loc, current).href;
      if (
        res.status === 303 ||
        ((res.status === 301 || res.status === 302) &&
          method !== "GET" &&
          method !== "HEAD")
      ) {
        method = "GET";
        body = undefined;
      }
      continue;
    }
    return res;
  }
  throw new Error("redirect count exceeded (vercel protection bypass)");
}
