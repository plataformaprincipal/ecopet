/**
 * Unit tests for admin accounts-service (requires TSX_TSCONFIG_PATH=apps/web/tsconfig.json)
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus, VerificationStatus } from "@prisma/client";
import { reviewAccount } from "../apps/web/src/lib/admin/accounts-service.ts";
import { updateGestorUserStatus } from "../apps/web/src/lib/gestor/gestor-users-service.ts";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin-service-unit@ecopet.test" },
    create: {
      email: "admin-service-unit@ecopet.test",
      name: "Admin Unit",
      passwordHash: await bcrypt.hash("TestAdmin@2026!", 10),
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: "11999999999",
    },
    update: { role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE },
  });

  const partner = await prisma.user.upsert({
    where: { email: "partner-service-unit@ecopet.test" },
    create: {
      email: "partner-service-unit@ecopet.test",
      name: "Partner Unit",
      passwordHash: await bcrypt.hash("TestAdmin@2026!", 10),
      role: UserRole.PARTNER,
      accountStatus: AccountStatus.PENDING,
      phone: "11999999999",
    },
    update: { accountStatus: AccountStatus.PENDING },
  });

  await prisma.partnerProfile.upsert({
    where: { userId: partner.id },
    create: {
      userId: partner.id,
      businessName: "Unit Partner",
      legalName: "Unit Partner LTDA",
      category: "Petshop",
      address: "Rua 1",
      city: "SP",
      state: "SP",
      verificationStatus: VerificationStatus.PENDING,
    },
    update: { verificationStatus: VerificationStatus.PENDING },
  });

  try {
    await reviewAccount({ targetUserId: partner.id, action: "reject", adminId: admin.id });
    console.error("✗ reject sem motivo deveria falhar");
    process.exit(1);
  } catch (e) {
    if (e?.message !== "REASON_REQUIRED") {
      console.error("✗ erro inesperado:", e.message);
      process.exit(1);
    }
    console.log("✓ reject exige motivo");
  }

  await reviewAccount({ targetUserId: partner.id, action: "approve", adminId: admin.id });
  console.log("✓ approve ok");

  try {
    await reviewAccount({ targetUserId: admin.id, action: "suspend", adminId: admin.id });
    console.error("✗ self-action deveria falhar");
    process.exit(1);
  } catch (e) {
    if (e?.message !== "SELF_ACTION") {
      console.error("✗ self-action erro inesperado:", e.message);
      process.exit(1);
    }
    console.log("✓ self-action bloqueada em reviewAccount");
  }

  try {
    await updateGestorUserStatus({ userId: admin.id, action: "suspend", adminId: admin.id });
    console.error("✗ gestor self-action deveria falhar");
    process.exit(1);
  } catch (e) {
    if (e?.message !== "SELF_ACTION") {
      console.error("✗ gestor self-action erro inesperado:", e.message);
      process.exit(1);
    }
    console.log("✓ self-action bloqueada em updateGestorUserStatus");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
