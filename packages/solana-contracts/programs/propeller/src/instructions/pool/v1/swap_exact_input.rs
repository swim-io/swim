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
use crate::{SwapExactInputParams, Propeller, PropellerError, PropellerSender, TOKEN_COUNT, TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, TransferWithPayloadData};
use crate::constants::SWAP_EXACT_INPUT_OUTPUT_TOKEN_INDEX;


/// Swaps in the exact specified amounts for
/// at least `minimum_out_amount` of the output_token specified
/// by output_token_index
///
/// Accounts expected by this instruction:
///     0. `[w]` The pool state account
///     1. `[]` pool authority
///     2. ..2 + TOKEN_COUNT `[w]` pool's token accounts
///     3. ..3 + TOKEN_COUNT `[w]` LP Token Mint
///     4. ..4 + TOKEN_COUNT `[w]` governance_fee_account
///     5. ..5 + TOKEN_COUNT `[s]` user transfer authority account
///     6. ..6 + TOKEN_COUNT `[w]` user token accounts
#[derive(Accounts)]
pub struct SwapExactInput<'info> {
	#[account(mut)]
	/// CHECK: checked in CPI
	pub pool_state: UncheckedAccount<'info>,
	/// CHECK: checked in CPI
	pub pool_auth: UncheckedAccount<'info>,
	// note: assume for metapools that pool_token_account_0 is always swimUSD token account
	#[account(mut)]
	pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
	#[account(mut)]
	pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
	#[account(mut)]
	pub lp_mint: Box<Account<'info, Mint>>,
	#[account(mut)]
	pub governance_fee: Box<Account<'info, TokenAccount>>,
	
	#[account(
	mut,
	constraint = user_token_account_0.mint == pool_token_account_0.mint
	)]
	pub user_token_account_0: Box<Account<'info, TokenAccount>>,
	#[account(mut)]
	pub user_token_account_1: Box<Account<'info, TokenAccount>>,
	//TODO: add.rs executable constraint check here
	//  maybe switch to `Program` type after two-pool rewrite to anchor.
	//  https://docs.rs/anchor-lang/latest/anchor_lang/accounts/program/struct.Program.html
	#[account(executable, address = two_pool::id())]
	/// CHECK: Pool Program
	pub pool_program: AccountInfo<'info>,
	
	//TODO: probably need a user_transfer_auth account since either the user or propeller could be payer for txn.
	//  payer could be the same as user_auth if user manually completing the txn but still need
	//  to have a separate field to account for it
	#[account(mut)]
	pub payer: Signer<'info>,
	
	pub token_program: Program<'info, Token>,
}

impl<'info> SwapExactInput<'info> {
	pub fn accounts(ctx: &Context<SwapExactInput>) -> Result<()> {
		Ok(())
	}
}

pub fn handle_pool_swap_exact_input(
	ctx: Context<SwapExactInput>,
	swap_exact_input_params: SwapExactInputParams,
) -> Result<()> {
	msg!("add_and_wormhole_transfer");
	handle_approve(&ctx, &swap_exact_input_params)?;
	
	let swap_output_amount = handle_swap_exact_input(
		&ctx, &swap_exact_input_params
	)?;
	msg!("finished swap_exact_input. swap_output_amount: {}", swap_output_amount);
	
	revoke(&ctx)
}

pub fn handle_approve(
	ctx: &Context<SwapExactInput>,
	swap_exact_input_params: &SwapExactInputParams,
	// exact_input_amounts: [u64; TOKEN_COUNT],
) -> Result<()> {
	msg!("[handle_approve]: approve");
	// require_gt!(swap_exact_input_params.exact_input_amounts, 0 , PropellerError::InvalidSwapExactInputInputAmount);
	// require_eq!(
	// 	swap_exact_input_params.exact_input_amounts[SWAP_EXACT_INPUT_OUTPUT_TOKEN_INDEX as usize],
	// 	0,
	// 	PropellerError::InvalidSwapExactInputInputAmount
	// );
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
		swap_exact_input_params.exact_input_amounts[0],
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
		swap_exact_input_params.exact_input_amounts[1],
	)?;
	msg!("[handle_approve]: finished approves");
	Ok(())
}

pub fn handle_swap_exact_input(
	ctx: &Context<SwapExactInput>,
	swap_exact_input_params: &SwapExactInputParams,
	// exact_input_amounts: [u64; TOKEN_COUNT],
	// minimum_output_amount: u64,
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
	
	// let token_program = &ctx.accounts.token_program;
	
	// let exact_input_amounts = [0, swap_exact_input_params.exact_input_amounts];
	let swap_defi_ix = two_pool::instruction::DeFiInstruction::SwapExactInput{
		exact_input_amounts: swap_exact_input_params.exact_input_amounts,
		output_token_index: swap_exact_input_params.output_token_index,
		minimum_output_amount: swap_exact_input_params.minimum_output_amount,
	};
	
	let swap_ix = two_pool::instruction::create_defi_ix(
		swap_defi_ix,
		&pool_program.key(),
		&pool.key(),
		&pool_auth.key(),
		&[
			pool_token_account_0.key(),
			pool_token_account_1.key(),
		],
		&lp_mint.key(),
		&governance_fee.key(),
		&pool_auth.key(),
		&[
			user_token_account_0.key(),
			user_token_account_1.key(),
		],
		None
	)?;
	invoke(
		&swap_ix,
		&ctx.accounts.to_account_infos(),
	)?;
	let (program_id, data) = get_return_data().unwrap();
	require_keys_eq!(program_id, ctx.accounts.pool_program.key(), PropellerError::InvalidCpiReturnProgramId);
	Ok(u64::try_from_slice(&data).map_err(|_| PropellerError::InvalidCpiReturnValue)?)
}

pub fn revoke(ctx: &Context<SwapExactInput>) -> Result<()> {
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
	msg!("[revoke]: finished revoke");
	Ok(())
}
