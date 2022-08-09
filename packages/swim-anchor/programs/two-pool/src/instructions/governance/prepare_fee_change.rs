use {
    crate::{
        common_governance::*, error::*, get_current_ts, governance::ENACT_DELAY, DecimalU64,
        DecimalU64Anchor, PoolFee,
    },
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct PrepareFeeChange<'info> {
    pub common_governance: CommonGovernance<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PrepareFeeChangeParams {
    pub lp_fee: DecimalU64Anchor,
    pub governance_fee: DecimalU64Anchor,
}

impl<'info> PrepareFeeChange<'info> {
    pub fn accounts(ctx: &Context<PrepareFeeChange>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        Ok(())
    }
}

pub fn handle_prepare_fee_change(
    ctx: Context<PrepareFeeChange>,
    params: PrepareFeeChangeParams,
) -> Result<()> {
    let lp_fee: DecimalU64 = params.lp_fee.into();
    let governance_fee: DecimalU64 = params.governance_fee.into();
    require_gt!(
        DecimalU64::from(1),
        lp_fee + governance_fee,
        PoolError::InvalidFeeInput
    );
    let pool = &mut ctx.accounts.common_governance.pool;
    pool.prepared_lp_fee = PoolFee::new(lp_fee)?;
    pool.prepared_governance_fee = PoolFee::new(governance_fee)?;

    let current_ts = get_current_ts()?;

    pool.fee_transition_ts = current_ts + ENACT_DELAY;
    Ok(())
}
