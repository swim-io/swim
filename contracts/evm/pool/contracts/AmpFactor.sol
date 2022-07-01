//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

uint constant AMP_SHIFT = 10; //number of bits ampFactor is shifted to the left
uint constant ONE_AMP_SHIFTED = 1 << AMP_SHIFT;
uint32 constant MAX_AMP_FACTOR = 10**6; //so MAX_AMP_FACTOR<<AMP_SHIFT requires 30 bits or less

function ampDiv(uint val, uint ampFactor) pure returns (uint) { unchecked {
  return (val << AMP_SHIFT) / ampFactor;
}}
