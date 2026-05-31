import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function token() {
  return useAppStore.getState().apiToken ?? undefined;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export interface WalletStatement {
  wallet: WalletBalance & { id: string };
  transactions: WalletTransaction[];
  cashbacks: { id: string; amount: number; description: string | null; applied: boolean }[];
}

export interface WalletAiInsights {
  balance: number;
  totalSpent: number;
  insights: { id: string; title: string; description: string; type: string }[];
}

export async function fetchWalletBalance() {
  return api<WalletBalance>("/api/wallet/balance", { token: token() });
}

export async function fetchWalletStatement() {
  return api<WalletStatement>("/api/wallet/statement", { token: token() });
}

export async function fetchWalletInsights() {
  return api<WalletAiInsights>("/api/wallet/insights", { token: token() });
}

export async function requestRefund(orderId: string, amount: number, originalMethod: string, reason?: string) {
  return api("/api/wallet/refund", {
    method: "POST",
    token: token(),
    body: JSON.stringify({ orderId, amount, originalMethod, reason }),
  });
}
