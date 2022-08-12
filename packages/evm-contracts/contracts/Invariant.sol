//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./Constants.sol";
import "./CenterAlignment.sol";
import "./Equalize.sol";

library Invariant {
  error UnknownBalanceTooLarge(uint256 unknownBalance);

  using CenterAlignment for uint256;

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
  //  Scenario 1: tokenCount=6, ampFactor=1, balances=[10^19] + [1]*5
  //   The most out of whack the pool can possibly be given our prerequisites.
  //   * calculateDepth
  //      calculateDepth requires 198 iterations to converge (so given that
  //       Python Decimals are slightly more accurate than uint256, we would
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
  //  Scenario 2: tokenCount=6, ampFactor=1, balances=[10^19] + [10^8]*5
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

  function sum(Equalized[] memory arr) internal pure returns (uint256 ret) {
    unchecked {
      for (uint256 i = 0; i < arr.length; ++i) {
        ret += Equalized.unwrap(arr[i]);
      }
    }
  }

  function absDiff(uint256 lhs, uint256 rhs) private pure returns (uint256) {
    unchecked {
      return lhs > rhs ? lhs - rhs : rhs - lhs;
    }
  }

  function min(uint256 lhs, uint256 rhs) private pure returns (uint256) {
    return lhs < rhs ? lhs : rhs;
  }

  function sqrt(uint256 radicand) private pure returns (uint256) {
    unchecked {
      if (radicand == 0) {
        return 0;
      }

      uint256 msbHelper = radicand; //msb = most significant bit
      uint256 root = 1;
      //TODO check if this can't be put in a loop and have solc unroll the loop
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

      //TODO also a prime candidate for loop unrolling
      //     in fact, we probably know how many iterations we'll need at most (we can keep count!)
      //     so we could just jump to the right number of leftover iterations...
      root = (root + radicand / root) >> 1;
      root = (root + radicand / root) >> 1;
      root = (root + radicand / root) >> 1;
      root = (root + radicand / root) >> 1;
      root = (root + radicand / root) >> 1;
      root = (root + radicand / root) >> 1;
      root = (root + radicand / root) >> 1;

      return min(root, radicand / root);
    }
  }

  function calculateUnknownBalance(
    Equalized[] memory knownBalances,
    uint256 depth,
    uint32 ampFactor, //contains implicit shift by AMP_SHIFT bits
    uint256 initialGuess
  ) internal pure returns (Equalized) {
    unchecked {
      //assumptions (already enforced elsewhere):
      // 1 <= knownBalances.length <= 5
      // ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && knownBalances.length == 1)
      // depth > 0

      uint256 unknownBalance;

      if (ampFactor == 0) {
        unknownBalance = depth * depth;
        unknownBalance /= Equalized.unwrap(knownBalances[0]);
        unknownBalance >>= 2; //= division by 4 but 2 gas cheaper
      } else {
        uint256 tokenCount = knownBalances.length + 1;
        (uint256 numeratorFixed, int256 shift) = (((depth * depth) << AMP_SHIFT) /
          (ampFactor * tokenCount)).toAligned();
        for (uint256 i = 0; i < knownBalances.length; ++i) {
          //shifts up by at most 64 bits:
          numeratorFixed *= depth;
          //shifts down by at most 64 bits:
          numeratorFixed /= Equalized.unwrap(knownBalances[i]) * tokenCount;
          (numeratorFixed, shift) = numeratorFixed.keepAligned(shift);
        }
        numeratorFixed = numeratorFixed.fromAligned(shift);

        uint256 denominatorFixed = sum(knownBalances) + ((depth << AMP_SHIFT) / ampFactor);

        unknownBalance = initialGuess != 0 ? initialGuess : depth / 2;
        uint256 previousUnknownBalance;
        do {
          previousUnknownBalance = unknownBalance;
          //Even in the most extreme case, i.e. tokenCount = 6, ampFactor = 1,
          // and balances perfectly extreme, the numerator will never exceed
          // 210 bits, and the  denominator will
          // and unknown balance will never exceed 105 bits, hence this can never overflow.
          uint256 numerator = numeratorFixed + unknownBalance * unknownBalance;
          uint256 denominator = (denominatorFixed + unknownBalance * 2) - depth;
          //TODO should we use rounded div here? (via (num + denom/2)/denom)
          unknownBalance = numerator / denominator;
        } while (absDiff(previousUnknownBalance, unknownBalance) > 1);
      }

      //TODO test to ensure that this can never happen due to rounding
      require(unknownBalance > 0, "unknownBalance not higher then 0");

      //ensure that unknownBalance never blows up above the allowed maximum
      if (unknownBalance > Equalize.MAX_AMOUNT)
        revert UnknownBalanceTooLarge(unknownBalance);
      return Equalized.wrap(uint64(unknownBalance));
    }
  }

  function calculateDepth(
    Equalized[] memory poolBalances,
    uint32 ampFactor,
    uint256 initialGuess
  ) internal pure returns (uint256 depth) {
    unchecked {
      //assumptions (already enforced elsewhere):
      // 2 <= poolBalances.length <= 6
      // ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && poolBalances.length == 2)
      // 0 < poolBalances[i] < MAX_AMOUNT for all i

      if (ampFactor == 0) {
        depth = 4; //better precision by including the 4 in the subsequent sqrt
        depth *= Equalized.unwrap(poolBalances[0]);
        depth *= Equalized.unwrap(poolBalances[1]);
        depth = sqrt(depth);
        return depth;
      }

      uint256 tokenCount = poolBalances.length; //at most 3 bits
      uint256 poolBalanceSum = sum(poolBalances); //at most 64 bits
      uint256 numeratorFixedAmpUnits = poolBalanceSum * ampFactor; //at most 94 bits
      uint256 denominatorFixedAmpUnits = ampFactor - ONE_AMP_SHIFTED; //at most 30 bits
      depth = initialGuess != 0 ? initialGuess : poolBalanceSum; //at most 64 bits
      uint256 previousDepth;
      do {
        previousDepth = depth;

        (uint256 reciprocalDecay, int256 shift) = uint256(1).toAligned();
        for (uint256 i = 0; i < tokenCount; ++i) {
          reciprocalDecay *= depth;
          reciprocalDecay /= Equalized.unwrap(poolBalances[i]) * tokenCount;
          (reciprocalDecay, shift) = reciprocalDecay.keepAligned(shift);
        }

        shift -= int256(AMP_SHIFT);
        uint256 tmpReciprocalDecay = reciprocalDecay * tokenCount;

        (uint256 numRD, int256 numShift) = tmpReciprocalDecay.keepAligned(shift);
        numRD *= depth;

        uint256 denomRD = tmpReciprocalDecay + reciprocalDecay;
        if (shift != numShift)
          //shift can only be smaller
          denomRD <<= uint256(numShift - shift); //now numRD and denomRD have the same shift

        uint256 numerator;
        uint256 denominator;
        if (shift < 256 - (64 + 31)) {
          shift = -shift;
          //instead of rightshifting numRD and denomRD (and sacrificing precision), we instead
          // leftshift our *FixedAmpUnits values
          numerator = numeratorFixedAmpUnits.fromAligned(shift) + numRD;
          denominator = denominatorFixedAmpUnits.fromAligned(shift) + denomRD;
        } else {
          numerator = numeratorFixedAmpUnits + numRD.fromAligned(shift);
          denominator = denominatorFixedAmpUnits + denomRD.fromAligned(shift);
        }

        depth = numerator / denominator; //TODO rounded div?
      } while (absDiff(previousDepth, depth) > 1);

      //TODO test to ensure that this can never happen
      require(depth > 0, "depth not higher then 0");

      return depth;
    }
  }

  function marginalPrices(
    Equalized[] memory poolBalances,
    uint32 ampFactor,
    Equalized lpSupply
  ) internal pure returns (uint256[] memory) {
    unchecked {
      uint256 tokenCount = poolBalances.length;
      uint256[] memory prices = new uint256[](tokenCount);

      if (ampFactor == 0) {
        // with x := poolBalances[0], y := poolBalances[1]
        // constant product invarant:   x*y = (depth/2)^2
        // hence:                     depth = 2 * sqrt(x*y)
        // derive by d/dx:       d depth/dx = 1/sqrt(x*y) * y
        // => marginalPrice(x) = y / sqrt(x*y) = y / (2*depth)
        // or when priced in lpSupply: marginalPrice(x) = y / (2*lpSupply)
        prices[0] =
          (Equalized.unwrap(poolBalances[1]) * (MARGINAL_PRICE_MULTIPLIER / 2)) /
          Equalized.unwrap(lpSupply);
        prices[1] =
          (Equalized.unwrap(poolBalances[0]) * (MARGINAL_PRICE_MULTIPLIER / 2)) /
          Equalized.unwrap(lpSupply);
        return prices;
      }

      uint256 depth = Invariant.calculateDepth(poolBalances, ampFactor, 0);
      (uint256 reciprocalDecay, int256 shift) = MARGINAL_PRICE_MULTIPLIER.toAligned();
      for (uint256 i = 0; i < tokenCount; ++i) {
        reciprocalDecay *= depth;
        reciprocalDecay /= Equalized.unwrap(poolBalances[i]) * tokenCount;
        (reciprocalDecay, shift) = reciprocalDecay.keepAligned(shift);
      }
      uint256 ampMinusOneShifted = (MARGINAL_PRICE_MULTIPLIER * (ampFactor - ONE_AMP_SHIFTED))
        .fromAligned(-shift + int256(AMP_SHIFT));
      uint256 denominator = (ampMinusOneShifted + (tokenCount + 1) * reciprocalDecay) / 1e18;
      uint256 depthTimesDecay = depth * reciprocalDecay;
      uint256 numeratorAmp = (MARGINAL_PRICE_MULTIPLIER * ampFactor).fromAligned(
        -shift + int256(AMP_SHIFT)
      );
      for (uint256 i = 0; i < tokenCount; ++i)
        prices[i] =
          (numeratorAmp + depthTimesDecay / Equalized.unwrap(poolBalances[i])) /
          denominator;

      return prices;
    }
  }
}
