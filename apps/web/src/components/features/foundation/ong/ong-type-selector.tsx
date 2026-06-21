"use client";

import { ONG_TYPES, ONG_TYPE_REQUIRED_MESSAGE, type OngType } from "@/lib/ong/constants";
import { PartnerSelectableCards } from "@/components/features/foundation/partner/partner-selectable-cards";
import { useOngRegisterCopy } from "@/lib/i18n/use-register-copy";

type OngTypeSelectorProps = {
  value: OngType | null;
  onChange: (value: OngType) => void;
  error?: string;
};

export function OngTypeSelector({ value, onChange, error }: OngTypeSelectorProps) {
  const { o, tv } = useOngRegisterCopy();

  return (
    <section aria-labelledby="ong-type-heading">
      <h2 id="ong-type-heading" className="mb-4 text-lg font-semibold">
        {o.typeHeading}
      </h2>
      <PartnerSelectableCards
        name="ong-type"
        legend={o.legends.ongType}
        options={ONG_TYPES.map((t) => ({
          value: t.value,
          label: o.ongType(t.value),
          description: `${o.ongTypeDesc(t.value)} ${o.hints.documentLabel(t.documentLabel)}`,
          icon: t.icon,
        }))}
        value={value ?? ""}
        onChange={(v) => onChange(v as OngType)}
        error={error}
        columns={1}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
          {tv(error) || o.validation.ongTypeRequired}
        </p>
      )}
    </section>
  );
}

export { ONG_TYPE_REQUIRED_MESSAGE };
