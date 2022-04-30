import Decimal from "decimal.js";

function areAllNonNegativeOrThrow(decimals: readonly Decimal[]): void {
  if (decimals.some((d) => d.isNeg())) {
    throw new Error("Amounts have to be non-negative");
  }
}

function isPosOrThrow(amount: Decimal): void {
  if (!amount.isPos()) {
    throw new Error("passed amount must be positive");
  }
}

function arrayCreate(
  length: number,
  functor: (i: number) => Decimal,
): readonly Decimal[] {
  return Array.from({ length }, (_, i) => functor(i));
}

function arraySum(decimals: readonly Decimal[]): Decimal {
  return decimals.reduce((acc, d) => acc.plus(d), new Decimal(0));
}

function arrayProd(decimals: readonly Decimal[]): Decimal {
  return decimals.reduce((acc, d) => acc.mul(d), new Decimal(1));
}

function arrayAdd(
  arr1: readonly Decimal[],
  arr2: readonly Decimal[],
): readonly Decimal[] {
  return arrayCreate(arr1.length, (i) => arr1[i].plus(arr2[i]));
}

function arraySub(
  arr1: readonly Decimal[],
  arr2: readonly Decimal[],
): readonly Decimal[] {
  return arrayCreate(arr1.length, (i) => arr1[i].sub(arr2[i]));
}

function arrayScale(
  factor: Decimal,
  decimals: readonly Decimal[],
): readonly Decimal[] {
  return decimals.map((d) => d.mul(factor));
}

function subGivenOrder(
  keepOrder: boolean,
  dec1: Decimal,
  dec2: Decimal,
): Decimal {
  return keepOrder ? dec1.sub(dec2) : dec2.sub(dec1);
}

export class PoolMath {
  private static readonly MAX_TOKEN_COUNT = 20;
  //MIN_AMP_VALUE should be the same as the smart contract constant (see pool/src/amp_factor.rs)
  private static readonly MIN_AMP_VALUE = new Decimal(1);
  //MAX_AMP_VALUE should be the same as the smart contract constant (see pool/src/amp_factor.rs)
  private static readonly MAX_AMP_VALUE = new Decimal("1e6");
  private static readonly DEFAULT_TOLERANCE = new Decimal("1e-6");
  private static readonly DEFAULT_MAX_ITERATIONS = 200;
  private static readonly DEFAULT_MARGINAL_EPSILON = new Decimal("0.1");

  private balances: readonly Decimal[];
  private lpSupply: Decimal;
  private ampFactor: Decimal;
  private lpFee: Decimal;
  private governanceFee!: Decimal;
  private tolerance!: Decimal;
  private maxIterations!: number;

  constructor(
    //balances can have arbitrary units (though atomic units should most
    //likely go with a tolerance of 1 while human units should probably
    //use the maximum decimals of all involved tokens)
    balancesOrTokenCount: readonly Decimal[] | number,
    ampFactor: Decimal,
    lpFee: Decimal,
    governanceFee: Decimal,
    lpSupply: Decimal | null = null,
    tolerance: Decimal = PoolMath.DEFAULT_TOLERANCE,
    maxIterations = PoolMath.DEFAULT_MAX_ITERATIONS,
  ) {
    if (
      ampFactor.lt(PoolMath.MIN_AMP_VALUE) ||
      ampFactor.gt(PoolMath.MAX_AMP_VALUE)
    ) {
      throw new Error(
        ampFactor.toString() +
          " is not a valid ampFactor - must be in range [" +
          PoolMath.MIN_AMP_VALUE.toString() +
          ", " +
          +PoolMath.MAX_AMP_VALUE.toString() +
          "]",
      );
    }
    this.ampFactor = new Decimal(ampFactor);

    if (lpFee.isNeg() || lpFee.gte(1)) {
      throw new Error(
        "lpFee must be in range [0,1), but was instead " + lpFee.toString(),
      );
    }
    this.lpFee = new Decimal(lpFee);

    if (governanceFee.isNeg() || governanceFee.gte(1)) {
      throw new Error(
        "governanceFee must be in range [0,1), but was instead " +
          governanceFee.toString(),
      );
    }
    if (governanceFee.plus(this.lpFee).gte(1)) {
      throw new Error("total fees must be in range [0,1)");
    }
    this.governanceFee = new Decimal(governanceFee);

    if (tolerance.isNeg()) {
      throw new Error(
        "tolerance must be non-negative, but was instead " +
          tolerance.toString(),
      );
    }
    this.tolerance = new Decimal(tolerance);

    if (maxIterations <= 0 || !Number.isInteger(maxIterations)) {
      throw new Error(
        "maxIterations must be a positive integer, but was instead " +
          maxIterations.toString(),
      );
    }
    this.maxIterations = maxIterations;

    if (typeof balancesOrTokenCount === "number") {
      const tokenCount = balancesOrTokenCount;
      if (
        tokenCount < 2 ||
        tokenCount > PoolMath.MAX_TOKEN_COUNT ||
        !Number.isInteger(tokenCount)
      ) {
        throw new Error(
          tokenCount.toString() +
            " is not a valid tokenCount (must be an integer in [2, " +
            PoolMath.MAX_TOKEN_COUNT.toString() +
            "])",
        );
      }
      this.balances = new Array(balancesOrTokenCount).fill(new Decimal(0));
      this.lpSupply = new Decimal(0);
    } else {
      this.balances = balancesOrTokenCount;
      areAllNonNegativeOrThrow(this.balances);

      if (this.balances.some((b) => b.isZero())) {
        if (this.balances.some((b) => !b.isZero())) {
          throw new Error(
            "either all balances are 0 or none are. balances: " +
              this.balances.toString(),
          );
        }
        if (lpSupply && !lpSupply.isZero()) {
          throw new Error(
            "lpSupply must be 0 if balances are 0, but was instead " +
              lpSupply.toString(),
          );
        }
        this.lpSupply = new Decimal(0);
      } else {
        if (lpSupply) {
          if (lpSupply.isNeg()) {
            throw new Error(
              "lpSupply must be non negative, but was instead " +
                lpSupply.toString(),
            );
          }
          if (lpSupply.isZero()) {
            throw new Error("lpSupply can't be 0 if balances aren't 0");
          }
          this.lpSupply = new Decimal(lpSupply);
        } else {
          this.lpSupply = this.depth();
        }
      }
    }
  }

  // DEFI INSTRUCTIONS -------------------------------------------

  swapExactInput(
    inputAmounts: readonly Decimal[],
    outputIndex: number,
  ): {
    readonly stableOutputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const [stableOutputAmount, governanceMintAmount] = this.swap(
      true,
      inputAmounts,
      outputIndex,
    );
    return { stableOutputAmount, governanceMintAmount };
  }

  swapExactOutput(
    inputIndex: number,
    outputAmounts: readonly Decimal[],
  ): {
    readonly stableInputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const [stableInputAmount, governanceMintAmount] = this.swap(
      false,
      outputAmounts,
      inputIndex,
    );
    return { stableInputAmount, governanceMintAmount };
  }

  add(inputAmounts: readonly Decimal[]): {
    readonly lpOutputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    if (this.lpSupply.isZero()) {
      areAllNonNegativeOrThrow(inputAmounts);
      if (inputAmounts.some((b) => b.isZero())) {
        throw new Error(
          "on first add all amounts must be greater than 0, but were instead " +
            inputAmounts.toString(),
        );
      }
      const lpOutputAmount = this.calcDepth(inputAmounts);
      const governanceMintAmount = new Decimal(0);
      return { lpOutputAmount, governanceMintAmount };
    } else {
      const [lpOutputAmount, governanceMintAmount] = this.addRemove(
        true,
        inputAmounts,
      );
      return { lpOutputAmount, governanceMintAmount };
    }
  }

  removeExactOutput(outputAmounts: readonly Decimal[]): {
    readonly lpInputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const [lpInputAmount, governanceMintAmount] = this.addRemove(
      false,
      outputAmounts,
    );
    return { lpInputAmount, governanceMintAmount };
  }

  removeExactBurn(
    burnAmount: Decimal,
    outputIndex: number,
  ): {
    readonly stableOutputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    this.isTokenIndexOrThrow(outputIndex);
    isPosOrThrow(burnAmount);
    if (burnAmount.gte(this.lpSupply)) {
      throw new Error(
        "can only burn less than entire lpSupply. burnAmount: " +
          burnAmount.toString() +
          ", lpSupply: " +
          this.lpSupply.toString(),
      );
    }
    const initialDepth = this.depth();
    const updatedDepth = initialDepth.mul(
      this.lpSupply.sub(burnAmount).div(this.lpSupply),
    );
    const knownBalances = this.balances.filter((_, i) => i !== outputIndex);
    const missingBalance = this.calcMissingBalance(
      knownBalances,
      updatedDepth,
      this.balances[outputIndex],
    );
    const feelessAmount = this.balances[outputIndex].sub(missingBalance);
    if (this.totalFee.isZero()) {
      return {
        stableOutputAmount: feelessAmount,
        governanceMintAmount: new Decimal(0),
      };
    }
    const taxableFraction = new Decimal(1).sub(
      this.balances[outputIndex].div(arraySum(this.balances)),
    );
    const fee = new Decimal(1).div(new Decimal(1).sub(this.totalFee)).sub(1);
    const originalAmount = feelessAmount.div(taxableFraction.mul(fee).plus(1));
    const taxbase = originalAmount.mul(taxableFraction);
    const feeAmount = fee.mul(taxbase);
    const stableOutputAmount = feelessAmount.sub(feeAmount);
    const finalBalances = arrayCreate(this.tokenCount, (i) =>
      i !== outputIndex
        ? this.balances[i]
        : this.balances[i].sub(stableOutputAmount),
    );
    const finalDepth = this.calcDepth(finalBalances, updatedDepth);
    const totalFeeDepth = finalDepth.sub(updatedDepth);
    const governanceDepth = totalFeeDepth.mul(
      this.governanceFee.div(this.totalFee),
    );
    const governanceMintAmount = governanceDepth
      .div(updatedDepth.sub(governanceDepth))
      .mul(this.lpSupply.sub(burnAmount));
    return { stableOutputAmount, governanceMintAmount };
  }

  removeUniform(burnAmount: Decimal): readonly Decimal[] {
    isPosOrThrow(burnAmount);
    if (burnAmount.gt(this.lpSupply)) {
      throw new Error(
        "burnAmount exceeds entire lpSupply. burnAmount: " +
          burnAmount.toString() +
          ", lpSupply: " +
          this.lpSupply.toString(),
      );
    }
    return arrayScale(burnAmount.div(this.lpSupply), this.balances);
  }

  // OTHER INFO -------------------------------------------

  depth(): Decimal {
    return this.calcDepth(this.balances);
  }

  marginalPrices(
    epsilon = PoolMath.DEFAULT_MARGINAL_EPSILON,
  ): readonly Decimal[] {
    if (!epsilon.isPos()) {
      throw new Error(
        "epsilon must be a (small) positive value, but was instead " +
          epsilon.toString(),
      );
    }
    const depth = this.depth();
    return arrayCreate(this.tokenCount, (i) => {
      const balancesMinusEps = this.balances.map((balance, j) =>
        i === j ? balance.minus(epsilon) : balance,
      );
      const balancesPlusEps = this.balances.map((balance, j) =>
        i === j ? balance.plus(epsilon) : balance,
      );
      const lower = depth.minus(this.calcDepth(balancesMinusEps, depth));
      const upper = this.calcDepth(balancesPlusEps, depth).minus(depth);
      return lower.plus(upper).div(epsilon.mul(2));
    });
  }

  // IMPLEMENTATION -------------------------------------------

  private isTokenIndexOrThrow(i: number): void {
    if (i < 0 || i > this.tokenCount - 1 || !Number.isInteger(i)) {
      throw new Error("invalid array index");
    }
  }

  private get tokenCount(): number {
    return this.balances.length;
  }

  private get totalFee(): Decimal {
    return this.lpFee.plus(this.governanceFee);
  }

  private addRemove(
    isAdd: boolean,
    amounts: readonly Decimal[],
  ): readonly [Decimal, Decimal] {
    areAllNonNegativeOrThrow(amounts);
    if (!isAdd && this.balances.some((b, i) => !b.sub(amounts[i]).isPos())) {
      throw new Error("remove exceeds available balance");
    }
    const initialDepth = this.depth();
    const updatedBalances = (isAdd ? arrayAdd : arraySub)(
      this.balances,
      amounts,
    );
    const sumInitialBalances = arraySum(this.balances);
    const sumUpdatedBalances = arraySum(updatedBalances);
    const scaleFactor = sumUpdatedBalances.div(sumInitialBalances);
    const updatedDepth = this.calcDepth(
      updatedBalances,
      initialDepth.mul(scaleFactor),
    );
    if (this.totalFee.isZero()) {
      const lpAmount = subGivenOrder(isAdd, updatedDepth, initialDepth)
        .div(initialDepth)
        .mul(this.lpSupply);
      return [lpAmount, new Decimal(0)];
    }

    const fee = isAdd
      ? this.totalFee
      : new Decimal(1).div(new Decimal(1).sub(this.totalFee)).sub(1);
    const scaledBalances = arrayScale(scaleFactor, this.balances);
    const taxbase = arrayCreate(this.tokenCount, (i) =>
      Decimal.max(
        subGivenOrder(isAdd, updatedBalances[i], scaledBalances[i]),
        0,
      ),
    );
    const feeAmounts = arrayScale(fee, taxbase);
    const feeAdjustedBalances = arraySub(updatedBalances, feeAmounts);
    if (!isAdd && feeAdjustedBalances.some((b) => b.isNeg())) {
      throw new Error("impossible remove due to fees");
    }
    const feeAdjustedDepth = this.calcDepth(feeAdjustedBalances, updatedDepth);
    const totalFeeDepth = updatedDepth.minus(feeAdjustedDepth);
    const userDepth = subGivenOrder(isAdd, feeAdjustedDepth, initialDepth);
    const governanceDepth = totalFeeDepth.mul(
      this.governanceFee.div(this.totalFee),
    );
    const lpAmount = userDepth.div(initialDepth).mul(this.lpSupply);
    const governanceMintAmount = governanceDepth
      .div((isAdd ? updatedDepth : feeAdjustedDepth).sub(governanceDepth))
      .mul(this.lpSupply[isAdd ? "add" : "sub"](lpAmount));
    return [lpAmount, governanceMintAmount];
  }

  private swap(
    isInput: boolean,
    amounts: readonly Decimal[],
    index: number,
  ): readonly [Decimal, Decimal] {
    areAllNonNegativeOrThrow(amounts);
    this.isTokenIndexOrThrow(index);
    if (amounts.every((amount) => amount.isZero())) {
      return [new Decimal(0), new Decimal(0)];
    }
    if (!amounts[index].isZero()) {
      throw new Error("amount of swapped index must be zero");
    }
    if (!isInput && this.balances.some((b, i) => !b.sub(amounts[i]).isPos())) {
      throw new Error("amount to be received exceeds available balance");
    }
    const initialDepth = this.depth();
    const updatedBalances = (isInput ? arrayAdd : arraySub)(
      this.balances,
      amounts,
    );
    const swapBaseBalances =
      isInput && !this.totalFee.isZero()
        ? arraySub(updatedBalances, arrayScale(this.totalFee, amounts))
        : updatedBalances;
    const knownBalances = swapBaseBalances.filter((_, i) => i !== index);
    const missingBalance = this.calcMissingBalance(
      knownBalances,
      initialDepth,
      isInput ? this.balances[index] : null,
    );
    const userAmount = subGivenOrder(
      isInput,
      this.balances[index],
      missingBalance,
    );
    const finalAmount =
      !isInput && !this.totalFee.isZero()
        ? userAmount.div(new Decimal(1).sub(this.totalFee))
        : userAmount;
    if (this.totalFee.isZero()) {
      return [finalAmount, new Decimal(0)];
    }
    const finalBalances = arrayCreate(this.tokenCount, (i) =>
      i !== index
        ? updatedBalances[i]
        : updatedBalances[i][isInput ? "sub" : "add"](finalAmount),
    );
    const finalDepth = this.calcDepth(finalBalances, initialDepth);
    const totalFeeDepth = finalDepth.sub(initialDepth);
    const governanceDepth = totalFeeDepth.mul(
      this.governanceFee.div(this.totalFee),
    );
    const governanceMintAmount = governanceDepth
      .div(initialDepth.plus(totalFeeDepth).sub(governanceDepth))
      .mul(this.lpSupply);
    return [finalAmount, governanceMintAmount];
  }

  private calcDepth(
    balances: readonly Decimal[],
    initialGuess: Decimal | null = null,
  ): Decimal {
    const tokenCount = new Decimal(this.tokenCount);
    const sumBalances = arraySum(balances);
    const sumTimesAmp = sumBalances.mul(this.ampFactor);
    const productFactor = (depthApprox: Decimal, balance: Decimal): Decimal =>
      depthApprox.div(tokenCount.mul(balance));

    let depthApprox = initialGuess ?? sumBalances;
    for (let i = 0; i < this.maxIterations; ++i) {
      const reciprocalDecay = arrayProd(
        balances.map(productFactor.bind(null, depthApprox)),
      );

      const numerator = sumTimesAmp.plus(
        tokenCount.mul(depthApprox).mul(reciprocalDecay),
      );
      const denominator = this.ampFactor
        .minus(1)
        .plus(tokenCount.plus(1).mul(reciprocalDecay));
      const depthNext = numerator.div(denominator);

      if (depthNext.minus(depthApprox).abs().lte(this.tolerance)) {
        return depthNext;
      }
      depthApprox = depthNext;
    }
    throw new Error(
      "calcDepth() failed to converge within specified maxIterations (" +
        this.maxIterations.toString() +
        ") and tolerance (" +
        this.tolerance.toString() +
        ")",
    );
  }

  private calcMissingBalance(
    knownBalances: readonly Decimal[],
    depth: Decimal,
    initialGuess: Decimal | null,
  ): Decimal {
    const tokenCount = new Decimal(this.tokenCount);
    const depthDivAmp = depth.div(this.ampFactor);
    const reciprocalDecay = arrayProd(
      knownBalances.map((balance: Decimal) =>
        depth.div(tokenCount.mul(balance)),
      ),
    );
    const numeratorFixed = depthDivAmp
      .mul(depth.div(tokenCount))
      .mul(reciprocalDecay);
    const denominatorFixed = arraySum(knownBalances).plus(depthDivAmp);
    let missingBalanceApprox = initialGuess ?? depth;
    for (let i = 0; i < this.maxIterations; ++i) {
      const numerator = missingBalanceApprox
        .mul(missingBalanceApprox)
        .plus(numeratorFixed);
      const denominator = missingBalanceApprox
        .mul(2)
        .plus(denominatorFixed)
        .minus(depth);
      const missingBalanceNext = numerator.div(denominator);
      if (
        missingBalanceNext.minus(missingBalanceApprox).abs().lte(this.tolerance)
      ) {
        return missingBalanceNext;
      }
      missingBalanceApprox = missingBalanceNext;
    }
    throw new Error(
      "calcMissingBalance() failed to converge within specified maxIterations (" +
        this.maxIterations.toString() +
        ") and tolerance (" +
        this.tolerance.toString() +
        ")",
    );
  }
}
