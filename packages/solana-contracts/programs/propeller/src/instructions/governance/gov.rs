use {
    crate::{constants::ENACT_DELAY, error::*, Propeller},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct Governance<'info> {
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    propeller.swim_usd_mint.as_ref(),
    ],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Account<'info, Propeller>,
    pub governance_key: Signer<'info>,
    pub upcoming_governance_key: Signer<'info>,
}

pub fn handle_prepare_governance_transition(ctx: Context<Governance>, upcoming_governance_key: Pubkey) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    require_keys_neq!(upcoming_governance_key, Pubkey::default(), PropellerError::InvalidUpcomingGovernanceKey);
    propeller.prepared_governance_key = upcoming_governance_key;
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64);
    propeller.governance_transition_ts = current_ts + ENACT_DELAY;
    Ok(())
}

pub fn handle_enact_governance_transition(ctx: Context<Governance>) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    require_neq!(propeller.governance_transition_ts, 0i64, PropellerError::InvalidEnact);
    require_keys_neq!(propeller.prepared_governance_key, Pubkey::default(), PropellerError::InvalidEnact);

    let current_ts = Clock::get()?.unix_timestamp;

    require_gt!(current_ts, 0i64);
    require_gt!(current_ts, propeller.governance_transition_ts, PropellerError::InsufficientDelay);

    propeller.governance_key = propeller.prepared_governance_key;
    propeller.prepared_governance_key = Pubkey::default();
    propeller.governance_transition_ts = 0i64;

    Ok(())
}
