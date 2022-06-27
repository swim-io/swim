//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

// RESTRICTIONS:
// * Amounts are assumed to consume at most 60 bits (18 digits)
// * max token count = 6 so that:
//    * so TOKEN_COUNT+1 fits in 3 bits
//    * sum of pool balances (and hence maximum depth) fits in 64 bits
//      (in fact the sum of the pool balances it will at most take up 63 bits
//       and depth is always less than or equal the sum of the pool balances)
// * ampFactor fits within 30 bits (including decimals):
//    * 2^20 = 1_048_576 ~= 10**6 so the max amp value of 1M fits in 20 bits
//    * we use 10 bits for the fractional part (i.e. ~3 decimals)
//    * see ampShift constant

// General Considerations:
//
// uint    => 2^256 ~= 1.1 * 10^77
// uint128 => 2^128 ~= 3.4 * 10^38
// uint64  => 2^64  ~= 1.8 * 10^19
//
// We use a precision of 18 digits (60 bits) for all amounts (fixed point!)
// This is enough to accurately represent:
//  * sensible USD amounts: Using 6 decimals for (sub)cents, this leaves us
//                          with 12 digits, i.e. enough to represent $1T-1
//                          999_999_999_999.000_000 USD => 18 digits
//  * sensible ETH amounts: Using Gwei (10**9 Gwei = 1 ETH) as the base unit,
//                          we can handle 1B-1 ETH (total supply: ~121M ETH)
//                          999_999_999.000_000_000 ETH => 18 digits
//  * arbitrary BTC amounts: 100M = 10**8 Satoshis = 1 BTC, 21M BTC = 2.1 * 10**7
//                           hence can be at most 2.1 * 10**15 Satoshis
//                           21_000_000.000_000_00 BTC => 16 digits
//
// We won't be using datatypes other than uint (=uint256) because of the extra
//  gas cost that's imposed by Solidity.
//
// Similarly, we're not using Solidity's built-in SafeMath (overflow and
//  underflow checking) because it's expensive and the juice isn't worth the
//  squeeze (hence the pervasive use of unchecked blocks).

function sum(uint[] memory arr) pure returns (uint ret) { unchecked {
  for (uint i = 0; i < arr.length; ++i) {
    ret += arr[i];
  }
}}

function absDiff(uint lhs, uint rhs) pure returns (uint) { unchecked {
  return lhs > rhs ? lhs-rhs : rhs-lhs;
}}

function min(uint lhs, uint rhs) pure returns (uint) {
  return lhs < rhs ? lhs : rhs;
}

function sqrt(uint radicand) pure returns (uint) { unchecked {
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


// In the following constants and functions we think of a built-in uint
//  as an array an array of 4 uint64, i.e. uint64[4] and use this to keep a
//  block of 64 significant bits "center-aligned" i.e. within the bounds of the
//  second and third uint64 (i.e. in the middle 128 bits), or in other words,
//  out of the lower and upper 64 bits.
//  This way we can always safely multiply or divide with an arbitrary uint64
//  value without losing any significant bits, hence always holding on to full
//  precision of our full 64 bit value, without having to constantly adjust the
//  alignment i.e. shift up or shift down.
//
// The shift parameter tracks how far val needs to be RIGHT shifted to deflate
//  val back to its original/base alignment (after we originally inflating it
//  by center shifting it.)
//
// The general use is
uint constant uintBits = 256;
uint constant uint64PerUint = 4;
uint constant alignmentShift = uintBits/uint64PerUint; //=64
uint constant centeringShift = alignmentShift + alignmentShift/2; //=96
uint constant upperThresholdShift = alignmentShift*3; //192
uint constant lowerThresholdShift = alignmentShift*2; //128
uint constant valUpperThreshold = (1 << (upperThresholdShift)) - 1; //realign when gt
uint constant valLowerThreshold = 1 << (lowerThresholdShift); //realign when lt

function toCenterAligned(uint val) pure returns (uint, int) {
  return (val << centeringShift, int(centeringShift));
}

function keepCenterAligned(uint val, int shift) pure returns (uint, int) { unchecked {
  if (val > valUpperThreshold) {
    //val has grown large enough to occupy space in the upper uint64
    // => shift down and decrease required right shift
    return (val >> alignmentShift, shift - int(alignmentShift));
  }
  if (val < valLowerThreshold) {
    //val has shrunk so much that it doesn't occupy the upper half anymore
    // => shift up and increase required right shift
    return (val << alignmentShift, shift + int(alignmentShift));
  }
  return (val, shift);
}}

function fromCenterAligned(uint val, int shift) pure returns (uint) { unchecked {
  if (shift < 0) {
    uint unshift = uint(-shift);
    require(unshift < uintBits && val < (1<<(uintBits-unshift)));
    return val << unshift;
  }
  return val >> uint(shift);
}}

uint constant ampShift = 10; //number of bits ampFactor is shifted to the left
function ampDiv(uint val, uint ampFactor) pure returns (uint) { unchecked {
  return (val << ampShift) / ampFactor;
}}

function calculateUnknownBalance(
  uint[] memory knownBalances,
  uint depth,
  uint ampFactor //contains implicit shift by ampShift bits
) pure returns (uint) { unchecked {
  if (ampFactor == 0) {
    // ONLY VALID FOR TOKEN_COUNT == 2 !!!
    return (depth * depth) / (knownBalances[0] * 4);
  }

  (uint numeratorFixed, int shift) = toCenterAligned(depth);
  for (uint256 i = 0; i < knownBalances.length; ++i) {
    //shifts up by at most 63 bits:
    numeratorFixed *= depth;
    //shifts down by at most 63 bits:
    numeratorFixed /= knownBalances[i] * knownBalances.length;
    (numeratorFixed, shift) = keepCenterAligned(numeratorFixed, shift);
  }
  numeratorFixed *= depth;
  (numeratorFixed, shift) = keepCenterAligned(numeratorFixed, shift);
  numeratorFixed = fromCenterAligned(numeratorFixed, shift);
  numeratorFixed = ampDiv(numeratorFixed, ampFactor * knownBalances.length);

  uint denominatorFixed = sum(knownBalances) + ampDiv(depth, ampFactor);

  uint unknownBalance = depth / 2;
  uint previousUnknownBalance;
  do {
    previousUnknownBalance = unknownBalance;
    uint numerator = numeratorFixed + unknownBalance * unknownBalance;
    uint denominator = (denominatorFixed + unknownBalance * 2) - depth;
    //TODO should we use rounded div here? (via (num + denom/2)/denom)
    unknownBalance = numerator / denominator;
  } while (absDiff(previousUnknownBalance, unknownBalance) > 1);

  require(unknownBalance > 0); //TODO test to ensure that this can never happen

  return unknownBalance;
}}

function calculateDepth(
  uint[] memory poolBalances,
  uint ampFactor
) pure returns (uint) { unchecked {
  if (ampFactor == 0) {
    // ONLY VALID FOR TOKEN_COUNT == 2 !!!
    //TODO check that solc replaces *4 with left shift
    return sqrt(poolBalances[0] * poolBalances[1] * 4);
  }

  uint tokenCount = poolBalances.length; //at most 3 bits
  uint poolBalanceSum = sum(poolBalances); //at most 63 bits
  uint numeratorFixedAmpUnits = poolBalanceSum * ampFactor; //at most 93 bits
  uint denominatorFixedAmpUnits = ampFactor - (1 << ampShift); //at most 30 bits
  uint depth = poolBalanceSum; //at most 63 bits
  uint previousDepth;
  do {
    previousDepth = depth;

    (uint reciprocalDecay, int shift) = toCenterAligned(1);
    for (uint i = 0; i < tokenCount; ++i) {
      reciprocalDecay *= depth;
      reciprocalDecay /= poolBalances[i] * tokenCount;
      (reciprocalDecay, shift) = keepCenterAligned(reciprocalDecay, shift);
    }

    //We keep the ampShift so we can just add our FixedAmpUnits variables.
    //By always keeping ampShift, independent of whether reciprocalDecay
    // is very large or very small, we actually give up on ampShift number
    // of bits that we could use to support larger reciprocalDecay results
    // (i.e. pools that are very out of whack with several large balances
    // and one very small balance).
    //Probably not relevant in practice though and better to just save the
    // gas and associated code complexity.
    shift -= int(ampShift);
    uint tmpReciprocalDecay = reciprocalDecay * tokenCount;

    (uint numRD, int numShift) = keepCenterAligned(tmpReciprocalDecay, shift);
    numRD *= depth;
    numRD = fromCenterAligned(numRD, numShift);

    uint denomRD = tmpReciprocalDecay + reciprocalDecay;
    denomRD = fromCenterAligned(denomRD, shift);

    uint numerator = numeratorFixedAmpUnits + numRD;
    uint denominator = denominatorFixedAmpUnits + denomRD;
    depth = numerator / denominator; //TODO rounded div?
  } while (absDiff(previousDepth, depth) > 1);

  require(depth > 0); //TODO test to ensure that this can never happen

  return depth;
}}
