import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url || /supabase/i.test(url) || !/localhost|127\.0\.0\.1/.test(url)) {
  console.error("Refusing non-localhost DATABASE_URL");
  process.exit(2);
}

const c = new pg.Client({ connectionString: url });
await c.connect();

const tables = await c.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1`,
);
console.log("=== TABLES (" + tables.rows.length + ") ===");
for (const r of tables.rows) console.log(r.tablename);

const migrations = await c.query(
  `SELECT migration_name, finished_at IS NOT NULL AS ok, rolled_back_at, LEFT(COALESCE(logs,''), 200) AS logs
   FROM _prisma_migrations ORDER BY started_at`,
);
console.log("\n=== MIGRATIONS ===");
for (const r of migrations.rows) {
  console.log((r.ok ? "OK  " : "FAIL") + " " + r.migration_name + (r.logs ? " | " + r.logs : ""));
}

await c.end();
