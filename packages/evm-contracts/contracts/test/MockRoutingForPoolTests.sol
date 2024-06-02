// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract MockRoutingForPoolTests is Initializable, UUPSUpgradeable {
  address public /*immutable*/ swimUsdAddress;

  struct TokenInfo {
    uint16  tokenNumber;
    address tokenAddress;
    address poolAddress;
    uint8   tokenIndexInPool;
  }

  mapping(uint16  => TokenInfo) public tokenNumberMapping;

  function initialize(address _swimUsdAddress) public initializer {
    swimUsdAddress = _swimUsdAddress;
  }

  function _authorizeUpgrade(address newImplementation) internal override {}

  function registerToken(uint16 tokenNumber, address tokenAddress, address poolAddress) external {
    TokenInfo storage token = tokenNumberMapping[tokenNumber];
    token.tokenNumber = tokenNumber;
    token.tokenAddress = tokenAddress;
    token.poolAddress = poolAddress;
    token.tokenIndexInPool = 1;
  }
}
