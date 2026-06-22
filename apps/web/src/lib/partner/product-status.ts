import type { ContentApprovalStatus, ProductCatalogStatus } from "@prisma/client";

export type PartnerProductDisplayStatus =
  | "ativo"
  | "pendente"
  | "pausado"
  | "sem_estoque";

export function getPartnerProductDisplayStatus(product: {
  status: ProductCatalogStatus;
  approvalStatus: ContentApprovalStatus;
  stock: number;
}): PartnerProductDisplayStatus {
  if (product.approvalStatus === "PENDING") return "pendente";
  if (product.status === "OUT_OF_STOCK" || product.stock <= 0) return "sem_estoque";
  if (product.status === "INACTIVE" || product.status === "DRAFT") return "pausado";
  return "ativo";
}

export const PRODUCT_STATUS_LABELS: Record<PartnerProductDisplayStatus, string> = {
  ativo: "Ativo",
  pendente: "Pendente",
  pausado: "Pausado",
  sem_estoque: "Sem estoque",
};

export const PRODUCT_STATUS_VARIANTS: Record<
  PartnerProductDisplayStatus,
  "success" | "warning" | "muted" | "danger"
> = {
  ativo: "success",
  pendente: "warning",
  pausado: "muted",
  sem_estoque: "danger",
};
