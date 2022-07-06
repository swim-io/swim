// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IPool {
  function swap(
    uint256 inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function swapExactOutput(
    uint maximumInputAmount,
    uint8 inputTokenIndex,
    uint[] memory outputAmounts
  ) external returns(uint inputAmount);

  function swapExactInput(
    uint[] memory inputAmounts,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external returns(uint outputAmount);

  function removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external returns(uint outputAmount);

  function removeExactOutput(
    uint[] memory outputAmounts,
    uint maximumBurnAmount
  ) external returns(uint burnAmount);

  function add(
    uint[] memory inputAmounts,
    uint minimumMintAmount
  ) external returns(uint mintAmount);

  function removeUniform(uint burnAmount, uint[] memory minimumOutputAmounts)
    external returns(uint[] memory outputAmounts);

  function getTokenCount() external returns (uint8 tokenCount);

  function getLiquidity() external returns (uint256 liquidity);
}
