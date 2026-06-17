"use client";

import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";
import { useTranslation } from "@/providers/i18n-provider";

type LogoutButtonVariant = "sidebar" | "mobile" | "header" | "button" | "inline";

type LogoutButtonProps = {
  variant?: LogoutButtonVariant;
  className?: string;
  redirectTo?: string;
};

export function LogoutButton({
  variant = "button",
  className,
  redirectTo = "/login",
}: LogoutButtonProps) {
  const { t } = useTranslation();
  const { logout, loading, error } = useLogout(redirectTo);
  const label = t("dashboard.logout");

  if (variant === "sidebar") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-red-300 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden />
          )}
          {label}
        </button>
        {error && (
          <p className="mt-1 px-4 text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className={cn("w-full", className)}>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden />
          )}
          {label}
        </button>
        {error && (
          <p className="mt-1 text-center text-[10px] text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div className={cn("flex flex-col items-end", className)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
          disabled={loading}
          className="text-ecopet-gray hover:text-red-600 dark:hover:text-red-400"
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="mr-1.5 h-4 w-4" aria-hidden />
          )}
          {label}
        </Button>
        {error && (
          <p className="mt-0.5 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loading}
          className="text-sm font-medium text-red-600 underline-offset-2 hover:underline disabled:opacity-50 dark:text-red-400"
        >
          {loading ? "Saindo..." : label}
        </button>
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Button type="button" variant="outline" onClick={() => void logout()} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Saindo...
          </>
        ) : (
          label
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
