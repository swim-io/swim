// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface IRouting {
  function onChainSwap(
    address _fromToken,
    uint256 _inputAmount,
    address _toOwner,
    address _toToken,
    uint256 _minimumOutputAmount
  ) external returns (uint256 _outputAmount);

  function swapAndTransfer(
    address _fromToken,
    uint256 _inputAmount,
    uint256 _firstMinimumOutputAmount,
    uint16 _wormholeRecipientChain,
    bytes32 _toOwner,
    uint16 _toTokenId,
    uint256 _secondMinimumOutputAmount
  ) external payable returns (uint64 _wormholeSequence);

  function receiveAndOverride(
    bytes memory _encodedVm,
    address _toToken,
    uint256 _minimumOutputAmount
  ) external returns (uint256 _outputAmount);

  function receiveAndSwap(bytes memory _encodedVm) external returns (uint256 _outputAmount);

  function registerToken(
    uint16 _tokenId,
    address _tokenContract,
    address _chainPool,
    uint8 _tokenIndexInPool
  ) external;
}
