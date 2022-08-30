use crate::TOKEN_COUNT;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddParams {
	pub input_amounts: [u64; TOKEN_COUNT],
	pub minimum_mint_amount: u64
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SwapExactInputParams {
	pub exact_input_amounts: [u64; TOKEN_COUNT],
	// exact_input_amounts: u64,
	pub output_token_index: u8,
	pub minimum_output_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SwapExactOutputParams {
	// exact_input_amounts: [u64; TOKEN_COUNT],
	pub maximum_input_amount: u64,
	pub input_token_index: u8,
	pub exact_output_amounts: [u64; TOKEN_COUNT],
}