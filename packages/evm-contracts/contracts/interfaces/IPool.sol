// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
  function getState() external view returns(PoolState memory state);

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
}
