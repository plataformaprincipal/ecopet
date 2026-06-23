"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StartConversationButton } from "@/components/messages/StartConversationButton";
import { useTranslation } from "@/providers/i18n-provider";
import { useAuthGate } from "@/providers/auth-gate-provider";
import type { ApiSocialPost } from "@/lib/social/client-api";

export function PostCtaBar({ post }: { post: ApiSocialPost }) {
  const { t } = useTranslation();
  const { requireAuth } = useAuthGate();
  const role = post.author.role;

  if (role === "PARTNER") {
    return (
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {post.linkedProductId && (
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/marketplace/produto/${post.linkedProductId}`}>{t("socialFeed.cta.viewProduct")}</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => requireAuth(() => {
                window.location.href = `/marketplace/produto/${post.linkedProductId}`;
              })}
            >
              {t("socialFeed.cta.buy")}
            </Button>
          </>
        )}
        {post.linkedServiceId && (
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/marketplace/servico/${post.linkedServiceId}`}>{t("socialFeed.cta.viewService")}</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => requireAuth(() => {
                window.location.href = `/agenda?servico=${post.linkedServiceId}`;
              })}
            >
              {t("socialFeed.cta.schedule")}
            </Button>
          </>
        )}
        <StartConversationButton
          size="sm"
          variant="secondary"
          participantUserId={post.authorId}
          contextType="GENERAL"
          label={t("messagesModule.contactPartner")}
          ariaLabel={t("messagesModule.contactPartner")}
        />
      </div>
    );
  }

  if (role === "ONG" && (post.type === "ADOPTION" || post.type === "CAMPAIGN" || post.type === "DONATION")) {
    return (
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {post.type === "ADOPTION" && (
          <Button size="sm" onClick={() => requireAuth(() => {
            window.location.href = `/adocao?post=${post.id}`;
          })}>
            {t("socialFeed.cta.wantAdopt")}
          </Button>
        )}
        {post.type === "CAMPAIGN" && (
          <Button size="sm" onClick={() => requireAuth()}>{t("socialFeed.cta.helpCampaign")}</Button>
        )}
        {post.type === "ADOPTION" ? (
          <StartConversationButton
            size="sm"
            variant="outline"
            participantUserId={post.authorId}
            contextType="ADOPTION"
            contextId={post.id}
            label={t("messagesModule.talkAboutAdoption")}
            ariaLabel={t("messagesModule.talkAboutAdoption")}
          />
        ) : post.type === "CAMPAIGN" ? (
          <StartConversationButton
            size="sm"
            variant="outline"
            participantUserId={post.authorId}
            contextType="CAMPAIGN"
            contextId={post.linkedCampaignId ?? post.id}
            label={t("messagesModule.talkAboutCampaign")}
            ariaLabel={t("messagesModule.talkAboutCampaign")}
          />
        ) : (
          <StartConversationButton
            size="sm"
            variant="outline"
            participantUserId={post.authorId}
            contextType="GENERAL"
            label={t("messagesModule.contactOng")}
            ariaLabel={t("messagesModule.contactOng")}
          />
        )}
      </div>
    );
  }

  return null;
}
