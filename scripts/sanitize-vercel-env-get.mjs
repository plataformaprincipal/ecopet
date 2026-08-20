/**
 * Reads one Vercel Production env via CLI and prints only sanitized host/ref.
 * Never prints the raw value.
 */
import { spawnSync } from "node:child_process";

const name = process.argv[2];
const environment = process.argv[3] || "production";
if (!name) {
  console.error("usage: node scripts/sanitize-vercel-env-get.mjs <ENV_NAME> [environment]");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["vercel", "env", "get", name, environment, "--yes"],
  {
    encoding: "utf8",
    shell: true,
    timeout: 120000,
  },
);

const raw = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
if (result.status !== 0 && !raw) {
  console.log(JSON.stringify({ name, environment, ok: false, error: "CLI_FAILED", status: result.status }));
  process.exit(1);
}

const lines = raw.split(/\r?\n/).filter((l) => l && !l.startsWith("Retrieving") && !l.startsWith(">") && !l.startsWith("npm warn") && !l.startsWith("Vercel CLI"));
const value = lines[lines.length - 1]?.trim() || "";
const present = Boolean(value) && value !== "[SENSITIVE]" && !value.includes("SENSITIVE");
const redacted = value === "[SENSITIVE]" || value.includes("SENSITIVE");

function hostOf(url) {
  try {
    const u = new URL(url);
    return { hostname: u.hostname, port: u.port || "", protocol: u.protocol.replace(":", "") };
  } catch {
    return null;
  }
}

function refOf(url) {
  try {
    const host = new URL(url).hostname;
    const user = decodeURIComponent(new URL(url).username || "");
    const m =
      host.match(/^db\.([a-z0-9]+)\./i) ||
      host.match(/postgres\.([a-z0-9]+)\./i) ||
      user.match(/^postgres\.([a-z0-9]+)$/i) ||
      user.match(/\.([a-z0-9]{20,})$/i);
    if (m) {
      const ref = m[1];
      return `${ref.slice(0, 4)}…${ref.slice(-4)}`;
    }
    return host.replace(/^(.{6}).+(.{6})$/, "$1…$2");
  } catch {
    return null;
  }
}

const parsed = present ? hostOf(value) : null;
const report = {
  name,
  environment,
  present: present || redacted,
  redacted,
  looksUrl: Boolean(parsed),
  hostname: parsed?.hostname || (redacted ? "(redacted)" : present ? "(not-a-url)" : "(missing)"),
  port: parsed?.port || "",
  ref: present ? refOf(value) : redacted ? "(redacted)" : null,
  cliStatus: result.status,
};

console.log(JSON.stringify(report, null, 2));
process.exit(0);
