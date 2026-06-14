import { prisma } from "@/lib/prisma";

export async function assertPetOwnership(petId: string, ownerId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId, deletedAt: null },
    select: { id: true, ownerId: true, name: true },
  });
  return pet;
}

export const petListSelect = {
  id: true,
  name: true,
  species: true,
  breed: true,
  sex: true,
  birthDate: true,
  weight: true,
  color: true,
  neutered: true,
  hasMicrochip: true,
  microchip: true,
  notes: true,
  photo: true,
  createdAt: true,
  updatedAt: true,
} as const;
