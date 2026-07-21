import Link from "next/link";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center dark:bg-ecopet-dark-bg">
      <EcoPetLogo variant="light" size="lg" showText />
      <div>
        <h1 className="heading-2">
          Página não encontrada
        </h1>
        <p className="body-text mt-2 max-w-md">
          O endereço que você acessou não existe ou foi movido.
        </p>
      </div>
      <Link href="/">
        <Button>Voltar ao início</Button>
      </Link>
    </div>
  );
}
