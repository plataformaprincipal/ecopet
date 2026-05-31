import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-ecopet-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo href="/" className="[&_span]:text-white [&_span_span]:text-ecopet-yellow" />
        <div>
          <h2 className="font-display text-3xl font-bold text-white">
            Cuidado, comunidade e inteligência em um só lugar.
          </h2>
          <p className="mt-4 text-white/70">
            Junte-se a milhares de tutores, veterinários e pet shops na maior plataforma pet do Brasil.
          </p>
        </div>
        <p className="text-sm text-white/50">© 2026 ECOPET</p>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-6 lg:items-center">{children}</div>
    </div>
  );
}
