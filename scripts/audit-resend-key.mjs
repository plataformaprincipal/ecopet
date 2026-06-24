import fs from "fs";
const line = fs
  .readFileSync("apps/web/.env", "utf8")
  .split(/\r?\n/)
  .find((l) => l.startsWith("RESEND_API_KEY="));
if (!line) {
  console.log("RESEND_API_KEY: missing");
  process.exit(0);
}
const v = line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
console.log(
  JSON.stringify({
    present: true,
    prefix: v.slice(0, 7),
    length: v.length,
    looksPlaceholder: /xxxx|your|change|example|re_xxx/i.test(v),
  })
);
