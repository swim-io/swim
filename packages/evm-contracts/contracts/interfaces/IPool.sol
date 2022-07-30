// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../PoolErrors.sol";

struct TokenBalance {
  address tokenAddres;
  uint256 balance;
}

struct Decimal {
  uint256 value;
  uint8 decimals;
}

struct PoolState {
  bool paused;
  TokenBalance[] balances;
  TokenBalance totalLPSupply;
  Decimal ampFactor;
  Decimal lpFee;
  Decimal governanceFee;
}

interface IPool {
  function getState() external view returns (PoolState memory state);

  function swap(
    uint256 inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function swapExactOutput(
    uint256 maximumInputAmount,
    uint8 inputTokenIndex,
    uint256[] memory outputAmounts
  ) external returns (uint256 inputAmount);

  function swapExactInput(
    uint256[] memory inputAmounts,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function removeExactBurn(
    uint256 burnAmount,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function removeExactOutput(uint256[] memory outputAmounts, uint256 maximumBurnAmount)
    external
    returns (uint256 burnAmount);

  function add(uint256[] memory inputAmounts, uint256 minimumMintAmount)
    external
    returns (uint256 mintAmount);

  function removeUniform(uint256 burnAmount, uint256[] memory minimumOutputAmounts)
    external
    returns (uint256[] memory outputAmounts);
}
