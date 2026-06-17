import { PetshopHeader } from "@/components/features/petshop-web/petshop-header";
import { PetshopFooter } from "@/components/features/petshop-web/petshop-footer";
import { HeroCarousel } from "@/components/features/petshop-web/hero-carousel";

export default function PetshopWebHomePage() {
  return (
    <>
      <PetshopHeader />
      <main>
        <HeroCarousel />

        {/* Destaques */}
        <section className="py-5 bg-white">
          <div className="container">
            <h2 className="petshop-section-title mb-4">Nossos Serviços</h2>
            <div className="row g-4">
              {[
                { icon: "🛁", title: "Banho & Tosa", desc: "Higiene completa com profissionais qualificados." },
                { icon: "🏥", title: "Tele-busca", desc: "Consulta veterinária remota com agendamento online." },
                { icon: "🚗", title: "Entrega Domiciliar", desc: "Buscamos e entregamos seu pet com segurança." },
                { icon: "🦴", title: "Produtos Premium", desc: "Rações, acessórios e medicamentos selecionados." },
              ].map((s) => (
                <div className="col-sm-6 col-lg-3" key={s.title}>
                  <div className="card petshop-card h-100 p-4">
                    <div className="card-icon mb-3">{s.icon}</div>
                    <h5 className="fw-bold" style={{ color: "#1a3a2a" }}>{s.title}</h5>
                    <p className="text-muted small mb-0">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Números animados (JS) */}
        <section className="py-5" style={{ background: "#f2efe3" }}>
          <div className="container">
            <div className="row text-center g-4">
              {[
                { n: 2500, label: "Clientes cadastrados" },
                { n: 3800, label: "Pets atendidos" },
                { n: 1200, label: "Agendamentos/mês" },
                { n: 98, label: "% Satisfação" },
              ].map((item) => (
                <div className="col-6 col-lg-3" key={item.label}>
                  <p className="display-6 fw-bold mb-0" style={{ color: "#2e7d4f" }} data-counter={item.n}>0</p>
                  <p className="text-muted small">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA formulários */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="row align-items-center g-4">
              <div className="col-lg-6">
                <h2 className="petshop-section-title mb-3">Cadastre-se e agende online</h2>
                <p className="text-muted">
                  Utilize nossos formulários para cadastro de tutor e pet, atualize o perfil e agende banho, tosa,
                  tele-busca ou entrega do pet no local. Complemento e referência no endereço são opcionais.
                </p>
              </div>
              <div className="col-lg-6">
                <div className="d-grid gap-2 d-sm-flex flex-wrap">
                  <a href="/petshop-web/cadastro-cliente" className="btn btn-success btn-lg flex-fill">Cadastro Cliente</a>
                  <a href="/petshop-web/cadastro-pet" className="btn btn-outline-success btn-lg flex-fill">Cadastro Pet</a>
                  <a href="/petshop-web/perfil" className="btn btn-outline-success btn-lg flex-fill">Perfil</a>
                  <a href="/petshop-web/agendamento" className="btn btn-warning btn-lg flex-fill text-dark fw-semibold">Agendar</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PetshopFooter />
    </>
  );
}
