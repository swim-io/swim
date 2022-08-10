pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::{error::*, Propeller, TOKEN_COUNT},
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
    std::convert::TryInto,
};

#[derive(Accounts)]
pub struct CompleteToUser<'info> {
    #[account(
	seeds = [
		b"propeller".as_ref(),
		propeller.token_bridge_mint.as_ref(),
	],
	bump = propeller.bump
	)]
    pub propeller: Account<'info, Propeller>,
    pub payer: Signer<'info>,
    /// CHECK: MessageData with Payload
    pub message: AccountInfo<'info>,
    /// this is "to_fees"
    /// CHECK: recipient of fees for executing complete transfer (e.g. relayer)
    pub fee_recipient: AccountInfo<'info>,

    /// CHECK: pool state of flagship pool for checking token account
    pub pool: AccountInfo<'info>,
    pub pool_token_account_0: Account<'info, TokenAccount>,
    pub pool_token_account_1: Account<'info, TokenAccount>,
    /// CHECK: Pool program account
    pub pool_program: AccountInfo<'info>,
    /// Assuming that USD:USDC 1:1
    ///CHECK: account for getting gas -> USD price
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,
}

impl<'info> CompleteToUser<'info> {
    pub fn accounts(ctx: &Context<CompleteToUser>) -> Result<()> {
        Ok(())
    }
}
//
// pub fn handle_complete_to_user<'a, 'b, 'c, 'info>(
//     ctx: Context<'a, 'b, 'c, 'info, CompleteToUser<'info>>,
// ) -> Result<()>
// where
//     'b: 'info,
// {
//     //
//     // 1. check how much the fees should be
//     //      a. swimUSD -> SOL exchange rate
//     //          - swimUSD -> stablecoin (usdt or usdc)
//     //              - using pool.get_marginal_prices_ix()
//     //                  - only need to pass flagship pool state account,
//     //                      pool token accounts & pool program account (4 total)
//     //          - stablecoin -> SOL
//     //              - using pyth/oracle
//     //      b. fees = swimUSD * exchange rate
//     // 2. swap remainder based on swim payload parameters
//     //      a. either swap/removeLiquidity - only one output token regardless even if removeLiquidity
//     // 2. transfer fee to fee_recipient
//     let marginal_prices = get_marginal_prices(&ctx)?;
//     let usdc_flagship_token_index: usize = 1;
//     let usdc_marginal_price = marginal_prices[usdc_flagship_token_index];
//     let aggregator = &ctx.accounts.aggregator;
//
//     // check feed owner
//     let owner = *aggregator.owner;
//     if owner != SWITCHBOARD_V2_DEVNET && owner != SWITCHBOARD_V2_MAINNET {
//         return Err(error!(PropellerError::InvalidSwitchboardAccount));
//     }
//
//     // load and deserialize feed
//     let feed = AggregatorAccountData::new(aggregator)?;
//
//     // get result
//     // note - for tests this is currently hardcoded to 100
//     let val: u64 = feed.get_result()?.try_into()?;
//     let name = feed.name;
//     msg!("val:{}, name: {:?}", val, name);
//     // check whether the feed has been updated in the last 300 seconds
//     feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300)
//         .map_err(|_| error!(PropellerError::StaleFeed))?;
//
//     // check feed does not exceed max_confidence_interval
//     // if let Some(max_confidence_interval) = params.max_confidence_interval {
//     // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
//     // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
//     // }
//
//     Ok(())
// }
pub fn handle_complete_to_user(ctx: Context<CompleteToUser>) -> Result<()> {
    //
    // 1. check how much the fees should be
    //      a. swimUSD -> SOL exchange rate
    //          - swimUSD -> stablecoin (usdt or usdc)
    //              - using pool.get_marginal_prices_ix()
    //                  - only need to pass flagship pool state account,
    //                      pool token accounts & pool program account (4 total)
    //          - stablecoin -> SOL
    //              - using pyth/oracle
    //      b. fees = swimUSD * exchange rate
    // 2. swap remainder based on swim payload parameters
    //      a. either swap/removeLiquidity - only one output token regardless even if removeLiquidity
    // 2. transfer fee to fee_recipient
    let marginal_prices = get_marginal_prices(&ctx)?;
    let usdc_flagship_token_index: usize = 1;
    let usdc_marginal_price = marginal_prices[usdc_flagship_token_index];
    // let aggregator = &ctx.accounts.aggregator;
    //
    // // check feed owner
    // let owner = *aggregator.owner;
    // if owner != SWITCHBOARD_V2_DEVNET && owner != SWITCHBOARD_V2_MAINNET {
    //     return Err(error!(PropellerError::InvalidSwitchboardAccount));
    // }
    //
    // // load and deserialize feed
    // let feed = AggregatorAccountData::new(aggregator)?;

    let feed = &ctx.accounts.aggregator.load()?;

    // get result
    // note - for tests this is currently hardcoded to 100
    let val: u64 = feed.get_result()?.try_into()?;
    let name = feed.name;
    msg!("val:{}, name: {:?}", val, name);
    // check whether the feed has been updated in the last 300 seconds
    feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300)
        .map_err(|_| error!(PropellerError::StaleFeed))?;

    // check feed does not exceed max_confidence_interval
    // if let Some(max_confidence_interval) = params.max_confidence_interval {
    // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
    // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
    // }

    Ok(())
}

/*

https://github.com/swim-io/swim/blob/025bf65905c15ea9fc1b69c32e6a8ba67862c707/packages/pool-math/src/poolMath.ts#L359
  marginalPrices(): readonly Decimal[] {
    const reciprocalDecay = arrayProd(
      this.balances.map((balance: Decimal) =>
        this._depth.div(balance.mul(this.tokenCount)),
      ),
    );
    const denominator = this.ampFactor
      .sub(1)
      .add(reciprocalDecay.mul(this.tokenCount + 1));
    return arrayCreate(this.tokenCount, (i) =>
      this.ampFactor
        .add(this._depth.mul(reciprocalDecay).div(this.balances[i]))
        .div(denominator),
    );
  }

 */
fn get_marginal_prices(ctx: &Context<CompleteToUser>) -> Result<[u64; TOKEN_COUNT]> {
    //TODO: check return data type
    Ok([1u64; TOKEN_COUNT])
}

fn get_gas_price(ctx: Context<CompleteToUser>) -> Result<u64> {
    Ok(1)
}
