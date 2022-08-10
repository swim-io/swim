import { renderHook } from "@testing-library/react-hooks";

import { i18next } from "../../i18n";

import { useIntlListSeparators } from "./useI18n";

describe("useI18n", () => {
  describe("useIntlListSeparators", () => {
    const originalLanguage = i18next.language;

    afterEach(() => {
      i18next.language = originalLanguage;
    });

    it("responses comma and conjunction in english", () => {
      i18next.language = "en";
      const { result } = renderHook(() => useIntlListSeparators());
      expect(result.current.comma).toBe(", ");
      expect(result.current.conjunction).toBe(", and ");
    });

    it("responses comma and conjunction in chinese", () => {
      i18next.language = "zh-TW";
      const { result } = renderHook(() => useIntlListSeparators());
      expect(result.current.comma).toBe("、");
      expect(result.current.conjunction).toBe("和");
    });
  });
});
