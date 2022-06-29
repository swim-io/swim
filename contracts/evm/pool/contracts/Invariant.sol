//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "./AmpFactor.sol";
import "./CenterAlignment.sol";

// RESTRICTIONS:
// * Amounts are assumed to consume at most 61 bits (~18 digits)
// * MAX_TOKEN_COUNT = 6 so that:
//    * so TOKEN_COUNT+1 fits in 3 bits
//    * sum of pool balances (and hence maximum depth) fits in 64 bits
//      (depth is always less than or equal the sum of the pool balances)
// * ampFactor fits within 30 bits (including decimals):
//    * 2^20 = 1_048_576 ~= 10^6 so the max amp value of 1M fits in 20 bits
//    * we use 10 bits for the fractional part (i.e. ~3 decimals)
//    * see AMP_SHIFT constant

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
// We won't be using datatypes other than uint (=uint256) even if fewer bits
//  were sufficient to hold all possible values because of the extra gas cost
//  that's imposed by Solidity (enforces wrapping behavior for overflows in
//  unchecked mode).
//
// Similarly, we're not using Solidity's built-in SafeMath (overflow and
//  underflow checking) because it's expensive and the juice isn't worth the
//  squeeze (hence the pervasive use of unchecked blocks).

library Invariant {
using CenterAlignment for uint;

uint public constant MAX_AMOUNT = (1<<61)-1; //pool math supports amounts up to 61 bits

function sum(uint[] memory arr) private pure returns (uint ret) { unchecked {
  for (uint i = 0; i < arr.length; ++i) {
    ret += arr[i];
  }
}}

function absDiff(uint lhs, uint rhs) private pure returns (uint) { unchecked {
  return lhs > rhs ? lhs-rhs : rhs-lhs;
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
}}

// Some worst case analysis for calculateDepth and calculateUnknownBalance:
//  Based on swim_invariant.py code
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
//  Hence our our main concern is calculateDepth
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
//  So in conclusion, our math implementation in here will

function calculateUnknownBalance(
  uint[] memory knownBalances,
  uint depth,
  uint ampFactor //contains implicit shift by AMP_SHIFT bits
) private pure returns (uint) { unchecked {
  //assumptions (already enforce elsewhere):
  // 1 <= knownBalances.length <= 5
  // ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && knownBalances.length == 1)
  // 0 < knownBalances[i] <= MAX_AMOUNT for all i
  // depth > 0

  if (ampFactor == 0) {
    return (depth * depth) / (knownBalances[0] * 4);
  }

  (uint numeratorFixed, int shift) = depth.toAligned();
  for (uint256 i = 0; i < knownBalances.length; ++i) {
    //shifts up by at most 64 bits:
    numeratorFixed *= depth;
    //shifts down by at most 64 bits:
    numeratorFixed /= knownBalances[i] * knownBalances.length;
    (numeratorFixed, shift) = numeratorFixed.keepAligned(shift);
  }
  numeratorFixed *= depth;
  (numeratorFixed, shift) = numeratorFixed.keepAligned(shift);
  numeratorFixed = numeratorFixed.fromAligned(shift);
  numeratorFixed = ampDiv(numeratorFixed, ampFactor * knownBalances.length);

  uint denominatorFixed = sum(knownBalances) + ampDiv(depth, ampFactor);

  uint unknownBalance = depth / 2;
  uint previousUnknownBalance;
  do {
    previousUnknownBalance = unknownBalance;
    //Even in the most extreme case, i.e. tokenCount = 6, ampFactor = 1, balances
    // perfectly extreme, numerator will never exceed 210 bits, denominator will
    // and unknown balance will never exceed 105 bits, hence this can never overflow.
    uint numerator = numeratorFixed + unknownBalance * unknownBalance;
    uint denominator = (denominatorFixed + unknownBalance * 2) - depth;
    //TODO should we use rounded div here? (via (num + denom/2)/denom)
    unknownBalance = numerator / denominator;
  } while (absDiff(previousUnknownBalance, unknownBalance) > 1);

  require(unknownBalance > 0); //TODO test to ensure that this can never happen due to rounding

  return unknownBalance;
}}

function calculateDepth(
  uint[] memory poolBalances,
  uint ampFactor
) private pure returns (uint) { unchecked {
  //assumptions (already enforce elsewhere):
  // 2 <= poolBalances.length <= 6
  // ampFactor >= ONE_AMP_SHIFTED || (ampFactor == 0 && poolBalances.length == 2)
  // 0 < poolBalances[i] <= MAX_AMOUNT for all i

  if (ampFactor == 0) {
    return sqrt(poolBalances[0] * poolBalances[1] * 4);
  }

  uint tokenCount = poolBalances.length; //at most 3 bits
  uint poolBalanceSum = sum(poolBalances); //at most 64 bits
  uint numeratorFixedAmpUnits = poolBalanceSum * ampFactor; //at most 94 bits
  uint denominatorFixedAmpUnits = ampFactor - ONE_AMP_SHIFTED; //at most 30 bits
  uint depth = poolBalanceSum; //at most 64 bits
  uint previousDepth;
  do {
    previousDepth = depth;

    (uint reciprocalDecay, int shift) = uint(1).toAligned();
    for (uint i = 0; i < tokenCount; ++i) {
      reciprocalDecay *= depth;
      reciprocalDecay /= poolBalances[i] * tokenCount;
      (reciprocalDecay, shift) = reciprocalDecay.keepAligned(shift);
    }

    //We keep the AMP_SHIFT so we can just add our FixedAmpUnits variables.
    //By always keeping AMP_SHIFT, independent of whether reciprocalDecay
    // is very large or very small, we actually give up on AMP_SHIFT number
    // of bits that we could use to support larger reciprocalDecay results
    // (i.e. pools that are very out of whack with several large balances
    // and one very small balance).
    //Not relevant in practice though (see numbers above), so better to just
    // save the gas and associated code complexity.
    shift -= int(AMP_SHIFT);
    uint tmpReciprocalDecay = reciprocalDecay * tokenCount;

    (uint numRD, int numShift) = tmpReciprocalDecay.keepAligned(shift);
    numRD *= depth;
    numRD = numRD.fromAligned(numShift);

    uint denomRD = tmpReciprocalDecay + reciprocalDecay;
    denomRD = denomRD.fromAligned(shift);

    uint numerator = numeratorFixedAmpUnits + numRD; //TODO can overflow!
    uint denominator = denominatorFixedAmpUnits + denomRD; //TODO can overflow!
    depth = numerator / denominator; //TODO rounded div?
  } while (absDiff(previousDepth, depth) > 1);

  require(depth > 0); //TODO test to ensure that this can never happen

  return depth;
}}

}
