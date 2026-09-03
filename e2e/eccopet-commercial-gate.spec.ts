import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { ensureClientWithPet, loginContext } from "./helpers/social";

const prisma = new PrismaClient();

const PRODUCTS: Array<{ slug: string; name: string; hero: string }> = [
  { slug: "vet", name: "EccoVet AI", hero: "Converse sobre a saúde do seu pet." },
  { slug: "triagem", name: "EccoVet Triagem", hero: "Descubra o nível de urgência em poucos minutos." },
  { slug: "relatorio", name: "EccoVet Relatório", hero: "Crie um relatório completo do seu pet." },
  { slug: "exames", name: "EccoVet Exames", hero: "Envie o exame do seu pet." },
  { slug: "vision", name: "EccoVet Vision", hero: "Mostre o que está acontecendo." },
  { slug: "nutri", name: "EccoNutri AI", hero: "Alimentação personalizada para seu pet." },
  { slug: "peso", name: "EccoPeso AI", hero: "Peso saudável, acompanhamento contínuo." },
  { slug: "dental", name: "EccoDental AI", hero: "Cuide da boca e dos dentes do seu pet." },
  { slug: "behavior", name: "EccoBehavior AI", hero: "Entenda melhor o comportamento do seu pet." },
  { slug: "vacina", name: "EccoVacina AI", hero: "Carteira vacinal inteligente." },
  { slug: "med", name: "EccoMed AI", hero: "Organize os medicamentos do seu pet." },
  { slug: "checkup", name: "EccoCheckup AI", hero: "Veja como está a rotina de prevenção do seu pet." },
  { slug: "health-profile", name: "Pet Health Profile", hero: "Memória inteligente da saúde do seu pet." },
];

async function isolateBrowser(page: import("@playwright/test").Page, theme: "light" | "dark" = "light") {
  await page.addInitScript((value) => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("ecopet-theme", value);
      localStorage.setItem("ecopet.analytics.consent.choice.v1", "1");
      localStorage.setItem("ecopet-locale-detected", "1");
    } catch {
      /* ignore */
    }
  }, theme);
}

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
  expect(overflow).toBeFalsy();
}

test.describe("EccoPet commercial release gate", () => {
  test("AI Store lista os 13 especialistas distintos", async ({ page }) => {
    await isolateBrowser(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/eccopet");
    await expect(page.getByRole("heading", { name: /eccovet ai/i }).first()).toBeVisible({ timeout: 20_000 });
    for (const product of PRODUCTS) {
      await expect(page.getByRole("heading", { name: product.name, exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/plano de saúde pet|bubis/i)).toHaveCount(0);
  });

  test("13 produtos abrem com identidade, hero, composer e chips próprios", async ({ page }) => {
    test.setTimeout(180_000);
    await isolateBrowser(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const heroes = new Set<string>();
    for (const product of PRODUCTS) {
      await page.goto(`/eccopet/${product.slug}`);
      await expect(page.getByRole("heading", { name: new RegExp(product.name, "i") }).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("heading", { name: product.hero })).toBeVisible();
      await expect(page.getByTestId("specialist-composer")).toBeVisible();
      await expect(page.locator("[data-specialist]")).toHaveCount(1);
      heroes.add(product.hero);
      await assertNoHorizontalOverflow(page);
    }
    expect(heroes.size).toBe(13);
  });

  test("Marketplace Saúde fica fora da loja de IA", async ({ page }) => {
    await isolateBrowser(page);
    await page.goto("/marketplace");
    await expect(page.getByTestId("marketplace-saude-rail")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "SAÚDE ECCOPET" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "PLANO DE SAÚDE PET" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "EMERGÊNCIA VETERINÁRIA" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Consulta", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vacinação" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Check-up" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nutrição" })).toBeVisible();
  });

  test("Plano Saúde declara PARTNER_REQUIRED e SKUs PRT", async ({ page }) => {
    await isolateBrowser(page);
    await page.goto("/marketplace/saude/planos");
    await expect(page.getByRole("heading", { name: /eccopet saúde/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/PARTNER_REQUIRED/i).first()).toBeVisible();
    await expect(page.getByText(/PRT-001/).first()).toBeVisible();
    await expect(page.getByText(/PRT-002/).first()).toBeVisible();
    await expect(page.getByText(/PRT-003/).first()).toBeVisible();
  });

  test("Emergência abre Bubis imediatamente", async ({ page }) => {
    await isolateBrowser(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /preciso de ajuda agora/i })).toHaveAttribute(
      "href",
      "/marketplace/emergencia"
    );
    await page.goto("/marketplace/emergencia", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("bubis-chat")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Bubis").first()).toBeVisible();
    await expect(page.getByText("Assistente veterinária virtual da EccoPet").first()).toBeVisible();
    await expect(page.getByTestId("bubis-composer")).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("API de emergência 24h não inventa veterinário", async ({ request }) => {
    const res = await request.get("/api/marketplace/services?emergency24h=true&pageSize=8");
    const body = await res.json().catch(() => ({}));
    const payload = JSON.stringify(body);
    expect(payload).not.toMatch(/Veterinário a caminho|Consulta confirmada|CRMV fictício/i);
    if (res.ok()) {
      const services = body?.data?.services ?? [];
      expect(Array.isArray(services)).toBeTruthy();
    } else {
      expect([500, 503]).toContain(res.status());
    }
  });

  test("dark mode em store, marketplace e Bubis", async ({ page }) => {
    test.setTimeout(180_000);
    await isolateBrowser(page, "dark");
    for (const path of ["/eccopet", "/eccopet/vet", "/eccopet/exames", "/eccopet/health-profile", "/marketplace", "/marketplace/emergencia"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible({ timeout: 20_000 });
      const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).not.toBe("rgb(255, 255, 255)");
    }
  });

  test("mobile 375x812 nas superfícies críticas", async ({ page }) => {
    test.setTimeout(180_000);
    await isolateBrowser(page);
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ["/eccopet", "/eccopet/vet", "/eccopet/exames", "/eccopet/nutri", "/eccopet/health-profile", "/marketplace", "/marketplace/saude", "/marketplace/emergencia"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible({ timeout: 20_000 });
      await assertNoHorizontalOverflow(page);
    }
  });
});

test.describe("EccoPet commercial gate — authenticated live", () => {
  test("Home AI-first e OpenAI live em EccoVet", async ({ page, context }) => {
    test.setTimeout(360_000);
    const { user, pet } = await ensureClientWithPet("gatevet");
    await loginContext(context, user.email);
    await isolateBrowser(page);
    await page.goto("/cliente", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /como posso ajudar/i })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("link", { name: /saúde/i }).first()).toBeVisible();

    await page.goto("/eccopet/vet", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("specialist-composer")).toBeVisible({ timeout: 45_000 });
    await page.getByLabel("Para qual pet?").selectOption(pet.id).catch(async () => {
      await page.locator("select").first().selectOption(pet.id);
    });
    await page.getByTestId("specialist-composer").fill("Meu cachorro está sem apetite desde ontem.");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page).toHaveURL(/\/eccopet\/vet\/session\//, { timeout: 90_000 });
    const executionUrl = page.url();
    const executionId = executionUrl.split("/session/")[1]?.split("?")[0];
    expect(executionId).toBeTruthy();

    await expect(page.getByRole("button", { name: "Ontem", exact: true })).toBeVisible({ timeout: 45_000 });
    await page.getByRole("button", { name: "Ontem", exact: true }).click();
    await expect(page.getByRole("button", { name: "Leve", exact: true })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Leve", exact: true }).click();
    const generate = page.getByRole("button", { name: /gerar análise/i });
    await expect(generate).toBeEnabled({ timeout: 30_000 });
    await generate.click();
    await expect(page.getByTestId("specialist-result")).toBeVisible({ timeout: 90_000 });
    const vetText = await page.getByTestId("specialist-result").innerText();
    expect(vetText.toLowerCase()).not.toMatch(/lorem ipsum|resposta mock|fake openai/);
    expect(vetText.length).toBeGreaterThan(40);

    const saved = await prisma.aIExecution.findUnique({
      where: { id: executionId! },
      select: { status: true, model: true, inputTokens: true, structuredOutput: true },
    });
    expect(saved?.status).toBe("COMPLETED");
    expect(saved?.model ?? "").toMatch(/gpt/i);
    expect((saved?.inputTokens ?? 0) > 0 || Boolean(saved?.structuredOutput)).toBeTruthy();
  });

  test("OpenAI live em EccoNutri", async ({ page, context }) => {
    test.setTimeout(360_000);
    const { user, pet } = await ensureClientWithPet("gatenutri");
    await loginContext(context, user.email);
    await isolateBrowser(page);
    await page.goto("/eccopet/nutri", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("specialist-composer")).toBeVisible({ timeout: 45_000 });
    await page.getByLabel("Para qual pet?").selectOption(pet.id).catch(async () => {
      await page.locator("select").first().selectOption(pet.id);
    });
    await page.getByRole("button", { name: "Manutenção" }).click();
    await expect(page).toHaveURL(/\/eccopet\/nutri\/session\//, { timeout: 90_000 });
    const confirm = page.getByRole("button", { name: "Sim" });
    if (await confirm.isVisible({ timeout: 8_000 }).catch(() => false)) await confirm.click();
    const food = page.getByRole("textbox").last();
    if (await food.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await food.fill("Ração adulta 200g");
      await page.getByRole("button", { name: "Enviar" }).click();
    }
    const generateNutri = page.getByRole("button", { name: /gerar análise/i });
    await expect(generateNutri).toBeEnabled({ timeout: 45_000 });
    await generateNutri.click();
    await expect(page.getByTestId("specialist-result")).toBeVisible({ timeout: 90_000 });
    const nutriExec = page.url().split("/session/")[1]?.split("?")[0];
    const saved = await prisma.aIExecution.findUnique({
      where: { id: nutriExec! },
      select: { status: true, model: true },
    });
    expect(saved?.status).toBe("COMPLETED");
    expect(saved?.model ?? "").toMatch(/gpt/i);
  });

  test("Bubis red flag imediato e handoff sem veterinário fictício", async ({ page, context }) => {
    test.setTimeout(180_000);
    const { user, pet } = await ensureClientWithPet("gatebubis");
    await loginContext(context, user.email);
    await isolateBrowser(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/marketplace/emergencia", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("bubis-chat")).toBeVisible({ timeout: 45_000 });
    const petSelect = page.locator("select").first();
    await expect(petSelect).toBeVisible({ timeout: 45_000 });
    await petSelect.selectOption(pet.id);
    await page.getByTestId("bubis-composer").fill("Meu cachorro está convulsionando.");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /atendimento urgente recomendado/i })).toBeVisible({
      timeout: 45_000,
    });
    await page.getByRole("button", { name: /falar com veterinário/i }).click();
    await expect(
      page.getByText(/não encontramos um veterinário disponível|não foi possível consultar a disponibilidade|crmv|ver atendimento/i)
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Veterinário a caminho|Consulta confirmada/i)).toHaveCount(0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("bubis-composer").fill("Meu cachorro vomitou uma vez hoje mas está brincando normalmente.");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText(/quando isso começou|qual o sinal|brincando|intensidade/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("alert").filter({ hasText: /atendimento urgente recomendado/i })).toHaveCount(0);
  });
});
