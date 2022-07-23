//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;


error Equalize_MaxAmountExceeded(uint amount, int8 equalizer);
error Equalize_LosingAllPrecision(uint value, int8 equalizer);

error CenterAlignment_NumericOverflow();

error Invariant_UnknownBalanceTooLarge(uint unknownBalance);

error PoolMath_ImpossibleRemove();

//governance errors:
error Pool_LpTokenInitializationFailed();
error Pool_FirstTokenNotSwimUSD(address value, address expected);
error Pool_MaxTokenCountExceeded(uint8 value, uint8 maximum);
error Pool_TokenEqualizerCountMismatch(uint8 count, uint8 expected);
error Pool_TokenEqualizerTooSmall(int8 equalizer, int8 minimum);
error Pool_TokenEqualizerTooLarge(int8 equalizer, int8 maximum);
error Pool_ConstantProductNotSupportedForTokenCount(uint8 tokenCount);
error Pool_AmpFactorTooSmall(uint32 ampFactor, uint32 minimum);
error Pool_AmpFactorTooLarge(uint32 ampFactor, uint32 maximum);
error Pool_AmpFactorIsFixedForConstantProductPools();
error Pool_AmpFactorTargetTimestampTooSmall(uint32 target, uint32 minimum);
error Pool_AmpFactorRelativeAdjustmentTooLarge(uint32 current, uint32 target, uint32 threshold);
error Pool_TotalFeeTooLarge(uint32 totalFee, uint32 maximum);
error Pool_NonZeroGovernanceFeeButNoRecipient();

//defi errors:
error Pool_AmountCountMismatch(uint8 count, uint8 expected);
error Pool_InvalidTokenIndex(uint8 tokenIndex, uint8 tokenCount);
error Pool_SlippageExceeded(address token, uint amount, uint threshold);
error Pool_AmountExceedsSupply(address token, uint amount, uint poolbalance);
error Pool_RequestedTokenAmountNotZero(uint8 tokenIndex, uint amount);
error Pool_InitialAddMustIncludeAllTokens(uint8 missingAmountIndex);

error Pool_IsPaused();
error Pool_GovernanceOnly();
