// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface IRouting {
  /**
   * @dev Emitted on registerToken()
   * @param tokenId The ID of registered token
   * @param tokenContract The registered token contract address
   **/
  event TokenRegistered(uint16 indexed tokenId, address indexed tokenContract, address chainPool);

  /**
   * @dev Emitted on onChainSwap()
   * @param fromToken The token address from which user swaps
   * @param toToken The token address to which user swaps
   * @param to The beneficiary of the supply, receiving the outputAmount
   * @param outputAmount The amount received after swap
   **/
  event OnChainSwap(
    address indexed to,
    address indexed fromToken,
    address indexed toToken,
    uint256 outputAmount
  );

  event SwapAndTransfer(
    address indexed from,
    uint64 wormholeSequence,
    address token,
    uint256 inputAmount
  );
  event ReceiveAndSwap(
    address indexed from,
    uint64 wormholeSequence,
    address token,
    uint256 amount
  );
  event ReceiveAndSwap2(
    address indexed from,
    uint64 wormholeSequence,
    address token,
    uint256 amount
  );

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function swapAndTransfer(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    uint16 toTokenId,
    uint256 secondMinimumOutputAmount
  ) external payable returns (uint64 wormholeSequence);

  function receiveAndSwap(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount, address outpuToken);

  function receiveAndSwap2(bytes memory encodedVm) external returns (uint256 outputAmount);

  function registerToken(
    uint16 tokenId,
    address tokenContract,
    address chainPool,
    uint8 tokenIndexInPool
  ) external;
}
