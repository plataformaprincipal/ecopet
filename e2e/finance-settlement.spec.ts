import { test, expect } from "@playwright/test";
import {
  ensureApprovedPartnerUser,
  ensureAdminUser,
  ensureClientUser,
  TEST_PASSWORD,
} from "./helpers/social";

test.describe("Finance settlement / split honesty", () => {
  test("partner finance API is scoped and reports split not ready", async ({ request }) => {
    const partner = await ensureApprovedPartnerUser("finpt");
    await request.post("/api/auth/login", {
      data: { identifier: partner.email, email: partner.email, password: TEST_PASSWORD },
    });
    const mine = await request.get("/api/partner/financeiro");
    expect(mine.status()).toBe(200);
    const body = await mine.json();
    expect(body.data.summary.splitReady).toBe(false);
    expect(body.data.mpConnection.status).toBeTruthy();
    expect(body.data.mpConnection.accessTokenEnc).toBeUndefined();

    const conn = await request.get("/api/partner/financeiro/mp-connection");
    expect(conn.status()).toBe(200);
    const connBody = await conn.json();
    expect(["NOT_CONNECTED", "PENDING", "CONNECTED", "ERROR", "REAUTH_REQUIRED"]).toContain(
      connBody.data.connection.status
    );
    expect(JSON.stringify(connBody)).not.toMatch(/APP_USR-|TEST-[0-9]/);
  });

  test("client cannot read partner settlement internals", async ({ request }) => {
    const client = await ensureClientUser("fincl");
    await request.post("/api/auth/login", {
      data: { identifier: client.email, email: client.email, password: TEST_PASSWORD },
    });
    const fin = await request.get("/api/partner/financeiro");
    expect([401, 403]).toContain(fin.status());
    const admin = await request.get("/api/admin/financeiro/settlement?orderId=clfake");
    expect([401, 403]).toContain(admin.status());
  });

  test("admin settlement and alerts require admin", async ({ request }) => {
    const admin = await ensureAdminUser(`e2e.admin.finance.${Date.now()}@test.ecopet.local`);
    await request.post("/api/auth/login", {
      data: { identifier: admin.email, email: admin.email, password: TEST_PASSWORD },
    });
    const alerts = await request.get("/api/admin/financeiro/alerts?lookbackHours=24");
    expect(alerts.status()).toBe(200);
    const missing = await request.get("/api/admin/financeiro/settlement");
    expect(missing.status()).toBe(400);
  });
});
