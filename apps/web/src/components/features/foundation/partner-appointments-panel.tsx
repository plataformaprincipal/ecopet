"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Appointment = { id: string; status: string; scheduledAt: string; pet?: { name: string }; service?: { name: string } };

export function PartnerAppointmentsPanel({ appointmentId }: { appointmentId?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (appointmentId) {
      fetch(`/api/partner/appointments/${appointmentId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => { if (!d.success) setError(d.error?.message ?? "Erro"); else setAppointment(d.data.appointment); })
        .finally(() => setLoading(false));
    } else {
      fetch("/api/partner/appointments", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => { if (!d.success) setError(d.error?.message ?? "Erro"); else setAppointments(d.data.appointments); })
        .finally(() => setLoading(false));
    }
  }, [appointmentId]);

  async function updateStatus(status: string) {
    if (!appointmentId) return;
    const res = await fetch(`/api/partner/appointments/${appointmentId}/status`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) setAppointment(data.data.appointment);
    else setError(data.error?.message ?? "Erro");
  }

  if (loading) return <p className="text-sm">Carregando...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  if (appointmentId && appointment) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p><strong>Status:</strong> {appointment.status}</p>
          <p><strong>Pet:</strong> {appointment.pet?.name}</p>
          <p><strong>Serviço:</strong> {appointment.service?.name}</p>
          <p><strong>Data:</strong> {new Date(appointment.scheduledAt).toLocaleString("pt-BR")}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => updateStatus("CONFIRMED")}>Confirmar</Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus("CANCELLED")}>Cancelar</Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus("COMPLETED")}>Concluir</Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus("NO_SHOW")}>Não compareceu</Button>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/partner/appointments">Voltar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum agendamento encontrado.
        </p>
      ) : appointments.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{a.service?.name} — {a.pet?.name}</p>
              <p className="text-muted-foreground">{a.status} · {new Date(a.scheduledAt).toLocaleString("pt-BR")}</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link href={`/dashboard/partner/appointments/${a.id}`}>Ver</Link></Button>
          </CardContent>
        </Card>
      ))}
      <Button asChild variant="outline"><Link href="/dashboard/partner">Voltar</Link></Button>
    </div>
  );
}
