// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract MockRoutingForPoolTests is Initializable, UUPSUpgradeable {
  event TokenRegistered(uint16 indexed tokenNumber, address indexed token, address pool);

  address public /*immutable*/ swimUsdAddress;

  function initialize(address _swimUsdAddress) public initializer {
    swimUsdAddress = _swimUsdAddress;
  }

  function _authorizeUpgrade(address newImplementation) internal override {}

  function registerToken(
    uint16 tokenNumber,
    address tokenAddress,
    address poolAddress,
    uint8 //tokenIndexInPool
  ) external {
    emit TokenRegistered(tokenNumber, tokenAddress, poolAddress);
  }

}
