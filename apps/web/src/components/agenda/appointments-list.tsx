"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, Loader2, PawPrint, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { appointmentsApi } from "@/lib/appointments/api";
import {
  ATTENDANCE_LABELS,
  SERVICE_LABELS,
  STATUS_LABELS,
  STATUS_TABS,
  formatAppointmentDateTime,
} from "@/lib/appointments/labels";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointments/types";
import { todayIsoDate } from "@/lib/appointments/validation";
import { ApiRequestError } from "@/lib/api-errors";

export function AppointmentsList() {
  const { token } = useCurrentUser();
  const [tab, setTab] = useState<AppointmentStatus>("SCHEDULED");
  const [items, setItems] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<AppointmentRecord | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await appointmentsApi(token).list(tab);
      setItems(data);
    } catch {
      setError("Não foi possível carregar seus agendamentos. Tente novamente.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    appointmentsApi(token)
      .meta()
      .then((m) => setTimeSlots(m.timeSlots))
      .catch(() => {});
  }, [token]);

  async function handleCancel(id: string) {
    if (!token || !confirm("Deseja cancelar este agendamento?")) return;
    setActionLoading(true);
    setActionMsg("");
    try {
      await appointmentsApi(token).cancel(id);
      setActionMsg("Agendamento cancelado.");
      setDetail(null);
      await load();
    } catch (err) {
      setActionMsg(err instanceof ApiRequestError ? err.message : "Erro ao cancelar.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReschedule() {
    if (!token || !rescheduleId || !rescheduleDate || !rescheduleTime) return;
    setActionLoading(true);
    setActionMsg("");
    try {
      await appointmentsApi(token).reschedule(rescheduleId, {
        scheduledDate: rescheduleDate,
        scheduledTime: rescheduleTime,
      });
      setActionMsg("Agendamento reagendado com sucesso.");
      setRescheduleId(null);
      setDetail(null);
      await load();
    } catch (err) {
      setActionMsg(err instanceof ApiRequestError ? err.message : "Erro ao reagendar.");
    } finally {
      setActionLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="card-premium">
        <CardContent className="p-6 text-center text-sm text-ecopet-gray">
          Faça login para ver seus agendamentos.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.key}
            type="button"
            size="sm"
            variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" onClick={load} aria-label="Atualizar lista">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {actionMsg && (
        <p className="text-sm text-ecopet-green" role="status">{actionMsg}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-ecopet-green" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : items.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="p-8 text-center text-sm text-ecopet-gray">
            Nenhum agendamento {STATUS_LABELS[tab].toLowerCase()} encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="card-premium">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{SERVICE_LABELS[item.serviceType]}</h3>
                    <Badge variant="default">{STATUS_LABELS[item.status]}</Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ecopet-gray">
                    <span className="inline-flex items-center gap-1">
                      <PawPrint className="h-3.5 w-3.5" /> {item.pet.name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatAppointmentDateTime(item.scheduledDate, item.scheduledTime)}
                    </span>
                  </p>
                  <p className="text-xs text-ecopet-gray">{ATTENDANCE_LABELS[item.attendanceMode]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setDetail(item)}>
                    Detalhes
                  </Button>
                  {item.status === "SCHEDULED" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRescheduleId(item.id);
                          setRescheduleDate(item.scheduledDate);
                          setRescheduleTime(item.scheduledTime);
                        }}
                      >
                        Reagendar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        disabled={actionLoading}
                        onClick={() => handleCancel(item.id)}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal aria-labelledby="appointment-detail-title">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-2">
                <h2 id="appointment-detail-title" className="font-display text-lg font-bold">
                  Detalhes do agendamento
                </h2>
                <Button type="button" size="icon" variant="ghost" onClick={() => setDetail(null)} aria-label="Fechar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <dl className="grid gap-2 text-sm">
                <div><dt className="text-ecopet-gray">Serviço</dt><dd className="font-medium">{SERVICE_LABELS[detail.serviceType]}</dd></div>
                <div><dt className="text-ecopet-gray">Pet</dt><dd>{detail.pet.name}</dd></div>
                <div><dt className="text-ecopet-gray">Data e hora</dt><dd>{formatAppointmentDateTime(detail.scheduledDate, detail.scheduledTime)}</dd></div>
                <div><dt className="text-ecopet-gray">Atendimento</dt><dd>{ATTENDANCE_LABELS[detail.attendanceMode]}</dd></div>
                <div><dt className="text-ecopet-gray">Tutor</dt><dd>{detail.tutor.name} · {detail.tutor.phone ?? "—"}</dd></div>
                {detail.observations && (
                  <div><dt className="text-ecopet-gray">Observações</dt><dd>{detail.observations}</dd></div>
                )}
                {detail.cancelReason && tab === "CANCELLED" && (
                  <div><dt className="text-ecopet-gray">Motivo</dt><dd>{detail.cancelReason}</dd></div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      )}

      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal aria-labelledby="reschedule-title">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6">
              <h2 id="reschedule-title" className="font-display text-lg font-bold">Reagendar</h2>
              <div>
                <label htmlFor="reschedule-date" className="mb-1 block text-sm font-medium">Nova data</label>
                <Input id="reschedule-date" type="date" min={todayIsoDate()} value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="reschedule-time" className="mb-1 block text-sm font-medium">Novo horário</label>
                <select id="reschedule-time" className="flex h-11 w-full rounded-xl border px-4 text-sm" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}>
                  <option value="">Selecione...</option>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="button" className="flex-1" disabled={actionLoading} onClick={handleReschedule}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  Confirmar
                </Button>
                <Button type="button" variant="outline" onClick={() => setRescheduleId(null)}>Voltar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
