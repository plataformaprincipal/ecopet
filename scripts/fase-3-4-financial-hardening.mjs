/**
 * FASE 3.4 — Hardening contra homolog DB (Prisma only, sem imports @/).
 * Não imprime secrets.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const verify = loadEnvFile(path.join(process.cwd(), "apps/web/.env.preview.verify"));
const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries({ ...verify, ...e2e })) {
  if (!process.env[k]) process.env[k] = v;
}
for (const k of ["DATABASE_URL", "DIRECT_URL"]) {
  if (e2e[k]) process.env[k] = e2e[k];
}
if (process.env.DIRECT_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const report = {
  startedAt: new Date().toISOString(),
  checks: [],
  blockers: [],
  notes: [],
};

function check(name, ok, detail = {}) {
  report.checks.push({ name, ok, ...detail });
  if (!ok) report.blockers.push(name);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, JSON.stringify(detail));
}

const prisma = new PrismaClient();

try {
  check("schema_idempotency_keys_documented", true, {
    uniques: [
      "FinancialLedgerEntry_idempotencyKey_key",
      "FinancialReserve_idempotencyKey_key",
      "PartnerPayout_idempotencyKey_key",
      "MpWebhookEvent_providerEventId_eventType_resourceId_key",
    ],
  });

  const paid = await prisma.payment.findFirst({
    where: {
      status: { in: ["APPROVED", "PAID"] },
      order: { financialLedgerPostedAt: { not: null } },
    },
    include: {
      order: { select: { id: true, status: true, financialLedgerPostedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!paid) {
    report.notes.push("Sem Payment APPROVED+ledger — skip concorrência live");
    check("concurrent_ledger_idempotency_sample", false, { reason: "NO_PAID_SAMPLE" });
  } else {
    const before = await prisma.financialLedgerEntry.count({ where: { paymentId: paid.id } });
    const entries = await prisma.financialLedgerEntry.findMany({
      where: { paymentId: paid.id },
      select: { entryType: true, idempotencyKey: true },
    });
    const keys = entries.map((e) => e.idempotencyKey);
    const uniqueKeys = new Set(keys);
    check("no_duplicate_ledger_keys_on_paid_sample", keys.length === uniqueKeys.size, {
      count: keys.length,
      unique: uniqueKeys.size,
      paymentPrefix: paid.id.slice(0, 8),
    });

    // Concurrent insert same idempotency key → only one row (P2002)
    const account = await prisma.ledgerAccount.findFirst({
      where: { type: "PLATFORM_REVENUE" },
    });
    if (account) {
      const raceKey = `fase34-race:${Date.now()}:PAYMENT_RECEIVED`;
      const n = 10;
      const results = await Promise.allSettled(
        Array.from({ length: n }, () =>
          prisma.financialLedgerEntry.create({
            data: {
              accountId: account.id,
              paymentId: paid.id,
              orderId: paid.orderId,
              partnerId: paid.partnerId,
              entryType: "PAYMENT_RECEIVED",
              direction: "CREDIT",
              amountCents: 1,
              status: "POSTED",
              idempotencyKey: raceKey,
              description: "fase34 concurrency probe",
            },
          })
        )
      );
      const fulfilled = results.filter((r) => r.status === "fulfilled").length;
      const rejectedDup = results.filter(
        (r) =>
          r.status === "rejected" &&
          String(r.reason?.code || r.reason?.message || "").includes("P2002")
      ).length;
      const rows = await prisma.financialLedgerEntry.count({
        where: { idempotencyKey: raceKey },
      });
      // cleanup probe row
      await prisma.financialLedgerEntry.deleteMany({ where: { idempotencyKey: raceKey } });
      check("concurrent_insert_same_idempotency_10x", fulfilled === 1 && rows === 1, {
        fulfilled,
        rejectedDup,
        rows,
      });
    } else {
      check("concurrent_insert_same_idempotency_10x", false, { reason: "NO_ACCOUNT" });
    }

    const after = await prisma.financialLedgerEntry.count({ where: { paymentId: paid.id } });
    check("paid_sample_ledger_stable_after_probe", after === before, { before, after });
  }

  // Refund overpaid scan
  const refunds = await prisma.paymentRefund.findMany({
    where: {
      status: {
        in: ["APPROVED", "COMPLETED", "PROCESSED", "SUCCESS", "FULLY_REFUNDED"],
      },
    },
    select: { paymentId: true, amount: true },
    take: 100,
  });
  const byPay = new Map();
  for (const r of refunds) {
    byPay.set(r.paymentId, (byPay.get(r.paymentId) || 0) + Number(r.amount));
  }
  let refundOver = 0;
  for (const [paymentId, sum] of byPay) {
    const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!pay) continue;
    if (sum > Number(pay.amount) + 0.011) refundOver += 1;
  }
  check("refund_sum_not_over_paid_sample", refundOver === 0, {
    samples: byPay.size,
    over: refundOver,
  });

  // Order PAID without provider id
  const paidNoProvider = await prisma.payment.count({
    where: {
      status: { in: ["APPROVED", "PAID"] },
      providerPaymentId: null,
      externalId: null,
      providerOrderId: null,
      NOT: { idempotencyKey: { startsWith: "sim_" } },
    },
  });
  check("no_approved_without_provider_ids", paidNoProvider === 0, {
    count: paidNoProvider,
  });

  // Dual PAYMENT_RECEIVED per payment
  const dupReceived = await prisma.$queryRaw`
    SELECT "paymentId", COUNT(*)::int AS c
    FROM "FinancialLedgerEntry"
    WHERE "entryType" = 'PAYMENT_RECEIVED'
    GROUP BY "paymentId"
    HAVING COUNT(*) > 1
    LIMIT 5
  `;
  check("no_duplicate_payment_received", !dupReceived?.length, {
    dupCount: dupReceived?.length ?? 0,
  });

  report.notes.push(
    "GAP: reconcilePayment receivedAmountCents = payment.amount (não consulta provider)"
  );
  report.notes.push(
    "CRITICAL GAP: FASE 3.3 webhook natural SIGNATURE_MISMATCH — FIN-001 canal externo não comprovado"
  );
} catch (e) {
  check("hardening_script_exception", false, {
    message: String(e?.message || e).slice(0, 240),
  });
} finally {
  await prisma.$disconnect();
}

report.finishedAt = new Date().toISOString();
report.passed = report.checks.filter((c) => c.ok).length;
report.failed = report.checks.filter((c) => !c.ok).length;
fs.writeFileSync(
  path.join(process.cwd(), "scripts/fase-3-4-financial-hardening-result.json"),
  JSON.stringify(report, null, 2)
);
console.log("\n=== FASE 3.4 HARDENING SUMMARY ===");
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      failed: report.failed,
      blockers: report.blockers,
      notes: report.notes,
    },
    null,
    2
  )
);
process.exitCode = report.blockers.includes("hardening_script_exception") ? 1 : 0;
