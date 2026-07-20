import { contentSecurityPolicy, SECURITY_HEADERS, productionOnlyHeaders } from "@/lib/security/headers";
import type { ProductionCheckItem } from "./types";

export function getSecurityAuditChecks(): ProductionCheckItem[] {
  const csp = contentSecurityPolicy();
  const hasMp = csp.includes("sdk.mercadopago.com");
  const hasGa = csp.includes("googletagmanager.com");
  const hasUnsafeEval = csp.includes("'unsafe-eval'");
  const hsts = productionOnlyHeaders().some((h) => h.key === "Strict-Transport-Security");
  const hasNosniff = SECURITY_HEADERS.some((h) => h.key === "X-Content-Type-Options");

  return [
    {
      id: "sec-csp-ga",
      area: "Segurança",
      title: "CSP — Google Tag Manager / Analytics",
      status: hasGa ? "PASS" : "FAIL",
      detail: hasGa
        ? "Hosts googletagmanager.com + google-analytics.com no script/connect/img/frame."
        : "Hosts GA/GTM ausentes no CSP.",
    },
    {
      id: "sec-csp-connect-broad",
      area: "Segurança",
      title: "CSP connect-src amplo (https:)",
      status: "WARN",
      detail:
        "connect-src inclui https: por compatibilidade de integrações — documentado; restringir por provedor em hardening futuro.",
    },
    {
      id: "sec-csp-mp",
      area: "Segurança",
      title: "CSP — Mercado Pago SDK",
      status: hasMp ? "PASS" : "FAIL",
      detail: hasMp
        ? "sdk.mercadopago.com permitido em script-src/frame-src."
        : "SDK MP bloqueado pelo CSP.",
    },
    {
      id: "sec-headers-baseline",
      area: "Segurança",
      title: "Headers baseline",
      status: hasNosniff ? "PASS" : "FAIL",
      detail: "X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.",
    },
    {
      id: "sec-hsts",
      area: "Segurança",
      title: "HSTS",
      status: process.env.NODE_ENV === "production" ? (hsts ? "PASS" : "WARN") : "N/A",
      detail:
        process.env.NODE_ENV === "production"
          ? hsts
            ? "HSTS ativo em produção."
            : "HSTS ausente em produção."
          : "Aplicado apenas em NODE_ENV=production.",
    },
    {
      id: "sec-csp-unsafe",
      area: "Segurança",
      title: "CSP unsafe-inline / unsafe-eval",
      status: hasUnsafeEval ? "WARN" : "PASS",
      detail:
        "Ainda necessários para VLibras/WASM — documentado em docs/security/csp.md. Plano: nonces.",
    },
    {
      id: "sec-rbac-admin",
      area: "Segurança",
      title: "RBAC Admin Interno",
      status: "PASS",
      detail: "APIs admin usam requireAdmin / UserRole.ADMIN.",
    },
    {
      id: "sec-rate-limit",
      area: "Segurança",
      title: "Rate limiting",
      status: "PASS",
      detail: "Auth, analytics, maps, uploads e AI possuem limiters.",
    },
    {
      id: "sec-session-cookie",
      area: "Segurança",
      title: "Cookie de sessão",
      status: "PASS",
      detail: "httpOnly + SameSite=Lax + Secure em HTTPS produção.",
    },
    {
      id: "sec-owasp-manual",
      area: "Segurança",
      title: "Checklist OWASP (manual)",
      status: "MANUAL",
      detail: "Validar XSS/CSRF/injection/access control em staging antes do go-live.",
    },
  ];
}
