"use client";

import { PARTNER_TYPES, PARTNER_TYPE_REQUIRED_MESSAGE, type PartnerType } from "@/lib/partner/constants";
import { PartnerSelectableCards } from "@/components/features/foundation/partner/partner-selectable-cards";

type PartnerTypeSelectorProps = {
  value: PartnerType | null;
  onChange: (value: PartnerType) => void;
  error?: string;
};

export function PartnerTypeSelector({ value, onChange, error }: PartnerTypeSelectorProps) {
  return (
    <section aria-labelledby="partner-type-heading">
      <h2 id="partner-type-heading" className="mb-4 text-lg font-semibold">
        Qual é o seu tipo de atuação?
      </h2>
      <PartnerSelectableCards
        name="partner-type"
        legend="Tipo de parceiro *"
        options={PARTNER_TYPES.map((t) => ({
          value: t.value,
          label: t.label,
          description: t.description,
          icon: t.icon,
        }))}
        value={value ?? ""}
        onChange={(v) => onChange(v as PartnerType)}
        error={error || (!value ? undefined : undefined)}
        columns={1}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
          {error || PARTNER_TYPE_REQUIRED_MESSAGE}
        </p>
      )}
    </section>
  );
}

export { PARTNER_TYPE_REQUIRED_MESSAGE };
