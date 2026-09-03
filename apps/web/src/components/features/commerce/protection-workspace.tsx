"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Enrollment = {
  id: string;
  sku: string;
  status: string;
  amountCents: number;
  coverageJson: { note?: string } | null;
  exclusionsJson: { note?: string } | null;
  claims: Array<{ id: string; status: string; description: string }>;
};

export function ProtectionWorkspace() {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/commerce/protection", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRows(d.data.enrollments ?? []);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function claim(id: string, description: string) {
    const res = await fetch(`/api/commerce/protection/${id}/claims`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    setMsg(data.success ? "Sinistro aberto com o operador." : data.error?.message ?? "Sinistro bloqueado até cobertura ativa.");
    load();
  }

  return (
    <section className="space-y-4" data-testid="protection-workspace">
      <p className="text-sm text-muted-foreground">
        A EccoPet intermediária não assume risco. Prêmio não é receita integral. Sinistro só com adesão ACTIVE de seguradora/corretora.
      </p>
      {msg ? <p className="text-sm">{msg}</p> : null}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma adesão. Contratação permanece PARTNER_REQUIRED.</p> : null}
      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <CardTitle>
              {row.sku} · {row.status}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{(row.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / mês (referência PFO)</p>
            <p>Cobertura: {row.coverageJson?.note}</p>
            <p>Exclusões: {row.exclusionsJson?.note}</p>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const description = (e.currentTarget.elements.namedItem("desc") as HTMLTextAreaElement).value;
                void claim(row.id, description);
              }}
            >
              <textarea name="desc" className="rounded-md border bg-background p-2" rows={2} placeholder="Descrição do sinistro" />
              <Button type="submit" variant="outline" disabled={row.status !== "ACTIVE"}>
                Abrir sinistro
              </Button>
            </form>
            <ul>
              {row.claims.map((c) => (
                <li key={c.id}>
                  {c.status}: {c.description}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
