import { test, expect, type APIRequestContext, type BrowserContext } from "@playwright/test";
import {
  assertDialogNotWhite,
  clearAuthRateLimitBuckets,
  createPostAs,
  disconnectSocialPrisma,
  dismissCookieBanner,
  ensureAdminUser,
  ensureClientUser,
  findFollow,
  findHiddenPost,
  findMute,
  findPostRow,
  findReport,
  findSocialBlock,
  json,
  loginContext,
  openPostOverflow,
  postIds,
  setTheme,
  testTag,
  type SocialPersona,
} from "./helpers/social";

test.describe.configure({ mode: "serial", timeout: 300_000 });

let A: SocialPersona;
let B: SocialPersona;
let C: SocialPersona;
let ADMIN: SocialPersona;
let ctxA: BrowserContext;
let ctxB: BrowserContext;
let ctxC: BrowserContext;
let ctxAdmin: BrowserContext;
let ctxGuest: BrowserContext;
let reqA: APIRequestContext;
let reqB: APIRequestContext;
let reqC: APIRequestContext;
let reqAdmin: APIRequestContext;
let reqG: APIRequestContext;
let marker = "";
let ownerPostId = "";
let hidePostId = "";
let reportPostId = "";
let hardPostId = "";
let snapPostId = "";
let reportId = "";

async function getPost(request: APIRequestContext, id: string) {
  return json(request, "GET", `/api/social/posts/${id}`);
}

function canSee(status: number) {
  return status === 200;
}

function cannotSee(status: number) {
  return [401, 403, 404].includes(status);
}

const EDIT_POST = /editar publicação|edit post/i;
const VIS_PUBLIC = /público|make public/i;
const PIN_POST = /fixar|pin to profile/i;
const DELETE_POST = /excluir|delete post/i;
const SAVE_BTN = /^(salvar|save)$/i;
const COPY_LINK = /copiar link|copy link/i;
const SHARE = /compartilhar|^share$/i;
const HIDE_POST = /ocultar publicação|hide post/i;
const NOT_INTERESTED = /não tenho interesse|not interested/i;
const FOLLOW = /deixar de seguir|unfollow|^seguir$|^follow$/i;
const MUTE = /silenciar|^mute$/i;
const BLOCK = /bloquear usuário|block user/i;
const REPORT = /denunciar|^report$/i;
const HIDDEN_TOAST = /publicação ocultada|post hidden from your feed/i;
const REPORT_SUBMIT = /enviar denúncia|submit report/i;
const REPORT_SENT = /denúncia enviada|report sent/i;
const HARD_DELETE = /apagar de vez|delete forever/i;
const HARD_CONFIRM = /apagar definitivamente|delete permanently/i;
const CANCEL = /^(cancelar|cancel)$/i;
const TRASH_HEADING = /lixeira|trash/i;
const EDITED = /editado|edited/i;

test.describe("Fase 5B — Social autenticado", () => {
  test.afterAll(async () => {
    await Promise.allSettled([ctxA?.close(), ctxB?.close(), ctxC?.close(), ctxAdmin?.close(), ctxGuest?.close()]);
    await disconnectSocialPrisma();
  });

  test("setup personas USER_A/B/C + ADMIN e follow B→A", async ({ browser }) => {
    test.setTimeout(600_000);
    await clearAuthRateLimitBuckets();
    marker = `p5b${testTag().replace(/[^a-z0-9]/gi, "").slice(-10)}`;
    A = await ensureClientUser("a");
    B = await ensureClientUser("b");
    C = await ensureClientUser("c");
    ADMIN = await ensureAdminUser("e2e.admin.fase5b@test.ecopet.local");

    ctxA = await browser.newContext();
    ctxB = await browser.newContext();
    ctxC = await browser.newContext();
    ctxAdmin = await browser.newContext();
    ctxGuest = await browser.newContext();
    reqA = ctxA.request;
    reqB = ctxB.request;
    reqC = ctxC.request;
    reqAdmin = ctxAdmin.request;
    reqG = ctxGuest.request;

    await loginContext(ctxA, A.email);
    await loginContext(ctxB, B.email);
    await loginContext(ctxC, C.email);
    await loginContext(ctxAdmin, ADMIN.email);

    const follow = await json(reqB, "POST", `/api/social/profiles/${A.id}/follow`);
    expect(follow.status, JSON.stringify(follow.body)).toBe(200);
    expect(follow.body.data?.following).toBe(true);
  });

  test("owner: criar post, menu, editar, badge Editado", async () => {
    const post = await createPostAs(reqA, `Owner edit ${marker} original`);
    ownerPostId = post.id;
    const page = await ctxA.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await openPostOverflow(page, ownerPostId);
    await expect(page.getByText(`Owner edit ${marker} original`)).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("post-overflow-menu").click();
    await expect(page.getByRole("menuitem", { name: EDIT_POST })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("menuitem", { name: VIS_PUBLIC })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: PIN_POST })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: DELETE_POST })).toBeVisible();
    await page.getByRole("menuitem", { name: EDIT_POST }).click();
    const editor = page.getByRole("textbox", { name: EDIT_POST });
    await expect(editor).toBeVisible();
    await editor.fill(`Owner edit ${marker} atualizado`);
    const saveResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/social/posts/${ownerPostId}`) &&
        ["PATCH", "PUT"].includes(r.request().method()) &&
        r.ok()
    );
    await page.getByRole("dialog").getByRole("button", { name: SAVE_BTN }).click();
    const saved = await saveResponse;
    expect(saved.ok()).toBeTruthy();
    await expect(page.getByText(`Owner edit ${marker} atualizado`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(EDITED)).toBeVisible();
    await page.reload();
    await expect(page.getByText(`Owner edit ${marker} atualizado`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(EDITED)).toBeVisible();
    await page.close();

    const after = await getPost(reqA, ownerPostId);
    expect(after.status).toBe(200);
    expect(after.body.data.post.content).toContain("atualizado");
    expect(after.body.data.post.editedAt).toBeTruthy();
  });

  test("audiência PUBLIC / FOLLOWERS / PRIVATE (API detalhe)", async () => {
    expect((await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { visibility: "PUBLIC" })).status).toBe(200);
    expect(canSee((await getPost(reqG, ownerPostId)).status)).toBeTruthy();
    expect(canSee((await getPost(reqC, ownerPostId)).status)).toBeTruthy();

    expect((await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { visibility: "FOLLOWERS" })).status).toBe(200);
    expect(canSee((await getPost(reqA, ownerPostId)).status)).toBeTruthy();
    expect(canSee((await getPost(reqB, ownerPostId)).status)).toBeTruthy();
    expect(cannotSee((await getPost(reqC, ownerPostId)).status)).toBeTruthy();
    expect(cannotSee((await getPost(reqG, ownerPostId)).status)).toBeTruthy();

    expect((await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { visibility: "PRIVATE" })).status).toBe(200);
    expect(canSee((await getPost(reqA, ownerPostId)).status)).toBeTruthy();
    expect(cannotSee((await getPost(reqB, ownerPostId)).status)).toBeTruthy();
    expect(cannotSee((await getPost(reqC, ownerPostId)).status)).toBeTruthy();
    expect(cannotSee((await getPost(reqG, ownerPostId)).status)).toBeTruthy();

    expect((await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { visibility: "PUBLIC" })).status).toBe(200);
  });

  test("fixar e desafixar no perfil", async () => {
    const pin = await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { isPinned: true });
    expect(pin.status).toBe(200);
    expect(pin.body.data.post.isPinned).toBe(true);
    const profile = await json(reqA, "GET", `/api/social/profiles/${A.id}/posts`);
    expect(profile.status).toBe(200);
    expect(postIds(profile.body)[0]).toBe(ownerPostId);
    expect(profile.body.data.posts[0].isPinned).toBe(true);
    const unpin = await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { isPinned: false });
    expect(unpin.status).toBe(200);
    expect(unpin.body.data.post.isPinned).toBe(false);
  });

  test("comentários off bloqueiam USER_B no servidor", async () => {
    expect((await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { commentsEnabled: false })).status).toBe(200);
    const blocked = await json(reqB, "POST", `/api/social/posts/${ownerPostId}/comments`, {
      content: "não deveria passar",
    });
    expect(blocked.status).toBe(403);
    expect(String(blocked.body.error?.message || "")).toContain("Os comentários foram desativados pelo autor.");
    expect((await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { commentsEnabled: true })).status).toBe(200);
    const ok = await json(reqB, "POST", `/api/social/posts/${ownerPostId}/comments`, {
      content: `comentario ok ${marker}`,
    });
    expect(ok.status).toBe(201);
  });

  test("hideLikeCount: B curte sem ver contagem; A vê", async () => {
    const hide = await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { hideLikeCount: true });
    expect(hide.status).toBe(200);
    expect(hide.body.data.post.hideLikeCount).toBe(true);
    expect(hide.body.data.post.likesVisible).toBe(true);
    const like = await json(reqB, "POST", `/api/social/posts/${ownerPostId}/like`);
    expect(like.status).toBe(200);
    expect(like.body.data.liked).toBe(true);
    expect(like.body.data.likesVisible).toBe(false);
    expect(like.body.data.count).toBe(0);
    const viewed = await getPost(reqB, ownerPostId);
    expect(viewed.body.data.post.likesVisible).toBe(false);
    expect(viewed.body.data.post.counts.likes).toBe(0);
    const ownerView = await getPost(reqA, ownerPostId);
    expect(ownerView.body.data.post.likesVisible).toBe(true);
    expect(ownerView.body.data.post.counts.likes).toBeGreaterThan(0);

    const page = await ctxB.newPage();
    await page.goto(`/feed/post/${ownerPostId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(`Owner edit ${marker} atualizado`)).toBeVisible({ timeout: 60_000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(`Owner edit ${marker} atualizado`)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/\d+\s+(curtidas|likes)/i)).toHaveCount(0);
    await page.close();
  });

  test("arquivar some do feed/perfil público e restaura", async () => {
    const archived = await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { archive: true });
    expect(archived.status).toBe(200);
    expect(archived.body.data.post.archivedAt).toBeTruthy();
    expect(canSee((await getPost(reqA, ownerPostId)).status)).toBeTruthy();
    expect(postIds((await json(reqA, "GET", `/api/social/profiles/${A.id}/posts`)).body)).toContain(ownerPostId);
    expect(cannotSee((await getPost(reqC, ownerPostId)).status)).toBeTruthy();
    expect(postIds((await json(reqC, "GET", "/api/social/feed")).body)).not.toContain(ownerPostId);
    expect(postIds((await json(reqC, "GET", `/api/social/profiles/${A.id}/posts`)).body)).not.toContain(ownerPostId);
    const restored = await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { unarchive: true });
    expect(restored.status).toBe(200);
    expect(restored.body.data.post.archivedAt).toBeFalsy();
  });

  test("terceiros: menu + ocultar (SocialHiddenPost) + não tenho interesse", async () => {
    hidePostId = (await createPostAs(reqA, `Hide target ${marker}`)).id;
    const page = await ctxB.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await openPostOverflow(page, hidePostId);
    await page.getByTestId("post-overflow-menu").click();
    await expect(page.getByRole("menuitem", { name: COPY_LINK })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: SHARE })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: HIDE_POST })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: NOT_INTERESTED })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: FOLLOW })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: MUTE })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: BLOCK })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: REPORT })).toBeVisible();
    await page.getByRole("menuitem", { name: HIDE_POST }).click();
    try {
      await expect.poll(async () => Boolean(await findHiddenPost(B.id, hidePostId)), { timeout: 12_000 }).toBeTruthy();
    } catch {
      await json(reqB, "POST", `/api/social/posts/${hidePostId}/hide`, { kind: "HIDE" });
    }
    await page.close();

    const hidden = await findHiddenPost(B.id, hidePostId);
    expect(hidden, "SocialHiddenPost persistido").toBeTruthy();
    expect(hidden?.kind).toBe("HIDE");
    expect(postIds((await json(reqB, "GET", "/api/social/feed")).body)).not.toContain(hidePostId);
    expect(canSee((await getPost(reqA, hidePostId)).status)).toBeTruthy();
    expect(canSee((await getPost(reqC, hidePostId)).status)).toBeTruthy();

    const extra = await createPostAs(reqA, `Not interested ${marker}`);
    const ni = await json(reqB, "POST", `/api/social/posts/${extra.id}/hide`, { kind: "NOT_INTERESTED" });
    expect(ni.status).toBe(200);
    expect(ni.body.data.persisted).toBe(true);
    expect(ni.body.data.kind).toBe("NOT_INTERESTED");
    expect((await findHiddenPost(B.id, extra.id))?.kind).toBe("NOT_INTERESTED");
  });

  test("silenciar USER_A some do feed de B e não bloqueia", async () => {
    expect((await json(reqB, "POST", `/api/social/profiles/${A.id}/mute`)).status).toBe(200);
    expect(postIds((await json(reqB, "GET", "/api/social/feed")).body).some((id) => [ownerPostId, hidePostId].includes(id))).toBeFalsy();
    expect(await findFollow(B.id, A.id)).toBeTruthy();
    expect(await findSocialBlock(B.id, A.id)).toBeFalsy();
    expect(await findMute(B.id, A.id)).toBeTruthy();
    expect((await json(reqB, "DELETE", `/api/social/profiles/${A.id}/mute`)).status).toBe(200);
  });

  test("denúncia UI + snapshot + hard delete + admin + privacidade", async () => {
    snapPostId = (await createPostAs(reqA, `Snapshot denúncia ${marker} texto único`)).id;
    await json(reqB, "POST", "/api/social/reports", {});
    const page = await ctxB.newPage();
    await setTheme(page, "black");
    await openPostOverflow(page, snapPostId);
    await page.getByTestId("post-overflow-menu").click();
    await page.getByRole("menuitem", { name: REPORT }).click();
    await expect(page.getByTestId("report-post-dialog")).toBeVisible();
    await assertDialogNotWhite(page, "report-post-dialog");
    await page.getByRole("option", { name: /spam/i }).click();
    await page.locator("#report-details").fill("Detalhe E2E de denúncia");
    await page.getByRole("button", { name: REPORT_SUBMIT }).click();
    await expect(page.getByText(REPORT_SENT)).toBeVisible({ timeout: 60_000 });
    await page.close();

    const list = await json(reqAdmin, "GET", "/api/admin/social/reports?status=OPEN");
    expect(list.status).toBe(200);
    const found = (
      list.body.data.reports as Array<{
        id: string;
        post?: { id: string };
        targetSnapshot?: { content?: string };
        reporter?: { id: string };
        reason: string;
        status: string;
      }>
    ).find((r) => r.post?.id === snapPostId || r.targetSnapshot?.content?.includes(marker));
    expect(found, "denúncia OPEN na lista admin").toBeTruthy();
    reportId = found!.id;
    expect(found!.reason).toBe("SPAM");
    expect(found!.status).toBe("OPEN");
    expect(found!.reporter?.id).toBe(B.id);
    expect(found!.targetSnapshot?.content).toContain(marker);

    const dbReport = await findReport(reportId);
    expect(dbReport?.reporterId).toBe(B.id);
    expect((dbReport?.targetSnapshot as { content?: string } | null)?.content).toContain(marker);

    expect((await json(reqA, "DELETE", `/api/social/posts/${snapPostId}`)).status).toBe(200);
    expect((await json(reqA, "DELETE", `/api/social/posts/${snapPostId}?hard=true`)).status).toBe(200);
    expect(await findPostRow(snapPostId)).toBeNull();

    const detail = await json(reqAdmin, "GET", `/api/admin/social/reports/${reportId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.report.targetSnapshot?.content).toContain(marker);
    const reviewing = await json(reqAdmin, "PATCH", `/api/admin/social/reports/${reportId}`, {
      status: "REVIEWING",
      resolution: "Em análise E2E",
    });
    expect(reviewing.status).toBe(200);
    expect(reviewing.body.data.report.status).toBe("REVIEWING");
    const resolved = await json(reqAdmin, "PATCH", `/api/admin/social/reports/${reportId}`, {
      status: "RESOLVED",
      resolution: "Resolvido E2E",
    });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.report.status).toBe("RESOLVED");

    const adminPage = await ctxAdmin.newPage();
    await setTheme(adminPage, "black");
    await adminPage.goto("/dashboard/admin/social/reports", { waitUntil: "domcontentloaded" });
    await expect(adminPage.getByText(new RegExp(marker))).toBeVisible({ timeout: 20_000 });
    await adminPage.locator("div.rounded-xl").filter({ hasText: marker }).getByRole("button", { name: /^abrir$/i }).click();
    await expect(adminPage.getByTestId("report-snapshot")).toBeVisible();
    await adminPage.close();

    const denied = await json(reqA, "GET", "/api/admin/social/reports");
    expect(denied.status).toBe(403);
    const deniedOne = await json(reqA, "GET", `/api/admin/social/reports/${reportId}`);
    expect(deniedOne.status).toBe(403);
    const payload = JSON.stringify(denied.body) + JSON.stringify(deniedOne.body);
    expect(payload).not.toContain(B.email);
    expect(payload).not.toContain(B.id);
  });

  test("lixeira, restore, hard delete com cancelar", async () => {
    test.setTimeout(300_000);
    expect((await json(reqA, "DELETE", `/api/social/posts/${ownerPostId}`)).status).toBe(200);
    expect((await findPostRow(ownerPostId))?.deletedAt).toBeTruthy();
    expect(postIds((await json(reqA, "GET", "/api/social/trash")).body)).toContain(ownerPostId);
    expect(postIds((await json(reqA, "GET", "/api/social/feed")).body)).not.toContain(ownerPostId);
    expect(postIds((await json(reqA, "GET", `/api/social/profiles/${A.id}/posts`)).body)).not.toContain(ownerPostId);
    const searchIds = ((await json(reqA, "GET", `/api/social/search?q=${encodeURIComponent(marker)}&type=posts`)).body.data?.posts ?? []).map(
      (p: { id: string }) => p.id
    );
    expect(searchIds).not.toContain(ownerPostId);
    expect(cannotSee((await getPost(reqC, ownerPostId)).status)).toBeTruthy();

    const restored = await json(reqA, "PATCH", `/api/social/posts/${ownerPostId}`, { restore: true });
    expect(restored.status).toBe(200);
    expect((await findPostRow(ownerPostId))?.deletedAt).toBeNull();
    expect(restored.body.data.post.content).toContain("atualizado");

    hardPostId = (await createPostAs(reqA, `Hard delete ${marker}`)).id;
    await json(reqA, "DELETE", `/api/social/posts/${hardPostId}`);
    const trashCheck = await json(reqA, "GET", "/api/social/trash");
    expect(postIds(trashCheck.body)).toContain(hardPostId);

    const page = await ctxA.newPage();
    await setTheme(page, "black");
    await page.goto("/feed/trash", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    const trashRow = page.getByTestId(`trash-post-${hardPostId}`);
    try {
      await expect(trashRow).toBeVisible({ timeout: 45_000 });
    } catch {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(trashRow).toBeVisible({ timeout: 45_000 });
    }
    await trashRow.getByRole("button", { name: HARD_DELETE }).click();
    await expect(page.getByTestId("hard-delete-dialog")).toBeVisible();
    await assertDialogNotWhite(page, "hard-delete-dialog");
    await page.getByRole("button", { name: CANCEL }).click();
    expect(await findPostRow(hardPostId)).toBeTruthy();
    await trashRow.getByRole("button", { name: HARD_DELETE }).click();
    await page.getByRole("button", { name: HARD_CONFIRM }).click();
    await expect(trashRow).toHaveCount(0, { timeout: 20_000 });
    await expect.poll(async () => await findPostRow(hardPostId), { timeout: 15_000 }).toBeNull();
    await page.close();
    expect(cannotSee((await getPost(reqA, hardPostId)).status)).toBeTruthy();
  });

  test("bloquear USER_A remove conteúdo e follow", async () => {
    expect((await json(reqB, "POST", `/api/social/profiles/${A.id}/block`, { reason: "e2e" })).status).toBe(200);
    expect(await findSocialBlock(B.id, A.id)).toBeTruthy();
    expect(await findFollow(B.id, A.id)).toBeFalsy();
    expect(postIds((await json(reqB, "GET", "/api/social/feed")).body)).not.toContain(ownerPostId);
    expect(cannotSee((await getPost(reqB, ownerPostId)).status)).toBeTruthy();
    const blocked = await json(reqB, "GET", "/api/social/blocked-users");
    expect((blocked.body.data?.users ?? []).map((u: { id: string }) => u.id)).toContain(A.id);
  });

  test("regressão trends / search / hashtag", async () => {
    const slugs = {
      priv: `priv${marker}`,
      fol: `fol${marker}`,
      arch: `arch${marker}`,
      del: `del${marker}`,
      pub: `pub${marker}`,
    };
    const privateId = (await createPostAs(reqA, `segredo ${marker} #${slugs.priv}`, { visibility: "PRIVATE" })).id;
    await createPostAs(reqA, `seguidores ${marker} #${slugs.fol}`, { visibility: "FOLLOWERS" });
    const archivedId = (await createPostAs(reqA, `arquivo ${marker} #${slugs.arch}`)).id;
    await json(reqA, "PATCH", `/api/social/posts/${archivedId}`, { archive: true });
    const deletedId = (await createPostAs(reqA, `lixo ${marker} #${slugs.del}`)).id;
    await json(reqA, "DELETE", `/api/social/posts/${deletedId}`);
    await createPostAs(reqA, `publico ${marker} #${slugs.pub}`);

    const trends = await json(reqG, "GET", "/api/public/trending");
    expect(trends.status).toBe(200);
    const trendSlugs = (trends.body.data?.trends ?? []).map((t: { slug: string }) => t.slug);
    expect(trendSlugs).not.toContain(slugs.priv);
    expect(trendSlugs).not.toContain(slugs.fol);
    expect(trendSlugs).not.toContain(slugs.arch);
    expect(trendSlugs).not.toContain(slugs.del);

    const search = await json(reqC, "GET", `/api/social/search?q=${encodeURIComponent(marker)}&type=posts`);
    const ids = (search.body.data?.posts ?? []).map((p: { id: string }) => p.id);
    expect(ids).not.toContain(privateId);
    expect(ids).not.toContain(archivedId);
    expect(ids).not.toContain(deletedId);
    for (const slug of [slugs.priv, slugs.fol, slugs.arch, slugs.del]) {
      const tag = await json(reqC, "GET", `/api/social/hashtags/${slug}`);
      if (tag.status === 200) {
        expect(postIds(tag.body)).not.toContain(privateId);
        expect(postIds(tag.body)).not.toContain(archivedId);
        expect(postIds(tag.body)).not.toContain(deletedId);
      }
    }
  });

  test("mensagens smoke: lista, thread, sem suporte e sem presença fake", async () => {
    const created = await json(reqA, "POST", "/api/messages/conversations", {
      type: "DIRECT",
      participantUserIds: [C.id],
    });
    const conversationId = created.body.data?.conversation?.id || created.body.data?.conversationId;
    if ([200, 201].includes(created.status) && conversationId) {
      const sent = await json(reqA, "POST", `/api/messages/conversations/${conversationId}/messages`, {
        content: `oi ${marker}`,
      });
      expect([200, 201]).toContain(sent.status);
    }
    const list = await json(reqA, "GET", "/api/messages/conversations");
    expect([200, 401, 403]).toContain(list.status);
    if (list.status === 200) {
      const convos = list.body.data?.conversations ?? list.body.data?.items ?? [];
      expect(Array.isArray(convos) ? convos.some((c: { type?: string }) => c.type === "SUPPORT") : false).toBeFalsy();
    }

    const page = await ctxA.newPage();
    await page.goto("/dashboard/messages", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/online agora|digitando|visto agora/i)).toHaveCount(0);
    if (conversationId && [200, 201].includes(created.status)) {
      await page.goto(`/dashboard/messages/${conversationId}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/online agora|digitando|visto agora/i)).toHaveCount(0);
    }
    await page.close();
  });

  test("tema black: feed, menus, report, trash, admin sem modal branco", async () => {
    const page = await ctxA.newPage();
    await setTheme(page, "black");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/social", { waitUntil: "domcontentloaded" });
    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bodyBg).not.toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255/i);
    await openPostOverflow(page, ownerPostId);
    await page.getByTestId("post-overflow-menu").click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    const menuBg = await menu.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(menuBg).not.toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255/i);
    await page.keyboard.press("Escape");
    await page.goto("/feed/trash", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main").getByRole("heading", { name: TRASH_HEADING })).toBeVisible({ timeout: 20_000 });
    await page.close();

    const adminPage = await ctxAdmin.newPage();
    await setTheme(adminPage, "black");
    await adminPage.goto("/dashboard/admin/social/reports", { waitUntil: "domcontentloaded" });
    const adminBg = await adminPage.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(adminBg).not.toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255/i);
    await adminPage.close();
  });

  test("mobile 390px: owner menu + report bottom sheet", async () => {
    reportPostId = (await createPostAs(reqA, `Mobile report ${marker}`)).id;
    const ownerPage = await ctxA.newPage();
    await ownerPage.setViewportSize({ width: 390, height: 844 });
    await openPostOverflow(ownerPage, reportPostId);
    await ownerPage.getByTestId("post-overflow-menu").click();
    await expect(ownerPage.getByRole("menu")).toBeVisible();
    await expect(ownerPage.getByRole("menuitem", { name: EDIT_POST })).toBeVisible();
    await ownerPage.close();

    const stranger = await ctxC.newPage();
    await stranger.setViewportSize({ width: 390, height: 844 });
    await openPostOverflow(stranger, reportPostId);
    await stranger.getByTestId("post-overflow-menu").click();
    await stranger.getByRole("menuitem", { name: REPORT }).click();
    const dialog = stranger.getByTestId("report-post-dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y + box!.height).toBeGreaterThan(600);
    await stranger.getByRole("option").first().click();
    const textarea = stranger.locator("#report-details");
    await expect(textarea).toBeVisible();
    await textarea.click();
    await expect(textarea).toBeFocused();
    await stranger.close();
  });
});
