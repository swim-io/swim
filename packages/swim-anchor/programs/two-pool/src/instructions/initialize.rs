use anchor_lang::prelude::*;
use anchor_spl::token::{
  Mint,
  Token,
  TokenAccount,
};
use std::cmp::{max, min};
use anchor_spl::associated_token::AssociatedToken;
use crate::{AmpFactor, DecimalU64Anchor, PoolError, PoolFee, TwoPool};
use crate::error::PoolError::*;
use crate::decimal::DecimalU64;

#[derive(Accounts)]
pub struct Initialize<'info> {
  // Not sure what the best way of specifying payer is here since we derive it
  // Should triple check that this logic isn't susceptible to re-initialization attacks
  #[account(
    init,
    seeds = [
      b"two_pool".as_ref(),
      pool_mint_0.key().as_ref(),
      pool_mint_1.key().as_ref(),
      lp_mint.key().as_ref(),
    ],
    bump,
    payer = payer,
    space = 8 + TwoPool::LEN
  )]
  pub pool: Account<'info, TwoPool>,
  #[account(mut)]
  pub payer: Signer<'info>,
  pub pool_mint_0: Box<Account<'info, Mint>>,
  pub pool_mint_1: Box<Account<'info, Mint>>,
  #[account(
    init,
    payer = payer,
    mint::decimals = max(pool_mint_0.decimals, pool_mint_1.decimals),
    mint::authority = pool,
  )]
  pub lp_mint: Box<Account<'info, Mint>>,
  #[account(
    init,
    payer = payer,
    associated_token::mint = pool_mint_0,
    associated_token::authority = pool,
  )]
  pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
  #[account(
    init,
    payer = payer,
    associated_token::mint = pool_mint_1,
    associated_token::authority = pool,
  )]
  pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
  //TODO: should this be a signer?
  /// CHECK: keypair for governance instructions
  pub governance_account: UncheckedAccount<'info>,
  #[account(
    init,
    payer = payer,
    associated_token::mint = lp_mint,
    associated_token::authority = governance_account,
  )]
  pub governance_fee_account: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
  //explicitly needed for initializing associated token accounts
  pub rent: Sysvar<'info, Rent>,
}

impl<'info> Initialize<'info> {
  //TODO: add errors
  pub fn accounts(ctx: &Context<Initialize>) -> Result<()> {
    require_keys_eq!(ctx.accounts.governance_fee_account.mint, ctx.accounts.lp_mint.key());
    Initialize::check_token_account(&ctx.accounts.pool_token_account_0)?;
    Initialize::check_token_account(&ctx.accounts.pool_token_account_1)?;
    msg!("Initialize::accounts()");
    Ok(())
  }

  fn check_token_account(
    token_account: &Account<'info, TokenAccount>
  ) -> Result<()> {
    require_eq!(token_account.amount, 0, PoolError::TokenAccountHasBalance);
    require!(token_account.delegate.is_none(), PoolError::TokenAccountHasDelegate);
    require!(token_account.close_authority.is_none(), PoolError::TokenAccountHasCloseAuthority);
    Ok(())
  }
}

pub fn handle_initialize(
  ctx: Context<Initialize>,
  amp_factor: DecimalU64Anchor,
  lp_fee: DecimalU64Anchor,
  governance_fee: DecimalU64Anchor,
) -> Result<()> {
  let fee_sum = lp_fee.to_decimal_u64() + governance_fee.to_decimal_u64();
  require_gt!(DecimalU64::const_from(1), fee_sum, PoolError::InvalidFeeInput);
  let two_pool = &mut ctx.accounts.pool;
  two_pool.bump = *ctx.bumps.get("pool").unwrap();
  two_pool.is_paused = false;
  two_pool.amp_factor = AmpFactor::new(amp_factor.to_decimal_u64())?;
  two_pool.lp_fee = PoolFee::new(lp_fee.to_decimal_u64())?;
  two_pool.governance_fee = PoolFee::new(governance_fee.to_decimal_u64())?;
  two_pool.lp_mint_key = ctx.accounts.lp_mint.key();

  let mut decimal_range_min = ctx.accounts.lp_mint.decimals;
  let mut decimal_range_max = decimal_range_min;
  decimal_range_min = min(
    decimal_range_min,
    min(ctx.accounts.pool_mint_0.decimals, ctx.accounts.pool_mint_1.decimals)
  );
  decimal_range_max = max(
    decimal_range_max,
    max(ctx.accounts.pool_mint_0.decimals, ctx.accounts.pool_mint_1.decimals)
  );


  require_gte!(8, decimal_range_max - decimal_range_min, PoolError::MaxDecimalDifferenceExceeded);

  two_pool.lp_decimal_equalizer = decimal_range_max - ctx.accounts.lp_mint.decimals;
  two_pool.token_mint_keys = [
    ctx.accounts.pool_mint_0.key(),
    ctx.accounts.pool_mint_1.key(),
  ];
  two_pool.token_decimal_equalizers = [
    decimal_range_max - ctx.accounts.pool_mint_0.decimals,
    decimal_range_max - ctx.accounts.pool_mint_1.decimals
  ];
  two_pool.token_keys = [
    ctx.accounts.pool_token_account_0.key(),
    ctx.accounts.pool_token_account_1.key(),
  ];
  two_pool.governance_key = ctx.accounts.governance_account.key();
  two_pool.governance_fee_key = ctx.accounts.governance_fee_account.key();
  two_pool.prepared_governance_key = Pubkey::default();
  two_pool.governance_transition_ts = 0;
  two_pool.prepared_lp_fee = PoolFee::default();
  two_pool.prepared_governance_fee = PoolFee::default();
  two_pool.fee_transition_ts = 0;
  two_pool.previous_depth = 0;


  /**
    &PoolState {
      nonce,
      is_paused: false,
      amp_factor: AmpFactor::new(amp_factor)?,
      lp_fee: PoolFee::new(lp_fee)?,
      governance_fee: PoolFee::new(governance_fee)?,
      lp_mint_key: lp_mint_account.key.clone(),
      lp_decimal_equalizer: decimal_range_max - lp_mint_state.decimals,
      token_mint_keys: create_array(|i| token_mint_accounts[i].key.clone()),
      token_decimal_equalizers: create_array(|i| decimal_range_max - token_decimals[i]),
      token_keys: create_array(|i| token_accounts[i].key.clone()),
      governance_key: governance_account.key.clone(),
      governance_fee_key: governance_fee_account.key.clone(),
      prepared_governance_key: Pubkey::default(),
      governance_transition_ts: 0,
      prepared_lp_fee: PoolFee::default(),
      prepared_governance_fee: PoolFee::default(),
      fee_transition_ts: 0,
      previous_depth: 0,
  },
  */
  Ok(())
}
