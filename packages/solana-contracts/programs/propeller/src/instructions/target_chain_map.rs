use {
    crate::{error::PropellerError, Propeller, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{create, AssociatedToken, Create},
        token::{Mint, Token, TokenAccount},
    },
    two_pool::state::TwoPool,
};

#[derive(Accounts)]
#[instruction(target_chain: u16)]
pub struct CreateTargetChainMap<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = admin,
    )]
    pub propeller: Account<'info, Propeller>,

    pub admin: Signer<'info>,

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
}

impl TargetChainMap {
    pub const LEN: usize = 1 + 2 + 32;
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
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateTargetChainMap<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = admin,
    )]
    pub propeller: Account<'info, Propeller>,

    pub admin: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    propeller.key().as_ref(),
    &target_chain_map.target_chain.to_le_bytes()
    ],
    bump = target_chain_map.bump,
    )]
    pub target_chain_map: Account<'info, TargetChainMap>,
    pub system_program: Program<'info, System>,
}

pub fn handle_update_target_chain_map(ctx: Context<UpdateTargetChainMap>, routing_contract: [u8; 32]) -> Result<()> {
    let target_chain_map = &mut ctx.accounts.target_chain_map;
    target_chain_map.target_address = routing_contract;
    Ok(())
}

pub fn handle_close_target_chain_map() -> Result<()> {
    todo!()
}
