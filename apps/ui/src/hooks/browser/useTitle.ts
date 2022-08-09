import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const useTitle = (title: string): void => {
  const { t } = useTranslation();
  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    document.title =
      title === ""
        ? t("general.company_name")
        : title + " | " + t("general.company_name");
  }, [t, title]);
};
