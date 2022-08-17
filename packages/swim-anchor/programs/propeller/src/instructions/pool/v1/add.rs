use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
	borsh::try_from_slice_unchecked,
	instruction::Instruction,
	program::{invoke, invoke_signed, get_return_data},
	program_option::COption,
	system_instruction::transfer,
	sysvar::SysvarId
};
use anchor_spl::token;
use anchor_spl::token::{
	Mint,
	Token,
	TokenAccount,
};
use crate::{AddParams, Propeller, PropellerError, PropellerSender, TOKEN_COUNT, TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, TransferWithPayloadData};

#[derive(Accounts)]
pub struct Add<'info>{
	
	#[account(mut)]
	/// CHECK: checked in CPI
	pub pool_state: UncheckedAccount<'info>,
	/// TODO: could be removed if initialized with pool_v2
	/// CHECK: checked in CPI
	pub pool_auth: UncheckedAccount<'info>,
	#[account(mut)]
	pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
	#[account(mut)]
	pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
	#[account(
	mut,
	)]
	pub lp_mint: Box<Account<'info, Mint>>,
	#[account(
	mut,
	token::mint = lp_mint
	)]
	pub governance_fee: Box<Account<'info, TokenAccount>>,
	/// CHECK: checked in CPI
	// pub user_transfer_authority: Signer<'info>,
	#[account(
	mut,
	token::mint = pool_token_account_0.mint,
	token::authority = payer
	)]
	pub user_token_account_0: Box<Account<'info, TokenAccount>>,
	#[account(
	mut,
	token::mint = pool_token_account_1.mint,
	token::authority = payer
	)]
	pub user_token_account_1: Box<Account<'info, TokenAccount>>,
	//TODO: add.rs executable constraint check here
	//  maybe switch to `Program` type after two-pool rewrite to anchor.
	//  https://docs.rs/anchor-lang/latest/anchor_lang/accounts/program/struct.Program.html
	#[account(executable, address = two_pool::id())]
	/// CHECK: Wormhole Program
	pub pool_program: AccountInfo<'info>,
	
	#[account(
	mut,
	associated_token::mint = lp_mint,
	associated_token::authority = payer
	)]
	pub user_lp_token_account: Box<Account<'info, TokenAccount>>,
	
	#[account(mut)]
	pub payer: Signer<'info>,
	
	pub token_program: Program<'info, Token>,
	
}

impl<'info> Add<'info> {
	//Note: some of the checks are excessive (checked in CPI etc) and add.rs to compute budget but since we now have access to requesting
	//  up to 1.4M compute budget per transaction, better safe than sorry to perform them.
	//TODO: leave this as simple log for now. can add checks later when needed.
	pub fn accounts(ctx: &Context<Add>) -> Result<()> {
		// let pool_state_acct = &ctx.accounts.pool_state;
		// let pool: two_pool::state::PoolState<{two_pool::TOKEN_COUNT}> = two_pool::state::PoolState::try_from_slice(&pool_state_acct.data.borrow())?;
		// constraint = lp_mint.key() == propeller.token_bridge_mint @ PropellerError::InvalidMint
		msg!("finished accounts context check");
		Ok(())
	}
}

pub fn handle_pool_add(
	ctx: Context<Add>,
	pool_add_params: AddParams,
) -> Result<()> {
	msg!("add_and_wormhole_transfer");
	handle_approve(&ctx, &pool_add_params)?;
	
	let mint_amount = handle_add_liquidity(&ctx, pool_add_params)?;
	msg!("finished add_liquidity. mint_amount: {}", mint_amount);
	
	revoke(&ctx)
	
	// Ok(mint_amount)
}

pub fn handle_approve(
	ctx: &Context<Add>,
	pool_add_params: &AddParams,
) -> Result<()> {
	msg!("[handle_approve]: approve");
	token::approve(
		CpiContext::new(
			ctx.accounts.token_program.to_account_info(),
			token::Approve {
				// source
				to: ctx.accounts.user_token_account_0.to_account_info(),
				delegate: ctx.accounts.pool_auth.to_account_info(),
				authority: ctx.accounts.payer.to_account_info(),
			},
		),
		pool_add_params.input_amounts[0],
	)?;
	
	token::approve(
		CpiContext::new(
			ctx.accounts.token_program.to_account_info(),
			token::Approve {
				// source
				to: ctx.accounts.user_token_account_1.to_account_info(),
				delegate: ctx.accounts.pool_auth.to_account_info(),
				authority: ctx.accounts.payer.to_account_info(),
			},
		),
		pool_add_params.input_amounts[1],
	)?;
	msg!("[handle_approve]: finished approves");
	Ok(())
}

pub fn handle_add_liquidity(
	ctx: &Context<Add>,
	pool_add_params: AddParams
) -> Result<u64> {
	let pool_program = &ctx.accounts.pool_program;
	let pool = &ctx.accounts.pool_state;
	let pool_auth = &ctx.accounts.pool_auth;
	let pool_token_account_0 = &ctx.accounts.pool_token_account_0;
	let pool_token_account_1 = &ctx.accounts.pool_token_account_1;
	let lp_mint = &ctx.accounts.lp_mint;
	let governance_fee = &ctx.accounts.governance_fee;
	// let user_transfer_auth = &ctx.accounts.user_transfer_authority;
	let user_token_account_0 = &ctx.accounts.user_token_account_0;
	let user_token_account_1 = &ctx.accounts.user_token_account_1;
	let user_lp_token_account = &ctx.accounts.user_lp_token_account;
	// let token_program = &self.token_program;
	
	let add_defi_ix = two_pool::instruction::DeFiInstruction::Add{
		input_amounts: pool_add_params.input_amounts,
		minimum_mint_amount: pool_add_params.minimum_mint_amount
	};
	let add_ix = two_pool::instruction::create_defi_ix(
		add_defi_ix,
		&pool_program.key(),
		&pool.key(),
		&pool_auth.key(),
		&[
			pool_token_account_0.key(),
			pool_token_account_1.key()
		],
		&lp_mint.key(),
		&governance_fee.key(),
		&pool_auth.key(),
		// &user_transfer_auth.key(),
		&[
			user_token_account_0.key(),
			user_token_account_1.key()
		],
		Some(&user_lp_token_account.key()),
	)?;
	invoke(
		&add_ix,
		&ctx.accounts.to_account_infos(),
	)?;
	let (program_id, data) = get_return_data().unwrap();
	//.unwrap_or_else(PropellerError::InvalidCpiReturnValue);
	require_keys_eq!(program_id, ctx.accounts.pool_program.key(), PropellerError::InvalidCpiReturnProgramId);
	Ok(u64::try_from_slice(&data).map_err(|_| PropellerError::InvalidCpiReturnValue)?)
}

pub fn revoke(ctx: &Context<Add>) -> Result<()> {
	msg!("[revoke]: revoke");
	token::revoke(
		CpiContext::new(
			ctx.accounts.token_program.to_account_info(),
			token::Revoke {
				// source
				source: ctx.accounts.user_token_account_0.to_account_info(),
				authority: ctx.accounts.payer.to_account_info(),
			},
		)
	)?;
	token::revoke(
		CpiContext::new(
			ctx.accounts.token_program.to_account_info(),
			token::Revoke {
				// source
				source: ctx.accounts.user_token_account_1.to_account_info(),
				authority: ctx.accounts.payer.to_account_info(),
			},
		)
	)?;
	msg!("Revoked delegate authority for user_token_accounts");
	token::revoke(
		CpiContext::new(
			ctx.accounts.token_program.to_account_info(),
			token::Revoke {
				// source
				source: ctx.accounts.user_lp_token_account.to_account_info(),
				authority: ctx.accounts.payer.to_account_info(),
			},
		)
	)?;
	msg!("Revoked delegate authority for user_lp_token_account");
	msg!("[revoke]: finished revoke");
	Ok(())
}