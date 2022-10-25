use {
    crate::{error::PropellerError, Propeller},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(target_chain: u16)]
pub struct CreateTargetChainMap<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Account<'info, Propeller>,

    pub governance_key: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [
            b"propeller".as_ref(),
            propeller.key().as_ref(),
            &target_chain.to_le_bytes()
        ],
        bump,
        space = 8 + TargetChainMap::LEN
    )]
    pub target_chain_map: Account<'info, TargetChainMap>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TargetChainMap {
    pub bump: u8,
    pub target_chain: u16,
    pub target_address: [u8; 32],
    pub is_paused: bool,
}

impl TargetChainMap {
    pub const LEN: usize = 1 + 2 + 32 + 1;
}

pub fn handle_create_target_chain_map(
    ctx: Context<CreateTargetChainMap>,
    target_chain: u16,
    target_address: [u8; 32],
) -> Result<()> {
    let target_chain_map = &mut ctx.accounts.target_chain_map;
    let bump = ctx.bumps.get("target_chain_map").unwrap();
    target_chain_map.bump = *bump;
    target_chain_map.target_chain = target_chain;
    target_chain_map.target_address = target_address;
    target_chain_map.is_paused = false;
    Ok(())
}

#[derive(Accounts)]
#[instruction(target_chain: u16)]
pub struct UpdateTargetChainMap<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = governance_key @ PropellerError::InvalidPropellerGovernanceKey,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    pub governance_key: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    propeller.key().as_ref(),
    &target_chain.to_le_bytes()
    ],
    bump = target_chain_map.bump,
    )]
    pub target_chain_map: Account<'info, TargetChainMap>,
}

pub fn handle_update_target_chain_map(
    ctx: Context<UpdateTargetChainMap>,
    target_chain: u16,
    routing_contract: [u8; 32],
) -> Result<()> {
    let target_chain_map = &mut ctx.accounts.target_chain_map;
    require_eq!(target_chain, target_chain_map.target_chain, PropellerError::InvalidTargetChainMap);
    target_chain_map.target_address = routing_contract;
    Ok(())
}

pub fn handle_close_target_chain_map() -> Result<()> {
    todo!()
}

#[derive(Accounts)]
#[instruction(target_chain: u16)]
pub struct TargetChainMapSetPaused<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = pause_key @ PropellerError::InvalidPropellerPauseKey,
    )]
    pub propeller: Account<'info, Propeller>,

    pub pause_key: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    propeller.key().as_ref(),
    &target_chain.to_le_bytes()
    ],
    bump = target_chain_map.bump,
    )]
    pub target_chain_map: Account<'info, TargetChainMap>,
}

pub fn handle_target_chain_map_set_paused(
    ctx: Context<TargetChainMapSetPaused>,
    target_chain: u16,
    is_paused: bool,
) -> Result<()> {
    let target_chain_map = &mut ctx.accounts.target_chain_map;
    require_eq!(target_chain, target_chain_map.target_chain, PropellerError::InvalidTargetChainMap);
    target_chain_map.is_paused = is_paused;
    Ok(())
}
