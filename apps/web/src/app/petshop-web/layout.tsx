import type { Metadata } from "next";
import Script from "next/script";
import "./petshop-web-layout.css";

export const metadata: Metadata = {
  title: "Pet Shop ECOPET — Sistema Web",
  description: "Cadastro de clientes e pets, agendamento de tele-busca e entrega. EMPRESA ECOPET — Grupo Café Platine.",
};

export default function PetshopWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="petshop-web">
        {children}
      </div>
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <Script src="/petshop-web/petshop-web.js" strategy="afterInteractive" />
    </>
  );
}
