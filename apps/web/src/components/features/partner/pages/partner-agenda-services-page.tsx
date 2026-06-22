"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Clock, Plus, Star, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerPageHeader } from "../partner-page-header";
import { PartnerEmptyState } from "../partner-empty-state";
import { PartnerCardSkeleton } from "../partner-skeleton";

type ServiceRow = {
  id: string;
  name: string;
  price: number;
  status: string;
  isActive: boolean;
  category: string;
};

type AppointmentRow = {
  id: string;
  status: string;
  scheduledAt: string;
  service?: { name: string } | null;
  user?: { name: string } | null;
  pet?: { name: string } | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  service?: { name: string } | null;
  user?: { name: string } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PartnerAgendaServicesPage({ partnerId }: { partnerId: string }) {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<"services" | "appointments" | "history" | "reviews">("services");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [svcRes, aptRes, revRes] = await Promise.all([
        fetch("/api/partner/services", { credentials: "include" }),
        fetch("/api/partner/appointments", { credentials: "include" }),
        fetch(`/api/reviews?partnerId=${partnerId}`, { credentials: "include" }),
      ]);
      const svcJson = await svcRes.json();
      const aptJson = await aptRes.json();
      const revJson = await revRes.json();
      if (svcJson.success) setServices(svcJson.data.services ?? []);
      if (aptJson.success) setAppointments(aptJson.data.appointments ?? []);
      if (revJson.success) setReviews(revJson.data.reviews ?? []);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = appointments.filter((a) => a.status === "PENDING");
  const upcoming = appointments.filter((a) => ["CONFIRMED", "SCHEDULED"].includes(a.status));
  const history = appointments.filter((a) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status));
  const activeServices = services.filter((s) => s.status === "ACTIVE" && s.isActive);

  return (
    <div className="space-y-6">
      <PartnerPageHeader
        title="Agenda e Serviços"
        description="Gerencie serviços, agendamentos recebidos, solicitações pendentes e histórico de atendimentos."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/dashboard/partner/availability">
                <Clock className="h-4 w-4" />
                Gerenciar horários
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/dashboard/partner/appointments">
                <CalendarClock className="h-4 w-4" />
                Ver agenda
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href="/dashboard/partner/services/new">
                <Plus className="h-4 w-4" />
                Novo serviço
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Serviços ativos", value: activeServices.length },
          { label: "Pendentes", value: pending.length },
          { label: "Próximos", value: upcoming.length },
          { label: "Avaliações", value: reviews.length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
          >
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "services" as const, label: "Serviços" },
          { key: "appointments" as const, label: "Agendamentos" },
          { key: "history" as const, label: "Histórico" },
          { key: "reviews" as const, label: "Avaliações" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              section === key
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <PartnerCardSkeleton />
      ) : section === "services" ? (
        services.length === 0 ? (
          <PartnerEmptyState
            icon={Wrench}
            title="Nenhum serviço cadastrado"
            description="Cadastre serviços para receber agendamentos de clientes EcoPet."
            actionLabel="Novo serviço"
            actionHref="/dashboard/partner/services/new"
          />
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{service.name}</p>
                  <p className="text-sm text-zinc-500">
                    {service.category} · R$ {service.price.toFixed(2)} ·{" "}
                    {service.status === "ACTIVE" && service.isActive ? "Ativo" : "Inativo"}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/partner/services/${service.id}/edit`}>Editar</Link>
                </Button>
              </div>
            ))}
          </div>
        )
      ) : section === "appointments" ? (
        pending.length === 0 && upcoming.length === 0 ? (
          <PartnerEmptyState
            icon={CalendarClock}
            title="Nenhum agendamento"
            description="Quando clientes agendarem seus serviços, eles aparecerão aqui."
            actionLabel="Ver agenda completa"
            actionHref="/dashboard/partner/appointments"
          />
        ) : (
          <div className="space-y-3">
            {[...pending, ...upcoming].map((apt) => (
              <Link
                key={apt.id}
                href={`/dashboard/partner/appointments/${apt.id}`}
                className="block rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {apt.service?.name ?? "Serviço"} · {apt.user?.name ?? "Cliente"}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatDate(apt.scheduledAt)} · Pet: {apt.pet?.name ?? "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                    {apt.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : section === "history" ? (
        history.length === 0 ? (
          <PartnerEmptyState
            icon={CalendarClock}
            title="Sem histórico de atendimentos"
            description="Atendimentos concluídos, cancelados ou no-show aparecerão aqui."
          />
        ) : (
          <div className="space-y-3">
            {history.map((apt) => (
              <div
                key={apt.id}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium text-zinc-900 dark:text-white">
                  {apt.service?.name} · {apt.user?.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {formatDate(apt.scheduledAt)} · {apt.status}
                </p>
              </div>
            ))}
          </div>
        )
      ) : reviews.length === 0 ? (
        <PartnerEmptyState
          icon={Star}
          title="Nenhuma avaliação recebida"
          description="Avaliações de clientes sobre seus serviços aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-zinc-900 dark:text-white">{review.rating}/5</span>
                <span className="text-sm text-zinc-500">· {review.service?.name}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {review.comment ?? "Sem comentário"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {review.user?.name} · {formatDate(review.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
