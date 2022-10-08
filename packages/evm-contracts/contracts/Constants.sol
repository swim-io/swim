//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

//-------------- CHECKED TO BE CORRECT/UP-TO-DATE BY DEPLOYMENT SCRIPT -----------------------------
bytes32 constant SWIM_USD_SOLANA_ADDRESS =
  0x296b21c9a4722da898b5cba4f10cbf7693a6ea4af06938cab91c2d88afe26719;
bytes32 constant ROUTING_CONTRACT_SOLANA_ADDRESS =
  0x857d8c691b9e9a1a1e98d010a36d6401a9099ce89d821751410623ad7c2a20d2;
address constant SWIM_FACTORY = address(0xDef312467D48bdDED813de11C3ee4c257e6eD7aD);
address constant ROUTING_CONTRACT = address(0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD4);
address constant LP_TOKEN_LOGIC = address(0x357bb5061A015B898948B95Fb3422595E0Cf81CB);
uint constant PROPELLER_GAS_TIP = 1000000000; //=1 gwei;
uint16 constant WORMHOLE_SOLANA_CHAIN_ID = 1;
//the following constants are "truly constant" in that the implementation depends on their
// particular values and hence changing them might break fundamental assumptions baked into the code
uint constant POOL_PRECISION = 6;
uint constant ROUTING_PRECISION = 18;
uint8 constant SWIM_USD_DECIMALS = 6;
uint8 constant SWIM_USD_TOKEN_INDEX = 0;
uint16 constant SWIM_USD_TOKEN_NUMBER = 0;
