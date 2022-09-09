use {
    crate::{error::*, Propeller, PropellerSender},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{create, AssociatedToken, Create},
        token::{self, Mint, Token, TokenAccount, Transfer},
    },
    two_pool::state::TwoPool,
};

//TODO: need to initialize propeller with a "fee_vault"

#[derive(Accounts)]
pub struct InitializeFeeTracker<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), token_bridge_mint.key().as_ref()],
    bump = propeller.bump,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    #[account(
    init,
    payer = payer,
    seeds = [b"propeller".as_ref(), b"fee".as_ref(), token_bridge_mint.key().as_ref(), payer.key().as_ref()],
    bump,
    space = 8 + FeeTracker::LEN
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_bridge_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeFeeTracker<'info> {
    pub fn accounts(ctx: &Context<InitializeFeeTracker>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.propeller.token_bridge_mint,
            ctx.accounts.token_bridge_mint.key(),
            PropellerError::InvalidTokenBridgeMint
        );
        Ok(())
    }
}

pub fn handle_initialize_fee_tracker(ctx: Context<InitializeFeeTracker>) -> Result<()> {
    let fee_tracker = &mut ctx.accounts.fee_tracker;
    fee_tracker.bump = *ctx.bumps.get("fee_tracker").unwrap();
    fee_tracker.payer = ctx.accounts.payer.key();
    fee_tracker.fees_owed = 0;
    fee_tracker.fees_mint = ctx.accounts.token_bridge_mint.key();
    Ok(())
}

#[account]
pub struct FeeTracker {
    pub bump: u8,
    pub payer: Pubkey,
    pub fees_owed: u64,
    pub fees_mint: Pubkey,
}

impl FeeTracker {
    pub const LEN: usize = 8 + 32 + 8 + 32;
}

#[derive(Accounts)]
pub struct ClaimFees<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.token_bridge_mint.as_ref()],
    bump = propeller.bump,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    #[account(
    seeds = [b"propeller".as_ref(), b"fee".as_ref(), fee_tracker.fees_mint.as_ref(), fee_tracker.payer.as_ref()],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    token::mint = fee_tracker.fees_mint,
    token::authority = payer,
    )]
    pub payer_fee_account: Account<'info, TokenAccount>,

    #[account(
    mut,
    token::mint = fee_tracker.fees_mint,
    token::authority = propeller,
    )]
    pub propeller_fee_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_claim_fees(ctx: Context<ClaimFees>) -> Result<()> {
    let fee_tracker = &mut ctx.accounts.fee_tracker;
    let fees_owed = fee_tracker.fees_owed;

    let cpi_accounts = Transfer {
        from: ctx.accounts.propeller_fee_vault.to_account_info(),
        to: ctx.accounts.payer_fee_account.to_account_info(),
        authority: ctx.accounts.propeller.to_account_info(),
    };

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            &[&[
                &b"propeller".as_ref(),
                ctx.accounts.propeller.token_bridge_mint.as_ref(),
                &[ctx.accounts.propeller.bump],
            ]],
        ),
        fees_owed,
    )?;
    fee_tracker.fees_owed = 0;
    Ok(())
}
