"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { changePassword, fetchPasswordPolicy, requestPasswordChangeCode } from "@/lib/auth/api";
import { cn } from "@/lib/utils";

interface StrengthCheck {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  notTemp: boolean;
  score: number;
}

export function GestorChangePasswordForm() {
  const router = useRouter();
  const token = useAppStore((s) => s.apiToken);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [requiresEmailCode, setRequiresEmailCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string>();
  const [strength, setStrength] = useState<StrengthCheck | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPasswordPolicy().then((p) => setRequiresEmailCode(p.requiresEmailCode && !p.firstLoginRequired)).catch(() => {});
    }
  }, [token]);

  async function checkStrength(pwd: string) {
    try {
      const res = await api<StrengthCheck>("/api/auth/check-password-strength", {
        method: "POST",
        body: JSON.stringify({ password: pwd }),
      });
      setStrength(res);
    } catch {
      setStrength(null);
    }
  }

  async function handleRequestCode() {
    setError("");
    try {
      const res = await requestPasswordChangeCode(currentPassword);
      setCodeSent(true);
      setDevCode(res.devCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar código");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    setLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        emailCode: requiresEmailCode ? emailCode : undefined,
      });
      router.push("/gestor");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  const rules = [
    { key: "length", label: "Mínimo 12 caracteres", ok: strength?.length },
    { key: "uppercase", label: "Letra maiúscula", ok: strength?.uppercase },
    { key: "lowercase", label: "Letra minúscula", ok: strength?.lowercase },
    { key: "number", label: "Número", ok: strength?.number },
    { key: "special", label: "Caractere especial", ok: strength?.special },
    { key: "notTemp", label: "Diferente da senha temporária", ok: strength?.notTemp },
  ];

  return (
    <Card className="mx-auto max-w-lg border-ecopet-green/30">
      <CardHeader className="text-center">
        <Lock className="mx-auto h-12 w-12 text-ecopet-green" />
        <CardTitle className="font-display text-xl">Definir Nova Senha</CardTitle>
        <p className="text-sm text-ecopet-gray">
          {requiresEmailCode
            ? "Informe a senha atual, valide o código por e-mail e defina a nova senha."
            : "Troca obrigatória no primeiro acesso. Informe a senha temporária e crie sua senha definitiva."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="password" placeholder="Senha atual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          {requiresEmailCode && (
            <div className="flex gap-2">
              <Input placeholder="Código do e-mail" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} required={requiresEmailCode} />
              <Button type="button" variant="outline" onClick={handleRequestCode} disabled={!currentPassword}>
                {codeSent ? "Reenviar" : "Enviar código"}
              </Button>
            </div>
          )}
          {devCode && <p className="text-xs text-ecopet-yellow">Dev: código = {devCode}</p>}
          <Input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); checkStrength(e.target.value); }}
            required
          />
          <Input type="password" placeholder="Confirmar nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

          {strength && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= strength.score ? "bg-ecopet-green" : "bg-ecopet-gray/20")} />
                ))}
              </div>
              <ul className="space-y-1">
                {rules.map((r) => (
                  <li key={r.key} className="flex items-center gap-2 text-xs">
                    {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-ecopet-green" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !strength?.score || strength.score < 5}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
