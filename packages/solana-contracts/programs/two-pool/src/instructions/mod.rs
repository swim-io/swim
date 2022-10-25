use {
    crate::error::*,
    anchor_lang::{prelude::*, require_gt, solana_program::clock::UnixTimestamp},
};
pub use {defi::*, governance::*, initialize::*, marginal_prices::*};

pub mod initialize;
pub mod marginal_prices;

pub mod defi;
pub mod governance;

pub fn get_current_ts() -> Result<UnixTimestamp> {
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    Ok(current_ts)
}
