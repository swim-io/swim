import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import Decimal from "decimal.js";

import type { TokenConfig } from "../../config";
import { TokenProjectIdV1 } from "../../config";

import {
  atomicStringToHumanDecimal,
  humanDecimalToAtomicString,
} from "./atomicString";

const defaultStablecoinTokenConfig: TokenConfig = {
  id: "test-stablecoin",
  projectId: TokenProjectIdV1.Usdc,
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
        defaultStablecoinTokenConfig,
        SOLANA_ECOSYSTEM_ID,
      );
      expect(decimal).toEqual(new Decimal(123456.789));
    });

    it("should convert atomic string to decimal for wrapped ecosystem", () => {
      const decimal = atomicStringToHumanDecimal(
        "12345678900000",
        defaultStablecoinTokenConfig,
        EvmEcosystemId.Bnb,
      );
      expect(decimal).toEqual(new Decimal(0.0000123456789));
    });
  });

  describe("humanDecimalToAtomicString", () => {
    it("should convert decimal to atomic string for native ecosystem", () => {
      const atomicString = humanDecimalToAtomicString(
        new Decimal(123456.789),
        defaultStablecoinTokenConfig,
        SOLANA_ECOSYSTEM_ID,
      );
      expect(atomicString).toEqual("12345678900000");
    });

    it("should convert decimal to atomic string for wrapped ecosystem", () => {
      const atomicString = humanDecimalToAtomicString(
        new Decimal(123456.789),
        defaultStablecoinTokenConfig,
        EvmEcosystemId.Bnb,
      );
      expect(atomicString).toEqual("123456789000000000000000");
    });
  });
});
