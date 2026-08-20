import { marketSku } from "./catalog-helpers";
import type { CatalogItem } from "./types";

/** Tabela MKT-001 … MKT-027 — tickets de referência. Preço varejista = seller. */
export const MARKET_CATALOG: CatalogItem[] = [
  marketSku("MKT-001", "Ração seca", 180, 19.49),
  marketSku("MKT-002", "Alimento úmido", 55, 6.99),
  marketSku("MKT-003", "Alimentação natural", 160, 17.49),
  marketSku("MKT-004", "Snacks e petiscos", 45, 5.99),
  marketSku("MKT-005", "Suplementos", 95, 10.99),
  marketSku("MKT-006", "Medicamentos", 120, 13.49),
  marketSku("MKT-007", "Produtos veterinários", 90, 10.49),
  marketSku("MKT-008", "Antiparasitários", 85, 9.99),
  marketSku("MKT-009", "Higiene", 55, 6.99),
  marketSku("MKT-010", "Grooming e cosméticos", 65, 7.99),
  marketSku("MKT-011", "Acessórios", 75, 8.99),
  marketSku("MKT-012", "Camas e mobiliário", 180, 19.49),
  marketSku("MKT-013", "Comedouros", 95, 10.99),
  marketSku("MKT-014", "Fontes", 220, 23.49),
  marketSku("MKT-015", "Brinquedos", 55, 6.99),
  marketSku("MKT-016", "Mobilidade", 140, 15.49),
  marketSku("MKT-017", "Viagem", 220, 23.49),
  marketSku("MKT-018", "Rastreadores", 450, 46.49),
  marketSku("MKT-019", "IoT e automação", 700, 71.49),
  marketSku("MKT-020", "Aves", 80, 9.49),
  marketSku("MKT-021", "Peixes", 90, 10.49),
  marketSku("MKT-022", "Répteis", 120, 13.49),
  marketSku("MKT-023", "Pequenos mamíferos", 100, 11.49),
  marketSku("MKT-024", "Fabricante direto", 150, 16.49),
  marketSku("MKT-025", "Distribuidor", 130, 14.49),
  marketSku("MKT-026", "Afiliado", 110, 12.49),
  marketSku("MKT-027", "Dropshipping autorizado", 140, 15.49),
];
