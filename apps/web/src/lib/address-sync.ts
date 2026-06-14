import { prisma } from "@/lib/prisma";

type AddressInput = {
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

/**
 * Mantém addressRecord sincronizado com campos legados User.address.
 * MVP: endereço completo vai em street; number/district genéricos.
 */
export async function syncAddressRecord(userId: string, data: AddressInput) {
  const payload = {
    street: data.address.trim(),
    number: "S/N",
    district: "—",
    city: data.city.trim(),
    state: data.state,
    zipCode: data.zipCode,
  };

  const existing = await prisma.address.findUnique({ where: { userId } });
  if (existing) {
    await prisma.address.update({ where: { userId }, data: payload });
  } else {
    await prisma.address.create({ data: { userId, ...payload } });
  }
}
