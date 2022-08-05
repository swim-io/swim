import type { ResourceKey } from "i18next";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

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
    fallbackLng: "en",
    // Helps finding issues with loading not working.
    debug: process.env.NODE_ENV === "development",
  })
  .catch(console.error);
