//SPDX-License-Identifier: Unlicence
pragma solidity ^0.8.15;

import "../node_modules/hardhat/console.sol";

import "../node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol"; // SafeERC20 ?
import "../node_modules/@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IRouting.sol";
import "./interfaces/ISwimUSD.sol";
import "./interfaces/ITokenBridge.sol";
import "./interfaces/IWormhole.sol";
import "./interfaces/IStructs.sol";

error Routing__OnChainSwapFailed();
error Routing__SwapAndTransferFailed();

contract Routing is
  IRouting,
  PausableUpgradeable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  address constant SWIM_USD_SOLANA_ADDRESS = address(0x0);
  uint8 constant SWIM_PAYLOAD_VERSION = 1;
  uint8 constant SWIM_USD_TOKEN_INDEX = 0;
  uint16 constant WORMHOLE_CHAIN_ID = 1;
  address constant WORMHOLE_CORE_BRIDGE_ADDRESS =
    address(0xC89Ce4735882C9F0f0FE26686c53074E09B0D550);
  uint32 private wormholeNonce;
  ISwimUSD public swimUSD;
  ITokenBridge public tokenBridge;
  IWormhole public wormhole;

  struct Token {
    uint16 tokenId;
    address tokenContract;
    address chainPool;
    uint8 tokenIndexInPool;
  }

  mapping(uint16 => Token) tokenIdMapping;
  mapping(address => Token) tokenAddressMapping;

  constructor() initializer {}

  function initialize(address tokenBridgeAddress) public initializer {
    __Pausable_init();
    __Ownable_init();
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();
    wormholeNonce = 0;
    swimUSD = ISwimUSD(SWIM_USD_SOLANA_ADDRESS);
    tokenBridge = ITokenBridge(tokenBridgeAddress);
    wormhole = IWormhole(WORMHOLE_CORE_BRIDGE_ADDRESS);
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
  ) public whenNotPaused returns (uint256 outputAmount) {
    address poolAddress = tokenAddressMapping[fromToken].chainPool;

    require(poolAddress != address(0)); // seperate func

    require(IERC20Upgradeable(fromToken).transferFrom(msg.sender, address(this), inputAmount));
    require(IERC20Upgradeable(fromToken).approve(poolAddress, inputAmount));

    uint256 receivedSwimUSDAmount = IPool(poolAddress).swap(
      inputAmount,
      tokenAddressMapping[fromToken].tokenIndexInPool,
      SWIM_USD_TOKEN_INDEX,
      0
    );

    require(swimUSD.approve(poolAddress, receivedSwimUSDAmount));

    outputAmount = IPool(poolAddress).swap(
      receivedSwimUSDAmount,
      SWIM_USD_TOKEN_INDEX,
      tokenAddressMapping[toToken].tokenIndexInPool,
      minimumOutputAmount
    );

    require(IERC20Upgradeable(toToken).transfer(toOwner, outputAmount));

    emit OnChainSwap(toOwner, fromToken, toToken, outputAmount);
  }

  /**
   * @notice Swap and send ERC20 token through portal
   * @param fromToken the token user wants to swap from
   * @param inputAmount the amount of tokens the user wants to swap from
   * @param firstMinimumOutputAmount Minimum output amount after first swap
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
    address poolAddress = tokenAddressMapping[fromToken].chainPool;
    require(poolAddress != address(0)); // seperate func

    require(IERC20Upgradeable(fromToken).transferFrom(msg.sender, address(this), inputAmount));
    require(IERC20Upgradeable(fromToken).approve(poolAddress, inputAmount));

    uint256 receivedSwimUSDAmount = IPool(poolAddress).swap(
      inputAmount,
      tokenAddressMapping[fromToken].tokenIndexInPool,
      SWIM_USD_TOKEN_INDEX,
      0
    );

    require(swimUSD.approve(address(tokenBridge), receivedSwimUSDAmount));
    uint256 arbiterFee = 0;

    if (wormholeRecipientChain == WORMHOLE_CHAIN_ID) {
      wormholeSequence = tokenBridge.transferTokens(
        address(swimUSD),
        receivedSwimUSDAmount,
        wormholeRecipientChain,
        toOwner,
        arbiterFee,
        wormholeNonce
      );
    } else {
      bytes memory swimPayload = abi.encodePacked(SWIM_PAYLOAD_VERSION, toOwner);
      bytes32 contractAddress = bytes32(uint256(uint160(address(this))));

      wormholeSequence = tokenBridge.transferTokensWithPayload(
        address(swimUSD),
        receivedSwimUSDAmount,
        wormholeRecipientChain,
        contractAddress,
        wormholeNonce,
        swimPayload
      );
    }

    wormholeNonce = ++wormholeNonce;
    emit SwapAndTransfer(msg.sender, wormholeSequence, fromToken, inputAmount);
  }

  /**
   * @notice Complete a contract-controlled transfer of  an ERC20 token and swaps for toToken in parameters.
   * If swap fails, user receives swimUSD token
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
  ) external returns (uint256 outputAmount, address outputToken) {
    bytes memory swimPayload = tokenBridge.completeTransferWithPayload(encodedVm, msg.sender);
    require(swimPayload.length == 33);
    require(uint8(swimPayload[0]) == SWIM_PAYLOAD_VERSION);
    require(msg.sender == address(uint160(uint256(bytes32(swimPayload[1:33])))));

    address poolAddress = tokenAddressMapping[toToken].chainPool;
    uint256 receivedSwimUSDAmount = swimUSD.balanceOf(address(this));
    require(swimUSD.approve(poolAddress, receivedSwimUSDAmount));

    try
      IPool(poolAddress).swap(
        receivedSwimUSDAmount,
        SWIM_USD_TOKEN_INDEX,
        tokenAddressMapping[toToken].tokenIndexInPool,
        minimumOutputAmount
      )
    returns (uint256 _outputAmount) {
      require(IERC20Upgradeable(toToken).transfer(msg.sender, outputAmount));
      outputAmount = _outputAmount;
      outputToken = toToken;
    } catch {
      require(swimUSD.transfer(msg.sender, receivedSwimUSDAmount));
      outputAmount = receivedSwimUSDAmount;
      outputToken = address(swimUSD);
    }

    uint64 sequence = wormhole.parseVM(encodedVm).sequence;
    emit ReceiveAndSwap(msg.sender, sequence, outputToken, outputAmount);
  }

  /**
   * @notice Complete a contract-controlled transfer of an ERC20 token and swaps for token address in payload.
   * If swap fails, user receives swimUSD token.
   * @param encodedVm A byte array containing a VAA signed by the guardians.
   * @return outputAmount Amount that user will receive
   */
  function receiveAndSwap2(bytes memory encodedVm) external returns (uint256 outputAmount) {
    bytes memory swimPayload = tokenBridge.completeTransferWithPayload(encodedVm, address(0));
    require(swimPayload.length == 33);
    require(uint8(swimPayload[0]) == SWIM_PAYLOAD_VERSION);

    bytes32 toToken = bytes32(swimPayload[1:33]);
    address toTokenAddress = address(uint160(uint256(toToken)));
    address poolAddress = tokenAddressMapping[toTokenAddress].chainPool;
    uint256 receivedSwimUSDAmount = swimUSD.balanceOf(address(this));
    require(swimUSD.approve(poolAddress, receivedSwimUSDAmount));

    bytes memory payload = wormhole.parseVM(encodedVm).payload;
    (uint8 version, bytes32 owner) = abi.decode(payload, (uint8, bytes32));
    address receiverAddress = address(uint160(uint256(owner)));
    address outputToken;

    try
      IPool(poolAddress).swap(
        receivedSwimUSDAmount,
        SWIM_USD_TOKEN_INDEX,
        tokenAddressMapping[toTokenAddress].tokenIndexInPool,
        0
      )
    returns (uint256 _outputAmount) {
      require(IERC20Upgradeable(toTokenAddress).transfer(receiverAddress, outputAmount));
      outputAmount = _outputAmount;
      outputToken = toTokenAddress;
    } catch {
      require(swimUSD.transfer(receiverAddress, receivedSwimUSDAmount));
      outputAmount = receivedSwimUSDAmount;
      outputToken = address(swimUSD);
    }

    uint64 sequence = wormhole.parseVM(encodedVm).sequence;
    emit ReceiveAndSwap2(receiverAddress, sequence, outputToken, outputAmount);
  }

  /**
   * @notice Registers token and pool details
   * @dev Only contract deployer can register tokens and pools
   * @param tokenId Token ID on current chain
   * @param tokenContract Token contract address
   * @param chainPool Contract address of pool on current chain
   * @param tokenIndexInPool Token index in given pool on current chain
   */
  function registerToken(
    uint16 tokenId,
    address tokenContract,
    address chainPool,
    uint8 tokenIndexInPool
  ) external onlyOwner {
    Token memory token = tokenIdMapping[tokenId];
    token.tokenId = tokenId;
    token.tokenContract = tokenContract;
    token.chainPool = chainPool;
    token.tokenIndexInPool = tokenIndexInPool;

    tokenIdMapping[tokenId] = token;
    tokenAddressMapping[tokenContract] = token;

    emit TokenRegistered(tokenId, tokenContract, chainPool);
  }

  function getPoolTokenCount(address poolAddress) internal returns (uint8 tokenCount) {}
}
