import fs from "node:fs";

const p =
  "C:/Users/Valnia/.cursor/projects/c-Users-Valnia-Documents-ecopet-github/agent-transcripts/7ccb5f4c-3460-4b04-a9a4-b59a8cc68ee0/7ccb5f4c-3460-4b04-a9a4-b59a8cc68ee0.jsonl";
const needle = process.argv[2];
const out = process.argv[3];
const prefer = process.argv[4] || "";
if (!needle || !out) {
  console.error("usage: node scripts/_tmp-extract-from-transcript.mjs <needle> <outfile> [preferSubstring]");
  process.exit(2);
}

const lines = fs.readFileSync(p, "utf8").split(/\n/);
let last = null;
let lastI = -1;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (!l.includes(needle)) continue;
  try {
    const o = JSON.parse(l);
    const content = o?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c.type !== "tool_use") continue;
      if (c.name === "Write" && String(c.input?.path || "").includes(needle) && c.input?.contents) {
        if (prefer && !c.input.contents.includes(prefer)) continue;
        last = c.input.contents;
        lastI = i + 1;
      }
      if (c.name === "StrReplace" && String(c.input?.path || "").includes(needle)) {
        // ignore — full Write preferred
      }
    }
  } catch {
    /* skip */
  }
}
if (!last) {
  console.error("NOT_FOUND", needle);
  process.exit(1);
}
fs.writeFileSync(out, last);
console.log("WROTE", out, last.length, "line", lastI);
