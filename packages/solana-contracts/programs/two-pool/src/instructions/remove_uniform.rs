use {
    crate::{error::*, gen_pool_signer_seeds, DecimalU64, TwoPool, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount},
    },
    std::iter::zip,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RemoveUniformParams {
    pub exact_burn_amount: u64,
    pub minimum_output_amounts: [u64; TOKEN_COUNT],
}

#[derive(Accounts)]
pub struct RemoveUniform<'info> {
    /// Note: RemoveUniform is the only ix that is allowed even if the pool is paused
    /// which is why we don't check the is_paused value here.
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
    address = pool.token_keys[0] @ PoolError::PoolTokenAccountExpected,
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = pool.token_keys[1] @ PoolError::PoolTokenAccountExpected,
    )]
    pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = pool.lp_mint_key @ PoolError::InvalidMintAccount,
    )]
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

    #[account(
    mut,
    token::mint = lp_mint,
    )]
    pub user_lp_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_remove_uniform(
    ctx: Context<RemoveUniform>,
    remove_uniform_params: RemoveUniformParams,
) -> Result<Vec<u64>> {
    let exact_burn_amount = remove_uniform_params.exact_burn_amount;
    let minimum_output_amounts = remove_uniform_params.minimum_output_amounts;
    let lp_total_supply = ctx.accounts.lp_mint.supply;
    require_gt!(exact_burn_amount, 0u64, PoolError::InvalidRemoveUniformParameters);
    require_gte!(lp_total_supply, exact_burn_amount, PoolError::InvalidRemoveUniformParameters);

    let pool = &ctx.accounts.pool;
    let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
    let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
    let pool_balances = [ctx.accounts.pool_token_account_0.amount, ctx.accounts.pool_token_account_1.amount];

    let user_share = DecimalU64::from(exact_burn_amount) / lp_total_supply;
    //u64 can store 19 decimals, previous_depth can theoretically go up to TOKEN_COUNT * u64::MAX
    //hence, just to be safe, we allow for previous depth to have up to 20 decimals
    //therefore we can only multiply with a number with at most 18 decimals to stay within
    //the 38 max decimals range of u128
    const DECIMAL_UPSHIFT: u32 = 18;
    let user_depth = (pool.previous_depth * ((user_share * 10u64.pow(DECIMAL_UPSHIFT)).trunc() as u128))
        / 10u128.pow(DECIMAL_UPSHIFT);
    let latest_depth = pool.previous_depth - user_depth;

    let user_token_account_0 = &ctx.accounts.user_token_account_0;
    let user_token_account_1 = &ctx.accounts.user_token_account_1;
    let user_token_accounts = [user_token_account_0, user_token_account_1];

    let pool_token_accounts = [pool_token_account_0, pool_token_account_1];

    let mut token_accounts = zip(user_token_accounts.into_iter(), pool_token_accounts.into_iter());

    let mut output_amounts = vec![];
    for i in 0..TOKEN_COUNT {
        let (user_token_account, pool_token_account) = token_accounts.next().unwrap();
        let output_amount = (pool_balances[i] * user_share).trunc();
        output_amounts.push(output_amount);
        require_gte!(output_amount, minimum_output_amounts[i], PoolError::OutsideSpecifiedLimits);
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    // source
                    from: pool_token_account.to_account_info(),
                    to: user_token_account.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
            ),
            output_amount,
        )?;
    }

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.user_lp_token_account.to_account_info(),
                authority: ctx.accounts.user_transfer_authority.to_account_info(),
            },
        ),
        exact_burn_amount,
    )?;

    let pool = &mut ctx.accounts.pool;
    pool.previous_depth = latest_depth;

    Ok(output_amounts)
}
