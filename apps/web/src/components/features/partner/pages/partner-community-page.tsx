"use client";

import { useState } from "react";
import { PenSquare, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialFeed } from "@/components/features/social/feed/social-feed";
import { PostComposer } from "@/components/features/social/feed/post-composer";
import { PartnerPageHeader } from "../partner-page-header";
import { PartnerPendingBanner } from "../partner-pending-banner";
import type { PartnerAccessLevel } from "@/lib/partner/access";

type PartnerCommunityPageProps = {
  partnerId: string;
  accessLevel: PartnerAccessLevel;
};

export function PartnerCommunityPage({ partnerId, accessLevel }: PartnerCommunityPageProps) {
  const [tab, setTab] = useState<"ecosystem" | "mine">("ecosystem");
  const [refreshKey, setRefreshKey] = useState(0);
  const canPublish = accessLevel === "full";

  return (
    <div className="space-y-6">
      <PartnerPageHeader
        title="Comunidade EcoPet"
        description="Feed do ecossistema pet. Conecte-se com clientes, ONGs e parceiros — publique, comente, curta, salve e compartilhe."
        actions={
          canPublish ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => document.getElementById("partner-post-composer")?.scrollIntoView({ behavior: "smooth" })}
            >
              <PenSquare className="h-4 w-4" />
              Criar publicação
            </Button>
          ) : null
        }
      />

      {accessLevel === "limited" ? (
        <PartnerPendingBanner accessLevel={accessLevel} />
      ) : null}

      <div className="inline-flex rounded-xl border border-zinc-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        <button
          type="button"
          onClick={() => setTab("ecosystem")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "ecosystem"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Ecossistema
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "mine"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
          }`}
        >
          Minhas publicações
        </button>
      </div>

      {canPublish ? (
        <div id="partner-post-composer">
          <PostComposer onPublished={() => setRefreshKey((k) => k + 1)} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
          Publicações estarão disponíveis após a aprovação da sua conta. Enquanto isso, acompanhe o
          feed do ecossistema.
        </div>
      )}

      <SocialFeed
        key={`${tab}-${refreshKey}`}
        authorId={tab === "mine" ? partnerId : undefined}
      />
    </div>
  );
}
