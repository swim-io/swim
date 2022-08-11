import { renderHook } from "@testing-library/react-hooks";

import { i18next } from "../../i18n";

import {
  useIntlDateTimeFormatter,
  useIntlListSeparators,
  useIntlNumberFormatter,
  useIntlRelativeTimeFromNow,
} from "./useI18n";

describe("useI18n", () => {
  describe("useIntlDateTimeFormatter", () => {
    const date = new Date(Date.UTC(2012, 11, 20, 13, 0, 0));
    const dateTimeOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZone: "UTC",
    } as const;

    const originalLanguage = i18next.language;

    afterEach(() => {
      i18next.language = originalLanguage;
    });

    it("should format in english style", () => {
      i18next.language = "en";

      const { result } = renderHook(() =>
        useIntlDateTimeFormatter(dateTimeOptions),
      );
      expect(result.current.format(date)).toBe(
        "Thursday, December 20, 2012, 1:00:00 PM",
      );
    });

    it("should format in french style", () => {
      i18next.language = "fr";

      const { result } = renderHook(() =>
        useIntlDateTimeFormatter(dateTimeOptions),
      );
      expect(result.current.format(date)).toBe(
        "jeudi 20 décembre 2012, 13:00:00",
      );
    });

    it("should format in english style if language is not supported", () => {
      i18next.language = "fake_not_supported";

      const { result } = renderHook(() =>
        useIntlDateTimeFormatter(dateTimeOptions),
      );
      expect(result.current.format(date)).toBe(
        "Thursday, December 20, 2012, 1:00:00 PM",
      );
    });
  });

  describe("useIntlListSeparators", () => {
    const originalLanguage = i18next.language;

    afterEach(() => {
      i18next.language = originalLanguage;
    });

    it("responses comma and conjunction in english", () => {
      i18next.language = "en";

      const { result: conjunctionResult } = renderHook(() =>
        useIntlListSeparators({ type: "conjunction" }),
      );
      expect(conjunctionResult.current.comma).toBe(", ");
      expect(conjunctionResult.current.conjunction).toBe(", and ");

      const { result: disjunctionResult } = renderHook(() =>
        useIntlListSeparators({ type: "disjunction" }),
      );
      expect(disjunctionResult.current.comma).toBe(", ");
      expect(disjunctionResult.current.conjunction).toBe(", or ");

      const { result: unitResult } = renderHook(() =>
        useIntlListSeparators({ type: "unit" }),
      );
      expect(unitResult.current.comma).toBe(", ");
      expect(unitResult.current.conjunction).toBe(", ");
    });

    it("responses comma and conjunction in chinese", () => {
      i18next.language = "zh-TW";

      const { result: conjunctionResult } = renderHook(() =>
        useIntlListSeparators({ type: "conjunction" }),
      );
      expect(conjunctionResult.current.comma).toBe("、");
      expect(conjunctionResult.current.conjunction).toBe("和");

      const { result: disjunctionResult } = renderHook(() =>
        useIntlListSeparators({ type: "disjunction" }),
      );
      expect(disjunctionResult.current.comma).toBe("、");
      expect(disjunctionResult.current.conjunction).toBe("或");

      const { result: unitResult } = renderHook(() =>
        useIntlListSeparators({ type: "unit" }),
      );
      expect(unitResult.current.comma).toBe(" ");
      expect(unitResult.current.conjunction).toBe(" ");
    });

    it("responses comma and conjunction in english if language is not supported", () => {
      i18next.language = "fake_not_supported";

      const { result: conjunctionResult } = renderHook(() =>
        useIntlListSeparators({ type: "conjunction" }),
      );
      expect(conjunctionResult.current.comma).toBe(", ");
      expect(conjunctionResult.current.conjunction).toBe(", and ");
    });
  });

  describe("useIntlNumberFormatter", () => {
    const originalLanguage = i18next.language;

    afterEach(() => {
      i18next.language = originalLanguage;
    });

    it("should format in english style", () => {
      i18next.language = "en";

      const { result } = renderHook(() => useIntlNumberFormatter());
      expect(result.current.format(1234)).toBe("1,234");
    });

    it("should format in french style", () => {
      i18next.language = "fr";

      const { result } = renderHook(() => useIntlNumberFormatter());
      expect(result.current.format(1234)).toBe("1 234");
    });

    it("should format in english style if language is not supported", () => {
      i18next.language = "fake_not_supported";

      const { result } = renderHook(() => useIntlNumberFormatter());
      expect(result.current.format(1234)).toBe("1,234");
    });
  });

  describe("useIntlRelativeTimeFromNow", () => {
    const originalLanguage = i18next.language;
    const msPerSecond = 1000;
    const msPerMinute = 60 * msPerSecond;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    beforeAll(() => {
      jest.useFakeTimers("modern");
    });

    afterEach(() => {
      i18next.language = originalLanguage;
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should format in english", () => {
      i18next.language = "en";

      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneSecondAgo = new Date(now.getTime() - msPerSecond);
      expect(result.current(oneSecondAgo.getTime())).toBe("1 second ago");
    });

    it("should format in french", () => {
      i18next.language = "fr";

      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneSecondAgo = new Date(now.getTime() - msPerSecond);
      expect(result.current(oneSecondAgo.getTime())).toBe("il y a 1 seconde");
    });

    it("should format in english if language is not supported", () => {
      i18next.language = "fake_not_supported";

      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneSecondAgo = new Date(now.getTime() - msPerSecond);
      expect(result.current(oneSecondAgo.getTime())).toBe("1 second ago");
    });

    it("should support singular and plurals", () => {
      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneSecondAgo = new Date(now.getTime() - msPerSecond);
      expect(result.current(oneSecondAgo.getTime())).toBe("1 second ago");

      const twoSecondsAgo = new Date(now.getTime() - msPerSecond * 2);
      expect(result.current(twoSecondsAgo.getTime())).toBe("2 seconds ago");
    });

    it("should support seconds", () => {
      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneSecondAgo = new Date(now.getTime() - msPerSecond);
      expect(result.current(oneSecondAgo.getTime())).toBe("1 second ago");

      const fiftyFiveSecondsAgo = new Date(now.getTime() - msPerSecond * 59);
      expect(result.current(fiftyFiveSecondsAgo.getTime())).toBe(
        "59 seconds ago",
      );
    });

    it("should support minutes", () => {
      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneMinuteAgo = new Date(now.getTime() - msPerMinute);
      expect(result.current(oneMinuteAgo.getTime())).toBe("1 minute ago");

      const fiftyFiveMinutesAgo = new Date(now.getTime() - msPerMinute * 59);
      expect(result.current(fiftyFiveMinutesAgo.getTime())).toBe(
        "59 minutes ago",
      );
    });

    it("should support hours", () => {
      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneHourAgo = new Date(now.getTime() - msPerHour);
      expect(result.current(oneHourAgo.getTime())).toBe("1 hour ago");

      const twentyThreeHoursAgo = new Date(now.getTime() - msPerHour * 23);
      expect(result.current(twentyThreeHoursAgo.getTime())).toBe(
        "23 hours ago",
      );
    });

    it("should support days", () => {
      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneDayAgo = new Date(now.getTime() - msPerDay);
      expect(result.current(oneDayAgo.getTime())).toBe("yesterday");

      const twentyNineDaysAgo = new Date(now.getTime() - msPerDay * 29);
      expect(result.current(twentyNineDaysAgo.getTime())).toBe("29 days ago");
    });

    it("should support months", () => {
      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneMonthAgo = new Date(now.getTime() - msPerMonth);
      expect(result.current(oneMonthAgo.getTime())).toBe("last month");

      const elevenMonthsAgo = new Date(now.getTime() - msPerMonth * 11);
      expect(result.current(elevenMonthsAgo.getTime())).toBe("11 months ago");
    });

    it("should support years", () => {
      const now = new Date();
      jest.setSystemTime(now);

      const { result } = renderHook(() => useIntlRelativeTimeFromNow());

      const oneYearAgo = new Date(now.getTime() - msPerYear);
      expect(result.current(oneYearAgo.getTime())).toBe("last year");

      const elevenYearsAgo = new Date(now.getTime() - msPerYear * 11);
      expect(result.current(elevenYearsAgo.getTime())).toBe("11 years ago");
    });
  });
});
