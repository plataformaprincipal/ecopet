"use client";

import { useCallback, useEffect, useState } from "react";
import { PawPrint, Pencil, Trash2, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientPageHeader } from "../client-page-header";
import { ClientEmptyState } from "../client-empty-state";
import { ClientGridSkeleton } from "../client-skeleton";
import { ClientFeedback } from "../client-stats-cards";
import { useActivePetForAi } from "@/hooks/use-active-pet-for-ai";
import { VaccinationBooklet } from "@/components/features/my-pet/vaccination-booklet";
import { useTranslation } from "@/providers/i18n-provider";
import { useSimpleLanguage } from "@/hooks/use-simple-language";
import { computeAgeFromBirthDate } from "@/lib/pets/labels";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  sex?: string | null;
  birthDate?: string | null;
  weight?: number | null;
  color?: string | null;
  microchip?: string | null;
  neutered?: boolean;
  notes?: string | null;
  photo?: string | null;
};

type PetDetail = Pet & {
  vaccinations?: Array<{
    id: string;
    name: string;
    date: string;
    nextDue?: string | null;
    veterinarian?: string | null;
    batch?: string | null;
    notes?: string | null;
    manufacturer?: string | null;
  }>;
  allergies?: Array<{ id: string; allergen: string; severity?: string | null }>;
  reminders?: Array<{ id: string; title: string; dueAt: string; type: string }>;
  petDocuments?: Array<{ id: string; name: string; type: string; url?: string | null }>;
};

const EMPTY_FORM = {
  name: "",
  species: "DOG",
  breed: "",
  sex: "",
  birthDate: "",
  weight: "",
  color: "",
  microchip: "",
  neutered: false,
  notes: "",
};

export function ClientMyPetPage() {
  const { t } = useTranslation();
  const { s } = useSimpleLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [detail, setDetail] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [form, setForm] = useState(EMPTY_FORM);
  const [vaccineForm, setVaccineForm] = useState({
    name: "",
    appliedAt: "",
    nextDueAt: "",
    veterinarianName: "",
    batchNumber: "",
    notes: "",
  });

  const { activePetId, setActivePetId } = useActivePetForAi(pets.map((p) => p.id));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/client/pets", { credentials: "include" });
    const json = await res.json();
    if (json.success) setPets(json.data.pets ?? []);
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (petId: string) => {
    const res = await fetch(`/api/client/pets/${petId}`, { credentials: "include" });
    const json = await res.json();
    if (json.success) setDetail(json.data.pet);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (activePetId) void loadDetail(activePetId);
    else setDetail(null);
  }, [activePetId, loadDetail]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback("");
    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      sex: form.sex || null,
      birthDate: form.birthDate || null,
      weight: form.weight ? Number(form.weight) : null,
      color: form.color || null,
      microchip: form.microchip || null,
      neutered: form.neutered,
      notes: form.notes || null,
    };
    const res = await fetch(editingId ? `/api/client/pets/${editingId}` : "/api/client/pets", {
      method: editingId ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      setFeedback(json.error?.message ?? t("pets.saveError"));
      setFeedbackType("error");
      return;
    }
    const saved = json.data.pet as Pet;
    setFeedback(editingId ? t("pets.updated") : t("pets.created"));
    setFeedbackType("success");
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    await load();
    setActivePetId(saved.id);
  }

  async function handleRemove(petId: string, petName: string) {
    if (!confirm(t("pets.removeConfirm", { name: petName }))) return;
    const res = await fetch(`/api/client/pets/${petId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json();
    if (json.success) {
      setFeedback(t("pets.removed"));
      setFeedbackType("success");
      if (activePetId === petId) setActivePetId(null);
      await load();
    } else {
      setFeedback(json.error?.message ?? t("pets.removeError"));
      setFeedbackType("error");
    }
  }

  async function handleAddVaccine(e: React.FormEvent) {
    e.preventDefault();
    if (!activePetId) return;
    const res = await fetch(`/api/client/pets/${activePetId}/health`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "vaccination",
        data: {
          name: vaccineForm.name,
          appliedAt: vaccineForm.appliedAt,
          nextDueAt: vaccineForm.nextDueAt || null,
          veterinarianName: vaccineForm.veterinarianName || null,
          batchNumber: vaccineForm.batchNumber || null,
          notes: vaccineForm.notes || null,
        },
      }),
    });
    const json = await res.json();
    if (!json.success) {
      setFeedback(json.error?.message ?? t("pets.vaccineError"));
      setFeedbackType("error");
      return;
    }
    setVaccineForm({ name: "", appliedAt: "", nextDueAt: "", veterinarianName: "", batchNumber: "", notes: "" });
    setFeedback(t("pets.vaccineAdded"));
    setFeedbackType("success");
    await loadDetail(activePetId);
  }

  function startEdit(pet: Pet) {
    setEditingId(pet.id);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? "",
      sex: pet.sex ?? "",
      birthDate: pet.birthDate ? String(pet.birthDate).slice(0, 10) : "",
      weight: pet.weight != null ? String(pet.weight) : "",
      color: pet.color ?? "",
      microchip: pet.microchip ?? "",
      neutered: Boolean(pet.neutered),
      notes: pet.notes ?? "",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ClientPageHeader
        title={s(t("pets.title"))}
        description={s(t("pets.subtitle"))}
        actions={
          <Button size="sm" className="gap-2 rounded-[var(--radius-button)]" onClick={() => { setShowForm((v) => !v); setEditingId(null); setForm(EMPTY_FORM); }}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            {s(t("pets.register"))}
          </Button>
        }
      />

      <ClientFeedback message={feedback} type={feedbackType} />

      {showForm && (
        <form
          onSubmit={handleSave}
          className="grid gap-3 rounded-[var(--radius-xl)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5 shadow-[var(--shadow-sm)] sm:grid-cols-2"
        >
          <h3 className="sm:col-span-2 font-display text-base font-semibold">{editingId ? s(t("pets.edit")) : s(t("pets.new"))}</h3>
          <Input placeholder={t("pets.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-label={t("pets.name")} />
          <select
            className="w-full rounded-[var(--radius-input)] border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm"
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            aria-label={t("pets.species")}
          >
            <option value="DOG">{t("pets.speciesDog")}</option>
            <option value="CAT">{t("pets.speciesCat")}</option>
            <option value="BIRD">{t("pets.speciesBird")}</option>
            <option value="OTHER">{t("pets.speciesOther")}</option>
          </select>
          <Input placeholder={t("pets.breed")} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <select
            className="w-full rounded-[var(--radius-input)] border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm"
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
            aria-label={t("pets.sex")}
          >
            <option value="">{t("pets.sexUnknown")}</option>
            <option value="MALE">{t("pets.sexMale")}</option>
            <option value="FEMALE">{t("pets.sexFemale")}</option>
          </select>
          <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} aria-label={t("pets.birthDate")} />
          <Input type="number" step="0.1" placeholder={t("pets.weight")} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          <Input placeholder={t("pets.color")} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <Input placeholder={t("pets.microchip")} value={form.microchip} onChange={(e) => setForm({ ...form, microchip: e.target.value })} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.neutered} onChange={(e) => setForm({ ...form, neutered: e.target.checked })} />
            {s(t("pets.neutered"))}
          </label>
          <textarea
            className="sm:col-span-2 min-h-20 w-full rounded-[var(--radius-input)] border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm"
            placeholder={t("pets.notes")}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={saving} className="rounded-[var(--radius-button)]">
              {saving ? t("common.saving") : t("common.save")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <ClientGridSkeleton count={3} />
      ) : pets.length === 0 ? (
        <ClientEmptyState
          icon={PawPrint}
          title={s(t("pets.emptyTitle"))}
          description={s(t("pets.emptyDescription"))}
          actionLabel={s(t("pets.registerFirst"))}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pets.map((pet) => {
            const age = computeAgeFromBirthDate(pet.birthDate ?? undefined);
            const isActive = activePetId === pet.id;
            return (
              <article
                key={pet.id}
                className="rounded-[var(--radius-xl)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-ecopet-green/10">
                    {pet.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PawPrint className="h-5 w-5 text-ecopet-green" strokeWidth={2} aria-hidden />
                    )}
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ecopet-green/15 px-2 py-0.5 text-[10px] font-semibold text-ecopet-green">
                      <Star className="h-3 w-3" /> {s(t("pets.active"))}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-display text-lg font-semibold">{pet.name}</h3>
                <p className="text-sm text-[var(--ep-fg-muted)]">
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                  {age ? ` · ${age}` : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant={isActive ? "default" : "outline"} className="rounded-[var(--radius-button)]" onClick={() => setActivePetId(pet.id)}>
                    {isActive ? s(t("pets.viewing")) : s(t("pets.useActive"))}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-[var(--radius-button)]" onClick={() => startEdit(pet)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
                    {t("common.edit")}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-ep-danger" onClick={() => handleRemove(pet.id, pet.name)}>
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {detail ? (
        <div className="space-y-4">
          <VaccinationBooklet
            pet={{
              name: detail.name,
              photo: detail.photo,
              species: detail.species,
              breed: detail.breed,
              birthDate: detail.birthDate,
            }}
            vaccinations={detail.vaccinations ?? []}
          />

          <form
            onSubmit={handleAddVaccine}
            className="grid gap-3 rounded-[var(--radius-xl)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5 sm:grid-cols-2"
          >
            <h3 className="sm:col-span-2 font-display text-base font-semibold">{s(t("pets.addVaccine"))}</h3>
            <Input required placeholder={t("pets.vaccineName")} value={vaccineForm.name} onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })} />
            <Input required type="date" value={vaccineForm.appliedAt} onChange={(e) => setVaccineForm({ ...vaccineForm, appliedAt: e.target.value })} aria-label={t("pets.appliedAt")} />
            <Input type="date" value={vaccineForm.nextDueAt} onChange={(e) => setVaccineForm({ ...vaccineForm, nextDueAt: e.target.value })} aria-label={t("pets.nextDue")} />
            <Input placeholder={t("pets.veterinarian")} value={vaccineForm.veterinarianName} onChange={(e) => setVaccineForm({ ...vaccineForm, veterinarianName: e.target.value })} />
            <Input placeholder={t("pets.batch")} value={vaccineForm.batchNumber} onChange={(e) => setVaccineForm({ ...vaccineForm, batchNumber: e.target.value })} />
            <Input placeholder={t("pets.notes")} value={vaccineForm.notes} onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })} />
            <div className="sm:col-span-2">
              <Button type="submit">{s(t("pets.saveVaccine"))}</Button>
            </div>
          </form>

          {detail.allergies && detail.allergies.length > 0 ? (
            <section className="rounded-[var(--radius-xl)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
              <h3 className="font-display text-base font-semibold">{s(t("pets.allergies"))}</h3>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {detail.allergies.map((a) => (
                  <li key={a.id}>{a.allergen}{a.severity ? ` · ${a.severity}` : ""}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.reminders && detail.reminders.length > 0 ? (
            <section className="rounded-[var(--radius-xl)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
              <h3 className="font-display text-base font-semibold">{s(t("pets.reminders"))}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {detail.reminders.map((r) => (
                  <li key={r.id}>
                    {r.title} — {new Date(r.dueAt).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.petDocuments && detail.petDocuments.length > 0 ? (
            <section className="rounded-[var(--radius-xl)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
              <h3 className="font-display text-base font-semibold">{s(t("pets.documents"))}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {detail.petDocuments.map((d) => (
                  <li key={d.id}>
                    {d.url ? (
                      <a href={d.url} className="text-ecopet-green underline" rel="noreferrer">
                        {d.name}
                      </a>
                    ) : (
                      d.name
                    )}{" "}
                    <span className="text-[var(--ep-fg-muted)]">({d.type})</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
