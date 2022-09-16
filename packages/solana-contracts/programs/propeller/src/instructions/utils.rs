use {
    crate::{error::*, Propeller, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, TokenAccount},
    rust_decimal::Decimal,
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
    marginal_price_pool_token_index: usize,
    marginal_price_pool_lp_mint: &Pubkey,
    token_bridge_mint_key: &Pubkey,
) -> Result<Decimal> {
    let mut marginal_price: Decimal = marginal_prices[marginal_price_pool_token_index as usize]
        .try_into()
        .map_err(|_| error!(PropellerError::ConversionError))?;
    if *marginal_price_pool_lp_mint != *token_bridge_mint_key {
        require_keys_eq!(
            marginal_price_pool.token_mint_keys[0],
            *token_bridge_mint_key,
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
