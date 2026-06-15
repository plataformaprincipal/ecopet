import { z } from "zod";
import { UserRole } from "@prisma/client";

export const gestorFiltersSchema = z.object({
  dateFrom: z.string().max(40).optional(),
  dateTo: z.string().max(40).optional(),
  status: z.string().optional(),
  role: z.nativeEnum(UserRole).or(z.string()).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(200).optional(),
});

export type GestorFilters = z.infer<typeof gestorFiltersSchema>;

export function parseGestorFilters(searchParams: URLSearchParams): GestorFilters {
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = gestorFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    throw new GestorFilterError(parsed.error.errors[0]?.message ?? "Filtros inválidos");
  }
  return parsed.data;
}

export class GestorFilterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GestorFilterError";
  }
}

export function dateRangeWhere(filters: GestorFilters, field = "createdAt") {
  if (!filters.dateFrom && !filters.dateTo) return {};
  return {
    [field]: {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    },
  };
}

export function paginationArgs(filters: GestorFilters) {
  return { skip: (filters.page - 1) * filters.limit, take: filters.limit };
}
