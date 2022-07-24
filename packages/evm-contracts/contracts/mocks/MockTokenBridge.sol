// SPDX-License-Identifier: TODO

pragma solidity ^0.8.0;

import "../interfaces/ITokenBridge.sol";

contract MockTokenBridge is ITokenBridge {

   function transferTokensWithPayload(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint32 nonce,
    bytes memory payload
  ) public payable returns (uint64) {
    return 100;
  }

  function transferTokens(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint256 arbiterFee,
    uint32 nonce
  ) external payable returns (uint64 sequence) {
    return 64;
  }

  function completeTransferWithPayload(bytes memory encodedVm) external returns (bytes memory) {
    return hex"01020304";
  }

  function wrappedAsset(uint16 tokenChainId, bytes32 tokenAddress) external view returns (address) {
    return 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199;
  }

  function wormhole() external view returns (IWormhole) {
    address a = address(0xC89Ce4735882C9F0f0FE26686c53074E09B0D550);
    IWormhole _wormhole = IWormhole(a);
    return _wormhole;
  }

}
