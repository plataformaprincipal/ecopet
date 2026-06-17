import { PetshopHeader } from "@/components/features/petshop-web/petshop-header";
import { PetshopFooter } from "@/components/features/petshop-web/petshop-footer";
import { SchedulingForm } from "@/components/features/petshop-web/scheduling-form";

export default function AgendamentoPage() {
  return (
    <>
      <PetshopHeader />
      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="petshop-section-title mb-2">Agendamento</h1>
              <p className="text-muted mb-4">
                Agende os serviços de <strong>Banho</strong> e/ou <strong>Tosa</strong> via{" "}
                <strong>tele-busca</strong> (busca do pet em domicílio) ou{" "}
                <strong>entrega no local</strong> (tutor leva o pet ao petshop).
                Utilize o calendário para escolher data e horário.
              </p>
              <SchedulingForm />
            </div>
          </div>
        </div>
      </main>
      <PetshopFooter />
    </>
  );
}
