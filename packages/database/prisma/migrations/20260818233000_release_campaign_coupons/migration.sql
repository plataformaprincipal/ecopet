-- Cupons de campanha compatíveis com códigos já conhecidos no checkout.
-- Não são inventados no cliente: o desconto só vale após validação Prisma.

INSERT INTO "Coupon" (
  "id", "code", "description", "discountType", "discountValue",
  "isActive", "createdAt", "updatedAt"
) VALUES
  ('camp_ecopet10', 'ECOPET10', 'Campanha 10% no marketplace', 'PERCENT', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('camp_luna15', 'LUNA15', 'Campanha 15% no marketplace', 'PERCENT', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('camp_pet20', 'PET20', 'Campanha 20% no marketplace', 'PERCENT', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
