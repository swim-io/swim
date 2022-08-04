//SPDX-License-Identifier: TODO
pragma solidity ^0.8.15;

import "./IPool.sol";

interface IRouting {
  error Routing__ErrorMessage(string message);
  error Routing__TokenNotRegistered(bytes20 addressOrTokenNumber);

  event TokenRegistered(uint16 indexed tokenId, address indexed tokenContract, address pool);

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

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount
  ) external payable returns (uint256 outputAmount);

  function swapAndTransfer(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner
  ) external payable returns (uint64 wormholeSequence);

  function receiveAndSwap(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount, address outpuToken);

  function receiveAndSwap(bytes memory encodedVm)
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
