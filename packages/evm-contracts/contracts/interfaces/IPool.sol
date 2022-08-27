// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./ISwimInteractor.sol";

struct TokenBalance {
  address tokenAddress;
  uint256 balance;
}

struct Decimal {
  uint256 value;
  uint8 decimals;
}

struct PoolState {
  bool paused;
  TokenBalance[] balances;
  TokenBalance totalLpSupply;
  Decimal ampFactor;
  Decimal lpFee;
  Decimal governanceFee;
}

interface IPool is ISwimInteractor {
  event Paused(bool paused);
  event TransferGovernance(address indexed from, address indexed to);
  event ChangeGovernanceFeeRecipient(address indexed governanceFeeRecepient);

  //governance errors:
  error LpTokenInitializationFailed(bytes lowLevelData);
  error FirstTokenNotSwimUSD(address value, address expected);
  error MaxTokenCountExceeded(uint8 value, uint8 maximum);
  error InvalidTokenAddress(address value);
  error TokenEqualizerCountMismatch(uint8 count, uint8 expected);
  error TokenEqualizerTooSmall(int8 equalizer, int8 minimum);
  error TokenEqualizerTooLarge(int8 equalizer, int8 maximum);
  error ConstantProductNotSupportedForTokenCount(uint8 tokenCount);
  error AmpFactorTooSmall(uint32 ampFactor, uint32 minimum);
  error AmpFactorTooLarge(uint32 ampFactor, uint32 maximum);
  error AmpFactorIsFixedForConstantProductPools();
  error AmpFactorTargetTimestampTooSmall(uint32 target, uint32 minimum);
  error AmpFactorRelativeAdjustmentTooLarge(uint32 current, uint32 target, uint32 threshold);
  error TotalFeeTooLarge(uint32 totalFee, uint32 maximum);
  error NonZeroGovernanceFeeButNoRecipient();

  //defi errors:
  error AmountCountMismatch(uint8 count, uint8 expected);
  error InvalidTokenIndex(uint8 tokenIndex, uint8 tokenCount);
  error SlippageExceeded(address token, uint256 amount, uint256 threshold);
  error AmountExceedsSupply(address token, uint256 amount, uint256 poolbalance);
  error RequestedTokenAmountNotZero(uint8 tokenIndex, uint256 amount);
  error InitialAddMustIncludeAllTokens(uint8 missingAmountIndex);

  error IsPaused();
  error GovernanceOnly();

  function getState() external view returns (PoolState memory state);

  function swap(
    uint256 inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function swapExactOutput(
    uint256 maximumInputAmount,
    uint8 inputTokenIndex,
    uint256[] memory outputAmounts
  ) external returns (uint256 inputAmount);

  function swapExactInput(
    uint256[] memory inputAmounts,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function removeUniform(
    uint256 burnAmount,
    uint256[] memory minimumOutputAmounts
  ) external returns (uint256[] memory outputAmounts);

  function removeUniform(
    uint256 burnAmount,
    uint256[] memory minimumOutputAmounts,
    bytes16 memo
  ) external returns (uint256[] memory outputAmounts);

  function add(
    uint256[] memory inputAmounts,
    uint256 minimumMintAmount
  ) external returns (uint256 mintAmount);

  function add(
    uint256[] memory inputAmounts,
    uint256 minimumMintAmount,
    bytes16 memo
  ) external returns (uint256 mintAmount);

  function removeExactOutput(
    uint256[] memory outputAmounts,
    uint256 maximumBurnAmount
  ) external returns (uint256 burnAmount);

  function removeExactOutput(
    uint256[] memory outputAmounts,
    uint256 maximumBurnAmount,
    bytes16 memo
  ) external returns (uint256 burnAmount);

  function removeExactBurn(
    uint256 burnAmount,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount
  ) external returns (uint256 outputAmount);

  function removeExactBurn(
    uint256 burnAmount,
    uint8 outputTokenIndex,
    uint256 minimumOutputAmount,
    bytes16 memo
  ) external returns (uint256 outputAmount);
}
