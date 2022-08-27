// SPDX-License-Identifier: TODO

pragma solidity ^0.8.15;

import "../interfaces/ITokenBridge.sol";

contract MockTokenBridge is ITokenBridge {
  IWormhole constant WOMRHOLE = IWormhole(address(0xC89Ce4735882C9F0f0FE26686c53074E09B0D550));
  address public swimUSD;

  constructor(address _swimUSD) {
    swimUSD = _swimUSD;
  }

  function transferTokensWithPayload(
    address /*token*/,
    uint256 /*amount*/,
    uint16 /*recipientChain*/,
    bytes32 /*recipient*/,
    uint32 /*nonce*/,
    bytes memory /*payload*/
  ) public payable returns (uint64) {
    return 100;
  }

  function transferTokens(
    address /*token*/,
    uint256 /*amount*/,
    uint16 /*recipientChain*/,
    bytes32 /*recipient*/,
    uint256 /*arbiterFee*/,
    uint32 /*nonce*/
  ) external payable returns (uint64 sequence) {
    return 64;
  }

  function completeTransferWithPayload(bytes memory /*encodedVm*/) external pure returns (bytes memory) {
    return hex"01020304";
  }

  function wrappedAsset(uint16 /*tokenChainId*/, bytes32 /*tokenAddress*/) external view returns (address) {
    return swimUSD;
  }

  function wormhole() external pure returns (IWormhole) {
    return WOMRHOLE;
  }

  function attestToken(address /*tokenAddress*/, uint32 /*nonce*/) external payable returns (uint64 sequence) {
    return 1;
  }

  function createWrapped(bytes memory /*encodedVm*/) external returns (address token) {
    return swimUSD;
  }
}
