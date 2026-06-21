"use client";

import { useMemo } from "react";
import type { TranslationKey } from "@/lib/i18n/types";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";
import {
  ACCOUNT_TYPE_SLUG,
  BANK_SLUG,
  CORPORATE_TYPE_SLUG,
  ONG_FOCUS_SLUG,
  ONG_ROLE_SLUG,
  PAYMENT_METHOD_SLUG,
  PIX_KEY_TYPE_SLUG,
  STREET_TYPE_SLUG,
  slugLookup,
} from "@/lib/i18n/option-slugs";

function optKey(base: string, slug: string): TranslationKey {
  return `${base}.${slug}` as TranslationKey;
}

function translateOpt(
  t: (key: TranslationKey) => string,
  base: string,
  value: string,
  map: Record<string, string>
): string {
  const slug = slugLookup(map, value);
  const key = optKey(base, slug);
  const msg = t(key);
  return msg !== key ? msg : value;
}

export function usePartnerRegisterCopy() {
  const base = useAuthMessages();
  const { t } = base;

  const p = useMemo(
    () => ({
      steps: {
        type: t("auth.register.partner.steps.type"),
        legal: t("auth.register.partner.steps.legal"),
        corporate: t("auth.register.partner.steps.corporate"),
        professional: t("auth.register.partner.steps.professional"),
        operation: t("auth.register.partner.steps.operation"),
        documentation: t("auth.register.partner.steps.documentation"),
        financial: t("auth.register.partner.steps.financial"),
        security: t("auth.register.partner.steps.security"),
      },
      sections: {
        legal: t("auth.register.partner.sections.legal"),
        corporate: t("auth.register.partner.sections.corporate"),
        professional: t("auth.register.partner.sections.professional"),
        operation: t("auth.register.partner.sections.operation"),
        financial: t("auth.register.partner.sections.financial"),
        security: t("auth.register.partner.sections.security"),
        address: t("auth.register.partner.sections.address"),
      },
      fields: {
        responsibleName: t("auth.register.partner.fields.responsibleName"),
        cpf: t("auth.register.fields.cpf"),
        email: t("auth.register.fields.email"),
        username: t("auth.client.username"),
        activityStart: t("auth.register.partner.fields.activityStart"),
        cnpj: t("auth.register.fields.cnpj"),
        businessName: t("auth.register.partner.fields.businessName"),
        legalName: t("auth.register.nameLabels.legalName"),
        corporateType: t("auth.register.partner.fields.corporateType"),
        corporateTypeOther: t("auth.register.partner.fields.corporateTypeOther"),
        professionalName: t("auth.register.partner.fields.professionalName"),
        activityArea: t("auth.register.partner.fields.activityArea"),
        activityAreaSearch: t("auth.register.partner.fields.activityAreaSearch"),
        activityAreaOther: t("auth.register.partner.fields.activityAreaOther"),
        businessDescription: t("auth.register.partner.fields.businessDescription"),
        streetType: t("auth.register.partner.fields.streetType"),
        streetTypeOther: t("auth.register.partner.fields.streetTypeOther"),
        openTime: t("auth.register.partner.fields.openTime"),
        closeTime: t("auth.register.partner.fields.closeTime"),
        logisticsNotes: t("auth.register.partner.fields.logisticsNotes"),
        pixKeyType: t("auth.register.partner.fields.pixKeyType"),
        pixKey: t("auth.register.partner.fields.pixKey"),
        bank: t("auth.register.partner.fields.bank"),
        bankOther: t("auth.register.partner.fields.bankOther"),
        agency: t("auth.register.partner.fields.agency"),
        account: t("auth.register.partner.fields.account"),
        accountDigit: t("auth.register.partner.fields.accountDigit"),
        accountType: t("auth.register.partner.fields.accountType"),
        accountHolder: t("auth.register.partner.fields.accountHolder"),
        accountHolderDoc: t("auth.register.partner.fields.accountHolderDoc"),
        password: t("auth.login.password"),
        confirmPassword: t("auth.client.confirmPassword"),
        instagram: t("auth.register.partner.fields.instagram"),
        whatsapp: t("auth.register.fields.phone"),
        website: t("auth.register.partner.fields.website"),
        linkedin: t("auth.register.partner.fields.linkedin"),
      },
      legends: {
        partnerType: t("auth.register.partner.legends.partnerType"),
        activityAreas: t("auth.register.partner.legends.activityAreas"),
        operation: t("auth.register.partner.legends.operation"),
        weekdays: t("auth.register.partner.legends.weekdays"),
        serviceRadius: t("auth.register.partner.legends.serviceRadius"),
        delivery: t("auth.register.partner.legends.delivery"),
        paymentMethods: t("auth.register.partner.legends.paymentMethods"),
      },
      actions: {
        back: t("auth.client.back"),
        continue: t("auth.register.partner.actions.continue"),
        finish: t("auth.register.partner.actions.finish"),
        finishing: t("auth.register.partner.actions.finishing"),
        select: t("auth.register.partner.actions.select"),
      },
      hints: {
        fullName: t("auth.validation.fullNameIncomplete"),
        descriptionCount: (n: number) => t("auth.register.partner.hints.descriptionCount", { count: String(n) }),
        byAppointment: t("auth.register.partner.hints.byAppointment"),
        emergency: t("auth.register.partner.hints.emergency"),
        hours24: t("auth.register.partner.hints.hours24"),
        logisticsPlaceholder: t("auth.register.partner.hints.logisticsPlaceholder"),
        usernameAvailable: t("auth.register.partner.hints.usernameAvailable"),
      },
      cnpj: {
        loading: t("auth.register.partner.cnpj.loading"),
        notFound: t("auth.register.partner.cnpj.notFound"),
        filled: t("auth.register.partner.cnpj.filled"),
        unavailable: t("auth.register.partner.cnpj.unavailable"),
      },
      success: {
        title: t("auth.register.partner.success.title"),
        description: t("auth.register.partner.success.description"),
        dashboard: t("auth.partnerPanel.dashboard"),
      },
      validation: {
        partnerTypeRequired: t("auth.register.partner.validation.partnerTypeRequired"),
        usernameInvalid: t("auth.register.partner.validation.usernameInvalid"),
        businessNameRequired: t("auth.register.partner.validation.businessNameRequired"),
        legalNameRequired: t("auth.register.partner.validation.legalNameRequired"),
        corporateTypeRequired: t("auth.register.partner.validation.corporateTypeRequired"),
        corporateTypeOtherRequired: t("auth.register.partner.validation.corporateTypeOtherRequired"),
        activityAreasRequired: t("auth.register.partner.validation.activityAreasRequired"),
        activityAreasOtherRequired: t("auth.register.partner.validation.activityAreasOtherRequired"),
        descriptionTooShort: t("auth.register.partner.validation.descriptionTooShort"),
        descriptionTooLong: t("auth.register.partner.validation.descriptionTooLong"),
        zipCodeInvalid: t("auth.register.partner.validation.zipCodeInvalid"),
        streetTypeRequired: t("auth.register.partner.validation.streetTypeRequired"),
        streetTypeOtherRequired: t("auth.register.partner.validation.streetTypeOtherRequired"),
        streetRequired: t("auth.register.partner.validation.streetRequired"),
        numberRequired: t("auth.register.partner.validation.numberRequired"),
        districtRequired: t("auth.register.partner.validation.districtRequired"),
        cityRequired: t("auth.register.partner.validation.cityRequired"),
        stateRequired: t("auth.register.partner.validation.stateRequired"),
        operationModesRequired: t("auth.register.partner.validation.operationModesRequired"),
        serviceRadiusRequired: t("auth.register.partner.validation.serviceRadiusRequired"),
        paymentMethodsRequired: t("auth.register.partner.validation.paymentMethodsRequired"),
        pixKeyRequired: t("auth.register.partner.validation.pixKeyRequired"),
        bankRequired: t("auth.register.partner.validation.bankRequired"),
        bankOtherRequired: t("auth.register.partner.validation.bankOtherRequired"),
        passwordInvalid: t("auth.register.partner.validation.passwordInvalid"),
        docsPending: t("auth.register.partner.validation.docsPending"),
        waitCpf: t("auth.register.partner.validation.waitCpf"),
        waitCnpj: t("auth.register.partner.validation.waitCnpj"),
        waitUsername: t("auth.client.usernameCheckingWait"),
        registerError: t("auth.client.registerError"),
      },
      typeHeading: t("auth.register.partner.typeHeading"),
      activityArea: (value: string) => t(optKey("auth.register.partner.options.activityAreas", value)),
      operationMode: (value: string) => t(optKey("auth.register.partner.options.operationModes", value)),
      weekday: (value: string) => t(optKey("auth.register.partner.options.weekdays", value)),
      serviceRadius: (value: string) => t(optKey("auth.register.partner.options.serviceRadius", value)),
      deliveryOption: (value: string) => t(optKey("auth.register.partner.options.deliveryOptions", value)),
      streetType: (value: string) =>
        translateOpt(t, "auth.register.partner.options.streetTypes", value, STREET_TYPE_SLUG),
      corporateType: (value: string) =>
        translateOpt(t, "auth.register.partner.options.corporateTypes", value, CORPORATE_TYPE_SLUG),
      paymentMethod: (value: string) =>
        translateOpt(t, "auth.register.partner.options.paymentMethods", value, PAYMENT_METHOD_SLUG),
      pixKeyType: (value: string) =>
        translateOpt(t, "auth.register.partner.options.pixKeyTypes", value, PIX_KEY_TYPE_SLUG),
      bank: (value: string) => translateOpt(t, "auth.register.partner.options.banks", value, BANK_SLUG),
      accountType: (value: string) =>
        translateOpt(t, "auth.register.partner.options.accountTypes", value, ACCOUNT_TYPE_SLUG),
      partnerType: (value: string) => t(optKey("auth.register.partner.options.partnerTypes", value)),
      partnerTypeDesc: (value: string) =>
        t(optKey("auth.register.partner.options.partnerTypeDescriptions", value)),
    }),
    [t]
  );

  return { ...base, p };
}

export function useOngRegisterCopy() {
  const base = useAuthMessages();
  const { t } = base;

  const o = useMemo(
    () => ({
      steps: {
        type: t("auth.register.ong.steps.type"),
        responsible: t("auth.register.ong.steps.responsible"),
        responsibleInstitution: t("auth.register.ong.steps.responsibleInstitution"),
        institutional: t("auth.register.ong.steps.institutional"),
        activity: t("auth.register.ong.steps.activity"),
        profile: t("auth.register.ong.steps.profile"),
        documentation: t("auth.register.ong.steps.documentation"),
        security: t("auth.register.ong.steps.security"),
      },
      sections: {
        responsible: t("auth.register.ong.sections.responsible"),
        responsibleInstitution: t("auth.register.ong.sections.responsibleInstitution"),
        institutional: t("auth.register.ong.sections.institutional"),
        activity: t("auth.register.ong.sections.activity"),
        profileIndividual: t("auth.register.ong.sections.profileIndividual"),
        profileInstitution: t("auth.register.ong.sections.profileInstitution"),
        security: t("auth.register.ong.sections.security"),
      },
      fields: {
        fullName: t("auth.register.nameLabels.fullName"),
        cpf: t("auth.register.fields.cpf"),
        email: t("auth.register.fields.email"),
        username: t("auth.client.username"),
        activityStart: t("auth.register.partner.fields.activityStart"),
        representativeRole: t("auth.register.ong.fields.representativeRole"),
        representativeRoleOther: t("auth.register.ong.fields.representativeRoleOther"),
        ongName: t("auth.register.ong.fields.ongName"),
        legalName: t("auth.register.nameLabels.legalName"),
        tradeName: t("auth.register.fields.tradeName"),
        foundedDate: t("auth.register.ong.fields.foundedDate"),
        focusArea: t("auth.register.ong.fields.focusArea"),
        focusAreaOther: t("auth.register.ong.fields.focusAreaOther"),
        city: t("auth.register.ong.fields.city"),
        state: t("auth.register.ong.fields.state"),
        statePlaceholder: t("auth.register.ong.fields.statePlaceholder"),
        actionAreaOther: t("auth.register.ong.fields.actionAreaOther"),
        descriptionIndividual: t("auth.register.ong.fields.descriptionIndividual"),
        descriptionInstitution: t("auth.register.ong.fields.descriptionInstitution"),
        mission: t("auth.register.ong.fields.mission"),
        vision: t("auth.register.ong.fields.vision"),
        animalCapacity: t("auth.register.ong.fields.animalCapacity"),
        coverIndividual: t("auth.register.ong.fields.coverIndividual"),
        coverInstitution: t("auth.register.ong.fields.coverInstitution"),
        pixDonations: t("auth.register.ong.fields.pixDonations"),
        password: t("auth.login.password"),
        confirmPassword: t("auth.client.confirmPassword"),
        instagram: t("auth.register.partner.fields.instagram"),
        facebook: t("auth.register.ong.fields.facebook"),
        linkedin: t("auth.register.partner.fields.linkedin"),
        youtube: t("auth.register.ong.fields.youtube"),
        whatsapp: t("auth.register.fields.phone"),
        website: t("auth.register.partner.fields.website"),
        uploadImage: t("auth.register.ong.fields.uploadImage"),
        replaceImage: t("auth.register.ong.fields.replaceImage"),
      },
      legends: {
        ongType: t("auth.register.ong.legends.ongType"),
        actionAreas: t("auth.register.ong.legends.actionAreas"),
      },
      actions: {
        back: t("auth.client.back"),
        continue: t("auth.register.partner.actions.continue"),
        finish: t("auth.register.partner.actions.finish"),
        finishing: t("auth.client.registering"),
        select: t("auth.register.partner.actions.select"),
      },
      hints: {
        activityDateRange: (min: string, max: string) =>
          t("auth.register.ong.hints.activityDateRange", { min, max }),
        usernameChecking: t("auth.client.usernameChecking"),
        usernameAvailable: t("auth.client.usernameAvailable"),
        documentLabel: (doc: string) => t("auth.register.ong.hints.documentLabel", { doc }),
        usernameTaken: t("auth.register.ong.hints.usernameTaken"),
      },
      success: {
        title: t("auth.register.ong.success.title"),
        description: t("auth.register.ong.success.description"),
        dashboard: t("auth.ongPanel.dashboard"),
      },
      validation: {
        ongTypeRequired: t("auth.register.ong.validation.ongTypeRequired"),
        usernameInvalid: t("auth.register.partner.validation.usernameInvalid"),
        representativeRoleRequired: t("auth.register.ong.validation.representativeRoleRequired"),
        representativeRoleOtherRequired: t("auth.register.ong.validation.representativeRoleOtherRequired"),
        ongNameRequired: t("auth.register.ong.validation.ongNameRequired"),
        legalNameRequired: t("auth.register.partner.validation.legalNameRequired"),
        foundedDateRequired: t("auth.register.ong.validation.foundedDateRequired"),
        focusAreaRequired: t("auth.register.ong.validation.focusAreaRequired"),
        focusAreaOtherRequired: t("auth.register.ong.validation.focusAreaOtherRequired"),
        actionTypesRequired: t("auth.register.ong.validation.actionTypesRequired"),
        actionTypesOtherRequired: t("auth.register.partner.validation.activityAreasOtherRequired"),
        descriptionIndividual: t("auth.register.ong.validation.descriptionIndividual"),
        descriptionInstitution: t("auth.register.ong.validation.descriptionInstitution"),
        missionRequired: t("auth.register.ong.validation.missionRequired"),
        visionRequired: t("auth.register.ong.validation.visionRequired"),
        cityRequired: t("auth.register.partner.validation.cityRequired"),
        stateRequired: t("auth.register.partner.validation.stateRequired"),
        passwordInvalid: t("auth.register.partner.validation.passwordInvalid"),
        docsPending: t("auth.register.ong.validation.docsPending"),
        waitCpf: t("auth.register.partner.validation.waitCpf"),
        waitCnpj: t("auth.register.partner.validation.waitCnpj"),
        waitUsername: t("auth.client.usernameCheckingWait"),
        registerError: t("auth.client.registerError"),
      },
      typeHeading: t("auth.register.ong.typeHeading"),
      ongType: (value: string) => t(optKey("auth.register.ong.options.ongTypes", value)),
      ongTypeDesc: (value: string) => t(optKey("auth.register.ong.options.ongTypeDescriptions", value)),
      actionArea: (value: string) => t(optKey("auth.register.ong.options.actionAreas", value)),
      representativeRole: (value: string) =>
        translateOpt(t, "auth.register.ong.options.representativeRoles", value, ONG_ROLE_SLUG),
      focusArea: (value: string) =>
        translateOpt(t, "auth.register.ong.options.focusAreas", value, ONG_FOCUS_SLUG),
    }),
    [t]
  );

  return { ...base, o };
}
