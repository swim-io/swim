use std::iter::zip;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{
  Mint,
  Token,
  TokenAccount,
};
use crate::{array_equalize, get_current_ts, result_from_equalized, to_equalized, TOKEN_COUNT, TwoPool};
use crate::{
  error::*,
  invariant::Invariant
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RemoveExactOutputParams {
  maximum_burn_amount: u64,
  exact_output_amounts: [u64; TOKEN_COUNT],
}

#[derive(Accounts)]
pub struct RemoveExactOutput<'info> {
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
  // //TODO: probably need a user_transfer_auth account since either the user or propeller could be payer for txn.
  // //  payer could be the same as user_auth if user manually completing the txn but still need
  // //  to have a separate field to account for it
  // #[account(mut)]
  // pub payer: Signer<'info>,

  pub token_program: Program<'info, Token>,
}


impl<'info> RemoveExactOutput<'info> {
  pub fn accounts(ctx: &Context<RemoveExactOutput>) -> Result<()> {
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


pub fn handle_remove_exact_output(
  ctx: Context<RemoveExactOutput>,
  remove_exact_output_params: RemoveExactOutputParams,
) -> Result<Vec<u64>> {
  let maximum_burn_amount = remove_exact_output_params.maximum_burn_amount;
  let exact_output_amounts = remove_exact_output_params.exact_output_amounts;
  let lp_total_supply = ctx.accounts.lp_mint.supply;
  let pool_balances = [
    ctx.accounts.pool_token_account_0.amount,
    ctx.accounts.pool_token_account_1.amount,
  ];

  require!(exact_output_amounts.iter().any(|amount| *amount > 0), PoolError::InvalidRemoveExactOutputParameters);
  require_gt!(maximum_burn_amount, 0u64, PoolError::InvalidRemoveExactOutputParameters);
  let are_output_amounts_valid = exact_output_amounts
    .iter()
    .zip(pool_balances.iter())
    .all(|(output_amount, pool_balance)| *output_amount < *pool_balance);
  require!(are_output_amounts_valid, PoolError::InvalidRemoveExactOutputParameters);

  let pool = &ctx.accounts.pool;
  let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
  let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
  let lp_mint = &ctx.accounts.lp_mint;
  let governance_fee = &ctx.accounts.governance_fee;
  // let user_transfer_auth = &ctx.accounts.user_transfer_authority;
  let user_token_account_0 = &ctx.accounts.user_token_account_0;
  let user_token_account_1 = &ctx.accounts.user_token_account_1;
  let user_token_accounts = [
    user_token_account_0,
    user_token_account_1,
  ];

  let pool_token_accounts = [
    pool_token_account_0,
    pool_token_account_1,
  ];


  let current_ts = get_current_ts()?;

  let (burn_amount, governance_mint_amount,  latest_depth) = Invariant::<TOKEN_COUNT>::remove_exact_output(
    &array_equalize(exact_output_amounts, pool.token_decimal_equalizers),
    &array_equalize(pool_balances, pool.token_decimal_equalizers),
    pool.amp_factor.get(current_ts),
    pool.lp_fee.get(),
    pool.governance_fee.get(),
    to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
    pool.previous_depth.into(),
  )?;
  let (burn_amount, governance_mint_amount, latest_depth) = result_from_equalized(
    burn_amount,
    pool.lp_decimal_equalizer,
    governance_mint_amount,
    pool.lp_decimal_equalizer,
    latest_depth,
  );

  let maximum_burn_amount = remove_exact_output_params.maximum_burn_amount;
  require_gte!(maximum_burn_amount, burn_amount, PoolError::OutsideSpecifiedLimits);

  let mut token_accounts = zip(
    user_token_accounts.into_iter(),
    pool_token_accounts.into_iter(),
  );
  token::burn(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      token::Burn {
        mint: ctx.accounts.lp_mint.to_account_info(),
        from: ctx.accounts.user_lp_token_account.to_account_info(),
        authority: ctx.accounts.user_transfer_authority.to_account_info(),
      },
    ),
    burn_amount,
  )?;

  for i in 0..TOKEN_COUNT {
    let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
    if exact_output_amounts[i] > 0 {
      token::transfer(
        CpiContext::new_with_signer(
          ctx.accounts.token_program.to_account_info(),
          token::Transfer {
            // source
            from: pool_token_account.to_account_info(),
            to: user_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
          },
          &[&[
            &b"two_pool".as_ref(),
            &pool.token_mint_keys[0].as_ref(),
            &pool.token_mint_keys[1].as_ref(),
            &ctx.accounts.lp_mint.key().as_ref(),
            &[pool.bump],
          ]],
        ),
        exact_output_amounts[i]
      )?;
    }
  }

  if governance_mint_amount > 0 {
    token::mint_to(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo {
          // source
          mint: ctx.accounts.lp_mint.to_account_info(),
          to: ctx.accounts.governance_fee.to_account_info(),
          authority: ctx.accounts.pool.to_account_info(),
        },
        &[&[
          &b"two_pool".as_ref(),
          &pool.token_mint_keys[0].as_ref(),
          &pool.token_mint_keys[1].as_ref(),
          &ctx.accounts.lp_mint.key().as_ref(),
          &[pool.bump],
        ]],
      ),
      governance_mint_amount
    )?;
  }
  let pool = &mut ctx.accounts.pool;
  pool.previous_depth = latest_depth;
  Ok(exact_output_amounts.into())
}
