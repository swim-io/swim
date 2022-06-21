// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

/*
 * @title MetaPool contract
 *
 */

interface IMetaPool {
  function swapExactInput(
    uint8 fromToken,
    uint8 tokenIndex,
    uint256 minOutputAmount
  ) external returns (uint256 outputAmount);
}
