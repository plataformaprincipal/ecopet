"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/password-input";
import { api } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-errors";

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
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
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
    api<{ valid: boolean; reason?: string }>(
      `/api/auth/reset-password/validate?token=${encodeURIComponent(tokenFromUrl)}`
    )
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

    if (novaSenha.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, novaSenha, confirmarNovaSenha }),
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
        <CardDescription>Crie uma nova senha para sua conta EcoPet (mínimo 8 caracteres)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="text-sm font-medium">
              Nova senha
            </label>
            <PasswordInput
              id="new-password"
              value={novaSenha}
              onChange={setNovaSenha}
              autoComplete="new-password"
              showStrength={false}
              showRequirements={false}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirmar nova senha
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirmarNovaSenha}
              onChange={setConfirmarNovaSenha}
              autoComplete="new-password"
              showStrength={false}
              showRequirements={false}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
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
