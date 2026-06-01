import { PetshopDeliveryAddressFields, Required } from "./petshop-address-fields";

export function SchedulingForm() {
  return (
    <form id="formAgendamento" className="petshop-form" noValidate>
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label d-block">Tipo de serviço<Required /></label>
          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input className="form-check-input" type="radio" name="tipoServico" id="tipo-tele" value="tele-busca" defaultChecked required />
              <label className="form-check-label" htmlFor="tipo-tele">
                <strong>Tele-busca</strong> — consulta/atendimento remoto
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="tipoServico" id="tipo-entrega" value="entrega" required />
              <label className="form-check-label" htmlFor="tipo-entrega">
                <strong>Entrega no local</strong> — busca/entrega do pet
              </label>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <label htmlFor="dataAgendamento" className="form-label">Data<Required /></label>
          <input type="date" className="form-control" id="dataAgendamento" name="dataAgendamento" required />
        </div>
        <div className="col-md-6">
          <label htmlFor="horaAgendamento" className="form-label">Horário<Required /></label>
          <input type="time" className="form-control" id="horaAgendamento" name="horaAgendamento" required />
        </div>

        <div className="col-md-6">
          <label htmlFor="nomeCliente" className="form-label">Nome do cliente<Required /></label>
          <input type="text" className="form-control" id="nomeCliente" name="nomeCliente" placeholder="Nome completo" required />
        </div>
        <div className="col-md-6">
          <label htmlFor="telefoneAgendamento" className="form-label">Telefone<Required /></label>
          <input type="tel" className="form-control" id="telefoneAgendamento" name="telefoneAgendamento" placeholder="(83) 99901-5377" required />
        </div>

        <div className="col-md-6">
          <label htmlFor="emailAgendamento" className="form-label">E-mail<Required /></label>
          <input type="email" className="form-control" id="emailAgendamento" name="emailAgendamento" placeholder="cliente@email.com" required />
        </div>
        <div className="col-md-6">
          <label htmlFor="nomePetAgendamento" className="form-label">Nome do pet<Required /></label>
          <input type="text" className="form-control" id="nomePetAgendamento" name="nomePetAgendamento" placeholder="Nome do pet" required />
        </div>

        <div className="col-md-6">
          <label htmlFor="numPetsAgendamento" className="form-label">Quantidade de pets<Required /></label>
          <input type="number" className="form-control" id="numPetsAgendamento" name="numPetsAgendamento" min="1" max="5" defaultValue="1" required />
        </div>
        <div className="col-md-6">
          <label htmlFor="portePet" className="form-label">Porte do pet<Required /></label>
          <select className="form-select" id="portePet" name="portePet" required defaultValue="">
            <option value="" disabled>Selecione</option>
            <option value="pequeno">Pequeno (até 10 kg)</option>
            <option value="medio">Médio (10–25 kg)</option>
            <option value="grande">Grande (25+ kg)</option>
          </select>
        </div>

        <div className="col-12" id="enderecoEntregaBlock" style={{ display: "none" }}>
          <hr />
          <PetshopDeliveryAddressFields />
        </div>

        <div className="col-12">
          <label htmlFor="obsAgendamento" className="form-label">Observações<Required /></label>
          <textarea className="form-control" id="obsAgendamento" name="obsAgendamento" rows={3} placeholder="Detalhes do serviço, sintomas, instruções de acesso..." required />
        </div>

        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="confirmaAgendamento" name="confirmaAgendamento" required />
            <label className="form-check-label" htmlFor="confirmaAgendamento">
              Confirmo os dados e autorizo contato para confirmação do agendamento<Required />
            </label>
          </div>
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary btn-lg w-100">Confirmar Agendamento</button>
          <div className="petshop-form-feedback" role="alert" aria-live="polite" />
        </div>
      </div>
    </form>
  );
}
