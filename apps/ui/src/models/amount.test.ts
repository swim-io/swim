import BN from "bn.js";
import Decimal from "decimal.js";

import type { TokenSpec } from "../config";
import type { EcosystemId } from "../config";

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
  const defaultNonStablecoinTokenSpec: TokenSpec = {
    id: "test-token",
    symbol: "TEST",
    displayName: "Test Token",
    icon: ":)",
    isStablecoin: false,
    nativeEcosystem: SOLANA_ECOSYSTEM_ID,
    detailsByEcosystem: new Map([
      [SOLANA_ECOSYSTEM_ID, { address: "xxx", decimals: 8 }],
      [BNB_ECOSYSTEM_ID, { address: "xxx", decimals: 18 }],
    ]),
  };
  const defaultStablecoinTokenSpec: TokenSpec = {
    id: "test-stablecoin",
    symbol: "STABLE",
    displayName: "Test Stablecoin",
    icon: ":)",
    isStablecoin: true,
    nativeEcosystem: SOLANA_ECOSYSTEM_ID,
    detailsByEcosystem: new Map([
      [SOLANA_ECOSYSTEM_ID, { address: "xxx", decimals: 8 }],
      [BNB_ECOSYSTEM_ID, { address: "xxx", decimals: 18 }],
    ]),
  };
  const defaultEcosystemId = SOLANA_ECOSYSTEM_ID;

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "static method construction",
    (method, input) => {
      it(`works via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
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
          defaultNonStablecoinTokenSpec,
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
          defaultNonStablecoinTokenSpec,
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
            .toAtomic(BNB_ECOSYSTEM_ID)
            .equals(new Decimal("123456789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomic(ETHEREUM_ECOSYSTEM_ID)).toThrowError(
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
          defaultNonStablecoinTokenSpec,
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
            .toHuman(BNB_ECOSYSTEM_ID)
            .equals(new Decimal("123456.789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toHuman(ETHEREUM_ECOSYSTEM_ID)).toThrowError(
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
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(
          amount.toAtomicBn(SOLANA_ECOSYSTEM_ID).eq(new BN("12345678900000")),
        ).toBe(true);
        expect(
          amount
            .toAtomicBn(BNB_ECOSYSTEM_ID)
            .eq(new BN("123456789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomicBn(ETHEREUM_ECOSYSTEM_ID)).toThrowError(
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
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(amount.toAtomicString(SOLANA_ECOSYSTEM_ID)).toBe(
          "12345678900000",
        );
        expect(amount.toAtomicString(BNB_ECOSYSTEM_ID)).toBe(
          "123456789000000000000000",
        );
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomicString(ETHEREUM_ECOSYSTEM_ID)).toThrowError(
          /No token details for ecosystem/,
        );
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toHumanString",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(amount.toHumanString(SOLANA_ECOSYSTEM_ID)).toBe("123456.789");
        expect(amount.toHumanString(BNB_ECOSYSTEM_ID)).toBe("123456.789");
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toHumanString(ETHEREUM_ECOSYSTEM_ID)).toThrowError(
          /No token details for ecosystem/,
        );
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toFormattedHumanString",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(amount.toFormattedHumanString(SOLANA_ECOSYSTEM_ID)).toBe(
          "123,456.789",
        );
        expect(amount.toFormattedHumanString(BNB_ECOSYSTEM_ID)).toBe(
          "123,456.789",
        );
      });

      it(`rounds stablecoin Amounts constructed via ${method} to 2 decimal places`, () => {
        const amount = Amount[method](
          defaultStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(amount.toFormattedHumanString(SOLANA_ECOSYSTEM_ID)).toBe(
          "123,456.79",
        );
        expect(amount.toFormattedHumanString(BNB_ECOSYSTEM_ID)).toBe(
          "123,456.79",
        );
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() =>
          amount.toFormattedHumanString(ETHEREUM_ECOSYSTEM_ID),
        ).toThrowError(/No token details for ecosystem/);
      });
    },
  );

  describe.each<StaticMethodConstructionCase>(staticMethodConstructionCases)(
    "toJSON",
    (method, input) => {
      it(`works for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(amount.toJSON()).toBe("123456.789");
      });
    },
  );
});
