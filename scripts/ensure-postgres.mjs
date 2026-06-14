/**
 * Inicia PostgreSQL local (embedded) quando Docker não está disponível.
 * Persiste dados em .ecopet/pg-data
 */
import EmbeddedPostgres from "embedded-postgres";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, ".ecopet", "pg-data");

const PG = {
  user: "ecopet",
  password: "ecopet_dev",
  port: 5432,
  database: "ecopet",
};

export const DATABASE_URL = `postgresql://${PG.user}:${PG.password}@localhost:${PG.port}/${PG.database}?schema=public`;

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

let instance;

export async function ensurePostgres() {
  if (await portOpen(PG.port)) {
    console.log(`✓ PostgreSQL já disponível em localhost:${PG.port}`);
    return DATABASE_URL;
  }

  console.log("→ Iniciando PostgreSQL embedded...");
  instance = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: PG.user,
    password: PG.password,
    port: PG.port,
    persistent: true,
  });

  const alreadyInitialised = fs.existsSync(path.join(dataDir, "PG_VERSION"));
  if (!alreadyInitialised) {
    await instance.initialise();
  }
  await instance.start();

  try {
    await instance.createDatabase(PG.database);
  } catch {
    /* database may already exist */
  }

  console.log(`✓ PostgreSQL embedded em localhost:${PG.port}`);
  return DATABASE_URL;
}

export async function stopPostgres() {
  if (instance) {
    await instance.stop();
  }
}

if (process.argv[1]?.includes("ensure-postgres")) {
  ensurePostgres()
    .then((url) => {
      console.log("DATABASE_URL=" + url);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
