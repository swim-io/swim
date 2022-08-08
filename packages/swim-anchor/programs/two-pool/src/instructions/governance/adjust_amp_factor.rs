use anchor_lang::prelude::*;
use crate::{DecimalU64, DecimalU64Anchor, get_current_ts, UnixTimestamp, error::*, common_governance::*};
use crate::governance::ENACT_DELAY;

#[derive(Accounts)]
pub struct AdjustAmpFactor<'info> {
  pub common_governance: CommonGovernance<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AdjustAmpFactorParams {
  target_ts: i64,
  target_value: DecimalU64Anchor,
}


impl<'info> AdjustAmpFactor<'info> {
  pub fn accounts(ctx: &Context<AdjustAmpFactor>) -> Result<()> {
    CommonGovernance::accounts(&ctx.accounts.common_governance)?;
    Ok(())
  }
}

pub fn handle_adjust_amp_factor(
  ctx: Context<AdjustAmpFactor>,
  params: AdjustAmpFactorParams,
) -> Result<()> {
  let pool = &mut ctx.accounts.common_governance.pool;
  let current_ts = get_current_ts()?;
  pool.amp_factor.set_target(current_ts, params.target_value.into(), params.target_ts)?;
  Ok(())
}
