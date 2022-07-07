import BN from "bn.js";
import Decimal from "decimal.js";

import type { TokenSpec } from "../config";
import { EcosystemId, PROJECTS, TokenProjectId } from "../config";

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

const tokenProject = PROJECTS[TokenProjectId.Swim];

describe("Amount", () => {
  const defaultNonStablecoinTokenSpec: TokenSpec = {
    id: "test-token",
    project: tokenProject,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [EcosystemId.Solana, { address: "xxx", decimals: 8 }],
      [EcosystemId.Bnb, { address: "xxx", decimals: 18 }],
    ]),
  };
  const defaultStablecoinTokenSpec: TokenSpec = {
    id: "test-stablecoin",
    project: tokenProject,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [EcosystemId.Solana, { address: "xxx", decimals: 8 }],
      [EcosystemId.Bnb, { address: "xxx", decimals: 18 }],
    ]),
  };
  const defaultEcosystemId = EcosystemId.Solana;

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
            .toAtomic(EcosystemId.Solana)
            .equals(new Decimal("12345678900000")),
        ).toBe(true);
        expect(
          amount
            .toAtomic(EcosystemId.Bnb)
            .equals(new Decimal("123456789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomic(EcosystemId.Ethereum)).toThrowError(
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
            .toHuman(EcosystemId.Solana)
            .equals(new Decimal("123456.78900000")),
        ).toBe(true);
        expect(
          amount
            .toHuman(EcosystemId.Bnb)
            .equals(new Decimal("123456.789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toHuman(EcosystemId.Ethereum)).toThrowError(
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
          amount.toAtomicBn(EcosystemId.Solana).eq(new BN("12345678900000")),
        ).toBe(true);
        expect(
          amount
            .toAtomicBn(EcosystemId.Bnb)
            .eq(new BN("123456789000000000000000")),
        ).toBe(true);
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomicBn(EcosystemId.Ethereum)).toThrowError(
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
        expect(amount.toAtomicString(EcosystemId.Solana)).toBe(
          "12345678900000",
        );
        expect(amount.toAtomicString(EcosystemId.Bnb)).toBe(
          "123456789000000000000000",
        );
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toAtomicString(EcosystemId.Ethereum)).toThrowError(
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
        expect(amount.toHumanString(EcosystemId.Solana)).toBe("123456.789");
        expect(amount.toHumanString(EcosystemId.Bnb)).toBe("123456.789");
      });

      it(`throws for unknown ecosystem for Amount constructed via ${method}`, () => {
        const amount = Amount[method](
          defaultNonStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(() => amount.toHumanString(EcosystemId.Ethereum)).toThrowError(
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
        expect(amount.toFormattedHumanString(EcosystemId.Solana)).toBe(
          "123,456.789",
        );
        expect(amount.toFormattedHumanString(EcosystemId.Bnb)).toBe(
          "123,456.789",
        );
      });

      it(`rounds stablecoin Amounts constructed via ${method} to 2 decimal places`, () => {
        const amount = Amount[method](
          defaultStablecoinTokenSpec,
          input,
          defaultEcosystemId,
        );
        expect(amount.toFormattedHumanString(EcosystemId.Solana)).toBe(
          "123,456.79",
        );
        expect(amount.toFormattedHumanString(EcosystemId.Bnb)).toBe(
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
          amount.toFormattedHumanString(EcosystemId.Ethereum),
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
