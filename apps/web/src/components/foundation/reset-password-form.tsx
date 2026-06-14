"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/foundation/password-field";
import {
  PASSWORD_MISMATCH_MESSAGE,
  validateStrongPassword,
  type PasswordValidationContext,
} from "@/lib/password/validate-strong-password";

const TOKEN_MESSAGES: Record<string, string> = {
  invalid: "Link inválido. Solicite uma nova redefinição de senha.",
  expired: "Este link expirou. Solicite uma nova redefinição de senha.",
  used: "Este link já foi utilizado. Solicite uma nova redefinição de senha.",
};

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [passwordContext, setPasswordContext] = useState<PasswordValidationContext>({});

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError(TOKEN_MESSAGES.invalid);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (data.valid) {
          setTokenValid(true);
          if (data.passwordContext) {
            setPasswordContext(data.passwordContext);
          }
        } else {
          setTokenError(TOKEN_MESSAGES[data.reason as string] ?? TOKEN_MESSAGES.invalid);
        }
      })
      .catch(() => setTokenError("Não foi possível validar o link. Tente novamente."))
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(PASSWORD_MISMATCH_MESSAGE);
      return;
    }

    const pwdCheck = validateStrongPassword(password, passwordContext);
    if (!pwdCheck.valid) {
      setError(pwdCheck.error ?? "Senha não atende aos requisitos de segurança.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-8 text-center text-sm text-gray-600">Validando link...</CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-8 text-center">
          <p className="font-semibold text-green-700">Senha redefinida com sucesso!</p>
          <p className="mt-2 text-sm text-gray-600">Redirecionando para o login...</p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-sm text-red-600" role="alert">
            {tokenError}
          </p>
          <Link href="/esqueci-senha" className="inline-block text-sm font-semibold text-green-700 hover:underline">
            Solicitar novo link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>Escolha uma senha forte conforme os requisitos abaixo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FoundationPasswordField
            id="new-password"
            label="Nova senha"
            value={password}
            onChange={setPassword}
            context={passwordContext}
            required
          />
          <FoundationConfirmPasswordField
            id="confirm-password"
            label="Confirmar nova senha"
            value={confirmPassword}
            password={password}
            onChange={setConfirmPassword}
            required
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function FoundationResetPasswordForm() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-gray-600">Carregando...</div>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
