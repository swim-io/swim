use {
    crate::{
        constants::{PROPELLER_MINIMUM_OUTPUT_AMOUNT, REMOVE_EXACT_BURN_OUTPUT_TOKEN_INDEX},
        error::*,
        Propeller,
    },
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::token::{Mint, Token, TokenAccount},
    two_pool::{gen_pool_signer_seeds, program::TwoPool as TwoPoolProgram, state::TwoPool, TOKEN_COUNT},
};

#[derive(Accounts)]
pub struct RemoveExactBurn<'info> {
    #[account(
    seeds = [
    b"propeller".as_ref(),
    pool_token_account_0.mint.as_ref(),
    ],
    bump = propeller.bump,
    has_one = swim_usd_mint @ PropellerError::InvalidSwimUsdMint,
    )]
    pub propeller: Account<'info, Propeller>,
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
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
    pub swim_usd_mint: Account<'info, Mint>,
}

// pub fn handle_remove_exact_burn(
//     ctx: Context<RemoveExactBurn>,
//     exact_burn_amount: u64,
//     // output_token_index: u8,
//     minimum_output_amount: u64,
//     memo: &[u8],
//     propeller_enabled: bool,
//     target_chain: u16,
// ) -> Result<u64> {
//     let cpi_ctx = CpiContext::new(
//         ctx.accounts.two_pool_program.to_account_info(),
//         two_pool::cpi::accounts::RemoveExactBurn {
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
//     let result = two_pool::cpi::remove_exact_burn(
//         cpi_ctx,
//         exact_burn_amount,
//         REMOVE_EXACT_BURN_OUTPUT_TOKEN_INDEX,
//         minimum_output_amount,
//     )?;
//     let return_val = result.get();
//     let memo_ix = spl_memo::build_memo(memo, &[]);
//     invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
//     anchor_lang::prelude::msg!("remove_exact_burn return_val: {:?}", return_val);
//     is_transfer_amount_sufficient(
//         &ctx.accounts.propeller,
//         &ctx.accounts.token_bridge_mint,
//         propeller_enabled,
//         target_chain,
//         return_val,
//     )?;
//     Ok(return_val)
// }

pub fn handle_cross_chain_remove_exact_burn(
    ctx: Context<RemoveExactBurn>,
    exact_burn_amount: u64,
    minimum_output_amount: u64,
    memo: &[u8],
) -> Result<u64> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.two_pool_program.to_account_info(),
        two_pool::cpi::accounts::RemoveExactBurn {
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
    let result = two_pool::cpi::remove_exact_burn(
        cpi_ctx,
        exact_burn_amount,
        REMOVE_EXACT_BURN_OUTPUT_TOKEN_INDEX,
        minimum_output_amount,
    )?;
    let output_amount = result.get();
    let memo_ix = spl_memo::build_memo(memo, &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    anchor_lang::prelude::msg!("remove_exact_burn return_val: {:?}", output_amount);
    Ok(output_amount)
}

pub fn handle_propeller_remove_exact_burn(
    ctx: Context<RemoveExactBurn>,
    exact_burn_amount: u64,
    memo: &[u8],
    max_fee: u64,
) -> Result<u64> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.two_pool_program.to_account_info(),
        two_pool::cpi::accounts::RemoveExactBurn {
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
    let result = two_pool::cpi::remove_exact_burn(
        cpi_ctx,
        exact_burn_amount,
        REMOVE_EXACT_BURN_OUTPUT_TOKEN_INDEX,
        PROPELLER_MINIMUM_OUTPUT_AMOUNT,
    )?;
    let output_amount = result.get();
    let memo_ix = spl_memo::build_memo(memo, &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    anchor_lang::prelude::msg!("remove_exact_burn return_val: {:?}", output_amount);
    require_gt!(output_amount, max_fee, PropellerError::InsufficientAmount);
    Ok(output_amount)
}
