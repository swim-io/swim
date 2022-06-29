//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

uint constant MAX_AMP = 10**6; //so MAX_AMP<<AMP_SHIFT requires 30 bits or less
uint constant AMP_SHIFT = 10; //number of bits ampFactor is shifted to the left
uint constant ONE_AMP_SHIFTED = 1 << AMP_SHIFT;

function ampDiv(uint val, uint ampFactor) pure returns (uint) { unchecked {
  return (val << AMP_SHIFT) / ampFactor;
}}
