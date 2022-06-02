import Decimal from "decimal.js";

import { atomicToTvlString, decimalRemoveTrailingZero } from "./amounts";

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
      expect(atomicToTvlString(new Decimal("1.2345"))).toEqual("1");
      expect(atomicToTvlString(new Decimal("12.345"))).toEqual("12");
      expect(atomicToTvlString(new Decimal("123.45"))).toEqual("124");
    });
    it("should format thousands with four sigfigs with a K", () => {
      expect(atomicToTvlString(new Decimal("1234.5"))).toEqual("1.235K");
      expect(atomicToTvlString(new Decimal("12345.6"))).toEqual("12.35K");
      expect(atomicToTvlString(new Decimal("123456.7"))).toEqual("123.5K");
    });
    it("should format millions with four sigfigs and a M", () => {
      expect(atomicToTvlString(new Decimal("1234567.8"))).toEqual("1.235M");
      expect(atomicToTvlString(new Decimal("12345678.9"))).toEqual("12.35M");
      expect(atomicToTvlString(new Decimal("123456789"))).toEqual("123.5M");
    });
    it("should format billions with four sigfigs and a B", () => {
      expect(atomicToTvlString(new Decimal("1.234e+9"))).toEqual("1.234B");
      expect(atomicToTvlString(new Decimal("1.234e+10"))).toEqual("12.34B");
      expect(atomicToTvlString(new Decimal("1.234e+11"))).toEqual("123.4B");
    });
    it("should format trillions with four sigfigs and a T", () => {
      expect(atomicToTvlString(new Decimal("1.234e+12"))).toEqual("1.234T");
      expect(atomicToTvlString(new Decimal("1.234e+13"))).toEqual("12.34T");
      expect(atomicToTvlString(new Decimal("1.234e+14"))).toEqual("123.4T");
      // Starts getting ugly at quadrillion.
      expect(atomicToTvlString(new Decimal("1.234e+15"))).toEqual("1234T");
      expect(atomicToTvlString(new Decimal("1.234e+16"))).toEqual("12340T");
    });
  });
});
