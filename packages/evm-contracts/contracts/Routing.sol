//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IRouting.sol";
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
  struct TokenInfo {
    uint16  tokenNumber;
    address tokenAddress;
    address poolAddress;
    uint8   tokenIndexInPool;
  }

  enum GasRemunerationMethod {
    FlatFee,
    UniswapOracle
  }

  //uses one slot
  struct FlatFeeParams { //all specified in swimUSD
    uint64 baseFee;
    uint64 gasKickstartFee;
    uint64 swapFee;
  }

  //uses two slots
  struct UniswapOracleParams {
    //swimUSD -> intermediate token (via swim pool) -> gas token (via uniswap)
    IPool          swimPool;
    uint8          swimIntermediateIndex;
    IUniswapV3Pool uniswapPool;
    bool           uniswapIntermediateIsFirst;
  }

  struct PropellerFeeConfig {
    uint64                serviceFee; //specified in swimUSD
    GasRemunerationMethod method;
    FlatFeeParams         flat;
    UniswapOracleParams   uniswap;
  }

  using SafeERC20 for IERC20;

  uint private constant GAS_COST_BASE = 100000; //TODO determine decent estimate
  uint private constant GAS_COST_POOL_SWAP = 125000; //defensive but realistic estimate
  uint private constant GAS_KICKSTART_AMOUNT = 0.05 ether;
  uint private constant PROPELLER_GAS_TIP = 1 gwei;

  uint private constant BIT224 = 1 << 224;
  uint private constant BIT128 = 1 << 128;
  uint private constant BIT96  = 1 << 96;

  //slot0
  address public /*immutable*/ swimUsdAddress;
  //slot1
  ITokenBridge public /*immutable*/ tokenBridge;
  uint32       private wormholeNonce;
  //remaining slots
  PropellerFeeConfig private propellerFeeConfig;
  uint256[50]        private reservedSlotsForAdditionalPropellerFeeRemunerationMethodConfigs;

  mapping(uint16  => TokenInfo) public tokenNumberMapping;
  mapping(address => TokenInfo) public tokenAddressMapping;
  mapping(address => uint)      public engineFees;

  function initialize(
    address owner,
    address tokenBridgeAddress,
    uint64 propellerServiceFee,
    FlatFeeParams memory flatFeeParams
  ) public initializer {
    __Pausable_init();
    __Ownable_init();
    _transferOwnership(owner);
    wormholeNonce = 0;
    tokenBridge = ITokenBridge(tokenBridgeAddress);
    swimUsdAddress = tokenBridge.wrappedAsset(WORMHOLE_SOLANA_CHAIN_ID, SWIM_USD_SOLANA_ADDRESS);
    if (swimUsdAddress == address(0))
      revert SwimUsdNotAttested();
    propellerFeeConfig.serviceFee = propellerServiceFee;
    propellerFeeConfig.method = GasRemunerationMethod.FlatFee;
    propellerFeeConfig.flat = flatFeeParams;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  function getPoolStates(
    address[] memory poolAddresses
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
    address _swimUsdAddress = swimUsdAddress;

    uint8 fromIndex;
    uint8 toIndex;
    IPool pool;

    if (fromToken == _swimUsdAddress) {
      fromIndex = SWIM_USD_TOKEN_INDEX;
      (pool, toIndex) = getPoolAndIndex(toToken);
    }
    else if (toToken == _swimUsdAddress) {
      toIndex = SWIM_USD_TOKEN_INDEX;
      (pool, fromIndex) = getPoolAndIndex(fromToken);
    }
    else {
      (pool, fromIndex) = getPoolAndIndex(fromToken);
      IPool fromPool = pool;
      (pool, toIndex) = getPoolAndIndex(toToken);
      if (fromPool != pool) {
        inputAmount = swap(fromPool, fromToken, inputAmount, fromIndex, SWIM_USD_TOKEN_INDEX, 0);
        fromToken = _swimUsdAddress;
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
      toOwner
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
      toOwner
    );
    emit MemoInteraction(memo);
  }

  function _crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner
  ) internal returns (uint swimUsdAmount, uint64 wormholeSequence) {
    address _swimUsdAddress = swimUsdAddress;
    swimUsdAmount = acquireAndMaybeSwap(
      fromToken,
      inputAmount,
      firstMinimumOutputAmount,
      _swimUsdAddress
    );

    if (wormholeRecipientChain == WORMHOLE_SOLANA_CHAIN_ID) {
      IERC20(_swimUsdAddress).safeApprove(address(tokenBridge), swimUsdAmount);

      try
        tokenBridge.transferTokens{value: msg.value}(
          _swimUsdAddress,
          swimUsdAmount,
          WORMHOLE_SOLANA_CHAIN_ID,
          toOwner,
          0, //arbiterFee
          wormholeNonce
        )
      returns (uint64 _wormholeSequence) {
        wormholeSequence = _wormholeSequence;
      } catch (bytes memory lowLevelData) {
        revert WormholeInteractionFailed(lowLevelData);
      }
      ++wormholeNonce;
    } else {
      wormholeSequence = wormholeTransferWithPayload(
        swimUsdAmount,
        wormholeRecipientChain,
        SwimPayloadConversion.encode(toOwner),
        _swimUsdAddress
      );
    }
  }

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence) {
    (swimUsdAmount, wormholeSequence) = _propellerInitiate(
      fromToken,
      inputAmount,
      wormholeRecipientChain,
      toOwner,
      gasKickstart,
      maxPropellerFee,
      toTokenNumber,
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
    bytes16 memo
  ) internal returns (uint swimUsdAmount, uint64 wormholeSequence) {
    address _swimUsdAddress = swimUsdAddress;
    swimUsdAmount = acquireAndMaybeSwap(fromToken, inputAmount, 0, _swimUsdAddress);

    bytes memory encodedPayload = memo != bytes16(0)
      ? SwimPayloadConversion.encode(toOwner, gasKickstart, maxPropellerFee, toTokenNumber, memo)
      : SwimPayloadConversion.encode(toOwner, gasKickstart, maxPropellerFee, toTokenNumber);

    wormholeSequence = wormholeTransferWithPayload(
      swimUsdAmount,
      wormholeRecipientChain,
      encodedPayload,
      _swimUsdAddress
    );
  }

  // ----------------------------- COMPLETE --------------------------------------------------------

  function crossChainComplete(
    bytes memory encodedVm,
    address toToken,
    uint minimumOutputAmount
  ) external whenNotPaused returns (uint outputAmount, address outputToken) {
    (outputAmount, outputToken) = _crossChainComplete(encodedVm, toToken, minimumOutputAmount);
  }

  function crossChainComplete(
    bytes memory encodedVm,
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
    bytes memory encodedVm,
    address toToken,
    uint minimumOutputAmount
  ) internal returns (uint outputAmount, address outputToken) {
    (uint swimUsdAmount, SwimPayload memory swimPayload) = wormholeCompleteTransfer(encodedVm);
    address _swimUsdAddress = swimUsdAddress;

    if (msg.sender != swimPayload.toOwner)
      revert SenderIsNotOwner(msg.sender, swimPayload.toOwner);

    outputAmount = swimUsdAmount;
    outputToken = _swimUsdAddress;
    if (toToken != _swimUsdAddress) {
      (IPool pool, uint8 toIndex) = getPoolAndIndex(toToken);
      IERC20(_swimUsdAddress).safeApprove(address(pool), swimUsdAmount);
      try pool.swap(swimUsdAmount, SWIM_USD_TOKEN_INDEX, toIndex, minimumOutputAmount) returns (
        uint _outputAmount
      ) {
        outputAmount = _outputAmount;
        outputToken = toToken;
      }
      catch {
        //in case of slippage send user swimUsd instead
      }
    }

    IERC20(outputToken).safeTransfer(msg.sender, outputAmount);
  }

  function propellerComplete(
    bytes memory encodedVm
  ) external payable whenNotPaused returns (uint outputAmount, address outputToken) { unchecked {
    uint startGas = gasleft();
    (uint swimUsdAmount, SwimPayload memory swimPayload) = wormholeCompleteTransfer(encodedVm);
    address _swimUsdAddress = swimUsdAddress;

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
    outputToken = _swimUsdAddress;
    if (swimPayload.toTokenNumber != SWIM_USD_TOKEN_NUMBER) {
      toTokenInfo = tokenNumberMapping[swimPayload.toTokenNumber];
      if (toTokenInfo.tokenNumber != 0) {
        //if toTokenNumber in swimPayload was invalid for whatever reason then just return
        //swimUsd to prevent propeller transaction from getting stuck
        toTokenNumber = toTokenInfo.tokenNumber; //same as swimPayload.toTokenNumber
        outputToken = toTokenInfo.tokenAddress;
      }
    }

    uint feeAmount = propellerFeeConfig.serviceFee;
    if (propellerFeeConfig.method == GasRemunerationMethod.UniswapOracle)
      feeAmount += calcSwimUsdGasFee(startGas, swimUsdPerGasTokenUniswap(), swimPayload);
    else {
      feeAmount += uint(propellerFeeConfig.flat.baseFee);
      if (swimPayload.gasKickstart)
        feeAmount += uint(propellerFeeConfig.flat.gasKickstartFee);
      if (swimPayload.toTokenNumber != SWIM_USD_TOKEN_NUMBER)
        feeAmount += uint(propellerFeeConfig.flat.swapFee);
    }

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
            _swimUsdAddress,
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

    if (swimPayload.memo != bytes16(0))
      emit MemoInteraction(swimPayload.memo);
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

  function adjustPropellerServiceFee(uint64 serviceFee) external onlyOwner {
    propellerFeeConfig.serviceFee = serviceFee;
  }

  function usePropellerFlatFee(
    uint64 baseFee,
    uint64 gasKickstartFee,
    uint64 swapFee
  ) external onlyOwner {
    //TODO checks?
    propellerFeeConfig.method = GasRemunerationMethod.FlatFee;
    propellerFeeConfig.flat.baseFee = baseFee;
    propellerFeeConfig.flat.gasKickstartFee = gasKickstartFee;
    propellerFeeConfig.flat.swapFee = swapFee;
  }

  function usePropellerUniswapOracle(
    address intermediateToken,
    address uniswapPoolAddress,
    bool uniswapIntermediateIsFirst
  ) external onlyOwner {
    //TODO checks?
    (IPool swimPool, uint8 swimIntermediateIndex) = getPoolAndIndex(intermediateToken);

    IUniswapV3Pool uniswapPool = IUniswapV3Pool(uniswapPoolAddress);
    address uniswapIntermediate = uniswapIntermediateIsFirst
      ? uniswapPool.token0()
      : uniswapPool.token1();

    if (intermediateToken != uniswapIntermediate)
      revert TokenMismatch(intermediateToken, uniswapIntermediate);

    propellerFeeConfig.method = GasRemunerationMethod.UniswapOracle;
    propellerFeeConfig.uniswap.swimPool = swimPool;
    propellerFeeConfig.uniswap.swimIntermediateIndex = swimIntermediateIndex;
    propellerFeeConfig.uniswap.uniswapPool = uniswapPool;
    propellerFeeConfig.uniswap.uniswapIntermediateIsFirst = uniswapIntermediateIsFirst;
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
    address _swimUsdAddress
  ) internal returns (uint swimUsdAmount) {
    IERC20(fromToken).safeTransferFrom(msg.sender, address(this), inputAmount);

    if (fromToken != _swimUsdAddress) {
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
    address _swimUsdAddress
  ) internal returns (uint64 wormholeSequence) {
    IERC20(_swimUsdAddress).safeApprove(address(tokenBridge), swimUsdAmount);

    bytes32 routingContract = (wormholeRecipientChain == WORMHOLE_SOLANA_CHAIN_ID)
      ? ROUTING_CONTRACT_SOLANA_ADDRESS
      : bytes32(uint(uint160(address(this))));

    try
      tokenBridge.transferTokensWithPayload{value: msg.value}(
        _swimUsdAddress,
        swimUsdAmount,
        wormholeRecipientChain,
        routingContract,
        wormholeNonce,
        swimPayload
      )
    returns (uint64 _wormholeSequence) {
      wormholeSequence = _wormholeSequence;
    }
    catch (bytes memory lowLevelData) {
      revert WormholeInteractionFailed(lowLevelData);
    }
    ++wormholeNonce;
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
    catch (bytes memory lowLevelData) {
      revert WormholeInteractionFailed(lowLevelData);
    }
  }

  // ----------------------------- INTERNAL VIEW/PURE ----------------------------------------------

  // @return swimUsdPerGasToken with 18 decimals
  function swimUsdPerGasTokenUniswap() internal view returns (uint swimUsdPerGasToken) { unchecked {
    //this function is a bit of a clusterfuck due to the wide range of prices
    // that can _theoretically_ be returned by our oracles (swimPool and Uniswap)
    // and because uniswap pools use binary fixed point (64.96 bits) while swim pools
    // use decimal values (35.18 decimal digits . i.e. at most 176 bits)

    UniswapOracleParams memory uniswap = propellerFeeConfig.uniswap;

    uint[] memory marginalPrices = uniswap.swimPool.getMarginalPrices();
    //marginalPrice[SWIM_USD_TOKEN_INDEX] is guaranteed to use at most 176 bits
    uint swimUsdPerIntermediate = (marginalPrices[SWIM_USD_TOKEN_INDEX] *
      MARGINAL_PRICE_MULTIPLIER) / marginalPrices[uniswap.swimIntermediateIndex];
    if (swimUsdPerIntermediate >= BIT128)
      //this is strictly speaking not necessarily an error, however if the values are
      // so incredibly lop-sided then something is definitely amiss and so we might as well bail
      revert NumericError(
        CodeLocation.DetermineGasCostViaUniswap1,
        abi.encode(
          marginalPrices[SWIM_USD_TOKEN_INDEX],
          marginalPrices[uniswap.swimIntermediateIndex]
        )
      );
    //swimUsdPerIntermediate now guaranteed to use at most 128 bits

    (uint160 sqrtPriceX96,,,,,,) = uniswap.uniswapPool.slot0();

    uint uniswapPrice;
    uint fractionalBits;
    if (sqrtPriceX96 < BIT128) {
      //if sqrtPriceX96 takes less than 16 bytes we can safely square it
      uniswapPrice = sqrtPriceX96 * sqrtPriceX96;
      fractionalBits = 196;
    }
    else {
      //if sqrtPriceX96 takes between 16 and 20 bytes, we rightshift by 32 before squaring
      uniswapPrice = (sqrtPriceX96 >> 32);
      uniswapPrice = uniswapPrice * uniswapPrice;
      fractionalBits = 128;
    }

    if (uniswap.uniswapIntermediateIsFirst) {
      //uniswap price = intermediate token per gas token
      while (uniswapPrice >= BIT96 && fractionalBits > 0) {
        uniswapPrice >>= 32;
        fractionalBits -= 32;
      }
      //uniswapPrice now uses at most 128 bits
      swimUsdPerGasToken = (swimUsdPerIntermediate * uniswapPrice) >> fractionalBits;
    }
    else {
      //uniswap price = gas token per intermediate token
      while (swimUsdPerIntermediate < BIT224 && fractionalBits > 0) {
        swimUsdPerIntermediate <<= 32;
        fractionalBits -= 32;
      }
      uniswapPrice >>= fractionalBits;
      if (uniswapPrice == 0)
        revert NumericError(
          CodeLocation.DetermineGasCostViaUniswap2,
          abi.encode(
            marginalPrices[SWIM_USD_TOKEN_INDEX],
            marginalPrices[uniswap.swimIntermediateIndex],
            sqrtPriceX96
          )
        );

      swimUsdPerGasToken = swimUsdPerIntermediate / uniswapPrice;
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
      uint remuneratedGasPrice = block.basefee + PROPELLER_GAS_TIP;

      consumedGas += GAS_COST_BASE;
      if (swimPayload.toTokenNumber != SWIM_USD_TOKEN_NUMBER)
        consumedGas += GAS_COST_POOL_SWAP;

      if (swimPayload.gasKickstart)
        gasTokenCost += GAS_KICKSTART_AMOUNT;
      consumedGas -= gasleft();
      gasTokenCost += remuneratedGasPrice * consumedGas;
    }

    swimUsdGasFee = (gasTokenCost * swimUsdPerGasToken) / MARGINAL_PRICE_MULTIPLIER; //SafeMath!
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
