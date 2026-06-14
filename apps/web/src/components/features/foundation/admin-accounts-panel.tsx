"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PartnerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cnpj: string | null;
  accountStatus: string;
  createdAt: string;
  partnerProfile: {
    businessName: string;
    legalName: string;
    cnpj: string;
    category: string;
    city: string;
    state: string;
  } | null;
};

type OngRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cnpj: string | null;
  accountStatus: string;
  createdAt: string;
  ongProfile: {
    ongName: string;
    cnpj: string;
    responsibleName: string;
    city: string;
    state: string;
  } | null;
};

async function review(userId: string, action: "approve" | "reject" | "suspend", reason?: string) {
  const res = await fetch(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message ?? "Falha na operação");
  }
  return data;
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

export function AdminAccountsPanel({ mode }: { mode: "all" | "partners" | "ongs" }) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [ongs, setOngs] = useState<OngRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "partners") {
        const res = await fetch("/api/admin/accounts/partners?status=PENDING", { credentials: "include" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);
        setPartners(data.data.partners);
      } else if (mode === "ongs") {
        const res = await fetch("/api/admin/accounts/ongs?status=PENDING", { credentials: "include" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);
        setOngs(data.data.ongs);
      } else {
        const res = await fetch("/api/admin/accounts", { credentials: "include" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);
        setPartners(data.data.partners);
        setOngs(data.data.ongs);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(userId: string, action: "approve" | "reject" | "suspend") {
    setBusyId(userId);
    setError("");
    try {
      await review(userId, action, reasonById[userId]);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando solicitações...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant={mode === "all" ? "default" : "outline"} size="sm">
          <Link href="/dashboard/admin/accounts">Visão geral</Link>
        </Button>
        <Button asChild variant={mode === "partners" ? "default" : "outline"} size="sm">
          <Link href="/dashboard/admin/accounts/partners">Parceiros</Link>
        </Button>
        <Button asChild variant={mode === "ongs" ? "default" : "outline"} size="sm">
          <Link href="/dashboard/admin/accounts/ongs">ONGs</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/admin">Voltar ao painel</Link>
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(mode === "all" || mode === "partners") && (
        <Card>
          <CardHeader>
            <CardTitle>Parceiros pendentes</CardTitle>
            <CardDescription>
              {partners.length === 0
                ? "Nenhum parceiro aguardando aprovação."
                : `${partners.length} solicitação(ões) pendente(s).`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partners.length === 0 ? (
              <EmptyState message="Nenhum parceiro pendente no momento." />
            ) : (
              partners.map((p) => (
                <div key={p.id} className="rounded-lg border p-4 text-sm space-y-2">
                  <p><strong>{p.partnerProfile?.businessName ?? p.name}</strong></p>
                  <p>Razão social: {p.partnerProfile?.legalName}</p>
                  <p>CNPJ: {p.partnerProfile?.cnpj}</p>
                  <p>Categoria: {p.partnerProfile?.category}</p>
                  <p>E-mail: {p.email}</p>
                  <p>Telefone: {p.phone ?? "—"}</p>
                  <p>Cidade/UF: {p.partnerProfile?.city}/{p.partnerProfile?.state}</p>
                  <Input
                    placeholder="Motivo (obrigatório para rejeição)"
                    value={reasonById[p.id] ?? ""}
                    onChange={(e) => setReasonById((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" disabled={busyId === p.id} onClick={() => handleAction(p.id, "approve")}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => handleAction(p.id, "reject")}>
                      Rejeitar
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busyId === p.id} onClick={() => handleAction(p.id, "suspend")}>
                      Suspender
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {(mode === "all" || mode === "ongs") && (
        <Card>
          <CardHeader>
            <CardTitle>ONGs pendentes</CardTitle>
            <CardDescription>
              {ongs.length === 0
                ? "Nenhuma ONG aguardando aprovação."
                : `${ongs.length} solicitação(ões) pendente(s).`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ongs.length === 0 ? (
              <EmptyState message="Nenhuma ONG pendente no momento." />
            ) : (
              ongs.map((o) => (
                <div key={o.id} className="rounded-lg border p-4 text-sm space-y-2">
                  <p><strong>{o.ongProfile?.ongName ?? o.name}</strong></p>
                  <p>Responsável: {o.ongProfile?.responsibleName}</p>
                  <p>CNPJ: {o.ongProfile?.cnpj}</p>
                  <p>E-mail: {o.email}</p>
                  <p>Telefone: {o.phone ?? "—"}</p>
                  <p>Cidade/UF: {o.ongProfile?.city}/{o.ongProfile?.state}</p>
                  <Input
                    placeholder="Motivo (obrigatório para rejeição)"
                    value={reasonById[o.id] ?? ""}
                    onChange={(e) => setReasonById((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" disabled={busyId === o.id} onClick={() => handleAction(o.id, "approve")}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === o.id} onClick={() => handleAction(o.id, "reject")}>
                      Rejeitar
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busyId === o.id} onClick={() => handleAction(o.id, "suspend")}>
                      Suspender
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
