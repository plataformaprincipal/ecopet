"use client";

import { ONG_TYPES, ONG_TYPE_REQUIRED_MESSAGE, type OngType } from "@/lib/ong/constants";
import { PartnerSelectableCards } from "@/components/features/foundation/partner/partner-selectable-cards";

type OngTypeSelectorProps = {
  value: OngType | null;
  onChange: (value: OngType) => void;
  error?: string;
};

export function OngTypeSelector({ value, onChange, error }: OngTypeSelectorProps) {
  return (
    <section aria-labelledby="ong-type-heading">
      <h2 id="ong-type-heading" className="mb-4 text-lg font-semibold">
        Como você atua na proteção animal?
      </h2>
      <PartnerSelectableCards
        name="ong-type"
        legend="Tipo de cadastro *"
        options={ONG_TYPES.map((t) => ({
          value: t.value,
          label: t.label,
          description: `${t.description} Documento principal: ${t.documentLabel}.`,
          icon: t.icon,
        }))}
        value={value ?? ""}
        onChange={(v) => onChange(v as OngType)}
        error={error}
        columns={1}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
          {error || ONG_TYPE_REQUIRED_MESSAGE}
        </p>
      )}
    </section>
  );
}

export { ONG_TYPE_REQUIRED_MESSAGE };
