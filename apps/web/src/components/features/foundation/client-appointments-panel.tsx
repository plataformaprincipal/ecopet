"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Appointment = { id: string; status: string; scheduledAt: string; pet?: { name: string }; service?: { name: string } };
type Pet = { id: string; name: string };
type Service = { id: string; name: string; price: number };

export function ClientAppointmentsPanel({ mode = "list", appointmentId, serviceId }: { mode?: "list" | "new" | "detail"; appointmentId?: string; serviceId?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [petId, setPetId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "detail" && appointmentId) {
      fetch(`/api/client/appointments`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const found = d.data.appointments.find((a: Appointment) => a.id === appointmentId);
            setAppointment(found ?? null);
          }
        })
        .finally(() => setLoading(false));
      return;
    }
    if (mode === "new") {
      Promise.all([
        fetch("/api/client/pets", { credentials: "include" }).then((r) => r.json()),
        serviceId ? fetch(`/api/client/services/${serviceId}`, { credentials: "include" }).then((r) => r.json()) : Promise.resolve(null),
      ]).then(([petsData, svcData]) => {
        if (petsData.success) setPets(petsData.data.pets);
        if (svcData?.success) setService(svcData.data.service);
      }).finally(() => setLoading(false));
      return;
    }
    fetch("/api/client/appointments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setAppointments(d.data.appointments); })
      .finally(() => setLoading(false));
  }, [mode, appointmentId, serviceId]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !petId || !startAt) return;
    setSaving(true);
    const res = await fetch("/api/client/appointments", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petId, serviceId, startAt: new Date(startAt).toISOString() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error?.message ?? "Erro"); return; }
    window.location.href = `/dashboard/client/appointments/${data.data.appointment.id}`;
  }

  async function handleCancel() {
    if (!appointmentId) return;
    const res = await fetch(`/api/client/appointments/${appointmentId}/cancel`, { method: "PATCH", credentials: "include" });
    const data = await res.json();
    if (data.success) setAppointment(data.data.appointment);
    else setError(data.error?.message ?? "Erro");
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  if (mode === "new") {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {service && <p className="text-sm">Serviço: <strong>{service.name}</strong> — R$ {service.price.toFixed(2)}</p>}
          {pets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre um pet antes de agendar.</p>
          ) : (
            <form onSubmit={handleBook} className="space-y-3">
              <select className="w-full rounded border px-3 py-2" value={petId} onChange={(e) => setPetId(e.target.value)} required>
                <option value="">Selecione o pet</option>
                {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>{saving ? "Agendando..." : "Agendar"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === "detail" && appointment) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p><strong>Status:</strong> {appointment.status}</p>
          <p><strong>Pet:</strong> {appointment.pet?.name}</p>
          <p><strong>Serviço:</strong> {appointment.service?.name}</p>
          <p><strong>Data:</strong> {new Date(appointment.scheduledAt).toLocaleString("pt-BR")}</p>
          {appointment.status !== "CANCELLED" && (
            <Button size="sm" variant="outline" onClick={handleCancel}>Cancelar agendamento</Button>
          )}
          <Button asChild variant="outline"><Link href="/dashboard/client/appointments">Voltar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button asChild><Link href="/dashboard/client/services">Buscar serviços</Link></Button>
      {appointments.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum agendamento encontrado.
        </p>
      ) : appointments.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{a.service?.name} — {a.pet?.name}</p>
              <p className="text-muted-foreground">{a.status}</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link href={`/dashboard/client/appointments/${a.id}`}>Ver</Link></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
