//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./IPool.sol";

interface IRouting {
  error Routing__ErrorMessage(string message);
  error Routing__TokenNotRegistered(bytes20 addressOrTokenNumber);

  event TokenRegistered(uint16 indexed tokenId, address indexed tokenContract, address pool);

  event OnChainSwap(
    address to,
    address fromToken,
    address toToken,
    uint256 outputAmount,
    bytes16 indexed memo
  );

  event SwapAndTransfer(
    address from,
    uint64 wormholeSequence,
    address token,
    uint256 inputAmount,
    bytes16 indexed memo
  );

  event ReceiveAndSwap(
    address from,
    uint64 wormholeSequence,
    address token,
    uint256 amount,
    bytes16 indexed memo
  );

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) external payable returns (uint256 outputAmount);

  function swapAndTransfer(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bytes16 memo
  ) external payable returns (uint64 wormholeSequence);

  function receiveAndSwap(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) external returns (uint256 outputAmount, address outpuToken);

  function receiveAndSwap(bytes memory encodedVm, bytes16 memo)
    external
    returns (uint256 outputAmount, address outputToken);

  function registerToken(
    uint16 tokenNumber,
    address tokenAddress,
    address poolAddress,
    uint8 tokenIndexInPool
  ) external;

  function getPoolStates(address[] memory poolAddresses) external view returns (PoolState[] memory);

  function swimUsdAddress() external view returns (address);
}
