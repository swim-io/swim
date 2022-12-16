use {
    crate::{constants::LAMPORTS_PER_SOL_DECIMAL, marginal_price_pool::*, FeeTracker, Propeller, PropellerError},
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
    num_traits::{FromPrimitive, ToPrimitive},
    rust_decimal::Decimal,
    switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID},
};

pub trait Fees<'info> {
    /// Calculate the fees, including txn and rent exemptions, in lamports.
    fn calculate_fees_in_lamports(&self) -> Result<u64>;
    // fn get_marginal_prices(&self) -> Result<[BorshDecimal; TOKEN_COUNT]>;
    // fn convert_fees_to_swim_usd_atomic(&self, fee_in_lamports: u64) -> Result<u64>;
    fn transfer_fees_to_vault(&mut self, fees_in_swim_usd: u64) -> Result<()>;
}

#[derive(Accounts)]
pub struct FeeTracking<'info> {
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount,
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(mut)]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
    pub fee_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub fee_tracker: Box<Account<'info, FeeTracker>>,
    pub marginal_price_pool: MarginalPricePool<'info>,
}

impl<'info> FeeTracking<'info> {
    pub fn validate(&self, propeller: &Propeller, payer: &Pubkey, program_id: &Pubkey) -> Result<()> {
        require_keys_eq!(
            self.marginal_price_pool.pool.key(),
            propeller.marginal_price_pool,
            PropellerError::InvalidMarginalPricePool
        );
        require_keys_eq!(self.fee_vault.key(), propeller.fee_vault, PropellerError::InvalidFeeVault);
        require_keys_eq!(self.aggregator.key(), propeller.aggregator, PropellerError::InvalidAggregator);
        let expected_fee_tracker = Pubkey::create_program_address(
            &[
                b"propeller".as_ref(),
                b"fee".as_ref(),
                propeller.swim_usd_mint.as_ref(),
                payer.as_ref(),
                &[self.fee_tracker.bump],
            ],
            program_id,
        )
        .map_err(|_| PropellerError::InvalidFeeTracker)?;
        require_keys_eq!(self.fee_tracker.key(), expected_fee_tracker, PropellerError::InvalidFeeTracker);
        msg!("finished fees tracking validation");
        self.marginal_price_pool.validate(propeller)
    }

    pub fn two_pool_program_key(&self) -> Pubkey {
        self.marginal_price_pool.two_pool_program.key()
    }

    pub fn track_fees(&mut self, fees_in_lamports: u64, propeller: &Propeller) -> Result<u64> {
        let fee_in_swim_usd_atomic = self.convert_fees_to_swim_usd_atomic(fees_in_lamports, propeller)?;
        self.update_fee_tracker(fee_in_swim_usd_atomic)
    }

    fn convert_fees_to_swim_usd_atomic(&self, fee_in_lamports: u64, propeller: &Propeller) -> Result<u64> {
        let intermediate_token_price_decimal: Decimal =
            self.marginal_price_pool.get_marginal_price_decimal(propeller)?;

        msg!("intermediate_token_price_decimal: {:?}", intermediate_token_price_decimal);

        let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
        msg!("fee_in_lamports(u64): {:?} fee_in_lamports_decimal: {:?}", fee_in_lamports, fee_in_lamports_decimal);

        let lamports_intermediate_token_price = self.get_lamports_intermediate_token_price(propeller)?;
        let fee_in_swim_usd_decimal = lamports_intermediate_token_price
            .checked_mul(fee_in_lamports_decimal)
            .and_then(|x| x.checked_div(intermediate_token_price_decimal))
            .ok_or(PropellerError::IntegerOverflow)?;

        // let swim_usd_decimals =
        //     get_swim_usd_mint_decimals(&swim_usd_mint_key, &self.marginal_price_pool, &marginal_price_pool_lp_mint)?;
        let swim_usd_decimals = self.marginal_price_pool.get_swim_usd_mint_decimals(propeller)?;
        msg!("swim_usd_decimals: {:?}", swim_usd_decimals);

        let ten_pow_decimals =
            Decimal::from_u64(10u64.pow(swim_usd_decimals as u32)).ok_or(PropellerError::IntegerOverflow)?;
        let fee_in_swim_usd_atomic = fee_in_swim_usd_decimal
            .checked_mul(ten_pow_decimals)
            .and_then(|v| v.to_u64())
            .ok_or(PropellerError::ConversionError)?;

        msg!(
            "fee_in_swim_usd_decimal: {:?} fee_in_swim_usd_atomic: {:?}",
            fee_in_swim_usd_decimal,
            fee_in_swim_usd_atomic
        );
        Ok(fee_in_swim_usd_atomic)
    }

    fn get_lamports_intermediate_token_price(&self, propeller: &Propeller) -> Result<Decimal> {
        let feed = self.aggregator.load()?;
        feed.check_staleness(Clock::get().unwrap().unix_timestamp, propeller.max_staleness)
            .map_err(|_| error!(PropellerError::StaleFeed))?;

        // check feed does not exceed max_confidence_interval
        // let max_confidence_interval = f64::MAX;
        // // let max_confidence_interval = propeller.max_confidence_interval;
        // feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
        //     .map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;

        let sol_usd_price: Decimal = feed.get_result()?.try_into()?;

        let lamports_usd_price =
            sol_usd_price.checked_div(LAMPORTS_PER_SOL_DECIMAL).ok_or(PropellerError::IntegerOverflow)?;
        msg!("sol_usd_price:{},lamports_usd_price: {}", sol_usd_price, lamports_usd_price);
        Ok(lamports_usd_price)
        // check whether the feed has been updated in the last 300 seconds
    }

    fn update_fee_tracker(&mut self, fees_in_swim_usd_atomic: u64) -> Result<u64> {
        let fee_tracker = &mut self.fee_tracker;
        fee_tracker.fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_swim_usd_atomic).ok_or(PropellerError::IntegerOverflow)?;
        Ok(fees_in_swim_usd_atomic)
    }
}
