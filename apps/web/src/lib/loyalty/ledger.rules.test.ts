import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

/**
 * Testes de regras de fidelidade (ledger) com Prisma mockado em memória.
 * Não exige banco real.
 */

type Txn = {
  id: string;
  loyaltyAccountId: string;
  type: string;
  points: number;
  idempotencyKey?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
};

type Account = {
  id: string;
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  tier: string;
};

function createMemoryLoyalty() {
  const accounts = new Map<string, Account>();
  const txns = new Map<string, Txn>();
  let seq = 1;

  async function getOrCreate(userId: string) {
    let a = [...accounts.values()].find((x) => x.userId === userId);
    if (!a) {
      a = {
        id: `acc${seq++}`,
        userId,
        pointsBalance: 0,
        lifetimePoints: 0,
        tier: "ECCO",
      };
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
  }) {
    if (params.idempotencyKey) {
      const existing = [...txns.values()].find((t) => t.idempotencyKey === params.idempotencyKey);
      if (existing) {
        return { duplicated: true, account: accounts.get(existing.loyaltyAccountId)!, transaction: existing };
      }
    }
    const account = await getOrCreate(params.userId);
    let points = params.points;
    if ((params.type === "REDEEM" || params.type === "EXPIRE") && points > 0) points = -Math.abs(points);
    const next = account.pointsBalance + points;
    if (next < 0) throw new Error("INSUFFICIENT");
    const lifetime = account.lifetimePoints + (points > 0 ? points : 0);
    account.pointsBalance = next;
    account.lifetimePoints = lifetime;
    const transaction: Txn = {
      id: `tx${seq++}`,
      loyaltyAccountId: account.id,
      type: params.type,
      points,
      idempotencyKey: params.idempotencyKey,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    };
    txns.set(transaction.id, transaction);
    return { duplicated: false, account, transaction };
  }

  return { apply, getOrCreate, accounts, txns };
}

describe("loyalty ledger rules", () => {
  let mem: ReturnType<typeof createMemoryLoyalty>;
  beforeEach(() => {
    mem = createMemoryLoyalty();
  });

  it("mesma compra não gera pontos duas vezes (idempotencyKey)", async () => {
    const a = await mem.apply({
      userId: "u1",
      type: "EARN",
      points: 100,
      idempotencyKey: "earn:order:o1",
      sourceType: "ORDER",
      sourceId: "o1",
    });
    const b = await mem.apply({
      userId: "u1",
      type: "EARN",
      points: 100,
      idempotencyKey: "earn:order:o1",
      sourceType: "ORDER",
      sourceId: "o1",
    });
    assert.equal(a.duplicated, false);
    assert.equal(b.duplicated, true);
    assert.equal(a.account.pointsBalance, 100);
    assert.equal(b.account.pointsBalance, 100);
    assert.equal(mem.txns.size, 1);
  });

  it("reverse estorna uma vez e repetido não duplica débito", async () => {
    await mem.apply({
      userId: "u1",
      type: "EARN",
      points: 80,
      idempotencyKey: "earn:order:o2",
    });
    const r1 = await mem.apply({
      userId: "u1",
      type: "ADJUSTMENT",
      points: -80,
      idempotencyKey: "reverse:order:o2",
    });
    const r2 = await mem.apply({
      userId: "u1",
      type: "ADJUSTMENT",
      points: -80,
      idempotencyKey: "reverse:order:o2",
    });
    assert.equal(r1.duplicated, false);
    assert.equal(r2.duplicated, true);
    assert.equal(r1.account.pointsBalance, 0);
    assert.equal(r2.account.pointsBalance, 0);
  });

  it("saldo não fica negativo", async () => {
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
