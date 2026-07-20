"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { petsApi } from "@/lib/pets/api";
import type { PetSummary } from "@/lib/pets/types";
import { SPECIES_LABELS } from "@/lib/pets/labels";
import { appointmentsApi } from "@/lib/appointments/api";
import { ATTENDANCE_LABELS, SERVICE_LABELS } from "@/lib/appointments/labels";
import type { AppointmentAttendanceMode, AppointmentServiceType } from "@/lib/appointments/types";
import { todayIsoDate, validateClientAppointmentForm } from "@/lib/appointments/validation";
import { ApiRequestError } from "@/lib/api-errors";
import { analyticsService } from "@/lib/analytics/service";
import { AppointmentEvents, ServiceEvents } from "@/lib/analytics/events";

interface AppointmentBookingFormProps {
  onSuccess?: () => void;
}

export function AppointmentBookingForm({ onSuccess }: AppointmentBookingFormProps) {
  const { user, token, loading: userLoading } = useCurrentUser();
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [petId, setPetId] = useState("");
  const [serviceType, setServiceType] = useState<AppointmentServiceType | "">("");
  const [attendanceMode, setAttendanceMode] = useState<AppointmentAttendanceMode | "">("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (!token) return;
    petsApi(token)
      .list()
      .then((list) => {
        setPets(list);
        if (list.length === 1) setPetId(list[0].id);
      })
      .catch(() => setPets([]));
    appointmentsApi(token)
      .meta()
      .then((m) => setTimeSlots(m.timeSlots))
      .catch(() => setTimeSlots([]));
  }, [token]);

  const selectedPet = pets.find((p) => p.id === petId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    const clientErrors = validateClientAppointmentForm({
      petId,
      serviceType,
      attendanceMode,
      scheduledDate,
      scheduledTime,
      tutorName: user?.name ?? "",
      tutorPhone: user?.phone ?? "",
      tutorEmail: user?.email ?? "",
    });
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }
    if (!token) {
      setErrors({ form: "Faça login para confirmar o agendamento." });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await appointmentsApi(token).create({
        petId,
        serviceType: serviceType as AppointmentServiceType,
        attendanceMode: attendanceMode as AppointmentAttendanceMode,
        scheduledDate,
        scheduledTime,
        observations: observations.trim() || undefined,
      });
      analyticsService.track(AppointmentEvents.CREATED, {
        params: {
          service_type: serviceType,
          attendance_mode: attendanceMode,
        },
      });
      analyticsService.track(ServiceEvents.BOOK, {
        params: { service_type: serviceType },
      });
      setSuccessMsg("Agendamento confirmado com sucesso! Você pode acompanhar em Meus agendamentos.");
      setScheduledDate("");
      setScheduledTime("");
      setObservations("");
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Não foi possível confirmar o agendamento. Tente novamente.";
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  }

  if (userLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-ecopet-green" aria-label="Carregando" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <Card className="card-premium">
        <CardContent className="space-y-4 p-6 text-center">
          <p className="text-sm text-ecopet-gray">Entre na sua conta para agendar serviços para seus pets.</p>
          <Button asChild>
            <Link href="/login">Fazer login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errors.form && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {errors.form}
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-ecopet-green/30 bg-ecopet-green/5 p-3 text-sm text-ecopet-green" role="status">
          <CalendarCheck className="h-5 w-5 shrink-0" />
          {successMsg}
        </div>
      )}

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base">Dados do tutor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tutor-name" className="mb-1 block text-sm font-medium">Nome</label>
            <Input id="tutor-name" value={user.name} readOnly className="bg-ecopet-gray/5" aria-readonly />
          </div>
          <div>
            <label htmlFor="tutor-cpf" className="mb-1 block text-sm font-medium">CPF</label>
            <Input
              id="tutor-cpf"
              value={user.cpf ?? "Cadastre no perfil"}
              readOnly
              className="bg-ecopet-gray/5"
              aria-readonly
            />
          </div>
          <div>
            <label htmlFor="tutor-phone" className="mb-1 block text-sm font-medium">Telefone</label>
            <Input id="tutor-phone" value={user.phone ?? ""} readOnly className="bg-ecopet-gray/5" aria-readonly />
            {!user.phone && (
              <p className="mt-1 text-xs text-amber-600">
                <Link href="/perfil" className="underline">Atualize seu telefone no perfil</Link> antes de agendar.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="tutor-email" className="mb-1 block text-sm font-medium">E-mail</label>
            <Input id="tutor-email" type="email" value={user.email} readOnly className="bg-ecopet-gray/5" aria-readonly />
          </div>
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base">Pet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pets.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-ecopet-gray">
              <p>Você ainda não tem pets cadastrados.</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/meu-pet">Cadastrar pet</Link>
              </Button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="pet-select" className="mb-1 block text-sm font-medium">Selecione o pet</label>
                <select
                  id="pet-select"
                  className="flex h-11 w-full rounded-xl border border-ecopet-gray/20 bg-white px-4 text-sm dark:bg-white/5"
                  value={petId}
                  onChange={(e) => setPetId(e.target.value)}
                  required
                  aria-invalid={!!errors.petId}
                >
                  <option value="">Selecione...</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.petId && <p className="mt-1 text-xs text-red-600">{errors.petId}</p>}
              </div>
              {selectedPet && (
                <div className="grid gap-3 rounded-xl bg-ecopet-gray/5 p-4 text-sm sm:grid-cols-2 dark:bg-white/5">
                  <p><span className="text-ecopet-gray">Nome:</span> {selectedPet.name}</p>
                  <p><span className="text-ecopet-gray">Espécie:</span> {SPECIES_LABELS[selectedPet.species] ?? selectedPet.species}</p>
                  <p><span className="text-ecopet-gray">Raça:</span> {selectedPet.breed ?? "—"}</p>
                  <p><span className="text-ecopet-gray">Idade:</span> {selectedPet.age ?? "—"}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base">Agendamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="service-type" className="mb-1 block text-sm font-medium">Serviço</label>
            <select
              id="service-type"
              className="flex h-11 w-full rounded-xl border px-4 text-sm"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as AppointmentServiceType)}
              required
            >
              <option value="">Selecione o serviço...</option>
              {(Object.keys(SERVICE_LABELS) as AppointmentServiceType[]).map((key) => (
                <option key={key} value={key}>{SERVICE_LABELS[key]}</option>
              ))}
            </select>
            {errors.serviceType && <p className="mt-1 text-xs text-red-600">{errors.serviceType}</p>}
          </div>

          <div className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">Forma de atendimento</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(Object.keys(ATTENDANCE_LABELS) as AppointmentAttendanceMode[]).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm has-[:checked]:border-ecopet-green has-[:checked]:bg-ecopet-green/5">
                  <input
                    type="radio"
                    name="attendanceMode"
                    value={mode}
                    checked={attendanceMode === mode}
                    onChange={() => setAttendanceMode(mode)}
                    required
                    className="accent-ecopet-green"
                  />
                  {ATTENDANCE_LABELS[mode]}
                </label>
              ))}
            </div>
            {errors.attendanceMode && <p className="mt-1 text-xs text-red-600">{errors.attendanceMode}</p>}
          </div>

          <div>
            <label htmlFor="scheduled-date" className="mb-1 block text-sm font-medium">Data</label>
            <Input
              id="scheduled-date"
              type="date"
              min={todayIsoDate()}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
            {errors.scheduledDate && <p className="mt-1 text-xs text-red-600">{errors.scheduledDate}</p>}
          </div>

          <div>
            <label htmlFor="scheduled-time" className="mb-1 block text-sm font-medium">Horário</label>
            <select
              id="scheduled-time"
              className="flex h-11 w-full rounded-xl border px-4 text-sm"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {timeSlots.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.scheduledTime && <p className="mt-1 text-xs text-red-600">{errors.scheduledTime}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="observations" className="mb-1 block text-sm font-medium">Observações</label>
            <textarea
              id="observations"
              className="flex min-h-[96px] w-full rounded-xl border px-4 py-3 text-sm"
              placeholder="Instruções especiais, sintomas, preferências..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading || pets.length === 0}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Confirmar agendamento
      </Button>
    </form>
  );
}
