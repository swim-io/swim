use {crate::common_governance::*, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct ChangePauseKey<'info> {
    pub common_governance: CommonGovernance<'info>,
}

impl<'info> ChangePauseKey<'info> {
    pub fn accounts(ctx: &Context<ChangePauseKey>) -> Result<()> {
        CommonGovernance::accounts(&ctx.accounts.common_governance)?;
        Ok(())
    }
}

pub fn handle_change_pause_key(ctx: Context<ChangePauseKey>, new_pause_key: Pubkey) -> Result<()> {
    let pool = &mut ctx.accounts.common_governance.pool;
    pool.pause_key = new_pause_key;
    Ok(())
}
