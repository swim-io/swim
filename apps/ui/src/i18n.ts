import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { Language } from "./config";
import enTranslation from "./locales/en/translation.json";
import jaTranslation from "./locales/ja/translation.json";
import ruTranslation from "./locales/ru/translation.json";
import zhCnTranslation from "./locales/zh-CN/translation.json";

const fallbackLanguage = Language.En;

// eslint-disable-next-line import/no-named-as-default-member
i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: fallbackLanguage,
    // Helps finding issues with loading not working.
    debug: process.env.NODE_ENV === "development",
    react: {
      transSupportBasicHtmlNodes: false,
      // Work around Google Translate issue with React apps https://github.com/facebook/react/issues/11538
      transWrapTextNodes: "span",
    },
    resources: {
      [Language.En]: { translation: enTranslation },
      [Language.Ja]: { translation: jaTranslation },
      [Language.Ru]: { translation: ruTranslation },
      [Language.ZhCn]: { translation: zhCnTranslation },
    },
  })
  .catch(console.error);

export { i18next };

export const fallbackLanguageIfNotSupported = <
  T extends {
    readonly supportedLocalesOf: (language: string) => readonly string[];
    new (): InstanceType<T>;
  },
  L extends string,
>(
  IntlMethod: T,
  language: L,
): L | typeof fallbackLanguage => {
  try {
    if (IntlMethod.supportedLocalesOf(language).length === 0) {
      // valid language but no locales supported
      return fallbackLanguage;
    }
  } catch {
    // invalid locale
    return fallbackLanguage;
  }
  return language;
};
