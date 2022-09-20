use {
    crate::{
        common_governance::*, error::*, get_current_ts, governance::ENACT_DELAY, DecimalU64, DecimalU64Anchor, PoolFee,
        UnixTimestamp,
    },
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct EnactGovernanceTransition<'info> {
    pub common_governance: CommonGovernance<'info>,
}

impl<'info> EnactGovernanceTransition<'info> {
    pub fn accounts(ctx: &Context<EnactGovernanceTransition>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        Ok(())
    }
}

pub fn handle_enact_governance_transition(ctx: Context<EnactGovernanceTransition>) -> Result<()> {
    let pool = &mut ctx.accounts.common_governance.pool;
    require_neq!(pool.governance_transition_ts, 0i64, PoolError::InvalidEnact);

    let current_ts = get_current_ts()?;

    require_gte!(current_ts, pool.governance_transition_ts, PoolError::InsufficientDelay);

    pool.governance_key = pool.prepared_governance_key;
    pool.prepared_governance_key = Pubkey::default();
    pool.governance_transition_ts = 0i64;
    Ok(())
}
