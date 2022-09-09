use {
    crate::{
        deserialize_message_payload, error::*, get_message_data, get_transfer_with_payload_from_message_account,
        hash_vaa, instructions::fee_tracker::FeeTracker, Address, ChainID, ClaimData, PayloadTransferWithPayload,
        PostVAAData, PostedMessageData, PostedVAAData, Propeller, COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{instruction::Instruction, program::invoke_signed, system_program, sysvar::SysvarId},
    },
    anchor_spl::token::{Mint, Token, TokenAccount},
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    num_traits::{FromPrimitive, ToPrimitive},
    primitive_types::U256,
    rust_decimal::Decimal,
    std::io::{Cursor, ErrorKind, Read, Write},
    switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID},
    two_pool::state::TwoPool,
};

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct CompleteNativeWithPayload<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.token_bridge_mint.as_ref() ],
    bump = propeller.bump,
    constraint = propeller.token_bridge_mint == mint.key() @ PropellerError::InvalidTokenBridgeMint
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    seeds = [ b"config".as_ref() ],
    bump,
    seeds::program = propeller.token_bridge().unwrap()
    )]
    /// CHECK: Token Bridge Config
    pub token_bridge_config: UncheckedAccount<'info>,
    /// contains the VAA
    /// {
    ///   ...MessageData:
    ///   payload: PayloadTransferWithPayload = {
    ///         pub amount: U256,
    //     /// Address of the token. Left-zero-padded if shorter than 32 bytes
    //     pub token_address: Address,
    //     /// Chain ID of the token
    //     pub token_chain: ChainID,
    //     /// Address of the recipient. Left-zero-padded if shorter than 32 bytes
    //     pub to: Address,
    //     /// Chain ID of the recipient
    //     pub to_chain: ChainID,
    //     /// Sender of the transaction
    //     pub from_address: Address,
    //     /// Arbitrary payload
    //     pub payload: Vec<u8>,
    ///   }
    /// }
    // #[account(
    //   mut,
    //   seeds = [
    //     b"PostedVAA".as_ref(),
    //     hash_vaa(&vaa).as_ref()
    //   ],
    //   bump,
    //   seeds::program = propeller.wormhole()?
    // )]
    #[account(mut)]
    /// CHECK: wormhole message account. seeds = [ "PostedVAA", hash(vaa) ], seeds::program = token_bridge
    pub message: UncheckedAccount<'info>,
    // pub message: Account<'info, PostedMessageData>,
    // pub message: Account<'info, PostedVAAData>,
    /// seeds = [
    ///   vaa.emitter_address, vaa.emitter_chain, vaa.sequence
    ///],
    /// seeds::program = token_bridge
    // #[account(
    //   mut,
    //   seeds = [
    //     vaa.emitter_address.as_ref(),
    //     vaa.emitter_chain.to_be_bytes().as_ref(),
    //     vaa.sequence.to_be_bytes().as_ref(),
    //   ],
    //   bump,
    //   seeds::program = propeller.wormhole()?
    // )]
    #[account(mut)]
    /// CHECK: wormhole claim account to prevent double spending
    pub claim: UncheckedAccount<'info>,

    /// CHECK: wormhole endpoint account. seeds = [ vaa.emitter_chain, vaa.emitter_address ]
    pub endpoint: UncheckedAccount<'info>,
    /// owned by redeemer. "redeemerEscrow"
    #[account(
    mut,
    token::mint = mint.key(),
    token::authority = redeemer,
    )]
    pub to: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [ b"redeemer".as_ref()],
    bump = propeller.redeemer_bump
    )]
    /// CHECK: this used to be "to_owner".
    /// redeemer will be PDA derived from ["redeemer"], seeds::program = propeller::id()
    /// will have to be signed when it invokes complete_transfer_with_payload
    /// if complete transfer with payload not meant to be handled by a contract redeemer will be the same as vaa.to
    ///     (NOT the `to` account)
    /// TODO: this is a little weird. i think we can safely assume that the `vaa.to` will be this programId
    ///    and that the `redeemer` account will be the PDA derived from ["redeemer"], seeds::program = propeller::id()
    pub redeemer: SystemAccount<'info>,

    #[account(mut, token::mint = propeller.token_bridge_mint, token::authority = payer)]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
    pub fee_recipient: Box<Account<'info, TokenAccount>>,
    // #[account(mut)]
    // /// this is "to_fees"
    // /// TODO: type as TokenAccount?
    // /// CHECK: recipient of fees for executing complete transfer (e.g. relayer)
    // pub fee_recipient: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: wormhole_custody_account: seeds = [mint], seeds::program = token_bridge
    pub custody: AccountInfo<'info>,
    pub mint: Box<Account<'info, Mint>>,
    /// CHECK: custody_signer_account: seeds = [b"custody_signer"], seeds::program = token_bridge
    pub custody_signer: AccountInfo<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,

    #[account(executable, address = propeller.wormhole()?,)]
    /// CHECK: wormhole program
    pub wormhole: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    #[account(executable, address = propeller.token_bridge()?,)]
    ///CHECK: wormhole token bridge program
    pub token_bridge: AccountInfo<'info>,

    #[account(
    init,
    payer = payer,
    seeds = [ b"propeller".as_ref(), claim.key().as_ref(), message.key().as_ref()],
    bump,
    space = 8 + PropellerMessage::LEN,
    )]
    pub propeller_message: Account<'info, PropellerMessage>,
}

impl<'info> CompleteNativeWithPayload<'info> {
    pub fn accounts(ctx: &Context<CompleteNativeWithPayload>) -> Result<()> {
        require!(Self::redeemer_check(ctx), PropellerError::UserRedeemerSignatureNotDetected);

        Ok(())
    }

    //TODO: don't need this?
    fn redeemer_check(ctx: &Context<CompleteNativeWithPayload>) -> bool {
        // if ctx.accounts.redeemer.address == ctx.accounts.message.payload.to_address() {
        // 	return ctx.accounts.redeemer.to_account_info().is_signer;
        // }
        true
    }
}

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct CompleteNativeWithPayloadPropeller<'info> {
    pub complete_native_with_payload: CompleteNativeWithPayload<'info>,

    #[account(
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    complete_native_with_payload.mint.key().as_ref(),
    complete_native_with_payload.payer.key().as_ref()
    ],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    marginal_price_pool_token_account_0.mint.as_ref(),
    marginal_price_pool_token_account_1.mint.as_ref(),
    marginal_price_pool.lp_mint_key.as_ref(),
    ],
    bump = marginal_price_pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub marginal_price_pool: Box<Account<'info, TwoPool>>,
    pub marginal_price_pool_token_account_0: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_token_account_1: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_lp_mint: Box<Account<'info, Mint>>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

impl<'info> CompleteNativeWithPayloadPropeller<'info> {
    pub fn accounts(ctx: &Context<CompleteNativeWithPayloadPropeller>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.marginal_price_pool.key(),
            ctx.accounts.complete_native_with_payload.propeller.marginal_price_pool
        );

        match ctx.accounts.complete_native_with_payload.propeller.marginal_price_pool_token_index {
            0 => {
                require_keys_eq!(
                    ctx.accounts.marginal_price_pool_token_account_0.mint,
                    ctx.accounts.complete_native_with_payload.propeller.marginal_price_pool_token_mint
                )
            }
            1 => {
                require_keys_eq!(
                    ctx.accounts.marginal_price_pool_token_account_1.mint,
                    ctx.accounts.complete_native_with_payload.propeller.marginal_price_pool_token_mint
                )
            }
            _ => return err!(PropellerError::InvalidMarginalPricePoolAccounts),
        }
        Ok(())
    }
}

pub fn handle_complete_native_with_payload_propeller(ctx: Context<CompleteNativeWithPayloadPropeller>) -> Result<()> {
    let complete_transfer_with_payload_ix = Instruction {
        program_id: ctx.accounts.complete_native_with_payload.token_bridge.key(),
        // accounts: ctx.accounts.to_account_metas(None),
        accounts: vec![
            AccountMeta::new(ctx.accounts.complete_native_with_payload.payer.key(), true),
            AccountMeta::new_readonly(ctx.accounts.complete_native_with_payload.token_bridge_config.key(), false),
            AccountMeta::new_readonly(ctx.accounts.complete_native_with_payload.message.key(), false),
            AccountMeta::new(ctx.accounts.complete_native_with_payload.claim.key(), false),
            AccountMeta::new_readonly(ctx.accounts.complete_native_with_payload.endpoint.key(), false),
            AccountMeta::new(ctx.accounts.complete_native_with_payload.to.key(), false),
            AccountMeta::new_readonly(ctx.accounts.complete_native_with_payload.redeemer.key(), true),
            AccountMeta::new(ctx.accounts.complete_native_with_payload.fee_recipient.key(), false),
            AccountMeta::new(ctx.accounts.complete_native_with_payload.custody.key(), false),
            AccountMeta::new_readonly(ctx.accounts.complete_native_with_payload.mint.key(), false),
            AccountMeta::new_readonly(ctx.accounts.complete_native_with_payload.custody_signer.key(), false),
            // Dependencies
            AccountMeta::new_readonly(Rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
            // Program
            AccountMeta::new_readonly(ctx.accounts.complete_native_with_payload.wormhole.key(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: (COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION, CompleteNativeWithPayloadData {}).try_to_vec()?,
    };
    invoke_signed(
        &complete_transfer_with_payload_ix,
        &ctx.accounts.to_account_infos(),
        &[&[&b"redeemer".as_ref(), &[ctx.accounts.complete_native_with_payload.propeller.redeemer_bump]]],
    )?;
    msg!("successfully invoked complete_native_with_payload");

    let message_account_info = &ctx.accounts.complete_native_with_payload.message.to_account_info();
    let message_data = get_message_data(message_account_info)?;
    msg!("message_data: {:?}", message_data);
    let payload_transfer_with_payload: PayloadTransferWithPayload =
        deserialize_message_payload(&mut message_data.payload.as_slice())?;
    let propeller = &ctx.accounts.complete_native_with_payload.propeller;
    msg!(
        "payload.from_address {:?} propeller.evm_routing_address {:?}",
        payload_transfer_with_payload.from_address,
        propeller.evm_routing_contract_address
    );
    require!(
        propeller.evm_routing_contract_address == payload_transfer_with_payload.from_address,
        PropellerError::InvalidRoutingContractAddress,
    );

    // let payload_transfer_with_payload =
    //     get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;

    // // TODO: we should probably validate that `message_data_payload.from_address` is the expected
    // //  evm routing contract address unless there's a reason to allow someone else to use this method
    // msg!("message_data_payload: {:?}", message_data_payload);
    // let swim_payload = SwimPayload::deserialize(&mut message_data_payload.payload.as_slice())?;
    // msg!("swim_payload: {:?}", swim_payload);
    // let posted_message =
    // let posted_vaa_data = PostedVAAData::try_deserialize(&mut *ctx.accounts.message.data.borrow())?;
    // let message = &posted_vaa_data.message;
    // msg!("messageData: {:?}", message);
    // let payload_transfer_with_payload = &message.payload;
    msg!("payload_transfer_with_payload: {:?}", payload_transfer_with_payload);
    let swim_payload = &payload_transfer_with_payload.payload;
    msg!("swim_payload: {:?}", swim_payload);
    require!(swim_payload.propeller_enabled, PropellerError::NotPropellerEnabled);
    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.complete_native_with_payload.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    msg!("claim_data: {:?}", claim_data);

    //TODO: does this have to be separated out into it's own ix?
    //    probably not - shouldn't be possible to call `completeNativeWithPayload` directly from token bridge?

    // ugly. re-doing the same calculation that WH does in `complete_transfer_payload` but
    // should not be a huge issue.
    let mut transfer_amount = payload_transfer_with_payload.amount.as_u64();
    if ctx.accounts.complete_native_with_payload.mint.decimals > 8 {
        transfer_amount *= 10u64.pow(ctx.accounts.complete_native_with_payload.mint.decimals as u32);
    }
    // Only tracking & converting fee from SOL -> swimUSD if the payer isn't the actual logical owner.
    // This is for if the propeller engine is unavailable and the user is manually calling
    // this ix. They should use the `CompleteNativeWithPayload` ix instead but adding this just in case.\
    // TODO: if swim payload owner calling though they will need a fee tracker account already.
    let swim_payload_owner = Pubkey::new_from_array(swim_payload.owner);
    if swim_payload_owner != ctx.accounts.complete_native_with_payload.payer.key() {
        let fees_in_token_bridge = calculate_and_track_fees(&ctx)?;
        transfer_amount = transfer_amount.checked_sub(fees_in_token_bridge).ok_or(PropellerError::IntegerOverflow)?;
    }

    let propeller_message = &mut ctx.accounts.complete_native_with_payload.propeller_message;
    propeller_message.bump = *ctx.bumps.get("propeller_message").unwrap();
    propeller_message.claim = ctx.accounts.complete_native_with_payload.claim.key();
    // propeller_message.claim_bump = *ctx.bumps.get("claim").unwrap();
    propeller_message.wh_message = ctx.accounts.complete_native_with_payload.message.key();
    // propeller_message.wh_message_bump = *ctx.bumps.get("message").unwrap();
    propeller_message.vaa_emitter_address = message_data.emitter_address;
    propeller_message.vaa_emitter_chain = message_data.emitter_chain;
    propeller_message.vaa_sequence = message_data.sequence;
    propeller_message.transfer_amount = transfer_amount;
    propeller_message.swim_payload_version = swim_payload.swim_payload_version;
    propeller_message.target_token_id = swim_payload.target_token_id;
    propeller_message.owner = swim_payload.owner;
    propeller_message.memo = swim_payload.memo;
    propeller_message.propeller_enabled = swim_payload.propeller_enabled;
    propeller_message.gas_kickstart = swim_payload.gas_kickstart;
    // propeller_message.swim_payload = swim_payload.clone().into();
    Ok(())
}

fn calculate_and_track_fees(ctx: &Context<CompleteNativeWithPayloadPropeller>) -> Result<u64> {
    //TODO: this is in lamports/SOL. need in swimUSD.
    // ideal implementation
    //   do oracle price lookup and transfer right away
    //   for (secp + verify) & postVAA, need to implement a fee tracking mechanism since there's no way to
    //      credit the payer during that step.
    let rent = Rent::get()?;
    let propeller_message_rent_exempt_fees = rent.minimum_balance(8 + PropellerMessage::LEN);
    let wormhole_message_rent_exempt_fees =
        rent.minimum_balance(ctx.accounts.complete_native_with_payload.message.to_account_info().data_len());
    let claim_rent_exempt_fees =
        rent.minimum_balance(ctx.accounts.complete_native_with_payload.claim.to_account_info().data_len());
    let propeller = &ctx.accounts.complete_native_with_payload.propeller;
    let complete_with_payload_fee = propeller.complete_with_payload_fee;
    let fee_in_lamports = propeller_message_rent_exempt_fees
        .checked_add(wormhole_message_rent_exempt_fees)
        .and_then(|x| x.checked_add(claim_rent_exempt_fees))
        .and_then(|x| x.checked_add(complete_with_payload_fee))
        .ok_or(PropellerError::IntegerOverflow)?;

    msg!(
        "
    {}(propeller_message_rent_exempt_fees) +
    {}(wormhole_message_rent_exempt_fees) +
    {}(claim_rent_exempt_fees) +
    {}(complete_with_payload_fee)
    = {}(fee_in_lamports)
    ",
        propeller_message_rent_exempt_fees,
        wormhole_message_rent_exempt_fees,
        claim_rent_exempt_fees,
        complete_with_payload_fee,
        fee_in_lamports
    );

    let cpi_ctx = CpiContext::new(
        ctx.accounts.two_pool_program.to_account_info(),
        two_pool::cpi::accounts::MarginalPrices {
            pool: ctx.accounts.marginal_price_pool.to_account_info(),
            pool_token_account_0: ctx.accounts.marginal_price_pool_token_account_0.to_account_info(),
            pool_token_account_1: ctx.accounts.marginal_price_pool_token_account_1.to_account_info(),
            lp_mint: ctx.accounts.marginal_price_pool_lp_mint.to_account_info(),
        },
    );
    let result = two_pool::cpi::marginal_prices(cpi_ctx)?;
    // let marginal_prices = result.get().marginal_prices;
    let marginal_prices = result.get();

    msg!("marginal_prices: {:?}", marginal_prices);
    //swimUSD is lp token of marginal price pool
    let mut res = 0u64;
    let feed = &ctx.accounts.aggregator.load()?;

    // get result
    // note - for tests this is currently hardcoded to 100
    // this val is SOL/USD price
    // 100 => 1 SOL/100 USD (usdc)
    // let v2 = feed.get_result()?.try_into()?;
    let val: Decimal = feed.get_result()?.try_into()?;
    let name = feed.name;
    msg!("val:{}, name: {:?}", val, name);
    // check whether the feed has been updated in the last 300 seconds
    feed.check_staleness(Clock::get().unwrap().unix_timestamp, 300).map_err(|_| error!(PropellerError::StaleFeed))?;
    // check feed does not exceed max_confidence_interval
    // if let Some(max_confidence_interval) = params.max_confidence_interval {
    // 	feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
    // 	.map_err(|_| error!(PropellerError::ConfidenceIntervalExceeded))?;
    // }
    // marginal_price = 0.75 USDC/swimUSD,
    // feed.val = 25.05 USDC/SOL
    // kickstart = 2 SOL
    // =>  50.1 USDC * 0.75 USDC/swimUSD = 37.575 swimUSD
    let lp_mint_key = ctx.accounts.marginal_price_pool_lp_mint.key();

    let marginal_price: Decimal = if lp_mint_key == ctx.accounts.complete_native_with_payload.mint.key() {
        marginal_prices[propeller.marginal_price_pool_token_index as usize]
            .try_into()
            .map_err(|_| error!(PropellerError::ConversionError))?
    } else {
        msg!("marginal_price_pool_lp_mint != mint");
        panic!("marginal_price_pool_lp_mint != mint not implemented yet");
        // return err!(PropellerError::Missing);
    };

    let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
    let fee_in_token_bridge_mint_decimal = marginal_price
        .checked_mul(val)
        .and_then(|v| v.checked_mul(fee_in_lamports_decimal))
        .ok_or(PropellerError::IntegerOverflow)?;
    // .checked_mul(Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::IntegerOverflow)?)
    // .ok_or(PropellerError::IntegerOverflow)?;
    let fee_in_token_bridge_mint = fee_in_token_bridge_mint_decimal.to_u64().ok_or(PropellerError::ConversionError)?;
    msg!(
        "fee_in_token_bridge_mint_decimal: {:?} fee_in_token_bridge_mint: {:?}",
        fee_in_token_bridge_mint_decimal,
        fee_in_token_bridge_mint
    );
    res = fee_in_token_bridge_mint;
    Ok(res)
}

#[derive(AnchorSerialize, AnchorDeserialize, Default)]
pub struct CompleteNativeWithPayloadData {}

/// There's nothing stopping a propellerEngine from calling this but
/// there would be no reason to since the propellerEngine would just lose out on fees.
/// A user should be allowed to call this even if swim_payload.propellerEnabled for manual takeover
/// in the event that the propellerEngine was unavailable.
pub fn handle_complete_native_with_payload(ctx: Context<CompleteNativeWithPayload>) -> Result<()> {
    let complete_transfer_with_payload_ix = Instruction {
        program_id: ctx.accounts.token_bridge.key(),
        // accounts: ctx.accounts.to_account_metas(None),
        accounts: vec![
            AccountMeta::new(ctx.accounts.payer.key(), true),
            AccountMeta::new_readonly(ctx.accounts.token_bridge_config.key(), false),
            AccountMeta::new_readonly(ctx.accounts.message.key(), false),
            AccountMeta::new(ctx.accounts.claim.key(), false),
            AccountMeta::new_readonly(ctx.accounts.endpoint.key(), false),
            AccountMeta::new(ctx.accounts.to.key(), false),
            AccountMeta::new_readonly(ctx.accounts.redeemer.key(), true),
            AccountMeta::new(ctx.accounts.fee_recipient.key(), false),
            AccountMeta::new(ctx.accounts.custody.key(), false),
            AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
            AccountMeta::new_readonly(ctx.accounts.custody_signer.key(), false),
            // Dependencies
            AccountMeta::new_readonly(Rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
            // Program
            AccountMeta::new_readonly(ctx.accounts.wormhole.key(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: (COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION, CompleteNativeWithPayloadData {}).try_to_vec()?,
    };
    invoke_signed(
        &complete_transfer_with_payload_ix,
        &ctx.accounts.to_account_infos(),
        &[&[&b"redeemer".as_ref(), &[ctx.accounts.propeller.redeemer_bump]]],
    )?;
    msg!("successfully invoked complete_native_with_payload");

    let message_account_info = &ctx.accounts.message.to_account_info();
    let message_data = get_message_data(message_account_info)?;
    msg!("message_data: {:?}", message_data);
    let payload_transfer_with_payload: PayloadTransferWithPayload =
        deserialize_message_payload(&mut message_data.payload.as_slice())?;
    let propeller = &ctx.accounts.propeller;
    msg!(
        "payload.from_address {:?} propeller.evm_routing_address {:?}",
        payload_transfer_with_payload.from_address,
        propeller.evm_routing_contract_address
    );
    require!(
        propeller.evm_routing_contract_address == payload_transfer_with_payload.from_address,
        PropellerError::InvalidRoutingContractAddress,
    );
    // let payload_transfer_with_payload =
    //     get_transfer_with_payload_from_message_account(&ctx.accounts.message.to_account_info())?;

    // // TODO: we should probably validate that `message_data_payload.from_address` is the expected
    // //  evm routing contract address unless there's a reason to allow someone else to use this method
    // msg!("message_data_payload: {:?}", message_data_payload);
    // let swim_payload = SwimPayload::deserialize(&mut message_data_payload.payload.as_slice())?;
    // msg!("swim_payload: {:?}", swim_payload);
    // let posted_message =
    // let posted_vaa_data = PostedVAAData::try_deserialize(&mut *ctx.accounts.message.data.borrow())?;
    // let message = &posted_vaa_data.message;
    // msg!("messageData: {:?}", message);
    // let payload_transfer_with_payload = &message.payload;
    msg!("payload_transfer_with_payload: {:?}", payload_transfer_with_payload);
    let swim_payload = &payload_transfer_with_payload.payload;
    msg!("swim_payload: {:?}", swim_payload);

    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    msg!("claim_data: {:?}", claim_data);

    // ugly. re-doing the same calculation that WH does in `complete_transfer_payload` but
    // should not be a huge issue.
    let mut transfer_amount = payload_transfer_with_payload.amount.as_u64();
    if ctx.accounts.mint.decimals > 8 {
        transfer_amount *= 10u64.pow(ctx.accounts.mint.decimals as u32);
    }

    let propeller_message = &mut ctx.accounts.propeller_message;

    propeller_message.bump = *ctx.bumps.get("propeller_message").unwrap();
    propeller_message.claim = ctx.accounts.claim.key();
    // propeller_message.claim_bump = *ctx.bumps.get("claim").unwrap();
    propeller_message.wh_message = ctx.accounts.message.key();
    // propeller_message.wh_message_bump = *ctx.bumps.get("message").unwrap();
    propeller_message.vaa_emitter_address = message_data.emitter_address;
    propeller_message.vaa_emitter_chain = message_data.emitter_chain;
    propeller_message.vaa_sequence = message_data.sequence;
    propeller_message.transfer_amount = transfer_amount;
    propeller_message.swim_payload_version = swim_payload.swim_payload_version;
    propeller_message.target_token_id = swim_payload.target_token_id;
    propeller_message.owner = swim_payload.owner;
    propeller_message.memo = swim_payload.memo;
    propeller_message.propeller_enabled = swim_payload.propeller_enabled;
    propeller_message.gas_kickstart = swim_payload.gas_kickstart;
    Ok(())
}

#[account]
pub struct PropellerMessage {
    pub bump: u8,
    pub wh_message: Pubkey,
    // pub wh_message_bump: u8,
    pub claim: Pubkey,
    // pub claim_bump: u8,
    pub vaa_emitter_address: [u8; 32],
    pub vaa_emitter_chain: u16,
    pub vaa_sequence: u64,
    pub transfer_amount: u64,
    // directly embedding instead of having a nested struct b/c
    // anchor doesn't know how to parse more than level deep in
    // #[account(seeds = [...])[
    pub swim_payload_version: u8,
    pub target_token_id: u16,
    pub owner: [u8; 32],
    pub memo: [u8; 16],
    pub propeller_enabled: bool,
    pub gas_kickstart: bool,
}

impl PropellerMessage {
    pub const LEN: usize = 1 +  // bump
        32 + // message
        // 1 + // message bump
        32 + // claim
        // 1 +  // claim_bump
        32 + // vaa_emitter_address
        2 +  // vaa_emitter_chain
        8 +  // vaa_sequence
        8 + // transfer_amount
        // swim_payload
        1 + //version
        2 +    // target_token_id
        32 + //owner
        16 + // memo
        1 + // propeller_enabled
        1; // gas_kickstart
           // SwimPayload::LEN; // swim_payload
}

//TODO: look into options for versioning.
//  ex - metaplex metadata versioning - (probably not. its messy).
#[derive(PartialEq, Debug, Clone)]
pub struct RawSwimPayload {
    //TOOD: should this come from propeller?
    pub swim_payload_version: u8,
    pub target_token_id: u16,
    pub owner: Address,
    // pub min_output_amount: U256,
    pub memo: [u8; 16],
    // pub target_token: Address,
    pub propeller_enabled: bool,
    // pub min_threshold: U256,
    // pub propeller_fee: U256,
    pub gas_kickstart: bool,
}

impl RawSwimPayload {
    pub const LEN: usize = 1 + //version
    2 +    // target_token_id
    32 + //owner
    // 32 + // min_output_amount
    16 + // memo
    1 + // propeller_enabled
    // 32 +   // min_threshold
    1; // gas_kickstart
}

impl From<RawSwimPayload> for SwimPayload {
    fn from(raw: RawSwimPayload) -> Self {
        SwimPayload {
            swim_payload_version: raw.swim_payload_version,
            owner: raw.owner,
            target_token_id: raw.target_token_id,
            // min_output_amount: raw.min_output_amount.as_u64(),
            memo: raw.memo,
            propeller_enabled: raw.propeller_enabled,
            // min_threshold: raw.min_threshold.as_u64(),
            // propeller_fee: raw.propeller_fee.as_u64(),
            gas_kickstart: raw.gas_kickstart,
        }
    }
}

#[derive(PartialEq, Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SwimPayload {
    //TOOD: should this come from propeller?
    pub swim_payload_version: u8,
    pub target_token_id: u16,
    pub owner: [u8; 32],
    // pub min_output_amount: u64,
    pub memo: [u8; 16],
    // pub target_token: Address,
    pub propeller_enabled: bool,
    // pub min_threshold: u64,
    // pub propeller_fee: U256,
    pub gas_kickstart: bool,
}

impl SwimPayload {
    pub const LEN: usize = 1 + //version
    2 +    // target_token_id
    32 + //owner
    // 8 + // min_output_amount
    16 + // memo
    1 + // propeller_enabled
    // 8 +   // propeller_min_threshold
    // 32 +  // propeller_fee
    1; // gas_kickstart
}

#[repr(u8)]
#[derive(PartialEq, Debug, Clone)]
pub enum SwimPayloadVersion {
    V0 = 0,
    V1 = 1,
}

impl AnchorDeserialize for RawSwimPayload {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let mut v = Cursor::new(buf);
        //TODO: add some error handling/checking here if payload version is incorrect.
        //  https://stackoverflow.com/questions/28028854/how-do-i-match-enum-values-with-an-integer
        let swim_payload_version = v.read_u8()?;

        // if v.read_u8()? != 3 {
        // 	// return Err(error!(PropellerError::InvalidPayloadTypeInVaa)).into()
        // 	// return Err(ProgramError::BorshIoError("Wrong Payload Type".to_string()).into());
        // 	return Err(std::io::Error::new(
        // 		ErrorKind::InvalidInput,
        // 		"Wrong Payload Type".to_string(),
        // 	));
        // 	// return Err(PropellerError::InvalidPayloadTypeInVaa);
        // };

        let target_token_id = v.read_u16::<BigEndian>()?;
        // let mut target_token: [u8; 32] = Address::default();
        // v.read_exact(&mut target_token)?;

        let mut owner: [u8; 32] = Address::default();
        v.read_exact(&mut owner)?;

        // let mut min_output_amount_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut min_output_amount_data)?;
        // let min_output_amount = U256::from_big_endian(&min_output_amount_data);

        let mut memo: [u8; 16] = [0; 16];
        v.read_exact(&mut memo)?;

        let propeller_enabled = !(v.read_u8()? == 0);
        // let mut min_threshold_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut min_threshold_data)?;
        // let min_threshold = U256::from_big_endian(&min_threshold_data);

        // let mut propeller_fee_data: [u8; 32] = [0; 32];
        // v.read_exact(&mut propeller_fee_data)?;
        // let propeller_fee = U256::from_big_endian(&propeller_fee_data);

        //TODO: should we allow any non-zero value to be true or specifically 1?
        let gas_kickstart = !(v.read_u8()? == 0);
        // let amount = U256::from_big_endian(&target_token);

        Ok(RawSwimPayload {
            swim_payload_version,
            target_token_id,
            // target_token,
            owner,
            // min_output_amount,
            memo,
            propeller_enabled,
            // min_threshold,
            // propeller_fee,
            gas_kickstart,
        })
    }
}
//
impl AnchorSerialize for RawSwimPayload {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // Payload ID
        // writer.write_u8(self.swim_payload_version)?;
        writer.write_u8(0)?;

        writer.write_u16::<BigEndian>(self.target_token_id)?;
        writer.write_all(&self.owner)?;

        // let mut min_output_data: [u8; 32] = [0; 32];
        // self.min_output_amount.to_big_endian(&mut min_output_data);
        // writer.write_all(&min_output_data)?;

        writer.write_all(&self.memo)?;

        writer.write_u8(if self.propeller_enabled { 1 } else { 0 })?;

        // let mut min_threshold_data: [u8; 32] = [0; 32];
        // self.min_threshold.to_big_endian(&mut min_threshold_data);
        // writer.write_all(&min_threshold_data)?;

        // let mut propeller_fee_data: [u8; 32] = [0; 32];
        // self.propeller_fee.to_big_endian(&mut propeller_fee_data);
        // writer.write_all(&propeller_fee_data)?;

        writer.write_u8(if self.gas_kickstart { 1 } else { 0 })?;
        Ok(())
    }
}
