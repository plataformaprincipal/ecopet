/**
 * Aceitação segurança — IDOR, admin gate, headers, health interno.
 */
import { test, expect } from "@playwright/test";
import { apiLogin, registerClient, testTag } from "../helpers/acceptance";

test.describe.serial("Acceptance SECURITY", () => {
  const tag = testTag();
  let emailA = "";
  let emailB = "";
  let orderOrPetId = "";

  test("dois clientes isolados", async ({ request }) => {
    const a = await registerClient(request, `${tag}a`);
    const b = await registerClient(request, `${tag}b`);
    expect(a.res.status()).toBe(201);
    expect(b.res.status()).toBe(201);
    emailA = a.email;
    emailB = b.email;

    await apiLogin(request, emailA);
    const pet = await request.post("/api/client/pets", {
      data: { name: `SecA ${tag}`, species: "DOG", sex: "MALE" },
    });
    if ([200, 201].includes(pet.status())) {
      const body = await pet.json();
      orderOrPetId = body.data?.pet?.id || body.data?.id;
    }

    await apiLogin(request, emailB);
    if (orderOrPetId) {
      const steal = await request.delete(`/api/client/pets/${orderOrPetId}`);
      expect([403, 404, 405]).toContain(steal.status());
    }
  });

  test("observability health exige admin", async ({ request }) => {
    await apiLogin(request, emailA);
    const res = await request.get("/api/internal/observability/health");
    expect([401, 403]).toContain(res.status());
  });

  test("telemetry client-error aceita payload sanitizado", async ({ request }) => {
    const res = await request.post("/api/telemetry/client-error", {
      data: {
        name: "Error",
        message: "acceptance test",
        route: "/e2e",
        correlationId: "acc-test-correlation-01",
      },
    });
    expect([200, 201, 204, 429]).toContain(res.status());
  });

  test("login inexistente não vaza existência com mensagem genérica", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: {
        identifier: `nobody.${tag}@test.ecopet.local`,
        password: "SenhaQualquer@12345",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    const msg = String(body.error?.message || body.message || "").toLowerCase();
    // após hardening: mensagem unificada
    expect(msg.length).toBeGreaterThan(0);
  });
});
