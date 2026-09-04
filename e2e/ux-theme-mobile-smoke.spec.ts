import { test, expect, type Page } from "@playwright/test";
import {
  ensureAdminUser,
  ensureApprovedPartnerUser,
  ensureClientUser,
  loginContext,
} from "./helpers/social";
import { registerNgo } from "./helpers/acceptance";

async function assertNoCriticalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, "horizontal overflow").toBeLessThan(24);
}

async function assertPageAlive(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  const crashed = page.getByRole("heading", { name: /algo deu errado|something went wrong/i });
  await expect(crashed).toHaveCount(0);
}

test.describe("UX dark / light / mobile smoke", () => {
  test.describe.configure({ timeout: 90_000 });

  test("home e login em dark sem branco puro nem preto puro", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ecopet-theme", "dark");
    });
    for (const path of ["/", "/login", "/marketplace", "/adocao"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await assertPageAlive(page);
      await expect(page.locator("html")).toHaveClass(/dark/);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).not.toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255/i);
      expect(bg).not.toMatch(/rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/);
    }
  });

  test("mobile 375px — home, login, marketplace", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/", "/login", "/marketplace"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await assertPageAlive(page);
      await assertNoCriticalOverflow(page);
    }
  });

  test("tema persiste após reload", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.setItem("ecopet-theme", "dark"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("ecopet-theme"))).toBe("dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("Fluxos críticos por persona (UI smoke, sem pagamento Live)", () => {
  test.describe.configure({ timeout: 90_000 });

  test("CLIENT: dashboard", async ({ browser }) => {
    const client = await ensureClientUser("uxcli");
    const ctx = await browser.newContext();
    await loginContext(ctx, client.email);
    const page = await ctx.newPage();
    await page.goto("/cliente", { waitUntil: "domcontentloaded" });
    await assertPageAlive(page);
    await ctx.close();
  });

  test("PARTNER: dashboard", async ({ browser }) => {
    const partner = await ensureApprovedPartnerUser("uxpar");
    const ctx = await browser.newContext();
    await loginContext(ctx, partner.email);
    const page = await ctx.newPage();
    await page.goto("/partner", { waitUntil: "domcontentloaded" });
    await assertPageAlive(page);
    await ctx.close();
  });

  test("ONG: dashboard", async ({ browser, request }) => {
    const { res, email } = await registerNgo(request);
    expect([200, 201]).toContain(res.status());
    const ctx = await browser.newContext();
    await loginContext(ctx, email);
    const page = await ctx.newPage();
    await page.goto("/ngo", { waitUntil: "domcontentloaded" });
    await assertPageAlive(page);
    await ctx.close();
  });

  test("ADMIN: pricing e commerce", async ({ browser }) => {
    const admin = await ensureAdminUser(`e2e.admin.ux.${Date.now()}@test.ecopet.local`);
    const ctx = await browser.newContext();
    await loginContext(ctx, admin.email);
    const page = await ctx.newPage();
    await page.goto("/admin/pricing", { waitUntil: "domcontentloaded" });
    await assertPageAlive(page);
    await page.goto("/admin/commerce", { waitUntil: "domcontentloaded" });
    await assertPageAlive(page);
    await ctx.close();
  });
});
