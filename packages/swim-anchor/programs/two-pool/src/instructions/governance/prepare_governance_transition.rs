use anchor_lang::prelude::*;
use crate::{
  common_governance::*, DecimalU64, DecimalU64Anchor, get_current_ts, PoolFee, UnixTimestamp};
use crate::governance::ENACT_DELAY;

#[derive(Accounts)]
pub struct PrepareGovernanceTransition<'info> {
  pub common_governance: CommonGovernance<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PrepareGovernanceTransitionParams {
  pub upcoming_governance_key: Pubkey
}

impl<'info> PrepareGovernanceTransition<'info> {
  pub fn accounts(ctx: &Context<PrepareGovernanceTransition>) -> Result<()> {
    CommonGovernance::accounts(&ctx.accounts.common_governance)?;
    Ok(())
  }
}

pub fn handle_prepare_governance_transition(
  ctx: Context<PrepareGovernanceTransition>,
  params: PrepareGovernanceTransitionParams,
) -> Result<()> {
  let pool = &mut ctx.accounts.common_governance.pool;
  pool.prepared_governance_key = params.upcoming_governance_key;

  let current_ts = get_current_ts()?;
  pool.governance_transition_ts = current_ts + ENACT_DELAY;

  Ok(())
}

