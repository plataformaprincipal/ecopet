/**
 * Formulário de agendamento — Fase 2 Petshop Web
 * Serviços: Banho e Tosa | Modalidades: Tele-busca ou Entrega no local
 * Calendário: data + horário
 */
import { PetshopDeliveryAddressFields, Required } from "./petshop-address-fields";
import { todayIsoDate } from "@/schemas/validation/dates";

export function SchedulingForm() {
  const minDate = todayIsoDate();

  return (
    <form id="formAgendamento" className="petshop-form" noValidate>
      <div className="row g-3">
        {/* Escolha do serviço: Banho e/ou Tosa */}
        <div className="col-12">
          <fieldset>
            <legend className="form-label fs-6 mb-2">
              Serviço desejado<Required />
            </legend>
            <p className="text-muted small mb-2">Selecione um ou ambos os serviços oferecidos pelo petshop.</p>
            <div className="d-flex flex-wrap gap-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="servico"
                  id="servico-banho"
                  value="banho"
                />
                <label className="form-check-label" htmlFor="servico-banho">
                  <strong>Banho</strong>
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="servico"
                  id="servico-tosa"
                  value="tosa"
                />
                <label className="form-check-label" htmlFor="servico-tosa">
                  <strong>Tosa</strong>
                </label>
              </div>
            </div>
            <div id="servicoError" className="invalid-feedback d-block" style={{ display: "none" }}>
              Selecione ao menos um serviço (Banho ou Tosa).
            </div>
          </fieldset>
        </div>

        {/* Modalidade: tele-busca ou entrega no local */}
        <div className="col-12">
          <fieldset>
            <legend className="form-label fs-6 mb-2">
              Modalidade de agendamento<Required />
            </legend>
            <div className="d-flex flex-wrap gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tipoServico"
                  id="tipo-tele"
                  value="tele-busca"
                  defaultChecked
                  required
                />
                <label className="form-check-label" htmlFor="tipo-tele">
                  <strong>Tele-busca</strong> — atendimento com busca do pet em domicílio
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tipoServico"
                  id="tipo-entrega"
                  value="entrega"
                  required
                />
                <label className="form-check-label" htmlFor="tipo-entrega">
                  <strong>Entrega no local</strong> — tutor leva o pet ao petshop
                </label>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Calendário: dia e horário */}
        <div className="col-12">
          <h2 className="h6 fw-bold text-success border-bottom pb-2">Data e horário</h2>
        </div>
        <div className="col-md-6">
          <label htmlFor="dataAgendamento" className="form-label">
            Data<Required />
          </label>
          <input
            type="date"
            className="form-control"
            id="dataAgendamento"
            name="dataAgendamento"
            min={minDate}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="horaAgendamento" className="form-label">
            Horário<Required />
          </label>
          <input
            type="time"
            className="form-control"
            id="horaAgendamento"
            name="horaAgendamento"
            min="08:00"
            max="18:00"
            required
          />
          <small className="text-muted">Funcionamento: 08h às 18h</small>
        </div>

        <div className="col-md-6">
          <label htmlFor="nomeCliente" className="form-label">
            Nome do cliente<Required />
          </label>
          <input
            type="text"
            className="form-control"
            id="nomeCliente"
            name="nomeCliente"
            placeholder="Nome completo"
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="telefoneAgendamento" className="form-label">
            Telefone<Required />
          </label>
          <input
            type="tel"
            className="form-control"
            id="telefoneAgendamento"
            name="telefoneAgendamento"
            placeholder="(83) 99901-5377"
            required
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="emailAgendamento" className="form-label">
            E-mail<Required />
          </label>
          <input
            type="email"
            className="form-control"
            id="emailAgendamento"
            name="emailAgendamento"
            placeholder="cliente@email.com"
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="nomePetAgendamento" className="form-label">
            Nome do pet<Required />
          </label>
          <input
            type="text"
            className="form-control"
            id="nomePetAgendamento"
            name="nomePetAgendamento"
            placeholder="Nome do pet"
            required
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="numPetsAgendamento" className="form-label">
            Quantidade de pets<Required />
          </label>
          <input
            type="number"
            className="form-control"
            id="numPetsAgendamento"
            name="numPetsAgendamento"
            min={1}
            max={5}
            defaultValue={1}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="portePet" className="form-label">
            Porte do pet<Required />
          </label>
          <select className="form-select" id="portePet" name="portePet" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            <option value="pequeno">Pequeno (até 10 kg)</option>
            <option value="medio">Médio (10–25 kg)</option>
            <option value="grande">Grande (25+ kg)</option>
          </select>
        </div>

        {/* Endereço exibido apenas para tele-busca */}
        <div className="col-12" id="enderecoEntregaBlock" style={{ display: "none" }}>
          <hr />
          <PetshopDeliveryAddressFields />
        </div>

        <div className="col-12">
          <label htmlFor="obsAgendamento" className="form-label">
            Observações<Required />
          </label>
          <textarea
            className="form-control"
            id="obsAgendamento"
            name="obsAgendamento"
            rows={3}
            placeholder="Detalhes do serviço, temperamento do pet, instruções de acesso..."
            required
          />
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="confirmaAgendamento"
              name="confirmaAgendamento"
              required
            />
            <label className="form-check-label" htmlFor="confirmaAgendamento">
              Confirmo os dados e autorizo contato para confirmação do agendamento<Required />
            </label>
          </div>
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary btn-lg w-100">
            Confirmar Agendamento
          </button>
          <div className="petshop-form-feedback" role="alert" aria-live="polite" />
        </div>
      </div>
    </form>
  );
}
