use {
    crate::Propeller,
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, Token, TokenAccount},
    two_pool::{
        gen_pool_signer_seeds, program::TwoPool as TwoPoolProgram, state::TwoPool, TOKEN_COUNT,
    },
};

#[derive(Accounts)]
pub struct RemoveExactBurn<'info> {
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
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

pub fn handle_remove_exact_burn(
    ctx: Context<RemoveExactBurn>,
    exact_burn_amount: u64,
    output_token_index: u8,
    minimum_output_amount: u64,
) -> Result<u64> {
    Ok(0u64)
}
