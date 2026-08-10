import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(root, "packages/database/prisma/schema.prisma");
const migrationsDir = path.join(root, "packages/database/prisma/migrations");

const schema = fs.readFileSync(schemaPath, "utf8");
const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]).sort();

const createTable = new Set();
const alterTable = new Set();
const enumCreate = new Set();

for (const dir of fs.readdirSync(migrationsDir)) {
  const sqlPath = path.join(migrationsDir, dir, "migration.sql");
  if (!fs.existsSync(sqlPath)) continue;
  const sql = fs.readFileSync(sqlPath, "utf8");
  for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([A-Za-z0-9_]+)"?/gi)) {
    createTable.add(m[1]);
  }
  for (const m of sql.matchAll(/ALTER\s+TABLE\s+"?([A-Za-z0-9_]+)"?/gi)) {
    alterTable.add(m[1]);
  }
  for (const m of sql.matchAll(/CREATE\s+TYPE\s+"?([A-Za-z0-9_]+)"?/gi)) {
    enumCreate.add(m[1]);
  }
}

const schemaEnums = [...schema.matchAll(/^enum\s+(\w+)\s*\{/gm)].map((m) => m[1]).sort();

const modelsWithoutCreate = models.filter((m) => !createTable.has(m));
const alterWithoutCreate = [...alterTable].filter((t) => !createTable.has(t)).sort();
const enumsWithoutCreate = schemaEnums.filter((e) => !enumCreate.has(e));

console.log(JSON.stringify({
  modelCount: models.length,
  createTableCount: createTable.size,
  modelsWithoutCreateTable: modelsWithoutCreate,
  modelsWithoutCreateCount: modelsWithoutCreate.length,
  alterWithoutCreateTable: alterWithoutCreate,
  schemaEnumsMissingFromMigrations: enumsWithoutCreate,
  schemaEnumsMissingCount: enumsWithoutCreate.length,
}, null, 2));
