// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.15;

import "../interfaces/IUniswapV3Pool.sol";

contract MockUniswapV3Pool is IUniswapV3Pool {
  address public token0;
  address public token1;
  uint160 public sqrtPrice;

  constructor(address _token0, address _token1, uint160 _sqrtPrice) {
    token0 = _token0;
    token1 = _token1;
    sqrtPrice = _sqrtPrice;
  }

  function slot0() external view returns (
    uint160 sqrtPriceX96,
    int24 tick,
    uint16 observationIndex,
    uint16 observationCardinality,
    uint16 observationCardinalityNext,
    uint8 feeProtocol,
    bool unlocked
  ) {
    sqrtPriceX96 = sqrtPrice;
    tick = 0;
    observationIndex = 0;
    observationCardinality = 0;
    observationCardinalityNext = 0;
    feeProtocol = 0;
    unlocked = true;
  }
}
