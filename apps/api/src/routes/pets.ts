import { Router } from "express";
import { z } from "zod";
import { PetSize, PetSpecies } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/app-errors.js";
import { optionalBirthDateSchema } from "../schemas/date-schemas.js";
import {
  listPetsForUser,
  getPetDetail,
  createPet,
  updatePet,
  addMedicalRecord,
  addVaccination,
  addMedication,
  addWeightRecord,
  addMedia,
  markPetLost,
  markPetFound,
  setAdoption,
  MEDICAL_RECORD_TYPES,
  VACCINE_PRESETS,
  computePetAge,
  getVaccineAlerts,
  getMedicationReminders,
} from "../services/pet-service.js";

const router = Router();

const attachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().optional(),
  url: z.string().optional(),
});

const createPetSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  species: z.nativeEnum(PetSpecies),
  breed: z.string().min(1, "Raça obrigatória"),
  sex: z.string().min(1, "Sexo obrigatório"),
  birthDate: optionalBirthDateSchema,
  color: z.string().min(1, "Cor obrigatória"),
  weight: z.number().positive().optional(),
  size: z.nativeEnum(PetSize).optional(),
  neutered: z.boolean().optional(),
  hasMicrochip: z.boolean().optional(),
  microchip: z.string().optional(),
  photo: z.string().optional(),
  photos: z.array(z.string()).optional(),
  temperament: z.string().optional(),
  rescueHistory: z.string().optional(),
  specialNeeds: z.string().optional(),
  dietaryRestriction: z.string().optional(),
  allergiesText: z.string().optional(),
  notes: z.string().optional(),
  ongId: z.string().optional(),
  protectorId: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  publicProfile: z.boolean().optional(),
});

function handleError(e: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (e instanceof AppError) return res.status(e.status).json({ error: e.userMessage, code: e.code });
  next(e);
}

router.get("/meta", (_req, res) => {
  res.json({ medicalRecordTypes: MEDICAL_RECORD_TYPES, vaccinePresets: VACCINE_PRESETS });
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const pets = await listPetsForUser(req.userId!, req.userRole as never);
    res.json(
      pets.map((p) => ({
        ...p,
        age: computePetAge(p.birthDate),
      }))
    );
  } catch (e) {
    handleError(e, res, next);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const pet = await getPetDetail(id, req.userId!, req.userRole as never);
    if (!pet) return res.status(404).json({ error: "Pet não encontrado" });
    res.json({
      ...pet,
      age: computePetAge(pet.birthDate),
      vaccineAlerts: getVaccineAlerts(pet.vaccinations),
      medicationReminders: getMedicationReminders(pet.medications),
    });
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = createPetSchema.parse(req.body);
    const pet = await createPet({
      userId: req.userId!,
      role: req.userRole as never,
      data,
      ip: req.ip,
    });
    res.status(201).json({ ...pet, age: computePetAge(pet?.birthDate) });
  } catch (e) {
    handleError(e, res, next);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = createPetSchema.partial().parse(req.body);
    const pet = await updatePet({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
      ip: req.ip,
    });
    res.json({ ...pet, age: computePetAge(pet?.birthDate) });
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/medical-records", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      type: z.string(),
      title: z.string().min(1),
      content: z.string().optional(),
      recordDate: z.string().optional(),
      veterinarianName: z.string().optional(),
      clinicName: z.string().optional(),
      attachments: z.array(attachmentSchema).optional(),
    }).parse(req.body);
    const record = await addMedicalRecord({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
      ip: req.ip,
    });
    res.status(201).json(record);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/vaccinations", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      manufacturer: z.string().optional(),
      batch: z.string().optional(),
      date: z.string(),
      nextDue: z.string().optional(),
      veterinarian: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    const record = await addVaccination({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
      ip: req.ip,
    });
    res.status(201).json(record);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/medications", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    const record = await addMedication({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
      ip: req.ip,
    });
    res.status(201).json(record);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/weight-records", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      weight: z.number().positive(),
      recordedAt: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    const record = await addWeightRecord({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
    });
    res.status(201).json(record);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/media", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      type: z.enum(["photo", "video"]),
      url: z.string().min(1),
      caption: z.string().optional(),
      recordedAt: z.string().optional(),
    }).parse(req.body);
    const record = await addMedia({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
    });
    res.status(201).json(record);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/lost", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      lostCity: z.string().min(1),
      lostContact: z.string().min(1),
      lostAt: z.string().optional(),
    }).parse(req.body);
    const pet = await markPetLost({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
    });
    res.json(pet);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/found", async (req: AuthRequest, res, next) => {
  try {
    const pet = await markPetFound({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
    });
    res.json(pet);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/:id/adoption", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      availableForAdoption: z.boolean(),
      adoptionReason: z.string().optional(),
      adoptionRequirements: z.string().optional(),
      adoptionCity: z.string().optional(),
      adoptionFee: z.number().optional(),
    }).parse(req.body);
    const pet = await setAdoption({
      petId: String(req.params.id),
      userId: req.userId!,
      role: req.userRole as never,
      data,
    });
    res.json(pet);
  } catch (e) {
    handleError(e, res, next);
  }
});

export default router;
