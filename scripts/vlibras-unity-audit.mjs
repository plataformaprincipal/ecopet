/**
 * Auditoria Unity VLibras — captura Network + Console após clique no botão azul.
 * Uso: node scripts/vlibras-unity-audit.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3005";
const FILTER = /vlibras|unity|wasm|\.data|loader|player|gameContainer|unityweb|jsdelivr|playerweb/i;

const requests = [];
const consoleLogs = [];
const cspViolations = [];

function classifyResponse(res) {
  if (!res) return { status: "NO_RESPONSE", contentType: null, size: null };
  const headers = res.headers();
  return {
    status: res.status(),
    contentType: headers["content-type"] ?? null,
    size: headers["content-length"] ? Number(headers["content-length"]) : null,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    const text = msg.text();
    if (/unity|webgl|wasm|playerweb|gameContainer|plugin|vlibras|csp|blocked/i.test(text)) {
      consoleLogs.push({ type: msg.type(), text, location: msg.location() });
    }
  });

  page.on("pageerror", (err) => {
    consoleLogs.push({ type: "pageerror", text: err.message, stack: err.stack });
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (FILTER.test(url)) {
      requests.push({
        url,
        method: req.method(),
        failed: true,
        failure: req.failure()?.errorText ?? "unknown",
        resourceType: req.resourceType(),
      });
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (!FILTER.test(url)) return;
    const req = res.request();
    const timing = req.timing();
    const duration =
      timing.responseEnd > 0 ? Math.round(timing.responseEnd - timing.startTime) : null;
    requests.push({
      url,
      method: req.method(),
      ...classifyResponse(res),
      durationMs: duration,
      resourceType: req.resourceType(),
      failed: false,
    });
  });

  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations = window.__cspViolations || [];
      window.__cspViolations.push({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
      });
    });
  });

  console.log(`Navigating to ${BASE}...`);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Habilitar Libras via localStorage + reload
  await page.evaluate(() => {
    localStorage.setItem(
      "ecopet-a11y-v2",
      JSON.stringify({
        state: {
          librasEnabled: true,
          fontScale: 1,
          letterSpacing: 0,
          lineHeight: 0,
          highContrast: false,
          invertedContrast: false,
          grayscale: false,
          colorBlindMode: false,
          highlightLinks: false,
          strongFocus: false,
          largeCursor: false,
          visualAlerts: false,
          reduceVisualNotifications: false,
          cognitiveMode: false,
          simplifiedUI: false,
          motorMode: false,
          calmMode: false,
          dyslexiaMode: false,
          pauseAnimations: false,
          brailleEnabled: false,
          screenReaderMode: false,
          readingMask: false,
          readingGuide: false,
          locale: "pt-BR",
        },
        version: 0,
      })
    );
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });

  // Garantir DOM oficial
  await page.evaluate(() => {
    if (!document.querySelector("[vw].enabled")) {
      const root = document.createElement("div");
      root.setAttribute("vw", "");
      root.className = "enabled";
      root.innerHTML =
        '<div vw-access-button="" class="active"></div><div vw-plugin-wrapper=""><div class="vw-plugin-top-wrapper"></div></div>';
      document.body.appendChild(root);
    }
  });

  // Injetar script oficial se next/script lazyOnload não disparou
  await page.evaluate(async () => {
    if (window.VLibras) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  });

  await page.waitForFunction(() => !!window.VLibras, { timeout: 30000 });

  await page.evaluate(() => {
    if (!document.querySelector(".vp-access-button")) {
      new window.VLibras.Widget("https://vlibras.gov.br/app");
      if (typeof window.onload === "function") {
        window.onload.call(window, new Event("load"));
      }
    }
  });

  await page.waitForFunction(
    () =>
      !!document.querySelector(
        "[vw-access-button] .vp-access-button, [vw-access-button] img"
      ),
    { timeout: 30000 }
  );
  console.log("Botão azul detectado. Clicando...");

  const requestsAfterClick = [];
  page.on("response", async (res) => {
    const url = res.url();
    const req = res.request();
    requestsAfterClick.push({
      url,
      status: res.status(),
      contentType: res.headers()["content-type"] ?? null,
      size: res.headers()["content-length"] ?? null,
      resourceType: req.resourceType(),
      failed: false,
    });
  });
  page.on("requestfailed", (req) => {
    requestsAfterClick.push({
      url: req.url(),
      failed: true,
      failure: req.failure()?.errorText,
      resourceType: req.resourceType(),
    });
  });

  const beforeClick = Date.now();
  await page.click("[vw-access-button]");

  // Aguardar Unity completo (player.loaded) até 90s
  let unityReady = false;
  try {
    await page.waitForFunction(
      () =>
        window.plugin?.player?.loaded === true ||
        (() => {
          const c = document.querySelector("#gameContainer canvas");
          return c && c.width > 300 && c.height > 200;
        })(),
      { timeout: 90000 }
    );
    unityReady = true;
  } catch {
    unityReady = false;
  }
  const afterWait = Date.now() - beforeClick;

  const diagnostics = await page.evaluate(() => {
    const gc = document.querySelector("#gameContainer");
    const canvas = gc?.querySelector("canvas");
    const canvasCtx = canvas ? canvas.getContext("webgl") || canvas.getContext("webgl2") : null;
    return {
      windowPlugin: !!window.plugin,
      windowVLibras: !!window.VLibras,
      windowUnityLoader: typeof window.UnityLoader !== "undefined",
      windowCreateUnityInstance: typeof window.createUnityInstance !== "undefined",
      gameContainerExists: !!gc,
      gameContainerChildren: gc?.childElementCount ?? 0,
      canvasExists: !!canvas,
      canvasWidth: canvas?.width ?? 0,
      canvasHeight: canvas?.height ?? 0,
      canvasHasWebGL: !!canvasCtx,
      pluginPlayerLoaded: window.plugin?.player?.loaded ?? false,
      wrapperActive: document.querySelector("[vw-plugin-wrapper]")?.classList.contains("active"),
      cspViolations: window.__cspViolations ?? [],
    };
  });

  const report = {
    baseUrl: BASE,
    unityReady,
    waitMs: afterWait,
    diagnostics,
    requestCount: requests.length,
    requestsAfterClickCount: requestsAfterClick.length,
    requestsAfterClick: requestsAfterClick.filter((r) =>
      /unity|wasm|unityweb|playerweb|UnityLoader|vlibras|jsdelivr/i.test(r.url)
    ),
    requests: requests.sort((a, b) => (a.url > b.url ? 1 : -1)),
    consoleLogs,
    summary: {
      failed: requests.filter((r) => r.failed || (r.status && r.status >= 400)),
      blocked: requests.filter((r) => r.failure?.includes("blocked") || r.failure?.includes("CSP")),
      unityAssets: requests.filter((r) => /unityweb|UnityLoader|playerweb|wasm/i.test(r.url)),
    },
  };

  const outPath = "scripts/vlibras-unity-audit-report.json";
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log("\n=== DIAGNOSTICS ===");
  console.log(JSON.stringify(diagnostics, null, 2));
  console.log("\n=== FAILED / 4xx / 5xx ===");
  for (const r of report.summary.failed) {
    console.log(JSON.stringify(r));
  }
  console.log("\n=== UNITY ASSETS ===");
  for (const r of report.summary.unityAssets) {
    console.log(`${r.status ?? "FAIL"} ${r.durationMs ?? "?"}ms ${r.url.slice(0, 120)}`);
  }
  console.log("\n=== CONSOLE (filtered) ===");
  for (const l of consoleLogs) {
    console.log(`[${l.type}] ${l.text.slice(0, 200)}`);
  }
  console.log(`\nUnity ready: ${unityReady}`);
  console.log(`Requests after click (unity filter): ${report.requestsAfterClick.length}`);
  for (const r of report.requestsAfterClick) {
    const tag = r.failed ? `FAIL:${r.failure}` : r.status;
    console.log(`  ${tag} ${r.url.slice(0, 100)}`);
  }
  console.log(`Full report: ${outPath}`);

  await browser.close();
  process.exit(unityReady ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
