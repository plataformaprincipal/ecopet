/**
 * Lista usuários do banco local (desenvolvimento).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      cpf: true,
      phone: true,
      role: true,
      createdAt: true,
      petshopProfile: { select: { cnpj: true } },
      clinicProfile: { select: { cnpj: true } },
      sellerProfile: { select: { cnpj: true } },
      ongProfile: { select: { cnpj: true, documentType: true } },
      serviceProviderProfile: { select: { documentNumber: true, documentType: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    cpf: u.cpf ?? "",
    cnpj:
      u.petshopProfile?.cnpj ??
      u.clinicProfile?.cnpj ??
      u.sellerProfile?.cnpj ??
      (u.ongProfile?.documentType === "CNPJ" ? u.ongProfile?.cnpj : "") ??
      (u.serviceProviderProfile?.documentType === "CNPJ" ? u.serviceProviderProfile?.documentNumber : "") ??
      "",
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  console.table(rows);
  console.log(`Total: ${rows.length} usuário(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
