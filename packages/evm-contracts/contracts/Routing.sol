//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IRouting.sol";
import "./interfaces/ITokenBridge.sol";
import "./interfaces/IWormhole.sol";
import "./interfaces/IStructs.sol";

import "./SwimPayload.sol";

contract Routing is
  IRouting,
  PausableUpgradeable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  using SwimPayload for bytes;
  using SafeERC20 for IERC20;

  bytes32 private constant SWIM_USD_SOLANA_ADDRESS = bytes32(0x44a0a063099540e87e0163a6e27266a364c35930208cfaded5b79377713906e9);
  uint8 private constant SWIM_USD_TOKEN_INDEX = 0;
  uint16 private constant WORMHOLE_SOLANA_CHAIN_ID = 1;

  uint32 private wormholeNonce;
  address public swimUsdAddress;

  ITokenBridge public tokenBridge;
  IWormhole public wormhole;

  struct TokenInfo {
    uint16 tokenNumber;
    address tokenAddress;
    address poolAddress;
    uint8 tokenIndexInPool;
  }

  mapping(uint16 => TokenInfo) tokenNumberMapping;
  mapping(address => TokenInfo) tokenAddressMapping;

  function initialize(address tokenBridgeAddress) public initializer {
    __Pausable_init();
    __Ownable_init();
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();
    wormholeNonce = 0;
    tokenBridge = ITokenBridge(tokenBridgeAddress);
    wormhole = tokenBridge.wormhole();
    swimUsdAddress = tokenBridge.wrappedAsset(WORMHOLE_SOLANA_CHAIN_ID, SWIM_USD_SOLANA_ADDRESS);
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  /**
   * @notice Swap two tokens using one chain
   * @param fromToken the token the user wants to swap from
   * @param toToken the token the user wants to swap to
   * @param toOwner the address of token beneficiary
   * @param inputAmount the amount of tokens the user wants to swap from
   * @param minimumOutputAmount the min amount the user would like to receive, or revert
   * @return outputAmount The amount of tokent that will be received
   */

  function onChainSwap(
    address fromToken,
    uint256 inputAmount,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount
  ) public payable whenNotPaused returns (uint256 outputAmount) {
    (address fromPool, uint8 fromIndex) = getPoolAndIndex(fromToken);
    (address toPool, uint8 toIndex) = getPoolAndIndex(toToken);

    IERC20(fromToken).safeTransferFrom(msg.sender, address(this), inputAmount);
    outputAmount = inputAmount;

    if (fromToken != swimUsdAddress) {
      IERC20(fromToken).safeApprove(fromPool, inputAmount);

      outputAmount = IPool(fromPool).swap(
        inputAmount,
        fromIndex,
        SWIM_USD_TOKEN_INDEX,
        0
      );
    }
    if (toToken != swimUsdAddress) {
      IERC20(swimUsdAddress).safeApprove(toPool, outputAmount);

      outputAmount = IPool(toPool).swap(
        outputAmount,
        SWIM_USD_TOKEN_INDEX,
        toIndex,
        minimumOutputAmount
      );
    }

    IERC20(toToken).safeTransfer(toOwner, outputAmount);

    emit OnChainSwap(toOwner, fromToken, toToken, outputAmount);
  }

  /**
   * @notice Swap and send ERC20 token through portal
   * @param fromToken the token user wants to swap from
   * @param inputAmount the amount of tokens user wants to swap from
   * @param wormholeRecipientChain Wormhole receiver chain
   * @param toOwner the address of token beneficiary
   * @return wormholeSequence Wormhole Sequence
   */

  function swapAndTransfer(
    address fromToken,
    uint256 inputAmount,
    uint256 firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner
  ) external payable whenNotPaused returns (uint64 wormholeSequence) {
    (address fromPool, uint8 fromIndex) = getPoolAndIndex(fromToken);

    IERC20(fromToken).safeTransferFrom(msg.sender, address(this), inputAmount);
    uint256 receivedSwimUsdAmount = inputAmount;

    if (fromToken != swimUsdAddress) {
      IERC20(fromToken).safeApprove(fromPool, inputAmount);

      receivedSwimUsdAmount = IPool(fromPool).swap(
        inputAmount,
        fromIndex,
        SWIM_USD_TOKEN_INDEX,
        firstMinimumOutputAmount
      );
    }

    IERC20(swimUsdAddress).safeApprove(address(tokenBridge), receivedSwimUsdAmount);

    if (wormholeRecipientChain == WORMHOLE_SOLANA_CHAIN_ID) {
      uint256 arbiterFee = 0;
      wormholeSequence = tokenBridge.transferTokens(
        swimUsdAddress,
        receivedSwimUsdAmount,
        WORMHOLE_SOLANA_CHAIN_ID,
        toOwner,
        arbiterFee,
        wormholeNonce
      );
    } else {
      bytes memory swimPayload = SwimPayload.encode(toOwner);
      bytes32 thisAddress = bytes32(uint256(uint160(address(this))));
      wormholeSequence = tokenBridge.transferTokensWithPayload(
        swimUsdAddress,
        receivedSwimUsdAmount,
        wormholeRecipientChain,
        thisAddress,
        wormholeNonce,
        swimPayload
      );
    }

    ++wormholeNonce;

    emit SwapAndTransfer(msg.sender, wormholeSequence, fromToken, inputAmount);
  }

  /**
   * @notice Complete a contract-controlled transfer of  an ERC20 token and swaps for toToken in parameters.
   * If swap fails, user receives swimUsd token
   * @dev The transaction can only be redeemed by the recipient, logical owner.
   * @param encodedVm A byte array containing a VAA signed by the guardians.
   * @param toToken the token address user wants to swap from
   * @param minimumOutputAmount Minimum output amount expected
   * @return outputAmount Amount that user will receive
   */
  function receiveAndSwap(
    bytes memory encodedVm,
    address toToken,
    uint256 minimumOutputAmount
  ) external whenNotPaused returns (uint256 outputAmount, address outputToken) {
    bytes memory swimPayload = tokenBridge.completeTransferWithPayload(encodedVm);
    swimPayload.checkVersion();

    if (msg.sender != swimPayload.decodeOwner()) {
      revert Routing__ErrorMessage("Sender is not the owner!");
    }

    return _receiveAndSwap(encodedVm, msg.sender, toToken, minimumOutputAmount);
  }

  /**
   * @notice Complete a contract-controlled transfer of an ERC20 token and swaps for token address in payload.
   * If swap fails, user receives swimUsd token.
   * @param encodedVm A byte array containing a VAA signed by the guardians.
   * @return outputAmount Amount that user will receive
   * @return outputToken Type of token that user will receive
   */
  function receiveAndSwap(bytes memory encodedVm)
    external whenNotPaused returns (uint256 outputAmount, address outputToken) {
    bytes memory swimPayload = tokenBridge.completeTransferWithPayload(encodedVm);
    swimPayload.checkVersion();

    address toOwner = swimPayload.decodeOwner();
    (uint16 tokenNumber, uint minimumOutputAmount) = swimPayload.decodeSwapParameters();
    address toToken = getTokenAddress(tokenNumber);

    return _receiveAndSwap(encodedVm, toOwner, toToken, minimumOutputAmount);
  }

  function _receiveAndSwap(
    bytes memory encodedVm,
    address toOwner,
    address toToken,
    uint256 minimumOutputAmount
  ) internal returns (uint256 outputAmount, address outputToken) {
    (address toPool, uint8 toIndex) = getPoolAndIndex(toToken);

    uint256 receivedSwimUsdAmount = IERC20(swimUsdAddress).balanceOf(address(this));
    outputToken = toToken;
    outputAmount = minimumOutputAmount;

    if (toToken != swimUsdAddress) {
      IERC20(swimUsdAddress).safeApprove(toPool, receivedSwimUsdAmount);

      try
        IPool(toPool).swap(
          receivedSwimUsdAmount,
          SWIM_USD_TOKEN_INDEX,
          toIndex,
          minimumOutputAmount
        )
      returns (uint256 _outputAmount) {
        outputAmount = _outputAmount;
        outputToken = toToken;
      } catch {
        outputAmount = receivedSwimUsdAmount;
        outputToken = swimUsdAddress;
      }
    }

    IERC20(toToken).safeTransfer(toOwner, outputAmount);

    uint64 sequence = wormhole.parseVM(encodedVm).sequence;
    emit ReceiveAndSwap(toOwner, sequence, outputToken, outputAmount);
  }

  /**
   * @notice Registers token and pool details
   * @dev Only contract deployer can register tokens and pools
   * @param tokenNumber Token ID on current chain
   * @param tokenAddress Token contract address
   * @param poolAddress Contract address of pool on current chain
   * @param tokenIndexInPool Token index in given pool on current chain
   */
  function registerToken(
    uint16 tokenNumber,
    address tokenAddress,
    address poolAddress,
    uint8 tokenIndexInPool
  ) external onlyOwner {
    TokenInfo memory token = tokenNumberMapping[tokenNumber];
    token.tokenNumber = tokenNumber;
    token.tokenAddress = tokenAddress;
    token.poolAddress = poolAddress;
    token.tokenIndexInPool = tokenIndexInPool;

    tokenNumberMapping[tokenNumber] = token;
    tokenAddressMapping[tokenAddress] = token;

    emit TokenRegistered(tokenNumber, tokenAddress, poolAddress);
  }

  /**
   * @notice Gets liquidities for all given pool adresses
   * @dev TODO : when pools are done
   * @param poolAddresses Addresses of pools
   * @return PoolState List of objects of pool details
   */
  function getPoolStates(address[] memory poolAddresses)
    external view returns (PoolState[] memory) {
    uint256 poolCount = poolAddresses.length;
    PoolState[] memory pools = new PoolState[](poolCount);

    for (uint256 i = 0; i < poolCount; i++) {
      pools[i] = IPool(poolAddresses[i]).getState();
    }
    return pools;
  }

  function getPoolAndIndex(address token) internal view returns(address, uint8) {
    TokenInfo storage info = tokenAddressMapping[token];
    address pool = info.poolAddress;
    if (pool == address(0)) {
      revert Routing__TokenNotRegistered(bytes20(uint160(token)));
    }
    return (pool, info.tokenIndexInPool);
  }

  function getTokenAddress(uint16 tokenNumber) internal view returns(address) {
    address token = tokenNumberMapping[tokenNumber].tokenAddress;
    if (token == address(0)) {
      revert Routing__TokenNotRegistered(bytes20(uint160(tokenNumber)));
    }
    return token;
  }
}
