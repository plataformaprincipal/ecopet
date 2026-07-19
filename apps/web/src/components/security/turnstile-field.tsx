"use client";

import { useTranslation } from "@/providers/i18n-provider";
import { TurnstileWidget, type TurnstileWidgetProps } from "./turnstile-widget";
import { TurnstileStatus } from "./turnstile-status";
import type { TurnstileWidgetState } from "@/lib/turnstile/types";
import { cn } from "@/lib/utils";

type TurnstileFieldProps = TurnstileWidgetProps & {
  state: TurnstileWidgetState;
  label?: string;
  showStatus?: boolean;
};

export function TurnstileField({
  state,
  label,
  showStatus = true,
  className,
  ...widgetProps
}: TurnstileFieldProps) {
  const { t } = useTranslation();
  const fieldLabel = label ?? t("turnstile.required");

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="text-sm font-medium text-ecopet-dark dark:text-white">
        {fieldLabel}
      </legend>
      <TurnstileWidget {...widgetProps} />
      {showStatus ? <TurnstileStatus state={state} /> : null}
    </fieldset>
  );
}
