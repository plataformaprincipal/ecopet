/**
 * Unit tests for sync:env hardening rules.
 * Exit 0 on pass; non-zero on failure.
 */
import assert from "assert";
import {
  isNonEmpty,
  shouldAlignValue,
  shouldCopyIfTargetEmpty,
  shouldAddMissingKey,
  applySyncRules,
  applyCopyWebToRoot,
  INTEGRATION_KEYS,
  SYNC_KEYS,
  ALIGN_KEYS,
} from "./sync-web-env.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log("test:sync-env — regras de sync endurecidas\n");

test("isNonEmpty rejeita vazio e whitespace", () => {
  assert.strictEqual(isNonEmpty(""), false);
  assert.strictEqual(isNonEmpty("   "), false);
  assert.strictEqual(isNonEmpty(undefined), false);
  assert.strictEqual(isNonEmpty(null), false);
  assert.strictEqual(isNonEmpty("abc"), true);
});

test("empty NÃO sobrescreve filled (align)", () => {
  assert.strictEqual(shouldAlignValue("", "filled-secret"), false);
  assert.strictEqual(shouldAlignValue("   ", "filled-secret"), false);
  assert.strictEqual(shouldAlignValue(undefined, "filled-secret"), false);
});

test("non-empty source alinha quando target difere", () => {
  assert.strictEqual(shouldAlignValue("new-value", "old-value"), true);
  assert.strictEqual(shouldAlignValue("same", "same"), false);
});

test("web→root só copia se target missing/empty", () => {
  assert.strictEqual(shouldCopyIfTargetEmpty("web-secret", ""), true);
  assert.strictEqual(shouldCopyIfTargetEmpty("web-secret", undefined), true);
  assert.strictEqual(shouldCopyIfTargetEmpty("web-secret", "root-secret"), false);
  assert.strictEqual(shouldCopyIfTargetEmpty("", ""), false);
  assert.strictEqual(shouldCopyIfTargetEmpty("  ", "root-secret"), false);
});

test("missing keys são adicionadas quando source tem valor", () => {
  assert.strictEqual(shouldAddMissingKey(false, "from-root"), true);
  assert.strictEqual(shouldAddMissingKey(false, ""), false);
  assert.strictEqual(shouldAddMissingKey(true, "from-root"), false);
});

test("applySyncRules: empty root não apaga web filled", () => {
  const webContent = "OPENAI_API_KEY=sk-live-keep-me\nRESEND_API_KEY=re_keep\n";
  const rootMap = new Map([
    ["OPENAI_API_KEY", ""],
    ["RESEND_API_KEY", "   "],
  ]);
  const { aligned, lines } = applySyncRules({ webContent, rootMap });
  assert.strictEqual(aligned.length, 0);
  const body = lines.join("\n");
  assert.ok(body.includes("OPENAI_API_KEY=sk-live-keep-me"));
  assert.ok(body.includes("RESEND_API_KEY=re_keep"));
});

test("applySyncRules: missing key adicionada quando root tem valor", () => {
  const webContent = "DATABASE_URL=postgres://local\n";
  const rootMap = new Map([
    ["DATABASE_URL", "postgres://local"],
    ["TALKJS_SECRET_KEY", "sk_talkjs_from_root"],
    ["OPENAI_API_KEY", ""],
  ]);
  const { added, lines } = applySyncRules({ webContent, rootMap });
  assert.ok(added.includes("TALKJS_SECRET_KEY"));
  assert.ok(!added.includes("OPENAI_API_KEY"), "empty source must not add key");
  assert.ok(lines.join("\n").includes("TALKJS_SECRET_KEY=sk_talkjs_from_root"));
});

test("applySyncRules: align só com source não-vazio", () => {
  const webContent = "TALKJS_SECRET_KEY=old\nAI_ENABLED=false\n";
  const rootMap = new Map([
    ["TALKJS_SECRET_KEY", "new-secret"],
    ["AI_ENABLED", ""],
  ]);
  const { aligned, lines } = applySyncRules({ webContent, rootMap });
  assert.ok(aligned.includes("TALKJS_SECRET_KEY"));
  assert.ok(!aligned.includes("AI_ENABLED"));
  assert.ok(lines.join("\n").includes("TALKJS_SECRET_KEY=new-secret"));
  assert.ok(lines.join("\n").includes("AI_ENABLED=false"));
});

test("applyCopyWebToRoot: não sobrescreve filled na raiz", () => {
  const rootContent = "TALKJS_SECRET_KEY=root-keep\nNEXT_PUBLIC_TALKJS_APP_ID=\n";
  const webMap = new Map([
    ["TALKJS_SECRET_KEY", "web-overwrite-attempt"],
    ["NEXT_PUBLIC_TALKJS_APP_ID", "app-from-web"],
    ["RESEND_API_KEY", "re_from_web"],
  ]);
  const { copied, lines } = applyCopyWebToRoot({ rootContent, webMap });
  assert.ok(!copied.includes("TALKJS_SECRET_KEY"));
  assert.ok(copied.includes("NEXT_PUBLIC_TALKJS_APP_ID"));
  assert.ok(copied.includes("RESEND_API_KEY"));
  const body = lines.join("\n");
  assert.ok(body.includes("TALKJS_SECRET_KEY=root-keep"));
  assert.ok(body.includes("NEXT_PUBLIC_TALKJS_APP_ID=app-from-web"));
  assert.ok(body.includes("RESEND_API_KEY=re_from_web"));
});

test("SYNC_KEYS e ALIGN_KEYS incluem integrações", () => {
  for (const key of INTEGRATION_KEYS) {
    assert.ok(SYNC_KEYS.includes(key), `SYNC_KEYS missing ${key}`);
    assert.ok(ALIGN_KEYS.includes(key), `ALIGN_KEYS missing ${key}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
