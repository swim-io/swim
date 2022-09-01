use anchor_lang::prelude::*;


#[account]
pub struct PropellerSender {
	pub bump: u8,
}

#[account]
pub struct PropellerRedeemer {
	pub bump: u8,
}