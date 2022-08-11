import type { ResourceKey } from "i18next";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en/translation.json";

const fallbackLanguage = "en";

// eslint-disable-next-line import/no-named-as-default-member
i18next
  .use(LanguageDetector)
  .use(
    resourcesToBackend((language, namespace, callback) => {
      // prefer dynamic imports over standard i18next-http-backend in order to use hash to invalidate cache after deployment
      import(`./locales/${language}/translation.json`)
        .then((resources: boolean | ResourceKey | null | undefined) => {
          callback(null, resources);
        })
        .catch((error: Error) => {
          callback(error, null);
        });
    }),
  )
  .use(initReactI18next)
  .init({
    fallbackLng: fallbackLanguage,
    // Helps finding issues with loading not working.
    debug: process.env.NODE_ENV === "development",
    react: {
      // Work around Google Translate issue with React apps https://github.com/facebook/react/issues/11538
      transWrapTextNodes: "span",
    },
    ...(process.env.NODE_ENV === "test"
      ? {
          resources: {
            en: {
              // easier to test without waiting to download i18n files
              translation: enTranslation,
            },
          },
        }
      : {}),
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
      // valid locale but not supported
      return fallbackLanguage;
    }
  } catch {
    // invalid locale
    return fallbackLanguage;
  }
  return language;
};
