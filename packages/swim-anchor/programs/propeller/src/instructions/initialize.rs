use anchor_lang::prelude::*;
use anchor_spl::associated_token::{
	AssociatedToken,
	Create,
	create
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::{
	Propeller,
	PropellerSender,
};

#[derive(Accounts)]
pub struct Initialize<'info> {
	#[account(
	init,
	payer = payer,
	seeds = [
	b"propeller".as_ref(),
	token_bridge_mint.key().as_ref(),
	],
	bump,
	space = 8 + Propeller::MAXIMUM_SIZE,
	)]
	pub propeller: Account<'info, Propeller>,
	// TODO: does this account need to be initialized?
	// #[account(
	// init,
	// payer = payer,
	// seeds = [b"sender".as_ref()],
	// bump,
	// space = 8 + Propeller::MAXIMUM_SIZE
	// )]
	// /// CHECK: propeller wormhole sender account
	// pub propeller_sender: Account<'info, PropellerSender>,
	#[account(seeds = [b"sender".as_ref()], bump)]
	/// CHECK: propeller wormhole seeder account
	pub propeller_sender: AccountInfo<'info>,
	
	#[account(seeds = [b"redeemer".as_ref()], bump)]
	/// CHECK: propeller wormhole redeemer account
	pub propeller_redeemer: AccountInfo<'info>,
	#[account(
		init,
		payer = payer,
		associated_token::mint = token_bridge_mint,
		associated_token::authority = propeller_redeemer,
	)]
	pub propeller_redeemer_escrow: Account<'info, TokenAccount>,
	pub admin: Signer<'info>,
	pub token_bridge_mint: Account<'info, Mint>,
	#[account(mut)]
	pub payer: Signer<'info>,
	pub token_program: Program<'info, Token>,
	pub associated_token_program: Program<'info, AssociatedToken>,
	pub system_program: Program<'info, System>,
	pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug)]
pub struct InitializeParams{
	pub gas_kickstart_amount: u64,
	pub relayer_fee: u64,
}

pub fn handle_initialize(
	ctx: Context<Initialize>,
	initialize_params: InitializeParams,
) -> Result<()> {
	let propeller = &mut ctx.accounts.propeller;
	propeller.nonce = 0;
	propeller.bump = *ctx.bumps.get("propeller").unwrap();
	propeller.admin = ctx.accounts.admin.key();
	propeller.wormhole = propeller.wormhole()?;
	propeller.token_bridge = propeller.token_bridge()?;
	propeller.token_bridge_mint = ctx.accounts.token_bridge_mint.key();
	
	propeller.sender_bump = *ctx.bumps.get("propeller_sender").unwrap();
	propeller.redeemer_bump = *ctx.bumps.get("propeller_redeemer").unwrap();
	
	propeller.gas_kickstart_amount = initialize_params.gas_kickstart_amount;
	propeller.relayer_fee = initialize_params.relayer_fee;
	// create(
	// 	CpiContext::new(
	// 		ctx.accounts.associated_token_program.to_account_info(),
	// 		Create {
	// 			payer: ctx.accounts.payer.to_account_info(),
	// 			associated_token: ctx.accounts.associated_token_program.to_account_info(),
	// 			authority: ctx.accounts.propeller_redeemer.to_account_info(),
	// 			mint: ctx.accounts.token_bridge_mint.to_account_info(),
	// 			system_program: ctx.accounts.system_program.to_account_info(),
	// 			token_program: ctx.accounts.token_program.to_account_info(),
	// 			rent: ctx.accounts.rent.to_account_info(),
	// 		},
	// 	)
	// )?;
	// let propeller_sender = &mut ctx.accounts.propeller_sender;
	// propeller_sender.bump = *ctx.bumps.get("propeller_sender").unwrap();
	Ok(())
}

// pub fn init_redeemer_escrow
