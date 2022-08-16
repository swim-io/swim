use {
    crate::Propeller,
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::token::{Mint, Token, TokenAccount},
    two_pool::{
        gen_pool_signer_seeds, program::TwoPool as TwoPoolProgram, state::TwoPool, TOKEN_COUNT,
    },
};

#[derive(Accounts)]
pub struct Add<'info> {
    // pub propeller: Account<'info, Propeller>,
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool_token_account_0.mint.as_ref(),
    pool_token_account_1.mint.as_ref(),
    lp_mint.key().as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key()
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

    pub token_program: Program<'info, Token>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

pub fn handle_add(
    ctx: Context<Add>,
    input_amounts: [u64; TOKEN_COUNT],
    minimum_mint_amount: u64,
    memo: &[u8],
) -> Result<u64> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.two_pool_program.to_account_info(),
        two_pool::cpi::accounts::Add {
            pool: ctx.accounts.pool.to_account_info(),
            pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
            pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
            lp_mint: ctx.accounts.lp_mint.to_account_info(),
            governance_fee: ctx.accounts.governance_fee.to_account_info(),
            user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
            user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
            user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
            user_lp_token_account: ctx.accounts.user_lp_token_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    );

    let result = two_pool::cpi::add(cpi_ctx, input_amounts, minimum_mint_amount)?;
    let return_val = result.get();
    let memo_ix = spl_memo::build_memo(memo, &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    anchor_lang::prelude::msg!("add return_val: {:?}", return_val);
    Ok(return_val)
}
