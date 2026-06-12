export type MessageTree = { [key: string]: string | MessageTree };

import ptBR from "@/i18n/locales/pt-BR.json";
import { flattenStaticKeys } from "./resolver";

const flatKeys = flattenStaticKeys(ptBR as MessageTree);

export type TranslationKey = keyof typeof flatKeys & string;

export const ALL_TRANSLATION_KEYS = Object.keys(flatKeys) as TranslationKey[];
