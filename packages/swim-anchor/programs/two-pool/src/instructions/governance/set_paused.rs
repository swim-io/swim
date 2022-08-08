use anchor_lang::prelude::*;
use crate::{
  common_governance::*,
  DecimalU64,
  DecimalU64Anchor,
  get_current_ts,
  PoolFee,
  UnixTimestamp,
  error::PoolError::*
};
use crate::governance::ENACT_DELAY;

#[derive(Accounts)]
pub struct SetPaused<'info> {
  pub common_governance: CommonGovernance<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetPausedParams {
  paused: bool,
}


impl<'info> SetPaused<'info> {
  pub fn accounts(ctx: &Context<SetPaused>) -> Result<()> {
    CommonGovernance::accounts(&ctx.accounts.common_governance)?;
    Ok(())
  }
}

pub fn handle_set_paused(
  ctx: Context<SetPaused>,
  params: SetPausedParams,
) -> Result<()> {
  let pool = &mut ctx.accounts.common_governance.pool;
  pool.is_paused = params.paused;
  Ok(())
}
