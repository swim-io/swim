use {
    crate::{
        common_governance::*, error::*, get_current_ts, state::TwoPool, DecimalU64, DecimalU64Anchor, PoolFee,
        UnixTimestamp,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
};

#[derive(Accounts)]
pub struct ChangeGovernanceFeeAccount<'info> {
    pub common_governance: CommonGovernance<'info>,
    #[account(
    token::mint = common_governance.pool.lp_mint_key
    )]
    pub new_governance_fee: Account<'info, TokenAccount>,
}

impl<'info> ChangeGovernanceFeeAccount<'info> {
    pub fn accounts(ctx: &Context<ChangeGovernanceFeeAccount>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        Ok(())
    }
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
    let pool = &mut ctx.accounts.common_governance.pool;
    pool.governance_fee_key = new_governance_fee_key;
    Ok(())
}
