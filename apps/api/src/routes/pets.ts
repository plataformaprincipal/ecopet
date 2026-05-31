import { Router } from "express";
import { z } from "zod";
import { prisma } from "@ecopet/database";
import { PetSpecies, PetSize } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

const petSchema = z.object({
  name: z.string().min(1),
  species: z.nativeEnum(PetSpecies),
  breed: z.string().optional(),
  size: z.nativeEnum(PetSize).optional(),
  sex: z.string().optional(),
  weight: z.number().optional(),
  color: z.string().optional(),
  neutered: z.boolean().optional(),
  behavior: z.string().optional(),
  diet: z.string().optional(),
  activityLevel: z.string().optional(),
  notes: z.string().optional(),
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { ownerId: req.userId },
      include: {
        vaccinations: true,
        medications: true,
        allergies: true,
        _count: { select: { consultations: true, exams: true } },
      },
    });
    res.json(pets);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id: req.params.id, ownerId: req.userId },
      include: {
        vaccinations: { orderBy: { date: "desc" } },
        medications: true,
        allergies: true,
        exams: { orderBy: { date: "desc" } },
        consultations: { orderBy: { date: "desc" } },
        medicalRecords: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!pet) return res.status(404).json({ error: "Pet não encontrado" });
    res.json(pet);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = petSchema.parse(req.body);
    const pet = await prisma.pet.create({
      data: { ...data, ownerId: req.userId! },
    });
    res.status(201).json(pet);
  } catch (e) {
    next(e);
  }
});

export default router;
