//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

//-------------- CHECKED TO BE CORRECT/UP-TO-DATE BY DEPLOYMENT SCRIPT -----------------------------
bytes32 constant SWIM_USD_SOLANA_ADDRESS =
  0x296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe26719;
bytes32 constant ROUTING_CONTRACT_SOLANA_ADDRESS = 0x0;
address constant SWIM_FACTORY = address(0x36E284788aaA29C16cc227E09477C8e73D96ffD3);
address constant ROUTING_CONTRACT = address(0xa33E4d9624608c468FE5466dd6CC39cE1Da4FF78);
address constant LP_TOKEN_LOGIC = address(0x90a45213b7371EB6d5fd3cfdA092252B2aDB3D65);
uint8 constant SWIM_USD_DECIMALS = 6;
//--------------------------------------------------------------------------------------------------

uint8 constant SWIM_USD_TOKEN_INDEX = 0;
uint16 constant SWIM_USD_TOKEN_NUMBER = 0;
uint16 constant WORMHOLE_SOLANA_CHAIN_ID = 1;
uint16 constant WORMHOLE_ETHEREUM_CHAIN_ID = 2;

uint constant FEE_DECIMALS = 6; //enough to represent 100th of a bip
uint constant FEE_MULTIPLIER = 10**FEE_DECIMALS;

//amp factor for internal respresentation (shifting is efficiently combined with other pool math)
uint constant AMP_SHIFT = 10; //number of bits ampFactor is shifted to the left
uint constant ONE_AMP_SHIFTED = 1 << AMP_SHIFT;

uint constant MARGINAL_PRICE_DECIMALS = 18;
uint constant MARGINAL_PRICE_MULTIPLIER = 10**MARGINAL_PRICE_DECIMALS;
