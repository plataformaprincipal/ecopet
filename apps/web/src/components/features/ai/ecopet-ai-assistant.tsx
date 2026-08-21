"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Sparkles, PawPrint, ShoppingBag, Stethoscope,
  Compass, Calendar, ChevronRight,
} from "lucide-react";
import { EcopetSymbol } from "@/components/shared/brand/ecopet-symbol";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useAiClientActions } from "@/hooks/use-ai-client-actions";
import { geoPayloadForRequest } from "@/lib/ai/client-geo";
import {
  AiUnavailableBanner,
  isAiNotConfiguredErrorCode,
} from "@/components/features/ai/ai-unavailable-banner";
import { AI_SAFETY_DISCLAIMER } from "@/lib/ai/ai-disclaimer";

type QuickCommand = { labelKey: string; icon: typeof ShoppingBag; prompt: string };

const BASE_QUICK: QuickCommand[] = [
  { labelKey: "empty.ai.quickProducts", icon: ShoppingBag, prompt: "Procure ração para cachorro até R$150." },
  { labelKey: "empty.ai.quickVet", icon: Stethoscope, prompt: "Procure banho e tosa perto de mim." },
  { labelKey: "empty.ai.quickExplore", icon: Compass, prompt: "O que está em alta na EccoPet?" },
  { labelKey: "empty.ai.quickPet", icon: PawPrint, prompt: "Quais pets eu tenho?" },
  { labelKey: "empty.ai.quickSchedule", icon: Calendar, prompt: "O que tenho marcado na agenda?" },
];

function quickCommandsForPath(pathname: string): QuickCommand[] {
  if (pathname.includes("/marketplace")) {
    return [
      { labelKey: "empty.ai.quickProducts", icon: ShoppingBag, prompt: "Mostre produtos para meu pet." },
      { labelKey: "empty.ai.quickVet", icon: Stethoscope, prompt: "Encontre serviços perto de mim." },
      ...BASE_QUICK.slice(2, 3),
    ];
  }
  if (pathname.includes("/meu-pet") || pathname.includes("/cliente/pets")) {
    return [
      { labelKey: "empty.ai.quickPet", icon: PawPrint, prompt: "Tenho alguma vacina atrasada?" },
      { labelKey: "empty.ai.quickSchedule", icon: Calendar, prompt: "Próximos compromissos do meu pet." },
      ...BASE_QUICK.slice(0, 2),
    ];
  }
  if (pathname.includes("/adocao")) {
    return [
      { labelKey: "empty.ai.quickExplore", icon: Compass, prompt: "Quero adotar um gato." },
      ...BASE_QUICK.slice(0, 2),
    ];
  }
  return BASE_QUICK;
}

export function EcopetAIAssistant() {
  const { t, locale } = useTranslation();
  const { status } = useAuthSession();
  const isGuest = status !== "authenticated";
  const pathname = usePathname();
  const { apply: applyClientAction } = useAiClientActions();
  const quickCommands = useMemo(() => quickCommandsForPath(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string; pending?: boolean; imageUrl?: string; imagePrompt?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null);
  const [loginIntent, setLoginIntent] = useState(false);

  const sendText = useCallback(
    async (raw: string) => {
      const userMsg = raw.trim();
      if (!userMsg || loading || unavailable) return;
      setError(null);
      setMessage("");
      setMessages((m) => [
        ...m,
        { role: "user", content: userMsg },
        { role: "assistant", content: "", pending: true },
      ]);
      setLoading(true);

      try {
        if (isGuest) {
          const guestRes = await fetch("/api/ai/public-chat", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMsg,
              locale,
              pagePath: pathname,
              ...geoPayloadForRequest(),
            }),
          });
          const guestJson = (await guestRes.json().catch(() => ({}))) as {
            success?: boolean;
            data?: { reply?: string; available?: boolean; requiresSignIn?: boolean };
            error?: { code?: string; message?: string };
          };
          if (!guestRes.ok || guestJson.success === false) {
            setError(guestJson.error?.message ?? t("empty.ai.unavailable"));
            setMessages((m) => m.slice(0, -2));
            setMessage(userMsg);
            return;
          }
          if (guestJson.data?.available === false) {
            setUnavailable(true);
            setUnavailableMessage(guestJson.data.reply ?? t("empty.ai.unavailable"));
            setMessages((m) => m.slice(0, -2));
            setMessage(userMsg);
            return;
          }
          const guestReply = guestJson.data?.reply?.trim();
          if (!guestReply) {
            setError(t("empty.ai.unavailable"));
            setMessages((m) => m.slice(0, -2));
            setMessage(userMsg);
            return;
          }
          if (guestJson.data?.requiresSignIn) {
            setLoginIntent(true);
          }
          setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: guestReply }]);
          return;
        }

        const res = await fetch("/api/ai/chat/stream", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({
            message: userMsg,
            locale,
            pagePath: pathname,
            module: "assistant",
            ...geoPayloadForRequest(),
          }),
        });

        if (res.status === 501 || !res.ok || !res.body) {
          const fallback = await fetch("/api/ai/chat", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMsg,
              type: "general",
              locale,
              module: "ecopet-ai",
            }),
          });
          const json = (await fallback.json().catch(() => ({}))) as {
            success?: boolean;
            data?: { content?: string; reply?: string };
            error?: { code?: string; message?: string };
          };
          if (!fallback.ok || json.success === false || isAiNotConfiguredErrorCode(json.error?.code)) {
            setUnavailable(true);
            setUnavailableMessage(json.error?.message ?? t("empty.ai.unavailable"));
            setMessages((m) => m.slice(0, -2));
            setMessage(userMsg);
            return;
          }
          const content = (json.data?.content ?? json.data?.reply)?.trim();
          if (!content) {
            setError(t("empty.ai.unavailable"));
            setMessages((m) => m.slice(0, -2));
            setMessage(userMsg);
            return;
          }
          setMessages((m) => [...m.slice(0, -1), { role: "assistant", content }]);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assembled = "";
        let imageUrl: string | undefined;
        let imagePrompt: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            let event: {
              type?: string;
              text?: string;
              content?: string;
              code?: string;
              message?: string;
              action?: string;
              payload?: Record<string, unknown>;
              url?: string;
              prompt?: string;
            };
            try {
              event = JSON.parse(line.slice(6)) as typeof event;
            } catch {
              continue;
            }
            if (event.type === "delta" && event.text) {
              assembled += event.text;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assembled, pending: true, imageUrl, imagePrompt };
                return copy;
              });
            } else if (event.type === "image" && event.url) {
              imageUrl = event.url;
              imagePrompt = event.prompt;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assembled || "Aqui está a imagem gerada.",
                  pending: true,
                  imageUrl,
                  imagePrompt,
                };
                return copy;
              });
            } else if (event.type === "client_action" && event.action) {
              applyClientAction({ action: event.action, payload: event.payload ?? {} });
            } else if (event.type === "error") {
              if (isAiNotConfiguredErrorCode(event.code)) {
                setUnavailable(true);
                setUnavailableMessage(event.message ?? t("empty.ai.unavailable"));
              } else {
                setError(event.message ?? t("empty.ai.unavailable"));
              }
              setMessages((m) => m.slice(0, -2));
              setMessage(userMsg);
              return;
            } else if (event.type === "done") {
              assembled = event.content?.trim() || assembled;
            }
          }
        }

        if (!assembled.trim() && !imageUrl) {
          setError(t("empty.ai.unavailable"));
          setMessages((m) => m.slice(0, -2));
          setMessage(userMsg);
          return;
        }
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: assembled.trim() || (imageUrl ? "Aqui está a imagem gerada." : assembled),
            imageUrl,
            imagePrompt,
          };
          return copy;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("empty.ai.unavailable"));
        setMessages((m) => m.slice(0, -2));
        setMessage(userMsg);
      } finally {
        setLoading(false);
      }
    },
    [applyClientAction, isGuest, loading, locale, pathname, t, unavailable]
  );

    const send = useCallback(async () => {
    const userMsg = message.trim();
    if (!userMsg) return;
    await sendText(userMsg);
  }, [message, sendText]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            type="button"
            onClick={() => setOpen(true)}
            className="ep-float-assistant flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-ecopet-dark/30 transition-transform hover:scale-105"
            aria-label={t("empty.ai.openLabel")}
          >
            <EcopetSymbol variant="accent" size={56} animated="glow" className="rounded-2xl shadow-lg" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:bg-black/20"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="ep-float-assistant flex h-[min(520px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] shadow-2xl"
            >
              <header className="flex items-center justify-between border-b px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-ecopet-green" />
                  <span className="font-display font-bold">{t("empty.ai.title")}</span>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label={t("common.cancel")}>
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {unavailable && (
                  <AiUnavailableBanner message={unavailableMessage ?? undefined} />
                )}
                {messages.length === 0 && !unavailable ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-ecopet-gray">
                    <EcopetSymbol variant="accent" size={48} className="mb-3" />
                    <p>{t("empty.ai.noHistory")}</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={cn("rounded-xl px-3 py-2 text-sm", m.role === "user" ? "ml-8 bg-ecopet-green/10 dark:bg-ecopet-green/20" : "mr-8 bg-ecopet-gray/10 dark:bg-white/5")}>
                      {m.pending && !m.content
                        ? "EccoPet está pensando..."
                        : m.content}
                      {m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt={m.imagePrompt || "Imagem gerada"} className="mt-2 max-h-56 w-full rounded-lg object-contain" />
                      ) : null}
                    </div>
                  ))
                )}
                {error && (
                  <p className="text-xs text-red-600" role="alert">
                    {error}
                  </p>
                )}
                {loginIntent ? (
                  <div className="rounded-xl border border-ecopet-green/30 bg-ecopet-green/5 p-3 text-xs">
                    <p className="mb-2">{t("empty.ai.signInPrompt")}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`}
                        className="rounded-full bg-ecopet-green px-3 py-1 font-semibold text-white"
                      >
                        {t("common.signIn")}
                      </Link>
                      <Link
                        href={`/cadastro?callbackUrl=${encodeURIComponent(pathname || "/")}`}
                        className="rounded-full border border-ecopet-green px-3 py-1 font-semibold text-ecopet-green"
                      >
                        {t("common.createAccount")}
                      </Link>
                      <Link href="/suporte" className="rounded-full px-3 py-1 text-ecopet-green underline">
                        {t("empty.ai.humanSupport")}
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t p-3 space-y-2 dark:border-white/10">
                <p className="text-[10px] leading-snug text-ecopet-gray">
                  {AI_SAFETY_DISCLAIMER[locale as keyof typeof AI_SAFETY_DISCLAIMER] ?? AI_SAFETY_DISCLAIMER["pt-BR"]}
                </p>
                <div className="flex flex-wrap gap-1">
                  {quickCommands.map(({ labelKey, icon: Icon, prompt }) => (
                    <button
                      key={labelKey}
                      type="button"
                      disabled={loading || unavailable}
                      onClick={() => void sendText(prompt)}
                      className="flex items-center gap-1 rounded-full bg-ecopet-green/10 px-2 py-1 text-[10px] font-semibold text-ecopet-green disabled:opacity-50"
                    >
                      <Icon className="h-3 w-3" /> {t(labelKey)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void send()}
                    placeholder={unavailable ? t("empty.ai.unavailable") : t("empty.ai.placeholder")}
                    disabled={loading || unavailable}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950"
                  />
                  <Button size="icon" onClick={() => void send()} disabled={loading || unavailable || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Link href="/eccopet" className="flex items-center justify-center gap-1 text-xs text-ecopet-green">
                  {t("empty.ai.fullPage")} <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
