/**
 * Helpers E2E / aceitação — dados sintetizados @test.ecopet.local
 * Nunca usar e-mails, CPF ou telefones reais.
 */
import { expect, type APIRequestContext } from "@playwright/test";

export const TEST_PASSWORD = "Ecopet@Forte2026";
export const TEST_EMAIL_DOMAIN = "test.ecopet.local";

export function testTag(): string {
  return `acc${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function testEmail(role: string, tag = testTag()): string {
  return `e2e.${role.toLowerCase()}.${tag}@${TEST_EMAIL_DOMAIN}`;
}

export function testPhone(seed: number): string {
  return `+55119${String(Math.abs(seed)).replace(/\D/g, "").padStart(8, "0").slice(-8)}`;
}

/** CNPJ válido sintético (algoritmo dígitos verificadores). */
export function validTestCnpj(seed: number): string {
  const n = String(Math.abs(seed)).padStart(12, "0").slice(-12).split("").map(Number);
  const calc = (base: number[], factors: number[]) => {
    const sum = base.reduce((acc, d, i) => acc + d * factors[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(n, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc([...n, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${n.join("")}${d1}${d2}`;
}

export async function apiLogin(request: APIRequestContext, email: string, password = TEST_PASSWORD) {
  let res = await request.post("/api/auth/login", {
    data: { identifier: email, email, password },
  });
  for (let i = 0; i < 4 && res.status() === 429; i++) {
    await new Promise((r) => setTimeout(r, 2500 * (i + 1)));
    res = await request.post("/api/auth/login", {
      data: { identifier: email, email, password },
    });
  }
  expect(res.status(), `login ${email}`).toBe(200);
  return res.json();
}

export async function apiLogout(request: APIRequestContext) {
  await request.post("/api/auth/logout");
}

export async function registerClient(request: APIRequestContext, tag = testTag()) {
  const email = testEmail("client", tag);
  const uniq = `${Date.now()}${Math.floor(Math.random() * 1e9)}`;
  const payload = {
    role: "CLIENT" as const,
    name: `ACC Cliente ${tag}`,
    email,
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
    phone: `+55119${uniq.slice(-8)}`,
    birthDate: "1990-03-10",
    username: `u${uniq}`.slice(0, 20).toLowerCase(),
    gender: "MASCULINO",
    acceptTerms: true,
    acceptPrivacy: true,
  };
  await request.post("/api/auth/test/reset-rate-limit", { data: {} }).catch(() => undefined);
  let res = await request.post("/api/auth/register", { data: payload });
  for (let i = 0; i < 3 && res.status() === 429; i++) {
    await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    res = await request.post("/api/auth/register", { data: payload });
  }
  return { res, email, tag };
}

export async function registerPartner(request: APIRequestContext, tag = testTag()) {
  const email = testEmail("partner", tag);
  const uniq = `${Date.now()}${Math.floor(Math.random() * 1e9)}`;
  const seed = Number(uniq.slice(-10));
  const res = await request.post("/api/auth/register", {
    data: {
      role: "PARTNER",
      name: `ACC Parceiro ${tag}`,
      email,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      phone: `+55119${uniq.slice(-8)}`,
      businessName: `Petshop ACC ${tag}`,
      legalName: `Petshop ACC ${tag} LTDA`,
      cnpj: validTestCnpj(seed),
      category: "Pet Shop",
      address: "Rua Teste ACC, 100",
      city: "Sao Paulo",
      state: "SP",
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });
  if (res.status() === 429) {
    await new Promise((r) => setTimeout(r, 8000));
    return registerPartner(request, `${tag}r`);
  }
  return { res, email, tag };
}

export async function registerNgo(request: APIRequestContext, tag = testTag()) {
  const email = testEmail("ngo", tag);
  const uniq = `${Date.now()}${Math.floor(Math.random() * 1e9)}`;
  const seed = Number(uniq.slice(-10)) + 99;
  const res = await request.post("/api/auth/register", {
    data: {
      role: "ONG",
      name: `ACC ONG ${tag}`,
      email,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      phone: `+55119${String(Number(uniq.slice(-8)) + 1).padStart(8, "0").slice(-8)}`,
      ongName: `ONG ACC ${tag}`,
      responsibleName: `Responsavel ACC ${tag}`,
      cnpj: validTestCnpj(seed),
      address: "Rua ONG ACC, 50",
      city: "Sao Paulo",
      state: "SP",
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });
  if (res.status() === 429) {
    await new Promise((r) => setTimeout(r, 8000));
    return registerNgo(request, `${tag}r`);
  }
  return { res, email, tag };
}
