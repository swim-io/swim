use anchor_lang::prelude::*;
use crate::TOKEN_COUNT;

/* Optimized versions of the params where some things are assumed */

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PropellerSwapExactInputParams {
	pub exact_input_amount: u64,
	// pub output_token_index: u8,
	pub minimum_output_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PropellerSwapExactOutputParams {
	// exact_input_amounts: [u64; TOKEN_COUNT],
	pub maximum_input_amount: u64,
	// pub input_token_index: u8,
	pub exact_output_amounts: [u64; TOKEN_COUNT],
}