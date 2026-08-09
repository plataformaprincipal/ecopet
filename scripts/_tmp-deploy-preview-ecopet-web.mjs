/**
 * Deploy Preview only to ecopet-web from monorepo root.
 * Never --prod. Restores root .vercel after deploy.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const rootVercel = path.join(root, ".vercel", "project.json");
const webVercel = path.join(root, "apps", "web", ".vercel", "project.json");

function loadToken() {
  let token = process.env.VERCEL_TOKEN?.trim() || "";
  const authCandidates = [
    path.join(os.homedir(), "AppData", "Roaming", "xdg.data", "com.vercel.cli", "auth.json"),
    path.join(os.homedir(), "AppData", "Roaming", "com.vercel.cli", "Data", "auth.json"),
  ];
  for (const a of authCandidates) {
    if (token) break;
    if (!fs.existsSync(a)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(a, "utf8"));
      token = String(j.token || j.accessToken || "").trim();
    } catch {
      /* ignore */
    }
  }
  return token;
}

// Prefer CLI session. Only honor explicit VERCEL_TOKEN (ignore stale auth.json).
const token = process.env.VERCEL_TOKEN?.trim() || "";
const tokenArgs = token ? [`--token`, token] : [];
void loadToken;

const webProject = JSON.parse(fs.readFileSync(webVercel, "utf8"));
if (webProject.projectName !== "ecopet-web") {
  console.error("expected ecopet-web, got", webProject.projectName);
  process.exit(1);
}

const expectedSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const expectedShort = expectedSha.slice(0, 7);
console.log("LOCAL_HEAD", expectedSha);
console.log("AUTH_MODE", token ? "token_env_or_file" : "cli_session");

const backup = fs.existsSync(rootVercel) ? fs.readFileSync(rootVercel, "utf8") : null;
fs.mkdirSync(path.dirname(rootVercel), { recursive: true });
fs.writeFileSync(rootVercel, JSON.stringify(webProject, null, 2) + "\n");
console.log("SWAPPED root .vercel -> ecopet-web");

function runVercel(args, cwd) {
  const cmd = ["npx", "--yes", "vercel@58.7.1", ...args, ...tokenArgs, "--non-interactive"];
  return execSync(cmd.join(" "), {
    cwd,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
    env: token ? { ...process.env, VERCEL_TOKEN: token } : { ...process.env },
  });
}

let deployUrl = "";
let exitCode = 0;
try {
  // First try without token (CLI session). If token present but invalid, retry without.
  let out = "";
  try {
    out = runVercel(["deploy", "--yes", "--target=preview"], root);
  } catch (e1) {
    const msg = `${e1.stdout || ""}${e1.stderr || ""}${e1.message || ""}`;
    if (token && /token is not valid/i.test(msg)) {
      console.log("TOKEN_INVALID_RETRY_CLI_SESSION");
      tokenArgs.length = 0;
      out = runVercel(["deploy", "--yes", "--target=preview"], root);
    } else {
      throw e1;
    }
  }
  process.stdout.write(out);
  // Vercel CLI 58+ may print JSON; older CLIs print the URL on the last line.
  try {
    const jsonStart = out.indexOf("{");
    const jsonEnd = out.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(out.slice(jsonStart, jsonEnd + 1));
      deployUrl =
        parsed?.deployment?.url ||
        parsed?.url ||
        parsed?.deployment?.alias?.[0] ||
        "";
      if (deployUrl && !deployUrl.startsWith("http")) {
        deployUrl = `https://${deployUrl}`;
      }
    }
  } catch {
    /* fall through */
  }
  if (!deployUrl.includes("vercel.app")) {
    const lines = out
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const hit = [...lines].reverse().find((l) => /vercel\.app/.test(l));
    deployUrl = hit || lines[lines.length - 1] || "";
  }
  console.log("DEPLOY_URL", deployUrl);
} catch (e) {
  exitCode = 1;
  process.stdout.write(e.stdout || "");
  process.stderr.write(e.stderr || "");
  console.error("DEPLOY_FAILED");
} finally {
  if (backup !== null) {
    fs.writeFileSync(rootVercel, backup);
    console.log("RESTORED root .vercel");
  } else if (fs.existsSync(rootVercel)) {
    fs.unlinkSync(rootVercel);
    console.log("REMOVED temporary root .vercel");
  }
}

if (exitCode !== 0) process.exit(exitCode);

// Inspect commit on deployment
try {
  const inspect = runVercel(["inspect", deployUrl], path.join(root, "apps", "web"));
  const commitLine = inspect
    .split(/\r?\n/)
    .find((l) => /commit|sha|git/i.test(l) && /[0-9a-f]{7,}/i.test(l));
  console.log("INSPECT_COMMIT_HINT", commitLine || "(see full inspect below)");
  const shaMatch = inspect.match(/\b([0-9a-f]{7,40})\b/g) || [];
  const hit = shaMatch.find((s) => expectedSha.startsWith(s) || s.startsWith(expectedShort));
  console.log(
    JSON.stringify({
      expectedShort,
      matched: Boolean(hit),
      matchedSha: hit || null,
    })
  );
  for (const l of inspect.split(/\r?\n/)) {
    if (/commit|Created|Status|Environment|URL|name|target/i.test(l)) {
      console.log("I>", l.trim());
    }
  }
} catch (e) {
  console.log("INSPECT_WARN", String(e.stderr || e.message).slice(0, 400));
}

if (deployUrl.includes("vercel.app")) {
  try {
    const aliasOut = runVercel(
      ["alias", "set", deployUrl, "homolog.eccopet.com", "--scope", "ecopet-s-projects"],
      path.join(root, "apps", "web")
    );
    console.log("ALIAS_OK", aliasOut.trim().split(/\r?\n/).slice(-5).join(" | "));
  } catch (e) {
    console.log(
      "ALIAS_WARN",
      `${e.stdout || ""}${e.stderr || ""}`.trim().slice(0, 500)
    );
  }
}

console.log("DONE", deployUrl);
