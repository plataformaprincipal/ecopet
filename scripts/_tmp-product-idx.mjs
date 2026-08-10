import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const rows = await p.$queryRaw`
  SELECT schemaname, tablename, indexname, indexdef
  FROM pg_indexes
  WHERE tablename ILIKE 'product' OR indexname ILIKE '%sku%'
  ORDER BY indexname`;
console.log(rows);
await p.$disconnect();
