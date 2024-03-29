// In this file, positive and negative are used in the strict sense, i.e.
//  x is positive <=> x > 0 and x is negative <=> x < 0. (And hence e.g.
//  non-negative implies zero or positive, etc.)
//
// Since decimal.js has signed zeros (like IEEE floats!) and its .isPos() and
//  .isNeg() methods only check for the sign value, it exhibits the following
//  behavior:
//
// let a = new Decimal(0);
// console.log(a.isPos()); // => true
// console.log(a.isNeg()); // => false
// a = a.mul(-1);
// console.log(a.isPos()); // => false
// console.log(a.isNeg()); // => true
//
// Therefore, to enforce our strict definition, we rely on comparison operators
//  instead.
import Decimal from "decimal.js";

Decimal.config({ precision: 40 });

export type Decimalish = Decimal.Value;

export function toDecimal(val: Decimalish): Decimal;
export function toDecimal(val: readonly Decimalish[]): readonly Decimal[];
/**
 * this third declaration is necessary for mixed invocations such as
 *  [1, [2, "3"]].map(toDecimal)
 */
export function toDecimal(
  val: Decimalish | readonly Decimalish[],
): Decimal | readonly Decimal[];
/**
 * converts negative zeros into positive zeros
 */
export function toDecimal(
  val: Decimalish | readonly Decimalish[],
): Decimal | readonly Decimal[] {
  const impl = (v: Decimalish) => {
    const tmp = new Decimal(v);
    return tmp.isZero() ? new Decimal(0) : tmp;
  };

  return Array.isArray(val)
    ? val.map((v: Decimalish) => impl(v))
    : impl(val as Decimalish);
}

function areAllNonNegativeOrThrow(decimals: readonly Decimal[]): void {
  if (decimals.some((d) => d.lt(0)))
    throw new Error("Amounts have to be non-negative");
}

const arrayCreate = (length: number, functor: (i: number) => Decimal) =>
  Array.from({ length }, (_, i) => functor(i));

const arraySum = (decimals: readonly Decimal[]) =>
  decimals.reduce((acc, d) => acc.add(d), new Decimal(0));

const arrayProd = (decimals: readonly Decimal[]) =>
  decimals.reduce((acc, d) => acc.mul(d), new Decimal(1));

const arrayAdd = (arr1: readonly Decimal[], arr2: readonly Decimal[]) =>
  arrayCreate(arr1.length, (i) => arr1[i].add(arr2[i]));

const arraySub = (arr1: readonly Decimal[], arr2: readonly Decimal[]) =>
  arrayCreate(arr1.length, (i) => arr1[i].sub(arr2[i]));

const arrayScale = (factor: Decimal, decimals: readonly Decimal[]) =>
  decimals.map((d) => d.mul(factor));

const subGivenOrder = (keepOrder: boolean, dec1: Decimal, dec2: Decimal) =>
  keepOrder ? dec1.sub(dec2) : dec2.sub(dec1);

export class PoolMath {
  private static readonly MAX_TOKEN_COUNT = 20;
  /* MIN_AMP_VALUE should be the same as the smart contract constant
   *   (see pool/src/amp_factor.rs)
   * Alternatively, can also be 0 for constant product invariant!
   */
  private static readonly MIN_AMP_VALUE = new Decimal(1);
  /* MAX_AMP_VALUE should be the same as the smart contract constant
    (see pool/src/amp_factor.rs) */
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

  public constructor(
    /* Balances can have arbitrary units (though atomic units should most
     *  likely go with a tolerance of 1 while human units should probably use
     *  the maximum decimals of all involved tokens)
     */
    balancesOrTokenCount: readonly Decimalish[] | number,
    /* Amp in 'Swim units' (= A*n**n)
     *  divide by tokenCount to get 'Curve units' (= A*n**(n-1))
     */
    ampFactor: Decimalish,
    lpFee: Decimalish,
    governanceFee: Decimalish,
    lpSupply: Decimalish | null = null,
    tolerance: Decimalish = PoolMath.DEFAULT_TOLERANCE,
    maxIterations: number = PoolMath.DEFAULT_MAX_ITERATIONS,
  ) {
    this.ampFactor = toDecimal(ampFactor);
    if (
      (this.ampFactor.lt(PoolMath.MIN_AMP_VALUE) ||
        this.ampFactor.gt(PoolMath.MAX_AMP_VALUE)) &&
      !this.ampFactor.isZero()
    ) {
      throw new Error(
        `ampFactor must be in range [${PoolMath.MIN_AMP_VALUE.toString()}, ` +
          `${PoolMath.MAX_AMP_VALUE.toString()}] or 0 but was instead ` +
          `${this.ampFactor.toString()}`,
      );
    }

    this.lpFee = toDecimal(lpFee);
    if (this.lpFee.lt(0) || this.lpFee.gte(1)) {
      throw new Error(
        `lpFee must be in range [0, 1) but was instead ` +
          `${this.lpFee.toString()}`,
      );
    }
    this.governanceFee = toDecimal(governanceFee);
    if (this.governanceFee.lt(0) || this.governanceFee.gte(1)) {
      throw new Error(
        `governanceFee must be in range [0, 1) but was instead ` +
          `${this.governanceFee.toString()}`,
      );
    }
    if (this.totalFee.gte(1)) {
      throw new Error(
        `total fee must be in range [0, 1) but was instead ` +
          `${this.totalFee.toString()}`,
      );
    }

    this.tolerance = toDecimal(tolerance);
    if (this.tolerance.lte(0)) {
      throw new Error(
        `tolerance must be greater than 0 but was instead ` +
          `${this.tolerance.toString()}`,
      );
    }

    this.maxIterations = maxIterations;
    if (this.maxIterations <= 0 || !Number.isInteger(this.maxIterations)) {
      throw new Error(
        `maxIterations must be a positive integer but was instead ` +
          `${maxIterations}`,
      );
    }

    const lpSupply_ = lpSupply ? toDecimal(lpSupply) : null;
    if (typeof balancesOrTokenCount === "number") {
      const tokenCount = balancesOrTokenCount;
      if (
        tokenCount < 2 ||
        tokenCount > PoolMath.MAX_TOKEN_COUNT ||
        !Number.isInteger(tokenCount)
      ) {
        throw new Error(
          `tokenCount must be an integer in [2, ${PoolMath.MAX_TOKEN_COUNT}]` +
            ` but was instead ${tokenCount}`,
        );
      }
      if (lpSupply_ && !lpSupply_.isZero()) {
        throw new Error(
          `lpSupply must be 0 when only providing tokenCount but was instead ` +
            `${lpSupply_.toString()}`,
        );
      }
      this.balances = new Array(balancesOrTokenCount).fill(new Decimal(0));
      this._depth = new Decimal(0);
      this.lpSupply = this._depth;
    } else {
      this.balances = toDecimal(balancesOrTokenCount);
      areAllNonNegativeOrThrow(this.balances);

      if (this.balances.some((b) => b.isZero())) {
        if (this.balances.some((b) => !b.isZero())) {
          throw new Error(
            `either all balances are 0 or none are. balances: ` +
              `${this.balances.toString()}`,
          );
        }
        if (lpSupply_ && !lpSupply_.isZero()) {
          throw new Error(
            `lpSupply must be 0 if balances are 0 but was instead ` +
              `${lpSupply_.toString()}`,
          );
        }
        this._depth = new Decimal(0);
        this.lpSupply = this._depth;
      } else {
        this._depth = this.calcDepth(this.balances);
        if (lpSupply_) {
          if (lpSupply_.lt(0)) {
            throw new Error(
              `lpSupply must be non negative but was instead ` +
                `${lpSupply_.toString()}`,
            );
          }
          if (lpSupply_.isZero()) {
            throw new Error("lpSupply can't be 0 if balances aren't 0");
          }
          this.lpSupply = lpSupply_;
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

  public swapExactInput(
    inputAmounts: readonly Decimalish[],
    outputIndex: number,
  ): {
    readonly stableOutputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const [stableOutputAmount, governanceMintAmount] = this.swap(
      true,
      toDecimal(inputAmounts),
      outputIndex,
    );
    return { stableOutputAmount, governanceMintAmount };
  }

  public swapExactOutput(
    inputIndex: number,
    outputAmounts: readonly Decimalish[],
  ): {
    readonly stableInputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const [stableInputAmount, governanceMintAmount] = this.swap(
      false,
      toDecimal(outputAmounts),
      inputIndex,
    );
    return { stableInputAmount, governanceMintAmount };
  }

  public add(inputAmounts: readonly Decimalish[]): {
    readonly lpOutputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const inputAmounts_ = toDecimal(inputAmounts);
    if (this.lpSupply.isZero()) {
      areAllNonNegativeOrThrow(inputAmounts_);
      if (inputAmounts_.some((b) => b.isZero())) {
        throw new Error(
          `on first add all amounts must be greater than 0, but were instead ` +
            `${inputAmounts.toString()}`,
        );
      }
      const lpOutputAmount = this.calcDepth(inputAmounts_);
      const governanceMintAmount = new Decimal(0);
      return { lpOutputAmount, governanceMintAmount };
    } else {
      const [lpOutputAmount, governanceMintAmount] = this.addRemove(
        true,
        inputAmounts_,
      );
      return { lpOutputAmount, governanceMintAmount };
    }
  }

  public removeExactOutput(outputAmounts: readonly Decimalish[]): {
    readonly lpInputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const [lpInputAmount, governanceMintAmount] = this.addRemove(
      false,
      toDecimal(outputAmounts),
    );
    return { lpInputAmount, governanceMintAmount };
  }

  public removeExactBurn(
    burnAmount: Decimalish,
    outputIndex: number,
  ): {
    readonly stableOutputAmount: Decimal;
    readonly governanceMintAmount: Decimal;
  } {
    const burnAmount_ = toDecimal(burnAmount);
    this.isTokenIndexOrThrow(outputIndex);
    this.isValidBurnAmountOrThrow(burnAmount_);
    if (burnAmount_.isZero()) {
      return {
        stableOutputAmount: new Decimal(0),
        governanceMintAmount: new Decimal(0),
      };
    }
    const initialDepth = this._depth;
    const updatedDepth = initialDepth.mul(
      this.lpSupply.sub(burnAmount_).div(this.lpSupply),
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
    const updatedLpSupply = this.lpSupply.sub(burnAmount_);
    const lpDepth = updatedDepth.add(totalFeeDepth).sub(governanceDepth);
    const appreciationFactor = updatedLpSupply.div(lpDepth);
    const governanceMintAmount = governanceDepth.mul(appreciationFactor);
    return { stableOutputAmount, governanceMintAmount };
  }

  public removeUniform(burnAmount: Decimalish): readonly Decimal[] {
    const burnAmount_ = toDecimal(burnAmount);
    this.isValidBurnAmountOrThrow(burnAmount_);
    return arrayScale(burnAmount_.div(this.lpSupply), this.balances);
  }

  // OTHER INFO -------------------------------------------

  public depth(): Decimal {
    return this._depth;
  }

  public marginalPrices(): readonly Decimal[] {
    if (this.ampFactor.isZero()) {
      //constant product invariant: \prod balances[i] = (depth/tokenCount)^tokenCount
      //  hence: depth = tokenCount * (\prod balances[i])^(1/tokenCount)
      //derivative of depth with respect to one of the balances j:
      //  depth' = (\prod balances[i])^(1/tokenCount-1) * \prod_{i \neq j} balances[i]
      //         = (\prod balances[i])^(1/tokenCount) / balances[j]
      //         = depth / (tokenCount * balances[j])
      // and when priced in lp (i.e. * depth/lpSupply)
      const fixed = this._depth
        .mul(this._depth)
        .div(this.lpSupply)
        .div(this.tokenCount);
      return arrayCreate(this.tokenCount, (i) => fixed.div(this.balances[i]));
    }

    const reciprocalDecay = arrayProd(
      this.balances.map((balance: Decimal) =>
        this._depth.div(balance.mul(this.tokenCount)),
      ),
    );
    const fixed1 = this._depth.mul(reciprocalDecay);
    const denominator = this.ampFactor
      .sub(1)
      .add(reciprocalDecay.mul(this.tokenCount + 1));
    const pricedInLp = this._depth.div(this.lpSupply);
    const fixed2 = denominator.div(pricedInLp);
    return arrayCreate(this.tokenCount, (i) =>
      this.ampFactor.add(fixed1.div(this.balances[i])).div(fixed2),
    );
  }

  public priceImpact(
    inputAmount: Decimalish,
    inputIndex: number,
    outputIndex: number,
  ): Decimal {
    const marginalPrices = this.marginalPrices();
    const marginalPrice = marginalPrices[inputIndex].div(
      marginalPrices[outputIndex],
    );
    const extrapolatedOutput = toDecimal(inputAmount)
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
        `burnAmount must be non negative, but was instead ` +
          `${burnAmount.toString()}`,
      );
    }
    if (burnAmount.gt(this.lpSupply)) {
      throw new Error(
        `burnAmount exceeds entire lpSupply. burnAmount: ` +
          `${burnAmount.toString()}, lpSupply: ${this.lpSupply.toString()}`,
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
      `calcDepth() failed to converge within specified maxIterations` +
        ` (${this.maxIterations}) and tolerance (${this.tolerance.toString()})`,
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
      `calcMissingBalance() failed to converge within specified maxIterations` +
        ` (${this.maxIterations}) and tolerance (${this.tolerance.toString()})`,
    );
  }
}
