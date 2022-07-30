// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./IWormhole.sol";

interface ITokenBridge {
  function transferTokensWithPayload(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint32 nonce,
    bytes memory payload
  ) external payable returns (uint64);

  function transferTokens(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint256 arbiterFee,
    uint32 nonce
  ) external payable returns (uint64 sequence);

  function completeTransferWithPayload(bytes memory encodedVm) external returns (bytes memory);

  function wrappedAsset(uint16 tokenChainId, bytes32 tokenAddress) external view returns (address);

  function wormhole() external view returns (IWormhole);
}
