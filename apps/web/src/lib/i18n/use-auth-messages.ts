"use client";

import { useMemo } from "react";
import { useTranslation } from "@/providers/i18n-provider";
import {
  translateApiAuthError,
  translateAuthMessage,
  translatePasswordError,
  translatePasswordLevel,
  translatePasswordRequirement,
} from "@/lib/i18n/auth-translations";

export function useAuthMessages() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      t,
      tv: (message: string | undefined) => translateAuthMessage(message, t),
      tpwError: (requirementId: string | undefined) => translatePasswordError(requirementId, t),
      tpwReq: (id: string) => translatePasswordRequirement(id, t),
      tpwLevel: (level: string) =>
        translatePasswordLevel(level as "very_weak", t),
      tApi: (message: string, code?: string) => translateApiAuthError(message, code, t),
      validation: {
        fullNameIncomplete: t("auth.validation.fullNameIncomplete"),
        emailInvalid: t("auth.validation.emailInvalid"),
        emailValid: t("auth.validation.emailValid"),
        phoneInvalid: t("auth.validation.phoneInvalid"),
        phoneValid: t("auth.validation.phoneValid"),
        brPhoneInvalid: t("auth.validation.brPhoneInvalid"),
        brDddRequired: t("auth.validation.brDddRequired"),
        birthDateFuture: t("auth.validation.birthDateFuture"),
        birthDateTooYoung: t("auth.validation.birthDateTooYoung"),
        birthDateTooOld: t("auth.validation.birthDateTooOld"),
        birthDateRequired: t("auth.validation.birthDateRequired"),
        passwordMismatch: t("auth.validation.passwordMismatch"),
        userAlreadyRegistered: t("auth.validation.userAlreadyRegistered"),
        genderRequired: t("auth.validation.genderRequired"),
        genderSpecify: t("auth.gender.specify"),
        cpfInvalid: t("auth.validation.cpfInvalid"),
        cnpjInvalid: t("auth.validation.cnpjInvalid"),
        nameTooLong: t("auth.validation.nameTooLong"),
        usernameFormat: t("auth.validation.usernameFormat"),
        passwordWeak: t("auth.validation.passwordWeak"),
        fieldRequired: t("auth.validation.fieldRequired"),
        selectOption: t("auth.validation.selectOption"),
      },
    }),
    [t]
  );
}
