use {
    crate::{constants::LAMPORTS_PER_SOL_DECIMAL, error::*, Propeller, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, TokenAccount},
    num_traits::{FromPrimitive, ToPrimitive},
    rust_decimal::Decimal,
    switchboard_v2::AggregatorAccountData,
    two_pool::{state::TwoPool, BorshDecimal},
};

// pub fn is_transfer_amount_sufficient(
//     propeller: &Propeller,
//     mint: &Mint,
//     propeller_enabled: bool,
//     target_chain: u16,
//     amount: u64,
// ) -> Result<()> {
//     //TODO: still need to handle the u256/u64?
//     let raw_min_threshold = match target_chain {
//         crate::constants::CHAIN_ID_ETH => propeller.propeller_eth_min_transfer_amount,
//         _ => propeller.propeller_min_transfer_amount,
//     };
//     // let raw_min_threshold = propeller.propeller_min_transfer_amount;
//     let trunc_divisor = 10u64.pow(8.max(mint.decimals as u32) - 8);
//     // Truncate to 8 decimals
//     let min_threshold: u64 = raw_min_threshold / trunc_divisor;
//     // Untruncate the amount to drop the remainder so we don't  "burn" user's funds.
//     let min_threshold_trunc: u64 = min_threshold * trunc_divisor;
//
//     msg!("amount: {}, raw_min_threshold: {}, min_threshold_trunc: {}", amount, raw_min_threshold, min_threshold_trunc);
//     // TODO: should i do the token bridge transfer amount calculation here and compare that?
//     if propeller_enabled {
//         require_gte!(amount, min_threshold_trunc, PropellerError::InsufficientAmount);
//     }
//     Ok(())
// }

pub fn get_marginal_prices<'info>(
    cpi_ctx: CpiContext<'_, '_, '_, 'info, two_pool::cpi::accounts::MarginalPrices<'info>>,
) -> Result<[BorshDecimal; TOKEN_COUNT]> {
    // let cpi_ctx = CpiContext::new(
    //     two_pool_program.to_account_info(),
    //     two_pool::cpi::accounts::MarginalPrices {
    //         pool: pool.to_account_info(),
    //         pool_token_account_0: pool_token_0_account.to_account_info(),
    //         pool_token_account_1: pool_token_1_account.to_account_info(),
    //         lp_mint: pool_lp_mint.to_account_info(),
    //     },
    // );
    let result = two_pool::cpi::marginal_prices(cpi_ctx)?;
    // let marginal_prices = result.get().marginal_prices;
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

    let token_bridge_mint_key = propeller.token_bridge_mint;
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
        get_token_bridge_mint_decimals(&token_bridge_mint_key, &marginal_price_pool, &marginal_price_pool_lp_mint)?;
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

// pub fn get_intermediate_token_price_decimal<'info>(
//     cpi_ctx: CpiContext<'_, '_, '_, 'info, two_pool::cpi::account::MarginalPrices<'info>>,
//     // marginal_pool_state: &TwoPool,
//     propeller: &Propeller,
//     // two_pool_program: &AccountInfo,
// ) -> Result<Decimal> {
//     // let cpi_ctx = CpiContext::new(
//     //     two_pool_program.clone(),
//     //     two_pool::cpi::accounts::MarginalPrices {
//     //         pool: self.pool.to_account_info(),
//     //         pool_token_account_0: self.pool_token_0_account.to_account_info(),
//     //         pool_token_account_1: self.pool_token_1_account.to_account_info(),
//     //         lp_mint: self.lp_mint.to_account_info(),
//     //     },
//     // );
//     let result = two_pool::cpi::marginal_prices(cpi_ctx)?;
//     // let marginal_prices = result.get().marginal_prices;
//     let marginal_prices = result.get();
//
//     msg!("marginal_prices: {:?}", marginal_prices);
//     // let lp_mint_key = self.lp_mint.key();
//
//     let token_bridge_mint_key = propeller.token_bridge_mint;
//     get_marginal_price_decimal(
//         &marginal_pool_state,
//         &marginal_prices,
//         &propeller,
//         &marginal_prices,
//         // &token_bridge_mint_key,
//     )
// }

pub fn get_token_bridge_mint_decimals(
    token_bridge_mint: &Pubkey,
    marginal_price_pool: &TwoPool,
    marginal_price_pool_lp_mint: &Mint,
) -> Result<u8> {
    let marginal_price_pool_lp_mint_decimals = marginal_price_pool_lp_mint.decimals;
    if *token_bridge_mint == marginal_price_pool.lp_mint_key {
        Ok(marginal_price_pool_lp_mint_decimals)
    } else if *token_bridge_mint == marginal_price_pool.token_mint_keys[0] {
        Ok(marginal_price_pool_lp_mint_decimals + marginal_price_pool.token_decimal_equalizers[0])
    } else if *token_bridge_mint == marginal_price_pool.token_mint_keys[1] {
        Ok(marginal_price_pool_lp_mint_decimals + marginal_price_pool.token_decimal_equalizers[1])
    } else {
        return err!(PropellerError::UnableToRetrieveTokenBridgeMintDecimals);
    }
}

pub fn get_marginal_price_decimal(
    marginal_price_pool: &TwoPool,
    marginal_prices: &[BorshDecimal; TOKEN_COUNT],
    propeller: &Propeller,
    marginal_price_pool_lp_mint: &Pubkey,
) -> Result<Decimal> {
    let marginal_price_pool_token_index = propeller.marginal_price_pool_token_index;
    let token_bridge_mint = &propeller.token_bridge_mint;
    let mut marginal_price: Decimal = marginal_prices[marginal_price_pool_token_index as usize]
        .try_into()
        .map_err(|_| error!(PropellerError::ConversionError))?;
    if *marginal_price_pool_lp_mint != *token_bridge_mint {
        require_keys_eq!(
            marginal_price_pool.token_mint_keys[0],
            *token_bridge_mint,
            PropellerError::InvalidMetapoolTokenMint,
        );
        let token_bridge_mint_marginal_price: Decimal =
            marginal_prices[0].try_into().map_err(|_| error!(PropellerError::ConversionError))?;
        marginal_price = marginal_price
            .checked_div(token_bridge_mint_marginal_price)
            .ok_or(error!(PropellerError::IntegerOverflow))?;
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

// pub fn validate_marginal_prices_pool_accounts(propeller: &Propeller) -> Result<()> {
//     // Note: skipping auto-derive b/c of seeds::program not working with two_pool::ID
//     // and not validating b/c passing in pool as UnchckedAccount since anchor has issue when
//     // `MarginalPricePool` is used in a composite pattern across multiple files.
//     // let marginal_price_pool_pda = Pubkey::create_program_address(
//     //     &[
//     //         b"two_pool".as_ref(),
//     //         self.pool_token_0_account.mint.as_ref(),
//     //         self.pool_token_1_account.mint.as_ref(),
//     //         self.lp_mint.key().as_ref(),
//     //         &[self.pool.bump],
//     //     ],
//     //     &two_pool::id(),
//     // )
//     // .map_err(|_| PropellerError::InvalidMarginalPricePoolAccounts)?;
//     // require_keys_eq!(marginal_price_pool_pda, self.pool.key());
//     require_keys_eq!(self.pool.key(), propeller.marginal_price_pool);
//     let pool_token_index = propeller.marginal_price_pool_token_index as usize;
//     require_gt!(TOKEN_COUNT, pool_token_index, PropellerError::InvalidMarginalPricePoolAccounts);
//     require_keys_eq!(
//         self.pool.token_mint_keys[pool_token_index],
//         // marginal_price_pool_token_account_mints[pool_token_index],
//         propeller.marginal_price_pool_token_mint,
//     );
//     Ok(())
// }

// pub fn get_token_bridge_mint_decimals(marginal_pool_state: &TwoPool, token_bridge_mint: &Pubkey) -> Result<u8> {
//     let marginal_price_pool_lp_mint = &self.lp_mint;
//     let marginal_price_pool_lp_mint_decimals = marginal_price_pool_lp_mint.decimals;
//     if *token_bridge_mint == marginal_pool_state.lp_mint_key {
//         Ok(marginal_price_pool_lp_mint_decimals)
//     } else if *token_bridge_mint == marginal_pool_state.token_mint_keys[0] {
//         Ok(marginal_price_pool_lp_mint_decimals + marginal_pool_state.token_decimal_equalizers[0])
//     } else if *token_bridge_mint == marginal_pool_state.token_mint_keys[1] {
//         Ok(marginal_price_pool_lp_mint_decimals + marginal_pool_state.token_decimal_equalizers[1])
//     } else {
//         return err!(PropellerError::UnableToRetrieveTokenBridgeMintDecimals);
//     }
// }
// pub fn get_marginal_price_decimal(
//     &self,
//     marginal_pool_state: &TwoPool,
//     propeller: &Propeller,
//     marginal_prices: &[BorshDecimal; TOKEN_COUNT],
//     token_bridge_mint_key: &Pubkey,
// ) -> Result<Decimal> {
//     let marginal_price_pool_token_index = propeller.marginal_price_pool_token_index;
//     let marginal_price_pool_lp_mint = &self.lp_mint.key();
//     let mut marginal_price: Decimal = marginal_prices[marginal_price_pool_token_index as usize]
//         .try_into()
//         .map_err(|_| error!(PropellerError::ConversionError))?;
//     if *marginal_price_pool_lp_mint != *token_bridge_mint_key {
//         require_keys_eq!(
//             marginal_pool_state.token_mint_keys[0],
//             *token_bridge_mint_key,
//             PropellerError::InvalidMetapoolTokenMint,
//         );
//         let token_bridge_mint_marginal_price: Decimal =
//             marginal_prices[0].try_into().map_err(|_| error!(PropellerError::ConversionError))?;
//         marginal_price = marginal_price
//             .checked_div(token_bridge_mint_marginal_price)
//             .ok_or(error!(PropellerError::IntegerOverflow))?;
//     }
//     Ok(marginal_price)
// }
