import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId } from "@swim-io/token-projects";
import Decimal from "decimal.js";

import type { TokenConfig } from "../../config";

import {
  atomicStringToHumanDecimal,
  humanDecimalToAtomicString,
} from "./atomicString";

const defaultStablecoinTokenSpec: TokenConfig = {
  id: "test-stablecoin",
  projectId: TokenProjectId.Usdc,
  nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
  nativeDetails: { address: "xxx", decimals: 8 },
  wrappedDetails: new Map([
    [EvmEcosystemId.Bnb, { address: "xxx", decimals: 18 }],
  ]),
};

describe("atomicString", () => {
  describe("atomicStringToHumanDecimal", () => {
    it("should convert atomic string to decimal for native ecosystem", () => {
      const decimal = atomicStringToHumanDecimal(
        "12345678900000",
        defaultStablecoinTokenSpec,
        SOLANA_ECOSYSTEM_ID,
      );
      expect(decimal).toEqual(new Decimal(123456.789));
    });

    it("should convert atomic string to decimal for wrapped ecosystem", () => {
      const decimal = atomicStringToHumanDecimal(
        "12345678900000",
        defaultStablecoinTokenSpec,
        EvmEcosystemId.Bnb,
      );
      expect(decimal).toEqual(new Decimal(0.0000123456789));
    });
  });

  describe("humanDecimalToAtomicString", () => {
    it("should convert decimal to atomic string for native ecosystem", () => {
      const atomicString = humanDecimalToAtomicString(
        new Decimal(123456.789),
        defaultStablecoinTokenSpec,
        SOLANA_ECOSYSTEM_ID,
      );
      expect(atomicString).toEqual("12345678900000");
    });

    it("should convert decimal to atomic string for wrapped ecosystem", () => {
      const atomicString = humanDecimalToAtomicString(
        new Decimal(123456.789),
        defaultStablecoinTokenSpec,
        EvmEcosystemId.Bnb,
      );
      expect(atomicString).toEqual("123456789000000000000000");
    });
  });
});
