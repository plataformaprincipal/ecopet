"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "@/components/features/client/client-page-header";
import { MarketplaceOverlay } from "@/components/features/marketplace/marketplace-overlay";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

type LoyaltyPayload = {
  programName: string;
  account: {
    pointsBalance: number;
    lifetimePoints: number;
    tier: string;
    expiringPoints: number;
    pendingPoints: number;
  };
  policy: {
    enabled: boolean;
    pointsPerBrl: number;
    servicePointsPerBrl: number;
    expirationDays: number | null;
    expirationPolicy: string;
    referralEnabled: boolean;
  };
  howToEarn: Array<{ id: string; enabled: boolean; pointsPerBrl?: number }>;
  campaigns: Array<{ id: string; name: string; multiplier: number; endsAt: string }>;
  rewards: Array<{ id: string; code: string; title: string; description: string | null; pointsCost: number }>;
  coupons: Array<{ code: string; title: string | null; discountType: string; discountValue: number }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    points: number;
    sourceType: string | null;
    description: string | null;
    createdAt: string;
  }>;
  club: { name: string; available: boolean; checkoutEnabled: boolean; plans: Array<{ code: string; name: string }> };
};

export function RewardsWorkspace() {
  const { t } = useTranslation();
  const [data, setData] = useState<LoyaltyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; title: string; cost: number } | null>(null);
  const requestIds = useRef<Record<string, string>>({});
  const liveId = useId();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/loyalty", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? t("rewards.loadError"));
      }
      setData(json.data as LoyaltyPayload);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function redeem(rewardId: string) {
    if (redeeming) return;
    const requestId = requestIds.current[rewardId] ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `r${Date.now()}`);
    requestIds.current[rewardId] = requestId;
    setRedeeming(rewardId);
    setMessage("");
    setMessageOk(false);
    try {
      const res = await fetch("/api/client/loyalty/redeem", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId, requestId }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setMessage(json.error?.message ?? t("rewards.redeemFail"));
        setMessageOk(false);
        return;
      }
      setMessageOk(true);
      setMessage(
        json.data?.couponCode
          ? t("rewards.redeemOkCode", { code: json.data.couponCode })
          : t("rewards.redeemOk")
      );
      setConfirm(null);
      delete requestIds.current[rewardId];
      await load();
    } catch {
      setMessageOk(false);
      setMessage(t("rewards.redeemFail"));
    } finally {
      setRedeeming(null);
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-[var(--ep-bg-muted)]" data-testid="rewards-loading" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
        {error}
        <Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>
          {t("rewards.retry")}
        </Button>
      </div>
    );
  }

  if (!data) return null;
  const empty = data.account.pointsBalance === 0 && data.recentTransactions.length === 0;

  return (
    <div className="space-y-6" data-testid="rewards-workspace">
      <ClientPageHeader title={t("rewards.title")} description={t("rewards.lead")} />

      <section
        className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 sm:p-6"
        aria-labelledby="rewards-balance-heading"
      >
        <div className="flex items-start gap-3">
          <Coins className="mt-1 h-6 w-6 shrink-0 text-ecopet-green" aria-hidden />
          <div>
            <h2 id="rewards-balance-heading" className="text-sm font-medium text-[var(--ep-fg-muted)]">
              {t("rewards.available")}
            </h2>
            <p className="font-display text-3xl font-bold text-ecopet-green" data-testid="rewards-balance">
              {data.account.pointsBalance.toLocaleString("pt-BR")}
              <span className="ml-2 text-base font-semibold text-[var(--ep-fg)]">{t("rewards.pointsName")}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">
              {t("rewards.lifetime", { count: String(data.account.lifetimePoints) })}
              {data.policy.expirationPolicy !== "none" && data.account.expiringPoints > 0
                ? ` · ${t("rewards.expiring", { count: String(data.account.expiringPoints) })}`
                : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">{t("rewards.howToEarn")}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {data.howToEarn.map((item) => (
            <li key={item.id} className="rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-3 text-sm">
              <p className="font-semibold">
                {item.id === "service"
                  ? t("rewards.earn.service")
                  : item.id === "referral"
                    ? t("rewards.earn.referral")
                    : t("rewards.earn.order")}
              </p>
              <p className="text-[var(--ep-fg-muted)]">
                {item.id === "referral" && !item.enabled
                  ? t("rewards.referralDisabled")
                  : item.enabled
                    ? t("rewards.earnRate", { rate: String(item.pointsPerBrl ?? 0) })
                    : t("rewards.earnDisabled")}
              </p>
            </li>
          ))}
        </ul>
        {data.campaigns.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {data.campaigns.map((c) => (
              <li key={c.id} className="rounded-xl bg-ecopet-green/10 px-3 py-2 text-ecopet-green">
                {c.name} · {c.multiplier}x
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">{t("rewards.rewardsTitle")}</h2>
        {data.rewards.length === 0 ? (
          <p className="text-sm text-[var(--ep-fg-muted)]">{t("rewards.noRewards")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.rewards.map((r) => {
              const enough = data.account.pointsBalance >= r.pointsCost;
              return (
                <li key={r.id} className="flex flex-col rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
                  <p className="font-semibold">{r.title}</p>
                  {r.description ? <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">{r.description}</p> : null}
                  <p className="mt-2 text-sm font-medium">{t("rewards.cost", { count: String(r.pointsCost) })}</p>
                  <Button
                    className="mt-3 min-h-11"
                    type="button"
                    disabled={!enough || Boolean(redeeming)}
                    data-testid={`rewards-redeem-${r.code}`}
                    aria-label={t("rewards.redeemAria", { name: r.title })}
                    onClick={() => setConfirm({ id: r.id, title: r.title, cost: r.pointsCost })}
                  >
                    {enough ? t("rewards.redeem") : t("rewards.insufficient")}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {data.coupons.length > 0 ? (
          <div className="rounded-xl border border-[var(--ep-border)] p-3 text-sm">
            <p className="font-semibold">{t("rewards.yourCoupons")}</p>
            <ul className="mt-1 space-y-1">
              {data.coupons.map((c) => (
                <li key={c.code}>
                  <span className="font-mono font-semibold">{c.code}</span>
                  {c.title ? ` — ${c.title}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">{t("rewards.history")}</h2>
        {empty ? (
          <p className="text-sm text-[var(--ep-fg-muted)]" data-testid="rewards-empty">
            {t("rewards.empty")}
          </p>
        ) : (
          <ol className="space-y-2" data-testid="rewards-history">
            {data.recentTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm"
              >
                <div>
                  <p className={cn("font-semibold", tx.points > 0 ? "text-ecopet-green" : "text-[var(--ep-fg)]")}>
                    {tx.points > 0 ? "+" : ""}
                    {tx.points} {t("rewards.pointsName")}
                  </p>
                  <p className="text-[var(--ep-fg-muted)]">{tx.description || tx.type}</p>
                </div>
                <time className="text-xs text-[var(--ep-fg-muted)]" dateTime={tx.createdAt}>
                  {new Date(tx.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-xl border border-dashed border-[var(--ep-border)] p-4 text-sm text-[var(--ep-fg-muted)]">
        <h2 className="font-semibold text-[var(--ep-fg)]">{data.club.name}</h2>
        <p className="mt-1">{data.club.available ? t("rewards.oneListed") : t("rewards.oneFlagged")}</p>
      </section>

      <p id={liveId} className="sr-only" aria-live="polite">
        {message}
      </p>
      {message ? (
        <p
          className={cn("text-sm font-medium", messageOk ? "text-ecopet-green" : "text-red-600 dark:text-red-300")}
          data-testid="rewards-message"
          role={messageOk ? "status" : "alert"}
        >
          {message}
        </p>
      ) : null}

      <MarketplaceOverlay
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={t("rewards.confirmTitle")}
        description={confirm ? t("rewards.confirmBody", { name: confirm.title, count: String(confirm.cost) }) : ""}
        testId="rewards-confirm"
      >
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            data-testid="rewards-confirm-submit"
            disabled={Boolean(redeeming)}
            onClick={() => confirm && void redeem(confirm.id)}
          >
            {t("rewards.confirm")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
            {t("rewards.cancel")}
          </Button>
        </div>
      </MarketplaceOverlay>
    </div>
  );
}
