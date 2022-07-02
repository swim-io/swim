//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "./Equalize.sol";
import "./Invariant.sol";

library PoolMath {

function addRemove(
  bool isAdd,
  Equalized[] memory amounts,
  Equalized[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  Equalized lpTotalSupply
) internal pure returns (
  Equalized userLpAmount,
  Equalized governanceMintAmount
) {

}

function swap(
  bool isExactInput,
  Equalized[] memory amounts,
  uint8 index,
  Equalized[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  Equalized lpTotalSupply
) internal pure returns (
  Equalized userTokenAmount,
  Equalized governanceMintAmount
) {

}

function removeExactBurn(
  Equalized burnAmount,
  uint8 outputIndex,
  Equalized[] memory poolBalances,
  uint32 ampFactor,
  uint32 totalFee,
  uint32 governanceFee,
  Equalized lpTotalSupply
) internal pure returns (
  Equalized outputAmount,
  Equalized governanceMintAmount
) {

}

}
