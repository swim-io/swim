use anchor_lang::prelude::*;
use anchor_lang::require_gt;
use anchor_lang::solana_program::clock::UnixTimestamp;
use crate::error::*;

pub use initialize::*;
pub use add::*;
pub use swap_exact_input::*;
pub use swap_exact_output::*;
pub use remove_uniform::*;
pub use remove_exact_burn::*;
pub use remove_exact_output::*;
pub use marginal_prices::*;
pub use governance::*;

pub mod initialize;
pub mod add;
pub mod swap_exact_input;
pub mod swap_exact_output;
pub mod remove_uniform;
pub mod remove_exact_burn;
pub mod remove_exact_output;
pub mod marginal_prices;

pub mod governance;


pub fn get_current_ts() -> Result<UnixTimestamp> {
  let current_ts = Clock::get()?.unix_timestamp;
  require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
  Ok(current_ts)
}
