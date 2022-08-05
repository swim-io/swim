use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::UnixTimestamp;
use anchor_spl::token::*;

use {
    crate::{
      amp_factor::AmpFactor,
      decimal::DecimalU64,
      instructions::*,
      pool_fee::PoolFee,
      state::TwoPool,
      error::PoolError,
    },
};


pub mod amp_factor;
pub mod instructions;
pub mod pool_fee;
pub mod state;
pub mod error;
pub mod decimal;
pub mod invariant;
mod common;

//Note - using this b/c of not all bytes read error. found from using this - https://brson.github.io/2021/06/08/rust-on-solana
// use solana_program::borsh::try_from_slice_unchecked;
// const ENACT_DELAY: UnixTimestamp = 3 * 86400;
// const MAX_DECIMAL_DIFFERENCE: u8 = 8;
//
// type AtomicT = u64;
// type DecT = DecimalU64;

pub const TOKEN_COUNT: usize = 2;

//TODO: option to have separate programIds depending on cluster
// https://solana.stackexchange.com/questions/848/how-to-have-a-different-program-id-depending-on-the-cluster
// #[cfg(feature = "mainnet")]
// declare_id!("8ghymvPffJbkLHqYfSKdE8moRH5gSf4AQav9qtZfu77H");
// #[cfg(not(feature = "mainnet"))]
// declare_id!("DLANS7Qh31fFWLujEMtn5kyd87H8ZUbhwtfMurrSHYn9");
// declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
declare_id!("8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM");

#[program]
pub mod two_pool {
  use super::*;

  #[access_control(Initialize::accounts(&ctx))]
  pub fn initialize(
    ctx: Context<Initialize>,
    amp_factor: DecimalU64Anchor,
    lp_fee: DecimalU64Anchor,
    governance_fee: DecimalU64Anchor,
  ) -> Result<()> {
    handle_initialize(
      ctx,
      amp_factor,
      lp_fee,
      governance_fee,
    )
  }

  #[access_control(Add::accounts(&ctx))]
  pub fn add(
    ctx: Context<Add>,
    pool_add_params: AddParams,
  ) -> Result<u64> {
    handle_add(
      ctx,
      pool_add_params,
    )
  }

  #[access_control(SwapExactInput::accounts(&ctx))]
  pub fn swap_exact_input(
    ctx: Context<SwapExactInput>,
    swap_exact_input_params: SwapExactInputParams,
  ) -> Result<u64> {
    handle_swap_exact_input(
      ctx,
      swap_exact_input_params,
    )
  }

  //returning cpi data from this is a little redundant since it's already passed in the params
  //but keeping for parity with other ixs
  // note using Vec<u64> instead of [u64; TOKEN_COUNT] since anchor can't handle it properly.
  #[access_control(SwapExactOutput::accounts(&ctx))]
  pub fn swap_exact_output(
    ctx: Context<SwapExactOutput>,
    swap_exact_output_params: SwapExactOutputParams,
  ) -> Result<Vec<u64>> {
    handle_swap_exact_output(
      ctx,
      swap_exact_output_params,
    )
  }

  #[access_control(RemoveUniform::accounts(&ctx))]
  pub fn remove_uniform(
    ctx: Context<RemoveUniform>,
    remove_uniform_params: RemoveUniformParams,
  ) -> Result<Vec<u64>> {
    handle_remove_uniform(
      ctx,
      remove_uniform_params,
    )
  }

  #[access_control(RemoveExactBurn::accounts(&ctx))]
  pub fn remove_exact_burn(
    ctx: Context<RemoveExactBurn>,
    remove_exact_burn_params: RemoveExactBurnParams,
  ) -> Result<u64> {
    handle_remove_exact_burn(
      ctx,
      remove_exact_burn_params,
    )
  }

  #[access_control(RemoveExactOutput::accounts(&ctx))]
  pub fn remove_exact_output(
    ctx: Context<RemoveExactOutput>,
    remove_exact_output_params: RemoveExactOutputParams,
  ) -> Result<Vec<u64>> {
    handle_remove_exact_output(
      ctx,
      remove_exact_output_params,
    )
  }

  //TODO: using 2 instead of TOKEN_COUNT const since anchor can't handle it properly.
  #[access_control(MarginalPrices::accounts(&ctx))]
  pub fn marginal_prices( ctx: Context<MarginalPrices>) -> Result<[DecimalU64Anchor; 2]> {
    handle_marginal_prices(
      ctx,
    )
  }
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub struct DecimalU64Anchor {
  pub value: u64,
  pub decimals: u8,
  //TODO DecimalU64Anchor must ensure that decimals is <= 19 (= DecimalU64::MAX_DECIMALS)
}

impl DecimalU64Anchor {
  pub const LEN: usize = 8 + 1;
}

impl From<DecimalU64> for DecimalU64Anchor {
  fn from(v: DecimalU64) -> Self {
    Self {
      value: v.get_raw(),
      decimals: v.get_decimals(),
    }
  }
}

impl From<DecimalU64Anchor> for DecimalU64 {
  fn from(v: DecimalU64Anchor) -> Self {
    //unwrap is only safe one DecimalU64Anchor enforces decimals upper bound of 19
    Self::new(v.value, v.decimals).unwrap()
  }
}
