import { z } from "zod";
import { PetSpecies, ProductCatalogCategory, ProductCatalogStatus } from "@prisma/client";

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  catalogCategory: z.nativeEnum(ProductCatalogCategory),
  brand: z.string().optional().nullable(),
  speciesTarget: z.nativeEnum(PetSpecies).optional().nullable(),
  price: z.number().positive("Preço deve ser positivo"),
  comparePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().nonnegative("Estoque não pode ser negativo"),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  weightGrams: z.number().int().positive().optional().nullable(),
  status: z.nativeEnum(ProductCatalogStatus).optional(),
  images: z.array(z.string().url()).optional().nullable(),
});

export const stockPatchSchema = z.object({
  delta: z.number().int(),
  reason: z.string().optional().nullable(),
});

export const checkoutSchema = z.object({
  deliveryMethod: z.enum(["DELIVERY_LOCAL", "PICKUP_LOCAL"]),
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
