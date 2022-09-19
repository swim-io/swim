// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import "./IMemoInteractor.sol";

struct TokenBalance {
  address tokenAddress;
  uint balance;
}

struct Decimal {
  uint value;
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

interface IPool is IMemoInteractor {
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
  error SlippageExceeded(address token, uint amount, uint threshold);
  error AmountExceedsSupply(address token, uint amount, uint poolbalance);
  error RequestedTokenAmountNotZero(uint8 tokenIndex, uint amount);
  error InitialAddMustIncludeAllTokens(uint8 missingAmountIndex);

  error IsPaused();
  error GovernanceOnly();

  function getState() external view returns (PoolState memory state);

  function getMarginalPrices() external view returns (Decimal[] memory marginalPrices);

  // ----------------------------- BASIC VERSIONS --------------------------------------------------

  function swap(
    uint inputAmount,
    uint8 inputTokenIndex,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external returns (uint outputAmount);

  function swapExactOutput(
    uint maximumInputAmount,
    uint8 inputTokenIndex,
    uint[] calldata outputAmounts
  ) external returns (uint inputAmount);

  function swapExactInput(
    uint[] calldata inputAmounts,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external returns (uint outputAmount);

  function removeUniform(
    uint burnAmount,
    uint[] calldata minimumOutputAmounts
  ) external returns (uint[] memory outputAmounts);

  function add(
    uint[] calldata inputAmounts,
    uint minimumMintAmount
  ) external returns (uint mintAmount);

  function removeExactOutput(
    uint[] calldata outputAmounts,
    uint maximumBurnAmount
  ) external returns (uint burnAmount);

  function removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount
  ) external returns (uint outputAmount);

  // ----------------------------- MEMO VARIANTS ---------------------------------------------------

  function removeUniform(
    uint burnAmount,
    uint[] calldata minimumOutputAmounts,
    bytes16 memo
  ) external returns (uint[] memory outputAmounts);

  function add(
    uint[] calldata inputAmounts,
    uint minimumMintAmount,
    bytes16 memo
  ) external returns (uint mintAmount);

  function removeExactOutput(
    uint[] calldata outputAmounts,
    uint maximumBurnAmount,
    bytes16 memo
  ) external returns (uint burnAmount);

  function removeExactBurn(
    uint burnAmount,
    uint8 outputTokenIndex,
    uint minimumOutputAmount,
    bytes16 memo
  ) external returns (uint outputAmount);
}
