"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function PartnerAvailabilityPanel() {
  const [slots, setSlots] = useState<{ weekday: number; startTime: string; endTime: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weekday: 1, startTime: "09:00", endTime: "18:00" });

  useEffect(() => {
    fetch("/api/partner/availability", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setSlots(d.data.slots ?? []); })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/partner/availability", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: [...slots, form] }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error?.message ?? "Erro"); return; }
    const refreshed = await fetch("/api/partner/availability", { credentials: "include" });
    const refreshedData = await refreshed.json();
    if (refreshedData.success) setSlots(refreshedData.data.slots ?? []);
    setError("");
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  return (
    <div className="space-y-4">
      {slots.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma disponibilidade configurada.
        </p>
      ) : (
        slots.map((s, i) => (
          <Card key={i}><CardContent className="p-4 text-sm">{WEEKDAYS[s.weekday]}: {s.startTime} – {s.endTime}</CardContent></Card>
        ))
      )}
      <Card>
        <CardContent className="space-y-3 p-4">
          <form onSubmit={handleSave} className="space-y-3">
            <select className="w-full rounded border px-3 py-2" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
              {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Adicionar horário"}</Button>
          </form>
        </CardContent>
      </Card>
      <Button asChild variant="outline"><Link href="/dashboard/partner">Voltar</Link></Button>
    </div>
  );
}
