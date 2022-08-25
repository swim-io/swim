use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::{
  error::*,
  Propeller
};

pub fn is_transfer_amount_sufficient(propeller: &Propeller, mint: &Mint, propeller_enabled: bool, target_chain: u16, amount: u64) -> Result<()> {
  //TODO: still need to handle the u256/u64?
  let raw_min_threshold = match target_chain {
    crate::constants::CHAIN_ID_ETH => propeller.propeller_eth_min_transfer_amount,
    _ => propeller.propeller_min_transfer_amount,
  };
  // let raw_min_threshold = propeller.propeller_min_transfer_amount;
  let trunc_divisor = 10u64.pow(8.max(mint.decimals as u32) - 8);
  // Truncate to 8 decimals
  let min_threshold: u64 = raw_min_threshold / trunc_divisor;
  // Untruncate the amount to drop the remainder so we don't  "burn" user's funds.
  let min_threshold_trunc: u64 = min_threshold * trunc_divisor;

  msg!(
        "amount: {}, raw_min_threshold: {}, min_threshold_trunc: {}",
        amount,
        raw_min_threshold,
        min_threshold_trunc
    );
  // TODO: should i do the token bridge transfer amount calculation here and compare that?
  if propeller_enabled {
    require_gte!(amount, min_threshold_trunc, PropellerError::InsufficientAmount);
  }
  Ok(())
}
