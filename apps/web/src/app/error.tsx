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
    console.error(error);
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
