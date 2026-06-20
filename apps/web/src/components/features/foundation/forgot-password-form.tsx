"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FORGOT_PASSWORD_GENERIC_MESSAGE } from "@/lib/constants/auth-messages";

function parseApiError(data: { error?: string | { message?: string } }): string {
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error === "object" && data.error.message) return data.error.message;
  return "Não foi possível processar sua solicitação.";
}

export function FoundationForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        setError(parseApiError(data));
        return;
      }

      setSent(true);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu e-mail ou telefone cadastrado. Enviaremos instruções para redefinir sua senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-green-700" role="status" aria-live="polite">
            {FORGOT_PASSWORD_GENERIC_MESSAGE}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="forgot-identifier" className="text-sm font-medium">
                E-mail ou Telefone
              </label>
              <Input
                id="forgot-identifier"
                type="text"
                placeholder="Digite seu e-mail ou telefone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                inputMode="email"
                className="mt-1"
                aria-label="E-mail ou Telefone"
                aria-invalid={!!error}
                aria-describedby={error ? "forgot-error" : undefined}
              />
            </div>
            {error && (
              <p id="forgot-error" className="text-sm text-red-600" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar instruções"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
