use {
    crate::{constants::PROPELLER_MINIMUM_OUTPUT_AMOUNT, error::*, Propeller},
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{Mint, Token, TokenAccount},
    },
    two_pool::{gen_pool_signer_seeds, program::TwoPool as TwoPoolProgram, state::TwoPool, TOKEN_COUNT},
};

#[derive(Accounts)]
pub struct Add<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), lp_mint.key().as_ref()],
    bump = propeller.bump,
    constraint = !propeller.is_paused @ PropellerError::IsPaused,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
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
    pub pool: Box<Account<'info, TwoPool>>,
    // /// TODO: could be removed if initialized with pool_v2
    // /// CHECK: checked in CPI
    // pub pool_auth: UncheckedAccount<'info>,
    #[account(
    mut,
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[0]),
    constraint = pool_token_account_0.key() == pool.token_keys[0],
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[1]),
    constraint = pool_token_account_1.key() == pool.token_keys[1],
    )]
    pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = pool.lp_mint_key,
    constraint = propeller.swim_usd_mint == lp_mint.key(),
    )]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(
    mut,
    token::mint = lp_mint,
    address = pool.governance_fee_key,
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

    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

impl<'info> Add<'info> {
    pub fn accounts(ctx: &Context<Add>) -> Result<()> {
        require_keys_eq!(ctx.accounts.lp_mint.key(), ctx.accounts.propeller.swim_usd_mint);
        Ok(())
    }
}

// pub fn handle_add(
//     ctx: Context<Add>,
//     input_amounts: [u64; TOKEN_COUNT],
//     minimum_mint_amount: u64,
//     memo: &[u8],
//     propeller_enabled: bool,
//     target_chain: u16,
// ) -> Result<u64> {
//     let cpi_ctx = CpiContext::new(
//         ctx.accounts.two_pool_program.to_account_info(),
//         two_pool::cpi::accounts::Add {
//             pool: ctx.accounts.pool.to_account_info(),
//             pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
//             pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
//             lp_mint: ctx.accounts.lp_mint.to_account_info(),
//             governance_fee: ctx.accounts.governance_fee.to_account_info(),
//             user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
//             user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
//             user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
//             user_lp_token_account: ctx.accounts.user_lp_token_account.to_account_info(),
//             token_program: ctx.accounts.token_program.to_account_info(),
//         },
//     );
//
//     let result = two_pool::cpi::add(cpi_ctx, input_amounts, minimum_mint_amount)?;
//     let return_val = result.get();
//     let memo_ix = spl_memo::build_memo(memo, &[]);
//     invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
//     anchor_lang::prelude::msg!("add return_val: {:?}", return_val);
//     is_transfer_amount_sufficient(
//         &ctx.accounts.propeller,
//         &ctx.accounts.lp_mint,
//         propeller_enabled,
//         target_chain,
//         return_val,
//     )?;
//     Ok(return_val)
// }

// pub fn handle_cross_chain_add(
//     ctx: Context<Add>,
//     input_amounts: [u64; TOKEN_COUNT],
//     minimum_mint_amount: u64,
// ) -> Result<u64> {
//     let cpi_ctx = CpiContext::new(
//         ctx.accounts.two_pool_program.to_account_info(),
//         two_pool::cpi::accounts::Add {
//             pool: ctx.accounts.pool.to_account_info(),
//             pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
//             pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
//             lp_mint: ctx.accounts.lp_mint.to_account_info(),
//             governance_fee: ctx.accounts.governance_fee.to_account_info(),
//             user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
//
//             user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
//             user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
//             user_lp_token_account: ctx.accounts.user_lp_token_account.to_account_info(),
//             token_program: ctx.accounts.token_program.to_account_info(),
//         },
//     );
//     let result = two_pool::cpi::add(cpi_ctx, input_amounts, minimum_mint_amount)?;
//     let return_val = result.get();
//     anchor_lang::prelude::msg!("cross_chain_add return_val: {:?}", return_val);
//     Ok(return_val)
// }
//
// pub fn handle_propeller_add(ctx: Context<Add>, input_amounts: [u64; TOKEN_COUNT], max_fee: u64) -> Result<u64> {
//     let cpi_ctx = CpiContext::new(
//         ctx.accounts.two_pool_program.to_account_info(),
//         two_pool::cpi::accounts::Add {
//             pool: ctx.accounts.pool.to_account_info(),
//             pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
//             pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
//             lp_mint: ctx.accounts.lp_mint.to_account_info(),
//             governance_fee: ctx.accounts.governance_fee.to_account_info(),
//             user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),
//             user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
//             user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
//             user_lp_token_account: ctx.accounts.user_lp_token_account.to_account_info(),
//             token_program: ctx.accounts.token_program.to_account_info(),
//         },
//     );
//     let result = two_pool::cpi::add(cpi_ctx, input_amounts, PROPELLER_MINIMUM_OUTPUT_AMOUNT)?;
//     let output_amount = result.get();
//     anchor_lang::prelude::msg!("propeller_add output_amount: {:?}", output_amount);
//     require_gt!(output_amount, max_fee, PropellerError::InsufficientAmount);
//     Ok(output_amount)
// }
