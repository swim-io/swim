//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IRouting.sol";
import "./interfaces/IPool.sol";
import "./interfaces/ITokenBridge.sol";
import "./interfaces/IUniswapV3Pool.sol";

import "./SwimPayload.sol";
import "./Constants.sol";

contract Routing is
  IRouting,
  Initializable,
  PausableUpgradeable,
  OwnableUpgradeable,
  UUPSUpgradeable
{
  using SafeERC20 for IERC20;

  //uses two slots
  struct UniswapOracleParams {
    //swimUSD -> intermediate token (via swim pool) -> gas token (via uniswap)
    IPool          swimPool;
    uint8          swimIntermediateIndex;
    IUniswapV3Pool uniswapPool;
    bool           uniswapIntermediateIsFirst;
  }

  struct PropellerFeeConfig {
    GasTokenPriceMethod   method;
    //service fee specified in swimUSD
    uint64                serviceFee;
    //specified in atomic with 18 decimals, i.e. how many atomic swimUSD per 1 wei?
    // assuming a gas token price of 1 (human) swimUSD / 1 (human) gas token where swimUSD has
    // 6 decimals and gas token has 18 decimals means 10^-12 atomic swimUSD per 1 wei gas token
    // and thus taking 18 decimals into account fixedSwimUsdPerGasToken would equal 10^6
    uint                  fixedSwimUsdPerGasToken;
    UniswapOracleParams   uniswap;
  }

  uint private constant PRECISION = ROUTING_PRECISION;
  uint private constant PRECISION_MULTIPLIER = 10 ** PRECISION;
  uint private constant GAS_COST_BASE = 79900;
  uint private constant GAS_COST_POOL_SWAP = 80000;
  uint private constant GAS_KICKSTART_AMOUNT = 0.05 ether;

  uint private constant BNB_MAINNET_CHAINID = 56;
  uint private constant BNB_TESTNET_CHAINID = 97;
  uint private constant BNB_GAS_PRICE = 5 gwei;

  uint private constant BIT224 = 1 << 224;
  uint private constant BIT128 = 1 << 128;
  uint private constant BIT96  = 1 << 96;

  //slot[0]
  address public /*immutable*/ swimUsdAddress;
  //slot[1]
  ITokenBridge public /*immutable*/ tokenBridge;
  //remaining slots
  PropellerFeeConfig public propellerFeeConfig;
  uint256[20]        private reservedSlotsForAdditionalPropellerFeeRemunerationMethodConfigs;

  mapping(uint16  => TokenInfo) public tokenNumberMapping;
  mapping(address => TokenInfo) public tokenAddressMapping;
  mapping(address => uint)      public engineFees;

  function initialize(
    address owner_,
    address tokenBridgeAddress
  ) public initializer {
    __Pausable_init();
    __Ownable_init();
    _transferOwnership(owner_);
    tokenBridge = ITokenBridge(tokenBridgeAddress);
    swimUsdAddress = tokenBridge.wrappedAsset(WORMHOLE_SOLANA_CHAIN_ID, SWIM_USD_SOLANA_ADDRESS);
    if (swimUsdAddress == address(0))
      revert SwimUsdNotAttested();
    propellerFeeConfig.method = GasTokenPriceMethod.FixedPrice;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  function getPoolStates(
    address[] calldata poolAddresses
  ) external view returns (PoolState[] memory) {
    uint poolCount = poolAddresses.length;
    PoolState[] memory pools = new PoolState[](poolCount);

    for (uint i = 0; i < poolCount; i++)
      pools[i] = IPool(poolAddresses[i]).getState();

    return pools;
  }

  // ----------------------------- ONCHAIN ---------------------------------------------------------

  function onChainSwap(
    address fromToken,
    uint inputAmount,
    address toOwner,
    address toToken,
    uint minimumOutputAmount
  ) external whenNotPaused returns (uint outputAmount) {
    outputAmount = _onChainSwap(fromToken, inputAmount, toOwner, toToken, minimumOutputAmount);
  }

  function onChainSwap(
    address fromToken,
    uint inputAmount,
    address toOwner,
    address toToken,
    uint minimumOutputAmount,
    bytes16 memo
  ) external whenNotPaused returns (uint outputAmount) {
    outputAmount = _onChainSwap(fromToken, inputAmount, toOwner, toToken, minimumOutputAmount);
    emit MemoInteraction(memo);
  }

  function _onChainSwap(
    address fromToken, //mut - i.e. potentially assigned to during execution
    uint inputAmount, //mut
    address toOwner,
    address toToken,
    uint minimumOutputAmount
  ) internal returns (uint outputAmount) {
    IERC20(fromToken).safeTransferFrom(msg.sender, address(this), inputAmount);
    address swimUsdAddress_ = swimUsdAddress;

    uint8 fromIndex;
    uint8 toIndex;
    IPool pool;

    if (fromToken == swimUsdAddress_) {
      fromIndex = SWIM_USD_TOKEN_INDEX;
      (pool, toIndex) = getPoolAndIndex(toToken);
    }
    else if (toToken == swimUsdAddress_) {
      toIndex = SWIM_USD_TOKEN_INDEX;
      (pool, fromIndex) = getPoolAndIndex(fromToken);
    }
    else {
      (pool, fromIndex) = getPoolAndIndex(fromToken);
      IPool fromPool = pool;
      (pool, toIndex) = getPoolAndIndex(toToken);
      if (fromPool != pool) {
        inputAmount = swap(fromPool, fromToken, inputAmount, fromIndex, SWIM_USD_TOKEN_INDEX, 0);
        fromToken = swimUsdAddress_;
        fromIndex = SWIM_USD_TOKEN_INDEX;
      }
    }

    outputAmount = swap(pool, fromToken, inputAmount, fromIndex, toIndex, minimumOutputAmount);

    IERC20(toToken).safeTransfer(toOwner, outputAmount);
  }

  // ----------------------------- INITIATE --------------------------------------------------------

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _crossChainInitiate(
      fromToken,
      inputAmount,
      firstMinimumOutputAmount,
      wormholeRecipientChain,
      toOwner,
      0 //wormholeNonce
    );
  }

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bytes16 memo
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _crossChainInitiate(
      fromToken,
      inputAmount,
      firstMinimumOutputAmount,
      wormholeRecipientChain,
      toOwner,
      0 //wormholeNonce
    );
    emit MemoInteraction(memo);
  }

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    uint32 wormholeNonce
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _crossChainInitiate(
      fromToken,
      inputAmount,
      firstMinimumOutputAmount,
      wormholeRecipientChain,
      toOwner,
      wormholeNonce
    );
  }

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    uint32 wormholeNonce,
    bytes16 memo
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _crossChainInitiate(
      fromToken,
      inputAmount,
      firstMinimumOutputAmount,
      wormholeRecipientChain,
      toOwner,
      wormholeNonce
    );
    emit MemoInteraction(memo);
  }

  function _crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    uint32 wormholeNonce
  ) internal returns (uint swimUsdAmount, uint64 wormholeSequence) {
    address swimUsdAddress_ = swimUsdAddress;
    swimUsdAmount = acquireAndMaybeSwap(
      fromToken,
      inputAmount,
      firstMinimumOutputAmount,
      swimUsdAddress_
    );

    //old way of not going through the Solana Routing contract but doing a direct transfer
    // leaving in for testing purposes / as a workaround for now.
    // if (wormholeRecipientChain == WORMHOLE_SOLANA_CHAIN_ID) {
    //   IERC20(swimUsdAddress_).safeApprove(address(tokenBridge), swimUsdAmount);

    //   try
    //     tokenBridge.transferTokens{value: msg.value}(
    //       swimUsdAddress_,
    //       swimUsdAmount,
    //       WORMHOLE_SOLANA_CHAIN_ID,
    //       toOwner,
    //       0, //arbiterFee
    //       wormholeNonce
    //     )
    //   returns (uint64 _wormholeSequence) {
    //     wormholeSequence = _wormholeSequence;
    //   } catch (bytes memory lowLevelData) {
    //     revert WormholeInteractionFailed(lowLevelData);
    //   }
    //   ++wormholeNonce;
    // } else {
    wormholeSequence = wormholeTransferWithPayload(
      swimUsdAmount,
      wormholeRecipientChain,
      SwimPayloadConversion.encode(toOwner),
      wormholeNonce,
      swimUsdAddress_
    );
    // }
  }

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _propellerInitiate(
      fromToken,
      inputAmount,
      wormholeRecipientChain,
      toOwner,
      gasKickstart,
      maxPropellerFee,
      toTokenNumber,
      0, //wormholeNonce
      bytes16(0)
    );
  }

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber,
    bytes16 memo
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _propellerInitiate(
      fromToken,
      inputAmount,
      wormholeRecipientChain,
      toOwner,
      gasKickstart,
      maxPropellerFee,
      toTokenNumber,
      0, //wormholeNonce
      memo
    );
    emit MemoInteraction(memo);
  }

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber,
    uint32 wormholeNonce
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _propellerInitiate(
      fromToken,
      inputAmount,
      wormholeRecipientChain,
      toOwner,
      gasKickstart,
      maxPropellerFee,
      toTokenNumber,
      wormholeNonce,
      bytes16(0)
    );
  }

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber,
    uint32 wormholeNonce,
    bytes16 memo
  ) external payable whenNotPaused returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _propellerInitiate(
      fromToken,
      inputAmount,
      wormholeRecipientChain,
      toOwner,
      gasKickstart,
      maxPropellerFee,
      toTokenNumber,
      wormholeNonce,
      memo
    );
    emit MemoInteraction(memo);
  }

  function _propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber,
    uint32 wormholeNonce,
    bytes16 memo
  ) internal returns (uint swimUsdAmount, uint64 wormholeSequence) {
    address swimUsdAddress_ = swimUsdAddress;
    swimUsdAmount = acquireAndMaybeSwap(fromToken, inputAmount, 0, swimUsdAddress_);

    bytes memory encodedPayload = memo != bytes16(0)
      ? SwimPayloadConversion.encode(toOwner, gasKickstart, maxPropellerFee, toTokenNumber, memo)
      : SwimPayloadConversion.encode(toOwner, gasKickstart, maxPropellerFee, toTokenNumber);

    wormholeSequence = wormholeTransferWithPayload(
      swimUsdAmount,
      wormholeRecipientChain,
      encodedPayload,
      wormholeNonce,
      swimUsdAddress_
    );
  }

  // ----------------------------- COMPLETE --------------------------------------------------------

  function crossChainComplete(
    bytes calldata encodedVm,
    address toToken,
    uint minimumOutputAmount
  ) external whenNotPaused returns (uint outputAmount, address outputToken) {
    (outputAmount, outputToken) = _crossChainComplete(encodedVm, toToken, minimumOutputAmount);
  }

  function crossChainComplete(
    bytes calldata encodedVm,
    address toToken,
    uint minimumOutputAmount,
    bytes16 memo
  ) external whenNotPaused returns (uint outputAmount, address outputToken) {
    (outputAmount, outputToken) = _crossChainComplete(encodedVm, toToken, minimumOutputAmount);
    emit MemoInteraction(memo);
  }

  //If swap fails, user receives swimUsd token
  //overrides propeller payload information if included
  function _crossChainComplete(
    bytes calldata encodedVm,
    address toToken,
    uint minimumOutputAmount
  ) internal returns (uint outputAmount, address outputToken) {
    (uint swimUsdAmount, SwimPayload memory swimPayload) = wormholeCompleteTransfer(encodedVm);
    address swimUsdAddress_ = swimUsdAddress;

    if (msg.sender != swimPayload.toOwner)
      revert SenderIsNotOwner(msg.sender, swimPayload.toOwner);

    outputAmount = swimUsdAmount;
    outputToken = swimUsdAddress_;
    if (toToken != swimUsdAddress_) {
      (IPool pool, uint8 toIndex) = getPoolAndIndex(toToken);
      IERC20(swimUsdAddress_).safeApprove(address(pool), swimUsdAmount);
      try pool.swap(swimUsdAmount, SWIM_USD_TOKEN_INDEX, toIndex, minimumOutputAmount) returns (
        uint outputAmount_
      ) {
        outputAmount = outputAmount_;
        outputToken = toToken;
      }
      catch {
        //in case of slippage send user swimUsd instead
      }
    }

    IERC20(outputToken).safeTransfer(msg.sender, outputAmount);
  }

  function propellerComplete(
    bytes calldata encodedVm
  ) external payable whenNotPaused returns (uint outputAmount, address outputToken) { unchecked {
    uint startGas = gasleft();
    (uint swimUsdAmount, SwimPayload memory swimPayload) = wormholeCompleteTransfer(encodedVm);
    address swimUsdAddress_ = swimUsdAddress;

    if (!swimPayload.propellerEnabled)
      revert NotAPropellerTransaction();

    if (swimPayload.gasKickstart) {
      if (msg.value != GAS_KICKSTART_AMOUNT)
        revert IncorrectMessageValue(msg.value, GAS_KICKSTART_AMOUNT);
      (bool success, ) = swimPayload.toOwner.call{value: GAS_KICKSTART_AMOUNT}("");
      if (!success)
        revert GasKickstartFailed(swimPayload.toOwner);
    }
    else if (msg.value != 0)
      revert IncorrectMessageValue(msg.value, 0);

    uint16 toTokenNumber = SWIM_USD_TOKEN_NUMBER;
    TokenInfo memory toTokenInfo;
    outputToken = swimUsdAddress_;
    if (swimPayload.toTokenNumber != SWIM_USD_TOKEN_NUMBER) {
      toTokenInfo = tokenNumberMapping[swimPayload.toTokenNumber];
      if (toTokenInfo.tokenNumber != 0) {
        //if toTokenNumber in swimPayload was invalid for whatever reason then just return
        // swimUsd to prevent propeller transaction from getting stuck
        toTokenNumber = toTokenInfo.tokenNumber; //same as swimPayload.toTokenNumber
        outputToken = toTokenInfo.tokenAddress;
      }
    }

    //emit here instead of at the end to have it included in dynamic gas cost calculation
    if (swimPayload.memo != bytes16(0))
      emit MemoInteraction(swimPayload.memo);

    uint swimUsdPerGasToken = propellerFeeConfig.method == GasTokenPriceMethod.UniswapOracle
      ? swimUsdPerGasTokenUniswap()
      : propellerFeeConfig.fixedSwimUsdPerGasToken;
    uint feeAmount =
      propellerFeeConfig.serviceFee + calcSwimUsdGasFee(startGas, swimUsdPerGasToken, swimPayload);

    if (feeAmount > swimPayload.maxPropellerFee)
      feeAmount = swimPayload.maxPropellerFee;

    if (feeAmount > swimUsdAmount)
      //we don't rely on SwimPayload to be composed sensibly (i.e. maxPropellerFee should be less
      // than or equal the bridged SwimUSD amount if the SwimPayload was composed sensibly, but we
      // don't actually (have to) enforce it)
      feeAmount = swimUsdAmount;

    engineFees[msg.sender] += feeAmount;

    //There is this slightly awkward and exceedingly rare edge case where feeAmount without the
    // swap fee is smaller than swimUsdAmount but feeAmount including the swap fee is larger than
    // swimUsdAmount and so we charge the user for a swap (of what would be an utterly marginal
    // amount of SwimUSD) that then doesn't actually happen..
    //But it's so insignificant (both in terms of probability as well as impact) that it really
    // does not make sense to worry about it beyond the scope of this comment.
    if (feeAmount < swimUsdAmount) {
      outputAmount = (toTokenNumber != SWIM_USD_TOKEN_NUMBER)
        ? swap(
            IPool(toTokenInfo.poolAddress),
            swimUsdAddress_,
            swimUsdAmount - feeAmount,
            SWIM_USD_TOKEN_INDEX,
            toTokenInfo.tokenIndexInPool,
            0 //no slippage for propeller
          )
        : swimUsdAmount - feeAmount;
      IERC20(outputToken).safeTransfer(swimPayload.toOwner, outputAmount);
    }
    else
      outputAmount = 0;
  }}

  // ----------------------------- ENGINE ----------------------------------------------------------

  function claimFees() external whenNotPaused { unchecked {
    uint feeAmount = engineFees[msg.sender];
    engineFees[msg.sender] = 0;
    IERC20(swimUsdAddress).safeTransfer(msg.sender, feeAmount);
  }}

  // ----------------------------- GOVERNANCE ------------------------------------------------------

  function registerToken(
    uint16 tokenNumber,
    address tokenAddress,
    address poolAddress
  ) external onlyOwner {
    if (tokenNumber == 0 || tokenAddress == address(0) || poolAddress == address(0))
      revert InvalidZeroValue();

    uint8 tokenIndexInPool = 0;
    PoolState memory state = IPool(poolAddress).getState();
    //skip first token because it's always swimUSD
    for (uint i = 1; i < state.balances.length; ++i)
      if (state.balances[i].tokenAddress == tokenAddress) {
        tokenIndexInPool = uint8(i);
        break;
      }

    if (tokenIndexInPool == 0)
      revert TokenNotInPool(tokenAddress, poolAddress);

    TokenInfo memory token = tokenNumberMapping[tokenNumber];
    token.tokenNumber = tokenNumber;
    token.tokenAddress = tokenAddress;
    token.poolAddress = poolAddress;
    token.tokenIndexInPool = tokenIndexInPool;

    address oldTokenAddress = tokenNumberMapping[tokenNumber].tokenAddress;
    uint16 oldTokenNumber = tokenAddressMapping[tokenAddress].tokenNumber;
    if (oldTokenAddress != address(0) && oldTokenAddress != tokenAddress)
      delete tokenAddressMapping[oldTokenAddress];
    if (oldTokenNumber != 0 && oldTokenNumber != tokenNumber)
      delete tokenNumberMapping[oldTokenNumber];

    tokenNumberMapping[tokenNumber] = token;
    tokenAddressMapping[tokenAddress] = token;

    emit TokenRegistered(tokenNumber, tokenAddress, poolAddress);
  }

  function adjustPropellerServiceFee(uint64 serviceFee) external onlyOwner {
    propellerFeeConfig.serviceFee = serviceFee;

    emit PropellerServiceFeeChanged(serviceFee);
  }

  function usePropellerFixedGasTokenPrice(
    Decimal calldata fixedSwimUsdPerGasToken //atomic swimUsd per wei ETH
  ) external onlyOwner {
    updatePropellerGasTokenPriceMethod(GasTokenPriceMethod.FixedPrice);
    propellerFeeConfig.fixedSwimUsdPerGasToken = fixedSwimUsdPerGasToken.decimals < PRECISION
      ? fixedSwimUsdPerGasToken.value * 10 ** (PRECISION - fixedSwimUsdPerGasToken.decimals)
      : fixedSwimUsdPerGasToken.value / 10 ** (fixedSwimUsdPerGasToken.decimals - PRECISION);

    emit PropellerFixedSwimUsdPerGasTokenChanged(fixedSwimUsdPerGasToken);
  }

  function usePropellerUniswapOracle(
    address intermediateToken,
    address uniswapPoolAddress
  ) external onlyOwner {
    (IPool swimPool, uint8 swimIntermediateIndex) = getPoolAndIndex(intermediateToken);
    IUniswapV3Pool uniswapPool = IUniswapV3Pool(uniswapPoolAddress);

    bool uniswapIntermediateIsFirst;
    if (intermediateToken == uniswapPool.token0())
      uniswapIntermediateIsFirst = true;
    else if (intermediateToken == uniswapPool.token1())
      uniswapIntermediateIsFirst = false;
    else
      revert TokenNotInPool(intermediateToken, uniswapPoolAddress);

    updatePropellerGasTokenPriceMethod(GasTokenPriceMethod.UniswapOracle);
    propellerFeeConfig.uniswap.swimPool = swimPool;
    propellerFeeConfig.uniswap.swimIntermediateIndex = swimIntermediateIndex;
    propellerFeeConfig.uniswap.uniswapPool = uniswapPool;
    propellerFeeConfig.uniswap.uniswapIntermediateIsFirst = uniswapIntermediateIsFirst;

    emit PropellerUniswapFeeConfigChanged(intermediateToken, uniswapPoolAddress);
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  // ----------------------------- INTERNAL --------------------------------------------------------

  function swap(
    IPool pool,
    address fromToken,
    uint inputAmount,
    uint8 fromIndex,
    uint8 toIndex,
    uint minimumOutputAmount
  ) internal returns (uint outputAmount) {
    IERC20(fromToken).safeApprove(address(pool), inputAmount);
    outputAmount = pool.swap(inputAmount, fromIndex, toIndex, minimumOutputAmount);
  }

  function acquireAndMaybeSwap(
    address fromToken,
    uint inputAmount,
    uint minimumOutputAmount,
    address swimUsdAddress_
  ) internal returns (uint swimUsdAmount) {
    IERC20(fromToken).safeTransferFrom(msg.sender, address(this), inputAmount);

    if (fromToken != swimUsdAddress_) {
      (IPool pool, uint8 fromIndex) = getPoolAndIndex(fromToken);
      swimUsdAmount = swap(
        pool,
        fromToken,
        inputAmount,
        fromIndex,
        SWIM_USD_TOKEN_INDEX,
        minimumOutputAmount
      );
    }
    else
      swimUsdAmount = inputAmount;
  }

  function wormholeTransferWithPayload(
    uint swimUsdAmount,
    uint16 wormholeRecipientChain,
    bytes memory swimPayload,
    uint32 wormholeNonce,
    address swimUsdAddress_
  ) internal returns (uint64 wormholeSequence) {
    IERC20(swimUsdAddress_).safeApprove(address(tokenBridge), swimUsdAmount);

    bytes32 routingContract = (wormholeRecipientChain == WORMHOLE_SOLANA_CHAIN_ID)
      ? ROUTING_CONTRACT_SOLANA_ADDRESS
      : bytes32(uint(uint160(address(this))));

    try
      tokenBridge.transferTokensWithPayload{value: msg.value}(
        swimUsdAddress_,
        swimUsdAmount,
        wormholeRecipientChain,
        routingContract,
        wormholeNonce,
        swimPayload
      )
    returns (uint64 wormholeSequence_) {
      wormholeSequence = wormholeSequence_;
    }
    catch Panic(uint errorCode) {
      revert WormholeInteractionFailed(abi.encode(errorCode));
    }
    catch (bytes memory lowLevelData) {
      revert WormholeInteractionFailed(lowLevelData);
    }
  }

  function wormholeCompleteTransfer(
    bytes memory encodedVm
  ) internal returns (uint swimUsdAmount, SwimPayload memory swimPayload) {
    try
      tokenBridge.completeTransferWithPayload(encodedVm)
    returns (bytes memory encodedTokenBridgePayload) {
      bytes32 tokenOriginAddress;
      uint16 tokenOriginChain;
      (swimUsdAmount, tokenOriginAddress, tokenOriginChain, swimPayload) = SwimPayloadConversion
        .decode(encodedTokenBridgePayload);
      if (
        tokenOriginAddress != SWIM_USD_SOLANA_ADDRESS ||
        tokenOriginChain != WORMHOLE_SOLANA_CHAIN_ID
      )
        revert InvalidWormholeToken(
          tokenOriginAddress,
          tokenOriginChain,
          SWIM_USD_SOLANA_ADDRESS,
          WORMHOLE_SOLANA_CHAIN_ID
        );
    }
    catch Panic(uint errorCode) {
      revert WormholeInteractionFailed(abi.encode(errorCode));
    }
    catch (bytes memory lowLevelData) {
      revert WormholeInteractionFailed(lowLevelData);
    }
  }

  function updatePropellerGasTokenPriceMethod(GasTokenPriceMethod newMethod) internal {
    if (propellerFeeConfig.method != newMethod) {
      propellerFeeConfig.method = newMethod;
      emit PropellerGasTokenPriceMethodChanged(newMethod);
    }
  }

  // ----------------------------- INTERNAL VIEW/PURE ----------------------------------------------

  // @return swimUsdPerGasToken with PRECISION decimals
  function swimUsdPerGasTokenUniswap() internal view returns (uint swimUsdPerGasToken) { unchecked {
    //this function is a bit of a clusterfuck due to the wide range of prices that can
    // _theoretically_ be returned by our oracles (swimPool and Uniswap) and because uniswap pools
    // use binary fixed point (64.96 bits) while swim pools use decimal values (dynamic)

    UniswapOracleParams memory uniswap = propellerFeeConfig.uniswap;

    //price are given in LP/i-token
    Decimal[] memory marginalPrices = uniswap.swimPool.getMarginalPrices();
    Decimal memory swimUsdPrice = marginalPrices[SWIM_USD_TOKEN_INDEX];
    Decimal memory intermediatePrice = marginalPrices[uniswap.swimIntermediateIndex];
    //marginalPrice[SWIM_USD_TOKEN_INDEX] is guaranteed to use at most 176 bits
    uint swimUsdPerIntermediate = (
      intermediatePrice.value * 10**(PRECISION - intermediatePrice.decimals + swimUsdPrice.decimals)
    ) / swimUsdPrice.value;
    if (swimUsdPerIntermediate >= BIT128)
      //This is strictly speaking not necessarily an error, however if the values are so incredibly
      // lopsided then something is definitely amiss and so we might as well bail.
      revert NumericError(
        CodeLocation.DetermineGasCostViaUniswap1,
        abi.encode(swimUsdPrice, intermediatePrice)
      );
    //swimUsdPerIntermediate now guaranteed to use at most 128 bits

    //uniswap sqrtPrice is sqrt(token1/token0) using atomic units!
    (uint160 sqrtPriceX96,,,,,,) = uniswap.uniswapPool.slot0();

    uint uniswapPrice;
    uint fractionalBits;
    if (sqrtPriceX96 < BIT128) {
      //if sqrtPriceX96 takes less than 16 bytes we can safely square it
      uniswapPrice = uint(sqrtPriceX96) * uint(sqrtPriceX96);
      fractionalBits = 192;
    }
    else {
      //if sqrtPriceX96 takes between 16 and 20 bytes, we rightshift by 32 before squaring
      uniswapPrice = (sqrtPriceX96 >> 32);
      uniswapPrice = uniswapPrice * uniswapPrice;
      fractionalBits = 128;
    }

    if (uniswap.uniswapIntermediateIsFirst) {
      //uniswap price = gas token per intermediate token
      while (swimUsdPerIntermediate < BIT224 && fractionalBits > 0) {
        swimUsdPerIntermediate <<= 32;
        fractionalBits -= 32;
      }
      uniswapPrice >>= fractionalBits;
      if (uniswapPrice == 0)
        revert NumericError(
          CodeLocation.DetermineGasCostViaUniswap2,
          abi.encode(swimUsdPrice, intermediatePrice, sqrtPriceX96)
        );

      swimUsdPerGasToken = swimUsdPerIntermediate / uniswapPrice;
    }
    else {
      //uniswap price = intermediate token per gas token
      while (uniswapPrice >= BIT96 && fractionalBits > 0) {
        uniswapPrice >>= 32;
        fractionalBits -= 32;
      }
      //uniswapPrice now uses at most 128 bits
      swimUsdPerGasToken = (swimUsdPerIntermediate * uniswapPrice) >> fractionalBits;
    }
  }}

  function calcSwimUsdGasFee(
    uint startGas,
    uint swimUsdPerGasToken,
    SwimPayload memory swimPayload
  ) internal view returns (uint swimUsdGasFee) {
    uint gasTokenCost = 0;
    uint consumedGas = startGas;

    unchecked {
      uint remuneratedGasPrice =
        block.chainid == BNB_MAINNET_CHAINID || block.chainid == BNB_TESTNET_CHAINID
        ? BNB_GAS_PRICE
        : block.basefee + PROPELLER_GAS_TIP;

      //gas is not an intended source of profit for engines
      if (remuneratedGasPrice > tx.gasprice)
        remuneratedGasPrice = tx.gasprice;

      consumedGas += GAS_COST_BASE;
      if (swimPayload.toTokenNumber != SWIM_USD_TOKEN_NUMBER)
        consumedGas += GAS_COST_POOL_SWAP;

      if (swimPayload.gasKickstart)
        gasTokenCost += GAS_KICKSTART_AMOUNT;
      consumedGas -= gasleft();
      gasTokenCost += remuneratedGasPrice * consumedGas;
    }
    swimUsdGasFee = (gasTokenCost * swimUsdPerGasToken) / PRECISION_MULTIPLIER; //SafeMath!
  }

  function getPoolAndIndex(address token) internal view returns (IPool, uint8) {
    TokenInfo memory info = tokenAddressMapping[token];
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
}
