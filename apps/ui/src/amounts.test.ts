import Decimal from "decimal.js";

import {
  atomicToCurrencyString,
  atomicToHumanString,
  atomicToTvlString,
  displayAmount,
  displayPercentage,
} from "./amounts";

describe("amounts", () => {
  describe("atomicToCurrencyString", () => {
    it("should format currency with usd symbol and 2 decimal places", () => {
      expect(atomicToCurrencyString(new Decimal("1.2345"))).toBe("$1.23");
      expect(atomicToCurrencyString(new Decimal("123.45"))).toBe("$123.45");
      expect(atomicToCurrencyString(new Decimal("1234.567"))).toBe("$1,234.57");
      expect(atomicToCurrencyString(new Decimal("1234567.8"))).toBe(
        "$1,234,567.80",
      );
    });
  });

  describe("atomicToHumanString", () => {
    it("does not keep decimal places by default", () => {
      expect(atomicToHumanString(new Decimal("1.4"))).toBe("1");
      expect(atomicToHumanString(new Decimal("1.5"))).toBe("2");
    });
    it("keeps exactly targeted amount of decimal places", () => {
      expect(atomicToHumanString(new Decimal("0.125"), 2)).toBe("0.13");
      expect(atomicToHumanString(new Decimal("0"), 2)).toBe("0.00");
    });
    it("inserts number separators in every 3 digits", () => {
      expect(atomicToHumanString(new Decimal("1234.5678"), 4)).toBe(
        "1,234.5678",
      );
    });
  });

  describe("atomicToTvlString", () => {
    it("should format smaller numbers without decimals", () => {
      expect(atomicToTvlString(new Decimal("1.2345"))).toBe("$1");
      expect(atomicToTvlString(new Decimal("12.345"))).toBe("$12");
      expect(atomicToTvlString(new Decimal("123.45"))).toBe("$123");
    });
    it("should format thousands with four sigfigs with a K", () => {
      expect(atomicToTvlString(new Decimal("1234.5"))).toBe("$1.235K");
      expect(atomicToTvlString(new Decimal("12345.6"))).toBe("$12.35K");
      expect(atomicToTvlString(new Decimal("123456.7"))).toBe("$123.5K");
    });
    it("should format millions with four sigfigs and a M", () => {
      expect(atomicToTvlString(new Decimal("1234567.8"))).toBe("$1.235M");
      expect(atomicToTvlString(new Decimal("12345678.9"))).toBe("$12.35M");
      expect(atomicToTvlString(new Decimal("123456789"))).toBe("$123.5M");
    });
    it("should format billions with four sigfigs and a B", () => {
      expect(atomicToTvlString(new Decimal("1.234e+9"))).toBe("$1.234B");
      expect(atomicToTvlString(new Decimal("1.234e+10"))).toBe("$12.34B");
      expect(atomicToTvlString(new Decimal("1.234e+11"))).toBe("$123.4B");
    });
    it("should format trillions with four sigfigs and a T", () => {
      expect(atomicToTvlString(new Decimal("1.234e+12"))).toBe("$1.234T");
      expect(atomicToTvlString(new Decimal("1.234e+13"))).toBe("$12.34T");
      expect(atomicToTvlString(new Decimal("1.234e+14"))).toBe("$123.4T");
      // Starts getting ugly at quadrillion.
      expect(atomicToTvlString(new Decimal("1.234e+15"))).toBe("$1234T");
      expect(atomicToTvlString(new Decimal("1.234e+16"))).toBe("$12,340T");
    });
  });

  describe("displayAmount", () => {
    it("should display correct number", () => {
      expect(displayAmount("100", 0)).toBe("100");
      expect(displayAmount("100", 1)).toBe("10.0");
      expect(displayAmount("100", 2)).toBe("1.00");
      expect(displayAmount("100", 3)).toBe("0.100");
      expect(displayAmount("100", 4)).toBe("0.0100");
      expect(displayAmount("100", 5)).toBe("0.00100");
      expect(displayAmount("100", 6)).toBe("0.000100");
      expect(displayAmount("2500", 6)).toBe("0.002500");
    });
  });

  describe("displayPercentage", () => {
    it("should display in percentage format", () => {
      expect(displayPercentage("100", 2)).toBe("100%");
      expect(displayPercentage("100", 3)).toBe("10.0%");
      expect(displayPercentage("100", 4)).toBe("1.00%");
      expect(displayPercentage("100", 5)).toBe("0.100%");
      expect(displayPercentage("100", 6)).toBe("0.0100%");
      expect(displayPercentage("2500", 6)).toBe("0.2500%");
      expect(displayPercentage("1234567890", 6)).toBe("123,456.7890%");
    });
  });
});
