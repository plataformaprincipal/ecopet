"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function EntertainmentWaitlist() {
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState("PRICE_PENDING");

  useEffect(() => {
    fetch("/api/commerce/entertainment/waitlist", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.memberships?.[0]) setStatus(d.data.memberships[0].status);
      })
      .catch(() => undefined);
  }, []);

  async function join() {
    const res = await fetch("/api/commerce/entertainment/waitlist", { method: "POST", credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setStatus(data.data.status);
      setMsg("Lista de interesse registrada. Cobrança desligada até existir preço oficial no PFO.");
    } else if (res.status === 401) {
      setMsg("Faça login para registrar interesse.");
    } else {
      setMsg(data.error?.message ?? "Não foi possível registrar.");
    }
  }

  return (
    <div className="space-y-2 rounded-xl border p-4">
      <p className="text-sm">
        Status: {status} · billing_enabled=false · preço não inventado.
      </p>
      <Button variant="outline" onClick={() => void join()}>
        Registrar interesse (sem cobrança)
      </Button>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
