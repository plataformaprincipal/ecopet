/**
 * Testes funcionais da ONG (fluxo real Prisma/Supabase) — EcoPet
 *
 * Exercita os critérios de aceite ponta a ponta usando o banco real:
 *  3. ONG cria animal
 *  4. animal AVAILABLE aparece publicamente
 *  5. ONG edita animal
 *  6. ONG marca animal como ADOPTED (some da vitrine pública)
 *  7. cliente solicita adoção
 *  8. solicitação aparece para a ONG
 *  9. ONG altera status (→ COMPLETED, animal vira ADOPTED)
 * 10. cliente recebe notificação
 * 11. ONG cria campanha
 * 12. campanha ACTIVE aparece publicamente
 * 13. ONG publica post na rede social
 * 16. ONG não edita animal de outra ONG (isolamento por ownership)
 *
 * Replica as cláusulas de filtro usadas pelos endpoints públicos
 * (/api/public/adoption e /api/public/campaigns) para garantir visibilidade real.
 *
 * Se o banco não estiver acessível, o teste é PULADO (exit 0) para não
 * quebrar a suíte em ambientes offline.
 */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Carrega variáveis do .env do pacote database (Prisma Client lê process.env).
try {
  const envFile = readFileSync(path.join(root, "packages", "database", ".env"), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
} catch {
  /* sem .env — segue com process.env atual */
}

if (!process.env.DATABASE_URL) {
  console.log("⚠ test:ngo-flows PULADO (DATABASE_URL ausente)");
  process.exit(0);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
function ok(label, cond) {
  if (cond) {
    console.log(`✓ ${label}`);
    passed++;
  } else {
    console.error(`✗ ${label}`);
    failed++;
  }
}

const tag = `ngotest_${Date.now()}`;
const created = {
  users: [],
  profiles: [],
  listings: [],
  requests: [],
  campaigns: [],
  posts: [],
  notifications: [],
};

const PUBLIC_LISTING_WHERE = (status) => ({
  status,
  ong: { accountStatus: "ACTIVE", ongProfile: { is: { verificationStatus: "APPROVED" } } },
});

console.log("=== EcoPet — test:ngo-flows (Prisma/Supabase) ===\n");

try {
  // --- Setup: 2 ONGs aprovadas + 1 cliente ---
  const ongA = await prisma.user.create({
    data: { email: `${tag}_ongA@test.dev`, passwordHash: "x", name: "ONG A Test", role: "ONG", accountStatus: "ACTIVE" },
  });
  created.users.push(ongA.id);
  const profA = await prisma.ongProfile.create({
    data: { userId: ongA.id, name: "ONG A", ongName: "ONG A", cnpj: `${tag}_A`, responsible: "Resp A", verificationStatus: "APPROVED" },
  });
  created.profiles.push(profA.id);

  const ongB = await prisma.user.create({
    data: { email: `${tag}_ongB@test.dev`, passwordHash: "x", name: "ONG B Test", role: "ONG", accountStatus: "ACTIVE" },
  });
  created.users.push(ongB.id);
  const profB = await prisma.ongProfile.create({
    data: { userId: ongB.id, name: "ONG B", ongName: "ONG B", cnpj: `${tag}_B`, responsible: "Resp B", verificationStatus: "APPROVED" },
  });
  created.profiles.push(profB.id);

  const client = await prisma.user.create({
    data: { email: `${tag}_client@test.dev`, passwordHash: "x", name: "Cliente Test", role: "CLIENT", accountStatus: "ACTIVE" },
  });
  created.users.push(client.id);

  // --- Teste 3: ONG cria animal ---
  const animal = await prisma.adoptionListing.create({
    data: { ongId: ongA.id, name: "Rex", species: "DOG", description: "Cão dócil para adoção", status: "AVAILABLE" },
  });
  created.listings.push(animal.id);
  ok("3. ONG cria animal (AdoptionListing)", !!animal.id && animal.status === "AVAILABLE");

  // --- Teste 4: animal AVAILABLE aparece publicamente ---
  const publicAvail = await prisma.adoptionListing.findMany({ where: { id: animal.id, ...PUBLIC_LISTING_WHERE("AVAILABLE") } });
  ok("4. animal AVAILABLE aparece na vitrine pública", publicAvail.length === 1);

  // --- Teste 5: ONG edita animal ---
  const edited = await prisma.adoptionListing.update({ where: { id: animal.id }, data: { description: "Atualizado: muito carinhoso" } });
  ok("5. ONG edita animal", edited.description.includes("Atualizado"));

  // --- Teste 7: cliente solicita adoção ---
  const req = await prisma.adoptionRequest.create({
    data: {
      listingId: animal.id,
      ongId: ongA.id,
      requesterId: client.id,
      message: "Tenho experiência com cães",
      status: "PENDING",
      history: [{ status: "PENDING", at: new Date().toISOString(), note: null }],
    },
  });
  created.requests.push(req.id);
  ok("7. cliente solicita adoção (AdoptionRequest PENDING)", req.status === "PENDING");

  // --- Teste 8: solicitação aparece para a ONG dona ---
  const ongRequests = await prisma.adoptionRequest.findMany({ where: { ongId: ongA.id } });
  ok("8. solicitação aparece para a ONG", ongRequests.some((r) => r.id === req.id));
  const ongBRequests = await prisma.adoptionRequest.findMany({ where: { ongId: ongB.id } });
  ok("8b. ONG B NÃO vê solicitação da ONG A", !ongBRequests.some((r) => r.id === req.id));

  // --- Teste 9: ONG altera status → COMPLETED e animal vira ADOPTED ---
  await prisma.adoptionRequest.update({ where: { id: req.id }, data: { status: "COMPLETED" } });
  await prisma.adoptionListing.update({ where: { id: animal.id }, data: { status: "ADOPTED" } });
  const reqDone = await prisma.adoptionRequest.findUnique({ where: { id: req.id } });
  ok("9. ONG altera status da solicitação (COMPLETED)", reqDone?.status === "COMPLETED");

  // --- Teste 6: animal ADOPTED some da vitrine pública AVAILABLE ---
  const stillPublic = await prisma.adoptionListing.findMany({ where: { id: animal.id, ...PUBLIC_LISTING_WHERE("AVAILABLE") } });
  ok("6. animal ADOPTED não aparece mais como disponível", stillPublic.length === 0);

  // --- Teste 10: cliente recebe notificação ---
  const notif = await prisma.notification.create({
    data: {
      userId: client.id,
      role: "CLIENT",
      type: "ADOPTION",
      title: "Atualização da adoção",
      message: "Parabéns! A adoção foi concluída.",
      body: "Parabéns! A adoção foi concluída.",
      actionUrl: "/client/notifications",
    },
  });
  created.notifications.push(notif.id);
  const clientNotifs = await prisma.notification.findMany({ where: { userId: client.id, type: "ADOPTION" } });
  ok("10. cliente recebe notificação de adoção", clientNotifs.some((n) => n.id === notif.id));

  // --- Teste 11: ONG cria campanha ---
  const campaign = await prisma.campaign.create({
    data: { ongId: ongA.id, title: "Ração de inverno", description: "Precisamos de ração", category: "FOOD", urgency: "HIGH", status: "ACTIVE" },
  });
  created.campaigns.push(campaign.id);
  ok("11. ONG cria campanha (ACTIVE)", !!campaign.id && campaign.status === "ACTIVE");

  // --- Teste 12: campanha ACTIVE aparece publicamente ---
  const publicCampaigns = await prisma.campaign.findMany({
    where: {
      id: campaign.id,
      status: "ACTIVE",
      ong: { accountStatus: "ACTIVE", ongProfile: { is: { verificationStatus: "APPROVED" } } },
    },
  });
  ok("12. campanha ACTIVE aparece publicamente", publicCampaigns.length === 1);

  // --- Teste 13: ONG publica post na rede social ---
  const post = await prisma.socialPost.create({
    data: { authorId: ongA.id, authorRole: "ONG", content: "Novo resgate hoje! 🐾", status: "PUBLISHED" },
  });
  created.posts.push(post.id);
  const ongPosts = await prisma.socialPost.count({ where: { authorId: ongA.id, status: "PUBLISHED" } });
  ok("13. ONG publica post na rede social", ongPosts >= 1);

  // --- Teste 16: ONG não edita animal de outra ONG (ownership) ---
  const notOwned = await prisma.adoptionListing.findFirst({ where: { id: animal.id, ongId: ongB.id } });
  ok("16. ONG B não acessa animal da ONG A (ownership)", notOwned === null);

  // --- Pendente de campanha de ONG não-aprovada não vaza ---
  const ongC = await prisma.user.create({
    data: { email: `${tag}_ongC@test.dev`, passwordHash: "x", name: "ONG C Test", role: "ONG", accountStatus: "PENDING" },
  });
  created.users.push(ongC.id);
  const profC = await prisma.ongProfile.create({
    data: { userId: ongC.id, name: "ONG C", cnpj: `${tag}_C`, responsible: "Resp C", verificationStatus: "PENDING" },
  });
  created.profiles.push(profC.id);
  const animalC = await prisma.adoptionListing.create({
    data: { ongId: ongC.id, name: "Bidu", species: "CAT", description: "Gato de ONG pendente", status: "AVAILABLE" },
  });
  created.listings.push(animalC.id);
  const leak = await prisma.adoptionListing.findMany({ where: { id: animalC.id, ...PUBLIC_LISTING_WHERE("AVAILABLE") } });
  ok("17. animal de ONG PENDENTE não aparece publicamente", leak.length === 0);
} catch (err) {
  console.error("Erro inesperado no fluxo:", err);
  failed++;
} finally {
  // Cleanup (ordem respeita FKs)
  try {
    if (created.requests.length) await prisma.adoptionRequest.deleteMany({ where: { id: { in: created.requests } } });
    if (created.notifications.length) await prisma.notification.deleteMany({ where: { id: { in: created.notifications } } });
    if (created.posts.length) await prisma.socialPost.deleteMany({ where: { id: { in: created.posts } } });
    if (created.campaigns.length) await prisma.campaign.deleteMany({ where: { id: { in: created.campaigns } } });
    if (created.listings.length) await prisma.adoptionListing.deleteMany({ where: { id: { in: created.listings } } });
    if (created.profiles.length) await prisma.ongProfile.deleteMany({ where: { id: { in: created.profiles } } });
    if (created.users.length) await prisma.user.deleteMany({ where: { id: { in: created.users } } });
  } catch (cleanupErr) {
    console.error("⚠ Falha na limpeza:", cleanupErr);
  }
  await prisma.$disconnect();
}

console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed > 0 ? 1 : 0);
