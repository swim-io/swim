import Decimal from "decimal.js";

import { PoolMath } from "./poolMath";

const PRECISION = 6;

function round(decimal: Decimal): Decimal {
  const multiplier = new Decimal(10).pow(PRECISION);
  return decimal.mul(multiplier).round().div(multiplier);
}

describe("PoolMath", () => {
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

  test("removeExactOutput is consistent with removeExactBurn", () => {
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

    expect(round(secondResult.stableOutputAmount)).toEqual(outAmount);
    expect(round(firstResult.governanceMintAmount)).toEqual(
      round(secondResult.governanceMintAmount),
    );
  });

  test("swapExactIn is consistent with swapExactOut", () => {
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

    expect(inAmount).toEqual(round(secondResult.stableInputAmount));
    expect(round(firstResult.governanceMintAmount)).toEqual(
      round(secondResult.governanceMintAmount),
    );
  });

  test.each([["add"], ["removeExactOutput"]])(
    "proportional and imbalanced %s gives the same result as doing it all at once",
    (methodName) => {
      const isAdd = methodName === "add";
      const testedOp = isAdd
        ? PoolMath.prototype.add // eslint-disable-line @typescript-eslint/unbound-method
        : PoolMath.prototype.removeExactOutput; // eslint-disable-line @typescript-eslint/unbound-method
      const addSub = isAdd
        ? Decimal.prototype.plus // eslint-disable-line @typescript-eslint/unbound-method
        : Decimal.prototype.minus; // eslint-disable-line @typescript-eslint/unbound-method
      const getLpAmount = (result: any): Decimal =>
        result[isAdd ? "lpOutputAmount" : "lpInputAmount"];

      const balances = [100, 100, 100].map((b) => new Decimal(b));
      const ampFactor = new Decimal("1.313");
      const lpFee = new Decimal("0.10");
      const governanceFee = new Decimal("0.40");
      const fraction = 2;

      const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);

      const proportionalAmounts = balances.map((b) => b.div(fraction));
      const proportionalResult = testedOp.bind(pool)(proportionalAmounts);
      expect(proportionalResult.governanceMintAmount).toEqual(new Decimal(0));

      const balancesAfter = balances.map((b, i) =>
        addSub.bind(b)(proportionalAmounts[i]),
      );
      const lpSupplyAfter = addSub.bind(pool.depth())(
        getLpAmount(proportionalResult),
      );
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
      const imbalancedResult = testedOp.bind(poolAfter)(imbalancedAmounts);

      const togetherAmounts = proportionalAmounts.map((b, i) =>
        b.plus(imbalancedAmounts[i]),
      );
      const togetherResult = testedOp.bind(pool)(togetherAmounts);

      expect(
        round(
          getLpAmount(proportionalResult).plus(getLpAmount(imbalancedResult)),
        ),
      ).toEqual(round(getLpAmount(togetherResult)));

      expect(round(imbalancedResult.governanceMintAmount)).toEqual(
        round(togetherResult.governanceMintAmount),
      );
    },
  );

  // Values taken from https://github.com/orca-so/typescript-sdk/blob/main/test/model/orca/quote/stable-quote.test.ts#L165-L214
  test.each([
    [10, "0.460846", "993818.115178"], //orca's (wrong) price impact: "0.502629"
    [100, "0.050447", "998699.971289"], //orca's (wrong) price impact: "0.055222"
  ])(
    "price impact matches Orca's definition with amp factor %i",
    (orcaAmpFactor, expectedPriceImpact, orcaOutputAmount) => {
      const precision = 6;
      const balances = [
        new Decimal("19768621.149413"),
        new Decimal("19577821.226623"),
      ];
      const lpFee = new Decimal("0.0006");
      const governanceFee = new Decimal("0.0001");
      const ampFactor = new Decimal(orcaAmpFactor).mul(balances.length); //convert to swim "units"
      const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);
      const inputAmount = new Decimal("1000000");
      const inputIndex = 0;
      const outputIndex = 1;

      const swimOutputAmount = pool.swapExactInput(
        [inputAmount, new Decimal(0)],
        outputIndex,
      ).stableOutputAmount;
      expect(swimOutputAmount.toDecimalPlaces(precision)).toEqual(
        new Decimal(orcaOutputAmount),
      );

      const priceImpact = pool.priceImpact(
        inputAmount,
        inputIndex,
        outputIndex,
      );
      expect(priceImpact.toDecimalPlaces(precision)).toEqual(
        new Decimal(expectedPriceImpact),
      );
    },
  );

  test.each([
    [[1, 4], 4, ["2", "0.5"]],
    [[1, 4], 2, ["4", "1"]],
    [[1, 2, 4], 6, ["2", "1", "0.5"]],
    [[1, 2, 4], 3, ["4", "2", "1"]],
  ])(
    "marginal prices for constant product pool",
    (balances, lpSupply, expectedPrices) => {
      const ampFactor = new Decimal("0");
      const irrelevant = new Decimal("0");
      const lpFee = irrelevant;
      const governanceFee = irrelevant;
      const pool = new PoolMath(
        balances.map((b) => new Decimal(b)),
        ampFactor,
        lpFee,
        governanceFee,
        new Decimal(lpSupply),
      );
      expect(pool.marginalPrices()).toEqual(
        expectedPrices.map((p) => new Decimal(p)),
      );
    },
  );

  test("analytic (partial derivative) marginal prices agree with difference quotient method", () => {
    //epsilon is used to calculate the difference quotient from both sides to approximate
    // the partial derivative (=marginal price)
    const epsilon = new Decimal("0.01");
    //precision specifies how many decimals of the two results have to be identical
    const precision = 10;

    const balances = [new Decimal("2e6"), new Decimal("2e7")];
    // const lpFee = new Decimal(0.0006);
    // const governanceFee = new Decimal(0.0001);
    const irrelevant = new Decimal(0);
    const lpFee = irrelevant;
    const governanceFee = irrelevant;
    const ampFactor = new Decimal(20);
    const pool = new PoolMath(balances, ampFactor, lpFee, governanceFee);
    //importantly, since marginalPrices are given in lp tokens, this test
    // relies on the default initialization of lpSupply = depth!
    // (otherwise, we'd have to adjust for lpSupply in our difference quotient
    //  function too)
    const marginalPrices = pool.marginalPrices();

    const marginalPriceDifferenceQuotient = (i: number): Decimal => {
      const balancesMinusEps = balances.map((balance, j) =>
        i === j ? balance.sub(epsilon) : balance,
      );
      const balancesPlusEps = balances.map((balance, j) =>
        i === j ? balance.add(epsilon) : balance,
      );
      const getDepth = (b: readonly Decimal[]) =>
        new PoolMath(b, ampFactor, irrelevant, irrelevant).depth();
      const lower = getDepth(balancesMinusEps);
      const upper = getDepth(balancesPlusEps);
      return upper.sub(lower).div(epsilon.mul(2));
    };

    marginalPrices.forEach((marginalPrice, i) => {
      const mpDifferenceQuotient = marginalPriceDifferenceQuotient(i);
      const _marginalPrice = marginalPrice.toDecimalPlaces(precision);
      const _mpDifferenceQuotient =
        mpDifferenceQuotient.toDecimalPlaces(precision);
      expect(_marginalPrice).toEqual(_mpDifferenceQuotient);
    });
  });
});
