import Link from "next/link";

const FOOTER_LINKS = {
  sistema: [
    { href: "/petshop-web", label: "Início" },
    { href: "/petshop-web/cadastro-cliente", label: "Cadastro Cliente" },
    { href: "/petshop-web/cadastro-pet", label: "Cadastro Pet" },
    { href: "/petshop-web/agendamento", label: "Agendamento" },
  ],
  ecopet: [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/feed", label: "Rede Social" },
    { href: "/health", label: "ECOPET Health" },
    { href: "/ia", label: "Assistente IA" },
  ],
  legal: [
    { href: "#", label: "Política de Privacidade" },
    { href: "#", label: "Termos de Uso" },
    { href: "#", label: "LGPD" },
  ],
};

export function PetshopFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="petshop-footer pt-5 pb-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <p className="footer-brand fs-5 mb-2">🐾 EMPRESA ECOPET</p>
            <p className="small mb-2">Do <strong>Grupo Café Platine</strong></p>
            <p className="small opacity-75">
              Sistema web integrado para gestão de clientes, pets, tele-busca e entrega domiciliar.
            </p>
            <p className="small mt-3">
              <strong>Contato:</strong><br />
              <a href="tel:+5583999015377">📞 (83) 99901-5377</a><br />
              <a href="mailto:contato@ecopet.com.br">✉️ contato@ecopet.com.br</a>
            </p>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="text-white fw-semibold mb-3">Sistema Web</h6>
            <ul className="list-unstyled small">
              {FOOTER_LINKS.sistema.map((l) => (
                <li key={l.href} className="mb-2">
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="text-white fw-semibold mb-3">Ecossistema ECOPET</h6>
            <ul className="list-unstyled small">
              {FOOTER_LINKS.ecopet.map((l) => (
                <li key={l.href} className="mb-2">
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-4">
            <h6 className="text-white fw-semibold mb-3">Informações legais</h6>
            <ul className="list-unstyled small">
              {FOOTER_LINKS.legal.map((l) => (
                <li key={l.label} className="mb-2">
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
            <p className="small opacity-75 mt-3">
              CNPJ: 00.000.000/0001-00 (mock acadêmico)<br />
              João Pessoa — PB · Brasil
            </p>
          </div>
        </div>

        <hr className="footer-divider my-4" />

        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="small mb-0 opacity-75">
              © {year} <strong>EMPRESA ECOPET</strong> — Grupo Café Platine. Todos os direitos reservados.
            </p>
          </div>
          <div className="col-md-6 text-md-end mt-2 mt-md-0">
            <span className="petshop-integration-badge me-2">Marketplace</span>
            <span className="petshop-integration-badge me-2">Health</span>
            <span className="petshop-integration-badge">IA ECOPET</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
