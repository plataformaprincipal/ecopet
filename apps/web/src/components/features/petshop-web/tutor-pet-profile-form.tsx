/**
 * Formulário de perfil — tutor + identificação do pet (Fase 2)
 * Reúne dados do tutor e campos de identificação do pet no mesmo perfil.
 */
function Required() {
  return <span className="required"> *</span>;
}

export function TutorPetProfileForm() {
  return (
    <form id="formPerfilTutorPet" className="petshop-form" noValidate>
      <div className="row g-3">
        {/* Seção tutor */}
        <div className="col-12">
          <h2 className="h6 fw-bold text-success border-bottom pb-2">Perfil do tutor</h2>
        </div>
        <div className="col-md-6">
          <label htmlFor="perfilNome" className="form-label">
            Nome completo<Required />
          </label>
          <input
            type="text"
            className="form-control"
            id="perfilNome"
            name="perfilNome"
            placeholder="Nome do tutor"
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="perfilEmail" className="form-label">
            E-mail<Required />
          </label>
          <input
            type="email"
            className="form-control"
            id="perfilEmail"
            name="perfilEmail"
            placeholder="tutor@email.com"
            required
          />
        </div>

        {/* Seção pet — identificação obrigatória */}
        <div className="col-12 mt-2">
          <h2 className="h6 fw-bold text-success border-bottom pb-2">Identificação do pet</h2>
        </div>
        <div className="col-md-6">
          <label htmlFor="perfilNomePet" className="form-label">
            Nome do pet<Required />
          </label>
          <input
            type="text"
            className="form-control"
            id="perfilNomePet"
            name="perfilNomePet"
            placeholder="Ex: Thor"
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="perfilRaca" className="form-label">
            Raça<Required />
          </label>
          <input
            type="text"
            className="form-control"
            id="perfilRaca"
            name="perfilRaca"
            placeholder="Ex: Labrador, SRD"
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="perfilIdade" className="form-label">
            Idade (anos)<Required />
          </label>
          <input
            type="number"
            className="form-control"
            id="perfilIdade"
            name="perfilIdade"
            placeholder="2"
            min={0}
            max={30}
            step={0.5}
            required
          />
        </div>
        <div className="col-md-8">
          <label className="form-label d-block">Espécie<Required /></label>
          <div className="d-flex flex-wrap gap-3">
            {["Cão", "Gato", "Outro"].map((esp) => (
              <div className="form-check" key={esp}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="perfilEspecie"
                  id={`perfil-esp-${esp}`}
                  value={esp}
                  required
                />
                <label className="form-check-label" htmlFor={`perfil-esp-${esp}`}>
                  {esp}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="perfilAtualizado"
              name="perfilAtualizado"
              required
            />
            <label className="form-check-label" htmlFor="perfilAtualizado">
              Confirmo que os dados do tutor e do pet estão corretos<Required />
            </label>
          </div>
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary btn-lg w-100">
            Salvar perfil
          </button>
          <div className="petshop-form-feedback" role="alert" aria-live="polite" />
        </div>
      </div>
    </form>
  );
}
