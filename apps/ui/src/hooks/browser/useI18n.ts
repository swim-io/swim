import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useIntlListSeparators = () => {
  const { i18n } = useTranslation();

  const formatter = useMemo(() => {
    return new Intl.ListFormat(i18n.language, {
      style: "long",
      type: "conjunction",
    });
  }, [i18n.language]);

  const result = useMemo(() => {
    return formatter.formatToParts(["1", "2", "3"]);
  }, [formatter]);

  return {
    comma: result[1]?.value ?? ", ",
    conjunction: result[3]?.value ?? ", and ",
  };
};
