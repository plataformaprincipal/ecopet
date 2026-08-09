import fs from "node:fs";
import path from "node:path";

function load(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const verify = load(path.join(process.cwd(), "apps/web/.env.preview.verify"));
const e2e = load(path.join(process.cwd(), "apps/web/.env.e2e.local"));
const a = verify.MERCADO_PAGO_WEBHOOK_SECRET || "";
const b = e2e.MERCADO_PAGO_WEBHOOK_SECRET || "";
console.log(
  JSON.stringify(
    {
      verifyPresent: Boolean(a) && !a.includes("SENSITIVE"),
      e2ePresent: Boolean(b) && !b.includes("SENSITIVE"),
      verifyLen: a.length,
      e2eLen: b.length,
      sameLocal: Boolean(a) && a === b,
    },
    null,
    2
  )
);
