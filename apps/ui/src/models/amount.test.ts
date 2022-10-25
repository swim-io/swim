import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import BN from "bn.js";
import Decimal from "decimal.js";

import type { TokenConfig } from "../config";
import { TokenProjectIdV1 } from "../config";

import { Amount } from "./amount";

type StaticMethodConstructionCase = readonly [
  Extract<
    keyof typeof Amount,
    | "fromHuman"
    | "fromAtomic"
    | "fromAtomicBn"
    | "fromHumanString"
    | "fromAtomicString"
  >,
  any,
];

const staticMethodConstructionCases: readonly StaticMethodConstructionCase[] = [
  ["fromHuman", new Decimal("123456.789")],
  ["fromAtomic", new Decimal("12345678900000")],
  ["fromAtomicBn", new BN("12345678900000")],
  ["fromHumanString", "123456.789"],
  ["fromAtomicString", "12345678900000"],
];

describe("Amount", () => {
  const defaultNonStablecoinTokenConfig: TokenConfig = {
    id: "test-token",
    projectId: TokenProjectIdV1.Swim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: { address: "xxx", decimals: 8 },
    wrappedDetails: new Map([
      [EvmEcosystemId.Bnb, { address: "xxx", decimals: 18 }],
    ]),
  };
  const defaultStablecoinTokenConfig: TokenConfig = {
    id: "test-stablecoin",
    projectId: TokenProjectIdV1.Usdc,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: { address: "xxx", decimals: 8 },
    wrappedDetails: new Map([
      [EvmEcosystemId.Bnb, { address: "xxx", decimals: 18 }],
    ]),
  };
  const defaultEcosystemId = SOLANA_ECOSYSTEM_ID;

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "static method construction",
    (method, input) => {
      it(`works via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(amount).toBeInstanceOf(Amount);
      });
    },
  );

  describe("static method construction with human input", () => {
    describe("fromHumanString", () => {
      it("works with commas", () => {
        const amount = Amount.fromHumanString(
          defaultNonStablecoinTokenConfig,
          "123,456.789000",
        );
        expect(amount).toBeInstanceOf(Amount);
      });
    });
  });

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toAtomic",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(
          amount
            .toAtomic(SOLANA_ECOSYSTEM_ID)
            .equals(new Decimal("12345678900000")),
        ).toBe(true);
        expect(
          amount
            .toAtomic(EvmEcosystemId.Bnb)
            .equals(new Decimal("123456789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomic(EvmEcosystemId.Ethereum)).toThrowError(
          /No token details for ecosystem/,
        );
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toHuman",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(
          amount
            .toHuman(SOLANA_ECOSYSTEM_ID)
            .equals(new Decimal("123456.78900000")),
        ).toBe(true);
        expect(
          amount
            .toHuman(EvmEcosystemId.Bnb)
            .equals(new Decimal("123456.789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toHuman(EvmEcosystemId.Ethereum)).toThrowError(
          /No token details for ecosystem/,
        );
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toAtomicBn",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(
          amount.toAtomicBn(SOLANA_ECOSYSTEM_ID).eq(new BN("12345678900000")),
        ).toBe(true);
        expect(
          amount
            .toAtomicBn(EvmEcosystemId.Bnb)
            .eq(new BN("123456789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomicBn(EvmEcosystemId.Ethereum)).toThrowError(
          /No token details for ecosystem/,
        );
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toAtomicString",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(amount.toAtomicString(SOLANA_ECOSYSTEM_ID)).toBe(
          "12345678900000",
        );
        expect(amount.toAtomicString(EvmEcosystemId.Bnb)).toBe(
          "123456789000000000000000",
        );
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(() =>
          amount.toAtomicString(EvmEcosystemId.Ethereum),
        ).toThrowError(/No token details for ecosystem/);
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toHumanString",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(amount.toHumanString(SOLANA_ECOSYSTEM_ID)).toBe("123456.789");
        expect(amount.toHumanString(EvmEcosystemId.Bnb)).toBe("123456.789");
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(() =>
          amount.toHumanString(EvmEcosystemId.Ethereum),
        ).toThrowError(/No token details for ecosystem/);
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toFormattedHumanString",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(amount.toFormattedHumanString(SOLANA_ECOSYSTEM_ID)).toBe(
          "123,456.789",
        );
        expect(amount.toFormattedHumanString(EvmEcosystemId.Bnb)).toBe(
          "123,456.789",
        );
      });

      it(`rounds stablecoin Amounts constructed via ${method} to 2 decimal places`, () => {
        const amount = Amount[method](
          defaultStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(amount.toFormattedHumanString(SOLANA_ECOSYSTEM_ID)).toBe(
          "123,456.79",
        );
        expect(amount.toFormattedHumanString(EvmEcosystemId.Bnb)).toBe(
          "123,456.79",
        );
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(() =>
          amount.toFormattedHumanString(EvmEcosystemId.Ethereum),
        ).toThrowError(/No token details for ecosystem/);
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toJSON",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenConfig,
          input,
          defaultEcosystemId,
        );
        expect(amount.toJSON()).toBe("123456.789");
      });
    },
  );
});
