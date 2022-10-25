pub use add_or_remove::*;
pub mod add_or_remove;

use {
    crate::{
        common::{self, array_equalize, result_from_equalized, to_equalized},
        error::*,
        gen_pool_signer_seeds, get_current_ts,
        invariant::Invariant,
        AddParams, TwoPool, TOKEN_COUNT,
    },
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{self, Mint, Token, TokenAccount},
    },
    std::iter::zip,
};

#[derive(Accounts)]
pub struct Swap<'info> {
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
    pub pool: Box<Account<'info, TwoPool>>,
    #[account(
    mut,
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[0]),
    constraint = pool_token_account_0.key() == pool.token_keys[0] @ PoolError::PoolTokenAccountExpected,
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[1]),
    constraint = pool_token_account_1.key() == pool.token_keys[1] @ PoolError::PoolTokenAccountExpected,
    )]
    pub pool_token_account_1: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = pool.lp_mint_key @ PoolError::InvalidMintAccount)]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(
    mut,
    token::mint = lp_mint,
    address = pool.governance_fee_key @  PoolError::InvalidGovernanceFeeAccount,
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

    // //TODO: probably need a user_transfer_auth account since either the user or propeller could be payer for txn.
    // //  payer could be the same as user_auth if user manually completing the txn but still need
    // //  to have a separate field to account for it
    // #[account(mut)]
    // pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
