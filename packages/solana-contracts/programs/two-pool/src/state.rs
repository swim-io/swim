use {
    crate::{amp_factor::AmpFactor, pool_fee::PoolFee, TOKEN_COUNT},
    anchor_lang::{prelude::*},
};

// use pool_lib::amp_factor::AmpFactor;
// use pool_lib::pool_fee;
// use pool_lib::pool_fee::PoolFee;

// use solana_program::{clock::UnixTimestamp, pubkey::Pubkey};

//arguably, various fields should be Options (e.g. all the prepared_* fields)
//the advantage of taking a special value approach is that serialized data
//always has the same size (otherwise we'll have to figure out the maximum
//size of a serialized PoolState in order to ensure that the pool's state
//account has space and sol to be rent exempt in all cases)
#[derive(Debug)]
#[account]
pub struct TwoPool {
    pub bump: u8,
    pub is_paused: bool,
    pub amp_factor: AmpFactor,
    pub lp_fee: PoolFee,
    pub governance_fee: PoolFee,

    pub lp_mint_key: Pubkey,
    pub lp_decimal_equalizer: u8,

    pub token_mint_keys: [Pubkey; TOKEN_COUNT],
    pub token_decimal_equalizers: [u8; TOKEN_COUNT],
    pub token_keys: [Pubkey; TOKEN_COUNT],
    pub pause_key: Pubkey,
    pub governance_key: Pubkey,
    pub governance_fee_key: Pubkey,
    pub prepared_governance_key: Pubkey,
    pub governance_transition_ts: i64,
    pub prepared_lp_fee: PoolFee,
    pub prepared_governance_fee: PoolFee,
    pub fee_transition_ts: i64,
    pub previous_depth: u128,
}

impl TwoPool {
    // pub fn is_initialized(&self) -> bool {
    //     self.lp_mint_key != Pubkey::default()
    // }

    pub const LEN: usize =
        // nonce
        1 +
      // is_paused
      1 +
      // amp_factor
      AmpFactor::LEN +
      // lp_fee
      PoolFee::LEN +
      // governance_fee
      PoolFee::LEN +
      // lp_mint_key
      32 +
      // lp_decimal_equalizer
      1 +
      // token_mint_keys
      32 * TOKEN_COUNT +
      // token_decimal_equalizers
      TOKEN_COUNT +
      // token_keys
      32 * TOKEN_COUNT +
      // pause_key
      32 +
      // governance_key
      32 +
      // governance_fee_key
      32 +
      // prepared_governance_key
      32 +
      // governance_transition_ts
      8 +
      // prepared_lp_fee
      PoolFee::LEN +
      // prepared_governance_fee
      PoolFee::LEN +
      // fee_transition_ts
      8 +
      // previous_depth
      16;

    // Note: this is a workaround for to be able to declare the seeds in the
    //  governance ix. anchor does not handle using `pool.token_mint_keys[0]` directly
    //  in the #[account] macro
    pub fn get_token_mint_0(&self) -> Result<Pubkey> {
        Ok(self.token_mint_keys[0])
    }

    pub fn get_token_mint_1(&self) -> Result<Pubkey> {
        Ok(self.token_mint_keys[1])
    }
}
