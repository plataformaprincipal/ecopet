import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AssinaturaPage() {
  return (
    <>
      <AppHeader title="Assinatura Premium" />
      <main className="mx-auto max-w-4xl flex-1 p-4 lg:p-8">
        <div className="text-center mb-8">
          <Crown className="mx-auto h-12 w-12 text-ecopet-yellow" />
          <h2 className="mt-4 font-display text-2xl font-bold">ECOPET Premium</h2>
          <p className="text-ecopet-gray">Stripe integrado — configure STRIPE_SECRET_KEY</p>
        </div>
        <Card className="border-ecopet-yellow ring-2 ring-ecopet-yellow/20">
          <CardContent className="p-8">
            <p className="text-4xl font-extrabold text-ecopet-green">
              R$ 29,90<span className="text-lg font-normal text-ecopet-gray">/mês</span>
            </p>
            <ul className="mt-6 space-y-2">
              {["Pets ilimitados", "IA avançada", "Selo premium", "Cashback marketplace"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-ecopet-green" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="mt-8 w-full" size="lg">
              Assinar com Stripe
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
