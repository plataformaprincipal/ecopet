import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file: string, override = false) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (override || process.env[key] == null || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

/** Mesma ordem que o runtime Web: .env.local da app vence. Não imprime valores. */
export function loadWebRuntimeEnv() {
  const root = path.resolve(__dirname, "../..");
  loadEnvFile(path.join(root, ".env"));
  loadEnvFile(path.join(root, "packages/database/.env"));
  loadEnvFile(path.join(root, "apps/web/.env"), true);
  loadEnvFile(path.join(root, "apps/web/.env.local"), true);
}
