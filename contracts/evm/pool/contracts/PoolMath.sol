//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "./Equalized.sol";
import "./Invariant.sol";

library PoolMath {

function getDepth(
  EqualizedAmount[] memory poolBalances,
  uint32 ampFactor
) internal pure returns(uint) {
  return Invariant.calculateDepth(poolBalances, uint(ampFactor));
}

function addRemove(
  bool isAdd,
  EqualizedAmount[] memory amounts,
  EqualizedAmount[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  EqualizedAmount lpTotalSupply
) internal pure returns (
  EqualizedAmount userLpAmount,
  EqualizedAmount governanceLpFee
) {

}

function swap(
  bool isExactInput,
  EqualizedAmount[] memory amounts,
  uint8 index,
  EqualizedAmount[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  EqualizedAmount lpTotalSupply
) internal pure returns (
  EqualizedAmount userTokenAmount,
  EqualizedAmount governanceLpFee
) {

}

function removeExactBurn(
  EqualizedAmount burnAmounts,
  EqualizedAmount[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  EqualizedAmount lpTotalSupply
) internal pure returns (
  EqualizedAmount userLpAmount,
  EqualizedAmount governanceLpFee
) {

}

}
