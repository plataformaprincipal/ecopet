"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMpPrice } from "@/lib/marketplace/config";
import {
  fetchWalletBalance,
  fetchWalletStatement,
  fetchWalletInsights,
  type WalletStatement,
  type WalletAiInsights,
} from "@/lib/wallet/api";
import { cn } from "@/lib/utils";

export function WalletPanel() {
  const [balance, setBalance] = useState(0);
  const [statement, setStatement] = useState<WalletStatement | null>(null);
  const [insights, setInsights] = useState<WalletAiInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [bal, stmt, ins] = await Promise.all([
        fetchWalletBalance(),
        fetchWalletStatement(),
        fetchWalletInsights(),
      ]);
      setBalance(bal.balance);
      setStatement(stmt);
      setInsights(ins);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar carteira");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="rounded-[16px] border p-8 text-center text-sm text-ecopet-gray">Carregando Saldo ECOPET...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <p className="mt-2 text-xs text-ecopet-gray">Faça login para acessar sua carteira digital.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-ecopet-green/30 bg-gradient-to-br from-ecopet-green/10 to-ecopet-green/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-ecopet-green">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-semibold">Saldo ECOPET</span>
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold text-ecopet-green">{formatMpPrice(balance)}</p>
            <p className="caption-text mt-1">Carteira digital da plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-ecopet-gray">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-semibold">Gastos (30 dias)</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{formatMpPrice(insights?.totalSpent ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-ecopet-gray">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Cashback pendente</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold">
              {formatMpPrice(statement?.cashbacks.filter((c) => !c.applied).reduce((s, c) => s + c.amount, 0) ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Extrato</CardTitle>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-4 w-4" />Atualizar</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statement?.transactions.length === 0 && (
              <p className="text-sm text-ecopet-gray">Nenhuma movimentação ainda.</p>
            )}
            {statement?.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-ecopet-gray/10 p-3 text-sm">
                <div className="flex items-center gap-3">
                  {tx.amount >= 0 ? (
                    <ArrowDownLeft className="h-4 w-4 text-ecopet-green" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{tx.description ?? tx.type}</p>
                    <p className="caption-text">{new Date(tx.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <span className={cn("font-semibold", tx.amount >= 0 ? "text-ecopet-green" : "text-red-500")}>
                  {tx.amount >= 0 ? "+" : ""}{formatMpPrice(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-ecopet-yellow" />IA Financeira ECOPET</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {insights.insights.map((ins) => (
              <div key={ins.id} className="rounded-xl border border-ecopet-yellow/20 bg-ecopet-yellow/5 p-4">
                <p className="font-semibold text-sm">{ins.title}</p>
                <p className="caption-text mt-1">{ins.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
