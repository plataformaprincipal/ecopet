import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fullPath = path.join(root, "scripts/_tmp-schema-full.sql");
const outDir = path.join(
  root,
  "packages/database/prisma/migrations/20260623115959_add_missing_core_tables",
);
const outPath = path.join(outDir, "migration.sql");

const TABLES = new Set([
  "SocialPost",
  "SocialPostMedia",
  "SocialPostLike",
  "SocialComment",
  "SocialCommentLike",
  "SocialPostSave",
  "SocialPostShare",
  "SocialReport",
  "SocialPostHashtag",
  "PublicProfile",
  "UserFollow",
  "UserSocialBlock",
  "AdoptionRequest",
  "Campaign",
  "MessageReaction",
  "MessageReport",
  "UserBlock",
  "PushSubscription",
  "DataPrivacyRequest",
  "UploadAsset",
]);

const ENUMS = new Set([
  "AdoptionRequestStatus",
  "CampaignCategory",
  "CampaignStatus",
  "CampaignUrgency",
  "ConversationContextType",
  "DataPrivacyRequestStatus",
  "DataPrivacyRequestType",
  "MessageReportStatus",
  "PublicProfileVisibility",
  "SocialCommentStatus",
  "SocialMediaType",
  "SocialPostStatus",
  "SocialPostVisibility",
  "SocialReportReason",
  "SocialReportStatus",
  "SupportCategory",
]);

/** Columns added later by 20260623120000_social_post_persona_types — must NOT be in this migration. */
const SOCIAL_POST_DEFERRED_COLUMNS = new Set([
  "authorRole",
  "type",
  "linkedProductId",
  "linkedServiceId",
  "linkedCampaignId",
  "adoptionMeta",
  "isPinned",
  "isFeatured",
]);

const SOCIAL_POST_DEFERRED_INDEXES = new Set([
  "SocialPost_type_idx",
  "SocialPost_authorRole_idx",
]);

const full = fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, "");
const lines = full.split(/\r?\n/);

/** Split into statement blocks ending at blank line after semicolon, or continuous CREATE/ALTER blocks. */
function extractStatements(sqlLines) {
  const stmts = [];
  let buf = [];
  let inStmt = false;

  const flush = () => {
    if (!buf.length) return;
    const text = buf.join("\n").trim();
    if (text) stmts.push(text);
    buf = [];
    inStmt = false;
  };

  for (const line of sqlLines) {
    const trimmed = line.trim();
    if (!inStmt) {
      if (
        trimmed.startsWith("--") ||
        trimmed === "" ||
        trimmed.startsWith("/*")
      ) {
        continue;
      }
      inStmt = true;
      buf.push(line);
      if (trimmed.endsWith(";")) flush();
      continue;
    }
    buf.push(line);
    if (trimmed.endsWith(";")) flush();
  }
  flush();
  return stmts;
}

const statements = extractStatements(lines);

function stripSocialPostPersonaColumns(createSql) {
  // Remove deferred column lines and deferred indexes from SocialPost CREATE / indexes
  const out = [];
  const linesLocal = createSql.split(/\r?\n/);
  for (const line of linesLocal) {
    const colMatch = line.match(/^\s*"(\w+)"\s+/);
    if (colMatch && SOCIAL_POST_DEFERRED_COLUMNS.has(colMatch[1])) {
      continue;
    }
    out.push(line);
  }
  // After removing columns, ensure valid comma before CONSTRAINT / closing paren
  let text = out.join("\n");
  // Ensure comma before CONSTRAINT (required SQL)
  text = text.replace(/([^,\s])(\s*\n\s*CONSTRAINT)/g, "$1,$2");
  // Drop trailing comma before closing paren only
  text = text.replace(/,(\s*\n\s*\))/g, "$1");
  return text;
}

const createTypes = [];
const createTables = [];
const createIndexes = [];
const addConstraints = [];

for (const stmt of statements) {
  const createType = stmt.match(/^CREATE TYPE "([^"]+)"/i);
  if (createType) {
    if (ENUMS.has(createType[1])) createTypes.push(stmt);
    continue;
  }

  const createTable = stmt.match(/^CREATE TABLE "([^"]+)"/i);
  if (createTable) {
    if (!TABLES.has(createTable[1])) continue;
    let sql = stmt;
    if (createTable[1] === "SocialPost") {
      sql = stripSocialPostPersonaColumns(sql);
    }
    createTables.push(sql);
    continue;
  }

  const createIndex = stmt.match(
    /^CREATE( UNIQUE)? INDEX "([^"]+)" ON "([^"]+)"/i,
  );
  if (createIndex) {
    const indexName = createIndex[2];
    const table = createIndex[3];
    if (!TABLES.has(table)) continue;
    if (SOCIAL_POST_DEFERRED_INDEXES.has(indexName)) continue;
    createIndexes.push(stmt);
    continue;
  }

  // ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
  const alterFk = stmt.match(
    /^ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" FOREIGN KEY/i,
  );
  if (alterFk) {
    const table = alterFk[1];
    // Keep FK if it is ON one of our tables (outgoing FK from our new tables)
    if (!TABLES.has(table)) continue;
    addConstraints.push(stmt);
    continue;
  }
}

// Stable order: enums alphabetical by appearance in extracted list (schema order preserved from full file)
// Tables: keep order from full schema file (already dependency-friendly for Prisma)

const header = `-- Catch-up: CREATE missing core tables/enums that schema.prisma defines
-- but no prior migration created. Placed immediately before
-- 20260623120000_social_post_persona_types (which ALTERs SocialPost).
--
-- Intentionally OMITTED from SocialPost (added by the next migration):
-- authorRole, type, linkedProductId, linkedServiceId, linkedCampaignId,
-- adoptionMeta, isPinned, isFeatured (+ indexes on type/authorRole).
-- SocialPostType enum is also created by that next migration — not here.
`;

const parts = [
  header.trim(),
  "",
  "-- CreateEnum",
  ...createTypes.flatMap((s) => [s, ""]),
  "-- CreateTable",
  ...createTables.flatMap((s) => [s, ""]),
  "-- CreateIndex",
  ...createIndexes.flatMap((s) => [s, ""]),
  "-- AddForeignKey",
  ...addConstraints.flatMap((s) => [s, ""]),
];

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, parts.join("\n").replace(/\n{3,}/g, "\n\n"), "utf8");

console.log(
  JSON.stringify(
    {
      outPath,
      createTypes: createTypes.map((s) => s.match(/"([^"]+)"/)[1]),
      createTables: createTables.map((s) => s.match(/CREATE TABLE "([^"]+)"/i)[1]),
      createIndexCount: createIndexes.length,
      fkCount: addConstraints.length,
      socialPostHasTypeCol: /"type"/.test(
        createTables.find((s) => s.includes('CREATE TABLE "SocialPost"')) || "",
      ),
      socialPostHasAuthorRole: /"authorRole"/.test(
        createTables.find((s) => s.includes('CREATE TABLE "SocialPost"')) || "",
      ),
      enumsMissing: [...ENUMS].filter(
        (e) => !createTypes.some((s) => s.includes(`"${e}"`)),
      ),
      tablesMissing: [...TABLES].filter(
        (t) => !createTables.some((s) => s.includes(`CREATE TABLE "${t}"`)),
      ),
    },
    null,
    2,
  ),
);
