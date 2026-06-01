"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-errors";
import { checkPasswordStrength } from "@/lib/auth/api";
import { cn } from "@/lib/utils";

const TOKEN_MESSAGES: Record<string, string> = {
  invalid: "Link inválido. Solicite uma nova recuperação de senha.",
  expired: "Link expirado. Solicite uma nova recuperação de senha.",
  used: "Este link já foi utilizado. Solicite uma nova recuperação de senha.",
};

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState<Awaited<ReturnType<typeof checkPasswordStrength>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!tokenFromUrl) {
      setValidating(false);
      setTokenError(TOKEN_MESSAGES.invalid);
      return;
    }
    api<{ valid: boolean; reason?: string }>(`/api/auth/reset-password/validate?token=${encodeURIComponent(tokenFromUrl)}`)
      .then((res) => {
        if (res.valid) {
          setTokenValid(true);
        } else {
          setTokenError(TOKEN_MESSAGES[res.reason ?? "invalid"] ?? TOKEN_MESSAGES.invalid);
        }
      })
      .catch(() => setTokenError("Não foi possível validar o link. Tente novamente."))
      .finally(() => setValidating(false));
  }, [tokenFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8 text-center text-sm text-ecopet-gray">Validando link...</CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-ecopet-green" />
          <p className="mt-3 font-semibold text-ecopet-green">Senha redefinida com sucesso!</p>
          <p className="mt-2 text-sm text-ecopet-gray">Redirecionando para o login...</p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="text-sm text-red-600" role="alert">
            {tokenError}
          </p>
          <Link href="/recuperar-senha" className="inline-block text-sm text-ecopet-green hover:underline">
            Solicitar novo link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>Crie uma nova senha segura para sua conta ECOPET</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="text-sm font-medium">
              Nova senha
            </label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={async (e) => {
                setNewPassword(e.target.value);
                if (e.target.value) setStrength(await checkPasswordStrength(e.target.value));
              }}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirmar nova senha
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {strength && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn("h-1.5 flex-1 rounded-full", i <= strength.score ? "bg-ecopet-green" : "bg-ecopet-gray/20")}
                  />
                ))}
              </div>
              <ul className="space-y-1">
                {[
                  { ok: strength.length, label: "12+ caracteres" },
                  { ok: strength.uppercase, label: "Maiúscula" },
                  { ok: strength.lowercase, label: "Minúscula" },
                  { ok: strength.number, label: "Número" },
                  { ok: strength.special, label: "Especial" },
                ].map((r) => (
                  <li key={r.label} className="flex items-center gap-2 text-xs">
                    {r.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-ecopet-green" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || (strength?.score ?? 0) < 5}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-ecopet-green hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="text-sm text-ecopet-gray">Carregando...</div>}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
