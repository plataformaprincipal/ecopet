import { PetshopHeader } from "@/components/features/petshop-web/petshop-header";
import { PetshopFooter } from "@/components/features/petshop-web/petshop-footer";
import { TutorPetProfileForm } from "@/components/features/petshop-web/tutor-pet-profile-form";

/** Página de perfil do tutor com identificação do pet — requisito Fase 2 */
export default function PerfilTutorPetPage() {
  return (
    <>
      <PetshopHeader />
      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="petshop-section-title mb-2">Perfil do Tutor e Pet</h1>
              <p className="text-muted mb-4">
                Atualize seus dados e a identificação do pet (nome, raça e idade).
                Campos com <span className="text-danger">*</span> são obrigatórios.
              </p>
              <TutorPetProfileForm />
            </div>
          </div>
        </div>
      </main>
      <PetshopFooter />
    </>
  );
}
