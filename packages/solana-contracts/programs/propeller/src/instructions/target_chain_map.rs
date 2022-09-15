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
    seeds = [b"propeller".as_ref(), propeller.token_bridge_mint.key().as_ref()],
    bump = propeller.bump,
    )]
    pub propeller: Account<'info, Propeller>,

    #[account(
    constraint = admin.key() == propeller.admin
    )]
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
        ]
        space = 8 + TargetChainMap::LEN
    )]
    pub target_chain_map: Account<'info, TargetChainMap>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TargetChainMap {
    pub target_chain: u16,
    pub routing_contract: [u8; 32],
}

impl TargetChainMap {
    pub const LEN: usize = 2 + 32;
}

pub fn handle_create_target_chain_map(
    ctx: Context<CreateTargetChainMap>,
    target_chain: u16,
    routing_contract: [u8; 32],
) -> Result<()> {
    let target_chain_map = &mut ctx.accounts.target_chain_map;
    target_chain_map.target_chain = target_chain;
    target_chain_map.routing_contract = routing_contract;
    Ok(())
}

pub fn handle_update_target_chain_map() -> Result<()> {
    todo!()
}
