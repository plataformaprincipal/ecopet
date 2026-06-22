"use client";

import Link from "next/link";
import { MapPin, PawPrint } from "lucide-react";
import { SPECIES_LABELS } from "@/lib/pets/labels";
import type { SerializedOngListing } from "@/lib/ong/serialize-listing";
import { ANIMAL_STATUS_LABELS, type OngAnimalDisplayStatus } from "@/lib/ong/adoption-listing-meta";
import { OngAnimalStatusBadge } from "./ong-status-badge";
import { Button } from "@/components/ui/button";

const statusVariant: Record<
  OngAnimalDisplayStatus,
  "success" | "warning" | "muted" | "danger"
> = {
  disponivel: "success",
  em_analise: "warning",
  adotado: "muted",
  indisponivel: "danger",
};

type OngAnimalCardProps = {
  listing: SerializedOngListing;
  onEdit?: () => void;
  onChangeStatus?: () => void;
  onViewInterested?: () => void;
  canManage?: boolean;
};

export function OngAnimalCard({
  listing,
  onEdit,
  onChangeStatus,
  onViewInterested,
  canManage = true,
}: OngAnimalCardProps) {
  const displayStatus = listing.displayStatus as OngAnimalDisplayStatus;
  const photo = listing.photos[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60">
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <PawPrint className="h-12 w-12 opacity-40" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <OngAnimalStatusBadge
            label={ANIMAL_STATUS_LABELS[displayStatus]}
            variant={statusVariant[displayStatus]}
          />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">{listing.name}</h3>
          <p className="text-sm text-zinc-500">
            {SPECIES_LABELS[listing.species as keyof typeof SPECIES_LABELS] ?? listing.species}
            {listing.breed ? ` · ${listing.breed}` : ""}
            {listing.age ? ` · ${listing.age}` : ""}
          </p>
          {(listing.city || listing.state) && (
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
              <MapPin className="h-3 w-3" />
              {[listing.city, listing.state].filter(Boolean).join(" / ")}
            </p>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{listing.description}</p>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {onEdit ? (
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                Editar
              </Button>
            ) : null}
            {onChangeStatus ? (
              <Button type="button" variant="outline" size="sm" onClick={onChangeStatus}>
                Alterar status
              </Button>
            ) : null}
            {onViewInterested ? (
              <Button type="button" variant="ghost" size="sm" onClick={onViewInterested}>
                Ver interessados
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
