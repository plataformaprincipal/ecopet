"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  fetchPasswordPolicy,
  requestPasswordChangeCode,
  changePassword,
  updateProfile,
  checkPasswordStrength,
} from "@/lib/auth/api";
import { AddressByCepField, toAddressValue } from "@/components/shared/address/address-by-cep-field";
import { EMPTY_ADDRESS, type AddressByCepValue } from "@/lib/address/types";

export function SeusDadosPanel() {
  const { user, token } = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [requiresEmailCode, setRequiresEmailCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string>();
  const [strength, setStrength] = useState<Awaited<ReturnType<typeof checkPasswordStrength>> | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<AddressByCepValue>({ ...EMPTY_ADDRESS });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? "");
      if (user.address) {
        setAddress(toAddressValue(user.address as Record<string, unknown>));
      }
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchPasswordPolicy().then((p) => setRequiresEmailCode(p.requiresEmailCode)).catch(() => {});
    }
  }, [token]);

  async function handleSaveProfile() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      await updateProfile({ currentPassword, name, phone, address });
      setMsg("Dados atualizados com sucesso");
      setCurrentPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestCode() {
    setError("");
    try {
      const res = await requestPasswordChangeCode(currentPassword);
      setCodeSent(true);
      setDevCode(res.devCode);
      setMsg("Código enviado para seu e-mail");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar código");
    }
  }

  async function handleChangePassword() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        emailCode: requiresEmailCode ? emailCode : undefined,
      });
      setMsg("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEmailCode("");
      setCodeSent(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seus Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="E-mail" value={email} disabled className="bg-ecopet-gray/5" />
          <Input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <AddressByCepField
            value={address}
            onChange={setAddress}
            title="Endereço"
            idPrefix="profile"
            variant="compact"
          />
          <Input placeholder="Senha atual (obrigatória para salvar)" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Button onClick={handleSaveProfile} disabled={loading || !currentPassword}>Salvar dados</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          {requiresEmailCode && (
            <p className="text-xs text-ecopet-gray">Seu perfil exige confirmação por e-mail além da senha atual.</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!requiresEmailCode && (
            <p className="text-xs text-ecopet-gray">Informe apenas a senha atual e a nova senha.</p>
          )}
          <Input placeholder="Senha atual" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          {requiresEmailCode && (
            <div className="flex gap-2">
              <Input placeholder="Código do e-mail" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} />
              <Button type="button" variant="outline" onClick={handleRequestCode} disabled={!currentPassword}>
                {codeSent ? "Reenviar" : "Enviar código"}
              </Button>
            </div>
          )}
          {devCode && <p className="text-xs text-ecopet-yellow">Dev: código = {devCode}</p>}
          <Input
            placeholder="Nova senha"
            type="password"
            value={newPassword}
            onChange={async (e) => {
              setNewPassword(e.target.value);
              if (e.target.value) setStrength(await checkPasswordStrength(e.target.value));
            }}
          />
          <Input placeholder="Confirmar nova senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {strength && (
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
          )}
          <Button onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword}>
            Alterar senha
          </Button>
        </CardContent>
      </Card>

      {msg && <p className="text-sm text-ecopet-green">{msg}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
