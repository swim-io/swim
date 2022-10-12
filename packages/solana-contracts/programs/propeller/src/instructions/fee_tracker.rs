use {
    crate::{error::*, Propeller},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{create, get_associated_token_address, AssociatedToken, Create},
        token::{self, Mint, Token, TokenAccount, Transfer},
    },
    two_pool::state::TwoPool,
};

//TODO: need to initialize propeller with a "fee_vault"

#[derive(Accounts)]
pub struct InitializeFeeTracker<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), swim_usd_mint.key().as_ref()],
    bump = propeller.bump,
    has_one = swim_usd_mint @ PropellerError::InvalidSwimUsdMint,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    #[account(
    init,
    payer = payer,
    seeds = [b"propeller".as_ref(), b"fee".as_ref(), swim_usd_mint.key().as_ref(), payer.key().as_ref()],
    bump,
    space = 8 + FeeTracker::LEN
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub swim_usd_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeFeeTracker<'info> {
    pub fn accounts(ctx: &Context<InitializeFeeTracker>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.propeller.swim_usd_mint,
            ctx.accounts.swim_usd_mint.key(),
            PropellerError::InvalidSwimUsdMint
        );
        Ok(())
    }
}

pub fn handle_initialize_fee_tracker(ctx: Context<InitializeFeeTracker>) -> Result<()> {
    let fee_tracker = &mut ctx.accounts.fee_tracker;
    fee_tracker.bump = *ctx.bumps.get("fee_tracker").unwrap();
    fee_tracker.fees_recipient = ctx.accounts.payer.key();
    fee_tracker.fees_owed = 0;
    fee_tracker.fees_mint = ctx.accounts.swim_usd_mint.key();
    Ok(())
}

#[account]
pub struct FeeTracker {
    pub bump: u8,
    pub fees_recipient: Pubkey,
    pub fees_owed: u64,
    pub fees_mint: Pubkey,
}

impl FeeTracker {
    pub const LEN: usize = 8 + 32 + 8 + 32;
}

#[derive(Accounts)]
pub struct ClaimFees<'info> {
    #[account(
    seeds = [b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    has_one = fee_vault @ PropellerError::InvalidFeeVault,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    #[account(
    mut,
    seeds = [b"propeller".as_ref(), b"fee".as_ref(), fee_tracker.fees_mint.as_ref(), fee_tracker.fees_recipient.as_ref()],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    address = get_associated_token_address(&fee_tracker.fees_recipient, &fee_tracker.fees_mint),
    )]
    pub fee_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub fee_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> ClaimFees<'info> {
    pub fn accounts(ctx: &Context<ClaimFees>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.propeller.swim_usd_mint,
            ctx.accounts.fee_tracker.fees_mint,
            PropellerError::InvalidSwimUsdMint
        );
        Ok(())
    }
}

/// Tehcnically anyone can pay the claim fees for anyone else.
pub fn handle_claim_fees(ctx: Context<ClaimFees>) -> Result<()> {
    let fee_tracker = &mut ctx.accounts.fee_tracker;
    let fees_owed = fee_tracker.fees_owed;

    let cpi_accounts = Transfer {
        from: ctx.accounts.fee_vault.to_account_info(),
        to: ctx.accounts.fee_account.to_account_info(),
        authority: ctx.accounts.propeller.to_account_info(),
    };

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            &[&[&b"propeller".as_ref(), ctx.accounts.propeller.swim_usd_mint.as_ref(), &[ctx.accounts.propeller.bump]]],
        ),
        fees_owed,
    )?;
    fee_tracker.fees_owed = 0;
    Ok(())
}
