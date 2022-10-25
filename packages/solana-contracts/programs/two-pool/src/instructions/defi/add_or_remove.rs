use {
    crate::{
        common::{self, array_equalize, result_from_equalized, to_equalized},
        decimal::DecimalU64,
        defi::swap::*,
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
pub struct AddOrRemove<'info> {
    pub swap: Swap<'info>,

    #[account(
    mut,
    token::mint = swap.lp_mint,
    )]
    pub user_lp_token_account: Box<Account<'info, TokenAccount>>,
}

impl<'info> AddOrRemove<'info> {
    fn burn_user_lp_tokens(&self, burn_amount: u64) -> Result<()> {
        token::burn(
            CpiContext::new(
                self.swap.token_program.to_account_info(),
                token::Burn {
                    mint: self.swap.lp_mint.to_account_info(),
                    from: self.user_lp_token_account.to_account_info(),
                    authority: self.swap.user_transfer_authority.to_account_info(),
                },
            ),
            burn_amount,
        )
    }
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
    let user_token_accounts = &[&ctx.accounts.swap.user_token_account_0, &ctx.accounts.swap.user_token_account_1];
    let pool_token_accounts = &[&ctx.accounts.swap.pool_token_account_0, &ctx.accounts.swap.pool_token_account_1];
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
    let user_transfer_authority = &ctx.accounts.swap.user_transfer_authority;
    for input_amount in input_amounts.iter().take(TOKEN_COUNT) {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        ctx.accounts.swap.transfer_from_user_to_pool(
            user_token_account,
            user_transfer_authority,
            pool_token_account,
            *input_amount,
        )?;
        // if *input_amount > 0u64 {
        //     // let pool_token_account = pool_token_account.to_account_info();
        //     // let user_token_account = user_token_account.to_account_info();
        //     // let user_transfer_authority = ctx.accounts.swap.user_transfer_authority.to_account_info();
        //     // ctx.accounts.swap.transfer_from_user_to_pool(
        //     //     user_token_account,
        //     //     user_transfer_authority,
        //     //     pool_token_account,
        //     //     *input_amount,
        //     // )?;
        //     // token::transfer(
        //     //     CpiContext::new(
        //     //         ctx.accounts.swap.token_program.to_account_info(),
        //     //         token::Transfer {
        //     //             from: user_token_account.clone(),
        //     //             to: pool_token_account.clone(),
        //     //             authority: user_transfer_authority.clone(),
        //     //         },
        //     //     ),
        //     //     *input_amount,
        //     // )?;
        // }
    }

    // token::mint_to(
    //     CpiContext::new_with_signer(
    //         ctx.accounts.swap.token_program.to_account_info(),
    //         token::MintTo {
    //             // source
    //             mint: ctx.accounts.swap.lp_mint.to_account_info(),
    //             to: ctx.accounts.user_lp_token_account.to_account_info(),
    //             authority: ctx.accounts.swap.pool.to_account_info(),
    //         },
    //         &[&gen_pool_signer_seeds!(ctx.accounts.swap.pool)[..]],
    //     ),
    //     mint_amount,
    // )?;

    // mint user lp tokens
    ctx.accounts.swap.mint_lp_tokens(&ctx.accounts.user_lp_token_account, mint_amount)?;

    // mint governance fee
    ctx.accounts.swap.mint_lp_tokens(&ctx.accounts.swap.governance_fee, governance_mint_amount)?;
    // if governance_mint_amount > 0 {
    //     token::mint_to(
    //         CpiContext::new_with_signer(
    //             ctx.accounts.swap.token_program.to_account_info(),
    //             token::MintTo {
    //                 // source
    //                 mint: ctx.accounts.swap.lp_mint.to_account_info(),
    //                 to: ctx.accounts.swap.governance_fee.to_account_info(),
    //                 authority: ctx.accounts.swap.pool.to_account_info(),
    //             },
    //             &[&gen_pool_signer_seeds!(ctx.accounts.swap.pool)[..]],
    //         ),
    //         governance_mint_amount,
    //     )?;
    // }

    // let pool_state = &mut ctx.accounts.swap.pool;
    // pool_state.previous_depth = latest_depth;
    ctx.accounts.swap.update_previous_depth(latest_depth)?;
    Ok(mint_amount)
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RemoveExactBurnParams {
    pub exact_burn_amount: u64,
    pub output_token_index: u8,
    pub minimum_output_amount: u64,
}

pub fn handle_remove_exact_burn(
    ctx: Context<AddOrRemove>,
    remove_exact_burn_params: RemoveExactBurnParams,
) -> Result<u64> {
    let output_token_index = remove_exact_burn_params.output_token_index as usize;
    let exact_burn_amount = remove_exact_burn_params.exact_burn_amount;
    let lp_total_supply = ctx.accounts.swap.lp_mint.supply;
    require!(output_token_index < TOKEN_COUNT, PoolError::InvalidRemoveExactBurnParameters);
    require_gt!(exact_burn_amount, 0u64, PoolError::InvalidRemoveExactBurnParameters);
    require_gt!(lp_total_supply, exact_burn_amount, PoolError::InvalidRemoveExactBurnParameters);

    // let pool = &ctx.accounts.swap.pool;
    // let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
    // let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
    // let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
    // let _lp_mint = &ctx.accounts.lp_mint;
    // let _governance_fee = &ctx.accounts.governance_fee;
    // // let user_transfer_auth = &ctx.accounts.user_transfer_authority;
    // let user_token_account_0 = &ctx.accounts.user_token_account_0;
    // let user_token_account_1 = &ctx.accounts.user_token_account_1;
    // let user_token_accounts = [user_token_account_0, user_token_account_1];
    //
    // let pool_token_accounts = [pool_token_account_0, pool_token_account_1];

    let pool = &ctx.accounts.swap.pool;
    require!(!pool.is_paused, PoolError::PoolIsPaused);
    let user_token_accounts = [&ctx.accounts.swap.user_token_account_0, &ctx.accounts.swap.user_token_account_1];
    let pool_token_accounts = [&ctx.accounts.swap.pool_token_account_0, &ctx.accounts.swap.pool_token_account_1];
    let pool_balances = [ctx.accounts.swap.pool_token_account_0.amount, ctx.accounts.swap.pool_token_account_1.amount];

    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    let (user_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::remove_exact_burn(
        to_equalized(exact_burn_amount, pool.lp_decimal_equalizer),
        output_token_index,
        &array_equalize(pool_balances, pool.token_decimal_equalizers),
        pool.amp_factor.get(current_ts),
        pool.lp_fee.get(),
        pool.governance_fee.get(),
        to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
        pool.previous_depth.into(),
    )?;
    let (output_amount, governance_mint_amount, latest_depth) = result_from_equalized(
        user_amount,
        pool.token_decimal_equalizers[output_token_index],
        governance_mint_amount,
        pool.lp_decimal_equalizer,
        latest_depth,
    );
    let minimum_output_amount = remove_exact_burn_params.minimum_output_amount;
    require_gte!(output_amount, minimum_output_amount, PoolError::OutsideSpecifiedLimits);

    // let _token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());
    ctx.accounts.burn_user_lp_tokens(exact_burn_amount)?;
    // token::burn(
    //     CpiContext::new(
    //         ctx.accounts.token_program.to_account_info(),
    //         token::Burn {
    //             mint: ctx.accounts.lp_mint.to_account_info(),
    //             from: ctx.accounts.user_lp_token_account.to_account_info(),
    //             authority: ctx.accounts.user_transfer_authority.to_account_info(),
    //         },
    //     ),
    //     exact_burn_amount,
    // )?;

    let user_output_token_account = user_token_accounts[output_token_index];
    let pool_output_token_account = pool_token_accounts[output_token_index];
    ctx.accounts.swap.transfer_from_pool_to_user(
        pool_output_token_account,
        user_output_token_account,
        output_amount,
    )?;
    // token::transfer(
    //     CpiContext::new_with_signer(
    //         ctx.accounts.token_program.to_account_info(),
    //         token::Transfer {
    //             // source
    //             from: pool_output_token_account.to_account_info(),
    //             to: user_output_token_account.to_account_info(),
    //             authority: ctx.accounts.pool.to_account_info(),
    //         },
    //         &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
    //     ),
    //     output_amount,
    // )?;

    ctx.accounts.swap.mint_lp_tokens(&ctx.accounts.swap.governance_fee, governance_mint_amount)?;
    // ctx.accounts.swap.mint_governance_fee(governance_mint_amount)?;
    // if governance_mint_amount > 0 {
    //     token::mint_to(
    //         CpiContext::new_with_signer(
    //             ctx.accounts.token_program.to_account_info(),
    //             token::MintTo {
    //                 // source
    //                 mint: ctx.accounts.lp_mint.to_account_info(),
    //                 to: ctx.accounts.governance_fee.to_account_info(),
    //                 authority: ctx.accounts.pool.to_account_info(),
    //             },
    //             &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
    //         ),
    //         governance_mint_amount,
    //     )?;
    // }

    // let pool = &mut ctx.accounts.swap.pool;
    // pool.previous_depth = latest_depth;
    ctx.accounts.swap.update_previous_depth(latest_depth)?;
    Ok(output_amount)
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RemoveExactOutputParams {
    pub maximum_burn_amount: u64,
    pub exact_output_amounts: [u64; TOKEN_COUNT],
}

pub fn handle_remove_exact_output(
    ctx: Context<AddOrRemove>,
    remove_exact_output_params: RemoveExactOutputParams,
) -> Result<Vec<u64>> {
    let maximum_burn_amount = remove_exact_output_params.maximum_burn_amount;
    let exact_output_amounts = remove_exact_output_params.exact_output_amounts;
    let pool = &ctx.accounts.swap.pool;
    require!(!pool.is_paused, PoolError::PoolIsPaused);
    let user_token_accounts = &[&ctx.accounts.swap.user_token_account_0, &ctx.accounts.swap.user_token_account_1];
    let pool_token_accounts = &[&ctx.accounts.swap.pool_token_account_0, &ctx.accounts.swap.pool_token_account_1];
    let pool_balances = [ctx.accounts.swap.pool_token_account_0.amount, ctx.accounts.swap.pool_token_account_1.amount];

    let lp_total_supply = ctx.accounts.swap.lp_mint.supply;
    // let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];

    require!(exact_output_amounts.iter().any(|amount| *amount > 0), PoolError::InvalidRemoveExactOutputParameters);
    require_gt!(maximum_burn_amount, 0u64, PoolError::InvalidRemoveExactOutputParameters);
    let are_output_amounts_valid = exact_output_amounts
        .iter()
        .zip(pool_balances.iter())
        .all(|(output_amount, pool_balance)| *output_amount < *pool_balance);
    require!(are_output_amounts_valid, PoolError::InvalidRemoveExactOutputParameters);

    // let pool = &ctx.accounts.pool;
    // let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
    // let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
    // let _lp_mint = &ctx.accounts.lp_mint;
    // let _governance_fee = &ctx.accounts.governance_fee;
    // // let user_transfer_auth = &ctx.accounts.user_transfer_authority;
    // let user_token_account_0 = &ctx.accounts.user_token_account_0;
    // let user_token_account_1 = &ctx.accounts.user_token_account_1;
    // let user_token_accounts = [user_token_account_0, user_token_account_1];
    //
    // let pool_token_accounts = [pool_token_account_0, pool_token_account_1];

    let current_ts = get_current_ts()?;

    let (burn_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::remove_exact_output(
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
    require_gte!(lp_total_supply, burn_amount, PoolError::BurnAmountExceedsTotalSupply);

    let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());
    ctx.accounts.burn_user_lp_tokens(burn_amount)?;
    // token::burn(
    //     CpiContext::new(
    //         ctx.accounts.token_program.to_account_info(),
    //         token::Burn {
    //             mint: ctx.accounts.lp_mint.to_account_info(),
    //             from: ctx.accounts.user_lp_token_account.to_account_info(),
    //             authority: ctx.accounts.user_transfer_authority.to_account_info(),
    //         },
    //     ),
    //     burn_amount,
    // )?;

    for i in 0..TOKEN_COUNT {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        ctx.accounts.swap.transfer_from_pool_to_user(
            pool_token_account,
            user_token_account,
            exact_output_amounts[i],
        )?;
        // if exact_output_amounts[i] > 0 {
        //     // token::transfer(
        //     //     CpiContext::new_with_signer(
        //     //         ctx.accounts.token_program.to_account_info(),
        //     //         token::Transfer {
        //     //             // source
        //     //             from: pool_token_account.to_account_info(),
        //     //             to: user_token_account.to_account_info(),
        //     //             authority: ctx.accounts.pool.to_account_info(),
        //     //         },
        //     //         &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
        //     //     ),
        //     //     exact_output_amounts[i],
        //     // )?;
        // }
    }
    ctx.accounts.swap.mint_lp_tokens(&ctx.accounts.swap.governance_fee, governance_mint_amount)?;

    // if governance_mint_amount > 0 {
    //     token::mint_to(
    //         CpiContext::new_with_signer(
    //             ctx.accounts.token_program.to_account_info(),
    //             token::MintTo {
    //                 // source
    //                 mint: ctx.accounts.lp_mint.to_account_info(),
    //                 to: ctx.accounts.governance_fee.to_account_info(),
    //                 authority: ctx.accounts.pool.to_account_info(),
    //             },
    //             &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
    //         ),
    //         governance_mint_amount,
    //     )?;
    // }
    // let pool = &mut ctx.accounts.pool;
    // pool.previous_depth = latest_depth;
    ctx.accounts.swap.update_previous_depth(latest_depth)?;
    Ok(exact_output_amounts.into())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RemoveUniformParams {
    pub exact_burn_amount: u64,
    pub minimum_output_amounts: [u64; TOKEN_COUNT],
}

pub fn handle_remove_uniform(
    ctx: Context<AddOrRemove>,
    remove_uniform_params: RemoveUniformParams,
) -> Result<Vec<u64>> {
    let exact_burn_amount = remove_uniform_params.exact_burn_amount;
    let minimum_output_amounts = remove_uniform_params.minimum_output_amounts;
    let lp_total_supply = ctx.accounts.swap.lp_mint.supply;
    require_gt!(exact_burn_amount, 0u64, PoolError::InvalidRemoveUniformParameters);
    require_gte!(lp_total_supply, exact_burn_amount, PoolError::InvalidRemoveUniformParameters);

    // let pool = &ctx.accounts.pool;
    // let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
    // let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
    // let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];

    //Note: this is the only ix that can be called even if the pool is paused.
    let pool = &ctx.accounts.swap.pool;
    let user_token_accounts = &[&ctx.accounts.swap.user_token_account_0, &ctx.accounts.swap.user_token_account_1];
    let pool_token_accounts = &[&ctx.accounts.swap.pool_token_account_0, &ctx.accounts.swap.pool_token_account_1];
    let pool_balances = [ctx.accounts.swap.pool_token_account_0.amount, ctx.accounts.swap.pool_token_account_1.amount];

    let user_share = DecimalU64::from(exact_burn_amount) / lp_total_supply;
    //u64 can store 19 decimals, previous_depth can theoretically go up to TOKEN_COUNT * u64::MAX
    //hence, just to be safe, we allow for previous depth to have up to 20 decimals
    //therefore we can only multiply with a number with at most 18 decimals to stay within
    //the 38 max decimals range of u128
    const DECIMAL_UPSHIFT: u32 = 18;
    let user_depth = (pool.previous_depth * ((user_share * 10u64.pow(DECIMAL_UPSHIFT)).trunc() as u128))
        / 10u128.pow(DECIMAL_UPSHIFT);
    let latest_depth = pool.previous_depth - user_depth;

    // let user_token_account_0 = &ctx.accounts.user_token_account_0;
    // let user_token_account_1 = &ctx.accounts.user_token_account_1;
    // let user_token_accounts = [user_token_account_0, user_token_account_1];
    //
    // let pool_token_accounts = [pool_token_account_0, pool_token_account_1];

    let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());

    let mut output_amounts = vec![];
    for i in 0..TOKEN_COUNT {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        let output_amount = (pool_balances[i] * user_share).trunc();
        output_amounts.push(output_amount);
        require_gte!(output_amount, minimum_output_amounts[i], PoolError::OutsideSpecifiedLimits);
        ctx.accounts.swap.transfer_from_pool_to_user(&pool_token_account, &user_token_account, output_amount)?;
        // token::transfer(
        //     CpiContext::new_with_signer(
        //         ctx.accounts.token_program.to_account_info(),
        //         token::Transfer {
        //             // source
        //             from: pool_token_account.to_account_info(),
        //             to: user_token_account.to_account_info(),
        //             authority: ctx.accounts.pool.to_account_info(),
        //         },
        //         &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
        //     ),
        //     output_amount,
        // )?;
    }

    ctx.accounts.burn_user_lp_tokens(exact_burn_amount)?;
    // token::burn(
    //     CpiContext::new(
    //         ctx.accounts.token_program.to_account_info(),
    //         token::Burn {
    //             mint: ctx.accounts.lp_mint.to_account_info(),
    //             from: ctx.accounts.user_lp_token_account.to_account_info(),
    //             authority: ctx.accounts.user_transfer_authority.to_account_info(),
    //         },
    //     ),
    //     exact_burn_amount,
    // )?;
    ctx.accounts.swap.update_previous_depth(latest_depth)?;
    //
    // let pool = &mut ctx.accounts.pool;
    // pool.previous_depth = latest_depth;

    Ok(output_amounts)
}
