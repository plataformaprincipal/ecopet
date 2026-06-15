/**
 * Backup local PostgreSQL — somente desenvolvimento.
 * Salva em .ecopet/backups/ (ignorado pelo Git).
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const backupDir = path.join(root, ".ecopet", "backups");

function parseDatabaseUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || "5432",
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, "").split("?")[0],
  };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("✗ DATABASE_URL não definida.");
    process.exit(1);
  }

  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outfile = path.join(backupDir, `ecopet-backup-${stamp}.sql`);
  const cfg = parseDatabaseUrl(dbUrl);

  const args = [
    "-h", cfg.host,
    "-p", cfg.port,
    "-U", cfg.user,
    "-d", cfg.database,
    "-f", outfile,
    "--no-owner",
    "--no-acl",
  ];

  console.log(`Gerando backup em ${outfile} ...`);

  await new Promise((resolve, reject) => {
    const child = spawn("pg_dump", args, {
      env: { ...process.env, PGPASSWORD: cfg.password },
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`pg_dump exit ${code}`))));
  });

  console.log(`✓ Backup concluído: ${outfile}`);
  console.log("  Nunca commite arquivos .sql no GitHub.");
}

main().catch((e) => {
  console.error("✗", e.message);
  console.error("  Instale PostgreSQL client tools (pg_dump) ou use Docker.");
  process.exit(1);
});
