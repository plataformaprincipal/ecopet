"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const correlationId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `fe_${Date.now()}`;

    void fetch("/api/telemetry/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: error.name || "Error",
        message: (error.message || "Unknown").slice(0, 500),
        stack: error.stack?.slice(0, 2000),
        digest: error.digest,
        route: typeof window !== "undefined" ? window.location.pathname : undefined,
        correlationId,
      }),
    }).catch(() => undefined);

    if (process.env.NODE_ENV !== "production") {
      console.error("[error-boundary]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center dark:bg-[#0f1419]">
      <EcoPetLogo variant="light" size="lg" showText />
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#102015] dark:text-[#F7F4DC]">
          Algo deu errado
        </h1>
        <p className="mt-2 max-w-md text-sm text-ecopet-gray">
          Não foi possível carregar esta página. Tente novamente ou volte ao início.
          {error.digest ? (
            <>
              {" "}
              Código: <code className="text-xs">{error.digest}</code>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/">
          <Button variant="outline">Ir ao início</Button>
        </Link>
      </div>
    </div>
  );
}
