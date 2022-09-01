use {
    crate::{
        common_governance::*, get_current_ts, governance::ENACT_DELAY, DecimalU64,
        DecimalU64Anchor, PoolFee, UnixTimestamp,
    },
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct PrepareGovernanceTransition<'info> {
    pub common_governance: CommonGovernance<'info>,
}

impl<'info> PrepareGovernanceTransition<'info> {
    pub fn accounts(ctx: &Context<PrepareGovernanceTransition>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        Ok(())
    }
}

pub fn handle_prepare_governance_transition(
    ctx: Context<PrepareGovernanceTransition>,
    upcoming_governance_key: Pubkey,
) -> Result<()> {
    let pool = &mut ctx.accounts.common_governance.pool;
    pool.prepared_governance_key = upcoming_governance_key;

    let current_ts = get_current_ts()?;
    pool.governance_transition_ts = current_ts + ENACT_DELAY;

    Ok(())
}
