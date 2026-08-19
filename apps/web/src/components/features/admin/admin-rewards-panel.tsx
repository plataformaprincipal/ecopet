"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Lookup = {
  user?: { id: string; email: string; name: string };
  account?: { pointsBalance: number; lifetimePoints: number; tier: string };
  transactions?: Array<{ id: string; type: string; points: number; description: string | null; sourceType: string | null; createdAt: string }>;
  policy?: { enabled: boolean; pointsPerBrl: number; referralEnabled: boolean; expirationDays: number | null };
};

export function AdminRewardsPanel() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [points, setPoints] = useState("0");
  const [data, setData] = useState<Lookup | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/loyalty?email=${encodeURIComponent(email)}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setMessage(json.error?.message ?? "Não encontrado.");
        setData(null);
        return;
      }
      setData(json.data as Lookup);
    } finally {
      setBusy(false);
    }
  }

  async function adjust() {
    if (!data?.user) return;
    const n = Number(points);
    if (!Number.isFinite(n) || n === 0) {
      setMessage("Informe um valor diferente de zero.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/loyalty/adjust", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          points: n,
          reason,
          requestId: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `a${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setMessage(json.error?.message ?? "Falha no ajuste.");
        return;
      }
      setMessage(`Saldo atualizado: ${json.data.pointsBalance}`);
      await lookup();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">EccoPontos — Admin</h1>
      <p className="text-sm text-muted-foreground">Consulta de saldo, histórico, reversões e ajuste manual com motivo obrigatório. O saldo nunca é editado fora do ledger.</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-mail do tutor" aria-label="E-mail" />
        <Button onClick={() => void lookup()} disabled={busy}>Consultar</Button>
      </div>
      {message ? <p className="text-sm" role="status">{message}</p> : null}

      {data?.policy ? (
        <section className="rounded-xl border p-4 text-sm">
          <h2 className="font-medium">Política</h2>
          <p>Ativo: {data.policy.enabled ? "sim" : "não"} · {data.policy.pointsPerBrl} ponto(s)/R$ · indicação: {data.policy.referralEnabled ? "ativa" : "DISABLED"} · validade: {data.policy.expirationDays ?? "none"}</p>
        </section>
      ) : null}

      {data?.account && data.user ? (
        <>
          <section className="rounded-xl border p-4 text-sm">
            <h2 className="font-medium">{data.user.name}</h2>
            <p>{data.user.email}</p>
            <p className="mt-2 font-semibold">Saldo: {data.account.pointsBalance} · lifetime {data.account.lifetimePoints} · {data.account.tier}</p>
          </section>
          <section className="space-y-2 rounded-xl border p-4">
            <h2 className="font-medium">Ajuste manual</h2>
            <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} aria-label="Pontos" />
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (obrigatório)" aria-label="Motivo" />
            <Button onClick={() => void adjust()} disabled={busy || reason.trim().length < 8}>Lançar ADJUSTMENT</Button>
          </section>
          <section>
            <h2 className="mb-2 font-medium">Histórico</h2>
            <ul className="space-y-1 text-sm">
              {(data.transactions ?? []).map((tx) => (
                <li key={tx.id}>
                  {tx.type} {tx.points} — {tx.description ?? tx.sourceType} — {new Date(tx.createdAt).toLocaleString("pt-BR")}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}
