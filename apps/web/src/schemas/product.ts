import { z } from "zod";
import { PetSpecies, ProductCatalogCategory, ProductCatalogStatus } from "@prisma/client";

const dimensionsSchema = z
  .object({
    widthCm: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
    depthCm: z.number().positive().optional(),
  })
  .optional()
  .nullable();

const extraDetailsSchema = z
  .object({
    speciesTargets: z.array(z.string()).optional(),
    ageTarget: z.string().optional(),
    sizeTarget: z.string().optional(),
    restrictions: z.string().optional(),
    composition: z.string().optional(),
    usageInstructions: z.string().optional(),
    expiryDate: z.string().optional(),
    observations: z.string().optional(),
  })
  .optional()
  .nullable();

const productBaseSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    description: z.string().min(3, "Descrição obrigatória"),
    shortDescription: z.string().optional().nullable(),
    subcategory: z.string().optional().nullable(),
    catalogCategory: z.nativeEnum(ProductCatalogCategory),
    brand: z.string().optional().nullable(),
    speciesTarget: z.nativeEnum(PetSpecies).optional().nullable(),
    price: z.number().positive("Preço deve ser maior que zero"),
    comparePrice: z.number().positive().optional().nullable(),
    stock: z.number().int().nonnegative("Estoque não pode ser negativo"),
    minStock: z.number().int().nonnegative().optional(),
    unit: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    weightGrams: z.number().int().positive().optional().nullable(),
    dimensions: dimensionsSchema,
    tags: z.array(z.string()).optional().nullable(),
    pickupAvailable: z.boolean().optional(),
    deliveryAvailable: z.boolean().optional(),
    extraDetails: extraDetailsSchema,
    status: z.nativeEnum(ProductCatalogStatus).optional(),
    images: z.array(z.string().url()).optional().nullable(),
  });

export const productSchema = productBaseSchema.superRefine((data, ctx) => {
    if (data.comparePrice != null && data.comparePrice >= data.price) {
      ctx.addIssue({
        code: "custom",
        message: "Preço promocional deve ser menor que o preço normal",
        path: ["comparePrice"],
      });
    }
  });

export const productUpdateSchema = productBaseSchema.partial();

export const stockPatchSchema = z.object({
  delta: z.number().int(),
  reason: z.string().optional().nullable(),
});

export const checkoutSchema = z.object({
  deliveryMethod: z.enum(["DELIVERY_LOCAL", "PICKUP_LOCAL"]),
  paymentMethod: z.enum(["PIX", "CARD", "CASH"]).default("PIX"),
  phone: z.string().min(10),
  notes: z.string().optional().nullable(),
  address: z.object({
    street: z.string().min(3),
    number: z.string().optional(),
    complement: z.string().optional(),
    district: z.string().optional(),
    city: z.string().min(2),
    state: z.string().length(2),
    zipCode: z.string().optional(),
  }),
});
