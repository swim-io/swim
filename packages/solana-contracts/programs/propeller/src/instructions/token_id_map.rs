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
#[instruction(target_token_index: u16, pool: Pubkey, pool_token_index: u8, pool_token_mint: Pubkey)]
pub struct CreateTokenIdMap<'info> {
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
    seeds = [
    b"two_pool".as_ref(),
      pool.get_token_mint_0().unwrap().as_ref(),
      pool.get_token_mint_1().unwrap().as_ref(),
      pool.lp_mint_key.as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key(),
    )]
    pub pool: Account<'info, TwoPool>,

    #[account(
    init,
    payer = payer,
    seeds = [
    b"propeller".as_ref(),
    b"token_id".as_ref(),
    propeller.key().as_ref(),
    &target_token_index.to_le_bytes()
    ],
    bump,
    space = 8 + TokenIdMap::LEN,
    )]
    pub token_id_map: Account<'info, TokenIdMap>,
    pub system_program: Program<'info, System>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

#[account]
pub struct TokenIdMap {
    pub output_token_index: u16,
    pub pool: Pubkey,
    pub pool_token_index: u8,
    pub pool_token_mint: Pubkey,
    pub pool_ix: PoolInstruction,
    pub bump: u8,
}

impl TokenIdMap {
    pub const LEN: usize = 2 + 32 + 1 + 32 + 1 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Debug)]
pub enum PoolInstruction {
    Transfer,
    RemoveExactBurn,
    SwapExactInput,
}

impl<'info> CreateTokenIdMap<'info> {
    pub fn accounts(
        ctx: &Context<CreateTokenIdMap>,
        target_token_index: u16,
        pool: Pubkey,
        pool_token_index: u8,
        pool_token_mint: Pubkey,
        pool_ix: PoolInstruction,
    ) -> Result<()> {
        //TODO: add error codes
        require_keys_eq!(ctx.accounts.propeller.admin, ctx.accounts.admin.key(), PropellerError::InvalidPropellerAdmin);
        require_keys_eq!(ctx.accounts.pool.key(), pool, PropellerError::InvalidTokenIdMapPool);
        if let PoolInstruction::Transfer = pool_ix {
            require_keys_eq!(
                ctx.accounts.propeller.token_bridge_mint,
                pool_token_mint,
                PropellerError::InvalidTokenIdMapPoolTokenMint
            );
            return Ok(());
        }

        let pool_token_index = pool_token_index as usize;
        require_gt!(TOKEN_COUNT, pool_token_index, PropellerError::InvalidTokenIdMapPoolTokenIndex);
        require_keys_eq!(
            ctx.accounts.pool.token_mint_keys[pool_token_index],
            pool_token_mint,
            PropellerError::InvalidTokenIdMapPoolTokenMint
        );
        Ok(())
    }
}

pub fn handle_create_token_id_map(
    ctx: Context<CreateTokenIdMap>,
    target_token_index: u16,
    pool: Pubkey,
    pool_token_index: u8,
    pool_token_mint: Pubkey,
    pool_ix: PoolInstruction,
) -> Result<()> {
    let mut token_id_map = &mut ctx.accounts.token_id_map;
    token_id_map.output_token_index = target_token_index;
    token_id_map.pool = pool;
    token_id_map.pool_token_index = pool_token_index;
    token_id_map.pool_token_mint = pool_token_mint;
    token_id_map.bump = *ctx.bumps.get("token_id_map").unwrap();
    token_id_map.pool_ix = pool_ix;
    Ok(())
}

pub fn handle_update_token_id_map() -> Result<()> {
    todo!()
}
