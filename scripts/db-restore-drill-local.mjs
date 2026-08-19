/**
 * Drill seguro: dump schema-only do banco da Web + restore em Postgres Docker temporário.
 * Nunca aponta para produção. Não imprime URLs/senhas.
 */
import { spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function load(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[line.slice(0, i).trim()] = val;
  }
}

function parseDb(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || "5432",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "").split("?")[0]),
    sslmode: u.searchParams.get("sslmode") || "require",
  };
}

const root = path.resolve(import.meta.dirname, "..");
load(path.join(root, ".env"));
load(path.join(root, "packages/database/.env"));
load(path.join(root, "apps/web/.env"));
load(path.join(root, "apps/web/.env.local"));

const sourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!sourceUrl) {
  console.error("DATABASE_URL/DIRECT_URL ausente.");
  process.exit(1);
}

const cfg = parseDb(sourceUrl);
const backupDir = path.join(root, ".ecopet", "backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outfile = path.join(backupDir, `schema-drill-${stamp}.sql`);

console.log("origem host:", cfg.host);
console.log("origem db:", cfg.database);
console.log("mecanismo: pg_dump --schema-only --no-owner --no-acl");

function hasCmd(cmd) {
  const r = spawnSync(cmd, ["--version"], { shell: true, encoding: "utf8" });
  return r.status === 0;
}

const dumpArgs = [
  "-h",
  cfg.host,
  "-p",
  cfg.port,
  "-U",
  cfg.user,
  "-d",
  cfg.database,
  "--schema-only",
  "--no-owner",
  "--no-acl",
];

const dumpEnv = { ...process.env, PGPASSWORD: cfg.password, PGSSLMODE: cfg.sslmode };
let dump;
if (hasCmd("pg_dump")) {
  dump = spawnSync("pg_dump", [...dumpArgs, "-f", outfile], {
    env: dumpEnv,
    shell: true,
    encoding: "utf8",
  });
} else if (hasCmd("docker")) {
  dump = spawnSync(
    "docker",
    ["run", "--rm", "-e", "PGPASSWORD", "-e", "PGSSLMODE", "postgres:16-alpine", "pg_dump", ...dumpArgs],
    { encoding: "utf8", shell: false, env: dumpEnv }
  );
  if (dump.status === 0 && dump.stdout) {
    fs.writeFileSync(outfile, dump.stdout);
  }
} else {
  console.error("pg_dump e docker indisponíveis — drill de dump não executado.");
  process.exit(2);
}

if (dump.status !== 0) {
  console.error("pg_dump falhou (sem detalhes de credencial).");
  if (dump.stderr) console.error(String(dump.stderr).slice(0, 400));
  process.exit(dump.status ?? 1);
}

const bytes = fs.existsSync(outfile) ? fs.statSync(outfile).size : 0;
console.log("artefato bytes:", bytes);
console.log("artefato:", path.relative(root, outfile));
if (bytes < 1000) {
  console.error("dump schema demasiado pequeno.");
  process.exit(1);
}

if (!hasCmd("docker")) {
  console.log("Docker ausente — restore local não executado. Dump schema-only gerado.");
  process.exit(0);
}

const container = "ecopet-restore-drill";
const localPort = "55432";
try {
  execSync(`docker rm -f ${container}`, { stdio: "ignore" });
} catch {
  /* ignore */
}

console.log("subindo Postgres temporário na porta", localPort);
const run = spawnSync(
  "docker",
  [
    "run",
    "-d",
    "--name",
    container,
    "-e",
    "POSTGRES_USER=restore",
    "-e",
    "POSTGRES_PASSWORD=restore",
    "-e",
    "POSTGRES_DB=ecopet_restore",
    "-p",
    `${localPort}:5432`,
    "postgres:16-alpine",
  ],
  { encoding: "utf8", shell: true }
);
if (run.status !== 0) {
  console.error("falha ao subir container de restore.");
  process.exit(1);
}

function waitReady() {
  for (let i = 0; i < 30; i++) {
    const r = spawnSync(
      "docker",
      ["exec", container, "pg_isready", "-U", "restore", "-d", "ecopet_restore"],
      { encoding: "utf8", shell: true }
    );
    if (r.status === 0) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  throw new Error("postgres restore não ficou ready");
}

try {
  waitReady();
  const restore = spawnSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", "restore", "-d", "ecopet_restore", "-v", "ON_ERROR_STOP=1"],
    { input: fs.readFileSync(outfile, "utf8"), encoding: "utf8", shell: true }
  );
  if (restore.status !== 0) {
    console.error("restore local falhou.");
    if (restore.stderr) console.error(restore.stderr.slice(0, 600));
    process.exit(1);
  }

  const tables = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "restore",
      "-d",
      "ecopet_restore",
      "-tAc",
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';",
    ],
    { encoding: "utf8", shell: true }
  );
  console.log("tabelas public restauradas:", (tables.stdout || "").trim());

  const users = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "restore",
      "-d",
      "ecopet_restore",
      "-tAc",
      "SELECT to_regclass('public.\"User\"') IS NOT NULL;",
    ],
    { encoding: "utf8", shell: true }
  );
  console.log("tabela User presente:", (users.stdout || "").trim());
  console.log("produção não alterada: dump schema-only + restore em container temporário");
} finally {
  try {
    execSync(`docker rm -f ${container}`, { stdio: "ignore" });
  } catch {
    /* ignore */
  }
}
