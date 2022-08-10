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
    //TODO: not sure if this is needed. just re-using icco template for now.
    pub nonce: u32,                // 4
    pub admin: Pubkey,             //32
    pub wormhole: Pubkey,          //32
    pub token_bridge: Pubkey,      //32
    pub token_bridge_mint: Pubkey, //32

    pub sender_bump: u8,
    pub redeemer_bump: u8,

    pub gas_kickstart_amount: u64,
    pub relayer_fee: u64,
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
    //TODO: not sure where last 32 came from. copied from wormhole_icco.
    pub const MAXIMUM_SIZE: usize = 4 + 32 + 32 + 32 + 32 + 32 + 1 + 1 + 8 + 8;

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
