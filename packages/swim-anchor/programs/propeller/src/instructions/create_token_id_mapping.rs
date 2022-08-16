use {
    crate::{Propeller, PropellerSender},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{create, AssociatedToken, Create},
        token::{Mint, Token, TokenAccount},
    },
    two_pool::{state::TwoPool, ID},
};

#[derive(Accounts)]
#[instruction(output_token_index: u16, pool: Pubkey, pool_token_index: u8, pool_token_mint: Pubkey)]
pub struct CreateTokenIdMapping<'info> {
    #[account(
    seeds = [b"propeller".as_ref()],
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
  mut,
  seeds = [
  b"two_pool".as_ref(),
  pool.get_token_mint_0().unwrap().as_ref(),
  pool.get_token_mint_1().unwrap().as_ref(),
  pool.lp_mint_key.as_ref(),
  ],
  bump = pool.bump,
  seeds::program = two_pool::ID,
  )]
    pub pool: Account<'info, TwoPool>,

    #[account(
  init,
  payer = payer,
  seeds = [
  b"propeller".as_ref(),
  b"token_id".as_ref(),
  &output_token_index.to_le_bytes().as_ref()
  ],
  bump,
  space = 8 + TokenIdMapping::LEN,
  )]
    pub token_id_map: Account<'info, TokenIdMapping>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TokenIdMapping {
    pub output_token_index: u16,
    pub pool: Pubkey,
    pub pool_token_index: u8,
    pub pool_token_mint: Pubkey,
    pub pool_ix: PoolInstruction,
    pub bump: u8,
}

impl TokenIdMapping {
    pub const LEN: usize = 2 + 32 + 32 + 1 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum PoolInstruction {
    RemoveExactBurn,
    SwapExactInput,
}

impl<'info> CreateTokenIdMapping<'info> {
    pub fn accounts(
        ctx: &Context<CreateTokenIdMapping>,
        output_token_index: u16,
        pool: Pubkey,
        pool_token_index: u8,
        pool_token_mint: Pubkey,
    ) -> Result<()> {
        //TODO: add error codes
        require_keys_eq!(ctx.accounts.pool.key(), pool);
        let pool_token_index = pool_token_index as usize;
        require_gt!(2, pool_token_index);
        require_keys_eq!(
            ctx.accounts.pool.token_mint_keys[pool_token_index],
            pool_token_mint //PropellerError::InvalidPoolTokenMint
        );
        Ok(())
    }
}

pub fn handle_create_token_id_mapping(
    ctx: Context<CreateTokenIdMapping>,
    output_token_index: u16,
    pool: Pubkey,
    pool_token_index: u8,
    pool_token_mint: Pubkey,
    pool_ix: PoolInstruction,
) -> Result<()> {
    let mut token_id_map = &mut ctx.accounts.token_id_map;
    token_id_map.output_token_index = output_token_index;
    token_id_map.pool = pool;
    token_id_map.pool_token_index = pool_token_index;
    token_id_map.pool_token_mint = pool_token_mint;
    token_id_map.bump = *ctx.bumps.get("token_id_map").unwrap();
    token_id_map.pool_ix = pool_ix;
    Ok(())
}
