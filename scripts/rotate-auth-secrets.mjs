/**
 * Substitui AUTH_SECRET / NEXTAUTH_SECRET fracos ou placeholder por valor criptográfico.
 * Não imprime o segredo.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const files = [path.join(root, ".env"), path.join(root, "apps", "web", ".env")];
const PLACEHOLDER_RE = /change-me|changeme|placeholder|your_|xxx|replace-me|ecopet-dev-auth/i;

function parseLines(content) {
  return content.split(/\r?\n/);
}

function getVal(lines, key) {
  for (const line of lines) {
    if (line.startsWith(`${key}=`)) {
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

function setKey(lines, key, value) {
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) out.push(`${key}=${value}`);
  return out;
}

function isWeak(v) {
  if (!v || v.length < 32) return true;
  return PLACEHOLDER_RE.test(v);
}

const secret = crypto.randomBytes(32).toString("base64");
let updated = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("SKIP missing", path.relative(root, file));
    continue;
  }
  let lines = parseLines(fs.readFileSync(file, "utf8"));
  const auth = getVal(lines, "AUTH_SECRET");
  const next = getVal(lines, "NEXTAUTH_SECRET");
  let changed = false;
  if (isWeak(auth)) {
    lines = setKey(lines, "AUTH_SECRET", secret);
    changed = true;
  }
  if (isWeak(next)) {
    lines = setKey(lines, "NEXTAUTH_SECRET", secret);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, `${lines.join("\n").replace(/\n*$/, "\n")}`, "utf8");
    updated += 1;
    console.log("UPDATED", path.relative(root, file));
  } else {
    console.log("OK", path.relative(root, file));
  }
}

console.log(`DONE updated_files=${updated}`);
