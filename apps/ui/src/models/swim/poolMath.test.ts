import Decimal from "decimal.js";

import { PoolMath } from "./poolMath";

const PRECISION = 6;

function round(decimal: Decimal): Decimal {
  const multiplier = new Decimal(10).pow(PRECISION);
  return decimal.mul(multiplier).round().div(multiplier);
}

describe("PoolMath tests", () => {
  test("basic uniform add", () => {
    const tokenCount = 3;
    const ampFactor = new Decimal(1);
    const lpFee = new Decimal(0);
    const governanceFee = new Decimal(0);

    const pool = new PoolMath(tokenCount, ampFactor, lpFee, governanceFee);
    expect(pool.add([new Decimal(1), new Decimal(1), new Decimal(1)])).toEqual({
      lpOutputAmount: new Decimal(3),
      governanceMintAmount: new Decimal(0),
    });
  });

  test("basic constant product depth", () => {
    const tokenCount = 2;
    const ampFactor = new Decimal(0);
    const lpFee = new Decimal(0);
    const governanceFee = new Decimal(0);

    const pool = new PoolMath(tokenCount, ampFactor, lpFee, governanceFee);
    expect(pool.add([new Decimal(3), new Decimal(12)])).toEqual({
      lpOutputAmount: new Decimal(12),
      governanceMintAmount: new Decimal(0),
    });
  });

  test("basic constant product add", () => {
    const balances = [1, 4].map((b) => new Decimal(b));
    const ampFactor = new Decimal(0);
    const lpFee = new Decimal(0);
    const governanceFee = new Decimal(0);

    const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);
    expect(pool.depth()).toEqual(new Decimal(4));
    expect(pool.add([new Decimal(5), new Decimal(2)])).toEqual({
      lpOutputAmount: new Decimal(8),
      governanceMintAmount: new Decimal(0),
    });
  });

  test("basic constant product swap", () => {
    const balances = [1, 4].map((b) => new Decimal(b));
    const ampFactor = new Decimal(0);
    const lpFee = new Decimal(0);
    const governanceFee = new Decimal(0);

    const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);
    expect(pool.swapExactInput([new Decimal(1), new Decimal(0)], 1)).toEqual({
      stableOutputAmount: new Decimal(2),
      governanceMintAmount: new Decimal(0),
    });
  });

  test("basic constant product swap with fee", () => {
    const balances = [1, 4].map((b) => new Decimal(b));
    const ampFactor = new Decimal(0);
    const lpFee = new Decimal("0.5");
    const governanceFee = new Decimal(0);

    const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);
    expect(pool.swapExactInput([new Decimal(2), new Decimal(0)], 1)).toEqual({
      stableOutputAmount: new Decimal(2),
      governanceMintAmount: new Decimal(0),
    });
  });

  test("depth and missing balance calculations", () => {
    const balances = [20, 10, 20, 5, 2, 1].map((b) => new Decimal(b));
    const ampFactor = new Decimal(1);
    const lpFee = new Decimal(0);
    const governanceFee = new Decimal(0);

    const expectedDepth = round(new Decimal("37.70007484983239375907243892"));

    const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);
    const depth = pool.depth();
    expect(round(depth)).toEqual(expectedDepth);
    for (let i = 0; i < balances.length; ++i) {
      expect(
        round(
          (pool as any).calcMissingBalance(
            balances.filter((_, j) => i !== j),
            depth,
          ),
        ),
      ).toEqual(balances[i]);
    }
  });

  test("that removeExactOutput is consistent with removeExactBurn", () => {
    const balances = [100, 100, 100].map((b) => new Decimal(b));
    const outAmount = new Decimal(10);
    const index = 0;
    const ampFactor = new Decimal("1.313");
    const lpFee = new Decimal("0.10");
    const governanceFee = new Decimal("0.40");

    const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);
    const outAmounts = balances.map((b, i) =>
      i === index ? outAmount : new Decimal(0),
    );

    const firstResult = pool.removeExactOutput(outAmounts);
    const secondResult = pool.removeExactBurn(firstResult.lpInputAmount, index);

    // console.log("original output:", outAmount);
    // console.log("    lp required:", round(firstResult.lpInputAmount));
    // console.log("rederivedOutput:", round(secondResult.stableOutputAmount));
    // console.log("governance mint:", round(secondResult.governanceMintAmount));

    expect(round(secondResult.stableOutputAmount)).toEqual(outAmount);
    expect(round(firstResult.governanceMintAmount)).toEqual(
      round(secondResult.governanceMintAmount),
    );
  });

  test("that swapExactIn is consistent with swapExactOut", () => {
    const balances = [100, 100, 100].map((b) => new Decimal(b));
    const inAmount = new Decimal(50);
    const inIndex = 0;
    const outIndex = 1;
    const ampFactor = new Decimal("1.313");
    const lpFee = new Decimal("0.10");
    const governanceFee = new Decimal("0.40");

    const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);

    const inAmounts = balances.map((b, i) =>
      i === inIndex ? inAmount : new Decimal(0),
    );

    const firstResult = pool.swapExactInput(inAmounts, outIndex);

    const outAmounts = balances.map((b, i) =>
      i === outIndex ? firstResult.stableOutputAmount : new Decimal(0),
    );

    const secondResult = pool.swapExactOutput(inIndex, outAmounts);
    // console.log(" original input:", inAmount);
    // console.log("    swap output:", round(firstResult.stableOutputAmount));
    // console.log("rederived input:", round(secondResult.stableInputAmount));
    // console.log("governance mint:", round(secondResult.governanceMintAmount));

    expect(inAmount).toEqual(round(secondResult.stableInputAmount));
    expect(round(firstResult.governanceMintAmount)).toEqual(
      round(secondResult.governanceMintAmount),
    );
  });

  test("that proportional and imbalanced add/remove gives the same result as doing it all at once", () => {
    for (const isAdd in { 1: true, 2: false }) {
      // https://typescript-eslint.io/rules/no-for-in-array/
      const balances = [100, 100, 100].map((b) => new Decimal(b));
      const ampFactor = new Decimal("1.313");
      const lpFee = new Decimal("0.10");
      const governanceFee = new Decimal("0.40");
      const fraction = 2;

      const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);

      const getLpAmount = (result: any): Decimal =>
        result[isAdd ? "lpOutputAmount" : "lpInputAmount"];

      const proportionalAmounts = balances.map((b) => b.div(fraction));
      const proportionalResult = isAdd
        ? pool.add(proportionalAmounts)
        : pool.removeExactOutput(proportionalAmounts);
      expect(proportionalResult.governanceMintAmount).toEqual(new Decimal(0));

      const balancesAfter = balances.map((b, i) =>
        b.plus(proportionalAmounts[i]),
      );
      const lpSupplyAfter = pool.depth().plus(getLpAmount(proportionalResult));
      const poolAfter = new PoolMath(
        balancesAfter,
        ampFactor,
        lpFee,
        governanceFee,
        lpSupplyAfter,
      );

      const imbalancedAmounts = balances.map((b, i) =>
        i === 0 ? balances[i].div(fraction * fraction) : new Decimal(0),
      );
      const imbalancedResult = isAdd
        ? poolAfter.add(imbalancedAmounts)
        : poolAfter.removeExactOutput(imbalancedAmounts);

      const togetherAmounts = proportionalAmounts.map((b, i) =>
        b.plus(imbalancedAmounts[i]),
      );

      const pool2 = new PoolMath(balances, ampFactor, lpFee, governanceFee);

      const togetherResult = isAdd
        ? pool2.add(togetherAmounts)
        : pool2.removeExactOutput(togetherAmounts);

      // console.log("          isAdd:", isAdd);
      // console.log("      lp in/out:", round(getLpAmount(togetherResult)));
      // console.log("governance mint:", round(imbalancedResult.governanceMintAmount));

      expect(
        round(
          getLpAmount(proportionalResult).plus(getLpAmount(imbalancedResult)),
        ),
      ).toEqual(round(getLpAmount(togetherResult)));

      expect(round(imbalancedResult.governanceMintAmount)).toEqual(
        round(togetherResult.governanceMintAmount),
      );
    }
  });
});
