use {
    crate::{error::*, Propeller},
    anchor_lang::prelude::*,
};

/// Accounts needed for all pause-related ixs
#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    propeller.swim_usd_mint.as_ref(),
    ],
    bump = propeller.bump,
    has_one = pause_key @ PropellerError::InvalidPropellerPauseKey,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    pub pause_key: Signer<'info>,
}

#[derive(Accounts)]
pub struct ChangePauseKey<'info> {
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    propeller.swim_usd_mint.as_ref(),
    ],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    pub governance_key: Signer<'info>,
    pub new_pause_key: Signer<'info>,
}

pub fn handle_set_paused(ctx: Context<SetPaused>, is_paused: bool) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    propeller.is_paused = is_paused;
    Ok(())
}

pub fn handle_change_pause_key(ctx: Context<ChangePauseKey>) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    propeller.pause_key = ctx.accounts.new_pause_key.key();
    Ok(())
}
