import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  computeReversalPoints,
  earnOrderKey,
  earnServiceKey,
  normalizeLedgerPoints,
  redeemKey,
  reverseOrderKey,
} from "./rules";

/**
 * Ledger in-memory com serialização (simula SELECT FOR UPDATE).
 * Não exige banco; cobre earn, idempotência, reversão, resgate e corrida.
 */

type Txn = {
  id: string;
  loyaltyAccountId: string;
  type: string;
  points: number;
  idempotencyKey?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  description?: string | null;
  couponCode?: string | null;
};

type Account = {
  id: string;
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  tier: string;
};

type Reward = { id: string; title: string; pointsCost: number };

function createMemoryLoyalty() {
  const accounts = new Map<string, Account>();
  const txns = new Map<string, Txn>();
  const coupons: string[] = [];
  let seq = 1;
  let chain = Promise.resolve();

  async function serialized<T>(fn: () => Promise<T>): Promise<T> {
    const run = chain.then(fn, fn);
    chain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  async function getOrCreate(userId: string) {
    let a = [...accounts.values()].find((x) => x.userId === userId);
    if (!a) {
      a = { id: `acc${seq++}`, userId, pointsBalance: 0, lifetimePoints: 0, tier: "ECCO" };
      accounts.set(a.id, a);
    }
    return a;
  }

  async function apply(params: {
    userId: string;
    type: string;
    points: number;
    idempotencyKey?: string;
    sourceType?: string;
    sourceId?: string;
    description?: string;
    couponCode?: string;
  }) {
    return serialized(async () => {
      if (params.idempotencyKey) {
        const existing = [...txns.values()].find((t) => t.idempotencyKey === params.idempotencyKey);
        if (existing) {
          return { duplicated: true as const, account: accounts.get(existing.loyaltyAccountId)!, transaction: existing };
        }
      }
      const account = await getOrCreate(params.userId);
      const points = normalizeLedgerPoints(params.type, params.points);
      const next = account.pointsBalance + points;
      if (next < 0) throw new Error("INSUFFICIENT");
      account.pointsBalance = next;
      account.lifetimePoints += points > 0 ? points : 0;
      const transaction: Txn = {
        id: `tx${seq++}`,
        loyaltyAccountId: account.id,
        type: params.type,
        points,
        idempotencyKey: params.idempotencyKey,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        description: params.description,
        couponCode: params.couponCode,
      };
      txns.set(transaction.id, transaction);
      if (params.couponCode) coupons.push(params.couponCode);
      return { duplicated: false as const, account, transaction };
    });
  }

  async function earnOrder(userId: string, orderId: string, points: number) {
    return apply({
      userId,
      type: "EARN",
      points,
      idempotencyKey: earnOrderKey(orderId),
      sourceType: "ORDER",
      sourceId: orderId,
      description: `Compra #${orderId}`,
    });
  }

  async function earnService(userId: string, appointmentId: string, points: number) {
    return apply({
      userId,
      type: "EARN",
      points,
      idempotencyKey: earnServiceKey(appointmentId),
      sourceType: "SERVICE",
      sourceId: appointmentId,
      description: "Serviço concluído",
    });
  }

  async function reverseOrder(userId: string, orderId: string, fraction = 1, refundId?: string) {
    const account = await getOrCreate(userId);
    const earned = [...txns.values()]
      .filter((t) => t.loyaltyAccountId === account.id && t.sourceType === "ORDER" && t.sourceId === orderId && t.type === "EARN")
      .reduce((s, t) => s + t.points, 0);
    const alreadyReversed = Math.abs(
      [...txns.values()]
        .filter((t) => t.loyaltyAccountId === account.id && t.sourceType === "ORDER" && t.sourceId === orderId && t.type === "REVERSAL")
        .reduce((s, t) => s + t.points, 0)
    );
    const { toReverse, unrecovered } = computeReversalPoints({
      earned,
      alreadyReversed,
      availableBalance: account.pointsBalance,
      fraction,
    });
    if (toReverse <= 0) return { skipped: true as const, unrecovered, toReverse: 0 };
    const result = await apply({
      userId,
      type: "REVERSAL",
      points: -toReverse,
      idempotencyKey: reverseOrderKey(orderId, refundId),
      sourceType: "ORDER",
      sourceId: orderId,
      description: `Estorno da compra #${orderId}`,
    });
    return { ...result, skipped: false as const, unrecovered, toReverse };
  }

  async function redeem(userId: string, reward: Reward, requestId: string) {
    return serialized(async () => {
      const key = redeemKey(userId, reward.id, requestId);
      const existing = [...txns.values()].find((t) => t.idempotencyKey === key);
      if (existing) {
        return { duplicated: true as const, account: accounts.get(existing.loyaltyAccountId)!, couponCode: existing.couponCode };
      }
      const account = await getOrCreate(userId);
      if (account.pointsBalance < reward.pointsCost) throw new Error("INSUFFICIENT");
      const couponCode = `ECCO${seq++}`;
      coupons.push(couponCode);
      const points = -Math.abs(reward.pointsCost);
      account.pointsBalance += points;
      const transaction: Txn = {
        id: `tx${seq++}`,
        loyaltyAccountId: account.id,
        type: "REDEEM",
        points,
        idempotencyKey: key,
        sourceType: "REWARD",
        sourceId: reward.id,
        description: reward.title,
        couponCode,
      };
      txns.set(transaction.id, transaction);
      return { duplicated: false as const, account, couponCode };
    });
  }

  return { apply, earnOrder, earnService, reverseOrder, redeem, getOrCreate, accounts, txns, coupons };
}

describe("loyalty ledger rules", () => {
  let mem: ReturnType<typeof createMemoryLoyalty>;
  beforeEach(() => {
    mem = createMemoryLoyalty();
  });

  it("pedido concluído gera pontos uma vez", async () => {
    const a = await mem.earnOrder("u1", "o1", 100);
    assert.equal(a.duplicated, false);
    assert.equal(a.account.pointsBalance, 100);
    assert.equal(a.transaction.description, "Compra #o1");
  });

  it("mesmo evento duas vezes não duplica crédito", async () => {
    await mem.earnOrder("u1", "o1", 100);
    const b = await mem.earnOrder("u1", "o1", 100);
    assert.equal(b.duplicated, true);
    assert.equal(b.account.pointsBalance, 100);
    assert.equal([...mem.txns.values()].filter((t) => t.type === "EARN").length, 1);
  });

  it("serviço concluído gera pontos", async () => {
    const a = await mem.earnService("u1", "apt1", 40);
    assert.equal(a.account.pointsBalance, 40);
    assert.equal(a.transaction.sourceType, "SERVICE");
  });

  it("refund gera REVERSAL proporcional e repetido não duplica", async () => {
    await mem.earnOrder("u1", "o2", 80);
    const r1 = await mem.reverseOrder("u1", "o2", 1, "rf1");
    assert.equal(r1.skipped, false);
    if (!r1.skipped) assert.equal(r1.account.pointsBalance, 0);
    const r2 = await mem.reverseOrder("u1", "o2", 1, "rf1");
    assert.equal(r2.skipped, true);
    const acc = await mem.getOrCreate("u1");
    assert.equal(acc.pointsBalance, 0);
    assert.equal([...mem.txns.values()].filter((t) => t.type === "REVERSAL").length, 1);
  });

  it("resgate com saldo suficiente gera cupom e debita", async () => {
    await mem.earnOrder("u1", "o3", 150);
    const out = await mem.redeem("u1", { id: "rw1", title: "10% de desconto", pointsCost: 100 }, "req-1");
    assert.equal(out.duplicated, false);
    assert.equal(out.account.pointsBalance, 50);
    assert.ok(out.couponCode);
    assert.equal(mem.coupons.length, 1);
  });

  it("resgate insuficiente é recusado", async () => {
    await mem.earnOrder("u1", "o4", 10);
    await assert.rejects(
      () => mem.redeem("u1", { id: "rw1", title: "10% de desconto", pointsCost: 100 }, "req-2"),
      /INSUFFICIENT/
    );
    const acc = await mem.getOrCreate("u1");
    assert.equal(acc.pointsBalance, 10);
  });

  it("dois resgates concorrentes não gastam mais do que o saldo", async () => {
    await mem.earnOrder("u1", "o5", 100);
    const reward = { id: "rw1", title: "10% de desconto", pointsCost: 80 };
    const results = await Promise.allSettled([
      mem.redeem("u1", reward, "req-a"),
      mem.redeem("u1", reward, "req-b"),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const fail = results.filter((r) => r.status === "rejected");
    assert.equal(ok.length, 1);
    assert.equal(fail.length, 1);
    const acc = await mem.getOrCreate("u1");
    assert.equal(acc.pointsBalance, 20);
    assert.equal(mem.coupons.length, 1);
  });

  it("saldo não fica negativo em redeem direto", async () => {
    await assert.rejects(
      () =>
        mem.apply({
          userId: "u1",
          type: "REDEEM",
          points: 10,
          idempotencyKey: "redeem:1",
        }),
      /INSUFFICIENT/
    );
  });
});
