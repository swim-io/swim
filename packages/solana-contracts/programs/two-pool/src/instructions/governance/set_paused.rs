use {
    crate::{
        error::*,
        TwoPool,
    },
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct SetPaused<'info> {
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
    pub pause_key: Signer<'info>,
}

impl<'info> SetPaused<'info> {
    pub fn accounts(ctx: &Context<SetPaused>) -> Result<()> {
        require_keys_eq!(ctx.accounts.pause_key.key(), ctx.accounts.pool.pause_key, PoolError::InvalidPauseKey);
        Ok(())
    }
}

pub fn handle_set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.is_paused = paused;
    Ok(())
}
