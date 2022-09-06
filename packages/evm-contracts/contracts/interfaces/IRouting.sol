//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./ISwimInteractor.sol";
import "./IPool.sol";

interface IRouting is ISwimInteractor {
  event TokenRegistered(uint16 indexed tokenId, address indexed tokenContract, address pool);

  error SwimUsdNotAttested();
  error TokenMismatch(address passedToken, address poolToken);
  error SenderIsNotOwner(address sender, address owner);
  error TokenNotRegistered(bytes20 addressOrTokenNumber);
  error WormholeInteractionFailed(bytes lowLevelData);
  error TooSmallForPropeller(uint256 swimUsdAmount, uint256 propellerMinimumThreshold);
  error MemoContradiction(bytes16 passedMemo, bytes16 payloadMemo);
  error IncorrectMessageValue(uint256 value, uint256 expected);
  error GasKickstartFailed(address owner);
  error InvalidWormholeToken(
    bytes32 originAddress,
    uint16 originChain,
    bytes32 expectedToken,
    uint16 expectedChain
  );

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) external returns (uint256 outputAmount);

  function crossChainOut(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner
  ) external payable returns (uint256 swimUsdAmount, uint64 wormholeSequence);

  function crossChainOut(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bytes16 memo
  ) external payable returns (uint256 swimUsdAmount, uint64 wormholeSequence);

  function propellerOut(
    address fromToken,
    uint256 inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickStart,
    uint16 toTokenNumber
  ) external payable returns (uint256 swimUsdAmount, uint64 wormholeSequence);

  function propellerOut(
    address fromToken,
    uint256 inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickStart,
    uint16 toTokenNumber,
    bytes16 memo
  ) external payable returns (uint256 swimUsdAmount, uint64 wormholeSequence);

  function crossChainIn(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount, address outputToken);

  function crossChainIn(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) external returns (uint256 outputAmount, address outputToken);

  function propellerIn(
    bytes memory encodedVm
  ) external payable returns (uint256 outputAmount, address outputToken);

  function claimFees() external;

  function registerToken(
    uint16 tokenNumber,
    address tokenAddress,
    address poolAddress,
    uint8 tokenIndexInPool
  ) external;

  function getPoolStates(address[] memory poolAddresses) external view returns (PoolState[] memory);

  function swimUsdAddress() external view returns (address);
}
