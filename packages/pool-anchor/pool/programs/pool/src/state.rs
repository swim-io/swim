use anchor_lang::prelude::*;

use solana_program::{clock::UnixTimestamp, pubkey::Pubkey};

use crate::{amp_factor::AmpFactor, pool_fee::PoolFee};

//arguably, various fields should be Options (e.g. all the prepared_* fields)
//the advantage of taking a special value approach is that serialized data
//always has the same size (otherwise we'll have to figure out the maximum
//size of a serialized PoolState in order to ensure that the pool's state
//account has space and sol to be rent exempt in all cases)
#[account]
pub struct PoolState<const TOKEN_COUNT: usize> {
    pub nonce: u8,
    pub is_paused: bool,
    pub amp_factor: AmpFactor,
    pub lp_fee: PoolFee,
    pub governance_fee: PoolFee,

    pub lp_mint_key: Pubkey,
    pub lp_decimal_equalizer: u8,

    pub token_mint_keys: [Pubkey; TOKEN_COUNT],
    pub token_decimal_equalizers: [u8; TOKEN_COUNT],
    pub token_keys: [Pubkey; TOKEN_COUNT],

    pub governance_key: Pubkey,
    pub governance_fee_key: Pubkey,
    pub prepared_governance_key: Pubkey,
    pub governance_transition_ts: UnixTimestamp,
    pub prepared_lp_fee: PoolFee,
    pub prepared_governance_fee: PoolFee,
    pub fee_transition_ts: UnixTimestamp,
    pub previous_depth: u128,
}

impl<const TOKEN_COUNT: usize> PoolState<TOKEN_COUNT> {
    pub fn is_initialized(&self) -> bool {
        self.lp_mint_key != Pubkey::default()
    }

    pub const LEN: usize =
        // anchor account discriminator
        8 +
        // nonce
        1 +
        // is_paused
        1 +
        // amp_factor
        32 +
        // lp_fee
        32 +
        // governance_fee
        32 +
        // lp_mint_key
        32 +
        // lp_decimal_equalizer
        1 +
        // token_mint_keys
        32 * TOKEN_COUNT +
        // token_decimal_equalizers
        1 * TOKEN_COUNT +
        // token_keys
        32 * TOKEN_COUNT +
        // governance_key
        32 +
        // governance_fee_key
        32 +
        // prepared_governance_key
        32 +
        // governance_transition_ts
        8 +
        // prepared_lp_fee
        32 +
        // prepared_governance_fee
        32 +
        // fee_transition_ts
        8 +
        // previous_depth
        16;
}
