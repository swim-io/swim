use {
    crate::{constants::LAMPORTS_PER_SOL_DECIMAL, error::*, Propeller, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, TokenAccount},
    num_traits::{FromPrimitive, ToPrimitive},
    rust_decimal::Decimal,
    switchboard_v2::AggregatorAccountData,
    two_pool::{state::TwoPool, BorshDecimal},
};

pub fn get_marginal_prices<'info>(
    cpi_ctx: CpiContext<'_, '_, '_, 'info, two_pool::cpi::accounts::MarginalPrices<'info>>,
) -> Result<[BorshDecimal; TOKEN_COUNT]> {
    let result = two_pool::cpi::marginal_prices(cpi_ctx)?;
    Ok(result.get())
}

pub fn convert_fees_to_swim_usd_atomic<'info>(
    fee_in_lamports: u64,
    propeller: &Propeller,
    marginal_price_pool_lp_mint: &Account<'info, Mint>,
    cpi_ctx: CpiContext<'_, '_, '_, 'info, two_pool::cpi::accounts::MarginalPrices<'info>>,
    marginal_price_pool: &TwoPool,
    aggregator: &AccountLoader<AggregatorAccountData>,
    max_staleness: i64,
) -> Result<u64> {
    // let propeller = &self.propeller;

    msg!("fee_in_lamports: {:?}", fee_in_lamports);
    let marginal_price_pool_lp_mint = &marginal_price_pool_lp_mint;

    let swim_usd_mint_key = propeller.swim_usd_mint;
    let marginal_prices = get_marginal_prices(cpi_ctx)?;

    let intermediate_token_price_decimal: Decimal = get_marginal_price_decimal(
        &marginal_price_pool,
        &marginal_prices,
        &propeller,
        &marginal_price_pool_lp_mint.key(),
    )?;

    msg!("intermediate_token_price_decimal: {:?}", intermediate_token_price_decimal);

    let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
    msg!("fee_in_lamports(u64): {:?} fee_in_lamports_decimal: {:?}", fee_in_lamports, fee_in_lamports_decimal);

    let mut res = 0u64;

    let lamports_intermediate_token_price = get_lamports_intermediate_token_price(&aggregator, max_staleness)?;
    let fee_in_swim_usd_decimal = lamports_intermediate_token_price
        .checked_mul(fee_in_lamports_decimal)
        .and_then(|x| x.checked_div(intermediate_token_price_decimal))
        .ok_or(PropellerError::IntegerOverflow)?;

    let swim_usd_decimals =
        get_swim_usd_mint_decimals(&swim_usd_mint_key, &marginal_price_pool, &marginal_price_pool_lp_mint)?;
    msg!("swim_usd_decimals: {:?}", swim_usd_decimals);

    let ten_pow_decimals =
        Decimal::from_u64(10u64.pow(swim_usd_decimals as u32)).ok_or(PropellerError::IntegerOverflow)?;
    let fee_in_swim_usd_atomic = fee_in_swim_usd_decimal
        .checked_mul(ten_pow_decimals)
        .and_then(|v| v.to_u64())
        .ok_or(PropellerError::ConversionError)?;

    msg!("fee_in_swim_usd_decimal: {:?} fee_in_swim_usd_atomic: {:?}", fee_in_swim_usd_decimal, fee_in_swim_usd_atomic);
    res = fee_in_swim_usd_atomic;
    Ok(res)
}

pub fn get_swim_usd_mint_decimals(
    swim_usd_mint: &Pubkey,
    marginal_price_pool: &TwoPool,
    marginal_price_pool_lp_mint: &Mint,
) -> Result<u8> {
    let marginal_price_pool_lp_mint_decimals = marginal_price_pool_lp_mint.decimals;
    if *swim_usd_mint == marginal_price_pool.lp_mint_key {
        Ok(marginal_price_pool_lp_mint_decimals)
    } else if *swim_usd_mint == marginal_price_pool.token_mint_keys[0] {
        Ok(marginal_price_pool_lp_mint_decimals + marginal_price_pool.token_decimal_equalizers[0])
    } else if *swim_usd_mint == marginal_price_pool.token_mint_keys[1] {
        Ok(marginal_price_pool_lp_mint_decimals + marginal_price_pool.token_decimal_equalizers[1])
    } else {
        return err!(PropellerError::UnableToRetrieveSwimUsdMintDecimals);
    }
}

pub fn get_marginal_price_decimal(
    marginal_price_pool: &TwoPool,
    marginal_prices: &[BorshDecimal; TOKEN_COUNT],
    propeller: &Propeller,
    marginal_price_pool_lp_mint: &Pubkey,
) -> Result<Decimal> {
    let marginal_price_pool_token_index = propeller.marginal_price_pool_token_index;
    let swim_usd_mint = &propeller.swim_usd_mint;
    let mut marginal_price: Decimal = marginal_prices[marginal_price_pool_token_index as usize]
        .try_into()
        .map_err(|_| error!(PropellerError::ConversionError))?;
    if *marginal_price_pool_lp_mint != *swim_usd_mint {
        require_keys_eq!(
            marginal_price_pool.token_mint_keys[0],
            *swim_usd_mint,
            PropellerError::InvalidMetapoolTokenMint,
        );
        let swim_usd_marginal_price: Decimal =
            marginal_prices[0].try_into().map_err(|_| error!(PropellerError::ConversionError))?;
        marginal_price =
            marginal_price.checked_div(swim_usd_marginal_price).ok_or(error!(PropellerError::IntegerOverflow))?;
    }
    Ok(marginal_price)
}

pub fn get_lamports_intermediate_token_price(
    aggregator: &AccountLoader<AggregatorAccountData>,
    max_staleness: i64,
) -> Result<Decimal> {
    let feed = aggregator.load()?;
    feed.check_staleness(
        Clock::get().unwrap().unix_timestamp,
        // 300
        i64::MAX,
    )
    .map_err(|_| error!(PropellerError::StaleFeed))?;

    // check feed does not exceed max_confidence_interval
    // if let Some(max_confidence_interval) = params.max_confidence_interval {
    // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
    // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
    // }

    let sol_usd_price: Decimal = feed.get_result()?.try_into()?;
    let name = feed.name;

    let lamports_usd_price =
        sol_usd_price.checked_div(LAMPORTS_PER_SOL_DECIMAL).ok_or(PropellerError::IntegerOverflow)?;
    msg!("sol_usd_price:{},lamports_usd_price: {}", sol_usd_price, lamports_usd_price);
    Ok(lamports_usd_price)
    // check whether the feed has been updated in the last 300 seconds
}
