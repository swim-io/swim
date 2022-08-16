pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};
use {
    crate::{
        create_token_id_mapping::{PoolInstruction, TokenIdMapping},
        error::*,
        get_message_data, get_transfer_with_payload_from_message_account, hash_vaa, ClaimData,
        PayloadTransferWithPayload, PostVAAData, PostedVAAData, Propeller, SwimPayload,
        TOKEN_COUNT,
    },
    anchor_lang::prelude::*,
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount},
    },
    std::convert::TryInto,
    two_pool::state::TwoPool,
};

pub const SWIM_USD_TARGET_TOKEN_INDEX: u16 = 0;

//TODO: should i process this using the message account or the vaa data?
#[derive(Accounts)]
#[instruction(vaa: PostVAAData, target_token_id: u16)]
pub struct ProcessSwimPayload<'info> {
    #[account(
      seeds = [
        b"propeller".as_ref(),
        propeller.token_bridge_mint.as_ref(),
      ],
      bump = propeller.bump
    )]
    pub propeller: Account<'info, Propeller>,
    pub payer: Signer<'info>,

    #[account(
      seeds = [
        vaa.emitter_address.as_ref(),
        vaa.emitter_chain.to_be_bytes().as_ref(),
        vaa.sequence.to_be_bytes().as_ref(),
      ],
      bump,
      seeds::program = propeller.wormhole()?
    )]
    /// CHECK: WH Claim account
    pub claim: UncheckedAccount<'info>,
    // seeds = [ b"PostedVAA".as_ref(), hash_vaa(vaa).as_ref() ],
    #[account(
      seeds = [
        b"PostedVAA".as_ref(),
        hash_vaa(&vaa).as_ref()
      ],
      bump,
      seeds::program = propeller.wormhole()?
    )]
    /// CHECK: MessageData with Payload
    pub message: AccountInfo<'info>,
    // pub message: Account<'info, PostedVAAData>,
    #[account(
    mut,
    token::mint = token_bridge_mint.key(),
    token::authority = redeemer,
    )]
    pub to: Account<'info, TokenAccount>,
    #[account(
    seeds = [ b"redeemer".as_ref()],
    bump = propeller.redeemer_bump
    )]
    /// CHECK: this used to be "to_owner".
    /// redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()
    /// will have to be signed when it invokes complete_transfer_with_payload
    /// if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to
    ///     (NOT the `to` account)
    pub redeemer: AccountInfo<'info>,
    #[account(
      mut,
      token::authority = payer,
      token::mint = token_bridge_mint.key()
    )]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
    pub fee_recipient: Box<Account<'info, TokenAccount>>,

    pub token_bridge_mint: Box<Account<'info, Mint>>,
    /// Assuming that USD:USDC 1:1
    ///CHECK: account for getting gas -> USD price
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,
    #[account(
      seeds = [
        b"propeller".as_ref(),
        b"token_id".as_ref(),
        target_token_id.to_le_bytes().as_ref()
      ],
      bump = token_id_mapping.bump,
    )]
    pub token_id_mapping: Account<'info, TokenIdMapping>,
    /// TODO: the pool address should probably be saved in the propeller state
    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    pool_token_account_0.mint.as_ref(),
    pool_token_account_1.mint.as_ref(),
    lp_mint.key().as_ref(),
    ],
    bump = pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub pool: Box<Account<'info, TwoPool>>,
    #[account(
    mut,
    token::mint = pool.token_mint_keys[0],
    token::authority = pool,
    )]
    pub pool_token_account_0: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    token::mint = pool.token_mint_keys[1],
    token::authority = pool,
    )]
    pub pool_token_account_1: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(
    mut,
    token::mint = lp_mint
    )]
    pub governance_fee: Box<Account<'info, TokenAccount>>,

    pub user_transfer_authority: Signer<'info>,

    #[account(
    mut,
    token::mint = pool_token_account_0.mint,
    )]
    pub user_token_account_0: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    token::mint = pool_token_account_1.mint,
    )]
    pub user_token_account_1: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    token::mint = lp_mint,
    )]
    pub user_lp_token_account: Box<Account<'info, TokenAccount>>,

    // //TODO: probably need a user_transfer_auth account since either the user or propeller could be payer for txn.
    // //  payer could be the same as user_auth if user manually completing the txn but still need
    // //  to have a separate field to account for it
    // #[account(mut)]
    // pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

impl<'info> ProcessSwimPayload<'info> {
    pub fn accounts(ctx: &Context<ProcessSwimPayload>) -> Result<()> {
        Ok(())
    }
}

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

/**
  will only support remove_exact_burn in v0 since no slippage settings
  for metapool, will only support swap_exact_input since no slippage settings

  after completeNativeWithPayload, `to` tokenAccount that's owned by redeemer will contain
  the wormholed tokens.

  now we need to do the following:
  1. calculate the fees and transfer to `fee_recipient`
    a. transfer or just mark a fee state?
  2. swap the rest of the token from the `to` account into the desired result token and the owner's
  token account

  TODO:
  1. handle same as CompleteNativeWithPayload
    a. initialize a SwimClaim PDA

*/
pub fn handle_process_swim_payload(
    ctx: Context<ProcessSwimPayload>,
    // vaa: AnchorSwimPayloadVAA,
    vaa: PostVAAData,
    target_token_id: u16,
) -> Result<()> {
    // let message_data = get_message_data(&ctx.accounts.message.to_account_info())?;
    // msg!("message_data: {:?}", message_data);
    // let payload_transfer_with_payload =
    //     PayloadTransferWithPayload::deserialize(&mut message_data.payload.as_slice())?;

    let payload_transfer_with_payload =
        get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;
    msg!("message_data_payload: {:?}", payload_transfer_with_payload);

    let PayloadTransferWithPayload {
        message_type,
        amount,
        token_address,
        token_chain,
        to,
        to_chain,
        from_address,
        payload,
    } = payload_transfer_with_payload;
    // TODO: we should probably validate that `message_data_payload.from_address` is the expected
    //  evm routing contract address unless there's a reason to allow someone else to use this method
    // let swim_payload =
    //     SwimPayload::deserialize(&mut payload.as_slice())?;
    let swim_payload = payload;
    msg!("swim_payload: {:?}", swim_payload);
    require_eq!(swim_payload.target_token_id, target_token_id);
    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    require!(claim_data.claimed, PropellerError::ClaimNotClaimed);
    msg!("claim_data: {:?}", claim_data);

    let mut transfer_amount = amount.as_u64();
    if ctx.accounts.token_bridge_mint.decimals > 8 {
        transfer_amount *= 10u64.pow((ctx.accounts.token_bridge_mint.decimals - 8) as u32);
    }
    if !swim_payload.gas_kickstart {
        // transfer fees
        transfer_amount = transfer_amount - ctx.accounts.propeller.propeller_fee;
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.to.to_account_info(),
                    to: ctx.accounts.fee_recipient.to_account_info(),
                    authority: ctx.accounts.redeemer.to_account_info(),
                },
                &[&[
                    &b"redeemer".as_ref(),
                    &[ctx.accounts.propeller.redeemer_bump],
                ]],
            ),
            ctx.accounts.propeller.propeller_fee,
        )?;
    } else {
        // transfer fees + gas_kickstart
        msg!("calculate gas_kickstart amounts");
        // transfer tokens
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

        // TODO: this should probally be in the propeller
        let usdc_flagship_token_index: usize = 0;
        // 0.99 => 1 swimUSD/0.99 USDC
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
        // this val is SOL/USD price
        // 100 => 1 SOL/100 USD
        let val: u64 = feed.get_result()?.try_into()?;
        let name = feed.name;
        msg!("val:{}, name: {:?}", val, name);
        // check whether the feed has been updated in the last 300 seconds
        feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300)
            .map_err(|_| error!(PropellerError::StaleFeed))?;
        // propeller_fee = 0.5 swimUSD (approx cost of txn in swimUSD)
        // 0.99 USDC/1swimUSD * 1 SOL/100USD * 0.5 swimUSD =
        // let gas_fee=  usdc_marginal_price *

        // check feed does not exceed max_confidence_interval
        // if let Some(max_confidence_interval) = params.max_confidence_interval {
        // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
        // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
        // }
    }

    if swim_payload.target_token_id == SWIM_USD_TARGET_TOKEN_INDEX {
        // simply transfer out swimUSD to logical recipient
    } else {
        let token_id_mapping = &ctx.accounts.token_id_mapping;
        let token_pool = &token_id_mapping.pool;
        let pool_ix = &token_id_mapping.pool_ix;
        let pool_token_mint = &token_id_mapping.pool_token_mint;
        let output_token_index = token_id_mapping.pool_token_index;
        //TODO: need to handle decimals?
        let min_output_amount = swim_payload.min_output_amount.as_u64();
        match pool_ix {
            PoolInstruction::RemoveExactBurn => {
                require_keys_eq!(
                    ctx.accounts.pool.token_mint_keys[output_token_index as usize],
                    *pool_token_mint
                );
                // TODO: handle other checks
                let cpi_ctx = CpiContext::new(
                    ctx.accounts.two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::RemoveExactBurn {
                        pool: ctx.accounts.pool.to_account_info(),
                        pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
                        pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
                        lp_mint: ctx.accounts.lp_mint.to_account_info(),
                        governance_fee: ctx.accounts.governance_fee.to_account_info(),
                        user_transfer_authority: ctx
                            .accounts
                            .user_transfer_authority
                            .to_account_info(),
                        user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
                        user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
                        user_lp_token_account: ctx.accounts.user_lp_token_account.to_account_info(),
                        token_program: ctx.accounts.token_program.to_account_info(),
                    },
                );
                two_pool::cpi::remove_exact_burn(
                    cpi_ctx,
                    transfer_amount,
                    output_token_index,
                    min_output_amount,
                )?;
            }
            PoolInstruction::SwapExactInput => {
                // metapool
                let cpi_ctx = CpiContext::new(
                    ctx.accounts.two_pool_program.to_account_info(),
                    two_pool::cpi::accounts::SwapExactInput {
                        pool: ctx.accounts.pool.to_account_info(),
                        pool_token_account_0: ctx.accounts.pool_token_account_0.to_account_info(),
                        pool_token_account_1: ctx.accounts.pool_token_account_1.to_account_info(),
                        lp_mint: ctx.accounts.lp_mint.to_account_info(),
                        governance_fee: ctx.accounts.governance_fee.to_account_info(),
                        user_transfer_authority: ctx
                            .accounts
                            .user_transfer_authority
                            .to_account_info(),
                        user_token_account_0: ctx.accounts.user_token_account_0.to_account_info(),
                        user_token_account_1: ctx.accounts.user_token_account_1.to_account_info(),
                        token_program: ctx.accounts.token_program.to_account_info(),
                    },
                );
                two_pool::cpi::swap_exact_input(
                    cpi_ctx,
                    [transfer_amount, 0u64],
                    output_token_index,
                    min_output_amount,
                )?;
            }
        };
    }

    // get target_token_id -> (pool, pool_token_index)
    //    need to know when to do remove_exact_burn & when to do swap_exact_input

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
fn get_marginal_prices(ctx: &Context<ProcessSwimPayload>) -> Result<[u64; TOKEN_COUNT]> {
    //TODO: check return data type
    Ok([1u64; TOKEN_COUNT])
}

fn get_gas_price(ctx: Context<ProcessSwimPayload>) -> Result<u64> {
    Ok(1)
}

/// This is "raw" VAA directly from guardian network
/// probably not needed.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AnchorSwimPayloadVAA {
    // Header part
    pub version: u8,
    pub guardian_set_index: u32,
    pub signatures: Vec<AnchorVAASignature>,
    // Body part
    pub timestamp: u32,
    pub nonce: u32,
    pub emitter_chain: u16,
    // pub emitter_address: ForeignAddress,
    pub emitter_address: [u8; 32],
    pub sequence: u64,
    pub consistency_level: u8,
    pub payload: Vec<u8>,
    // pub payload: PayloadTransferWithPayload,
}

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone)]
pub struct AnchorVAASignature {
    pub signature: Vec<u8>,
    pub guardian_index: u8,
}
