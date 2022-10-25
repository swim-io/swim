use {
    crate::{constants::CURRENT_SWIM_PAYLOAD_VERSION, error::PropellerError, Address, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    std::{
        io::{Cursor, ErrorKind, Read, Write},
        str::FromStr,
    },
    two_pool::state::TwoPool,
};

// Do i need this to hold configs & state?
//  what state do i need to hold/record on-chain
//  what configs do i need to verify on-chain
#[account]
pub struct Propeller {
    pub bump: u8,
    pub is_paused: bool,                 // 1
    pub governance_key: Pubkey,          //32
    pub prepared_governance_key: Pubkey, // 32
    pub governance_transition_ts: i64,   // 8
    pub pause_key: Pubkey,               //32
    pub swim_usd_mint: Pubkey,           //32

    pub sender_bump: u8,
    pub redeemer_bump: u8,

    // in lamports
    pub gas_kickstart_amount: u64,

    // all fees are in LAMPORTS and NOT including rent
    pub secp_verify_init_fee: u64,
    pub secp_verify_fee: u64,
    pub post_vaa_fee: u64,
    pub init_ata_fee: u64,
    pub complete_with_payload_fee: u64,
    pub process_swim_payload_fee: u64,

    // gas kickstart parameters
    // 1. marginal_price_pool will be pool used to calculate token_bridge_mint -> stablecoin
    // 2. marginal_price_pool_token_index will be index of token in pool used to calculate token_bridge_mint -> stablecoin

    // pool used to get marginal price
    // e.g. usdc-usdt pool
    pub marginal_price_pool: Pubkey,
    pub marginal_price_pool_token_mint: Pubkey,
    // index of token used for calculating gas price
    pub marginal_price_pool_token_index: u8,

    // pub evm_routing_contract_address: [u8; 32],
    pub fee_vault: Pubkey, //32

    /** switchboard **/
    pub aggregator: Pubkey, //32
    pub max_staleness: i64, //8
                            // pub max_confidence_interval: i64, //8

                            //TODO: add this?
                            // pub fallback_oracle: Pubkey, //32
}
// better to save pda keys on chain and always calculate/derive client side?
//  - if save pubkeys and don't use #[account(seeds=[...])] then need to manually call or save
//      PublicKey.findProgramAddress() on client side each time.
// or save pda bumps
impl Propeller {
    pub const LEN: usize = 1 + //bump
        1 + //is_paused
        32 + //governance_key
        32 + //prepared_governance_key
        8 + //governance_transition_ts
        32 + //pause_key
        32 + //swim_usd_mint
        1 + //sender_bump
        1 + //redeemer_bump
        32 + //marginal_price_pool
        32 + //marginal_price_token_mint
        1 + //marginal_price_pool_token_index
        8 + //gas_kickstart_amount
        8 + //propeller_fee
        8 + // secp_verify_init_fee
        8 + // secp_verify_fee
        8 + // post_vaa_fee
        8 + // complete_with_payload_fee
        8 + //process_swim_payload_fee
        8 + // complete_with_payload_cost
        8 + // process_swim_payload_cost
        // 8 + //propeller_min_transfer_amount
        // 8 +  //propeller_eth_min_transfer_amount
        32 + //fee_vault
        32 + //aggregator
        8; //max_staleness
           // 32; // evm_routing_contract_address

    pub fn wormhole(&self) -> Pubkey {
        crate::Wormhole::id()
    }

    pub fn token_bridge(&self) -> Pubkey {
        crate::TokenBridge::id()
    }

    pub fn get_complete_native_with_payload_fee(&self) -> u64 {
        self.secp_verify_init_fee + self.secp_verify_fee + self.post_vaa_fee + self.complete_with_payload_fee
    }
}

#[account]
pub struct SwimClaim {
    pub bump: u8,
    pub claimed: bool,
}

impl SwimClaim {
    pub const LEN: usize = 1 + 1;
}

#[account]
pub struct SwimPayloadMessage {
    pub bump: u8,
    /// payer of `CompleteWithPayload` that will get the lamports
    /// when `SwimPayloadMessage` is closed after `ProcessSwimPayload`
    pub swim_payload_message_payer: Pubkey,
    // pub wh_message_bump: u8,
    pub claim: Pubkey,
    // pub claim_bump: u8,
    pub vaa_emitter_address: [u8; 32],
    pub vaa_emitter_chain: u16,
    pub vaa_sequence: u64,
    pub transfer_amount: u64,
    pub swim_payload_version: u8,
    pub owner: Pubkey,
    pub propeller_enabled: bool,
    pub gas_kickstart: bool,
    pub max_fee: u64,
    pub target_token_id: u16,
    pub memo: [u8; 16],
    //TODO: add extra bytes for future use?
}

impl SwimPayloadMessage {
    pub const LEN: usize = 1 +  // bump
        32 + // payer
        // 1 + // message bump
        32 + // claim
        // 1 +  // claim_bump
        32 + // vaa_emitter_address
        2 +  // vaa_emitter_chain
        8 +  // vaa_sequence
        8 + // transfer_amount
        // swim_payload
        1 + //version
        32 + //owner
        1 + // propeller_enabled
        1 + // gas_kickstart
        8 + // max_fee
        2 +    // target_token_id
        16; // memo

    // RawSwimPayload::LEN; // swim_payload
    // 1 + //version
    // 32 + //owner
    // 1 + // propeller_enabled
    // 1 + // gas_kickstart
    // 8 + // max_fee
    // 2 +    // target_token_id
    // 16; // memo
    // SwimPayload::LEN; // swim_payload
}

/// Utility function that verifies:
/// 1. pool_token_index < TOKEN_COUNT
/// 2. marginal_price_pool_token_accounts[pool_token_index].mint = propeller.marginal_price_pool_token_mint
/// 3. marginal_price_pool.token_mint_keys[pool_token_index] = propeller.marginal_price_pool_token_mint
pub fn validate_marginal_prices_pool_accounts<'info>(
    propeller: &Propeller,
    marginal_price_pool: &Account<'info, TwoPool>,
    marginal_price_pool_token_accounts: &[&Account<'info, TokenAccount>; TOKEN_COUNT],
) -> Result<()> {
    let pool_token_index = propeller.marginal_price_pool_token_index as usize;
    require_gt!(TOKEN_COUNT, pool_token_index, PropellerError::InvalidMarginalPricePoolAccounts);
    let pool_token_account = marginal_price_pool_token_accounts[pool_token_index];
    require_keys_eq!(pool_token_account.mint, propeller.marginal_price_pool_token_mint);
    require_keys_eq!(marginal_price_pool.token_mint_keys[pool_token_index], propeller.marginal_price_pool_token_mint);
    require_keys_eq!(pool_token_account.key(), marginal_price_pool_token_accounts[pool_token_index].key());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_non_propeller_swim_payload() {}

    #[test]
    fn test_propeller_swim_payload() {}

    #[test]
    fn test_third_party_swim_payload() {}
}
