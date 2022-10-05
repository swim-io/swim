use {crate::TOKEN_COUNT, anchor_lang::prelude::*, two_pool::BorshDecimal};

pub trait Fees {
    fn calculate_fees_in_lamports(&self) -> Result<u64>;
    fn convert_fees_to_swim_usd_atomic(
        &self,
        fee_in_lamports: u64,
        marginal_prices: [BorshDecimal; TOKEN_COUNT],
        max_staleness: i64,
    ) -> Result<u64>;
    fn track_and_transfer_fees(&mut self, fees_in_swim_usd: u64) -> Result<()>;
}
