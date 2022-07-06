// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRouting {
  struct TokenBalance {
    address tokenAddres;
    uint256 balance;
  }
  struct PoolDetails {
    address poolAddress;
    TokenBalance[] balances;
    uint256 totalLPSupply;
    uint256 ampFactor;
    uint256 fees;
  }
  error Routing__ErrorMessage(string message);
  error Routing__PoolNotRegistered(address poolAddress);
  error Routing__TokenTransferFailed(address sender, uint256 amount);
  error Routing__TokenTransferFromFailed(address sender, address receiver, uint256 amount);
  error Routing__TokenApprovalFailed(address spender, uint256 amount);

  event TokenRegistered(uint16 indexed tokenId, address indexed tokenContract, address chainPool);

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
    bytes32 toOwner
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

  function getPoolsDetails(address[] memory poolAddresses) external returns (PoolDetails[] memory);
}
