use {
    crate::{
        array_equalize, common::create_array, error::*, invariant::Invariant, to_equalized,
        BorshDecimal, TwoPool, TOKEN_COUNT,
    },
    anchor_lang::prelude::*,
    anchor_spl::{
        token::{Mint, TokenAccount},
    },
};

#[derive(Accounts)]
pub struct MarginalPrices<'info> {
    #[account(
    seeds = [
    b"two_pool".as_ref(),
    pool_token_account_0.mint.as_ref(),
    pool_token_account_1.mint.as_ref(),
    lp_mint.key().as_ref(),
    ],
    bump = pool.bump
    )]
    pub pool: Account<'info, TwoPool>,

    #[account(
    token::mint = pool.token_mint_keys[0],
    token::authority = pool,
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,

    #[account(
    token::mint = pool.token_mint_keys[1],
    token::authority = pool,
    )]
    pub pool_token_account_1: Box<Account<'info, TokenAccount>>,

    pub lp_mint: Box<Account<'info, Mint>>,
}

impl<'info> MarginalPrices<'info> {
    pub fn accounts(ctx: &Context<MarginalPrices>) -> Result<()> {
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
        msg!("finished MarginalPrices accounts context check");
        Ok(())
    }
}

pub fn handle_marginal_prices(ctx: Context<MarginalPrices>) -> Result<[BorshDecimal; TOKEN_COUNT]> {
    let pool = &ctx.accounts.pool;
    let lp_total_supply = ctx.accounts.lp_mint.supply;
    let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    msg!("pool_balances: {:?}, lp_total_supply: {:?}", pool_balances, lp_total_supply);

    let marginal_prices = Invariant::<TOKEN_COUNT>::marginal_prices(
        &array_equalize(pool_balances, pool.token_decimal_equalizers),
        pool.amp_factor.get(current_ts),
        to_equalized(lp_total_supply, pool.lp_decimal_equalizer),
        pool.previous_depth.into(),
    )?;

    Ok(create_array(|i| marginal_prices[i].try_into().unwrap()))
}
