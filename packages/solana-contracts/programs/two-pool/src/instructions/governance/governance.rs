use {
    crate::{
        decimal::DecimalU64,
        error::*,
        instructions::{get_current_ts, ENACT_DELAY},
        pool_fee::PoolFee,
        DecimalU64Anchor, TwoPool,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
};

#[derive(Accounts)]
pub struct Governance<'info> {
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool.get_token_mint_0().as_ref(),
    pool.get_token_mint_1().as_ref(),
    pool.lp_mint_key.as_ref(),
    ],
    bump = pool.bump,
    has_one = governance_key @ PoolError::InvalidGovernanceAccount
    )]
    pub pool: Account<'info, TwoPool>,

    pub governance_key: Signer<'info>,
}

/* Update Amp Factor */

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AdjustAmpFactorParams {
    pub target_ts: i64,
    pub target_value: DecimalU64Anchor,
}

pub fn handle_adjust_amp_factor(ctx: Context<Governance>, params: AdjustAmpFactorParams) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let current_ts = get_current_ts()?;
    pool.amp_factor.set_target(current_ts, params.target_value.into(), params.target_ts)?;
    Ok(())
}

/* Update Fees */

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PrepareFeeChangeParams {
    pub lp_fee: DecimalU64Anchor,
    pub governance_fee: DecimalU64Anchor,
}

pub fn handle_prepare_fee_change(
    ctx: Context<Governance>,
    // params: PrepareFeeChangeParams,
    lp_fee: DecimalU64Anchor,
    governance_fee: DecimalU64Anchor,
) -> Result<()> {
    let lp_fee: DecimalU64 = lp_fee.into();
    let governance_fee: DecimalU64 = governance_fee.into();
    require_gt!(DecimalU64::from(1), lp_fee + governance_fee, PoolError::InvalidFeeInput);
    let pool = &mut ctx.accounts.pool;
    pool.prepared_lp_fee = PoolFee::new(lp_fee)?;
    pool.prepared_governance_fee = PoolFee::new(governance_fee)?;

    let current_ts = get_current_ts()?;

    pool.fee_transition_ts = current_ts + ENACT_DELAY;
    Ok(())
}

pub fn handle_enact_fee_change(ctx: Context<Governance>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    require_neq!(pool.fee_transition_ts, 0i64, PoolError::InvalidEnact);
    let current_ts = get_current_ts()?;
    require_gte!(current_ts, pool.fee_transition_ts, PoolError::InsufficientDelay);
    // Note: no longer allowing pubkey::default() as governance_fee_account even if gov_fee == 0
    // if pool.prepared_governance_fee.get() > DecimalU64::from(0) {
    //   require_keys_neq!(pool.governance_fee_key, Pubkey::default(), PoolError::InvalidGovernanceFeeAccount);
    // }
    pool.lp_fee = pool.prepared_lp_fee.clone();
    pool.governance_fee = pool.prepared_governance_fee.clone();
    pool.prepared_lp_fee = PoolFee::default();
    pool.prepared_governance_fee = PoolFee::default();
    pool.fee_transition_ts = 0i64;
    Ok(())
}

/* Update Governance Fee Account */

#[derive(Accounts)]
pub struct ChangeGovernanceFeeAccount<'info> {
    pub governance: Governance<'info>,
    #[account(token::mint = governance.pool.lp_mint_key)]
    pub new_governance_fee: Account<'info, TokenAccount>,
}

pub fn handle_change_governance_fee_account(
    ctx: Context<ChangeGovernanceFeeAccount>,
    new_governance_fee_key: Pubkey,
) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.new_governance_fee.key(),
        new_governance_fee_key,
        PoolError::InvalidGovernanceFeeAccount
    );
    let pool = &mut ctx.accounts.governance.pool;
    pool.governance_fee_key = new_governance_fee_key;
    Ok(())
}

/* Update Governance Account */

#[derive(Accounts)]
pub struct PrepareGovernanceTransition<'info> {
    pub governance: Governance<'info>,
    pub upcoming_governance_key: Signer<'info>,
}

pub fn handle_prepare_governance_transition(
    ctx: Context<PrepareGovernanceTransition>,
    upcoming_governance_key: Pubkey,
) -> Result<()> {
    require_keys_eq!(
        upcoming_governance_key,
        ctx.accounts.upcoming_governance_key.key(),
        PoolError::InvalidUpcomingGovernanceKey
    );
    let pool = &mut ctx.accounts.governance.pool;
    pool.prepared_governance_key = upcoming_governance_key;

    let current_ts = get_current_ts()?;
    pool.governance_transition_ts = current_ts + ENACT_DELAY;

    Ok(())
}

pub fn handle_enact_governance_transition(ctx: Context<Governance>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    require_neq!(pool.governance_transition_ts, 0i64, PoolError::InvalidEnact);
    require_keys_neq!(pool.prepared_governance_key, Pubkey::default(), PoolError::InvalidEnact);

    let current_ts = get_current_ts()?;

    require_gte!(current_ts, pool.governance_transition_ts, PoolError::InsufficientDelay);

    pool.governance_key = pool.prepared_governance_key;
    pool.prepared_governance_key = Pubkey::default();
    pool.governance_transition_ts = 0i64;
    Ok(())
}

/* Pause */

#[derive(Accounts)]
pub struct ChangePauseKey<'info> {
    pub governance: Governance<'info>,
    pub new_pause_key: Signer<'info>,
}

pub fn handle_change_pause_key(ctx: Context<ChangePauseKey>, new_pause_key: Pubkey) -> Result<()> {
    require_keys_eq!(ctx.accounts.new_pause_key.key(), new_pause_key, PoolError::InvalidNewPauseKey);
    let pool = &mut ctx.accounts.governance.pool;
    pool.pause_key = new_pause_key;
    Ok(())
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool.get_token_mint_0().as_ref(),
    pool.get_token_mint_1().as_ref(),
    pool.lp_mint_key.as_ref(),
    ],
    bump = pool.bump,
    has_one = pause_key @ PoolError::InvalidPauseKey
    )]
    pub pool: Account<'info, TwoPool>,
    pub pause_key: Signer<'info>,
}

pub fn handle_set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.is_paused = paused;
    Ok(())
}
