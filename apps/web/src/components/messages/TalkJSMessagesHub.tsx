"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalkJSInbox } from "@/components/messages/TalkJSInbox";
import { TalkJSChatbox } from "@/components/messages/TalkJSChatbox";
import { TalkJSSessionProvider, useTalkJSSession } from "@/components/messages/TalkJSSessionProvider";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

function TalkJSMessagesInner({ initialConversationId }: { initialConversationId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { session, loading, error, configured } = useTalkJSSession();
  const [selectedTalkJsId, setSelectedTalkJsId] = useState<string | null>(null);
  const [ecopetId, setEcopetId] = useState(initialConversationId ?? "");
  const [bootstrapping, setBootstrapping] = useState(false);

  const bootstrapFromQuery = useCallback(async () => {
    const userId = searchParams.get("userId") ?? searchParams.get("partner");
    if (!userId) return;

    setBootstrapping(true);
    try {
      const contextType = searchParams.get("contextType") ?? "GENERAL";
      const contextId = searchParams.get("contextId");
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantUserId: userId,
          contextType,
          contextId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const conv = json.data.conversation;
        setEcopetId(conv.id);
        setSelectedTalkJsId(conv.talkjsConversationId ?? null);
        router.replace(`/dashboard/messages/${conv.id}`);
      }
    } finally {
      setBootstrapping(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    void bootstrapFromQuery();
  }, [bootstrapFromQuery]);

  useEffect(() => {
    if (!initialConversationId) return;
    void (async () => {
      const res = await fetch(`/api/messages/conversations/${initialConversationId}`);
      const json = await res.json();
      if (json.success && json.data.conversation?.talkjsConversationId) {
        setSelectedTalkJsId(json.data.conversation.talkjsConversationId);
        setEcopetId(initialConversationId);
      }
    })();
  }, [initialConversationId]);

  if (!configured) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
        <AlertCircle className="h-8 w-8 text-amber-500" aria-hidden />
        <p>{t("messagesModule.configError")}</p>
      </div>
    );
  }

  if (loading || bootstrapping) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground" role="status">
        {t("messagesModule.loading")}
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" aria-hidden />
        <p className="text-sm text-muted-foreground">{error ?? t("messagesModule.configError")}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("messagesModule.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col gap-4 p-4 lg:flex-row">
      <aside
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-2xl border bg-white dark:bg-[#0f1419] lg:w-96",
          selectedTalkJsId && "hidden lg:flex"
        )}
        aria-label={t("messagesModule.title")}
      >
        <div className="border-b p-4">
          <h1 className="text-lg font-bold">{t("messagesModule.title")}</h1>
        </div>
        <div className="min-h-0 flex-1">
          <TalkJSInbox
            onSelectConversation={(talkjsId) => {
              setSelectedTalkJsId(talkjsId);
            }}
            className="h-full"
          />
        </div>
        <div className="border-t p-3 text-center text-xs">
          <Link href="/dashboard/support" className="text-ecopet-green hover:underline">
            {t("messagesModule.openSupport")}
          </Link>
        </div>
      </aside>

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white dark:bg-[#0f1419]",
          !selectedTalkJsId && "hidden lg:flex"
        )}
      >
        {selectedTalkJsId && (
          <div className="flex items-center gap-2 border-b p-3 lg:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedTalkJsId(null)}
              aria-label={t("messagesModule.backToList")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{t("messagesModule.title")}</span>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <TalkJSChatbox conversationId={selectedTalkJsId} className="h-full" />
        </div>
      </main>
    </div>
  );
}

export function TalkJSMessagesHub({ initialConversationId }: { initialConversationId?: string }) {
  return (
    <TalkJSSessionProvider>
      <TalkJSMessagesInner initialConversationId={initialConversationId} />
    </TalkJSSessionProvider>
  );
}
