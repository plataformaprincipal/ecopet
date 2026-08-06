import fs from "fs";

function meta(file, label) {
  const t = fs.readFileSync(file, "utf8");
  const lines = t.split(/\r?\n/).filter((l) => l && !l.startsWith("#"));
  const get = (k) => {
    const line = lines.find((l) => l.startsWith(`${k}=`));
    if (!line) return "";
    let v = line.slice(k.length + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v;
  };
  const db = get("DATABASE_URL");
  const mp = get("MERCADO_PAGO_ACCESS_TOKEN");
  const pub = get("NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY");
  return {
    label,
    lineCount: lines.length,
    databaseUrlLength: db.length,
    databaseUrlLooksRedacted: db === "[SENSITIVE]" || db.includes("SENSITIVE"),
    databaseUrlStartsWithPostgres: db.startsWith("postgres"),
    mpTokenLength: mp.length,
    mpLooksRedacted: mp === "[SENSITIVE]" || mp.includes("SENSITIVE"),
    mpStartsWithTest: mp.startsWith("TEST-"),
    publicKeyLength: pub.length,
    publicLooksRedacted: pub === "[SENSITIVE]" || pub.includes("SENSITIVE"),
    publicStartsWithTest: pub.startsWith("TEST-"),
    hasFinancialLedger: Boolean(get("FINANCIAL_LEDGER_ENABLED")),
    hasAllowSim: lines.some((l) => l.startsWith("ALLOW_SIMULATED_PAYMENTS=")),
  };
}

const prev = "apps/web/.env.preview.pull";
const prod = "apps/web/.env.production.pull";
const a = meta(prev, "preview");
const b = meta(prod, "production");
const identical = fs.readFileSync(prev, "utf8") === fs.readFileSync(prod, "utf8");
console.log(JSON.stringify({ preview: a, production: b, filesIdentical: identical }, null, 2));
