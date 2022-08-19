use {
    crate::{env::*, error::PropellerError},
    anchor_lang::prelude::*,
    std::str::FromStr,
};

// Do i need this to hold configs & state?
//  what state do i need to hold/record on-chain
//  what configs do i need to verify on-chain
#[account]
pub struct Propeller {
    pub bump: u8,
    //TODO: not sure if nonce is needed. just re-using icco template for now.
    pub nonce: u32,                // 4
    pub admin: Pubkey,             //32
    pub wormhole: Pubkey,          //32
    pub token_bridge: Pubkey,      //32
    pub token_bridge_mint: Pubkey, //32

    pub sender_bump: u8,
    pub redeemer_bump: u8,

    pub gas_kickstart_amount: u64,
    /// TODO: should this be in swimUSD or native gas?
    /// fee that payer of complete txn will take from transferred amount
    pub propeller_fee: u64,
    // minimum amount of tokens that must be transferred in token bridge transfer
    // if propeller enabled transfer.
    pub propeller_min_transfer_amount: u64,
    pub propeller_eth_min_transfer_amount: u64,

    // gas kickstart parameters
    // 1. marginal_price_pool will be pool used to calculate token_bridge_mint -> stablecoin
    // 2. marginal_price_pool_token_index will be index of token in pool used to calculate token_bridge_mint -> stablecoin

    // pool used to get marginal price
    // e.g. usdc-usdt pool
    pub marginal_price_pool: Pubkey,
    pub marginal_price_pool_token_mint: Pubkey,
    // index of token used for calculating gas price
    pub marginal_price_pool_token_index: u8,

    pub evm_routing_contract_address: [u8; 32],
    // pub custody_signer_key: Pubkey,     // 32
    //    pub custody_signer_bump: u8,        // 1

    // pub mint_signer_key: Pubkey,     // 32
    //    pub mint_signer_bump: u8,        // 1

    // 	pub authority_signer_key: Pubkey,     // 32
    // //    pub authority_signer_bump: u8,        // 1
    //
    // 	pub bridge_config_key: Pubkey,     // 32
    // //    pub bridge_config_bump: u8,        // 1
    //
    // 	pub wormhole_config_key: Pubkey,     // 32
    // //    pub wormhole_config_bump: u8,        // 1
    //
    // 	pub fee_collector_key: Pubkey,     // 32
    // //    pub fee_collector_bump: u8,        // 1
    //
    // 	pub wormhole_emitter_key: Pubkey,     // 32
    // //    pub wormhole_emitter_bump: u8,        // 1
    //
    // 	pub wormhole_sequence_key: Pubkey,     // 32
    //    pub wormhole_sequence_bump: u8,        // 1
}
// better to save pda keys on chain and always calculate/derive client side?
//  - if save pubkeys and don't use #[account(seeds=[...])] then need to manually call or save
//      PublicKey.findProgramAddress() on client side each time.
// or save pda bumps
impl Propeller {
    pub const MAXIMUM_SIZE: usize = 1 + //bump
      4 + //nonce
      32 + //admin
      32 + //wormhole
      32 + //token_bridge
      32 + //token_bridge_mint
      32 + //marginal_price_pool
      32 + //marginal_price_token_mint
      1 + //marginal_price_pool_token_index
      1 + //sender_bump
      1 + //redeemer_bump
      8 + //gas_kickstart_amount
      8 + //propeller_fee
      8 + //propeller_min_transfer_amount
      8 +  //propeller_eth_min_transfer_amount
      32; // evm_routing_contract_address

    pub fn wormhole(&self) -> Result<Pubkey> {
        // let pubkey = Pubkey::from_str(CORE_BRIDGE_ADDRESS)
        // .map_err(|_| PropellerError::InvalidWormholeAddress)?;
        let pubkey = CORE_BRIDGE;
        Ok(pubkey)
    }

    pub fn token_bridge(&self) -> Result<Pubkey> {
        // let pubkey = Pubkey::from_str(TOKEN_BRIDGE_ADDRESS)
        // .map_err(|_| PropellerError::InvalidWormholeAddress)?;
        let pubkey = TOKEN_BRIDGE;
        Ok(pubkey)
    }
}
