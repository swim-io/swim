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
use crate::{Propeller, PropellerError, PropellerSender, TOKEN_COUNT, TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, TransferWithPayloadData};

#[derive(Accounts)]
pub struct AddAndWormholeTransfer<'info> {
	#[account(
	seeds = [
	b"propeller".as_ref(),
	lp_mint.key().as_ref(),
	],
	bump = propeller.bump,
	)]
	pub propeller: Account<'info, Propeller>,
	
	#[account(mut)]
	/// CHECK: checked in CPI
	pub pool_state: UncheckedAccount<'info>,
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
	
	#[account(executable, address = propeller.token_bridge()?)]
	/// CHECK: Token Bridge Program
	pub token_bridge: AccountInfo<'info>,
	
	//TODO: change this associated_token account?
	//      is it necessary to do check since CPI will do check?
	//
	// If token is native to SOL, then this is token bridge custody (ATA) that holds the native token.
	#[account(mut)]
	/// CHECK: Will either be token bridge custody account or wrapped meta account
	pub custody: AccountInfo<'info>,
	//  technical edge-case - on first token_bridge_transfer with the token, this custody account won't be
	//  initialized yet. if we can assume that this account is initialized, we can do explicit type check here.
	// pub custody_or_wrapped_meta: Box<Account<'info, TokenAccount>>,
	
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
	executable, address = propeller.wormhole()?
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
	
	/// Transfers with payload also include the address of the account or contract
	/// that sent the transfer. Semantically this is identical to "msg.sender" on
	/// EVM chains, i.e. it is the address of the immediate caller of the token
	/// bridge transaction.
	/// Since on Solana, a transaction can have multiple different signers, getting
	/// this information is not so straightforward.
	/// The strategy we use to figure out the sender of the transaction is to
	/// require an additional signer ([`SenderAccount`]) for the transaction.
	/// If the transaction was sent by a user wallet directly, then this may just be
	/// the wallet's pubkey. If, however, the transaction was initiated by a
	/// program, then we require this to be a PDA derived from the sender program's
	/// id and the string "sender". In this case, the sender program must also
	/// attach its program id to the instruction data. If the PDA verification
	/// succeeds (thereby proving that [[`cpi_program_id`]] indeed signed the
	/// transaction), then the program's id is attached to the VAA as the sender,
	/// otherwise the transaction is rejected.
	///
	/// Note that a program may opt to forego the PDA derivation and instead just
	/// pass on the original wallet as the wallet account (or any other signer, as
	/// long as they don't provide their program_id in the instruction data). The
	/// sender address is provided as a means for protocols to verify on the
	/// receiving end that the message was emitted by a contract they trust, so
	/// foregoing this check is not advised. If the receiving contract needs to know
	/// the sender wallet's address too, then that information can be included in
	/// the additional payload, along with any other data that the protocol needs to
	/// send across. The legitimacy of the attached data can be verified by checking
	/// that the sender contract is a trusted one.
	///
	/// Also note that attaching the correct PDA as [[`SenderAccount`]] but missing the
	/// [[`cpi_program_id`]] field will result in a successful transaction, but in
	/// that case the PDA's address will directly be encoded into the payload
	/// instead of the sender program's id.
	#[account(
	seeds = [ b"sender".as_ref()],
	bump = propeller.sender_bump,
	)]
	/// CHECK: Sender Account
	pub sender: AccountInfo<'info>,
	// pub sender: Account<'info, PropellerSender>,
	
	pub clock: Sysvar<'info, Clock>,
	
	pub rent: Sysvar<'info, Rent>,
	
	// #[account(
	// seeds = [
	// b"propeller".as_ref(),
	// b"chain_map".as_ref(),
	// &chain_id.to_le_bytes()
	// ],
	// bump = chain_map.bump,
	// )]
	// pub chain_map: Account<'info, ChainMap>
	
}

impl<'info> AddAndWormholeTransfer<'info> {
	//Note: some of the checks are excessive (checked in CPI etc) and add.rs to compute budget but since we now have access to requesting
	//  up to 1.4M compute budget per transaction, better safe than sorry to perform them.
	pub fn accounts(ctx: &Context<AddAndWormholeTransfer>) -> Result<()> {
		require_keys_eq!(
			ctx.accounts.lp_mint.key(),
			ctx.accounts.propeller.token_bridge_mint,
			PropellerError::InvalidAddAndWormholeTransferMint
		);
		let pool_state_acct = &ctx.accounts.pool_state;
		let pool: two_pool::state::PoolState<{two_pool::TOKEN_COUNT}> = two_pool::state::PoolState::try_from_slice(&pool_state_acct.data.borrow())?;
		// constraint = lp_mint.key() == propeller.token_bridge_mint @ PropellerError::InvalidMint
		msg!("finished accounts context check");
		Ok(())
	}
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PoolAddAndWormholeTransferParams {
	pub input_amounts: [u64; TOKEN_COUNT],
	pub minimum_mint_amount: u64,
	pub nonce: u32,
	pub target_chain: u16,
	pub payload: Vec<u8>
}

// #[derive(AnchorSerialize, AnchorDeserialize)]
// pub struct PoolAddParams {
// 	pub input_amounts: [u64; TOKEN_COUNT],
// 	pub minimum_mint_amount: u64
// }

pub fn handle_add_and_wormhole_transfer(
	ctx: Context<AddAndWormholeTransfer>,
	pool_add_and_wormhole_transfer_params: PoolAddAndWormholeTransferParams,
) -> Result<()> {
	msg!("add_and_wormhole_transfer");
	handle_approve(&ctx, &pool_add_and_wormhole_transfer_params)?;
	
	let mint_amount = handle_add_liquidity(&ctx, &pool_add_and_wormhole_transfer_params)?;
	msg!("finished add_liquidity. mint_amount: {}", mint_amount);
	
	handle_wormhole_token_bridge_transfer_native(
		&ctx,
		&pool_add_and_wormhole_transfer_params,
		mint_amount,
	)?;
	msg!("finished token bridge transfer native");
	
	revoke(&ctx)
}

pub fn handle_approve(
	ctx: &Context<AddAndWormholeTransfer>,
	pool_add_params: &PoolAddAndWormholeTransferParams,
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
	ctx: &Context<AddAndWormholeTransfer>,
	pool_add_params: &PoolAddAndWormholeTransferParams
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

pub fn handle_wormhole_token_bridge_transfer_native(
	ctx: &Context<AddAndWormholeTransfer>,
	pool_add_and_wormhole_transfer_params: &PoolAddAndWormholeTransferParams,
	amount: u64,
) -> Result<()> {
	msg!("add_and_wormhole_transfer");
	token::approve(
		CpiContext::new(
			ctx.accounts.token_program.to_account_info(),
			token::Approve {
				// source
				to: ctx.accounts.user_lp_token_account.to_account_info(),
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
		nonce: pool_add_and_wormhole_transfer_params.nonce,
		amount,
		//TODO: update this.
		//  this should be tryNativeToUint8Array(ethAddress, CHAIN_ID_ETH)
		//  this can either be hardcoded or set in propeller state since we're assuming this is the same for all chains.
		target_address: Pubkey::default().to_bytes(),
		// target_chain: Custodian::conductor_chain()?,
		target_chain: pool_add_and_wormhole_transfer_params.target_chain,
		payload: pool_add_and_wormhole_transfer_params.payload.clone(),
		cpi_program_id: Some(crate::ID),
	};
	
	let token_bridge_custody = &ctx.accounts.custody;
	let wh_token_transfer_acct_infos = vec![
		ctx.accounts.payer.to_account_info().clone(),
		ctx.accounts.token_bridge_config.to_account_info().clone(),
		// ctx.accounts.token_bridge.to_account_info().clone(),
		ctx.accounts.user_lp_token_account.to_account_info().clone(),
		ctx.accounts.lp_mint.to_account_info().clone(),
		token_bridge_custody.to_account_info().clone(),
		ctx.accounts.authority_signer.to_account_info().clone(),
		ctx.accounts.custody_signer.to_account_info().clone(),
		ctx.accounts.wormhole_config.to_account_info().clone(),
		// AccountMeta::new_readonly(ctx.accounts.token_bridge_config.to_account_info().clone(), false),
		ctx.accounts.wormhole_message.to_account_info().clone(),
		ctx.accounts.wormhole_emitter.to_account_info().clone(),
		ctx.accounts.wormhole_sequence.to_account_info().clone(),
		ctx.accounts.wormhole_fee_collector.to_account_info().clone(),
		// Clock::get()?.to_account_info().clone(),
		ctx.accounts.clock.to_account_info().clone(),
		//TODO: replaced with sender once that PR is merged
		ctx.accounts.sender.to_account_info().clone(),
		
		// Rent::get()?.to_account_info().clone(),
		ctx.accounts.rent.to_account_info().clone(),
		ctx.accounts.system_program.to_account_info().clone(),
		ctx.accounts.wormhole.to_account_info().clone(),
		ctx.accounts.token_program.to_account_info().clone()
	];
	
	/*
	// let mut account_info = AccountInfo::new(
	//     ^&Clock::id(),
	//     false,
	//     true,
	//     &mut lamports,
	//     &mut data,
	//     &owner,
	//     false,
	//     Epoch::default(),
	// );
	//
	// let acct_info = Clock::
	// let acct_info = Clock::to_account_info().unwrawp();
	
	// invoke(
	//     &Instruction {
	//         program_id: ctx.accounts.token_bridge.key(),
	//         accounts: vec![
	//             AccountMeta::new(ctx.accounts.payer.key(), true),
	//             AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
	//             // AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
	//             AccountMeta::new(ctx.accounts.user_lp_token_account.key(), false),
	//             AccountMeta::new(ctx.accounts.lp_mint.key(), false),
	//             AccountMeta::new(token_bridge_custody.key(), false),
	//             AccountMeta::new_readonly(ctx.accounts.authority_signer.key(), false),
	//             AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
	//             AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
	//             // AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
	//
	//             AccountMeta::new(ctx.accounts.wormhole_message.key(), true),
	//             AccountMeta::new_readonly(ctx.accounts.wormhole_emitter.key(), false),
	//             AccountMeta::new(ctx.accounts.wormhole_sequence.key(), false),
	//             AccountMeta::new(ctx.accounts.wormhole_fee_collector.key(), false),
	//             AccountMeta::new_readonly(anchor_lang::prelude::Clock::id(), false),
	//             //TODO: add.rs sender once that PR is merged
	//             AccountMeta::new_readonly(ctx.accounts.sender.key(), false),
	//
	//             AccountMeta::new_readonly(anchor_lang::prelude::Rent::id(), false),
	//             AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
	//
	//             AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
	//             AccountMeta::new_readonly(spl_token::id(), false),
	//         ],
	//         // data: (TRANSFER_NATIVE_INSTRUCTION, transfer_data).try_to_vec()?,
	//         data: (TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, transfer_with_payload_data).try_to_vec()?,
	//
	//     },
	//     // &ctx.accounts.to_account_infos(),
	//     &wh_token_transfer_acct_infos,
	// )?;
	*/
	
	invoke_signed(
		&Instruction {
			program_id: ctx.accounts.token_bridge.key(),
			accounts: vec![
				AccountMeta::new(ctx.accounts.payer.key(), true),
				AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
				// AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
				AccountMeta::new(ctx.accounts.user_lp_token_account.key(), false),
				AccountMeta::new(ctx.accounts.lp_mint.key(), false),
				AccountMeta::new(token_bridge_custody.key(), false),
				AccountMeta::new_readonly(ctx.accounts.authority_signer.key(), false),
				AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
				AccountMeta::new(ctx.accounts.wormhole_config.key(), false),
				// AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
				
				AccountMeta::new(ctx.accounts.wormhole_message.key(), true),
				AccountMeta::new_readonly(ctx.accounts.wormhole_emitter.key(), false),
				AccountMeta::new(ctx.accounts.wormhole_sequence.key(), false),
				AccountMeta::new(ctx.accounts.wormhole_fee_collector.key(), false),
				AccountMeta::new_readonly(Clock::id(), false),
				AccountMeta::new_readonly(ctx.accounts.sender.key(), true),
				
				AccountMeta::new_readonly(Rent::id(), false),
				AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
				
				AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
				AccountMeta::new_readonly(spl_token::id(), false),
			],
			// data: (TRANSFER_NATIVE_INSTRUCTION, transfer_data).try_to_vec()?,
			data: (TRANSFER_NATIVE_WITH_PAYLOAD_INSTRUCTION, transfer_with_payload_data).try_to_vec()?,
		},
		// &ctx.accounts.to_account_infos(),
		&wh_token_transfer_acct_infos,
		&[&[
			&b"sender".as_ref(),
			&[ctx.accounts.propeller.sender_bump],
		]],
	)?;
	Ok(())
}

pub fn revoke(ctx: &Context<AddAndWormholeTransfer>) -> Result<()> {
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