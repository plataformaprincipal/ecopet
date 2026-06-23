"use client";

import { useTranslation } from "@/providers/i18n-provider";
import type { ApiSocialPost } from "@/lib/social/client-api";

type AdoptionMeta = {
  animalName?: string;
  species?: string;
  approximateAge?: string;
  sex?: string;
  size?: string;
  city?: string;
  state?: string;
  description?: string;
  status?: "AVAILABLE" | "IN_REVIEW" | "ADOPTED";
};

function statusLabel(t: (k: string) => string, status?: string) {
  if (status === "IN_REVIEW") return t("socialFeed.adoption.statusInReview");
  if (status === "ADOPTED") return t("socialFeed.adoption.statusAdopted");
  return t("socialFeed.adoption.statusAvailable");
}

export function AdoptionMetaCard({ post }: { post: ApiSocialPost }) {
  const { t } = useTranslation();
  if (post.type !== "ADOPTION" || !post.adoptionMeta) return null;

  const meta = post.adoptionMeta as AdoptionMeta;

  return (
    <div className="mx-4 mb-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm">
      {meta.animalName && <p className="font-semibold text-emerald-900">{meta.animalName}</p>}
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-emerald-800">
        {meta.species && (
          <>
            <dt>{t("socialFeed.adoption.species")}</dt>
            <dd>{meta.species}</dd>
          </>
        )}
        {meta.approximateAge && (
          <>
            <dt>{t("socialFeed.adoption.age")}</dt>
            <dd>{meta.approximateAge}</dd>
          </>
        )}
        {meta.sex && (
          <>
            <dt>{t("socialFeed.adoption.sex")}</dt>
            <dd>{meta.sex}</dd>
          </>
        )}
        {meta.size && (
          <>
            <dt>{t("socialFeed.adoption.size")}</dt>
            <dd>{meta.size}</dd>
          </>
        )}
        {(meta.city || meta.state) && (
          <>
            <dt>{t("socialFeed.adoption.location")}</dt>
            <dd>{[meta.city, meta.state].filter(Boolean).join(" / ")}</dd>
          </>
        )}
      </dl>
      {meta.description && <p className="mt-2 text-xs text-emerald-900">{meta.description}</p>}
      <p className="mt-2 text-xs font-medium text-emerald-700">{statusLabel(t, meta.status)}</p>
    </div>
  );
}
