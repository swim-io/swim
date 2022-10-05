use {
    crate::{
        common_governance::*, error::*, get_current_ts, PoolFee,
    },
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct EnactFeeChange<'info> {
    pub common_governance: CommonGovernance<'info>,
}

impl<'info> EnactFeeChange<'info> {
    pub fn accounts(ctx: &Context<EnactFeeChange>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        Ok(())
    }
}

pub fn handle_enact_fee_change(ctx: Context<EnactFeeChange>) -> Result<()> {
    let pool = &mut ctx.accounts.common_governance.pool;
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
