"use client";

import Link from "next/link";
import { MessageSquare, PawPrint } from "lucide-react";
import type { SerializedOngListing } from "@/lib/ong/serialize-listing";
import { ANIMAL_STATUS_LABELS, type OngAnimalDisplayStatus } from "@/lib/ong/adoption-listing-meta";
import { OngAnimalStatusBadge } from "./ong-status-badge";
import { Button } from "@/components/ui/button";

type OngAdoptionRequestCardProps = {
  listing: SerializedOngListing;
};

export function OngAdoptionRequestCard({ listing }: OngAdoptionRequestCardProps) {
  const displayStatus = listing.displayStatus as OngAnimalDisplayStatus;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <PawPrint className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-zinc-900 dark:text-white">{listing.name}</h3>
            <OngAnimalStatusBadge
              label={ANIMAL_STATUS_LABELS[displayStatus]}
              variant={displayStatus === "em_analise" ? "warning" : "muted"}
            />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Cadastrado em{" "}
            {new Date(listing.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
        <Link href="/dashboard/messages">
          <MessageSquare className="h-4 w-4" />
          Mensagens
        </Link>
      </Button>
    </article>
  );
}
