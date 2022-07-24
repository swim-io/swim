//SPDX-License-Identifier: TODO
pragma solidity ^0.8.0;

uint constant MAX_TOKEN_COUNT = 6;
uint constant FEE_DECIMALS = 6; //enough to represent 100th of a bip
uint constant FEE_MULTIPLIER = 10**FEE_DECIMALS;

//Min and max equalizers are somewhat arbitrary, though shifting down by more than 18 decimals
// will almost certainly be unintentional and shifting up by more than 4 digits will almost
// certainly result in too small of a usable value range (only 18 digits in total!).
//In general, a positive equalizer should be quite unlikely on an EVM chain.
// (The main scenario where this seems somewhat likely at all are tokens that were Wormhole
//  bridged from Solana that use a very low native number of decimals to begin with.)
int8 constant MIN_EQUALIZER = -18;
int8 constant MAX_EQUALIZER = 4;

//amp factor for external representation
uint constant AMP_DECIMALS = 3;
uint constant AMP_MULTIPLIER = 10**AMP_DECIMALS;
//we choose MAX_AMP_FACTOR so that MAX_AMP_FACTOR<<AMP_SHIFT requires 30 bits or less
uint32 constant MAX_AMP_FACTOR = 10**6 * uint32(AMP_MULTIPLIER);
uint constant MIN_AMP_ADJUSTMENT_WINDOW = 1 days;
uint constant MAX_AMP_RELATIVE_ADJUSTMENT = 10;

//amp factor for internal respresentation (shifting can be efficiently combined with other pool math)
uint constant AMP_SHIFT = 10; //number of bits ampFactor is shifted to the left
uint constant ONE_AMP_SHIFTED = 1 << AMP_SHIFT;

uint constant MARGINAL_PRICE_DECIMALS = 18;
uint constant MARGINAL_PRICE_MULTIPLIER = 10**MARGINAL_PRICE_DECIMALS;
