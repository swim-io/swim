import { TokenProjectId } from "@swim-io/token-projects";
import Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";

import {
  atomicStringToHumanDecimal,
  humanDecimalToAtomicString,
} from "./atomicString";

const defaultStablecoinTokenSpec: TokenSpec = {
  id: "test-stablecoin",
  projectId: TokenProjectId.Usdc,
  nativeEcosystemId: EcosystemId.Solana,
  nativeDetails: { address: "xxx", decimals: 8 },
  wrappedDetails: new Map([
    [EcosystemId.Bnb, { address: "xxx", decimals: 18 }],
  ]),
};

describe("atomicString", () => {
  describe("atomicStringToHumanDecimal", () => {
    it("should convert atomic string to decimal for native ecosystem", () => {
      const decimal = atomicStringToHumanDecimal(
        "12345678900000",
        defaultStablecoinTokenSpec,
        EcosystemId.Solana,
      );
      expect(decimal).toEqual(new Decimal(123456.789));
    });

    it("should convert atomic string to decimal for wrapped ecosystem", () => {
      const decimal = atomicStringToHumanDecimal(
        "12345678900000",
        defaultStablecoinTokenSpec,
        EcosystemId.Bnb,
      );
      expect(decimal).toEqual(new Decimal(0.0000123456789));
    });
  });

  describe("humanDecimalToAtomicString", () => {
    it("should convert decimal to atomic string for native ecosystem", () => {
      const atomicString = humanDecimalToAtomicString(
        new Decimal(123456.789),
        defaultStablecoinTokenSpec,
        EcosystemId.Solana,
      );
      expect(atomicString).toEqual("12345678900000");
    });

    it("should convert decimal to atomic string for wrapped ecosystem", () => {
      const atomicString = humanDecimalToAtomicString(
        new Decimal(123456.789),
        defaultStablecoinTokenSpec,
        EcosystemId.Bnb,
      );
      expect(atomicString).toEqual("123456789000000000000000");
    });
  });
});
