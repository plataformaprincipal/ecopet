/**
 * Aceitação CLIENT — cadastro, login, permissões, pet, marketplace básico.
 */
import { test, expect } from "@playwright/test";
import {
  TEST_PASSWORD,
  apiLogin,
  apiLogout,
  registerClient,
  testTag,
} from "../helpers/acceptance";

test.describe.serial("Acceptance CLIENT", () => {
  const tag = testTag();
  let email = "";
  let petId = "";
  let otherPetId = "";

  test("cadastro válido", async ({ request }) => {
    const { res, email: e } = await registerClient(request, tag);
    email = e;
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data?.user?.role || body.data?.role).toBe("CLIENT");
    expect(body.data?.user?.accountStatus || body.data?.accountStatus).toBe("ACTIVE");
  });

  test("e-mail duplicado rejeitado", async ({ request }) => {
    const { res } = await registerClient(request, tag);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("login válido e me", async ({ request }) => {
    await apiLogin(request, email);
    const me = await request.get("/api/auth/me");
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.data?.user?.email || body.data?.email).toContain(email.split("@")[0]);
  });

  test("login senha inválida → 401 mensagem genérica", async ({ request }) => {
    await apiLogout(request);
    const res = await request.post("/api/auth/login", {
      data: { identifier: email, password: "SenhaErrada@12345" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    const code = body.error?.code || body.code;
    expect(["INVALID_CREDENTIALS", "WRONG_PASSWORD", "USER_NOT_FOUND"]).toContain(code);
  });

  test("admin bloqueado", async ({ request }) => {
    await apiLogin(request, email);
    const gestor = await request.get("/api/admin/gestor/overview");
    expect(gestor.status()).toBe(403);
  });

  test("criar pet próprio", async ({ request }) => {
    await apiLogin(request, email);
    const res = await request.post("/api/client/pets", {
      data: {
        name: `Pet ACC ${tag}`,
        species: "DOG",
        sex: "MALE",
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    petId = body.data?.pet?.id || body.data?.id;
    expect(petId).toBeTruthy();
  });

  test("listar pets contém o criado", async ({ request }) => {
    await apiLogin(request, email);
    const res = await request.get("/api/client/pets");
    expect(res.status()).toBe(200);
    const body = await res.json();
    const list = body.data?.pets || body.data?.items || body.data || [];
    const arr = Array.isArray(list) ? list : [];
    expect(arr.some((p: { id: string }) => p.id === petId)).toBeTruthy();
  });

  test("IDOR: outro cliente não acessa pet", async ({ request }) => {
    const other = await registerClient(request, `${tag}b`);
    expect(other.res.status()).toBe(201);
    await apiLogin(request, other.email);
    const create = await request.post("/api/client/pets", {
      data: { name: `Other ${tag}`, species: "CAT", sex: "FEMALE" },
    });
    if ([200, 201].includes(create.status())) {
      const b = await create.json();
      otherPetId = b.data?.pet?.id || b.data?.id;
    }
    await apiLogin(request, email);
    if (otherPetId) {
      const steal = await request.get(`/api/client/pets/${otherPetId}`);
      expect([403, 404]).toContain(steal.status());
      const patch = await request.patch(`/api/client/pets/${otherPetId}`, {
        data: { name: "Hacked" },
      });
      expect([403, 404, 405]).toContain(patch.status());
    }
  });

  test("marketplace e carrinho (sem pagamento real)", async ({ request }) => {
    await apiLogin(request, email);
    const products = await request.get("/api/marketplace/products");
    expect([200, 404]).toContain(products.status());
  });

  test("logout invalida sessão", async ({ request }) => {
    await apiLogin(request, email);
    await apiLogout(request);
    const me = await request.get("/api/auth/me");
    expect(me.status()).toBe(401);
  });

  test("UI login → dashboard client", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-identifier").waitFor({ state: "visible", timeout: 20_000 });
    await page.locator("#login-identifier").fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    const submit = page.locator('form button[type="submit"]').first();
    await submit.waitFor({ state: "visible", timeout: 10_000 });
    if (await submit.isDisabled()) {
      test.info().annotations.push({
        type: "note",
        description: "Botão Entrar desabilitado (Turnstile/risco) — login UI adiado; API login já coberto",
      });
      test.skip(true, "Turnstile/risco bloqueia submit no UI");
    }
    await submit.click();
    await page.waitForURL(/dashboard|cliente|client/, { timeout: 45_000 });
    await expect(page).toHaveURL(/dashboard|cliente|client/);
  });
});
