"use client";

import { PARTNER_TYPES, PARTNER_TYPE_REQUIRED_MESSAGE, type PartnerType } from "@/lib/partner/constants";
import { PartnerSelectableCards } from "@/components/features/foundation/partner/partner-selectable-cards";
import { usePartnerRegisterCopy } from "@/lib/i18n/use-register-copy";

type PartnerTypeSelectorProps = {
  value: PartnerType | null;
  onChange: (value: PartnerType) => void;
  error?: string;
};

export function PartnerTypeSelector({ value, onChange, error }: PartnerTypeSelectorProps) {
  const { p, tv } = usePartnerRegisterCopy();

  return (
    <section aria-labelledby="partner-type-heading">
      <h2 id="partner-type-heading" className="mb-4 text-lg font-semibold">
        {p.typeHeading}
      </h2>
      <PartnerSelectableCards
        name="partner-type"
        legend={p.legends.partnerType}
        options={PARTNER_TYPES.map((t) => ({
          value: t.value,
          label: p.partnerType(t.value),
          description: p.partnerTypeDesc(t.value),
          icon: t.icon,
        }))}
        value={value ?? ""}
        onChange={(v) => onChange(v as PartnerType)}
        error={error}
        columns={1}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
          {tv(error) || p.validation.partnerTypeRequired}
        </p>
      )}
    </section>
  );
}

export { PARTNER_TYPE_REQUIRED_MESSAGE };
