use anchor_lang::prelude::*;
use crate::{TwoPool, error::*};

#[derive(Accounts)]
pub struct CommonGovernance<'info> {
  #[account(
  mut,
  seeds = [
    b"two_pool".as_ref(),
    pool.get_token_mint_0().unwrap().as_ref(),
    pool.get_token_mint_1().unwrap().as_ref(),
    pool.lp_mint_key.as_ref(),
  ],
  bump = pool.bump
  )]
  pub pool: Account<'info, TwoPool>,

  pub governance: Signer<'info>,
}

impl<'info> CommonGovernance<'info> {
  pub fn accounts(common_governance: &CommonGovernance) -> Result<()> {
    require_keys_eq!(
      common_governance.governance.key(),
      common_governance.pool.governance_key,
      PoolError::InvalidGovernanceAccount
    );
    Ok(())
  }
}
