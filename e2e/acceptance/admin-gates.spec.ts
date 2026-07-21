/**
 * Aceitação ADMIN — gates sem criar superadmin (evita bootstrap destrutivo).
 * Quando ADMIN_TEST_EMAIL/PASSWORD existirem no env, valida login + health.
 */
import { test, expect } from "@playwright/test";
import { registerClient, apiLogin } from "../helpers/acceptance";

test.describe("Acceptance ADMIN gates", () => {
  test("CLIENT não acessa observability health", async ({ request }) => {
    const { res, email } = await registerClient(request);
    expect(res.status()).toBe(201);
    await apiLogin(request, email);
    const health = await request.get("/api/internal/observability/health");
    expect([401, 403]).toContain(health.status());
    const diagnostics = await request.get("/api/internal/observability/diagnostics");
    expect([401, 403]).toContain(diagnostics.status());
  });

  test("ADMIN real (opcional via env)", async ({ request }) => {
    const email = process.env.ADMIN_TEST_EMAIL?.trim();
    const password = process.env.ADMIN_TEST_PASSWORD?.trim();
    test.skip(!email || !password, "Defina ADMIN_TEST_EMAIL e ADMIN_TEST_PASSWORD para este cenário");

    const login = await request.post("/api/auth/login", {
      data: { identifier: email, password },
    });
    expect(login.status()).toBe(200);
    const health = await request.get("/api/internal/observability/health");
    expect(health.status()).toBe(200);
    const body = await health.json();
    expect(body.data?.health || body.data).toBeTruthy();
    // nunca deve conter token
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/BETTER_STACK_SOURCE_TOKEN|sk_live|re_[A-Za-z0-9]{10,}/);
  });
});
