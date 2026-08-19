"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createReport } from "@/lib/social/client-api";
import { useTranslation } from "@/providers/i18n-provider";
import { SOCIAL_REPORT_REASONS } from "@/lib/social/post-authorization";
import { cn } from "@/lib/utils";

const REASON_KEYS = SOCIAL_REPORT_REASONS;

export function ReportPostModal({
  postId,
  open,
  onClose,
  onReported,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
  onReported?: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setReason(null);
      setDetails("");
      setError(null);
      setDone(false);
      setPending(false);
      return;
    }
    const id = window.setTimeout(() => firstOptionRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  async function submit() {
    if (!reason) return;
    setPending(true);
    setError(null);
    try {
      await createReport({
        postId,
        reason: reason as (typeof REASON_KEYS)[number],
        description: details.trim() || undefined,
      });
      setDone(true);
      onReported?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.report.sendFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid="report-post-dialog"
        className={cn(
          "max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[88vh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl"
        )}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader>
          <DialogTitle>
            {done ? t("socialFeed.report.successTitle") : t("socialFeed.report.whyTitle")}
          </DialogTitle>
          <DialogDescription>
            {done ? t("socialFeed.report.successBody") : t("socialFeed.report.whyHint")}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                {t("socialFeed.report.close")}
              </Button>
          </div>
        ) : step === 1 ? (
          <div className="grid gap-1" role="listbox" aria-label={t("socialFeed.report.whyTitle")}>
            {REASON_KEYS.map((value, i) => (
              <button
                key={value}
                type="button"
                ref={i === 0 ? firstOptionRef : undefined}
                role="option"
                aria-selected={reason === value}
                onClick={() => {
                  setReason(value);
                  setStep(2);
                }}
                className="min-h-11 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--ep-fg)] hover:bg-[var(--ep-bg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ep-ring)]"
              >
                {t(`socialFeed.report.reasons.${value}`)}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--ep-fg-muted)]">
              {t(`socialFeed.report.reasons.${reason}`)}
            </p>
            <label className="block text-sm font-medium text-[var(--ep-fg)]" htmlFor="report-details">
              {t("socialFeed.report.detailsLabel")}
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-3 text-sm text-[var(--ep-fg)] outline-none focus:ring-2 focus:ring-[var(--ep-ring)]"
              placeholder={t("socialFeed.report.detailsPlaceholder")}
            />
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={pending}>
                {t("socialFeed.report.back")}
              </Button>
              <Button type="button" onClick={() => void submit()} disabled={pending || !reason}>
                {t("socialFeed.report.submit")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
