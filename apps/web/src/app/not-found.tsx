import Link from "next/link";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center dark:bg-[#0f1419]">
      <EcoPetLogo variant="light" size="lg" showText />
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#102015] dark:text-[#F7F4DC]">
          Página não encontrada
        </h1>
        <p className="mt-2 max-w-md text-sm text-ecopet-gray">
          O endereço que você acessou não existe ou foi movido.
        </p>
      </div>
      <Link href="/">
        <Button>Voltar ao início</Button>
      </Link>
    </div>
  );
}
