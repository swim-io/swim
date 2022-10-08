//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./Decimal.sol";
import "./PoolState.sol";
import "./IMemoInteractor.sol";

interface IRouting is IMemoInteractor {
  struct TokenInfo {
    uint16  tokenNumber;
    address tokenAddress;
    address poolAddress;
    uint8   tokenIndexInPool;
  }

  enum GasTokenPriceMethod {
    FixedPrice,
    UniswapOracle
  }

  enum CodeLocation {
    DetermineGasCostViaUniswap1,
    DetermineGasCostViaUniswap2
  }

  error NumericError(CodeLocation location, bytes data);
  error NotAPropellerTransaction();
  error SwimUsdNotAttested();
  error WormholeInteractionFailed(bytes lowLevelData);
  error GasKickstartFailed(address owner);
  error TokenNotInPool(address passedToken, address pool);
  error SenderIsNotOwner(address sender, address owner);
  error IncorrectMessageValue(uint value, uint expected);
  error TokenNotRegistered(bytes20 addressOrTokenNumber);
  error InvalidZeroValue();
  error InvalidWormholeToken(
    bytes32 originAddress,
    uint16 originChain,
    bytes32 expectedToken,
    uint16 expectedChain
  );

  event TokenRegistered(uint16 indexed tokenNumber, address indexed token, address pool);
  event PropellerServiceFeeChanged(uint serviceFee);
  event PropellerGasTokenPriceMethodChanged(GasTokenPriceMethod latest);
  event PropellerFixedSwimUsdPerGasTokenChanged(Decimal fixedSwimUsdPerGasToken);
  event PropellerUniswapFeeConfigChanged(address intermediateToken, address uniswapPool);

  function swimUsdAddress() external view returns (address);
  function engineFees(address engine) external view returns (uint);

  function getPoolStates(address[] memory poolAddresses) external view returns (PoolState[] memory);

  function onChainSwap(
    address fromToken,
    uint inputAmount,
    address toOwner,
    address toToken,
    uint minimumOutputAmount
  ) external returns (uint outputAmount);

  function onChainSwap(
    address fromToken,
    uint inputAmount,
    address toOwner,
    address toToken,
    uint minimumOutputAmount,
    bytes16 memo
  ) external returns (uint outputAmount);

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bytes16 memo
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    uint32 wormholeNonce
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

  function crossChainInitiate(
    address fromToken,
    uint inputAmount,
    uint firstMinimumOutputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    uint32 wormholeNonce,
    bytes16 memo
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber,
    bytes16 memo
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

  function propellerInitiate(
    address fromToken,
    uint inputAmount,
    uint16 wormholeRecipientChain,
    bytes32 toOwner,
    bool gasKickstart,
    uint64 maxPropellerFee,
    uint16 toTokenNumber,
    uint32 wormholeNonce
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

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
  ) external payable returns (uint swimUsdAmount, uint64 wormholeSequence);

  function crossChainComplete(
    bytes memory encodedVm,
    address toToken,
    uint minimumOutputAmount
  ) external returns (uint outputAmount, address outputToken);

  function crossChainComplete(
    bytes memory encodedVm,
    address toToken,
    uint minimumOutputAmount,
    bytes16 memo
  ) external returns (uint outputAmount, address outputToken);

  function propellerComplete(bytes memory encodedVm)
    external
    payable
    returns (uint outputAmount, address outputToken);

  function claimFees() external;

  function registerToken(
    uint16 tokenNumber,
    address tokenAddress,
    address poolAddress
  ) external;

  function adjustPropellerServiceFee(uint64 serviceFee) external;

  function usePropellerFixedGasTokenPrice(Decimal calldata fixedSwimUsdPerGasToken) external;

  function usePropellerUniswapOracle(
    address intermediateToken,
    address uniswapPoolAddress
  ) external;
}
