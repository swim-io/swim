//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "./PoolErrors.sol";

library CenterAlignment {
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

uint constant BITS_PER_UINT = 256;
uint constant ALIGNMENT_SHIFT = BITS_PER_UINT/4; //=64
uint constant CENTERING_SHIFT = ALIGNMENT_SHIFT + ALIGNMENT_SHIFT/2; //=96
//shift right when greater than ALIGNMENT_UPPER_THRESHOLD
uint constant ALIGNMENT_UPPER_THRESHOLD = (1 << (ALIGNMENT_SHIFT*3)) - 1;
//shift left less than ALIGNMENT_LOWER_THRESHOLD
uint constant ALIGNMENT_LOWER_THRESHOLD = 1 << (ALIGNMENT_SHIFT*2);

function toAligned(uint val) internal pure returns (uint, int) {
  return (val << CENTERING_SHIFT, int(CENTERING_SHIFT));
}

function keepAligned(uint val, int shift)
  internal pure returns (uint, int) { unchecked {
  if (val > ALIGNMENT_UPPER_THRESHOLD) {
    //val has grown large enough to occupy space in the upper uint64
    // => shift down and decrease required right shift
    return (val >> ALIGNMENT_SHIFT, shift - int(ALIGNMENT_SHIFT));
  }
  if (val < ALIGNMENT_LOWER_THRESHOLD) {
    //val has shrunk so much that it doesn't occupy the upper half anymore
    // => shift up and increase required right shift
    return (val << ALIGNMENT_SHIFT, shift + int(ALIGNMENT_SHIFT));
  }
  return (val, shift);
}}

function fromAligned(uint val, int shift)
  internal pure returns (uint) { unchecked {
  if (shift < 0) {
    uint unshift = uint(-shift);
    //ensure we aren't overflowing on rightshift
    if (unshift >= BITS_PER_UINT || val >= (1<<(BITS_PER_UINT-unshift)))
      revert Invariant_NumericOverflow();
    return val << unshift;
  }
  //potentially underflowing to 0 is ok
  return val >> uint(shift);
}}
}
