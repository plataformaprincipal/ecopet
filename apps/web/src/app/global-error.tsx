"use client";

import { useEffect } from "react";

/**
 * Handler de erro de nível raiz (captura falhas no próprio root layout).
 * Precisa renderizar <html> e <body> porque substitui o layout inteiro.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#003B16",
          color: "#fff",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Algo deu errado
          </h1>
          <p style={{ opacity: 0.85, marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Ocorreu um erro inesperado. Você pode tentar novamente — se persistir,
            volte mais tarde.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#f5c800",
              color: "#003B16",
              border: "none",
              borderRadius: 12,
              padding: "0.75rem 1.5rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
