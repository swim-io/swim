// use {
//     crate::{
//         common::{array_equalize, result_from_equalized, to_equalized},
//         error::*,
//         gen_pool_signer_seeds,
//         invariant::Invariant,
//         TwoPool, TOKEN_COUNT,
//     },
//     anchor_lang::prelude::*,
//     anchor_spl::{
//         token,
//         token::{Mint, Token, TokenAccount},
//     },
//     std::iter::zip,
// };
//
// /// Swaps in the exact specified amounts for
// /// at least `minimum_out_amount` of the output_token specified
// /// by output_token_index
// ///
// /// Accounts expected by this instruction:
// ///     0. `[w]` The pool state account
// ///     1. `[]` pool authority
// ///     2. ..2 + TOKEN_COUNT `[w]` pool's token accounts
// ///     3. ..3 + TOKEN_COUNT `[w]` LP Token Mint
// ///     4. ..4 + TOKEN_COUNT `[w]` governance_fee_account
// ///     5. ..5 + TOKEN_COUNT `[s]` user transfer authority account
// ///     6. ..6 + TOKEN_COUNT `[w]` user token accounts
// #[derive(Accounts)]
// pub struct SwapExactOutput<'info> {
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
//     pub pool: Account<'info, TwoPool>,
//     #[account(
//     mut,
//     token::mint = pool.token_mint_keys[0],
//     token::authority = pool,
//     )]
//     pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
//     #[account(
//     mut,
//     token::mint = pool.token_mint_keys[1],
//     token::authority = pool,
//     )]
//     pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub lp_mint: Box<Account<'info, Mint>>,
//     #[account(
//     mut,
//     token::mint = lp_mint
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
//     // //TODO: probably need a user_transfer_auth account since either the user or propeller could be payer for txn.
//     // //  payer could be the same as user_auth if user manually completing the txn but still need
//     // //  to have a separate field to account for it
//     // #[account(mut)]
//     // pub payer: Signer<'info>,
//     pub token_program: Program<'info, Token>,
// }
//
// impl<'info> SwapExactOutput<'info> {
//     pub fn accounts(ctx: &Context<SwapExactOutput>) -> Result<()> {
//         let pool_state = &ctx.accounts.pool;
//         require!(!pool_state.is_paused, PoolError::PoolIsPaused);
//         require_keys_eq!(
//             ctx.accounts.pool_token_account_0.key(),
//             pool_state.token_keys[0],
//             PoolError::PoolTokenAccountExpected
//         );
//         require_keys_eq!(
//             ctx.accounts.pool_token_account_1.key(),
//             pool_state.token_keys[1],
//             PoolError::PoolTokenAccountExpected
//         );
//         require_keys_eq!(ctx.accounts.lp_mint.key(), pool_state.lp_mint_key, PoolError::InvalidMintAccount);
//         require_keys_eq!(
//             ctx.accounts.governance_fee.key(),
//             pool_state.governance_fee_key,
//             PoolError::InvalidGovernanceFeeAccount
//         );
//         msg!("finished accounts context check");
//         Ok(())
//     }
// }
//
// #[derive(AnchorSerialize, AnchorDeserialize)]
// pub struct SwapExactOutputParams {
//     pub maximum_input_amount: u64,
//     pub input_token_index: u8,
//     pub exact_output_amounts: [u64; TOKEN_COUNT],
// }
//
// pub fn handle_swap_exact_output(
//     ctx: Context<SwapExactOutput>,
//     swap_exact_output_params: SwapExactOutputParams,
// ) -> Result<Vec<u64>> {
//     let input_token_index = swap_exact_output_params.input_token_index as usize;
//     let exact_output_amounts = swap_exact_output_params.exact_output_amounts;
//     let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
//     let are_output_amounts_valid = exact_output_amounts.iter().any(|amount| *amount == 0);
//     require!(are_output_amounts_valid, PoolError::InvalidSwapExactOutputParameters);
//     require!(input_token_index < TOKEN_COUNT, PoolError::InvalidSwapExactOutputParameters);
//     require!(exact_output_amounts[input_token_index] == 0, PoolError::InvalidSwapExactOutputParameters);
//     // || exact_output_amounts[input_token_index] != 0
//     // if exact_output_amounts.iter().all(|amount| *amount == 0)
//     //   || input_token_index >= TOKEN_COUNT
//     //   || exact_output_amounts[input_token_index] != 0
//     // {
//     //   return err!(PoolError::InvalidSwapExactOutputParameters);
//     // }
//     let are_pool_balances_sufficient = exact_output_amounts
//         .iter()
//         .zip(pool_balances.iter())
//         .all(|(output_amount, pool_balance)| *output_amount < *pool_balance);
//     require!(are_pool_balances_sufficient, PoolError::InsufficientPoolTokenAccountBalance);
//
//     let pool = &ctx.accounts.pool;
//     let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
//     let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
//     let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
//     let _lp_mint = &ctx.accounts.lp_mint;
//     let _governance_fee = &ctx.accounts.governance_fee;
//     // let user_transfer_auth = &ctx.accounts.user_transfer_authority;
//     let user_token_account_0 = &ctx.accounts.user_token_account_0;
//     let user_token_account_1 = &ctx.accounts.user_token_account_1;
//     let user_token_accounts = [user_token_account_0, user_token_account_1];
//
//     let pool_token_accounts = [pool_token_account_0, pool_token_account_1];
//
//     let lp_total_supply = ctx.accounts.lp_mint.supply;
//     let current_ts = Clock::get()?.unix_timestamp;
//     require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
//     let (user_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::swap_exact_output(
//         input_token_index,
//         &array_equalize(exact_output_amounts, pool.token_decimal_equalizers),
//         &array_equalize(pool_balances, pool.token_decimal_equalizers),
//         pool.amp_factor.get(current_ts),
//         pool.lp_fee.get(),
//         pool.governance_fee.get(),
//         to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
//         pool.previous_depth.into(),
//     )?;
//     let (input_amount, governance_mint_amount, latest_depth) = result_from_equalized(
//         user_amount,
//         pool.token_decimal_equalizers[input_token_index],
//         governance_mint_amount,
//         pool.lp_decimal_equalizer,
//         latest_depth,
//     );
//
//     let maximum_input_amount = swap_exact_output_params.maximum_input_amount;
//     require_gte!(maximum_input_amount, input_amount, PoolError::OutsideSpecifiedLimits);
//
//     let user_input_token_account = user_token_accounts[input_token_index];
//     let pool_input_token_account = pool_token_accounts[input_token_index];
//     token::transfer(
//         CpiContext::new(
//             ctx.accounts.token_program.to_account_info(),
//             token::Transfer {
//                 // source
//                 from: user_input_token_account.to_account_info(),
//                 to: pool_input_token_account.to_account_info(),
//                 authority: ctx.accounts.user_transfer_authority.to_account_info(),
//             },
//         ),
//         input_amount,
//     )?;
//
//     let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());
//
//     for i in 0..TOKEN_COUNT {
//         let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
//         if exact_output_amounts[i] > 0 {
//             token::transfer(
//                 CpiContext::new_with_signer(
//                     ctx.accounts.token_program.to_account_info(),
//                     token::Transfer {
//                         // source
//                         from: pool_token_account.to_account_info(),
//                         to: user_token_account.to_account_info(),
//                         authority: ctx.accounts.pool.to_account_info(),
//                     },
//                     &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
//                 ),
//                 exact_output_amounts[i],
//             )?;
//         }
//     }
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
//     let pool = &mut ctx.accounts.pool;
//     pool.previous_depth = latest_depth;
//     Ok(exact_output_amounts.into())
// }
