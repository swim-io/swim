use std::io::{Cursor, ErrorKind, Read, Write};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_program;
use anchor_lang::solana_program::sysvar::SysvarId;
use anchor_spl::token::{Token, Mint, TokenAccount};
use byteorder::{BigEndian, ReadBytesExt, WriteBytesExt};
use primitive_types::U256;
use crate::{Address, ChainID, COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION, get_message_data, PayloadTransferWithPayload, PostedMessageData, Propeller};
use crate::error::*;


#[derive(Accounts)]
pub struct CompleteNativeWithPayload<'info> {
	#[account(
	seeds = [
		b"propeller".as_ref(),
		propeller.token_bridge_mint.as_ref(),
	],
		bump = propeller.bump,
		constraint = propeller.token_bridge_mint == mint.key() @ PropellerError::InvalidTokenBridgeMint
	)]
	pub propeller: Account<'info, Propeller>,
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
	/// contains the VAA
	/// {
	///   ...MessageData:
	///   payload: PayloadTransferWithPayload = {
	///         pub amount: U256,
	//     /// Address of the token. Left-zero-padded if shorter than 32 bytes
	//     pub token_address: Address,
	//     /// Chain ID of the token
	//     pub token_chain: ChainID,
	//     /// Address of the recipient. Left-zero-padded if shorter than 32 bytes
	//     pub to: Address,
	//     /// Chain ID of the recipient
	//     pub to_chain: ChainID,
	//     /// Sender of the transaction
	//     pub from_address: Address,
	//     /// Arbitrary payload
	//     pub payload: Vec<u8>,
	///   }
	/// }
	/// CHECK: wormhole message account. seeds = [ "PostedVAA", hash(vaa) ], seeds::program = token_bridge
	pub message: AccountInfo<'info>,
	#[account(mut)]
	/// CHECK: wormhole claim account to prevent double spending
	/// seeds = [
	///   vaa.emitter_address, vaa.emitter_chain, vaa.sequence
	///],
	/// seeds::program = token_bridge
	pub claim: AccountInfo<'info>,
	/// CHECK: wormhole endpoint account. seeds = [ vaa.emitter_chain, vaa.emitter_address ]
	pub endpoint: AccountInfo<'info>,
	/// owned by redeemer
	#[account(mut)]
	pub to: Account<'info, TokenAccount>,
	#[account(
		seeds = [ b"redeemer".as_ref()],
		bump = propeller.redeemer_bump
	)]
	/// CHECK: this used to be "to_owner".
	/// redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()
	/// will have to be signed when it invokes complete_transfer_with_payload
	/// if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to
	///     (NOT the `to` account)
	///
	pub redeemer: AccountInfo<'info>,
	#[account(mut)]

	/// this is "to_fees"
	/// TODO: type as TokenAccount?
	/// CHECK: recipient of fees for executing complete transfer (e.g. relayer)
	pub fee_recipient: AccountInfo<'info>,
	#[account(mut)]
	/// CHECK: wormhole_custody_account: seeds = [mint], seeds::program = token_bridge
	pub custody: AccountInfo<'info>,
	pub mint: Account<'info, Mint>,
	/// CHECK: custody_signer_account: seeds = [b"custody_signer"], seeds::program = token_bridge
	pub custody_signer: AccountInfo<'info>,
	
	pub rent: Sysvar<'info, Rent>,
	pub system_program: Program<'info, System>,
	
	#[account(
	  executable, address = propeller.wormhole()?,
	)]
	/// CHECK: wormhole program
	pub wormhole: AccountInfo<'info>,
	pub token_program: Program<'info, Token>,
	#[account(
	  executable, address = propeller.token_bridge()?,
	)]
	///CHECK: wormhole token bridge program
	pub token_bridge: AccountInfo<'info>,
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PostVAAData {
	// Header part
	pub version: u8,
	pub guardian_set_index: u32,
	
	// Body part
	pub timestamp: u32,
	pub nonce: u32,
	pub emitter_chain: u16,
	pub emitter_address: [u8; 32],
	pub sequence: u64,
	pub consistency_level: u8,
	pub payload: Vec<u8>,
}

impl<'info> CompleteNativeWithPayload<'info> {
	pub fn accounts(ctx: &Context<CompleteNativeWithPayload>) -> Result<()> {
		require!(Self::redeemer_check(ctx), PropellerError::UserRedeemerSignatureNotDetected);
		Ok(())
	}
	
	fn redeemer_check(ctx: &Context<CompleteNativeWithPayload>) -> bool {
		// if ctx.accounts.redeemer.address == ctx.accounts.message.payload.to_address() {
		// 	return ctx.accounts.redeemer.to_account_info().is_signer;
		// }
		true
	}
}

#[derive(AnchorSerialize, AnchorDeserialize, Default)]
pub struct CompleteNativeWithPayloadData {}

pub fn handle_complete_native_with_payload(ctx: Context<CompleteNativeWithPayload>) -> Result<()> {
	
	let wh_complete_native_with_payload_acct_infos = vec![
		ctx.accounts.payer.to_account_info().clone(),
		ctx.accounts.token_bridge_config.to_account_info().clone(),
		// ctx.accounts.token_bridge.to_account_info().clone(),
		ctx.accounts.message.to_account_info().clone(),
		ctx.accounts.claim.to_account_info().clone(),
		ctx.accounts.endpoint.to_account_info().clone(),
		ctx.accounts.to.to_account_info().clone(),
		ctx.accounts.redeemer.to_account_info().clone(),
		ctx.accounts.fee_recipient.to_account_info().clone(),
		// AccountMeta::new_readonly(ctx.accounts.token_bridge_config.to_account_info().clone(), false),
		ctx.accounts.custody.to_account_info().clone(),
		ctx.accounts.mint.to_account_info().clone(),
		ctx.accounts.custody_signer.to_account_info().clone(),
		ctx.accounts.rent.to_account_info().clone(),
		ctx.accounts.system_program.to_account_info().clone(),
		ctx.accounts.wormhole.to_account_info().clone(),
		ctx.accounts.token_program.to_account_info().clone()
	];
	
	let complete_transfer_with_payload_ix = Instruction {
		program_id: ctx.accounts.token_bridge.key(),
		// accounts: ctx.accounts.to_account_metas(None),
		accounts: vec![
			AccountMeta::new(ctx.accounts.payer.key(), true),
			AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
			AccountMeta::new_readonly(ctx.accounts.message.key(), false),
			AccountMeta::new(ctx.accounts.claim.key(), false),
			AccountMeta::new_readonly(ctx.accounts.endpoint.key(), false),
			AccountMeta::new(ctx.accounts.to.key(), false),
			AccountMeta::new_readonly(ctx.accounts.redeemer.key(), true),
			AccountMeta::new(ctx.accounts.fee_recipient.key(), false),
			AccountMeta::new(ctx.accounts.custody.key(), false),
			AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
			AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
			// Dependencies
			AccountMeta::new_readonly(Rent::id(), false),
			AccountMeta::new_readonly(system_program::id(), false),
			// Program
			AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
			AccountMeta::new_readonly(spl_token::id(), false),
		],
		data: (
			COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION,
			CompleteNativeWithPayloadData{},
		)
		.try_to_vec()?,
	};
	invoke_signed(
		&complete_transfer_with_payload_ix,
		&ctx.accounts.to_account_infos(),
		&[&[
			&b"redeemer".as_ref(),
			&[ctx.accounts.propeller.redeemer_bump],
		]],
	)?;
	msg!("successfully invoked complete_native_with_payload");
	
	let message_data = get_message_data(&ctx.accounts.message.to_account_info())?;
	msg!("message_data: {:?}", message_data);
	let message_data_payload = PayloadTransferWithPayload::deserialize(
		&mut message_data.payload.as_slice()
	)?;
	// TODO: we should probably validate that `message_data_payload.from_address` is the expected
	//  evm routing contract address unless there's a reason to allow someone else to use this method
	msg!("message_data_payload: {:?}", message_data_payload);
	// let swim_payload = SwimPayload::deserialize(&mut message_data_payload.payload.as_slice())?;
	Ok(())
}


//TODO: look into options for versioning.
//  ex - metaplex metadata versioning - (probably not. its messy).
#[derive(PartialEq, Debug, Clone)]
pub struct SwimPayload {
	pub swim_payload_version: SwimPayloadVersion,
	pub target_token_id: u16,
	pub target_token: Address,
	pub owner: Address,
	pub min_output_amount: U256,
	pub relayer_fee: U256,
	pub gas_kickstart: bool,
	
}


#[repr(u8)]
#[derive(PartialEq, Debug, Clone)]
pub enum SwimPayloadVersion {
	V0 = 0,
	V1 = 1,
}

impl AnchorDeserialize for SwimPayload {
	fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
		let mut v = Cursor::new(buf);
		//TODO: add some error handling/checking here if payload version is incorrect.
		//  https://stackoverflow.com/questions/28028854/how-do-i-match-enum-values-with-an-integer
		let swim_payload_version = v.read_u8()?;
		
		// if v.read_u8()? != 3 {
		// 	// return Err(error!(PropellerError::InvalidPayloadTypeInVaa)).into()
		// 	// return Err(ProgramError::BorshIoError("Wrong Payload Type".to_string()).into());
		// 	return Err(std::io::Error::new(
		// 		ErrorKind::InvalidInput,
		// 		"Wrong Payload Type".to_string(),
		// 	));
		// 	// return Err(PropellerError::InvalidPayloadTypeInVaa);
		// };
		
		let target_token_id = v.read_u16::<BigEndian>()?;
		let mut target_token: [u8; 32] = Address::default();
		v.read_exact(&mut target_token)?;
		
		let mut owner: [u8; 32] = Address::default();
		v.read_exact(&mut owner)?;
		
		let mut min_output_amount_data: [u8; 32] = [0; 32];
		v.read_exact(&mut min_output_amount_data)?;
		let min_output_amount = U256::from_big_endian(&min_output_amount_data);
		
		
		let mut relayer_fee_data: [u8; 32] = [0; 32];
		v.read_exact(&mut relayer_fee_data)?;
		let relayer_fee = U256::from_big_endian(&relayer_fee_data);
		
		//TODO: should we allow any non-zero value to be true or specifically 1?
		let gas_kickstart = !(v.read_u8()? == 0);
		// let amount = U256::from_big_endian(&target_token);
		
		Ok(SwimPayload {
			swim_payload_version: SwimPayloadVersion::V0,
			target_token_id,
			target_token,
			owner,
			min_output_amount,
			relayer_fee,
			gas_kickstart
		})
	}
}
//
impl AnchorSerialize for SwimPayload {
	fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
		// Payload ID
		// writer.write_u8(self.swim_payload_version)?;
		writer.write_u8(0);
		
		writer.write_u16::<BigEndian>(self.target_token_id)?;
		writer.write_all(&self.target_token)?;
		writer.write_all(&self.owner)?;
		
		let mut min_output_data: [u8; 32] = [0; 32];
		self.min_output_amount.to_big_endian(&mut min_output_data);
		writer.write_all(&min_output_data)?;
		
		let mut relayer_fee_data: [u8; 32] = [0; 32];
		self.relayer_fee.to_big_endian(&mut relayer_fee_data);
		writer.write_all(&relayer_fee_data)?;
		
		writer.write_u8(if self.gas_kickstart { 1 } else { 0 })?;
		Ok(())
	}
}