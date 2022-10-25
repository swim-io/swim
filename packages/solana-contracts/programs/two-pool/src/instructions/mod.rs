use {
    crate::error::*,
    anchor_lang::{prelude::*, require_gt, solana_program::clock::UnixTimestamp},
};
pub use {
    add::*, defi::*, governance::*, initialize::*, marginal_prices::*, remove_exact_burn::*, remove_exact_output::*,
    remove_uniform::*, swap_exact_input::*, swap_exact_output::*,
};

pub mod add;
pub mod initialize;
pub mod marginal_prices;
pub mod remove_exact_burn;
pub mod remove_exact_output;
pub mod remove_uniform;
pub mod swap_exact_input;
pub mod swap_exact_output;

pub mod defi;
pub mod governance;

pub fn get_current_ts() -> Result<UnixTimestamp> {
    let current_ts = Clock::get()?.unix_timestamp;
    require_gt!(current_ts, 0i64, PoolError::InvalidTimestamp);
    Ok(current_ts)
}
