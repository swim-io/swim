// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

/*
 * @title FlagshipPool contract
 *
 */

interface IFlagshipPool {
  function swap(
    uint256[] memory _amounts,
    uint8 _outputTokenIndex,
    uint256 _minimumOutputAmount
  ) external returns (uint256 _receivedSwimUSDAmount);
}
