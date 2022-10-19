use {crate::TOKEN_COUNT, anchor_lang::prelude::*, two_pool::BorshDecimal};

pub trait Fees<'info> {
    /// Calculate the fees, including txn and rent exemptions, in lamports.
    fn calculate_fees_in_lamports(&self) -> Result<u64>;
    fn get_marginal_prices(&self) -> Result<[BorshDecimal; TOKEN_COUNT]>;
    fn convert_fees_to_swim_usd_atomic(&self, fee_in_lamports: u64) -> Result<u64>;
    fn track_and_transfer_fees(&mut self, fees_in_swim_usd: u64) -> Result<()>;
}
