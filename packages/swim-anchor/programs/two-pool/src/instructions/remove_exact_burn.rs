use {
    crate::{
        array_equalize, error::*, gen_pool_signer_seeds, invariant::Invariant,
        result_from_equalized, to_equalized, TwoPool, TOKEN_COUNT,
    },
    anchor_lang::prelude::*,
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount},
    },
    std::iter::zip,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RemoveExactBurnParams {
    exact_burn_amount: u64,
    output_token_index: u8,
    minimum_output_amount: u64,
}

#[derive(Accounts)]
pub struct RemoveExactBurn<'info> {
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
}

impl<'info> RemoveExactBurn<'info> {
    pub fn accounts(ctx: &Context<RemoveExactBurn>) -> Result<()> {
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
        require_keys_eq!(
            ctx.accounts.lp_mint.key(),
            pool_state.lp_mint_key,
            PoolError::InvalidMintAccount
        );
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

pub fn handle_remove_exact_burn(
    ctx: Context<RemoveExactBurn>,
    remove_exact_burn_params: RemoveExactBurnParams,
) -> Result<u64> {
    let output_token_index = remove_exact_burn_params.output_token_index as usize;
    let exact_burn_amount = remove_exact_burn_params.exact_burn_amount;
    let lp_total_supply = ctx.accounts.lp_mint.supply;
    require!(
        output_token_index < TOKEN_COUNT,
        PoolError::InvalidRemoveExactBurnParameters
    );
    require_gt!(
        exact_burn_amount,
        0,
        PoolError::InvalidRemoveExactBurnParameters
    );
    require_gt!(
        lp_total_supply,
        exact_burn_amount,
        PoolError::InvalidRemoveExactBurnParameters
    );

    let pool = &ctx.accounts.pool;
    let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
    let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
    let pool_balances = [
        ctx.accounts.pool_token_account_0.amount,
        ctx.accounts.pool_token_account_1.amount,
    ];
    let lp_mint = &ctx.accounts.lp_mint;
    let governance_fee = &ctx.accounts.governance_fee;
    // let user_transfer_auth = &ctx.accounts.user_transfer_authority;
    let user_token_account_0 = &ctx.accounts.user_token_account_0;
    let user_token_account_1 = &ctx.accounts.user_token_account_1;
    let user_token_accounts = [user_token_account_0, user_token_account_1];

    let pool_token_accounts = [pool_token_account_0, pool_token_account_1];

    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    let (user_amount, governance_mint_amount, latest_depth) =
        Invariant::<TOKEN_COUNT>::remove_exact_burn(
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
    require_gte!(
        output_amount,
        minimum_output_amount,
        PoolError::OutsideSpecifiedLimits
    );

    let mut token_accounts = zip(
        user_token_accounts.into_iter(),
        pool_token_accounts.into_iter(),
    );
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

    let user_output_token_account = user_token_accounts[output_token_index];
    let pool_output_token_account = pool_token_accounts[output_token_index];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                // source
                from: pool_output_token_account.to_account_info(),
                to: user_output_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            &[&gen_pool_signer_seeds!(ctx.accounts.pool)[..]],
        ),
        output_amount,
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
    let pool = &mut ctx.accounts.pool;
    pool.previous_depth = latest_depth;
    Ok(output_amount)
}
