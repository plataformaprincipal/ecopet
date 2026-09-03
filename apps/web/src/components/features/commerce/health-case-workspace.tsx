"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CaseRow = {
  id: string;
  sku: string;
  kind: string;
  status: string;
  crmv: string | null;
  scheduledAt: string | null;
  aiDraftJson: { summary?: string } | null;
  pet: { name: string } | null;
  documents: Array<{ id: string; title: string; isFinal: boolean; signedByCrmv: string | null }>;
};

type Pro = { userId: string; name: string; crmv: string; crmvState: string | null };

export function HealthCaseWorkspace({ skuDefault }: { skuDefault?: string }) {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [pets, setPets] = useState<Array<{ id: string; name: string }>>([]);
  const [pros, setPros] = useState<Pro[]>([]);
  const [petId, setPetId] = useState("");
  const [sku, setSku] = useState(skuDefault ?? "SAU-008");
  const [intake, setIntake] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/commerce/health-cases", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCases(d.data.cases);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
    fetch("/api/ai-commerce/pets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setPets(d.data.pets ?? []);
        if (d.data.pets?.length === 1) setPetId(d.data.pets[0].id);
      })
      .catch(() => undefined);
    fetch("/api/commerce/health-cases/professionals", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPros(d.data.professionals ?? []);
      })
      .catch(() => undefined);
  }, []);

  async function openCase() {
    if (!petId) {
      setMsg("Selecione um pet.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/commerce/health-cases", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, petId, intake: { notes: intake } }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.success ? "Caso aberto. Envie exames e pague o SKU correspondente." : data.error?.message ?? "Falha");
    load();
  }

  async function upload(id: string, file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("title", file.name);
    form.set("kind", "EXAME");
    const res = await fetch(`/api/commerce/health-cases/${id}/documents`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json();
    setMsg(data.success ? "Exame enviado." : data.error?.message ?? "Upload falhou");
    load();
  }

  async function draft(id: string) {
    const res = await fetch(`/api/commerce/health-cases/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ai-draft", notes: intake }),
    });
    const data = await res.json();
    setMsg(data.success ? "Rascunho assistivo gerado — não é laudo." : data.error?.message ?? "Falha");
    load();
  }

  async function schedule(id: string, professionalUserId: string, when: string) {
    const res = await fetch(`/api/commerce/health-cases/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule", professionalUserId, scheduledAt: new Date(when).toISOString() }),
    });
    const data = await res.json();
    setMsg(data.success ? "Agendamento registrado." : data.error?.message ?? "Sem profissional habilitado.");
    load();
  }

  return (
    <section className="space-y-4" data-testid="health-case-workspace">
      <Card>
        <CardHeader>
          <CardTitle>Abrir caso clínico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A IA organiza dados. Laudo/atestado final exige veterinário com CRMV. Teleconsulta habilitada permanece PARTNER_REQUIRED até haver profissional cadastrado.
          </p>
          <label className="block text-sm">
            Pet
            <select className="mt-1 w-full rounded-md border bg-background p-2" value={petId} onChange={(e) => setPetId(e.target.value)}>
              <option value="">Selecione</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            SKU
            <select className="mt-1 w-full rounded-md border bg-background p-2" value={sku} onChange={(e) => setSku(e.target.value)}>
              {["SAU-006", "SAU-007", "SAU-008", "SAU-009", "SAU-010", "SAU-011", "SAU-012", "SAU-013", "SAU-029"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <textarea
            className="w-full rounded-md border bg-background p-2 text-sm"
            rows={3}
            placeholder="Sintomas, exames já feitos, dúvidas"
            value={intake}
            onChange={(e) => setIntake(e.target.value)}
          />
          <Button onClick={() => void openCase()} disabled={busy}>
            Abrir caso
          </Button>
          {pros.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum veterinário com CRMV cadastrado. Agendamento e teleconsulta habilitada continuam PARTNER_REQUIRED.</p>
          ) : (
            <p className="text-xs text-muted-foreground">{pros.length} profissional(is) habilitado(s) disponível(is).</p>
          )}
        </CardContent>
      </Card>
      {msg ? <p className="text-sm">{msg}</p> : null}
      {cases.map((c) => (
        <Card key={c.id}>
          <CardHeader>
            <CardTitle>
              {c.sku} · {c.pet?.name ?? "pet"} · {c.status}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Tipo: {c.kind}{c.crmv ? ` · CRMV ${c.crmv}` : ""}</p>
            {c.aiDraftJson?.summary ? <p className="rounded-md bg-muted p-2">{c.aiDraftJson.summary}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void draft(c.id)}>
                Rascunho IA
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm">
                Enviar exame
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(c.id, file);
                  }}
                />
              </label>
              {pros.length > 0 ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const professionalUserId = (form.elements.namedItem("pro") as HTMLSelectElement).value;
                    const when = (form.elements.namedItem("when") as HTMLInputElement).value;
                    if (when) void schedule(c.id, professionalUserId, when);
                  }}
                >
                  <select name="pro" className="rounded-md border bg-background p-2">
                    {pros.map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.name} · CRMV {p.crmv}
                      </option>
                    ))}
                  </select>
                  <input name="when" type="datetime-local" className="rounded-md border bg-background p-2" />
                  <Button type="submit" variant="outline">
                    Agendar
                  </Button>
                </form>
              ) : null}
            </div>
            <ul className="text-xs text-muted-foreground">
              {c.documents.map((d) => (
                <li key={d.id}>
                  {d.title} {d.isFinal ? `· FINAL CRMV ${d.signedByCrmv ?? ""}` : ""}
                </li>
              ))}
            </ul>
            <Link className="underline" href={`/dashboard/client/pets`}>
              Ver Health Profile do pet
            </Link>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
