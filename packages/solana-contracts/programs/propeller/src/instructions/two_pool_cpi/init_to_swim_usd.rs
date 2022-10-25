use {
    crate::{
        constants::{METAPOOL_SWIM_USD_INDEX, PROPELLER_MINIMUM_OUTPUT_AMOUNT},
        error::*,
        Propeller, TOKEN_COUNT,
    },
    anchor_lang::{prelude::*, solana_program::program::invoke},
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{Mint, Token, TokenAccount},
    },
    two_pool::{gen_pool_signer_seeds, program::TwoPool as TwoPoolProgram, state::TwoPool},
};

#[derive(Accounts)]
pub struct InitToSwimUsd<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref()],
    bump = propeller.bump,
    constraint = !propeller.is_paused @ PropellerError::IsPaused,
    )]
    pub propeller: Box<Account<'info, Propeller>>,
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool_token_account_0.mint.as_ref(),
    pool_token_account_1.mint.as_ref(),
    lp_mint.key().as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub pool: Box<Account<'info, TwoPool>>,
    // /// TODO: could be removed if initialized with pool_v2
    // /// CHECK: checked in CPI
    // pub pool_auth: UncheckedAccount<'info>,
    #[account(
    mut,
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[0]),
    constraint = pool_token_account_0.key() == pool.token_keys[0],
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = get_associated_token_address(&pool.key(), &pool.token_mint_keys[1]),
    constraint = pool_token_account_1.key() == pool.token_keys[1],
    )]
    pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    address = pool.lp_mint_key,
    )]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(
    mut,
    token::mint = lp_mint,
    address = pool.governance_fee_key,
    )]
    pub governance_fee: Box<Account<'info, TokenAccount>>,
    ///CHECK: checked in CPI
    pub user_transfer_authority: Signer<'info>,
    #[account(
    mut,
    token::mint = pool_token_account_0.mint,
    )]
    pub user_token_account_0: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    token::mint = pool_token_account_1.mint,
    )]
    pub user_token_account_1: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: leaving as unchecked account since it's not needed if invoking swap_exact_input
    /// validation will be checked in the pool CPI call anyways
    pub user_lp_token_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,

    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

pub enum ToSwimUsdStep {
    Add,
    SwapExactInput,
}

impl<'info> InitToSwimUsd<'info> {
    fn determine_to_swim_usd_step(&self) -> Result<ToSwimUsdStep> {
        let pool = &self.pool;
        let swim_usd_mint = self.propeller.swim_usd_mint;
        return if pool.lp_mint_key == swim_usd_mint {
            Ok(ToSwimUsdStep::Add)
        } else if pool.token_mint_keys[0] == swim_usd_mint {
            Ok(ToSwimUsdStep::SwapExactInput)
        } else {
            err!(PropellerError::InvalidPoolForInitToSwimUsd)
        };
    }

    fn invoke_pool_ix_for_swim_usd(
        &self,
        input_amounts: [u64; TOKEN_COUNT],
        minimum_output_amount: u64,
    ) -> Result<u64> {
        let to_swim_usd_step = self.determine_to_swim_usd_step()?;
        let output_amount = match to_swim_usd_step {
            ToSwimUsdStep::Add => self.invoke_add(input_amounts, minimum_output_amount)?,
            ToSwimUsdStep::SwapExactInput => self.invoke_swap_exact_input(input_amounts, minimum_output_amount)?,
        };
        Ok(output_amount)
    }

    fn invoke_swap_exact_input(
        &self,
        exact_input_amounts: [u64; TOKEN_COUNT],
        minimum_output_amount: u64,
    ) -> Result<u64> {
        require_eq!(
            exact_input_amounts[METAPOOL_SWIM_USD_INDEX as usize],
            0u64,
            PropellerError::InvalidSwapExactInputInputAmount
        );
        let cpi_ctx = CpiContext::new(
            self.two_pool_program.to_account_info(),
            two_pool::cpi::accounts::SwapExactInput {
                pool: self.pool.to_account_info(),
                pool_token_account_0: self.pool_token_account_0.to_account_info(),
                pool_token_account_1: self.pool_token_account_1.to_account_info(),
                lp_mint: self.lp_mint.to_account_info(),
                governance_fee: self.governance_fee.to_account_info(),
                user_transfer_authority: self.user_transfer_authority.to_account_info(),
                user_token_account_0: self.user_token_account_0.to_account_info(),
                user_token_account_1: self.user_token_account_1.to_account_info(),
                token_program: self.token_program.to_account_info(),
            },
        );

        let result = two_pool::cpi::swap_exact_input(
            cpi_ctx,
            exact_input_amounts,
            METAPOOL_SWIM_USD_INDEX,
            minimum_output_amount,
        )?;
        let output_amount = result.get();
        msg!("ToSwimUsd[swap_exact_input] - output_amount: {}", output_amount);
        Ok(output_amount)
    }

    fn invoke_add(&self, input_amounts: [u64; TOKEN_COUNT], minimum_mint_amount: u64) -> Result<u64> {
        let cpi_ctx = CpiContext::new(
            self.two_pool_program.to_account_info(),
            two_pool::cpi::accounts::AddOrRemove {
                swap: two_pool::cpi::accounts::Swap {
                    pool: self.pool.to_account_info(),
                    pool_token_account_0: self.pool_token_account_0.to_account_info(),
                    pool_token_account_1: self.pool_token_account_1.to_account_info(),
                    lp_mint: self.lp_mint.to_account_info(),
                    governance_fee: self.governance_fee.to_account_info(),
                    user_transfer_authority: self.user_transfer_authority.to_account_info(),
                    user_token_account_0: self.user_token_account_0.to_account_info(),
                    user_token_account_1: self.user_token_account_1.to_account_info(),
                    token_program: self.token_program.to_account_info(),
                },
                user_lp_token_account: self.user_lp_token_account.to_account_info(),
            },
        );
        let result = two_pool::cpi::add(cpi_ctx, input_amounts, minimum_mint_amount)?;
        let output_amount = result.get();
        msg!("ToSwimUsd(add) - output_amount: {}", output_amount);
        Ok(output_amount)
    }
}

pub fn handle_cross_chain_init_to_swim_usd(
    ctx: Context<InitToSwimUsd>,
    input_amounts: [u64; TOKEN_COUNT],
    minimum_output_amount: u64,
) -> Result<u64> {
    let output_amount = ctx.accounts.invoke_pool_ix_for_swim_usd(input_amounts, minimum_output_amount)?;
    Ok(output_amount)
}

pub fn handle_propeller_init_to_swim_usd(
    ctx: Context<InitToSwimUsd>,
    input_amounts: [u64; TOKEN_COUNT],
    max_fee: u64,
) -> Result<u64> {
    let output_amount = handle_cross_chain_init_to_swim_usd(ctx, input_amounts, PROPELLER_MINIMUM_OUTPUT_AMOUNT)?;
    require_gt!(output_amount, max_fee, PropellerError::InsufficientAmount);
    Ok(output_amount)
}
