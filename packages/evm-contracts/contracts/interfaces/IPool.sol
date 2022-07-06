// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
 * @title Pool contract
 *
 */

interface IPool {
  function swap(
    uint256 inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function getTokenCount() external returns (uint8 tokenCount);

  function getLiquidity() external returns (uint256 liquidity);
}
