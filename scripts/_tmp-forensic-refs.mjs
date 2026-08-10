import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "packages/database/prisma/migrations");

const models = [
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
];

const enums = [
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
];

const dirs = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort(); // folder names are chronological timestamps

function findRefs(sql, name) {
  const hits = [];
  const patterns = [
    { kind: "CREATE TABLE", re: new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?["']?${name}["']?\\b`, "i") },
    { kind: "CREATE TYPE", re: new RegExp(`CREATE\\s+TYPE\\s+["']?${name}["']?\\b`, "i") },
    { kind: "ALTER TABLE", re: new RegExp(`ALTER\\s+TABLE\\s+["']?${name}["']?\\b`, "i") },
    { kind: "REFERENCES", re: new RegExp(`REFERENCES\\s+["']?${name}["']?\\s*\\(`, "i") },
    { kind: "INDEX ON", re: new RegExp(`ON\\s+["']?${name}["']?\\s*\\(`, "i") },
    { kind: "TYPE USAGE", re: new RegExp(`["']${name}["']`, "g") }, // quoted type/table name
    { kind: "BARE WORD", re: new RegExp(`\\b${name}\\b`, "g") },
  ];

  const lines = sql.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const p of patterns) {
      if (p.re.test(line)) {
        // Avoid false positives: Campaign inside CampaignUrgency etc. handled by word boundary
        // Prefer more specific kinds; record first matching kind on this line
        hits.push({ line: i + 1, kind: p.kind, text: line.trim().slice(0, 160) });
        break;
      }
    }
  }
  return hits;
}

const loaded = dirs.map((name) => {
  const sqlPath = path.join(migrationsDir, name, "migration.sql");
  const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, "utf8") : "";
  return { name, sql };
});

function firstRef(target) {
  for (const m of loaded) {
    const hits = findRefs(m.sql, target);
    if (hits.length) {
      return {
        target,
        firstMigration: m.name,
        firstLine: hits[0].line,
        firstKind: hits[0].kind,
        firstText: hits[0].text,
        hitCountInFirst: hits.length,
      };
    }
  }
  return {
    target,
    firstMigration: null,
    firstLine: null,
    firstKind: null,
    firstText: null,
    hitCountInFirst: 0,
  };
}

const modelResults = models.map(firstRef);
const enumResults = enums.map(firstRef);

const allWithRef = [...modelResults, ...enumResults].filter((r) => r.firstMigration);
const earliest = allWithRef
  .map((r) => r.firstMigration)
  .sort()[0];

console.log(JSON.stringify({
  migrationOrder: dirs,
  earliestReferencingMigration: earliest,
  models: modelResults,
  enums: enumResults,
}, null, 2));
