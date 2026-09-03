"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layouts/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CaseRow = {
  id: string;
  sku: string;
  kind: string;
  status: string;
  crmv: string | null;
  pet: { name: string } | null;
  aiDraftJson: { summary?: string } | null;
};

export default function PartnerTeleconsultaPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [hasCrmv, setHasCrmv] = useState(false);
  const [msg, setMsg] = useState("");
  const [notes, setNotes] = useState("Documento emitido pelo profissional habilitado. IA não substitui este ato.");

  function load() {
    fetch("/api/partner/commerce/health-cases", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCases(d.data.cases);
          setHasCrmv(Boolean(d.data.hasCrmv));
        }
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function claim(id: string) {
    const res = await fetch(`/api/partner/commerce/health-cases/${id}/claim`, { method: "POST", credentials: "include" });
    const data = await res.json();
    setMsg(data.success ? "Caso assumido." : data.error?.message ?? "Falha");
    load();
  }

  async function issue(id: string) {
    const res = await fetch(`/api/partner/commerce/health-cases/${id}/issue`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Laudo/atestado identificado", notes }),
    });
    const data = await res.json();
    setMsg(data.success ? "Documento emitido com CRMV e PDF identificado." : data.error?.message ?? "Falha");
    load();
  }

  return (
    <>
      <AppHeader title="Painel clínico" />
      <main className="mx-auto max-w-4xl flex-1 space-y-4 p-4 lg:p-8">
        <p className="text-sm text-muted-foreground">
          Emissão final exige CRMV cadastrado. Rascunho de IA nunca é documento profissional.
        </p>
        {!hasCrmv ? <p className="text-sm text-red-600 dark:text-red-400">Cadastre seu CRMV para assumir casos e emitir laudos.</p> : null}
        <textarea className="w-full rounded-md border bg-background p-2 text-sm" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        {msg ? <p className="text-sm">{msg}</p> : null}
        {cases.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle>
                {c.sku} · {c.kind} · {c.pet?.name ?? "pet"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{c.status}{c.crmv ? ` · CRMV ${c.crmv}` : ""}</p>
              {c.aiDraftJson?.summary ? <p className="text-xs text-muted-foreground">Rascunho IA: {c.aiDraftJson.summary}</p> : null}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void claim(c.id)} disabled={!hasCrmv}>
                  Assumir caso
                </Button>
                <Button onClick={() => void issue(c.id)} disabled={c.status === "ISSUED" || !hasCrmv}>
                  Emitir laudo/atestado
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </>
  );
}
