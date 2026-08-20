"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PartnerMpConnectButton({ oauthConfigured }: { oauthConfigured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!oauthConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Integração de vendedor Mercado Pago ainda não está habilitada na plataforma (OAuth). O
        status permanece desconectado até a EccoPet configurar CLIENT_ID/SECRET no servidor.
      </p>
    );
  }

  async function connect() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/partner/financeiro/mp-connection", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "Não foi possível iniciar a autorização.");
      }
      window.location.href = json.data.authorizationUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => void connect()} disabled={busy}>
        Autorizar Mercado Pago
      </Button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
