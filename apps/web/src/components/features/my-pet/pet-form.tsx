"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreatePetPayload, PetSpecies, PetSize } from "@/lib/pets/types";
import { SPECIES_LABELS, SIZE_LABELS } from "@/lib/pets/labels";
import { todayIsoDate, validateOptionalBirthDate } from "@/schemas/validation/dates";

interface PetFormProps {
  initial?: Partial<CreatePetPayload>;
  onSubmit: (data: CreatePetPayload) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function PetForm({ initial, onSubmit, onCancel, loading }: PetFormProps) {
  const [form, setForm] = useState<CreatePetPayload>({
    name: initial?.name ?? "",
    species: initial?.species ?? "DOG",
    breed: initial?.breed ?? "",
    sex: initial?.sex ?? "",
    birthDate: initial?.birthDate ?? "",
    color: initial?.color ?? "",
    weight: initial?.weight,
    size: initial?.size,
    neutered: initial?.neutered ?? false,
    hasMicrochip: initial?.hasMicrochip ?? false,
    microchip: initial?.microchip ?? "",
    photo: initial?.photo ?? "",
    temperament: initial?.temperament ?? "",
    rescueHistory: initial?.rescueHistory ?? "",
    specialNeeds: initial?.specialNeeds ?? "",
    dietaryRestriction: initial?.dietaryRestriction ?? "",
    allergiesText: initial?.allergiesText ?? "",
    notes: initial?.notes ?? "",
    locationCity: initial?.locationCity ?? "",
    locationState: initial?.locationState ?? "",
    locationAddress: initial?.locationAddress ?? "",
  });

  const [birthDateError, setBirthDateError] = useState<string | undefined>();

  const set = (key: keyof CreatePetPayload, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cadastro do pet</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const err = validateOptionalBirthDate(form.birthDate ?? "");
            if (err) {
              setBirthDateError(err);
              return;
            }
            setBirthDateError(undefined);
            await onSubmit(form);
          }}
        >
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Nome *</label>
            <Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Espécie *</label>
            <select
              className="mt-1 flex h-11 w-full rounded-xl border border-ecopet-gray/20 px-3 text-sm"
              value={form.species}
              onChange={(e) => set("species", e.target.value as PetSpecies)}
            >
              {Object.entries(SPECIES_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Raça *</label>
            <Input className="mt-1" value={form.breed} onChange={(e) => set("breed", e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Sexo *</label>
            <select
              className="mt-1 flex h-11 w-full rounded-xl border border-ecopet-gray/20 px-3 text-sm"
              value={form.sex}
              onChange={(e) => set("sex", e.target.value)}
              required
            >
              <option value="">Selecione</option>
              <option value="M">Macho</option>
              <option value="F">Fêmea</option>
            </select>
          </div>
          <div>
            <label htmlFor="pet-birthDate" className="text-sm font-medium">Data de nascimento</label>
            <Input
              id="pet-birthDate"
              type="date"
              className="mt-1"
              value={form.birthDate ?? ""}
              max={todayIsoDate()}
              onChange={(e) => {
                set("birthDate", e.target.value);
                setBirthDateError(validateOptionalBirthDate(e.target.value));
              }}
              aria-invalid={birthDateError ? true : undefined}
              aria-describedby={birthDateError ? "pet-birthDate-error" : undefined}
            />
            {birthDateError && (
              <p id="pet-birthDate-error" className="mt-1 text-xs text-red-600" role="alert">{birthDateError}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Cor predominante *</label>
            <Input className="mt-1" value={form.color} onChange={(e) => set("color", e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Peso atual (kg)</label>
            <Input type="number" step="0.1" min="0" className="mt-1" value={form.weight ?? ""} onChange={(e) => set("weight", e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <label className="text-sm font-medium">Porte</label>
            <select
              className="mt-1 flex h-11 w-full rounded-xl border border-ecopet-gray/20 px-3 text-sm"
              value={form.size ?? ""}
              onChange={(e) => set("size", (e.target.value || undefined) as PetSize | undefined)}
            >
              <option value="">Selecione</option>
              {Object.entries(SIZE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Castrado</label>
            <select className="mt-1 flex h-11 w-full rounded-xl border border-ecopet-gray/20 px-3 text-sm" value={form.neutered ? "yes" : "no"} onChange={(e) => set("neutered", e.target.value === "yes")}>
              <option value="no">Não</option>
              <option value="yes">Sim</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Microchip</label>
            <select className="mt-1 flex h-11 w-full rounded-xl border border-ecopet-gray/20 px-3 text-sm" value={form.hasMicrochip ? "yes" : "no"} onChange={(e) => set("hasMicrochip", e.target.value === "yes")}>
              <option value="no">Não</option>
              <option value="yes">Sim</option>
            </select>
          </div>
          {form.hasMicrochip && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Número do microchip</label>
              <Input className="mt-1" value={form.microchip ?? ""} onChange={(e) => set("microchip", e.target.value)} />
            </div>
          )}
          <div className="sm:col-span-2">
            <FileUploadField
              purpose="pet_avatar"
              label="Foto do pet"
              value={form.photo}
              onChange={(url) => set("photo", url)}
              accept="image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Temperamento</label>
            <Input className="mt-1" value={form.temperament ?? ""} onChange={(e) => set("temperament", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Histórico de resgate</label>
            <Input className="mt-1" value={form.rescueHistory ?? ""} onChange={(e) => set("rescueHistory", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Necessidades especiais</label>
            <Input className="mt-1" value={form.specialNeeds ?? ""} onChange={(e) => set("specialNeeds", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Restrição alimentar</label>
            <Input className="mt-1" value={form.dietaryRestriction ?? ""} onChange={(e) => set("dietaryRestriction", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Alergias</label>
            <Input className="mt-1" value={form.allergiesText ?? ""} onChange={(e) => set("allergiesText", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Observações gerais</label>
            <Input className="mt-1" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar pet"}</Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
