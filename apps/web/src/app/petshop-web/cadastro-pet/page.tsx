import { PetshopHeader } from "@/components/features/petshop-web/petshop-header";
import { PetshopFooter } from "@/components/features/petshop-web/petshop-footer";
import { PetRegistrationForm } from "@/components/features/petshop-web/pet-registration-form";

export default function CadastroPetPage() {
  return (
    <>
      <PetshopHeader />
      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="petshop-section-title mb-2">Cadastro de Pet</h1>
              <p className="text-muted mb-4">
                Registre as informações do seu pet. Todos os campos são obrigatórios.
              </p>
              <PetRegistrationForm />
            </div>
          </div>
        </div>
      </main>
      <PetshopFooter />
    </>
  );
}
