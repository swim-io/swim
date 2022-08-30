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
use crate::{Propeller, PropellerError, PropellerSender, PropellerSwapExactInputParams, TOKEN_COUNT, TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, TransferWithPayloadData};
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
pub struct SwapExactInputAndTransfer<'info> {
	#[account(
	seeds = [
	b"propeller".as_ref(),
	token_bridge_mint.key().as_ref(),
	],
	bump = propeller.bump,
	)]
	pub propeller: Account<'info, Propeller>,
	
	#[account(mut)]
	/// CHECK: checked in CPI
	pub pool_state: UncheckedAccount<'info>,
	/// CHECK: checked in CPI
	pub pool_auth: UncheckedAccount<'info>,
	// note: assume for metapools that pool_token_account_0 is always swimUSD token account
	#[account(
	mut,
	constraint = pool_token_account_0.mint == propeller.token_bridge_mint @ PropellerError::InvalidMint
	)]
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
	#[account(
	constraint = pool_program.key() == two_pool::id(),
	executable,
	)]
	/// CHECK: Wormhole Program
	pub pool_program: AccountInfo<'info>,
	
	#[account(
		mut,
		constraint = token_bridge_mint.key() == propeller.token_bridge_mint @ PropellerError::InvalidMint
	)]
	pub token_bridge_mint: Box<Account<'info, Mint>>,
	
	#[account(mut)]
	pub payer: Signer<'info>,
	
	#[account(
	mut,
	seeds = [ b"config".as_ref() ],
	bump,
	seeds::program = propeller.token_bridge().unwrap()
	)]
	/// CHECK: Token Bridge Config
	pub token_bridge_config: AccountInfo<'info>,
	pub token_program: Program<'info, Token>,
	pub system_program: Program<'info, System>,
	// pub associated_token_program: Program<'info, AssociatedToken>,
	
	#[account(
	constraint = token_bridge.key() == propeller.token_bridge().unwrap(),
	executable
	)]
	/// CHECK: Token Bridge Program
	pub token_bridge: AccountInfo<'info>,
	
	//TODO: change this associated_token account?
	//      is it necessary to do check since CPI will do check?
	//      check might fail since we might have to create the account on the very first interaction?
	//      does attest() create the account?
	//
	// If token is native to SOL, then this is token bridge custody (ATA) that holds the native token.
	#[account(mut)]
	/// CHECK: Will either be token bridge custody account or wrapped meta account. (will always be custody)
	pub custody: AccountInfo<'info>,
	
	
	#[account(
	seeds=[b"custody_signer".as_ref()],
	bump,
	seeds::program = token_bridge.key()
	)]
	/// CHECK: Only used for bridging assets native to Solana.
	pub custody_signer: AccountInfo<'info>,
	
	#[account(
	seeds=[b"authority_signer".as_ref()],
	bump,
	seeds::program = token_bridge.key()
	)]
	/// CHECK: Token Bridge Authority Signer, delegated approval for transfer
	pub authority_signer: AccountInfo<'info>,
	
	#[account(
	constraint = wormhole.key() == propeller.wormhole().unwrap(),
	executable
	)]
	/// CHECK: Wormhole Program
	pub wormhole: AccountInfo<'info>,
	
	#[account(
	mut,
	seeds = [b"Bridge".as_ref()],
	bump,
	seeds::program = propeller.wormhole().unwrap()
	)]
	/// CHECK: Wormhole Config
	pub wormhole_config: AccountInfo<'info>,
	
	#[account(
	mut,
	seeds = [b"fee_collector".as_ref()],
	bump,
	seeds::program = propeller.wormhole().unwrap()
	)]
	/// CHECK: Wormhole Fee Collector
	pub wormhole_fee_collector: AccountInfo<'info>,
	
	#[account(
	mut,
	seeds = [b"emitter".as_ref()],
	bump,
	seeds::program = propeller.token_bridge().unwrap()
	)]
	/// CHECK: Wormhole Emitter is the Token Bridge Program
	pub wormhole_emitter: AccountInfo<'info>,
	
	#[account(
	mut,
	seeds = [
	b"Sequence".as_ref(),
	wormhole_emitter.key().as_ref()
	],
	bump,
	seeds::program = propeller.wormhole().unwrap()
	)]
	/// CHECK: Wormhole Sequence Number
	pub wormhole_sequence: AccountInfo<'info>,
	
	#[account(mut)]
	/// Note:
	///     switched to using a `Signer`
	///     instead of a PDA since a normal token bridge transfer
	///     uses a Keypair.generate()
	///
	///     A new one needs to be used for every transfer
	///
	///     WH expects this to be an uninitialized account so might
	///     be able to use a PDA still in the future.
	///     maybe [b"propeller".as_ref(), payer, sequence_value]
	/// CHECK: Wormhole Message Storage
	pub wormhole_message: Signer<'info>,
	// pub wormhole_message: AccountInfo<'info>,
	
	#[account(
	seeds = [ b"sender".as_ref()],
	bump = propeller.sender_bump,
	)]
	/// CHECK: Wormhole Sender
	pub sender: AccountInfo<'info>,
	// pub sender: Account<'info, PropellerSender>,
	
	pub clock: Sysvar<'info, Clock>,
	
	pub rent: Sysvar<'info, Rent>,
	
	
}

pub fn handle_swap_exact_input_and_transfer(
	ctx: &Context<SwapExactInputAndTransfer>,
	swap_exact_input_params: PropellerSwapExactInputParams,
	nonce: u32,
	target_chain: u16,
	payload: Vec<u8>,
) -> Result<()> {
	msg!("add_and_wormhole_transfer");
	handle_approve(&ctx, &swap_exact_input_params)?;
	
	let swap_output_amount = handle_swap_exact_input(
		&ctx, &swap_exact_input_params
	)?;
	msg!("finished swap_exact_input. swap_output_amount: {}", swap_output_amount);
	
	handle_wormhole_token_bridge_transfer_native(
		&ctx,
		nonce,
		target_chain,
		swap_output_amount,
		payload,
	)?;
	msg!("finished token bridge transfer native");
	
	revoke(&ctx)
}

pub fn handle_approve(
	ctx: &Context<SwapExactInputAndTransfer>,
	swap_exact_input_params: &PropellerSwapExactInputParams,
	// exact_input_amounts: [u64; TOKEN_COUNT],
) -> Result<()> {
	msg!("[handle_approve]: approve");
	require_gt!(swap_exact_input_params.exact_input_amount, 0 as u64 , PropellerError::InvalidSwapExactInputInputAmount);
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
				to: ctx.accounts.user_token_account_1.to_account_info(),
				delegate: ctx.accounts.pool_auth.to_account_info(),
				authority: ctx.accounts.payer.to_account_info(),
			},
		),
		swap_exact_input_params.exact_input_amount,
	)?;
	msg!("[handle_approve]: finished approves");
	Ok(())
}

pub fn handle_swap_exact_input(
	ctx: &Context<SwapExactInputAndTransfer>,
	swap_exact_input_params: &PropellerSwapExactInputParams,
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
	
	let exact_input_amounts = [0, swap_exact_input_params.exact_input_amount];
	let swap_defi_ix = two_pool::instruction::DeFiInstruction::SwapExactInput{
		exact_input_amounts,
		output_token_index: SWAP_EXACT_INPUT_OUTPUT_TOKEN_INDEX,
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

pub fn handle_wormhole_token_bridge_transfer_native(
	ctx: &Context<SwapExactInputAndTransfer>,
	nonce: u32,
	target_chain: u16,
	amount: u64,
	payload: Vec<u8>,
) -> Result<()> {
	msg!("add_and_wormhole_transfer");
	token::approve(
		CpiContext::new(
			ctx.accounts.token_program.to_account_info(),
			token::Approve {
				// source
				to: ctx.accounts.user_token_account_0.to_account_info(),
				delegate: ctx.accounts.authority_signer.to_account_info(),
				authority: ctx.accounts.payer.to_account_info(),
			},
		),
		amount,
	)?;
	msg!("finished approve for authority_signer");
	
	
	//
	// Note:
	//     1. nonce is created randomly client side using this
	//         export function createNonce() {
	//              const nonceConst = Math.random() * 100000;
	//              const nonceBuffer = Buffer.alloc(4);
	//              nonceBuffer.writeUInt32LE(nonceConst, 0);
	//              return nonceBuffer;
	//          }
	//     2. fee is relayerFee
	//         a. removed in payload3
	//     3. targetAddress is Uint8Array (on wasm.rs its Vec<u8>
	//         a. WH client has special handling/formatting for this
	//             see - wh-sdk/src/utils/array.ts tryNativeToUint8Array(address: string, chain: ChainId | ChainName)
	//     4. targetChain is number/u16
	//     5. payload is Vec<u8>
	let transfer_with_payload_data = TransferWithPayloadData {
		// nonce: ctx.accounts.custodian.nonce,
		//TODO: update this.
		nonce,
		amount,
		// fee: 0,
		// target_address: sale.recipient,
		//TODO: update this.
		//  this should be tryNativeToUint8Array(ethAddress, CHAIN_ID_ETH)
		//  this can either be hardcoded or set in propeller state since we're assuming this is the same for all chains.
		target_address: Pubkey::default().to_bytes(),
		// target_chain: Custodian::conductor_chain()?,
		target_chain,
		payload,
		cpi_program_id: Some(crate::ID),
	};
	// let test = &ctx.accounts.to_account_info();
	// let mut cpiAccts = &ctx.accounts.to_account_infos();
	// cpiAccts.push(anchor_lang::prelude::Clock.to_account_info());
	// cpiAccts.push(anchor_lang::prelude::Rent.to_account_info());
	
	let token_bridge_custody = &ctx.accounts.custody;
	let wh_token_transfer_acct_infos = vec![
		ctx.accounts.payer.to_account_info().clone(),
		ctx.accounts.token_bridge_config.to_account_info().clone(),
		// ctx.accounts.token_bridge.to_account_info().clone(),
		ctx.accounts.user_token_account_0.to_account_info().clone(),
		ctx.accounts.token_bridge_mint.to_account_info().clone(),
		token_bridge_custody.to_account_info().clone(),
		ctx.accounts.authority_signer.to_account_info().clone(),
		ctx.accounts.custody_signer.to_account_info().clone(),
		ctx.accounts.wormhole_config.to_account_info().clone(),
		ctx.accounts.wormhole_message.to_account_info().clone(),
		ctx.accounts.wormhole_emitter.to_account_info().clone(),
		ctx.accounts.wormhole_sequence.to_account_info().clone(),
		ctx.accounts.wormhole_fee_collector.to_account_info().clone(),
		ctx.accounts.clock.to_account_info().clone(),
		ctx.accounts.sender.to_account_info().clone(),
		ctx.accounts.rent.to_account_info().clone(),
		ctx.accounts.system_program.to_account_info().clone(),
		ctx.accounts.wormhole.to_account_info().clone(),
		ctx.accounts.token_program.to_account_info().clone()
	];
	
	let clock = Clock::from_account_info(&ctx.accounts.clock.to_account_info())?;
	let unix_ts = clock.unix_timestamp;
	msg!("unix_ts: {}", unix_ts);
	
	invoke_signed(
		&Instruction {
			program_id: ctx.accounts.token_bridge.key(),
			accounts: vec![
				AccountMeta::new(ctx.accounts.payer.key(), true),
				AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
				AccountMeta::new(ctx.accounts.user_token_account_0.key(), false),
				AccountMeta::new(ctx.accounts.token_bridge_mint.key(), false),
				AccountMeta::new(token_bridge_custody.key(), false),
				AccountMeta::new_readonly(ctx.accounts.authority_signer.key(), false),
				AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
				AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
				
				AccountMeta::new(ctx.accounts.wormhole_message.key(), true),
				AccountMeta::new_readonly(ctx.accounts.wormhole_emitter.key(), false),
				AccountMeta::new(ctx.accounts.wormhole_sequence.key(), false),
				AccountMeta::new(ctx.accounts.wormhole_fee_collector.key(), false),
				AccountMeta::new_readonly(Clock::id(), false),
				//TODO: add.rs sender once that PR is merged
				AccountMeta::new_readonly(ctx.accounts.sender.key(), true),
				
				AccountMeta::new_readonly(Rent::id(), false),
				AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
				
				AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
				AccountMeta::new_readonly(spl_token::id(), false),
			],
			data: (TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, transfer_with_payload_data).try_to_vec()?,
		},
		&wh_token_transfer_acct_infos,
		&[&[
			&b"sender".as_ref(),
			&[ctx.accounts.propeller.sender_bump],
		]],
	)?;
	Ok(())
}

pub fn revoke(ctx: &Context<SwapExactInputAndTransfer>) -> Result<()> {
	msg!("[revoke]: revoke");
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
