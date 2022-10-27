use {
    crate::{error::*, governance::*, Propeller},
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

pub fn handle_set_paused(ctx: Context<SetPaused>, is_paused: bool) -> Result<()> {
    let propeller = &mut ctx.accounts.propeller;
    propeller.is_paused = is_paused;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdatePauseKey<'info> {
    pub governance: Governance<'info>,
    ///CHECK: not specifying type of account since it doesn't matter
    pub new_pause_key: UncheckedAccount<'info>,
}

pub fn handle_change_pause_key(ctx: Context<UpdatePauseKey>, new_pause_key: Pubkey) -> Result<()> {
    require_keys_eq!(new_pause_key, ctx.accounts.new_pause_key.key());
    require_keys_neq!(new_pause_key, Pubkey::default(), PropellerError::InvalidNewPauseKey);
    let propeller = &mut ctx.accounts.governance.propeller;
    propeller.pause_key = ctx.accounts.new_pause_key.key();
    Ok(())
}
