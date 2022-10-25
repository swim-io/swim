use {
    crate::{
        common::{self, array_equalize, result_from_equalized, to_equalized},
        defi::*,
        error::*,
        gen_pool_signer_seeds, get_current_ts,
        invariant::Invariant,
        AddParams, Swap, TwoPool, TOKEN_COUNT,
    },
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{self, Mint, Token, TokenAccount},
    },
    std::iter::zip,
};
//
// #[derive(Accounts)]
// pub struct AddOrRemove<'info> {
//     #[account(
//     mut,
//     seeds = [
//     b"two_pool".as_ref(),
//     pool_token_account_0.mint.as_ref(),
//     pool_token_account_1.mint.as_ref(),
//     lp_mint.key().as_ref(),
//     ],
//     bump = pool.bump
//     )]
//     pub pool: Box<Account<'info, TwoPool>>,
//     #[account(
//     mut,
//     address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[0]),
//     constraint = pool_token_account_0.key() == pool.token_keys[0] @ PoolError::PoolTokenAccountExpected,
//     )]
//     pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
//     #[account(
//     mut,
//     address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[1]),
//     constraint = pool_token_account_1.key() == pool.token_keys[1] @ PoolError::PoolTokenAccountExpected,
//     )]
//     pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
//
//     #[account(mut, address = pool.lp_mint_key @ PoolError::InvalidMintAccount)]
//     pub lp_mint: Box<Account<'info, Mint>>,
//     #[account(
//     mut,
//     token::mint = lp_mint,
//     address = pool.governance_fee_key @  PoolError::InvalidGovernanceFeeAccount,
//     )]
//     pub governance_fee: Box<Account<'info, TokenAccount>>,
//
//     pub user_transfer_authority: Signer<'info>,
//
//     #[account(
//     mut,
//     token::mint = pool_token_account_0.mint,
//     )]
//     pub user_token_account_0: Box<Account<'info, TokenAccount>>,
//
//     #[account(
//     mut,
//     token::mint = pool_token_account_1.mint,
//     )]
//     pub user_token_account_1: Box<Account<'info, TokenAccount>>,
//
//     #[account(
//     mut,
//     token::mint = lp_mint,
//     )]
//     pub user_lp_token_account: Box<Account<'info, TokenAccount>>,
//     // //TODO: probably need a user_transfer_auth account since either the user or propeller could be payer for txn.
//     // //  payer could be the same as user_auth if user manually completing the txn but still need
//     // //  to have a separate field to account for it
//     // #[account(mut)]
//     // pub payer: Signer<'info>,
//     pub token_program: Program<'info, Token>,
// }
// pub fn handle_add(
//     ctx: Context<AddOrRemove>,
//     params: AddParams,
//     // input_amounts: [u64; TOKEN_COUNT],
//     // minimum_mint_amount: u64,
// ) -> Result<u64> {
//     let pool_state = &ctx.accounts.pool;
//     require!(!pool_state.is_paused, PoolError::PoolIsPaused);
//
//     let input_amounts = params.input_amounts;
//     let minimum_mint_amount = params.minimum_mint_amount;
//     require!(input_amounts.iter().any(|&x| x > 0), PoolError::AddRequiresAtLeastOneToken);
//     let lp_total_supply = ctx.accounts.lp_mint.supply;
//     //initial add to pool must add all tokens
//     if lp_total_supply == 0 {
//         require!(input_amounts.iter().all(|&x| x > 0), PoolError::InitialAddRequiresAllTokens);
//     }
//
//     let pool = &ctx.accounts.pool;
//     let user_token_accounts = [&ctx.accounts.user_token_account_0, &ctx.accounts.user_token_account_1];
//     let pool_token_accounts = [&ctx.accounts.pool_token_account_0, &ctx.accounts.pool_token_account_1];
//     let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
//     let current_ts = Clock::get()?.unix_timestamp;
//     require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
//     let (user_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::add(
//         &common::array_equalize(input_amounts, pool.token_decimal_equalizers),
//         &common::array_equalize(pool_balances, pool.token_decimal_equalizers),
//         pool.amp_factor.get(current_ts),
//         pool.lp_fee.get(),
//         pool.governance_fee.get(),
//         common::to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
//         pool.previous_depth.into(),
//     )?;
//     let (mint_amount, governance_mint_amount, latest_depth) = common::result_from_equalized(
//         user_amount,
//         pool.lp_decimal_equalizer,
//         governance_mint_amount,
//         pool.lp_decimal_equalizer,
//         latest_depth,
//     );
//     require_gte!(mint_amount, minimum_mint_amount, PoolError::OutsideSpecifiedLimits);
//     let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());
//     for input_amount in input_amounts.iter().take(TOKEN_COUNT) {
//         let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
//         if *input_amount > 0u64 {
//             let pool_token_account = pool_token_account.to_account_info();
//             let user_token_account = user_token_account.to_account_info();
//             let user_transfer_authority = ctx.accounts.user_transfer_authority.to_account_info();
//             token::transfer(
//                 CpiContext::new(
//                     ctx.accounts.token_program.to_account_info(),
//                     token::Transfer {
//                         from: user_token_account.clone(),
//                         to: pool_token_account.clone(),
//                         authority: user_transfer_authority.clone(),
//                     },
//                 ),
//                 *input_amount,
//             )?;
//         }
//     }
//
//     token::mint_to(
//         CpiContext::new_with_signer(
//             ctx.accounts.token_program.to_account_info(),
//             token::MintTo {
//                 // source
//                 mint: ctx.accounts.lp_mint.to_account_info(),
//                 to: ctx.accounts.user_lp_token_account.to_account_info(),
//                 authority: ctx.accounts.pool.to_account_info(),
//             },
//             &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
//         ),
//         mint_amount,
//     )?;
//
//     if governance_mint_amount > 0 {
//         token::mint_to(
//             CpiContext::new_with_signer(
//                 ctx.accounts.token_program.to_account_info(),
//                 token::MintTo {
//                     // source
//                     mint: ctx.accounts.lp_mint.to_account_info(),
//                     to: ctx.accounts.governance_fee.to_account_info(),
//                     authority: ctx.accounts.pool.to_account_info(),
//                 },
//                 &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
//             ),
//             governance_mint_amount,
//         )?;
//     }
//
//     let pool_state = &mut ctx.accounts.pool;
//     pool_state.previous_depth = latest_depth;
//     Ok(mint_amount)
// }

#[derive(Accounts)]
pub struct AddOrRemove<'info> {
    pub swap: Swap<'info>,

    #[account(
    mut,
    token::mint = swap.lp_mint,
    )]
    pub user_lp_token_account: Box<Account<'info, TokenAccount>>,
}

pub fn handle_add(
    ctx: Context<AddOrRemove>,
    params: AddParams,
    // input_amounts: [u64; TOKEN_COUNT],
    // minimum_mint_amount: u64,
) -> Result<u64> {
    let pool_state = &ctx.accounts.swap.pool;
    require!(!pool_state.is_paused, PoolError::PoolIsPaused);

    let input_amounts = params.input_amounts;
    let minimum_mint_amount = params.minimum_mint_amount;
    require!(input_amounts.iter().any(|&x| x > 0), PoolError::AddRequiresAtLeastOneToken);
    let lp_total_supply = ctx.accounts.swap.lp_mint.supply;
    //initial add to pool must add all tokens
    if lp_total_supply == 0 {
        require!(input_amounts.iter().all(|&x| x > 0), PoolError::InitialAddRequiresAllTokens);
    }

    let pool = &ctx.accounts.swap.pool;
    let user_token_accounts = [&ctx.accounts.swap.user_token_account_0, &ctx.accounts.swap.user_token_account_1];
    let pool_token_accounts = [&ctx.accounts.swap.pool_token_account_0, &ctx.accounts.swap.pool_token_account_1];
    let pool_balances = [ctx.accounts.swap.pool_token_account_0.amount, ctx.accounts.swap.pool_token_account_1.amount];
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    let (user_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::add(
        &common::array_equalize(input_amounts, pool.token_decimal_equalizers),
        &common::array_equalize(pool_balances, pool.token_decimal_equalizers),
        pool.amp_factor.get(current_ts),
        pool.lp_fee.get(),
        pool.governance_fee.get(),
        common::to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
        pool.previous_depth.into(),
    )?;
    let (mint_amount, governance_mint_amount, latest_depth) = common::result_from_equalized(
        user_amount,
        pool.lp_decimal_equalizer,
        governance_mint_amount,
        pool.lp_decimal_equalizer,
        latest_depth,
    );
    require_gte!(mint_amount, minimum_mint_amount, PoolError::OutsideSpecifiedLimits);
    let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());
    for input_amount in input_amounts.iter().take(TOKEN_COUNT) {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        if *input_amount > 0u64 {
            let pool_token_account = pool_token_account.to_account_info();
            let user_token_account = user_token_account.to_account_info();
            let user_transfer_authority = ctx.accounts.swap.user_transfer_authority.to_account_info();
            token::transfer(
                CpiContext::new(
                    ctx.accounts.swap.token_program.to_account_info(),
                    token::Transfer {
                        from: user_token_account.clone(),
                        to: pool_token_account.clone(),
                        authority: user_transfer_authority.clone(),
                    },
                ),
                *input_amount,
            )?;
        }
    }

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.swap.token_program.to_account_info(),
            token::MintTo {
                // source
                mint: ctx.accounts.swap.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token_account.to_account_info(),
                authority: ctx.accounts.swap.pool.to_account_info(),
            },
            &[&gen_pool_signer_seeds!(ctx.accounts.swap.pool)[..]],
        ),
        mint_amount,
    )?;

    if governance_mint_amount > 0 {
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.swap.token_program.to_account_info(),
                token::MintTo {
                    // source
                    mint: ctx.accounts.swap.lp_mint.to_account_info(),
                    to: ctx.accounts.swap.governance_fee.to_account_info(),
                    authority: ctx.accounts.swap.pool.to_account_info(),
                },
                &[&gen_pool_signer_seeds!(ctx.accounts.swap.pool)[..]],
            ),
            governance_mint_amount,
        )?;
    }

    let pool_state = &mut ctx.accounts.swap.pool;
    pool_state.previous_depth = latest_depth;
    Ok(mint_amount)
}
