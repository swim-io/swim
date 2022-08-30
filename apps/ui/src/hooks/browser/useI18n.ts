import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeepCompareMemo } from "use-deep-compare";

import { fallbackLanguageIfNotSupported } from "../../i18n";

export const useI18nLanguage = () => {
  const { i18n } = useTranslation();

  const [language, setLanguage] = useState(i18n.resolvedLanguage);
  useEffect(() => {
    const listener = () => {
      setLanguage(i18n.resolvedLanguage);
    };

    i18n.on("languageChanged", listener);

    return () => {
      i18n.off("languageChanged", listener);
    };
  }, [i18n]);

  return language;
};

type IntlOptionsType<T> = T extends new (
  locales?: any,
  options?: infer R,
) => any
  ? R
  : never;
const createUseIntlFormatter = <
  T extends {
    readonly supportedLocalesOf: (language: string) => readonly string[];
    new (
      // eslint-disable-next-line functional/prefer-readonly-type
      locales?: string | string[],
      options?: IntlOptionsType<T>,
    ): InstanceType<T>;
  },
>(
  IntlMethod: T,
) => {
  return function useIntlFormatter(
    options?: IntlOptionsType<T>,
  ): InstanceType<T> {
    const memoizedOptions = useDeepCompareMemo(() => options, [options]);

    const i18nLanguage = useI18nLanguage();

    const language = useMemo(() => {
      return fallbackLanguageIfNotSupported(IntlMethod, i18nLanguage);
    }, [i18nLanguage]);

    const formatter = useMemo(() => {
      return new IntlMethod(language, memoizedOptions);
    }, [language, memoizedOptions]);

    return formatter;
  };
};

export const useIntlDateTimeFormatter = createUseIntlFormatter(
  Intl.DateTimeFormat,
);
export const useIntlListFormatter = createUseIntlFormatter(Intl.ListFormat);
export const useIntlNumberFormatter = createUseIntlFormatter(Intl.NumberFormat);
export const useIntlRelativeTimeFormatter = createUseIntlFormatter(
  Intl.RelativeTimeFormat,
);

export const useIntlListSeparators = (
  options?: Omit<Intl.ListFormatOptions, "style">,
) => {
  const listFormatter = useIntlListFormatter(options);

  const parts = useMemo(() => {
    return listFormatter.formatToParts(["1", "2", "3"]);
  }, [listFormatter]);

  return {
    comma: parts[1].value,
    conjunction: parts[3].value,
  };
};

export const useIntlNumberSeparators = (): {
  readonly decimal: string;
  /** some locales do not have group separator such as `es` */
  readonly group: string | null;
} => {
  const numberFormatter = useIntlNumberFormatter();

  return useMemo(() => {
    const parts = numberFormatter.formatToParts(1234.5);

    const decimalSeparator = parts.find(
      (part) => part.type === "decimal",
    )?.value;
    if (!decimalSeparator) {
      throw new Error("Could not find decimal separator");
    }

    const groupSeparator =
      parts.find((part) => part.type === "group")?.value || null;

    return {
      decimal: decimalSeparator,
      group: groupSeparator,
    };
  }, [numberFormatter]);
};

export const useIntlRelativeTimeFromNow = (
  options?: Intl.RelativeTimeFormatOptions,
) => {
  const relativeTimeFormatter = useIntlRelativeTimeFormatter({
    numeric: "auto",
    ...options,
  });

  const relativeTimeFromNow = useCallback(
    (timestamp: number) => {
      const msPerSecond = 1000;
      const msPerMinute = 60 * msPerSecond;
      const msPerHour = msPerMinute * 60;
      const msPerDay = msPerHour * 24;
      const msPerMonth = msPerDay * 30;
      const msPerYear = msPerDay * 365;

      const current = Date.now();
      const elapsed = current - timestamp;

      if (elapsed < msPerMinute) {
        return relativeTimeFormatter.format(
          -Math.floor(elapsed / msPerSecond),
          "seconds",
        );
      } else if (elapsed < msPerHour) {
        return relativeTimeFormatter.format(
          -Math.floor(elapsed / msPerMinute),
          "minutes",
        );
      } else if (elapsed < msPerDay) {
        return relativeTimeFormatter.format(
          -Math.floor(elapsed / msPerHour),
          "hours",
        );
      } else if (elapsed < msPerMonth) {
        return relativeTimeFormatter.format(
          -Math.floor(elapsed / msPerDay),
          "days",
        );
      } else if (elapsed < msPerYear) {
        return relativeTimeFormatter.format(
          -Math.floor(elapsed / msPerMonth),
          "months",
        );
      } else {
        return relativeTimeFormatter.format(
          -Math.floor(elapsed / msPerYear),
          "years",
        );
      }
    },
    [relativeTimeFormatter],
  );

  return relativeTimeFromNow;
};
