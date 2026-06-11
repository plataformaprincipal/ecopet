"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { dashboardPathForRole } from "@/lib/auth/routes";
import { useTranslation } from "@/providers/i18n-provider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const setApiToken = useAppStore((s) => s.setApiToken);
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const isEmail = identifier.includes("@");
      const res = await api<{
        token: string;
        bootstrapMode?: boolean;
        redirectTo?: string;
        user: { role: string; email: string; mustChangePassword?: boolean; firstLoginRequired?: boolean };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          ...(isEmail ? { email: identifier } : { identifier }),
          password,
        }),
      });
      setApiToken(res.token);
      await signIn("credentials", { email: res.user.email, password, redirect: false });

      if (res.bootstrapMode || res.redirectTo === "/gestor/ativacao") {
        router.push("/gestor/ativacao");
      } else if (callbackUrl && callbackUrl.startsWith("/")) {
        router.push(callbackUrl);
      } else if (res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.user.role === "GESTOR" || res.user.role === "ADMIN") {
        router.push(res.user.mustChangePassword || res.user.firstLoginRequired ? "/gestor/alterar-senha" : "/gestor");
      } else {
        router.push(dashboardPathForRole(res.user.role));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader className="text-center lg:hidden">
        <EcoPetLogo className="justify-center" variant="light" size="lg" showText />
      </CardHeader>
      <CardHeader>
        <CardTitle>{t("auth.login.title")}</CardTitle>
        <CardDescription>{t("auth.login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-identifier" className="text-sm font-medium">E-mail ou usuário</label>
            <Input
              id="login-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              placeholder="email@exemplo.com ou gestorveras"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-sm font-semibold">{t("auth.login.password")}</label>
            <div className="relative mt-1">
              <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="pr-11" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ecopet-gray" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("auth.login.submit")}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/recuperar-senha" className="text-ecopet-green hover:underline">{t("auth.login.forgot")}</Link>
        </div>
        <p className="mt-6 text-center text-sm text-ecopet-gray">
          {t("auth.login.noAccount")}{" "}
          <Link href="/cadastro" className="font-semibold text-ecopet-green hover:underline">Cadastre-se</Link>
        </p>
      </CardContent>
    </Card>
  );
}
