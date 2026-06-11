export type MessageTree = { [key: string]: string | MessageTree };

export type TranslationKey =
  | "common.loading"
  | "common.error"
  | "common.search"
  | "common.save"
  | "common.cancel"
  | "nav.home"
  | "nav.feed"
  | "nav.explore"
  | "nav.marketplace"
  | "nav.ia"
  | "nav.pets"
  | "nav.adoption"
  | "nav.chat"
  | "nav.notifications"
  | "nav.premium"
  | "nav.settings"
  | "auth.login.title"
  | "auth.login.subtitle"
  | "auth.login.email"
  | "auth.login.password"
  | "auth.login.submit"
  | "auth.login.forgot"
  | "auth.login.noAccount"
  | "auth.register.title"
  | "auth.register.submit"
  | "auth.register.hasAccount"
  | "a11y.title"
  | "a11y.open"
  | "a11y.close"
  | "a11y.reset"
  | "a11y.skipLink"
  | "a11y.sections.visual"
  | "a11y.sections.auditory"
  | "a11y.sections.cognitive"
  | "a11y.sections.motor"
  | "a11y.sections.neuro"
  | "a11y.sections.libras"
  | "a11y.sections.braille"
  | "a11y.sections.languages"
  | "a11y.sections.preferences"
  | "a11y.labels.increaseFont"
  | "a11y.labels.decreaseFont"
  | "a11y.labels.resetFont"
  | "a11y.labels.letterSpacing"
  | "a11y.labels.lineHeight"
  | "a11y.labels.highContrast"
  | "a11y.labels.invertedContrast"
  | "a11y.labels.grayscale"
  | "a11y.labels.colorBlind"
  | "a11y.labels.highlightLinks"
  | "a11y.labels.strongFocus"
  | "a11y.labels.largeCursor"
  | "a11y.labels.readingMask"
  | "a11y.labels.readingGuide"
  | "a11y.labels.pauseAnimations"
  | "a11y.labels.screenReader"
  | "a11y.labels.dyslexia"
  | "a11y.labels.calm"
  | "a11y.labels.simplified"
  | "a11y.labels.reduceNotifications"
  | "a11y.labels.motor"
  | "a11y.labels.cognitive"
  | "a11y.labels.visualAlerts"
  | "a11y.labels.libras"
  | "a11y.labels.braille"
  | "a11y.librasNote"
  | "a11y.brailleNote"
  | "a11y.vlibrasLoading"
  | "a11y.vlibrasError"
  | "a11y.vlibrasReady"
  | "a11y.language.title"
  | "a11y.language.autoTranslate"
  | "a11y.language.autoTranslateNote"
  | "a11y.activated"
  | "a11y.deactivated"
  | "a11y.preferencesSaved"
  | "lang.selector.label";

export const ALL_TRANSLATION_KEYS: TranslationKey[] = [
  "common.loading", "common.error", "common.search", "common.save", "common.cancel",
  "nav.home", "nav.feed", "nav.explore", "nav.marketplace", "nav.ia", "nav.pets",
  "nav.adoption", "nav.chat", "nav.notifications", "nav.premium", "nav.settings",
  "auth.login.title", "auth.login.subtitle", "auth.login.email", "auth.login.password",
  "auth.login.submit", "auth.login.forgot", "auth.login.noAccount",
  "auth.register.title", "auth.register.submit", "auth.register.hasAccount",
  "a11y.title", "a11y.open", "a11y.close", "a11y.reset", "a11y.skipLink",
  "a11y.sections.visual", "a11y.sections.auditory", "a11y.sections.cognitive",
  "a11y.sections.motor", "a11y.sections.neuro", "a11y.sections.libras",
  "a11y.sections.braille", "a11y.sections.languages", "a11y.sections.preferences",
  "a11y.labels.increaseFont", "a11y.labels.decreaseFont", "a11y.labels.resetFont",
  "a11y.labels.letterSpacing", "a11y.labels.lineHeight", "a11y.labels.highContrast",
  "a11y.labels.invertedContrast", "a11y.labels.grayscale", "a11y.labels.colorBlind",
  "a11y.labels.highlightLinks", "a11y.labels.strongFocus", "a11y.labels.largeCursor",
  "a11y.labels.readingMask", "a11y.labels.readingGuide", "a11y.labels.pauseAnimations",
  "a11y.labels.screenReader", "a11y.labels.dyslexia", "a11y.labels.calm",
  "a11y.labels.simplified", "a11y.labels.reduceNotifications", "a11y.labels.motor",
  "a11y.labels.cognitive",   "a11y.labels.visualAlerts", "a11y.labels.libras", "a11y.labels.braille",
  "a11y.librasNote", "a11y.brailleNote", "a11y.vlibrasLoading", "a11y.vlibrasError", "a11y.vlibrasReady", "a11y.language.title", "a11y.language.autoTranslate",
  "a11y.language.autoTranslateNote", "a11y.activated", "a11y.deactivated",
  "a11y.preferencesSaved", "lang.selector.label",
];
