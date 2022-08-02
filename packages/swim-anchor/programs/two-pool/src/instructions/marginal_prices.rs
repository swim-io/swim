use std::iter::zip;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{
  Mint,
  Token,
  TokenAccount,
};
use crate::{AmpFactor, DecimalU64Anchor, array_equalize, to_equalized, error::*, TOKEN_COUNT, TwoPool};
use crate::decimal::U128;
use crate::common::create_array;
use crate::invariant::Invariant;

#[derive(Accounts)]
pub struct MarginalPrices<'info>{

  #[account(
  mut,
  seeds = [
  b"two_pool".as_ref(),
  pool_token_account_0.mint.as_ref(),
  pool_token_account_1.mint.as_ref(),
  lp_mint.key().as_ref(),
  ],
  bump = pool.bump
  )]
  pub pool: Account<'info, TwoPool>,
  // /// TODO: could be removed if initialized with pool_v2
  // /// CHECK: checked in CPI
  // pub pool_auth: UncheckedAccount<'info>,
  #[account(
  mut,
  token::mint = pool.token_mint_keys[0],
  token::authority = pool,
  )]
  pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
  #[account(
  mut,
  token::mint = pool.token_mint_keys[1],
  token::authority = pool,
  )]
  pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub lp_mint: Box<Account<'info, Mint>>,
  #[account(
  mut,
  token::mint = lp_mint
  )]
  pub governance_fee: Box<Account<'info, TokenAccount>>,
  ///CHECK: checked in CPI
  pub user_transfer_authority: Signer<'info>,
  #[account(
  mut,
  token::mint = pool_token_account_0.mint,
  )]
  pub user_token_account_0: Box<Account<'info, TokenAccount>>,
  #[account(
  mut,
  token::mint = pool_token_account_1.mint,
  )]
  pub user_token_account_1: Box<Account<'info, TokenAccount>>,

  #[account(
  mut,
  token::mint = lp_mint,
  )]
  pub user_lp_token_account: Box<Account<'info, TokenAccount>>,

  //TODO: vanilla solana we didn't pass/ask for this account
  //  w/ user_transfer_authority it's not explicitly needed.
  // is there any type of checks that we HAVE to do related to payer?
  // #[account(mut)]
  // pub payer: Signer<'info>,

  pub token_program: Program<'info, Token>,

}

impl<'info> MarginalPrices<'info> {
  pub fn accounts(ctx: &Context<MarginalPrices>) -> Result<()> {
    let pool_state = &ctx.accounts.pool;
    require!(!pool_state.is_paused, PoolError::PoolIsPaused);
    require_keys_eq!(ctx.accounts.pool_token_account_0.key(), pool_state.token_keys[0], PoolError::PoolTokenAccountExpected);
    require_keys_eq!(ctx.accounts.pool_token_account_1.key(), pool_state.token_keys[1], PoolError::PoolTokenAccountExpected);
    require_keys_eq!(ctx.accounts.lp_mint.key(), pool_state.lp_mint_key, PoolError::InvalidMintAccount);
    require_keys_eq!(ctx.accounts.governance_fee.key(), pool_state.governance_fee_key, PoolError::InvalidGovernanceFeeAccount);




    // let pool_state_acct = &ctx.accounts.pool_state;
    // let pool: two_pool::state::PoolState<{two_pool::TOKEN_COUNT}> = two_pool::state::PoolState::try_from_slice(&pool_state_acct.data.borrow())?;
    // constraint = lp_mint.key() == propeller.token_bridge_mint @ PropellerError::InvalidMint
    msg!("finished accounts context check");
    // let
    Ok(())
  }
}

pub fn handle_marginal_prices(
  ctx: Context<MarginalPrices>,
) -> Result<[DecimalU64Anchor; TOKEN_COUNT]> {
  let pool = &ctx.accounts.pool;
  let user_token_accounts = [
    &ctx.accounts.user_token_account_0,
    &ctx.accounts.user_token_account_1,
  ];
  let pool_token_accounts = [
    &ctx.accounts.pool_token_account_0,
    &ctx.accounts.pool_token_account_1,
  ];
  let lp_total_supply = ctx.accounts.lp_mint.supply;
  let pool_balances = [
    ctx.accounts.pool_token_account_0.amount,
    ctx.accounts.pool_token_account_1.amount,
  ];
  let current_ts = Clock::get()?.unix_timestamp;
  require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);

  let marginal_prices = Invariant::<TOKEN_COUNT>::marginal_prices(
    &array_equalize(pool_balances, pool.token_decimal_equalizers),
    pool.amp_factor.get(current_ts),
    to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
    pool.previous_depth.into(),
  )?;

  Ok(create_array(|i| marginal_prices[i].into()))
}
