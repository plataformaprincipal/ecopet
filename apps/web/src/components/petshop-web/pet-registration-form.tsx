function Required() {
  return <span className="required"> *</span>;
}

export function PetRegistrationForm() {
  return (
    <form id="formCadastroPet" className="petshop-form" noValidate>
      <div className="row g-3">
        <div className="col-md-8">
          <label htmlFor="nomePet" className="form-label">Nome do pet<Required /></label>
          <input type="text" className="form-control" id="nomePet" name="nomePet" placeholder="Ex: Luna" required />
        </div>
        <div className="col-md-4">
          <label htmlFor="idadePet" className="form-label">Idade (anos)<Required /></label>
          <input type="number" className="form-control" id="idadePet" name="idadePet" placeholder="3" min="0" max="30" step="0.5" required />
        </div>

        <div className="col-12">
          <label className="form-label d-block">Espécie<Required /></label>
          <div className="d-flex flex-wrap gap-3">
            {[
              { id: "cao", label: "Cão" },
              { id: "gato", label: "Gato" },
              { id: "ave", label: "Ave" },
              { id: "outro", label: "Outro" },
            ].map((opt) => (
              <div className="form-check" key={opt.id}>
                <input className="form-check-input" type="radio" name="especie" id={`esp-${opt.id}`} value={opt.id} required />
                <label className="form-check-label" htmlFor={`esp-${opt.id}`}>{opt.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          <label htmlFor="raca" className="form-label">Raça<Required /></label>
          <input type="text" className="form-control" id="raca" name="raca" placeholder="Ex: Golden Retriever, SRD" required />
        </div>
        <div className="col-md-6">
          <label htmlFor="peso" className="form-label">Peso (kg)<Required /></label>
          <input type="number" className="form-control" id="peso" name="peso" placeholder="28.5" min="0.1" max="120" step="0.1" required />
        </div>

        <div className="col-12">
          <label className="form-label d-block">Sexo<Required /></label>
          <div className="d-flex gap-4">
            <div className="form-check">
              <input className="form-check-input" type="radio" name="sexo" id="sexo-m" value="macho" required />
              <label className="form-check-label" htmlFor="sexo-m">Macho</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="sexo" id="sexo-f" value="femea" required />
              <label className="form-check-label" htmlFor="sexo-f">Fêmea</label>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <label htmlFor="emailTutor" className="form-label">E-mail do tutor<Required /></label>
          <input type="email" className="form-control" id="emailTutor" name="emailTutor" placeholder="tutor@email.com" required />
        </div>
        <div className="col-md-6">
          <label htmlFor="telefoneTutor" className="form-label">Telefone do tutor<Required /></label>
          <input type="tel" className="form-control" id="telefoneTutor" name="telefoneTutor" placeholder="(83) 99999-9999" required />
        </div>

        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="castrado" name="castrado" required />
            <label className="form-check-label" htmlFor="castrado">
              Confirmo informação sobre castração (sim ou não — marque para validar cadastro)<Required />
            </label>
          </div>
          <div className="form-check mt-2">
            <input className="form-check-input" type="checkbox" id="vacinas" name="vacinas" required />
            <label className="form-check-label" htmlFor="vacinas">
              Confirmo status das vacinas (em dia ou pendente — marque para validar)<Required />
            </label>
          </div>
        </div>

        <div className="col-12">
          <label htmlFor="alergias" className="form-label">Alergias ou restrições<Required /></label>
          <input type="text" className="form-control" id="alergias" name="alergias" placeholder="Nenhuma / descreva alergias conhecidas" required />
        </div>

        <div className="col-12">
          <label htmlFor="obsPet" className="form-label">Observações sobre comportamento/saúde<Required /></label>
          <textarea className="form-control" id="obsPet" name="obsPet" rows={3} placeholder="Temperamento, medicamentos, cuidados especiais..." required />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary btn-lg w-100">Cadastrar Pet</button>
          <div className="petshop-form-feedback" role="alert" aria-live="polite" />
        </div>
      </div>
    </form>
  );
}
