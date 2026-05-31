"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMasterAdmin, checkPasswordStrength } from "@/lib/auth/api";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function CreateMasterAdminForm() {
  const router = useRouter();
  const setApiToken = useAppStore((s) => s.setApiToken);
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    jobTitle: "Super Administrador Master",
    securityAccepted: false,
  });
  const [strength, setStrength] = useState<Awaited<ReturnType<typeof checkPasswordStrength>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onPasswordChange(pwd: string) {
    setForm((f) => ({ ...f, password: pwd }));
    if (pwd.length > 0) {
      const s = await checkPasswordStrength(pwd);
      setStrength(s);
    } else {
      setStrength(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.securityAccepted) {
      setError("Aceite os termos de segurança");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    setLoading(true);
    try {
      const res = await createMasterAdmin({
        ...form,
        securityAccepted: true,
      });
      setApiToken(res.token);
      router.push(res.redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar administrador");
    } finally {
      setLoading(false);
    }
  }

  const rules = [
    { ok: strength?.length, label: "Mínimo 12 caracteres" },
    { ok: strength?.uppercase, label: "Letra maiúscula" },
    { ok: strength?.lowercase, label: "Letra minúscula" },
    { ok: strength?.number, label: "Número" },
    { ok: strength?.special, label: "Caractere especial" },
  ];

  return (
    <Card className="mx-auto max-w-2xl border-ecopet-green/30">
      <CardHeader className="text-center">
        <UserPlus className="mx-auto h-12 w-12 text-ecopet-green" />
        <CardTitle className="font-display text-xl">Criar Super Administrador Master</CardTitle>
        <p className="text-sm text-ecopet-gray">
          Configure o administrador definitivo da ECOPET. O usuário temporário <strong>gestorveras</strong> será invalidado após esta etapa.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <Input placeholder="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input placeholder="Usuário definitivo" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} required />
          <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input placeholder="Cargo / função" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} required />
          <Input placeholder="Senha definitiva" type="password" value={form.password} onChange={(e) => onPasswordChange(e.target.value)} required />
          <Input placeholder="Confirmar senha" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />

          {strength && (
            <div className="sm:col-span-2 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= strength.score ? "bg-ecopet-green" : "bg-ecopet-gray/20")} />
                ))}
              </div>
              <ul className="grid grid-cols-2 gap-1">
                {rules.map((r) => (
                  <li key={r.label} className="flex items-center gap-1.5 text-xs">
                    {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-ecopet-green" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-ecopet-green/20 bg-ecopet-green/5 p-4 text-sm">
            <input
              type="checkbox"
              checked={form.securityAccepted}
              onChange={(e) => setForm({ ...form, securityAccepted: e.target.checked })}
              className="mt-1 accent-ecopet-green"
            />
            <span>
              <Shield className="mb-1 inline h-4 w-4 text-ecopet-green" /> Confirmo que sou responsável pela segurança desta conta master e que as credenciais não serão compartilhadas.
            </span>
          </label>

          {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}

          <Button type="submit" className="sm:col-span-2" size="lg" disabled={loading || (strength?.score ?? 0) < 5}>
            {loading ? "Criando..." : "Criar Super Administrador Master"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
