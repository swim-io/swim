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
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[0]) @ PoolError::PoolTokenAccountExpected,
    constraint = pool_token_account_0.key() == pool.token_keys[0] @ PoolError::PoolTokenAccountExpected,
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[1]) @ PoolError::PoolTokenAccountExpected,
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

impl<'info> Swap<'info> {
    // pub fn validate(&self) -> Result<()> {
    //     let pool_state = &self.pool;
    //
    //     require_keys_eq!(
    //         self.pool_token_account_0.key(),
    //         pool_state.token_keys[0],
    //         PoolError::PoolTokenAccountExpected
    //     );
    //     require_keys_eq!(
    //         self.pool_token_account_1.key(),
    //         pool_state.token_keys[1],
    //         PoolError::PoolTokenAccountExpected
    //     );
    //     require_keys_eq!(self.lp_mint.key(), pool_state.lp_mint_key, PoolError::InvalidMintAccount);
    //     require_keys_eq!(
    //         self.governance_fee.key(),
    //         pool_state.governance_fee_key,
    //         PoolError::InvalidGovernanceFeeAccount
    //     );
    //     msg!("finished accounts context check");
    //     Ok(())
    // }
    // pub fn accounts(ctx: &Context<Swap>) -> Result<()> {
    //     ctx.accounts.validate()
    // }

    pub fn update_previous_depth(&mut self, latest_depth: u128) -> Result<()> {
        let pool_state = &mut self.pool;
        pool_state.previous_depth = latest_depth;
        Ok(())
    }

    pub fn transfer_from_user_to_pool(
        &self,
        user_token_account: &Account<'info, TokenAccount>,
        user_transfer_authority: &Signer<'info>,
        pool_token_account: &Account<'info, TokenAccount>,
        amount: u64,
    ) -> Result<()> {
        if amount > 0u64 {
            token::transfer(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    token::Transfer {
                        from: user_token_account.to_account_info(),
                        to: pool_token_account.to_account_info(),
                        authority: user_transfer_authority.to_account_info(),
                    },
                ),
                amount,
            )?;
        }
        Ok(())

        // let seeds = gen_pool_signer_seeds(
        //     &self.pool.key(),
        //     &self.pool.token_mint_keys[0],
        //     &self.pool.token_mint_keys[1],
        //     &self.lp_mint.key(),
        // );
        // let cpi_accounts = Transfer {
        //     from: user_token_account.to_account_info(),
        //     to: pool_token_account.to_account_info(),
        //     authority: self.user_transfer_authority.to_account_info(),
        // };
        // let cpi_program = self.token_program.to_account_info();
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // token::transfer(cpi_ctx, amount)?;
        // Ok(())
    }

    pub fn transfer_from_pool_to_user(
        &self,
        pool_token_account: &Account<'info, TokenAccount>,
        user_token_account: &Account<'info, TokenAccount>,
        amount: u64,
    ) -> Result<()> {
        if amount > 0u64 {
            token::transfer(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    token::Transfer {
                        // source
                        from: pool_token_account.to_account_info(),
                        to: user_token_account.to_account_info(),
                        authority: self.pool.to_account_info(),
                    },
                    &[&gen_pool_signer_seeds!(self.pool)[..]],
                ),
                amount,
            )?;
        }
        Ok(())
    }

    pub fn mint_lp_tokens(&self, recipient: &Account<'info, TokenAccount>, mint_amount: u64) -> Result<()> {
        if mint_amount > 0 {
            token::mint_to(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    token::MintTo {
                        // source
                        mint: self.lp_mint.to_account_info(),
                        to: recipient.to_account_info(),
                        authority: self.pool.to_account_info(),
                    },
                    &[&gen_pool_signer_seeds!(self.pool)[..]],
                ),
                mint_amount,
            )?;
        }
        Ok(())
    }

    // pub fn burn_lp_tokens(&self, from: &Account<'info, TokenAccount>, authority: )

    // pub fn mint_governance_fee(&self, governance_mint_amount: u64) -> Result<()> {
    //     if governance_mint_amount > 0 {
    //         token::mint_to(
    //             CpiContext::new_with_signer(
    //                 self.token_program.to_account_info(),
    //                 token::MintTo {
    //                     // source
    //                     mint: self.lp_mint.to_account_info(),
    //                     to: self.governance_fee.to_account_info(),
    //                     authority: self.pool.to_account_info(),
    //                 },
    //                 &[&gen_pool_signer_seeds!(self.pool)[..]],
    //             ),
    //             governance_mint_amount,
    //         )?;
    //     }
    //     Ok(())
    // }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SwapExactInputParams {
    pub exact_input_amounts: [u64; TOKEN_COUNT],
    pub output_token_index: u8,
    pub minimum_output_amount: u64,
}

pub fn handle_swap_exact_input(
    ctx: Context<Swap>,
    swap_exact_input_params: SwapExactInputParams,
    // exact_input_amounts: [u64; TOKEN_COUNT],
    // output_token_index: u8,
    // minimum_output_amount: u64,
) -> Result<u64> {
    // let output_token_index = output_token_index as usize;
    let output_token_index = swap_exact_input_params.output_token_index as usize;
    let exact_input_amounts = swap_exact_input_params.exact_input_amounts;
    let minimum_output_amount = swap_exact_input_params.minimum_output_amount;
    if exact_input_amounts.iter().all(|amount| *amount == 0)
        || output_token_index >= TOKEN_COUNT
        || exact_input_amounts[output_token_index] != 0
    {
        return err!(PoolError::InvalidSwapExactInputParameters);
    }

    let pool = &ctx.accounts.pool;
    require!(!pool.is_paused, PoolError::PoolIsPaused);

    // let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
    // let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
    // let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
    //
    // let user_token_account_0 = &ctx.accounts.user_token_account_0;
    // let user_token_account_1 = &ctx.accounts.user_token_account_1;
    // let user_token_accounts = [user_token_account_0, user_token_account_1];
    //
    // let pool_token_accounts = [pool_token_account_0, pool_token_account_1];

    let user_token_accounts = &[&ctx.accounts.user_token_account_0, &ctx.accounts.user_token_account_1];
    let pool_token_accounts = &[&ctx.accounts.pool_token_account_0, &ctx.accounts.pool_token_account_1];
    let pool_balances = pool_token_accounts.map(|account| account.amount);

    let lp_total_supply = ctx.accounts.lp_mint.supply;
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    let (user_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::swap_exact_input(
        &array_equalize(exact_input_amounts, pool.token_decimal_equalizers),
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

    require_gte!(output_amount, minimum_output_amount, PoolError::OutsideSpecifiedLimits);

    let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());
    let user_transfer_auth = &ctx.accounts.user_transfer_authority;
    for i in 0..TOKEN_COUNT {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        // if exact_input_amounts[i] > 0 {
        //     token::transfer(
        //         CpiContext::new(
        //             ctx.accounts.token_program.to_account_info(),
        //             token::Transfer {
        //                 // source
        //                 from: user_token_account.to_account_info(),
        //                 to: pool_token_account.to_account_info(),
        //                 authority: ctx.accounts.user_transfer_authority.to_account_info(),
        //             },
        //         ),
        //         exact_input_amounts[i],
        //     )?;
        // }
        ctx.accounts.transfer_from_user_to_pool(
            user_token_account,
            user_transfer_auth,
            pool_token_account,
            exact_input_amounts[i],
        )?;
    }
    let user_output_token_account = user_token_accounts[output_token_index];
    let pool_output_token_account = pool_token_accounts[output_token_index];
    ctx.accounts.transfer_from_pool_to_user(&pool_output_token_account, &user_output_token_account, output_amount)?;
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

    ctx.accounts.mint_lp_tokens(&ctx.accounts.governance_fee, governance_mint_amount)?;

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
    ctx.accounts.update_previous_depth(latest_depth)?;
    Ok(output_amount)
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SwapExactOutputParams {
    pub maximum_input_amount: u64,
    pub input_token_index: u8,
    pub exact_output_amounts: [u64; TOKEN_COUNT],
}

pub fn handle_swap_exact_output(
    ctx: Context<Swap>,
    swap_exact_output_params: SwapExactOutputParams,
) -> Result<Vec<u64>> {
    let input_token_index = swap_exact_output_params.input_token_index as usize;
    let exact_output_amounts = swap_exact_output_params.exact_output_amounts;

    require!(input_token_index < TOKEN_COUNT, PoolError::InvalidSwapExactOutputParameters);
    require!(exact_output_amounts[input_token_index] == 0, PoolError::InvalidSwapExactOutputParameters);

    let user_token_accounts = &[&ctx.accounts.user_token_account_0, &ctx.accounts.user_token_account_1];
    let pool_token_accounts = &[&ctx.accounts.pool_token_account_0, &ctx.accounts.pool_token_account_1];
    let pool_balances = pool_token_accounts.map(|account| account.amount);
    let are_output_amounts_valid = exact_output_amounts.iter().any(|amount| *amount > 0);
    // at least one of the output amounts should be greater than 0
    require!(are_output_amounts_valid, PoolError::InvalidSwapExactOutputParameters);
    // || exact_output_amounts[input_token_index] != 0
    // if exact_output_amounts.iter().all(|amount| *amount == 0)
    //   || input_token_index >= TOKEN_COUNT
    //   || exact_output_amounts[input_token_index] != 0
    // {
    //   return err!(PoolError::InvalidSwapExactOutputParameters);
    // }
    let are_pool_balances_sufficient = exact_output_amounts
        .iter()
        .zip(pool_balances.iter())
        .all(|(output_amount, pool_balance)| *output_amount < *pool_balance);
    require!(are_pool_balances_sufficient, PoolError::InsufficientPoolTokenAccountBalance);

    let pool = &ctx.accounts.pool;
    require!(!pool.is_paused, PoolError::PoolIsPaused);

    let user_transfer_auth = &ctx.accounts.user_transfer_authority;

    let lp_total_supply = ctx.accounts.lp_mint.supply;
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    let (user_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::swap_exact_output(
        input_token_index,
        &array_equalize(exact_output_amounts, pool.token_decimal_equalizers),
        &array_equalize(pool_balances, pool.token_decimal_equalizers),
        pool.amp_factor.get(current_ts),
        pool.lp_fee.get(),
        pool.governance_fee.get(),
        to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
        pool.previous_depth.into(),
    )?;
    let (input_amount, governance_mint_amount, latest_depth) = result_from_equalized(
        user_amount,
        pool.token_decimal_equalizers[input_token_index],
        governance_mint_amount,
        pool.lp_decimal_equalizer,
        latest_depth,
    );

    let maximum_input_amount = swap_exact_output_params.maximum_input_amount;
    require_gte!(maximum_input_amount, input_amount, PoolError::OutsideSpecifiedLimits);

    let user_input_token_account = user_token_accounts[input_token_index];
    let pool_input_token_account = pool_token_accounts[input_token_index];
    ctx.accounts.transfer_from_user_to_pool(
        user_input_token_account,
        user_transfer_auth,
        pool_input_token_account,
        input_amount,
    )?;
    // token::transfer(
    //     CpiContext::new(
    //         ctx.accounts.token_program.to_account_info(),
    //         token::Transfer {
    //             // source
    //             from: user_input_token_account.to_account_info(),
    //             to: pool_input_token_account.to_account_info(),
    //             authority: user_transfer_auth.to_account_info(),
    //         },
    //     ),
    //     input_amount,
    // )?;

    let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());

    for i in 0..TOKEN_COUNT {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        ctx.accounts.transfer_from_pool_to_user(pool_token_account, user_token_account, exact_output_amounts[i])?;
        // if exact_output_amounts[i] > 0 {
        //     token::transfer(
        //         CpiContext::new_with_signer(
        //             ctx.accounts.token_program.to_account_info(),
        //             token::Transfer {
        //                 // source
        //                 from: pool_token_account.to_account_info(),
        //                 to: user_token_account.to_account_info(),
        //                 authority: ctx.accounts.pool.to_account_info(),
        //             },
        //             &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
        //         ),
        //         exact_output_amounts[i],
        //     )?;
        // }
    }

    ctx.accounts.mint_lp_tokens(&ctx.accounts.governance_fee, governance_mint_amount)?;

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
    ctx.accounts.update_previous_depth(latest_depth)?;
    Ok(exact_output_amounts.into())
}
