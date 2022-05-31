import Decimal from "decimal.js";

import { decimalRemoveTrailingZero } from "./amounts";

describe("amounts", () => {
  describe("decimalRemoveTrailingZero", () => {
    it("should remove trailing zero for decimal", () => {
      expect(decimalRemoveTrailingZero(new Decimal("0.01230000"))).toEqual(
        "0.0123",
      );
    });
    it("should not remove trailing zero for integer", () => {
      expect(decimalRemoveTrailingZero(new Decimal("123000"))).toEqual(
        "123000",
      );
    });
  });

  describe("atomicToTvlString", () => {
    it("should format smaller numbers without decimals", () => {
      expect(decimalRemoveTrailingZero(new Decimal("1.2345"))).toEqual("1");
      expect(decimalRemoveTrailingZero(new Decimal("12.345"))).toEqual("12");
      expect(decimalRemoveTrailingZero(new Decimal("123.45"))).toEqual("123");
    });
    it("should format thousands with four sigfigs with a K", () => {
      expect(decimalRemoveTrailingZero(new Decimal("1234.5"))).toEqual(
        "1.234K",
      );
      expect(decimalRemoveTrailingZero(new Decimal("12345.6"))).toEqual(
        "12.34K",
      );
      expect(decimalRemoveTrailingZero(new Decimal("123456.7"))).toEqual(
        "123.4K",
      );
    });
    it("should format millions with four sigfigs and a M", () => {
      expect(decimalRemoveTrailingZero(new Decimal("1234567.8"))).toEqual(
        "1.234M",
      );
      expect(decimalRemoveTrailingZero(new Decimal("12345678.9"))).toEqual(
        "12.34M",
      );
      expect(decimalRemoveTrailingZero(new Decimal("12345679"))).toEqual(
        "123.4M",
      );
    });
    it("should format billions with four sigfigs and a B", () => {
      expect(decimalRemoveTrailingZero(new Decimal("123456790"))).toEqual(
        "1.234B",
      );
      expect(decimalRemoveTrailingZero(new Decimal("1234567900"))).toEqual(
        "12.34B",
      );
      expect(decimalRemoveTrailingZero(new Decimal("12345679000"))).toEqual(
        "123.4B",
      );
      expect(decimalRemoveTrailingZero(new Decimal("123456790000"))).toEqual(
        "1234B",
      );
      expect(decimalRemoveTrailingZero(new Decimal("1234567900000"))).toEqual(
        "1234B",
      );
      // Breaks past 10T.
      expect(decimalRemoveTrailingZero(new Decimal("12345679000000"))).toEqual(
        "1234B",
      );
    });
  });
});
