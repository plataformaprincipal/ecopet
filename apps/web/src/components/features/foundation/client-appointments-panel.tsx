"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppointmentCalendar } from "@/components/shared/accessibility/appointment-calendar";
import { ATTENDANCE_LABELS } from "@/lib/appointments/labels";

type Appointment = {
  id: string;
  status: string;
  scheduledAt: string;
  attendanceMode?: string;
  observations?: string;
  pet?: { name: string };
  service?: { name: string; price?: number };
  partner?: { partnerProfile?: { businessName?: string } };
};

type Pet = { id: string; name: string };

type PartnerProfile = {
  businessName: string;
  address: string;
  city: string;
  state: string;
  businessHours?: string | null;
  description?: string | null;
};

type Service = {
  id: string;
  name: string;
  price: number;
  durationMin?: number;
  provider?: { partnerProfile?: PartnerProfile | null };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

export function ClientAppointmentsPanel({
  mode = "list",
  appointmentId,
  serviceId,
}: {
  mode?: "list" | "new" | "detail";
  appointmentId?: string;
  serviceId?: string;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [petId, setPetId] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<"TELEBUSCA" | "TUTOR_DELIVERY">("TELEBUSCA");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupComplement, setPickupComplement] = useState("");
  const [pickupReference, setPickupReference] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const partnerProfile = service?.provider?.partnerProfile;

  useEffect(() => {
    if (mode === "detail" && appointmentId) {
      fetch("/api/client/appointments", { credentials: "include" })
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
        serviceId
          ? fetch(`/api/public/services/${serviceId}`).then((r) => r.json())
          : Promise.resolve(null),
      ])
        .then(([petsData, svcData]) => {
          if (petsData.success) setPets(petsData.data.pets);
          if (svcData?.success) {
            const s = svcData.data.service as Service & { provider?: Service["provider"] };
            setService({
              id: s.id,
              name: s.name,
              price: s.price,
              durationMin: s.durationMin,
              provider: s.provider,
            });
          }
        })
        .finally(() => setLoading(false));
      return;
    }
    fetch("/api/client/appointments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAppointments(d.data.appointments);
      })
      .finally(() => setLoading(false));
  }, [mode, appointmentId, serviceId]);

  useEffect(() => {
    if (mode !== "new" || !serviceId || !selectedDate) {
      setSlots([]);
      setSelectedSlot("");
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/public/services/${serviceId}/availability?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSlots(d.data.slots ?? []);
        else setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [mode, serviceId, selectedDate]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !petId || !selectedSlot) {
      setError("Selecione pet, data e horário disponível.");
      return;
    }
    if (attendanceMode === "TELEBUSCA" && (!pickupAddress.trim() || !pickupPhone.trim())) {
      setError("Para tele-busca, preencha endereço e telefone.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/client/appointments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petId,
        serviceId,
        startAt: selectedSlot,
        attendanceMode,
        notes: notes || null,
        pickupAddress: attendanceMode === "TELEBUSCA" ? pickupAddress : null,
        pickupComplement: attendanceMode === "TELEBUSCA" ? pickupComplement || null : null,
        pickupReference: attendanceMode === "TELEBUSCA" ? pickupReference || null : null,
        pickupPhone: attendanceMode === "TELEBUSCA" ? pickupPhone : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      setError(data.error?.message ?? "Não foi possível agendar. Tente outro horário.");
      return;
    }
    window.location.href = `/dashboard/client/appointments/${data.data.appointment.id}`;
  }

  async function handleCancel() {
    if (!appointmentId) return;
    const res = await fetch(`/api/client/appointments/${appointmentId}/cancel`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) setAppointment(data.data.appointment);
    else setError(data.error?.message ?? "Erro ao cancelar.");
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  if (mode === "new") {
    const formErrorId = "appointment-form-error";
    return (
      <Card>
        <CardContent className="space-y-4 p-4">
          {service && (
            <div className="rounded border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{service.name}</p>
              <p className="text-muted-foreground">
                R$ {service.price.toFixed(2)} · {service.durationMin ?? 60} min
              </p>
            </div>
          )}

          {pets.length === 0 ? (
            <div className="rounded border border-dashed px-4 py-6 text-center text-sm">
              <p className="text-muted-foreground">Cadastre seu pet para agendar este serviço.</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/dashboard/client/pets/new">Cadastrar pet</Link>
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleBook}
              className="space-y-4"
              noValidate
              aria-describedby={error ? formErrorId : undefined}
            >
              <div>
                <label htmlFor="appointment-pet" className="mb-1 block text-sm font-medium">
                  Pet *
                </label>
                <select
                  id="appointment-pet"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={petId}
                  onChange={(e) => setPetId(e.target.value)}
                  required
                >
                  <option value="">Selecione o pet</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Modalidade de atendimento *</legend>
                <div className="flex flex-col gap-2 sm:flex-row" role="radiogroup">
                  {(["TELEBUSCA", "TUTOR_DELIVERY"] as const).map((modeKey) => (
                    <label
                      key={modeKey}
                      className="flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm has-[:checked]:border-primary"
                    >
                      <input
                        type="radio"
                        name="attendanceMode"
                        value={modeKey}
                        checked={attendanceMode === modeKey}
                        onChange={() => setAttendanceMode(modeKey)}
                        required
                      />
                      {ATTENDANCE_LABELS[modeKey]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {attendanceMode === "TELEBUSCA" && (
                <div className="space-y-3 rounded border bg-muted/20 p-3">
                  <p className="text-sm font-medium">Dados para tele-busca</p>
                  <div>
                    <label htmlFor="pickup-address" className="mb-1 block text-sm font-medium">
                      Endereço *
                    </label>
                    <Input
                      id="pickup-address"
                      type="text"
                      placeholder="Digite o endereço para tele-busca"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="pickup-complement" className="mb-1 block text-sm font-medium">
                      Complemento
                    </label>
                    <Input
                      id="pickup-complement"
                      type="text"
                      placeholder="Apartamento, bloco, casa..."
                      value={pickupComplement}
                      onChange={(e) => setPickupComplement(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="pickup-reference" className="mb-1 block text-sm font-medium">
                      Ponto de referência
                    </label>
                    <Input
                      id="pickup-reference"
                      type="text"
                      placeholder="Próximo ao mercado, portão azul..."
                      value={pickupReference}
                      onChange={(e) => setPickupReference(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="pickup-phone" className="mb-1 block text-sm font-medium">
                      Telefone *
                    </label>
                    <Input
                      id="pickup-phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={pickupPhone}
                      onChange={(e) => setPickupPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {attendanceMode === "TUTOR_DELIVERY" && partnerProfile && (
                <div className="space-y-2 rounded border bg-muted/20 p-3 text-sm">
                  <p className="font-medium">Entrega do pet no local</p>
                  <p>
                    <strong>Unidade:</strong> {partnerProfile.businessName}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {partnerProfile.address}, {partnerProfile.city}/
                    {partnerProfile.state}
                  </p>
                  {partnerProfile.businessHours && (
                    <p>
                      <strong>Horário de chegada:</strong> {partnerProfile.businessHours}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    Chegue com alguns minutos de antecedência. Traga a carteira de vacinação do pet, se
                    aplicável.
                  </p>
                </div>
              )}

              <AppointmentCalendar
                id="appointment-date"
                label="Data do agendamento *"
                value={selectedDate}
                onChange={setSelectedDate}
                disabledWeekdays={[0]}
              />

              {selectedDate && (
                <div>
                  <span id="appointment-slots-label" className="mb-1 block text-sm font-medium">
                    Horário disponível *
                  </span>
                  {loadingSlots ? (
                    <p className="text-sm text-muted-foreground">Carregando horários...</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-amber-700" role="status">
                      Nenhum horário livre nesta data. Escolha outro dia ou outro horário.
                    </p>
                  ) : (
                    <div
                      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                      role="radiogroup"
                      aria-labelledby="appointment-slots-label"
                    >
                      {slots.map((slot) => {
                        const label = new Date(slot).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <label
                            key={slot}
                            className={`flex cursor-pointer items-center justify-center rounded border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5`}
                          >
                            <input
                              type="radio"
                              name="appointmentSlot"
                              value={slot}
                              checked={selectedSlot === slot}
                              onChange={() => setSelectedSlot(slot)}
                              className="sr-only"
                              required={!selectedSlot}
                            />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="appointment-notes" className="mb-1 block text-sm font-medium">
                  Observações
                </label>
                <textarea
                  id="appointment-notes"
                  className="w-full rounded border px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Informações adicionais sobre o pet ou o serviço"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <p id={formErrorId} className="text-sm text-red-600" role="alert" aria-live="polite">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={saving || !selectedSlot}>
                {saving ? "Agendando..." : "Confirmar agendamento"}
              </Button>
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
          <p>
            <strong>Status:</strong> {STATUS_LABELS[appointment.status] ?? appointment.status}
          </p>
          <p>
            <strong>Pet:</strong> {appointment.pet?.name}
          </p>
          <p>
            <strong>Serviço:</strong> {appointment.service?.name}
          </p>
          <p>
            <strong>Data:</strong> {new Date(appointment.scheduledAt).toLocaleString("pt-BR")}
          </p>
          {appointment.attendanceMode && (
            <p>
              <strong>Modalidade:</strong>{" "}
              {ATTENDANCE_LABELS[appointment.attendanceMode as keyof typeof ATTENDANCE_LABELS] ??
                appointment.attendanceMode}
            </p>
          )}
          {appointment.observations && (
            <p className="whitespace-pre-wrap">
              <strong>Detalhes:</strong> {appointment.observations}
            </p>
          )}
          {appointment.partner?.partnerProfile?.businessName && (
            <p>
              <strong>Parceiro:</strong> {appointment.partner.partnerProfile.businessName}
            </p>
          )}
          {appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancelar agendamento
            </Button>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button asChild variant="ghost">
            <Link href="/dashboard/client/appointments">Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button asChild>
        <Link href="/servicos">Buscar serviços</Link>
      </Button>
      {appointments.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum agendamento encontrado.
        </p>
      ) : (
        appointments.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex justify-between p-4 text-sm">
              <div>
                <p className="font-medium">
                  {a.service?.name} — {a.pet?.name}
                </p>
                <p className="text-muted-foreground">
                  {STATUS_LABELS[a.status] ?? a.status} ·{" "}
                  {new Date(a.scheduledAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/client/appointments/${a.id}`}>Ver</Link>
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
