import { Router } from "express";
import { getPublicPet, computePetAge } from "../services/pet-service.js";
import { AppError } from "../lib/app-errors.js";
import { prisma } from "@ecopet/database";

const router = Router();

router.get("/lost", async (_req, res, next) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { isLost: true },
      select: {
        id: true,
        name: true,
        photo: true,
        species: true,
        breed: true,
        lostAt: true,
        lostCity: true,
        lostContact: true,
        qrCodeSlug: true,
      },
      orderBy: { lostAt: "desc" },
      take: 50,
    });
    res.json(pets);
  } catch (e) {
    next(e);
  }
});

router.get("/adoption", async (_req, res, next) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { availableForAdoption: true },
      select: {
        id: true,
        name: true,
        photo: true,
        species: true,
        breed: true,
        adoptionReason: true,
        adoptionCity: true,
        adoptionFee: true,
        qrCodeSlug: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    res.json(pets);
  } catch (e) {
    next(e);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const pet = await getPublicPet(String(req.params.slug));
    res.json({ ...pet, age: computePetAge(pet.birthDate) });
  } catch (e) {
    if (e instanceof AppError) return res.status(e.status).json({ error: e.userMessage });
    next(e);
  }
});

export default router;
