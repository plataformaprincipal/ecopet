/**
 * Formulário de cadastro do tutor (cliente) — Fase 2 Petshop Web
 * Campos: dados pessoais, sexo, endereço com CEP automático (ViaCEP).
 */
import { PetshopClientAddressFields, Required } from "./petshop-address-fields";
import { todayIsoDate } from "@/schemas/validation/dates";

/** Opções de sexo conforme requisito acadêmico */
const SEXO_OPTIONS = [
  { id: "masculino", label: "Masculino" },
  { id: "feminino", label: "Feminino" },
  { id: "nao-binario", label: "Não-Binário" },
  { id: "prefiro-nao-declarar", label: "Prefiro Não declarar" },
] as const;

export function ClientRegistrationForm() {
  const maxBirthDate = todayIsoDate();

  return (
    <form id="formCadastroCliente" className="petshop-form" noValidate>
      <div className="row g-3">
        {/* ── Dados pessoais ── */}
        <div className="col-12">
          <h2 className="h6 fw-bold text-success border-bottom pb-2">Dados do tutor</h2>
        </div>

        <div className="col-md-8">
          <label htmlFor="nomeCompleto" className="form-label">
            Nome completo<Required />
          </label>
          <input
            type="text"
            className="form-control"
            id="nomeCompleto"
            name="nomeCompleto"
            placeholder="Ex: Maria Silva Santos"
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="cpf" className="form-label">
            CPF<Required />
          </label>
          <input
            type="text"
            className="form-control"
            id="cpf"
            name="cpf"
            placeholder="000.000.000-00"
            required
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="email" className="form-label">
            E-mail<Required />
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            placeholder="seu@email.com"
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="telefone" className="form-label">
            Telefone / WhatsApp<Required />
          </label>
          <input
            type="tel"
            className="form-control"
            id="telefone"
            name="telefone"
            placeholder="(83) 99901-5377"
            required
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="dataNascimento" className="form-label">
            Data de nascimento<Required />
          </label>
          <input
            type="date"
            className="form-control"
            id="dataNascimento"
            name="dataNascimento"
            max={maxBirthDate}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="numPets" className="form-label">
            Número de pets<Required />
          </label>
          <input
            type="number"
            className="form-control"
            id="numPets"
            name="numPets"
            placeholder="1"
            min={1}
            max={20}
            required
          />
        </div>

        {/* Sexo do tutor — radio buttons obrigatórios */}
        <div className="col-12">
          <fieldset>
            <legend className="form-label fs-6 mb-2">
              Sexo<Required />
            </legend>
            <div className="d-flex flex-wrap gap-3">
              {SEXO_OPTIONS.map((opt) => (
                <div className="form-check" key={opt.id}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sexo"
                    id={`sexo-${opt.id}`}
                    value={opt.id}
                    required
                  />
                  <label className="form-check-label" htmlFor={`sexo-${opt.id}`}>
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        {/* ── Endereço com CEP automático ── */}
        <div className="col-12">
          <PetshopClientAddressFields />
        </div>

        <div className="col-12">
          <label className="form-label d-block">Como nos conheceu?<Required /></label>
          <div className="d-flex flex-wrap gap-3">
            {["Indicação", "Redes sociais", "Google", "ECOPET App", "Passagem na loja"].map((opt) => (
              <div className="form-check" key={opt}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="comoConheceu"
                  id={`cc-${opt}`}
                  value={opt}
                  required
                />
                <label className="form-check-label" htmlFor={`cc-${opt}`}>
                  {opt}
                </label>
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
          <label htmlFor="observacoes" className="form-label">
            Observações<Required />
          </label>
          <textarea
            className="form-control"
            id="observacoes"
            name="observacoes"
            rows={3}
            placeholder="Preferências de contato, horários, etc."
            required
          />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary btn-lg w-100">
            Cadastrar Cliente
          </button>
          <div className="petshop-form-feedback" role="alert" aria-live="polite" />
        </div>
      </div>
    </form>
  );
}
