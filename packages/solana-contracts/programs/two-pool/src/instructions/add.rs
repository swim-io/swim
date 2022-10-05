use {
    crate::{common, error::*, gen_pool_signer_seeds, invariant::Invariant, TwoPool, TOKEN_COUNT},
    anchor_lang::prelude::*,
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
        require!(input_amounts.iter().all(|&x| x > 0), PoolError::InitialAddRequiresAllTokens);
    }

    let pool = &ctx.accounts.pool;
    let user_token_accounts = [&ctx.accounts.user_token_account_0, &ctx.accounts.user_token_account_1];
    let pool_token_accounts = [&ctx.accounts.pool_token_account_0, &ctx.accounts.pool_token_account_1];
    let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
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
            let user_transfer_authority = ctx.accounts.user_transfer_authority.to_account_info();
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
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
}
