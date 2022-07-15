// In this file, positive and negative are used in the strict sense, i.e. x is positive <=> x > 0
// and x is negative <=> x < 0. (And hence e.g. non-negative implies zero or positive, etc.)
//
// Since decimal.js has signed zeros (like IEEE floats!) and its .isPos() and .isNeg() methods
// only check for the sign value, it exhibits the following behavior:
//
// let a = new Decimal(0);
// console.log(a.isPos()); // => true
// console.log(a.isNeg()); // => false
// a = a.mul(-1);
// console.log(a.isPos()); // => false
// console.log(a.isNeg()); // => true
//
// Therefore, to enforce our strict definition, we rely on comparison operators instead.
import Decimal from "decimal.js";

Decimal.config({ precision: 40 });

function areAllNonNegativeOrThrow(decimals: readonly Decimal[]): void {
  if (decimals.some((d) => d.lt(0))) {
    throw new Error("Amounts have to be non-negative");
  }
}

//turn any (potentially negative) zeros into positive zeros
function sanitizeSign(val: Decimal): Decimal {
  return new Decimal(val.isZero() ? 0 : val);
}

function arrayCreate(
  length: number,
  functor: (i: number) => Decimal,
): readonly Decimal[] {
  return Array.from({ length }, (_, i) => functor(i));
}

function arraySum(decimals: readonly Decimal[]): Decimal {
  return decimals.reduce((acc, d) => acc.add(d), new Decimal(0));
}

function arrayProd(decimals: readonly Decimal[]): Decimal {
  return decimals.reduce((acc, d) => acc.mul(d), new Decimal(1));
}

function arrayAdd(
  arr1: readonly Decimal[],
  arr2: readonly Decimal[],
): readonly Decimal[] {
  return arrayCreate(arr1.length, (i) => arr1[i].add(arr2[i]));
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
  /**
   * MIN_AMP_VALUE should be the same as the smart contract constant (see pool/src/amp_factor.rs)
   * Alternatively, can also be 0 for constant product invariant!
   */
  private static readonly MIN_AMP_VALUE = new Decimal(1);
  /* MAX_AMP_VALUE should be the same as the smart contract constant (see pool/src/amp_factor.rs) */
  private static readonly MAX_AMP_VALUE = new Decimal("1e6");
  private static readonly DEFAULT_TOLERANCE = new Decimal("1e-6");
  private static readonly DEFAULT_MAX_ITERATIONS = 200;
  private static readonly EPSILON_TOLERANCE_DIVISOR = new Decimal(10);

  private readonly balances: readonly Decimal[];
  private readonly lpSupply: Decimal;
  private readonly ampFactor: Decimal;
  private readonly lpFee: Decimal;
  private readonly governanceFee!: Decimal;
  private readonly tolerance!: Decimal;
  private readonly maxIterations!: number;
  private readonly _depth: Decimal;

  constructor(
    /** Balances can have arbitrary units (though atomic units should most likely go with a
     * tolerance of 1 while human units should probably use the maximum decimals of all involved
     * tokens)
     */
    balancesOrTokenCount: readonly Decimal[] | number,
    /* Amp in 'Swim units' (= A*n**n) - divide by tokenCount to get 'Curve units' (= A*n**(n-1)) */
    ampFactor: Decimal,
    lpFee: Decimal,
    governanceFee: Decimal,
    lpSupply: Decimal | null = null,
    tolerance: Decimal = PoolMath.DEFAULT_TOLERANCE,
    maxIterations = PoolMath.DEFAULT_MAX_ITERATIONS,
  ) {
    if (
      (ampFactor.lt(PoolMath.MIN_AMP_VALUE) ||
        ampFactor.gt(PoolMath.MAX_AMP_VALUE)) &&
      !ampFactor.isZero()
    ) {
      throw new Error(
        `${ampFactor.toString()} is not a valid ampFactor - must be in range [${PoolMath.MIN_AMP_VALUE.toString()}, ${PoolMath.MAX_AMP_VALUE.toString()}] or 0`,
      );
    }
    this.ampFactor = ampFactor;

    if (lpFee.lt(0) || lpFee.gte(1)) {
      throw new Error(
        "lpFee must be in range [0,1), but was instead " + lpFee.toString(),
      );
    }
    this.lpFee = sanitizeSign(lpFee);

    if (governanceFee.lt(0) || governanceFee.gte(1)) {
      throw new Error(
        "governanceFee must be in range [0,1), but was instead " +
          governanceFee.toString(),
      );
    }
    if (governanceFee.add(this.lpFee).gte(1)) {
      throw new Error("total fees must be in range [0,1)");
    }
    this.governanceFee = sanitizeSign(governanceFee);

    if (tolerance.lte(0)) {
      throw new Error(
        "tolerance must be greater than 0 but was instead " +
          tolerance.toString(),
      );
    }
    this.tolerance = tolerance;

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
      this._depth = new Decimal(0);
      this.lpSupply = this._depth;
    } else {
      this.balances = balancesOrTokenCount.map((balance) =>
        sanitizeSign(balance),
      );
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
        this._depth = new Decimal(0);
        this.lpSupply = this._depth;
      } else {
        this._depth = this.calcDepth(this.balances);
        if (lpSupply) {
          if (lpSupply.lt(0)) {
            throw new Error(
              "lpSupply must be non negative, but was instead " +
                lpSupply.toString(),
            );
          }
          if (lpSupply.isZero()) {
            throw new Error("lpSupply can't be 0 if balances aren't 0");
          }
          this.lpSupply = lpSupply;
        } else {
          this.lpSupply = this._depth;
        }
      }
    }
  }

  private get tokenCount(): number {
    return this.balances.length;
  }

  private get totalFee(): Decimal {
    return this.lpFee.add(this.governanceFee);
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
    this.isValidBurnAmountOrThrow(burnAmount);
    if (burnAmount.isZero()) {
      return {
        stableOutputAmount: new Decimal(0),
        governanceMintAmount: new Decimal(0),
      };
    }
    const initialDepth = this._depth;
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
    const originalAmount = feelessAmount.div(taxableFraction.mul(fee).add(1));
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
    const updatedLpSupply = this.lpSupply.sub(burnAmount);
    const lpDepth = updatedDepth.add(totalFeeDepth).sub(governanceDepth);
    const appreciationFactor = updatedLpSupply.div(lpDepth);
    const governanceMintAmount = governanceDepth.mul(appreciationFactor);
    return { stableOutputAmount, governanceMintAmount };
  }

  removeUniform(burnAmount: Decimal): readonly Decimal[] {
    this.isValidBurnAmountOrThrow(burnAmount);
    return arrayScale(
      sanitizeSign(burnAmount).div(this.lpSupply),
      this.balances,
    );
  }

  // OTHER INFO -------------------------------------------

  depth(): Decimal {
    return this._depth;
  }

  marginalPrices(): readonly Decimal[] {
    const reciprocalDecay = arrayProd(
      this.balances.map((balance: Decimal) =>
        this._depth.div(balance.mul(this.tokenCount)),
      ),
    );
    const denominator = this.ampFactor
      .sub(1)
      .add(reciprocalDecay.mul(this.tokenCount + 1));
    return arrayCreate(this.tokenCount, (i) =>
      this.ampFactor
        .add(this._depth.mul(reciprocalDecay).div(this.balances[i]))
        .div(denominator),
    );
  }

  priceImpact(
    inputAmount: Decimal,
    inputIndex: number,
    outputIndex: number,
  ): Decimal {
    const marginalPrices = this.marginalPrices();
    const marginalPrice = marginalPrices[inputIndex].div(
      marginalPrices[outputIndex],
    );
    const extrapolatedOutput = inputAmount
      .mul(new Decimal(1).sub(this.totalFee))
      .mul(marginalPrice);
    const inputAmounts = this.balances.map((_, i) =>
      i === inputIndex ? inputAmount : new Decimal(0),
    );
    const actualOutput = this.swapExactInput(
      inputAmounts,
      outputIndex,
    ).stableOutputAmount;

    return extrapolatedOutput
      .sub(actualOutput)
      .div(extrapolatedOutput)
      .mul(100);
  }

  // IMPLEMENTATION -------------------------------------------

  private isTokenIndexOrThrow(i: number): void {
    if (i < 0 || i >= this.tokenCount || !Number.isInteger(i)) {
      throw new Error("invalid array index");
    }
  }

  private isValidBurnAmountOrThrow(burnAmount: Decimal): void {
    if (burnAmount.lt(0)) {
      throw new Error(
        "burnAmount must be non negative, but was instead " +
          burnAmount.toString(),
      );
    }
    if (burnAmount.gt(this.lpSupply)) {
      throw new Error(
        "burnAmount exceeds entire lpSupply. burnAmount: " +
          burnAmount.toString() +
          ", lpSupply: " +
          this.lpSupply.toString(),
      );
    }
  }

  private addRemove(
    isAdd: boolean,
    amounts: readonly Decimal[],
  ): readonly [Decimal, Decimal] {
    areAllNonNegativeOrThrow(amounts);
    if (!isAdd && this.balances.some((b, i) => b.lte(amounts[i]))) {
      throw new Error("remove exceeds available balance");
    }
    const initialDepth = this._depth;
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
    if (!isAdd && feeAdjustedBalances.some((b) => b.lte(0))) {
      throw new Error("impossible remove due to fees");
    }
    const feeAdjustedDepth = this.calcDepth(feeAdjustedBalances, updatedDepth);
    const totalFeeDepth = updatedDepth.sub(feeAdjustedDepth);
    const userDepth = subGivenOrder(isAdd, feeAdjustedDepth, initialDepth);
    const governanceDepth = totalFeeDepth.mul(
      this.governanceFee.div(this.totalFee),
    );
    const lpAmount = userDepth.div(initialDepth).mul(this.lpSupply);
    const updatedLpSupply = this.lpSupply[isAdd ? "add" : "sub"](lpAmount);
    const lpDepth = (isAdd ? feeAdjustedDepth : updatedDepth).sub(
      governanceDepth,
    );
    const appreciationFactor = updatedLpSupply.div(lpDepth);
    const governanceMintAmount = governanceDepth.mul(appreciationFactor);
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
    if (!isInput && this.balances.some((b, i) => b.lte(amounts[i]))) {
      throw new Error("amount to be received exceeds available balance");
    }
    const initialDepth = this._depth;
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
    const lpDepth = finalDepth.sub(governanceDepth);
    const appreciationFactor = this.lpSupply.div(lpDepth);
    const governanceMintAmount = governanceDepth.mul(appreciationFactor);
    return [finalAmount, governanceMintAmount];
  }

  private calcDepth(
    balances: readonly Decimal[],
    initialGuess: Decimal | null = null,
  ): Decimal {
    if (this.ampFactor.isZero()) {
      //constant product invariant
      return arrayProd(balances)
        .pow(new Decimal(1).div(this.tokenCount))
        .mul(this.tokenCount);
    }

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

      const numerator = sumTimesAmp.add(
        tokenCount.mul(depthApprox).mul(reciprocalDecay),
      );
      const denominator = this.ampFactor
        .sub(1)
        .add(tokenCount.add(1).mul(reciprocalDecay));
      const depthNext = numerator.div(denominator);

      if (depthNext.sub(depthApprox).abs().lte(this.tolerance)) {
        return depthNext.lte(0)
          ? this.tolerance.div(PoolMath.EPSILON_TOLERANCE_DIVISOR)
          : depthNext;
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
    if (this.ampFactor.isZero()) {
      //constant product invariant
      return arrayProd(
        [new Decimal(1), ...knownBalances].map((b) =>
          depth.div(b.mul(this.tokenCount)),
        ),
      );
    }

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
    const denominatorFixed = arraySum(knownBalances).add(depthDivAmp);
    let missingBalanceApprox = initialGuess ?? depth;
    for (let i = 0; i < this.maxIterations; ++i) {
      const numerator = missingBalanceApprox
        .mul(missingBalanceApprox)
        .add(numeratorFixed);
      const denominator = missingBalanceApprox
        .mul(2)
        .add(denominatorFixed)
        .sub(depth);
      const missingBalanceNext = numerator.div(denominator);
      //no .abs() required here because we always converge from above
      if (missingBalanceApprox.sub(missingBalanceNext).lte(this.tolerance)) {
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
