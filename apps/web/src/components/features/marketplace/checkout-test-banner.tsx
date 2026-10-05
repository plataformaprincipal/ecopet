export function CheckoutTestBanner() {
  return (
    <div
      role="status"
      className="rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-3 text-center dark:border-amber-400 dark:bg-amber-950/50"
    >
      <p className="text-sm font-bold tracking-wide text-amber-950 dark:text-amber-100">
        AMBIENTE DE TESTE — NENHUMA COBRANÇA REAL
      </p>
      <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
        Rota temporária e isolada. Usa somente credenciais TEST do Mercado Pago.
      </p>
    </div>
  );
}
