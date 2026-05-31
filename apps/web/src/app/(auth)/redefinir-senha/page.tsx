"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { checkPasswordStrength } from "@/lib/auth/api";
import { cn } from "@/lib/utils";

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState<Awaited<ReturnType<typeof checkPasswordStrength>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
        body: JSON.stringify({ token, newPassword, code }),
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <p className="font-semibold text-ecopet-green">Senha redefinida com sucesso!</p>
          <p className="mt-2 text-sm text-ecopet-gray">Redirecionando para o login...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>Informe o código recebido por e-mail e crie uma nova senha</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!tokenFromUrl && (
            <div>
              <label className="text-sm font-medium">Token de recuperação</label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Código de confirmação</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" required />
          </div>
          <div>
            <label className="text-sm font-medium">Nova senha</label>
            <Input
              type="password"
              value={newPassword}
              onChange={async (e) => {
                setNewPassword(e.target.value);
                if (e.target.value) setStrength(await checkPasswordStrength(e.target.value));
              }}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Confirmar nova senha</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {strength && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= strength.score ? "bg-ecopet-green" : "bg-ecopet-gray/20")} />
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
                    {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-ecopet-green" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || (strength?.score ?? 0) < 5}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-ecopet-green hover:underline">Voltar ao login</Link>
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
