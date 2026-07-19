import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getFirebasePublicConfig,
  isFirebaseClientReady,
  isFirebasePublicConfigured,
  isFirebaseVapidConfigured,
  maskProjectId,
} from "./config";
import {
  classifyFcmError,
  sanitizeErrorMessage,
  PERMANENT_TOKEN_ERROR_CODES,
} from "./errors";
import { sanitizeNotificationUrl } from "./safe-url";
import {
  buildFcmPayload,
  mapNotificationTypeToCategory,
  toFcmDataRecord,
} from "./notification-builder";
import { normalizeFirebasePrivateKey } from "./private-key";

describe("firebase public config", () => {
  it("returns null when vars missing", () => {
    const env = {} as NodeJS.ProcessEnv;
    assert.equal(getFirebasePublicConfig(env), null);
    assert.equal(isFirebasePublicConfigured(env), false);
    assert.equal(isFirebaseClientReady(env), false);
  });

  it("accepts complete public config + vapid", () => {
    const env = {
      NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaTestKey",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-project",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
      NEXT_PUBLIC_FIREBASE_VAPID_KEY: "BNpublicvapidkeyexample",
    } as unknown as NodeJS.ProcessEnv;
    const cfg = getFirebasePublicConfig(env);
    assert.ok(cfg);
    assert.equal(cfg!.projectId, "demo-project");
    assert.equal(isFirebaseVapidConfigured(env), true);
    assert.equal(isFirebaseClientReady(env), true);
  });

  it("rejects placeholders", () => {
    const env = {
      NEXT_PUBLIC_FIREBASE_API_KEY: "your_api_key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "x.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "changeme",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "x.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:x",
      NEXT_PUBLIC_FIREBASE_VAPID_KEY: "BNxxx",
    } as unknown as NodeJS.ProcessEnv;
    assert.equal(getFirebasePublicConfig(env), null);
  });

  it("masks project id", () => {
    assert.equal(maskProjectId("ecopet-prod"), "eco***od");
    assert.equal(maskProjectId(null), null);
  });
});

describe("firebase private key normalization", () => {
  it("converts literal \\n to newlines", () => {
    const raw =
      "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n";
    const normalized = normalizeFirebasePrivateKey(raw);
    assert.ok(normalized);
    assert.ok(normalized!.includes("\n"));
    assert.ok(!normalized!.includes("\\n"));
  });

  it("returns null for missing/invalid key", () => {
    assert.equal(normalizeFirebasePrivateKey(undefined), null);
    assert.equal(normalizeFirebasePrivateKey("not-a-key"), null);
  });
});

describe("safe notification urls", () => {
  it("allows internal routes", () => {
    assert.equal(sanitizeNotificationUrl("/client/orders/1"), "/client/orders/1");
    assert.equal(sanitizeNotificationUrl("/admin/financeiro"), "/admin/financeiro");
  });

  it("blocks open redirects and external urls", () => {
    assert.equal(sanitizeNotificationUrl("https://evil.com"), "/notifications");
    assert.equal(sanitizeNotificationUrl("//evil.com"), "/notifications");
    assert.equal(sanitizeNotificationUrl("javascript:alert(1)"), "/notifications");
    assert.equal(sanitizeNotificationUrl("/unknown-root"), "/notifications");
  });
});

describe("payload builder", () => {
  it("builds summarized payload and data record", () => {
    const payload = buildFcmPayload({
      title: "Pedido atualizado",
      body: "Seu pedido mudou de status",
      url: "/client/orders/abc",
      type: "ORDER",
      notificationId: "n1",
    });
    assert.equal(payload.title, "Pedido atualizado");
    assert.equal(payload.url, "/client/orders/abc");
    const data = toFcmDataRecord(payload);
    assert.equal(data.title, payload.title);
    assert.equal(data.url, payload.url);
  });

  it("redacts cpf-like content", () => {
    const payload = buildFcmPayload({
      title: "Doc 123.456.789-09",
      body: "ok",
    });
    assert.ok(!payload.title.includes("123.456.789-09"));
  });

  it("maps types to categories", () => {
    assert.equal(mapNotificationTypeToCategory("PAYMENT"), "payments");
    assert.equal(mapNotificationTypeToCategory("MESSAGE"), "messages");
    assert.equal(mapNotificationTypeToCategory("CAMPAIGN"), "marketing");
    assert.equal(mapNotificationTypeToCategory("SECURITY"), "security");
  });
});

describe("fcm error classification", () => {
  it("marks permanent token errors", () => {
    const c = classifyFcmError("messaging/registration-token-not-registered");
    assert.equal(c.permanent, true);
    assert.equal(c.retryable, false);
    assert.ok(PERMANENT_TOKEN_ERROR_CODES.size > 0);
  });

  it("marks transient errors as retryable", () => {
    const c = classifyFcmError("messaging/server-unavailable");
    assert.equal(c.retryable, true);
    assert.equal(c.permanent, false);
  });

  it("sanitizes error messages", () => {
    const s = sanitizeErrorMessage("Bearer abc.def.ghi failed");
    assert.ok(!s.includes("abc.def.ghi"));
  });
});

describe("secret exposure guards", () => {
  it("public config module source must not reference private key env literally in client-safe helpers", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const configPath = path.join(process.cwd(), "src/lib/firebase/config.ts");
    const src = fs.readFileSync(configPath, "utf8");
    assert.ok(!src.includes("FIREBASE_PRIVATE_KEY"));
    assert.ok(!src.includes("FIREBASE_CLIENT_EMAIL"));
  });
});
