import { PetshopHeader } from "@/components/petshop-web/petshop-header";
import { PetshopFooter } from "@/components/petshop-web/petshop-footer";
import { SchedulingForm } from "@/components/petshop-web/scheduling-form";

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
                Agende <strong>tele-busca</strong> (consulta remota) ou <strong>entrega do pet no local</strong>.
                Todos os campos são obrigatórios.
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
