/**
 * Diagnóstico VLibras: captura requisições Unity/WASM e erros de console.
 * Uso: node scripts/vlibras-network-audit.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.argv[2] ?? "http://localhost:3001";

const auditScript = `
(async () => {
  const logs = { requests: [], errors: [], cspViolations: [], meta: {} };
  const filters = /wasm|unity|vlibras|webgl|unityweb|\\.data|playerweb/i;

  document.addEventListener('securitypolicyviolation', (e) => {
    logs.cspViolations.push({
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      effectiveDirective: e.effectiveDirective,
      originalPolicy: e.originalPolicy?.slice(0, 200),
    });
  });

  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = String(args[0]);
    const t0 = performance.now();
    try {
      const res = await origFetch(...args);
      if (filters.test(url)) {
        logs.requests.push({ url, status: res.status, ms: Math.round(performance.now() - t0), ok: res.ok, type: 'fetch' });
      }
      return res;
    } catch (err) {
      if (filters.test(url)) {
        logs.requests.push({ url, error: String(err), ms: Math.round(performance.now() - t0), type: 'fetch' });
      }
      throw err;
    }
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__auditUrl = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.addEventListener('loadend', function() {
    const url = this.__auditUrl || '';
    if (filters.test(url)) {
      logs.requests.push({ url, status: this.status, ms: 0, ok: this.status >= 200 && this.status < 300, type: 'xhr' });
    }
  });

  window.addEventListener('error', (e) => {
    logs.errors.push({ message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, stack: e.error?.stack });
  });
  window.addEventListener('unhandledrejection', (e) => {
    logs.errors.push({ message: 'unhandledrejection: ' + String(e.reason), stack: e.reason?.stack });
  });

  logs.meta.crossOriginIsolated = window.crossOriginIsolated;
  logs.meta.hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  logs.meta.hasWebGL = !!document.createElement('canvas').getContext('webgl');

  // Habilitar VLibras via store pattern
  localStorage.setItem('ecopet-a11y-v2', JSON.stringify({
    state: { librasEnabled: true, fontScale: 1, letterSpacing: 0, lineHeight: 0,
      highContrast: false, invertedContrast: false, grayscale: false, colorBlindMode: false,
      highlightLinks: false, strongFocus: false, largeCursor: false, visualAlerts: false,
      reduceVisualNotifications: false, cognitiveMode: false, simplifiedUI: false,
      motorMode: false, calmMode: false, dyslexiaMode: false, pauseAnimations: false,
      brailleEnabled: false, screenReaderMode: false, readingMask: false, readingGuide: false,
      locale: 'pt-BR' }, version: 0
  }));
  location.reload();
})();
`;

console.log(`Auditing VLibras at ${BASE}...`);

// Use PowerShell to run a minimal audit via fetch to key URLs from Node
const urls = [
  "https://vlibras.gov.br/app/vlibras-plugin.js",
  "https://www.vlibras.gov.br/app/vlibras-plugin.js",
  "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@sgd/app/vlibras-plugin.js",
  "https://www.vlibras.gov.br/app/target/UnityLoader.js",
  "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@sgd/app/target/UnityLoader.js",
  "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@sgd/app/target/playerweb.json",
  "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@sgd/app/target/playerweb.data.unityweb",
  "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@sgd/app/target/playerweb.wasm.code.unityweb",
  "https://dicionario2.vlibras.gov.br/static/BUNDLES/2018.3.1/WEBGL/",
  "https://dicionario2.vlibras.gov.br/bundles",
  "https://traducao2.vlibras.gov.br/translate",
];

console.log("\n=== URL probe (HEAD/follow redirects) ===");
for (const url of urls) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ms = Date.now() - t0;
    const final = res.url;
    console.log(JSON.stringify({ url, final, status: res.status, ms, ok: res.ok, type: res.headers.get("content-type") }));
  } catch (err) {
    console.log(JSON.stringify({ url, error: String(err), ms: Date.now() - t0 }));
  }
}

// CSP from app
try {
  const res = await fetch(BASE, { redirect: "follow" });
  const csp = res.headers.get("content-security-policy");
  console.log("\n=== CSP from app ===");
  console.log(csp ?? "(none in dev)");
  console.log("Has wasm-unsafe-eval:", csp?.includes("wasm-unsafe-eval") ?? false);
  console.log("Has jsdelivr:", csp?.includes("jsdelivr") ?? false);
  console.log("Has media-src:", csp?.includes("media-src") ?? false);
} catch (err) {
  console.error("Could not fetch app:", err.message);
}

console.log("\nRun browser audit manually with DevTools or use puppeteer for full trace.");
