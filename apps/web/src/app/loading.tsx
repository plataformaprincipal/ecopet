import { EcoPetLogo } from "@/components/brand/ecopet-logo";

export default function Loading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6"
      style={{ backgroundColor: "#003B16" }}
    >
      <EcoPetLogo variant="full" size="xl" animated="pulse" priority />
      <p className="text-sm font-medium" style={{ color: "#F7F4DC" }}>
        Carregando ECOPET...
      </p>
    </div>
  );
}
