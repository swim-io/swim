// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./Decimal.sol";

struct TokenBalance {
  address tokenAddress;
  uint balance;
}

struct PoolState {
  bool paused;
  TokenBalance[] balances;
  TokenBalance totalLpSupply;
  Decimal ampFactor;
  Decimal lpFee;
  Decimal governanceFee;
}
