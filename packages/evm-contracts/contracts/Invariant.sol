//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./Constants.sol";
import "./CenterAlignment.sol";
import "./Equalize.sol";

library Invariant {
  error UnknownBalanceTooLarge(uint unknownBalance);

  using CenterAlignment for uint;

  // RESTRICTIONS:
  // * Equalizeds use at most 61 bits (= ~18 digits).
  // * MAX_TOKEN_COUNT = 6 so that:
  //    * so TOKEN_COUNT+1 fits in 3 bits
  //    * sum of pool balances (and hence maximum depth) fits in 64 bits
  //      (depth is always less than or equal the sum of the pool balances)
  // * ampFactor fits within 30 bits (including decimals, i.e. AMP_SHIFT):
  //    * 2^20 = 1_048_576 ~= 10^6 so the max amp value of 1M fits in 20 bits
  //    * we use AMP_SHIFT = 10 bits for the fractional part (i.e. ~3 decimals)

  // General Considerations:
  //
  // uint    => 2^256 ~= 1.1 * 10^77
  // uint128 => 2^128 ~= 3.4 * 10^38
  // uint64  => 2^64  ~= 1.8 * 10^19
  //
  // We use a precision of 61 bits (18 digits, max value: 2^61 ~= 2.3 * 10^18)
  //  for all amounts (fixed point!). This is enough to accurately represent:
  //  * sensible USD amounts: Using 6 decimals for (sub)cents, this leaves us
  //                          with 12 digits, i.e. enough to represent $1T-1
  //                          999_999_999_999.000_000 USD => 18 digits
  //  * sensible ETH amounts: Using Gwei (10^9 Gwei = 1 ETH) as the base unit,
  //                          we can handle 1B-1 ETH (total supply: ~121M ETH)
  //                          999_999_999.000_000_000 ETH => 18 digits
  //  * arbitrary BTC amounts: 100M = 10^8 Satoshis = 1 BTC, 21M BTC = 2.1 * 10^7
  //                           hence can be at most 2.1 * 10^15 Satoshis
  //                           21_000_000.000_000_00 BTC => 16 digits
  //
  // By default, we're not using Solidity's built-in SafeMath (overflow and
  //  underflow protection) because it's expensive and we've done the numerics
  //  to ensure that all results (including intermediate results) will always
  //  stay within sensible bounds. Hence the pervasive use of unchecked blocks.

  // Some worst case analysis for calculateDepth and calculateUnknownBalance:
  //  (based on swim_invariant.py code)
  //
  //  Scenario 1: tokenCount = 6, ampFactor = 1, balances = [10^19] + [1]*5
  //   The most out of whack the pool can possibly be given our prerequisites.
  //   * calculateDepth
  //      calculateDepth requires 198 iterations to converge (so given that
  //       Python Decimals are slightly more accurate than uint, we would
  //       expect about ~200 iterations for EVM code).
  //      At their largest, variable's bit consumption is:
  //       * reciprocalDecay: 301 bits
  //       * numerator:       366 bits (+10 bits for AMP_SHIFT)
  //       * denominator:     303 bits (+10 bits for AMP_SHIFT)
  //       * depth:            63 bits
  //      And this does not include AMP_SHIFT (which would another 10 bits to
  //       numerator and denominator).
  //      Therefore, fromAlign() will fail to undo the alignment and hence revert
  //       to prevent overflow.
  //      For completeness sake: The actual/final depth value would be 1246115.3
  //   * calculateUnknownBalance
  //      calculateUnknownBalance for the first balance (numerically the worst
  //       case) requires 49 iterations to converge and would even stay within
  //       the required bit limits:
  //       * reciprocalDecay:  89 bits
  //       * numeratorFixed:  127 bits
  //       * denominatorFixed: 21 bits
  //       * numerator:       210 bits
  //       * denominator:     106 bits
  //       * unknownBalance:  105 bits
  //
  //  Hence our our main concern is calculateDepth.
  //
  //  Scenario 2: tokenCount = 6, ampFactor = 1, balances = [10^19] + [10^8]*5
  //   In this scenario, the pool is still comically out of whack with a
  //   difference of 11 orders of magnitudes between the balances.
  //   * calculateDepth
  //      calculateDepth now requires 113 iterations to converge.
  //      Largest bit consumption
  //       * reciprocalDecay: 168 bits
  //       * numerator:       233 bits (+10 bits for AMP_SHIFT)
  //       * denominator:     171 bits (+10 bits for AMP_SHIFT)
  //       * depth:            63 bits
  //      So even after taking AMP_SHIFT into account, we can now conveniently
  //       accommodate all intermediate results.
  //      depth value: 645422243910.3
  //
  //  So in conclusion, our math implementation in here will work just fine
  //   in all realistic and even some very unrealistic scenarios and is more
  //   robust than any of the other AMM stablecurve implementations out there
  //   which overflow a lot earlier, while also maintaining accuracy and keeping
  //   gas costs low.

  function sum(Equalized[] memory arr) internal pure returns (uint ret) { unchecked {
    for (uint i = 0; i < arr.length; ++i)
      ret += Equalized.unwrap(arr[i]);
  }}

  function absDiff(uint lhs, uint rhs) private pure returns (uint) { unchecked {
    return lhs > rhs ? lhs - rhs : rhs - lhs;
  }}

  function min(uint lhs, uint rhs) private pure returns (uint) {
    return lhs < rhs ? lhs : rhs;
  }

  function sqrt(uint radicand) private pure returns (uint) { unchecked {
    if (radicand == 0) {
      return 0;
    }

    uint msbHelper = radicand; //msb = most significant bit
    uint root = 1;
    if (msbHelper >> 128 > 0) {
      msbHelper >>= 128;
      root <<= 64;
    }
    if (msbHelper >> 64 > 0) {
      msbHelper >>= 64;
      root <<= 32;
    }
    if (msbHelper >> 32 > 0) {
      msbHelper >>= 32;
      root <<= 16;
    }
    if (msbHelper >> 16 > 0) {
      msbHelper >>= 16;
      root <<= 8;
    }
    if (msbHelper >> 8 > 0) {
      msbHelper >>= 8;
      root <<= 4;
    }
    if (msbHelper >> 4 > 0) {
      msbHelper >>= 4;
      root <<= 2;
    }
    if (msbHelper >> 2 > 0) {
      root <<= 1;
    }

    //We don't need to iterate Heron's method 7 times in most cases, but
    // keeping track of how many iterations are needed when determining
    // our initial guess (the most significant bit of the root) isn't just
    // more complicated, but also most likely less gas efficient overall.
    root = (root + radicand / root) >> 1;
    root = (root + radicand / root) >> 1;
    root = (root + radicand / root) >> 1;
    root = (root + radicand / root) >> 1;
    root = (root + radicand / root) >> 1;
    root = (root + radicand / root) >> 1;
    root = (root + radicand / root) >> 1;

    return min(root, radicand / root);
  }}

  function calculateUnknownBalance(
    Equalized[] memory knownBalances,
    uint depth,
    uint32 ampFactor, //contains implicit shift by AMP_SHIFT bits
    uint initialGuess
  ) internal pure returns (Equalized) { unchecked {
    //assumptions (already enforced elsewhere):
    // 1 <= knownBalances.length <= 5
    // ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && knownBalances.length == 1)
    // depth > 0

    uint unknownBalance;

    if (ampFactor == 0) {
      unknownBalance = depth * depth;
      unknownBalance /= Equalized.unwrap(knownBalances[0]);
      unknownBalance >>= 2; //= division by 4 but 2 gas cheaper
    }
    else {
      uint tokenCount = knownBalances.length + 1;
      (uint numeratorFixed, int shift) = (((depth * depth) << AMP_SHIFT) /
        (ampFactor * tokenCount)).toAligned();
      for (uint i = 0; i < knownBalances.length; ++i) {
        //shifts up by at most 64 bits:
        numeratorFixed *= depth;
        //shifts down by at most 64 bits:
        numeratorFixed /= Equalized.unwrap(knownBalances[i]) * tokenCount;
        (numeratorFixed, shift) = numeratorFixed.keepAligned(shift);
      }
      numeratorFixed = numeratorFixed.fromAligned(shift);

      uint denominatorFixed = sum(knownBalances) + ((depth << AMP_SHIFT) / ampFactor);

      unknownBalance = initialGuess != 0 ? initialGuess : depth / 2;
      uint previousUnknownBalance;
      do {
        previousUnknownBalance = unknownBalance;
        //Even in the most extreme case, i.e. tokenCount = 6, ampFactor = 1,
        // and balances perfectly extreme, the numerator will never exceed
        // 210 bits, and the denominator will
        //TODO
        // and unknown balance will never exceed 105 bits, hence this can never overflow.
        uint numerator = numeratorFixed + unknownBalance * unknownBalance;
        uint denominator = (denominatorFixed + unknownBalance * 2) - depth;
        //TODO should we use rounded div here? (via (num + denom/2)/denom)
        unknownBalance = numerator / denominator;
      } while (absDiff(previousUnknownBalance, unknownBalance) > 1);
    }

    //TODO test to ensure that this can never happen due to rounding
    require(unknownBalance > 0, "unknownBalance not higher then 0");

    //ensure that unknownBalance never blows up above the allowed maximum
    if (unknownBalance > Equalize.MAX_AMOUNT) revert UnknownBalanceTooLarge(unknownBalance);
    return Equalized.wrap(uint64(unknownBalance));
  }}

  function calculateDepth(
    Equalized[] memory poolBalances,
    uint32 ampFactor,
    uint initialGuess
  ) internal pure returns (uint depth) { unchecked {
    //assumptions (already enforced elsewhere):
    // 2 <= poolBalances.length <= 6
    // ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && poolBalances.length == 2)
    // 0 < poolBalances[i] < MAX_AMOUNT for all i

    if (ampFactor == 0) {
      depth = 4; //better precision by including the 4 in the subsequent sqrt
      depth *= Equalized.unwrap(poolBalances[0]);
      depth *= Equalized.unwrap(poolBalances[1]);
      depth = sqrt(depth);
    }
    else {
      uint tokenCount = poolBalances.length; //at most 3 bits
      uint poolBalanceSum = sum(poolBalances); //at most 64 bits
      uint numeratorFixedAmpUnits = poolBalanceSum * ampFactor; //at most 94 bits
      uint denominatorFixedAmpUnits = ampFactor - ONE_AMP_SHIFTED; //at most 30 bits
      depth = initialGuess != 0 ? initialGuess : poolBalanceSum; //at most 64 bits
      uint previousDepth;
      do {
        previousDepth = depth;

        (uint reciprocalDecay, int shift) = uint(1).toAligned();
        for (uint i = 0; i < tokenCount; ++i) {
          reciprocalDecay *= depth;
          reciprocalDecay /= Equalized.unwrap(poolBalances[i]) * tokenCount;
          (reciprocalDecay, shift) = reciprocalDecay.keepAligned(shift);
        }

        shift -= int(AMP_SHIFT);
        uint tmpReciprocalDecay = reciprocalDecay * tokenCount;

        (uint numRD, int numShift) = tmpReciprocalDecay.keepAligned(shift);
        numRD *= depth;

        uint denomRD = tmpReciprocalDecay + reciprocalDecay;
        if (shift != numShift)
          //shift can only be smaller
          denomRD <<= uint(numShift - shift); //now numRD and denomRD have the same shift

        uint numerator;
        uint denominator;
        if (shift < 256 - (64 + 31)) {
          shift = -shift;
          //instead of rightshifting numRD and denomRD (and sacrificing precision), we instead
          // leftshift our *FixedAmpUnits values
          numerator = numeratorFixedAmpUnits.fromAligned(shift) + numRD;
          denominator = denominatorFixedAmpUnits.fromAligned(shift) + denomRD;
        }
        else {
          numerator = numeratorFixedAmpUnits + numRD.fromAligned(shift);
          denominator = denominatorFixedAmpUnits + denomRD.fromAligned(shift);
        }

        depth = numerator / denominator; //TODO rounded div?
      } while (absDiff(previousDepth, depth) > 1);

      //TODO test to ensure that this can never happen, then remove
      require(depth > 0);
    }
  }}

  function calculateMarginalPrices(
    Equalized[] memory poolBalances,
    uint32 ampFactor,
    Equalized lpSupply
  ) internal pure returns (uint[] memory marginalPrices) { unchecked {
    uint tokenCount = poolBalances.length;
    marginalPrices = new uint[](tokenCount);

    if (ampFactor == 0) {
      // with x := poolBalances[0], y := poolBalances[1]
      // constant product invarant:   x*y = (depth/2)^2
      // hence:                     depth = 2 * sqrt(x*y)
      // derive by d/dx:       d depth/dx = 1/sqrt(x*y) * y
      // => marginalPrice(x) = y / sqrt(x*y) = 2*y / depth
      // or when priced in lpSupply: marginalPrice(x) = 2*y / lpSupply
      marginalPrices[0] = uint((2 * Equalized.unwrap(poolBalances[1]) * MARGINAL_PRICE_MULTIPLIER) /
        Equalized.unwrap(lpSupply));
      marginalPrices[1] = uint((2 * Equalized.unwrap(poolBalances[0]) * MARGINAL_PRICE_MULTIPLIER) /
        Equalized.unwrap(lpSupply));
    }
    else {
      uint depth = Invariant.calculateDepth(poolBalances, ampFactor, 0);
      (uint reciprocalDecay, int shift) = MARGINAL_PRICE_MULTIPLIER.toAligned();
      for (uint i = 0; i < tokenCount; ++i) {
        reciprocalDecay *= depth;
        reciprocalDecay /= Equalized.unwrap(poolBalances[i]) * tokenCount;
        (reciprocalDecay, shift) = reciprocalDecay.keepAligned(shift);
      }
      uint ampMinusOneShifted = (MARGINAL_PRICE_MULTIPLIER * (ampFactor - ONE_AMP_SHIFTED))
        .fromAligned(-shift + int(AMP_SHIFT));
      uint denominator =
        (ampMinusOneShifted + (tokenCount + 1) * reciprocalDecay) / MARGINAL_PRICE_MULTIPLIER;
      uint depthTimesDecay = depth * reciprocalDecay;
      uint numeratorAmp =
        (MARGINAL_PRICE_MULTIPLIER * ampFactor).fromAligned(-shift + int(AMP_SHIFT));
      for (uint i = 0; i < tokenCount; ++i) {
        //Even in the most extreme case of ampFactor = 10^6, balances = [1] + [10^19]*5
        // the marginal price of the first token is "only" 115495234916399450.4287... when priced
        // in depth, i.e. it fits in a uint128 when using 18 decimals.
        // (The reason that ampFactor = 10^6 gives a more extreme result than ampFactor = 1 is
        //  that (apparently) depth falls off more quickly for a smaller ampFactor than the
        //  marginal price increases. In terms of relative prices, a smaller ampFactor does
        //  indeed yield the most extreme result (namely, a marginal price of 8333333333333333333.5
        //  for the first, rare token when priced in any of the other, abundant tokens).)
        uint pricedInDepth =
          (numeratorAmp + depthTimesDecay / Equalized.unwrap(poolBalances[i])) / denominator;
        //overall, marginalPrices[i] is guaranteed to always be less than 10^(35+18)
        // (when taking the most extreme case of Equalized.unwrap(lpSupply) = 1)
        marginalPrices[i] = (pricedInDepth * depth) / Equalized.unwrap(lpSupply);
      }
    }
  }}
}
