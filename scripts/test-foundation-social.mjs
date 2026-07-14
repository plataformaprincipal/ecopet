/**
 * Testes Etapa 11: Feed Social Completo
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateValidCnpj } from "./cnpj-test-utils.mjs";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_RUN_IP_BASE = `10.250.${Date.now() % 200}`;
let reqSeq = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function nextTestIp() {
  reqSeq += 1;
  return `${TEST_RUN_IP_BASE}.${(reqSeq % 200) + 1}`;
}
function phoneE164(suffix) {
  return `+55119${String(suffix).replace(/\D/g, "").padStart(8, "0").slice(-8)}`;
}

const jars = new Map();

function jarFor(name) {
  if (!jars.has(name)) jars.set(name, new Map());
  return jars.get(name);
}

async function resetAuthRateLimit() {
  try {
    await fetch(`${WEB}/api/auth/test/reset-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    /* optional */
  }
  try {
    await fetch(`${WEB}/api/social/test/reset-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    /* optional until rebuild */
  }
}

async function reqAs(jarName, pathName, opts = {}) {
  const jar = jarFor(jarName);
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? nextTestIp(),
    ...(opts.headers || {}),
  };
  const cookie = jar.get("cookie");
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${WEB}${pathName}`, { ...opts, headers });
  const setCookie = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : setCookie ? [setCookie] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("cookie", session);
    if (raw.includes("Max-Age=0") || raw.includes("max-age=0")) jar.delete("cookie");
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function registerAndLogin(jarName, role, email, extra = {}) {
  const password = "Ecopet@Forte2026";
  const suffix = Date.now() + Math.floor(Math.random() * 1000);
  const base = {
    role,
    name: `Teste ${role}`,
    email,
    password,
    confirmPassword: password,
    phone: phoneE164(suffix),
    acceptTerms: true,
    acceptPrivacy: true,
    ...extra,
  };
  if (role === "CLIENT") {
    base.birthDate = "1990-01-15";
    base.username = `user${String(suffix).slice(-10)}`;
    base.gender = "MASCULINO";
  }
  if (role === "PARTNER") {
    Object.assign(base, {
      businessName: "Loja Social",
      legalName: "Loja Social LTDA",
      cnpj: generateValidCnpj(suffix),
      category: "Pet Shop",
      address: "Rua A, 100",
      city: "São Paulo",
      state: "SP",
    });
  }
  if (role === "ONG") {
    Object.assign(base, {
      ongName: "ONG Social",
      responsibleName: "Resp",
      cnpj: generateValidCnpj(suffix + 7),
      address: "Rua B, 200",
      city: "São Paulo",
      state: "SP",
    });
  }
  const reg = await reqAs(jarName, "/api/auth/register", { method: "POST", body: JSON.stringify(base) });
  assert(reg.status === 201, `${role} register → ${reg.status} ${JSON.stringify(reg.data?.error ?? {})}`);
  const login = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(login.status === 200, `${role} login`);
  return login.data.data?.user;
}

async function ensureAdmin(email) {
  const password = "Ecopet@Forte2026";
  const hash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin Social",
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: "11999990002",
    },
    update: { role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE, passwordHash: hash },
  });
  await reqAs("admin", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return admin;
}

async function activateUser(userId) {
  await prisma.user.update({ where: { id: userId }, data: { accountStatus: AccountStatus.ACTIVE } });
}

async function main() {
  await resetAuthRateLimit();
  const ts = Date.now();
  console.log("=== EcoPet Foundation Social Tests ===\n");

  const health = await reqAs("guest", "/api/health");
  assert(health.status === 200, "1 health ok");

  const client = await registerAndLogin("client", "CLIENT", `social.client.${ts}@test.ecopet.local`);
  const partner = await registerAndLogin("partner", "PARTNER", `social.partner.${ts}@test.ecopet.local`);
  // Reporter dedicado — evita colisão com rate-limit / bloqueio do partner principal
  const reporter = await registerAndLogin("reporter", "CLIENT", `social.reporter.${ts}@test.ecopet.local`);
  await activateUser(client.id);
  await activateUser(partner.id);
  await activateUser(reporter.id);

  const pendingEmail = `social.pending.${ts}@test.ecopet.local`;
  const pendingUser = await registerAndLogin("pending", "PARTNER", pendingEmail);
  // Cadastro real cria ACTIVE; forçamos PENDING só para validar o gate de conta.
  await prisma.user.update({
    where: { id: pendingUser.id },
    data: { accountStatus: AccountStatus.PENDING },
  });
  // Re-login para atualizar JWT com status PENDING
  await reqAs("pending", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: pendingEmail, password: "Ecopet@Forte2026" }),
  });

  const suspendedEmail = `social.suspended.${ts}@test.ecopet.local`;
  const suspended = await registerAndLogin("suspended", "CLIENT", suspendedEmail);
  await activateUser(suspended.id);
  await prisma.user.update({ where: { id: suspended.id }, data: { accountStatus: AccountStatus.SUSPENDED } });

  const admin = await ensureAdmin(`social.admin.${ts}@test.ecopet.local`);

  // 1 ACTIVE cria post
  const post1 = await reqAs("client", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ content: "Meu primeiro post #ecopet #pets" }),
  });
  assert(post1.status === 201, "1 ACTIVE cria post");
  const postId = post1.data.data?.post?.id;
  assert(postId, "post id");

  // 2 PENDING não cria
  const postPending = await reqAs("pending", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ content: "pending" }),
  });
  assert(postPending.status === 403, "2 PENDING não cria post");

  // 3 SUSPENDED não cria
  const postSuspended = await reqAs("suspended", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ content: "suspended" }),
  });
  assert(postSuspended.status === 403, "3 SUSPENDED não cria post");

  // 4 sem texto e sem mídia recusado
  const empty = await reqAs("client", "/api/social/posts", { method: "POST", body: JSON.stringify({}) });
  assert(empty.status === 400, "4 post vazio recusado");

  // 5 autor edita post
  const edit = await reqAs("client", `/api/social/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ content: "Post editado #ecopet" }),
  });
  assert(edit.status === 200, "5 autor edita post");
  assert(edit.data.data?.post?.editedAt, "editedAt");

  // 6 não edita post alheio
  const editOther = await reqAs("partner", `/api/social/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ content: "hack" }),
  });
  assert(editOther.status === 403, "6 não edita post alheio");

  // 7 autor soft delete
  const postDel = await reqAs("client", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ content: "post para deletar" }),
  });
  const delId = postDel.data.data?.post?.id;
  const del = await reqAs("client", `/api/social/posts/${delId}`, { method: "DELETE" });
  assert(del.status === 200, "7 autor soft delete");

  // 8 feed global lista publicado
  const feed = await reqAs("partner", "/api/social/feed");
  assert(feed.status === 200, "8 feed ok");
  assert(feed.data.data?.posts?.some((p) => p.id === postId), "8 feed lista post");

  // 9 feed não lista removido
  assert(!feed.data.data?.posts?.some((p) => p.id === delId), "9 feed não lista removido");

  // 10 curtida funciona
  const like = await reqAs("partner", `/api/social/posts/${postId}/like`, { method: "POST" });
  assert(like.status === 200 && like.data.data?.liked === true, "10 curtida");

  // 11 curtida duplicada não duplica
  const like2 = await reqAs("partner", `/api/social/posts/${postId}/like`, { method: "POST" });
  assert(like2.data.data?.count === like.data.data?.count, "11 like idempotente");

  // 12 unlike
  const unlike = await reqAs("partner", `/api/social/posts/${postId}/like`, { method: "DELETE" });
  assert(unlike.status === 200 && unlike.data.data?.liked === false, "12 unlike");

  // 13 comentário
  const comment = await reqAs("partner", `/api/social/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: "Ótimo post!" }),
  });
  assert(comment.status === 201, "13 comentário");
  const commentId = comment.data.data?.comment?.id;

  // 14 resposta
  const reply = await reqAs("client", `/api/social/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: "Obrigado!", parentCommentId: commentId }),
  });
  assert(reply.status === 201, "14 resposta");

  // 15 não comenta post removido
  const commentRemoved = await reqAs("partner", `/api/social/posts/${delId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: "nope" }),
  });
  assert(commentRemoved.status === 403 || commentRemoved.status === 404, "15 não comenta removido");

  // 16 save
  const save = await reqAs("partner", `/api/social/posts/${postId}/save`, { method: "POST" });
  assert(save.status === 200 && save.data.data?.saved === true, "16 save");

  // 17 save duplicado
  const save2 = await reqAs("partner", `/api/social/posts/${postId}/save`, { method: "POST" });
  assert(save2.data.data?.saved === true, "17 save idempotente");

  // 18 share interno
  const share = await reqAs("partner", `/api/social/posts/${postId}/share`, { method: "POST", body: "{}" });
  assert(share.status === 201 && share.data.data?.link?.includes(postId), "18 share");

  // 19 share para conversa
  const conv = await reqAs("client", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "DIRECT", participantUserIds: [partner.id] }),
  });
  assert(conv.status === 201, "19a conversa criada");
  const convId = conv.data.data?.conversation?.id;
  const shareChat = await reqAs("client", `/api/social/posts/${postId}/share`, {
    method: "POST",
    body: JSON.stringify({ targetConversationId: convId, message: "Olha isso" }),
  });
  assert(shareChat.status === 201 && shareChat.data.data?.chatMessageId, `19 share chat: ${shareChat.status} ${JSON.stringify(shareChat.data)}`);

  // 20 denúncia post — reporter dedicado (não é o autor)
  await resetAuthRateLimit();
  const reportPost = await reqAs("reporter", "/api/social/reports", {
    method: "POST",
    body: JSON.stringify({ postId, reason: "SPAM" }),
  });
  assert(
    reportPost.status === 201,
    `20 denúncia post → ${reportPost.status} ${JSON.stringify(reportPost.data?.error ?? reportPost.data)}`
  );

  // 21 denúncia comentário — autor do post denuncia comentário do partner
  const reportComment = await reqAs("client", "/api/social/reports", {
    method: "POST",
    body: JSON.stringify({ commentId, reason: "HARASSMENT" }),
  });
  assert(
    reportComment.status === 201,
    `21 denúncia comentário → ${reportComment.status} ${JSON.stringify(reportComment.data?.error ?? reportComment.data)}`
  );

  // 22 admin oculta post
  const hide = await reqAs("admin", `/api/admin/social/posts/${postId}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ action: "HIDE", reason: "teste" }),
  });
  assert(hide.status === 200, "22 admin oculta");

  // 23 admin restaura
  const restore = await reqAs("admin", `/api/admin/social/posts/${postId}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ action: "RESTORE" }),
  });
  assert(restore.status === 200, "23 admin restaura");

  // 24 admin oculta comentário
  const hideComment = await reqAs("admin", `/api/admin/social/comments/${commentId}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ action: "HIDE" }),
  });
  assert(hideComment.status === 200, "24 admin oculta comentário");

  // 25 hashtag extraída
  const tags = await prisma.socialPostHashtag.findMany({
    where: { postId },
    include: { hashtag: true },
  });
  assert(tags.some((t) => t.hashtag.slug === "ecopet"), "25 hashtag extraída");

  // 26 busca hashtag
  const search = await reqAs("partner", "/api/social/search?q=ecopet&type=hashtags");
  assert(search.status === 200, "26 busca hashtag");

  // 27 perfil público sem dados sensíveis
  const profile = await reqAs("partner", `/api/social/profiles/${client.id}`);
  assert(profile.status === 200, "27 perfil ok");
  const profileStr = JSON.stringify(profile.data);
  assert(!profileStr.includes("@test.ecopet.local"), "27 sem email");
  assert(!profileStr.includes("cpf"), "27 sem cpf");

  // 28 follow
  const follow = await reqAs("partner", `/api/social/profiles/${client.id}/follow`, { method: "POST" });
  assert(follow.status === 200 && follow.data.data?.following === true, "28 follow");

  // 29 não segue a si mesmo
  const selfFollow = await reqAs("client", `/api/social/profiles/${client.id}/follow`, { method: "POST" });
  assert(selfFollow.status === 400, "29 não segue si");

  // 30 bloqueio impede interação
  await reqAs("client", `/api/social/profiles/${partner.id}/block`, { method: "POST", body: "{}" });
  const blockedLike = await reqAs("partner", `/api/social/posts/${postId}/like`, { method: "POST" });
  assert(blockedLike.status === 403, "30 bloqueio");

  // 31 upload social dev
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const form = new FormData();
  form.append("purpose", "social_post_media");
  form.append("file", new Blob([png], { type: "image/png" }), "test.png");
  const jar = jarFor("client");
  const uploadRes = await fetch(`${WEB}/api/upload`, {
    method: "POST",
    headers: jar.get("cookie") ? { Cookie: jar.get("cookie") } : {},
    body: form,
  });
  const uploadData = await uploadRes.json();
  assert(uploadRes.status === 201 || uploadData.error?.code === "UPLOAD_NOT_CONFIGURED", "31 upload dev/prod");

  // 32 produção sem provedor — purpose social registrado nas constraints oficiais
  const uploadConstraints = readFileSync(
    path.join(__dirname, "../apps/web/src/lib/storage/upload-constraints.ts"),
    "utf8"
  );
  assert(uploadConstraints.includes("social_post_media"), "32 purpose social no upload");
  const uploadRoute = readFileSync(path.join(__dirname, "../apps/web/src/app/api/upload/route.ts"), "utf8");
  assert(uploadRoute.includes("isUploadPurpose"), "32 upload valida purpose");

  // 33 notification social
  const notif = await prisma.notification.findFirst({
    where: { userId: client.id, type: "SOCIAL" },
    orderBy: { createdAt: "desc" },
  });
  assert(notif, "33 notification social");

  // 34 rate limit
  let rateBlocked = false;
  for (let i = 0; i < 12; i++) {
    const r = await reqAs("partner", "/api/social/posts", {
      method: "POST",
      body: JSON.stringify({ content: `spam ${i}` }),
    });
    if (r.status === 429) {
      rateBlocked = true;
      break;
    }
  }
  assert(rateBlocked, "34 rate limit");

  // Limpa rate-limit social e usa parceiro fresco para PRODUCT/SERVICE
  await resetAuthRateLimit();
  const partnerFresh = await registerAndLogin(
    "partner2",
    "PARTNER",
    `social.partner2.${ts}@test.ecopet.local`
  );
  await activateUser(partnerFresh.id);

  // 35 seed sem SocialPost fake
  const seed = readFileSync(path.join(__dirname, "../packages/database/prisma/seed.ts"), "utf8");
  assert(!seed.includes("socialPost.create"), "35 seed sem posts fake");
  // SocialPost é o modelo autoritativo — lib/social não deve escrever no Post legado
  const socialPostsLib = readFileSync(path.join(__dirname, "../apps/web/src/lib/social/posts.ts"), "utf8");
  assert(socialPostsLib.includes("prisma.socialPost"), "35 SocialPost autoritativo");
  assert(!/\bprisma\.post\./.test(socialPostsLib), "35 sem writes no Post legado");

  // 36 visitante vê feed público
  const guestFeed = await reqAs("guest", "/api/social/feed");
  assert(guestFeed.status === 200, "36 visitante vê feed");
  assert(Array.isArray(guestFeed.data.data?.posts), "36 feed posts array");

  // 37 visitante não curte (401)
  const guestLike = await reqAs("guest", `/api/social/posts/${postId}/like`, { method: "POST" });
  assert(guestLike.status === 401, "37 visitante não curte");

  // 38 visitante não comenta (401)
  const guestComment = await reqAs("guest", `/api/social/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: "guest" }),
  });
  assert(guestComment.status === 401, "38 visitante não comenta");

  // 39 ONG cria post de adoção
  const ong = await registerAndLogin("ong", "ONG", `social.ong.${ts}@test.ecopet.local`);
  await activateUser(ong.id);
  const adoptionPost = await reqAs("ong", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({
      type: "ADOPTION",
      content: "Luna procura lar #adocao",
      adoptionMeta: {
        animalName: "Luna",
        species: "Cão",
        approximateAge: "2 anos",
        sex: "Fêmea",
        size: "Médio",
        city: "São Paulo",
        state: "SP",
        status: "AVAILABLE",
      },
    }),
  });
  assert(adoptionPost.status === 201, "39 ONG cria adoção");
  assert(adoptionPost.data.data?.post?.type === "ADOPTION", "39 tipo ADOPTION");

  // 40 parceiro cria post de produto (sem produto vinculado — tipo permitido)
  const productPost = await reqAs("partner2", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ type: "PRODUCT", content: "Novidade na loja!" }),
  });
  assert(
    productPost.status === 201,
    `40 parceiro post produto → ${productPost.status} ${JSON.stringify(productPost.data?.error ?? {})}`
  );

  // 41 parceiro cria post de serviço
  const servicePost = await reqAs("partner2", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ type: "SERVICE", content: "Banho e tosa com desconto" }),
  });
  assert(servicePost.status === 201, "41 parceiro post serviço");

  // 42 cliente não cria post de produto
  const clientProduct = await reqAs("client", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ type: "PRODUCT", content: "hack produto" }),
  });
  assert(clientProduct.status === 403, "42 cliente bloqueado produto");

  // 43 ONG cria campanha
  const campaignPost = await reqAs("ong", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ type: "CAMPAIGN", content: "Campanha de castração" }),
  });
  assert(campaignPost.status === 201, "43 ONG campanha");

  // 44 admin modera denúncia
  const reportsList = await reqAs("admin", "/api/admin/social/reports");
  assert(reportsList.status === 200, "44 admin lista denúncias");
  const reportId = reportsList.data.data?.reports?.[0]?.id;
  if (reportId) {
    const resolveReport = await reqAs("admin", `/api/admin/social/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "RESOLVED", resolution: "teste" }),
    });
    assert(resolveReport.status === 200, "44 admin modera denúncia");
  }

  // 45 i18n socialFeed keys existem
  const ptBR = JSON.parse(readFileSync(path.join(__dirname, "../apps/web/src/i18n/locales/pt-BR.json"), "utf8"));
  const en = JSON.parse(readFileSync(path.join(__dirname, "../apps/web/src/i18n/locales/en.json"), "utf8"));
  const es = JSON.parse(readFileSync(path.join(__dirname, "../apps/web/src/i18n/locales/es.json"), "utf8"));
  assert(ptBR.socialFeed?.authModal?.title, "45 pt-BR social i18n");
  assert(en.socialFeed?.authModal?.title, "45 en social i18n");
  assert(es.socialFeed?.authModal?.title, "45 es social i18n");

  console.log("\n✅ Todos os 45 cenários foundation social passaram");
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error("\n❌", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
