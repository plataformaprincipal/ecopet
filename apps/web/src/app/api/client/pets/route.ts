import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { petListSelect } from "@/lib/client/pet-ownership";
import { petCreateSchema } from "@/schemas/client-pet";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const pets = await prisma.pet.findMany({
    where: { ownerId: user!.id, deletedAt: null },
    select: petListSelect,
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ pets, total: pets.length });
}

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const body = await request.json();
  const parsed = petCreateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
  }

  const data = parsed.data;
  const pet = await prisma.pet.create({
    data: {
      ownerId: user!.id,
      name: data.name.trim(),
      species: data.species,
      breed: data.breed ?? null,
      sex: data.sex ?? null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      weight: data.weight ?? null,
      color: data.color ?? null,
      microchip: data.microchip ?? null,
      hasMicrochip: Boolean(data.microchip),
      neutered: data.neutered ?? false,
      notes: data.notes ?? null,
      photo: data.photo ?? null,
    },
    select: petListSelect,
  });

  return apiSuccess({ pet }, 201);
}
