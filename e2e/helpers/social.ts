import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";
import { TEST_PASSWORD, apiLogin, apiLogout, testEmail, testTag } from "./acceptance";
import { loadWebRuntimeEnv } from "./load-web-env";

loadWebRuntimeEnv();

const prisma = new PrismaClient({
  datasources: process.env.DATABASE_URL ? { db: { url: process.env.DATABASE_URL } } : undefined,
});

export { TEST_PASSWORD, testTag, apiLogin, apiLogout };

export type SocialPersona = {
  id: string;
  email: string;
  name: string;
};

export async function json(
  request: APIRequestContext,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  data?: unknown
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res =
        method === "GET"
          ? await request.get(path)
          : method === "DELETE"
            ? await request.delete(path)
            : method === "PATCH"
              ? await request.patch(path, { data })
              : method === "PUT"
                ? await request.put(path, { data })
                : await request.post(path, { data });
      const body = await res.json().catch(() => ({}));
      return { status: res.status(), body, res };
    } catch (error) {
      lastError = error;
      const msg = String(error);
      if (!/ECONNRESET|ECONNREFUSED|socket hang up/i.test(msg) || attempt === 2) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function resetSocialTestLimits(request: APIRequestContext) {
  await request.post("/api/auth/test/reset-rate-limit", { data: {} }).catch(() => undefined);
  await request.post("/api/social/test/reset-rate-limit", { data: {} }).catch(() => undefined);
}

export async function clearAuthRateLimitBuckets() {
  await prisma.rateLimitBucket.deleteMany({
    where: { id: { startsWith: "login:" } },
  });
  await prisma.rateLimitBucket.deleteMany({
    where: { id: { startsWith: "register:" } },
  });
}

export async function ensureClientUser(label: string): Promise<SocialPersona> {
  const tag = `${label}${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/[^a-z0-9]/gi, "").slice(0, 18);
  const email = testEmail("client", tag);
  const hash = await bcrypt.hash(TEST_PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: `ACC Cliente ${tag}`,
      passwordHash: hash,
      role: UserRole.CLIENT,
      accountStatus: AccountStatus.ACTIVE,
      phone: `+55118${String(Math.floor(Math.random() * 90_000_000) + 10_000_000)}`,
      username: `u${tag}`.slice(0, 20).toLowerCase(),
      birthDate: new Date("1990-03-10"),
      gender: "MASCULINO",
      termsAcceptedAt: new Date(),
      lgpdAcceptedAt: new Date(),
    },
  });
  return { id: user.id, email, name: user.name };
}

export async function ensureAdminUser(email: string, name = "Admin Social E2E"): Promise<SocialPersona> {
  const hash = await bcrypt.hash(TEST_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: `1198${String(Date.now()).slice(-7)}`,
    },
    update: { role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE, passwordHash: hash, name },
  });
  return { id: admin.id, email, name };
}

export async function loginContext(ctx: BrowserContext, email: string) {
  let res = await ctx.request.post("/api/auth/login", {
    data: { email, password: TEST_PASSWORD, identifier: email },
  });
  if (res.status() === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await ctx.request.post("/api/auth/login", {
      data: { email, password: TEST_PASSWORD, identifier: email },
    });
  }
  expect(res.status(), `context login ${email}`).toBe(200);
}

export async function createPostAs(
  request: APIRequestContext,
  content: string,
  extra: Record<string, unknown> = {}
) {
  const { status, body } = await json(request, "POST", "/api/social/posts", { content, ...extra });
  expect(status, `create post ${content.slice(0, 40)}`).toBe(201);
  const post = body.data?.post;
  expect(post?.id).toBeTruthy();
  return post as {
    id: string;
    content: string;
    visibility: string;
    editedAt?: string | null;
    deletedAt?: string | null;
    hideLikeCount?: boolean;
    likesVisible?: boolean;
    isPinned?: boolean;
    commentsEnabled?: boolean;
    archivedAt?: string | null;
  };
}

export function postIds(body: { data?: { posts?: { id: string }[] } }) {
  return (body.data?.posts ?? []).map((p) => p.id);
}

export async function asUser<T>(request: APIRequestContext, email: string, fn: () => Promise<T>): Promise<T> {
  await apiLogin(request, email);
  try {
    return await fn();
  } finally {
    await apiLogout(request);
  }
}

export async function findHiddenPost(userId: string, postId: string) {
  return prisma.socialHiddenPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
}

export async function findPostRow(id: string) {
  return prisma.socialPost.findUnique({ where: { id } });
}

export async function findReport(id: string) {
  return prisma.socialReport.findUnique({
    where: { id },
    include: { reporter: { select: { id: true, email: true, name: true } } },
  });
}

export async function findFollow(followerId: string, followingId: string) {
  return prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
}

export async function findMute(muterId: string, mutedId: string) {
  return prisma.userSocialMute.findUnique({
    where: { muterId_mutedId: { muterId, mutedId } },
  });
}

export async function findSocialBlock(blockerId: string, blockedId: string) {
  return prisma.userSocialBlock.findFirst({
    where: { blockerId, blockedId },
  });
}

export async function disconnectSocialPrisma() {
  await prisma.$disconnect().catch(() => undefined);
}

export async function setTheme(page: Page, theme: "light" | "dark" | "black") {
  await page.addInitScript((value) => {
    localStorage.setItem("ecopet-theme", value);
  }, theme);
}

export async function dismissCookieBanner(page: Page) {
  const btn = page.getByRole("button", { name: /apenas essenciais|essential only|solo esenciales/i });
  try {
    await btn.click({ timeout: 2_500 });
  } catch {
    /* banner already gone */
  }
}

export async function openPostOverflow(page: Page, postId: string) {
  await page.request.get(`/api/social/posts/${postId}`, { timeout: 20_000 }).catch(() => undefined);
  await page.goto(`/feed/post/${postId}`, { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  const crashed = page.getByRole("heading", { name: /algo deu errado|something went wrong/i });
  if (await crashed.count()) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  const menu = page.getByTestId("post-overflow-menu");
  try {
    await expect(menu).toBeVisible({ timeout: 60_000 });
  } catch {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(menu).toBeVisible({ timeout: 60_000 });
  }
}

export async function assertDialogNotWhite(page: Page, testId?: string) {
  const dialog = testId ? page.getByTestId(testId) : page.locator('[role="dialog"]').first();
  await expect(dialog).toBeVisible();
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg, `dialog background ${bg}`).not.toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255/i);
}
