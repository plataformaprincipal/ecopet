import Link from "next/link";
import Image from "next/image";
import { AccessibleFormDemo } from "@/components/shared/accessibility/accessible-form-demo";

export const metadata = {
  title: "Formulário acessível — EcoPet",
  description: "Demonstração de formulário HTML acessível e uso do atributo alt em imagens.",
};

export default function FormularioAcessivelPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Formulário acessível — demonstração acadêmica</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta página demonstra elementos de formulário variados, rótulos associados, placeholders,
          campos obrigatórios, mensagens de ajuda com <code>aria-describedby</code> e imagem com{" "}
          <code>alt</code> descritivo. Não grava dados no banco.
        </p>
        <p className="mt-2 text-sm">
          Consulte o arquivo <code>docs/AJUDA_ECOPET.md</code> na raiz do projeto para documentação
          completa de uso e acessibilidade.
        </p>
      </header>

      <section aria-labelledby="demo-image-heading">
        <h2 id="demo-image-heading" className="mb-3 text-lg font-medium">
          Imagem com audiodescrição (alt)
        </h2>
        <div className="relative aspect-video max-w-md overflow-hidden rounded-lg border">
          <Image
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"
            alt="Cachorro e gato representando o ecossistema EcoPet"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Imagens informativas devem ter <code>alt</code> descritivo. Imagens puramente decorativas
          usam <code>alt=&quot;&quot;</code>.
        </p>
      </section>

      <AccessibleFormDemo />

      <nav className="text-sm">
        <Link href="/" className="underline">
          Voltar ao início
        </Link>
      </nav>
    </main>
  );
}
