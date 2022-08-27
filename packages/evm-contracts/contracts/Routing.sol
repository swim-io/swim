//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IRouting.sol";
import "./interfaces/ITokenBridge.sol";
import "./interfaces/IWormhole.sol";
import "./interfaces/IStructs.sol";

import "./SwimPayload.sol";

contract Routing is
  IRouting,
  Initializable,
  PausableUpgradeable,
  OwnableUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable
{
  struct TokenInfo {
    uint16 tokenNumber;
    address tokenAddress;
    address poolAddress;
    uint8 tokenIndexInPool;
  }

  using SafeERC20 for IERC20;

  bytes32 public constant SWIM_USD_SOLANA_ADDRESS =
    0x296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe26719;
  bytes32 public constant SOLANA_ROUTING_CONTRACT_ADDRESS = 0x0;
  uint8 private constant SWIM_USD_TOKEN_INDEX = 0;
  uint16 private constant WORMHOLE_SOLANA_CHAIN_ID = 1;
  uint16 private constant WORMHOLE_ETHEREUM_CHAIN_ID = 2;

  uint256 private constant ONE_SWIM_USD = 1e8;
  uint256 public constant PROPELLER_ETHEREUM_SWIM_USD_MINIMUM = 1000 * ONE_SWIM_USD;
  uint256 public constant PROPELLER_SWIM_USD_MINIMUM = 5 * ONE_SWIM_USD;
  uint256 public constant GAS_KICKSTART_AMOUNT = 0.05 ether;

  uint256 accumulatedFees;
  uint32 public wormholeNonce;
  address public swimUsdAddress;

  ITokenBridge public tokenBridge;
  IWormhole public wormhole;

  mapping(uint16 => TokenInfo) public tokenNumberMapping;
  mapping(address => TokenInfo) public tokenAddressMapping;
  mapping(address => uint256) public engineFees;

  function initialize(address owner, address tokenBridgeAddress) public initializer {
    __Pausable_init();
    __Ownable_init();
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();
    _transferOwnership(owner);
    wormholeNonce = 0;
    tokenBridge = ITokenBridge(tokenBridgeAddress);
    wormhole = tokenBridge.wormhole();
    swimUsdAddress = tokenBridge.wrappedAsset(WORMHOLE_SOLANA_CHAIN_ID, SWIM_USD_SOLANA_ADDRESS);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}


  function getPoolStates(
    address[] memory poolAddresses
  ) external view returns (PoolState[] memory) {
    uint256 poolCount = poolAddresses.length;
    PoolState[] memory pools = new PoolState[](poolCount);

    for (uint256 i = 0; i < poolCount; i++)
      pools[i] = IPool(poolAddresses[i]).getState();

    return pools;
  }

  // -------------------------------- ONCHAIN ---------------------------------

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount
  ) public whenNotPaused returns (uint256 outputAmount) {
    uint256 swimUsdAmount = acquireAndMaybeSwap(fromToken, inputAmount, 0);
    (outputAmount,) = maybeSwapAndTransfer(
      swimUsdAmount,
      toToken,
      minimumOutputAmount,
      toOwner,
      false //revert on slippage
    );
  }

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) external returns (uint256 outputAmount) {
    outputAmount = onChainSwap(fromToken, inputAmount, toOwner, toToken, minimumOutputAmount);

    emit SwimInteraction(
      msg.sender,
      memo,
      SwimOperation.OnChainSwap,
      abi.encodePacked(fromToken, inputAmount, toOwner, toToken, minimumOutputAmount),
      abi.encodePacked(outputAmount)
    );
  }

  // ---------------------------------- OUT -----------------------------------

  function crossChainOut(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner
  ) public payable whenNotPaused returns (uint256 swimUsdAmount, uint64 wormholeSequence) {
    swimUsdAmount = acquireAndMaybeSwap(fromToken, inputAmount, firstMinimumOutputAmount);

    if (wormholeRecipientChain == WORMHOLE_SOLANA_CHAIN_ID) {
      IERC20(swimUsdAddress).safeApprove(address(tokenBridge), swimUsdAmount);

      try tokenBridge.transferTokens{value: msg.value}(
        swimUsdAddress,
        swimUsdAmount,
        WORMHOLE_SOLANA_CHAIN_ID,
        toOwner,
        0, //arbiterFee
        wormholeNonce
      ) returns (uint64 _wormholeSequence) {
        wormholeSequence = _wormholeSequence;
      }
      catch (bytes memory lowLevelData) {
        revert WormholeInteractionFailed(lowLevelData);
      }
      ++wormholeNonce;
    }
    else {
      wormholeSequence = wormholeTransferWithPayload(
        swimUsdAmount,
        wormholeRecipientChain,
        SwimPayloadConversion.encode(toOwner)
      );
    }
  }

  function crossChainOut(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bytes16 memo
  ) external payable returns (uint256 swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = crossChainOut(
      fromToken,
      inputAmount,
      firstMinimumOutputAmount,
      wormholeRecipientChain,
      toOwner
    );

    emit SwimInteraction(
      msg.sender,
      memo,
      SwimOperation.CrossChainOut,
      abi.encodePacked(
        fromToken,
        inputAmount,
        firstMinimumOutputAmount,
        wormholeRecipientChain,
        toOwner
      ),
      abi.encodePacked(swimUsdAmount, wormholeSequence)
    );
  }

  function propellerOut(
    address fromToken,
    uint256 inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickStart,
    address toToken
  ) external payable whenNotPaused returns (uint256 swimUsdAmount, uint64 wormholeSequence) {
    swimUsdAmount = acquireAndMaybeSwap(fromToken, inputAmount, 0);

    checkPropellerMinimumThreshold(swimUsdAmount, wormholeRecipientChain);

    wormholeSequence = wormholeTransferWithPayload(
      swimUsdAmount,
      wormholeRecipientChain,
      SwimPayloadConversion.encode(toOwner, getTokenNumber(toToken), gasKickStart)
    );
  }

  function propellerOut(
    address fromToken,
    uint256 inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickStart,
    address toToken,
    bytes16 memo
  ) external payable whenNotPaused returns (uint256 swimUsdAmount, uint64 wormholeSequence) {
    swimUsdAmount = acquireAndMaybeSwap(fromToken, inputAmount, 0);

    wormholeSequence = wormholeTransferWithPayload(
      swimUsdAmount,
      wormholeRecipientChain,
      SwimPayloadConversion.encode(toOwner, getTokenNumber(toToken), gasKickStart, memo)
    );

    emit SwimInteraction(
      msg.sender,
      memo,
      SwimOperation.PropellerOut,
      abi.encodePacked(
        fromToken,
        inputAmount,
        wormholeRecipientChain,
        toOwner,
        gasKickStart,
        toToken
      ),
      abi.encodePacked(swimUsdAmount, wormholeSequence)
    );
  }

  // ----------------------------------- IN -----------------------------------

  function crossChainIn(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount, address outputToken) {
    return crossChainIn(encodedVm, toToken, minimumOutputAmount, bytes16(0));
  }

  //If swap fails, user receives swimUsd token
  //overrides propeller payload information if included
  function crossChainIn(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) public whenNotPaused returns (uint256 outputAmount, address outputToken) {
    (uint256 swimUsdAmount, SwimPayload memory swimPayload) = completeWormholeTransfer(encodedVm);

    if (msg.sender != swimPayload.toOwner)
      revert SenderIsNotOwner(msg.sender, swimPayload.toOwner);

    if (memo == bytes16(0))
      memo = swimPayload.memo;
    else if (swimPayload.memo != bytes16(0) && memo != swimPayload.memo)
      revert MemoContradiction(memo, swimPayload.memo);

    (outputAmount, outputToken) = maybeSwapAndTransfer(
      swimUsdAmount,
      toToken,
      minimumOutputAmount,
      msg.sender,
      true //swimUsd fallback on slippage
    );

    if (memo != bytes16(0))
      emit SwimInteraction(
        msg.sender,
        memo,
        SwimOperation.CrossChainIn,
        abi.encodePacked(toToken, minimumOutputAmount),
        abi.encodePacked(outputAmount, outputToken)
      );
  }

  function propellerIn(
    bytes memory encodedVm
  ) external payable whenNotPaused returns (uint256 outputAmount, address outputToken) {
    //TODO lots of checks missing - WIP
    //uint256 startGas = gasleft(); //TODO add gas cost of checking whenNotPaused
    (uint256 swimUsdAmount, SwimPayload memory swimPayload) = completeWormholeTransfer(encodedVm);

    if (swimPayload.gasKickstart) {
      if (msg.value != GAS_KICKSTART_AMOUNT)
        revert IncorrectMessageValue(msg.value, GAS_KICKSTART_AMOUNT);
      (bool success,) = swimPayload.toOwner.call{value: GAS_KICKSTART_AMOUNT}("");
      if (!success)
        revert GasKickstartFailed(swimPayload.toOwner);
    }
    else if (msg.value != 0)
      revert IncorrectMessageValue(msg.value, 0);

    //TODO proper engine fee handling (gas counting and gas price oracle)
    uint256 feeAmount = swimPayload.gasKickstart ? 3 * ONE_SWIM_USD : ONE_SWIM_USD;
    accumulatedFees += feeAmount;
    engineFees[msg.sender] += feeAmount;

    outputToken = getTokenAddress(swimPayload.tokenNumber);
    (outputAmount,) = maybeSwapAndTransfer(
      swimUsdAmount - feeAmount, //TODO
      outputToken,
      0, //no slippage for propeller
      swimPayload.toOwner,
      false //irrelevant - can't fail due to slippage
    );

    if (swimPayload.memo != bytes16(0))
      emit SwimInteraction(
        msg.sender,
        swimPayload.memo,
        SwimOperation.PropellerIn,
        abi.encodePacked(swimUsdAmount, swimPayload.gasKickstart),
        abi.encodePacked(outputAmount, outputToken)
      );
  }

  // --------------------------------- ENGINE ---------------------------------

  function claimFees() external whenNotPaused { unchecked {
    uint256 feeAmount = engineFees[msg.sender];
    engineFees[msg.sender] = 0;
    accumulatedFees -= feeAmount;
    IERC20(swimUsdAddress).safeTransfer(msg.sender, feeAmount);
  }}

  // ------------------------------- GOVERNANCE -------------------------------

  function registerToken(
    uint16 tokenNumber,
    address tokenAddress,
    address poolAddress,
    uint8 tokenIndexInPool
  ) external onlyOwner {
    PoolState memory state = IPool(poolAddress).getState();
    address poolToken = state.balances[tokenIndexInPool].tokenAddress;
    if (tokenAddress != poolToken)
      revert TokenMismatch(tokenAddress, poolToken);

    TokenInfo memory token = tokenNumberMapping[tokenNumber];
    token.tokenNumber = tokenNumber;
    token.tokenAddress = tokenAddress;
    token.poolAddress = poolAddress;
    token.tokenIndexInPool = tokenIndexInPool;

    tokenNumberMapping[tokenNumber] = token;
    tokenAddressMapping[tokenAddress] = token;

    emit TokenRegistered(tokenNumber, tokenAddress, poolAddress);
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  // -------------------------------- INTERNAL --------------------------------

  function acquireAndMaybeSwap(
    address fromToken,
    uint256 inputAmount,
    uint256 minimumOutputAmount
  ) internal returns (uint256 swimUsdAmount) {
    IERC20(fromToken).safeTransferFrom(msg.sender, address(this), inputAmount);

    if (fromToken != swimUsdAddress) {
      (IPool fromPool, uint8 fromIndex) = getPoolAndIndex(fromToken);
      IERC20(fromToken).safeApprove(address(fromPool), inputAmount);
      swimUsdAmount = fromPool.swap(
        inputAmount,
        fromIndex,
        SWIM_USD_TOKEN_INDEX,
        minimumOutputAmount
      );
    }
    else
      swimUsdAmount = inputAmount;
  }

  function maybeSwapAndTransfer(
    uint256 swimUsdAmount,
    address toToken,
    uint256 minimumOutputAmount,
    address toOwner,
    bool swimUsdOnSlippageFailure
  ) internal returns (uint256 outputAmount, address outputToken) {
    if (toToken != swimUsdAddress) {
      (IPool toPool, uint8 toIndex) = getPoolAndIndex(toToken);
      IERC20(swimUsdAddress).safeApprove(address(toPool), outputAmount);
      try
        IPool(toPool).swap(
          swimUsdAmount,
          SWIM_USD_TOKEN_INDEX,
          toIndex,
          minimumOutputAmount
        )
      returns (uint256 _outputAmount) {
        outputAmount = _outputAmount;
        outputToken = toToken;
      }
      catch (bytes memory lowLevelData) {
        if (swimUsdOnSlippageFailure) {
          outputAmount = swimUsdAmount;
          outputToken = swimUsdAddress;
        }
        else
          //just forward pool revert data
          assembly { revert(add(lowLevelData, 32), mload(lowLevelData)) }
      }
    }
    else {
      outputAmount = swimUsdAmount;
      outputToken = swimUsdAddress;
    }

    IERC20(outputToken).safeTransfer(toOwner, outputAmount);
  }

  function wormholeTransferWithPayload(
    uint256 swimUsdAmount,
    uint16 wormholeRecipientChain,
    bytes memory swimPayload
  ) internal returns (uint64 wormholeSequence) {
    IERC20(swimUsdAddress).safeApprove(address(tokenBridge), swimUsdAmount);

    bytes32 routingContract =
      (wormholeRecipientChain == WORMHOLE_SOLANA_CHAIN_ID)
      ? SOLANA_ROUTING_CONTRACT_ADDRESS
      : bytes32(uint256(uint160(address(this))));

    try
      tokenBridge.transferTokensWithPayload{value: msg.value}(
        swimUsdAddress,
        swimUsdAmount,
        wormholeRecipientChain,
        routingContract,
        wormholeNonce,
        swimPayload
      )
    returns (uint64 _wormholeSequence) {
      wormholeSequence = _wormholeSequence;
    } catch (bytes memory lowLevelData) {
      revert WormholeInteractionFailed(lowLevelData);
    }
    ++wormholeNonce;
  }

  function completeWormholeTransfer(
    bytes memory encodedVm
  ) internal returns (uint256 swimUsdAmount, SwimPayload memory swimPayload) {
    try
      tokenBridge.completeTransferWithPayload(encodedVm)
    returns (bytes memory encodedSwimPayload) {
      swimUsdAmount = IERC20(swimUsdAddress).balanceOf(address(this));
      swimPayload = SwimPayloadConversion.decode(encodedSwimPayload);
    } catch (bytes memory lowLevelData) {
      revert WormholeInteractionFailed(lowLevelData);
    }
  }

  // --------------------------- INTERNAL VIEW/PURE ---------------------------

  function getPoolAndIndex(address token) internal view returns (IPool, uint8) {
    TokenInfo storage info = tokenAddressMapping[token];
    address pool = info.poolAddress;
    if (pool == address(0))
      revert TokenNotRegistered(bytes20(uint160(token)));

    return (IPool(pool), info.tokenIndexInPool);
  }

  function getTokenNumber(address token) internal view returns (uint16) {
    uint16 tokenNumber = tokenAddressMapping[token].tokenNumber;
    if (tokenNumber == 0)
      revert TokenNotRegistered(bytes20(token));

    return tokenNumber;
  }

  function getTokenAddress(uint16 tokenNumber) internal view returns (address) {
    address token = tokenNumberMapping[tokenNumber].tokenAddress;
    if (token == address(0))
      revert TokenNotRegistered(bytes20(uint160(tokenNumber)));

    return token;
 }

 function checkPropellerMinimumThreshold(
    uint256 swimUsdAmount,
    uint64 wormholeRecipientChain
  ) internal pure {
    uint256 minThreshold = (wormholeRecipientChain == WORMHOLE_ETHEREUM_CHAIN_ID)
      ? PROPELLER_ETHEREUM_SWIM_USD_MINIMUM
      : PROPELLER_SWIM_USD_MINIMUM;

    if (swimUsdAmount < minThreshold)
      revert TooSmallForPropeller(swimUsdAmount, minThreshold);
  }
}
