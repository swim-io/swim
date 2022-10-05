use {
    crate::{decimal::U128, error::*, gen_pool_signer_seeds, invariant::Invariant, TwoPool, TOKEN_COUNT},
    anchor_lang::{
        prelude::*,
    },
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{self, Mint, Token, TokenAccount},
    },
    std::iter::zip,
};

#[derive(Accounts)]
pub struct Add<'info> {
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

    //TODO: vanilla solana we didn't pass/ask for this account
    //  w/ user_transfer_authority it's not explicitly needed.
    // is there any type of checks that we HAVE to do related to payer?
    // #[account(mut)]
    // pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddParams {
    pub input_amounts: [u64; TOKEN_COUNT],
    pub minimum_mint_amount: u64,
}

impl<'info> Add<'info> {
    pub fn accounts(ctx: &Context<Add>) -> Result<()> {
        let pool_state = &ctx.accounts.pool;
        require!(!pool_state.is_paused, PoolError::PoolIsPaused);
        require_keys_eq!(
            ctx.accounts.pool_token_account_0.key(),
            pool_state.token_keys[0],
            PoolError::PoolTokenAccountExpected
        );
        require_keys_eq!(
            ctx.accounts.pool_token_account_1.key(),
            pool_state.token_keys[1],
            PoolError::PoolTokenAccountExpected
        );
        require_keys_eq!(ctx.accounts.lp_mint.key(), pool_state.lp_mint_key, PoolError::InvalidMintAccount);
        require_keys_eq!(
            ctx.accounts.governance_fee.key(),
            pool_state.governance_fee_key,
            PoolError::InvalidGovernanceFeeAccount
        );

        // let pool_state_acct = &ctx.accounts.pool_state;
        // let pool: two_pool::state::PoolState<{two_pool::TOKEN_COUNT}> = two_pool::state::PoolState::try_from_slice(&pool_state_acct.data.borrow())?;
        // constraint = lp_mint.key() == propeller.token_bridge_mint @ PropellerError::InvalidMint
        msg!("finished accounts context check");
        // let
        Ok(())
    }
}

//
pub fn handle_add(
    ctx: Context<Add>,
    params: AddParams,
    // input_amounts: [u64; TOKEN_COUNT],
    // minimum_mint_amount: u64,
) -> Result<u64> {
    let input_amounts = params.input_amounts;
    let minimum_mint_amount = params.minimum_mint_amount;
    require!(input_amounts.iter().any(|&x| x > 0), PoolError::AddRequiresAtLeastOneToken);
    let lp_total_supply = ctx.accounts.lp_mint.supply;
    //initial add to pool must add all tokens
    if lp_total_supply == 0 {
        for i in 0..TOKEN_COUNT {
            require_gt!(input_amounts[i], 0u64, PoolError::InitialAddRequiresAllTokens);
        }
    }

    let pool = &ctx.accounts.pool;
    let user_token_accounts = [&ctx.accounts.user_token_account_0, &ctx.accounts.user_token_account_1];
    let pool_token_accounts = [&ctx.accounts.pool_token_account_0, &ctx.accounts.pool_token_account_1];
    // let pool_balances = pool_token_accounts
    //   .iter()
    //   .map(|account| account.amount)
    //   .collect::<Vec<_>>()
    //   .as_slice()
    //   .try_into().unwrap();
    let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    let (user_amount, governance_mint_amount, latest_depth) = Invariant::<TOKEN_COUNT>::add(
        &array_equalize(input_amounts, pool.token_decimal_equalizers),
        &array_equalize(pool_balances, pool.token_decimal_equalizers),
        pool.amp_factor.get(current_ts),
        pool.lp_fee.get(),
        pool.governance_fee.get(),
        to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
        pool.previous_depth.into(),
    )?;
    let (mint_amount, governance_mint_amount, latest_depth) = result_from_equalized(
        user_amount,
        pool.lp_decimal_equalizer,
        governance_mint_amount,
        pool.lp_decimal_equalizer,
        latest_depth,
    );
    require_gte!(mint_amount, minimum_mint_amount, PoolError::OutsideSpecifiedLimits);
    let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());
    for i in 0..TOKEN_COUNT {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        if input_amounts[i] > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        // source
                        from: user_token_account.to_account_info(),
                        to: pool_token_account.to_account_info(),
                        authority: ctx.accounts.user_transfer_authority.to_account_info(),
                    },
                ),
                input_amounts[i],
            )?;
        }
    }

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                // source
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
        ),
        mint_amount,
    )?;

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
                &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
            ),
            governance_mint_amount,
        )?;
    }

    let pool_state = &mut ctx.accounts.pool;
    pool_state.previous_depth = latest_depth;
    Ok(mint_amount)
    // msg!("add_and_wormhole_transfer");
    // handle_approve(&ctx, &pool_add_params)?;
    //
    // let mint_amount = handle_add_liquidity(&ctx, pool_add_params)?;
    // msg!("finished add_liquidity. mint_amount: {}", mint_amount);
    //
    // revoke(&ctx)
    //
    // // Ok(mint_amount)
}

pub fn to_equalized(value: u64, equalizer: u8) -> U128 {
    if equalizer > 0 {
        U128::from(value) * U128::ten_to_the(equalizer)
    } else {
        U128::from(value)
    }
}

pub fn from_equalized(value: U128, equalizer: u8) -> u64 {
    if equalizer > 0 {
        ((value + U128::ten_to_the(equalizer - 1) * 5u64) / U128::ten_to_the(equalizer)).as_u64()
    } else {
        value.as_u64()
    }
}

pub fn array_equalize(amounts: [u64; TOKEN_COUNT], equalizers: [u8; TOKEN_COUNT]) -> [U128; TOKEN_COUNT] {
    amounts
        .iter()
        .zip(equalizers.iter())
        .map(|(&amount, &equalizer)| to_equalized(amount, equalizer))
        .collect::<Vec<_>>()
        .as_slice()
        .try_into()
        .unwrap()
}

/// `result_from_equalized` takes in a user's amount, the user's equalizer, the governance mint amount,
/// the lp decimal equalizer, and the latest depth, and returns the user's amount, the governance mint
/// amount, and the latest depth
///
/// Arguments:
///
/// * `user_amount`: The amount of tokens the user is staking
/// * `user_equalizer`: The equalizer of the user's token.
/// * `governance_mint_amount`: The amount of governance tokens that will be minted to the user.
/// * `lp_decimal_equalizer`: The equalizer for the LP token. should always be pool_state.lp_decimal_equalizer
/// * `latest_depth`: The amount of liquidity in the pool.
pub fn result_from_equalized(
    user_amount: U128,
    user_equalizer: u8,
    governance_mint_amount: U128,
    lp_decimal_equalizer: u8,
    latest_depth: U128,
) -> (u64, u64, u128) {
    (
        from_equalized(user_amount, user_equalizer),
        from_equalized(governance_mint_amount, lp_decimal_equalizer),
        latest_depth.as_u128(),
    )
}
//
// pub fn handle_approve(
// 	ctx: &Context<Add>,
// 	pool_add_params: &AddParams,
// ) -> Result<()> {
// 	msg!("[handle_approve]: approve");
// 	token::approve(
// 		CpiContext::new(
// 			ctx.accounts.token_program.to_account_info(),
// 			token::Approve {
// 				// source
// 				to: ctx.accounts.user_token_account_0.to_account_info(),
// 				delegate: ctx.accounts.pool_auth.to_account_info(),
// 				authority: ctx.accounts.payer.to_account_info(),
// 			},
// 		),
// 		pool_add_params.input_amounts[0],
// 	)?;
//
// 	token::approve(
// 		CpiContext::new(
// 			ctx.accounts.token_program.to_account_info(),
// 			token::Approve {
// 				// source
// 				to: ctx.accounts.user_token_account_1.to_account_info(),
// 				delegate: ctx.accounts.pool_auth.to_account_info(),
// 				authority: ctx.accounts.payer.to_account_info(),
// 			},
// 		),
// 		pool_add_params.input_amounts[1],
// 	)?;
// 	msg!("[handle_approve]: finished approves");
// 	Ok(())
// }
//
// pub fn handle_add_liquidity(
// 	ctx: &Context<Add>,
// 	pool_add_params: AddParams
// ) -> Result<u64> {
// 	let pool_program = &ctx.accounts.pool_program;
// 	let pool = &ctx.accounts.pool_state;
// 	let pool_auth = &ctx.accounts.pool_auth;
// 	let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
// 	let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
// 	let lp_mint = &ctx.accounts.lp_mint;
// 	let governance_fee = &ctx.accounts.governance_fee;
// 	// let user_transfer_auth = &ctx.accounts.user_transfer_authority;
// 	let user_token_account_0 = &ctx.accounts.user_token_account_0;
// 	let user_token_account_1 = &ctx.accounts.user_token_account_1;
// 	let user_lp_token_account = &ctx.accounts.user_lp_token_account;
// 	// let token_program = &self.token_program;
//
// 	let add_defi_ix = two_pool::instruction::DeFiInstruction::Add{
// 		input_amounts: pool_add_params.input_amounts,
// 		minimum_mint_amount: pool_add_params.minimum_mint_amount
// 	};
// 	let add_ix = two_pool::instruction::create_defi_ix(
// 		add_defi_ix,
// 		&pool_program.key(),
// 		&pool.key(),
// 		&pool_auth.key(),
// 		&[
// 			pool_token_account_0.key(),
// 			pool_token_account_1.key()
// 		],
// 		&lp_mint.key(),
// 		&governance_fee.key(),
// 		&pool_auth.key(),
// 		// &user_transfer_auth.key(),
// 		&[
// 			user_token_account_0.key(),
// 			user_token_account_1.key()
// 		],
// 		Some(&user_lp_token_account.key()),
// 	)?;
// 	invoke(
// 		&add_ix,
// 		&ctx.accounts.to_account_infos(),
// 	)?;
// 	let (program_id, data) = get_return_data().unwrap();
// 	//.unwrap_or_else(PropellerError::InvalidCpiReturnValue);
// 	require_keys_eq!(program_id, ctx.accounts.pool_program.key(), PropellerError::InvalidCpiReturnProgramId);
// 	Ok(u64::try_from_slice(&data).map_err(|_| PropellerError::InvalidCpiReturnValue)?)
// }
//
// pub fn revoke(ctx: &Context<Add>) -> Result<()> {
// 	msg!("[revoke]: revoke");
// 	token::revoke(
// 		CpiContext::new(
// 			ctx.accounts.token_program.to_account_info(),
// 			token::Revoke {
// 				// source
// 				source: ctx.accounts.user_token_account_0.to_account_info(),
// 				authority: ctx.accounts.payer.to_account_info(),
// 			},
// 		)
// 	)?;
// 	token::revoke(
// 		CpiContext::new(
// 			ctx.accounts.token_program.to_account_info(),
// 			token::Revoke {
// 				// source
// 				source: ctx.accounts.user_token_account_1.to_account_info(),
// 				authority: ctx.accounts.payer.to_account_info(),
// 			},
// 		)
// 	)?;
// 	msg!("Revoked delegate authority for user_token_accounts");
// 	token::revoke(
// 		CpiContext::new(
// 			ctx.accounts.token_program.to_account_info(),
// 			token::Revoke {
// 				// source
// 				source: ctx.accounts.user_lp_token_account.to_account_info(),
// 				authority: ctx.accounts.payer.to_account_info(),
// 			},
// 		)
// 	)?;
// 	msg!("Revoked delegate authority for user_lp_token_account");
// 	msg!("[revoke]: finished revoke");
// 	Ok(())
// }
