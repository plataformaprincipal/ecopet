import { PetshopClientAddressFields, Required } from "./petshop-address-fields";

export function ClientRegistrationForm() {
  return (
    <form id="formCadastroCliente" className="petshop-form" noValidate>
      <div className="row g-3">
        <div className="col-md-8">
          <label htmlFor="nomeCompleto" className="form-label">Nome completo<Required /></label>
          <input type="text" className="form-control" id="nomeCompleto" name="nomeCompleto" placeholder="Ex: Maria Silva Santos" required />
        </div>
        <div className="col-md-4">
          <label htmlFor="cpf" className="form-label">CPF<Required /></label>
          <input type="text" className="form-control" id="cpf" name="cpf" placeholder="000.000.000-00" required />
        </div>

        <div className="col-md-6">
          <label htmlFor="email" className="form-label">E-mail<Required /></label>
          <input type="email" className="form-control" id="email" name="email" placeholder="seu@email.com" required />
        </div>
        <div className="col-md-6">
          <label htmlFor="telefone" className="form-label">Telefone / WhatsApp<Required /></label>
          <input type="tel" className="form-control" id="telefone" name="telefone" placeholder="(83) 99901-5377" required />
        </div>

        <div className="col-md-4">
          <label htmlFor="dataNascimento" className="form-label">Data de nascimento<Required /></label>
          <input type="date" className="form-control" id="dataNascimento" name="dataNascimento" required />
        </div>
        <div className="col-md-4">
          <label htmlFor="numPets" className="form-label">Número de pets<Required /></label>
          <input type="number" className="form-control" id="numPets" name="numPets" placeholder="1" min="1" max="20" required />
        </div>

        <div className="col-12">
          <PetshopClientAddressFields />
        </div>

        <div className="col-12">
          <label className="form-label d-block">Como nos conheceu?<Required /></label>
          <div className="d-flex flex-wrap gap-3">
            {["Indicação", "Redes sociais", "Google", "ECOPET App", "Passagem na loja"].map((opt) => (
              <div className="form-check" key={opt}>
                <input className="form-check-input" type="radio" name="comoConheceu" id={`cc-${opt}`} value={opt} required />
                <label className="form-check-label" htmlFor={`cc-${opt}`}>{opt}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="newsletter" name="newsletter" required />
            <label className="form-check-label" htmlFor="newsletter">
              Aceito receber novidades e promoções por e-mail/WhatsApp<Required />
            </label>
          </div>
          <div className="form-check mt-2">
            <input className="form-check-input" type="checkbox" id="termos" name="termos" required />
            <label className="form-check-label" htmlFor="termos">
              Li e aceito os termos de uso e política de privacidade (LGPD)<Required />
            </label>
          </div>
        </div>

        <div className="col-12">
          <label htmlFor="observacoes" className="form-label">Observações<Required /></label>
          <textarea className="form-control" id="observacoes" name="observacoes" rows={3} placeholder="Preferências de contato, horários, etc." required />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary btn-lg w-100">Cadastrar Cliente</button>
          <div className="petshop-form-feedback" role="alert" aria-live="polite" />
        </div>
      </div>
    </form>
  );
}
