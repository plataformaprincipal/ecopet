import Link from "next/link";

export function CheckoutPolicies({ className }: { className?: string }) {
  return (
    <section
      className={className}
      aria-labelledby="checkout-policies-title"
    >
      <h3 id="checkout-policies-title" className="text-sm font-semibold">
        Troca, reembolso e cancelamento
      </h3>
      <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
        <li>
          <strong className="text-[var(--ep-fg)]">Troca:</strong> produtos físicos seguem o Código de
          Defesa do Consumidor e a política do vendedor.
        </li>
        <li>
          <strong className="text-[var(--ep-fg)]">Reembolso:</strong> pedidos não utilizados ou
          canceláveis são analisados pelo vendedor e pelo Mercado Pago.
        </li>
        <li>
          <strong className="text-[var(--ep-fg)]">Cancelamento:</strong> disponível em Meus pedidos
          enquanto o pedido ainda não foi enviado ou concluído.
        </li>
      </ul>
      <p className="mt-2 text-xs">
        <Link href="/legal/cliente/termos" className="text-ecopet-green underline">
          Ver termos completos
        </Link>
      </p>
    </section>
  );
}
