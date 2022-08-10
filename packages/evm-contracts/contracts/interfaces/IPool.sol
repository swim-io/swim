// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "../PoolErrors.sol";

struct TokenBalance {
  address tokenAddress;
  uint256 balance;
}

struct Decimal {
  uint256 value;
  uint8 decimals;
}

struct PoolState {
  bool paused;
  TokenBalance[] balances;
  TokenBalance totalLpSupply;
  Decimal ampFactor;
  Decimal lpFee;
  Decimal governanceFee;
}

interface IPool {
  event Add(
    uint256[] inputAmounts,
    uint256 minimumMintAmount,
    uint256 mintAmount,
    bytes16 indexed memo
  );
  event RemoveExactBurn(
    uint256 burnAmount,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount,
    uint256 outputAmount,
    bytes16 indexed memo
  );
  event RemoveExactOutput(
    uint256[] outputAmounts,
    uint256 maximumBurnAmount,
    uint256 burnAmount,
    bytes16 indexed memo
  );
  event RemoveUniform(
    uint256 burnAmount,
    uint256[] minimumOutputAmounts,
    uint256[] outputAmounts,
    bytes16 indexed memo
  );
  event Paused(bool paused);
  event TransferGovernance(address indexed newGovernance);
  event ChangeGovernanceFeeRecipient(address indexed governanceFeeRecepient);

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

  function add(
    uint256[] memory inputAmounts,
    uint256 minimumMintAmount,
    bytes16 memo
  ) external returns (uint256 mintAmount);

  function removeExactBurn(
    uint256 burnAmount,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) external returns (uint256 outputAmount);

  function removeExactOutput(
    uint256[] memory outputAmounts,
    uint256 maximumBurnAmount,
    bytes16 memo
  ) external returns (uint256 burnAmount);

  function removeUniform(
    uint256 burnAmount,
    uint256[] memory minimumOutputAmounts,
    bytes16 memo
  ) external returns (uint256[] memory outputAmounts);
}
