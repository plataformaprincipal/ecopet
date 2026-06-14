"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { notifySessionChanged } from "@/lib/auth/session-events";

function parseApiError(data: { error?: string | { message?: string } }): string {
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error === "object" && data.error.message) return data.error.message;
  return "Erro ao entrar";
}

export function FoundationLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(parseApiError(data));
        return;
      }
      const redirectTo =
        data.data?.redirectTo ??
        (data.user?.role ? dashboardPathForRole(data.user.role) : null) ??
        (callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard");
      router.push(redirectTo);
      notifySessionChanged();
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Entrar no EcoPet</CardTitle>
        <CardDescription>Use seu e-mail e senha para acessar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">E-mail</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
          </div>
          <p className="text-right text-sm">
            <Link href="/esqueci-senha" className="text-green-700 hover:underline">
              Esqueci minha senha
            </Link>
          </p>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Não tem conta? <Link href="/cadastro" className="font-semibold text-green-700 hover:underline">Cadastre-se</Link>
        </p>
      </CardContent>
    </Card>
  );
}
