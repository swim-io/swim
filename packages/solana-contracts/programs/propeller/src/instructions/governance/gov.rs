use {
    crate::{error::*, Propeller},
    anchor_lang::prelude::*,
};
#[derive(Accounts)]
pub struct Governance<'info> {
    #[account(
    seeds = [
    b"propeller".as_ref(),
    propeller.swim_usd_mint.as_ref(),
    ],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Account<'info, Propeller>,
    pub governance_key: Signer<'info>,
}

pub fn handle_prepare_governance_change(ctx: Context<Governance>) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    propeller.governance_key = *ctx.accounts.governance_key.key;
    Ok(())
}
