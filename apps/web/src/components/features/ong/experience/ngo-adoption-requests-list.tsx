"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Mail } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatDateTime } from "@/lib/i18n/format";

type AdoptionRequest = {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  animal: { id: string; name: string; species: string; photo: string | null } | null;
  requester: { id: string; name: string | null; email: string | null };
  contactAuthorized: boolean;
};

const ACTIONS: Array<{ status: string; labelKey: string; tone: string }> = [
  { status: "UNDER_REVIEW", labelKey: "ngoArea.adoptions.review", tone: "bg-amber-500 hover:bg-amber-600" },
  { status: "APPROVED", labelKey: "ngoArea.adoptions.approve", tone: "bg-emerald-500 hover:bg-emerald-600" },
  { status: "REJECTED", labelKey: "ngoArea.adoptions.reject", tone: "bg-zinc-400 hover:bg-zinc-500" },
  { status: "COMPLETED", labelKey: "ngoArea.adoptions.complete", tone: "bg-rose-500 hover:bg-rose-600" },
  { status: "CANCELLED", labelKey: "ngoArea.adoptions.cancel", tone: "bg-zinc-400 hover:bg-zinc-500" },
];

export function NgoAdoptionRequestsList() {
  const { t, locale } = useTranslation();
  const [requests, setRequests] = useState<AdoptionRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/ong/adoption-requests", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setRequests(json.data.requests);
      })
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/ong/adoption-requests/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
        {t("ngoArea.adoptions.title")}
      </h1>

      {requests === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900/60">
          <Heart className="mx-auto h-10 w-10 text-zinc-300" aria-hidden />
          <p className="mt-3 text-sm text-zinc-500">{t("ngoArea.adoptions.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li
              key={req.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex items-start gap-4">
                {req.animal?.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={req.animal.photo}
                    alt={req.animal?.name ?? ""}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                    <Heart className="h-6 w-6 text-rose-500" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {req.requester.name ?? "—"}
                    </p>
                    <span className="text-xs text-zinc-500">
                      {t("ngoArea.adoptions.interestedIn")} {req.animal?.name ?? "—"}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                      {t(`ngoArea.requestStatus.${req.status}` as string)}
                    </span>
                  </div>
                  {req.message ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      <span className="text-zinc-400">{t("ngoArea.adoptions.initialMessage")}: </span>
                      {req.message}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-zinc-400">{formatDateTime(req.createdAt, locale)}</p>
                  {req.contactAuthorized && req.requester.email ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                      {req.requester.email}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIONS.filter((a) => a.status !== req.status).map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    disabled={busy === req.id}
                    onClick={() => changeStatus(req.id, a.status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50 ${a.tone}`}
                  >
                    {t(a.labelKey)}
                  </button>
                ))}
                <Link
                  href="/ngo/messages"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  {t("ngoArea.adoptions.talk")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
