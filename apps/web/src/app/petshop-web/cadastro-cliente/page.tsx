import { PetshopHeader } from "@/components/features/petshop-web/petshop-header";
import { PetshopFooter } from "@/components/features/petshop-web/petshop-footer";
import { ClientRegistrationForm } from "@/components/features/petshop-web/client-registration-form";

export default function CadastroClientePage() {
  return (
    <>
      <PetshopHeader />
      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="petshop-section-title mb-2">Cadastro de Cliente</h1>
              <p className="text-muted mb-4">
                Preencha todos os campos abaixo. Campos marcados com <span className="text-danger">*</span> são obrigatórios.
                No endereço, apenas <strong>Complemento</strong> e <strong>Referência</strong> são opcionais.
              </p>
              <ClientRegistrationForm />
            </div>
          </div>
        </div>
      </main>
      <PetshopFooter />
    </>
  );
}
