use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::{
  common_governance::*,
  DecimalU64,
  DecimalU64Anchor,
  error::*,
  get_current_ts,
  PoolFee,
  state::TwoPool,
  UnixTimestamp,
};

#[derive(Accounts)]
pub struct ChangeGovernanceFeeAccount<'info> {
  pub common_governance: CommonGovernance<'info>,
  #[account(
    token::mint = common_governance.pool.lp_mint_key
  )]
  pub new_governance_fee: Account<'info, TokenAccount>
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ChangeGovernanceFeeAccountParams {
  new_governance_fee_key: Pubkey
}

impl<'info> ChangeGovernanceFeeAccount<'info> {
  pub fn accounts(ctx: &Context<ChangeGovernanceFeeAccount>) -> Result<()> {
    CommonGovernance::accounts(&ctx.accounts.common_governance)?;
    Ok(())
  }
}

pub fn handle_change_governance_fee_account(
  ctx: Context<ChangeGovernanceFeeAccount>,
  params: ChangeGovernanceFeeAccountParams,
) -> Result<()> {
  require_keys_eq!(
    ctx.accounts.new_governance_fee.key(),
    params.new_governance_fee_key,
    PoolError::InvalidGovernanceFeeAccount
  );
  let pool = &mut ctx.accounts.common_governance.pool;
  pool.governance_fee_key = params.new_governance_fee_key;
  Ok(())
}
