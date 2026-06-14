import { Router } from "express";
import { z } from "zod";
import { prisma } from "@ecopet/database";
import { PetSpecies, PetSize, ReadyServiceCategory, CustomRequestUrgency } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../middleware/auth.js";
import { sendSuccess } from "../lib/express-api-response.js";

const router = Router();

const customRequestSchema = z.object({
  description: z.string().min(10),
  species: z.nativeEnum(PetSpecies).optional(),
  size: z.nativeEnum(PetSize).optional(),
  location: z.string().optional(),
  urgency: z.nativeEnum(CustomRequestUrgency).optional(),
  budget: z.number().positive().optional(),
  attachmentUrl: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const { category } = req.query;
    const services = await prisma.service.findMany({
      where: {
        type: "READY_SERVICE",
        isActive: true,
        approvalStatus: "APPROVED",
        ...(category ? { category: category as ReadyServiceCategory } : {}),
      },
      include: {
        provider: { select: { id: true, name: true, isVerified: true } },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    });
    return sendSuccess(res, { services, total: services.length });
  } catch (e) {
    next(e);
  }
});

router.get("/categories", (_req, res) => {
  return sendSuccess(res, {
    categories: [
      { id: "BATH_GROOMING", label: "Banho e tosa" },
      { id: "VET_CONSULTATION", label: "Consulta veterinária" },
      { id: "VACCINATION", label: "Vacinação" },
      { id: "DOG_WALKER", label: "Dog walker" },
      { id: "PET_SITTER", label: "Pet sitter" },
      { id: "TRAINING", label: "Adestramento" },
      { id: "BOARDING", label: "Hospedagem" },
      { id: "PET_TRANSPORT", label: "Transporte pet" },
    ],
  });
});

router.post("/custom", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = customRequestSchema.parse(req.body);
    const request = await prisma.customServiceRequest.create({
      data: {
        tutorId: req.userId!,
        description: data.description,
        species: data.species,
        size: data.size,
        location: data.location,
        urgency: data.urgency ?? "MEDIUM",
        budget: data.budget,
        attachmentUrl: data.attachmentUrl || null,
      },
    });
    return sendSuccess(res, { request }, 201);
  } catch (e) {
    next(e);
  }
});

router.get("/custom/mine", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const requests = await prisma.customServiceRequest.findMany({
      where: { tutorId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, { requests, total: requests.length });
  } catch (e) {
    next(e);
  }
});

export default router;
