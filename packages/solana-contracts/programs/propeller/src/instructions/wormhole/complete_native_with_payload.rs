use {
    crate::{
        deserialize_message_payload, error::*, get_message_data, get_transfer_with_payload_from_message_account,
        hash_vaa, instructions::fee_tracker::FeeTracker, state::PropellerMessage,
        validate_marginal_prices_pool_accounts, Address, ChainID, ClaimData, PayloadTransferWithPayload, PostVAAData,
        PostedMessageData, PostedVAAData, Propeller, TokenBridge, Wormhole, COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{instruction::Instruction, program::invoke_signed, system_program, sysvar::SysvarId},
    },
    anchor_spl::{
        token,
        token::{Mint, Token, TokenAccount, Transfer},
    },
    byteorder::{BigEndian, ReadBytesExt, WriteBytesExt},
    num_traits::{FromPrimitive, ToPrimitive},
    primitive_types::U256,
    rust_decimal::Decimal,
    solana_program::program::invoke,
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

    //TODO: should this just always be fee_vault?
    // not actually being used unless this is a propellerEnabled ix.
    // wormhole complete_native_with_payload doesn't do anything with this
    // the only thing it does is check that the mint is correct.
    // note: we only care that this is actually the fee_vault if it's called from propellerCompleteNativeWithPayload
    //  so the checks are done there.
    #[account(
        mut,
        token::mint = propeller.token_bridge_mint,
    )]
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

    pub wormhole: Program<'info, Wormhole>,
    pub token_program: Program<'info, Token>,
    pub token_bridge: Program<'info, TokenBridge>,

    #[account(
    init,
    payer = payer,
    seeds = [ b"propeller".as_ref(), claim.key().as_ref(), message.key().as_ref()],
    bump,
    space = 8 + PropellerMessage::LEN,
    )]
    pub propeller_message: Account<'info, PropellerMessage>,
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
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
    //TODO: do we want this check?
    // require!(
    //     propeller.evm_routing_contract_address == payload_transfer_with_payload.from_address,
    //     PropellerError::InvalidRoutingContractAddress,
    // );
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
    propeller_message.owner = Pubkey::new_from_array(swim_payload.owner);
    propeller_message.memo = swim_payload.memo;
    propeller_message.propeller_enabled = swim_payload.propeller_enabled;
    propeller_message.gas_kickstart = swim_payload.gas_kickstart;

    let memo = propeller_message.memo;
    // get target_token_id -> (pool, pool_token_index)
    //    need to know when to do remove_exact_burn & when to do swap_exact_input
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;

    Ok(())
}

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct PropellerCompleteNativeWithPayload<'info> {
    pub complete_native_with_payload: CompleteNativeWithPayload<'info>,

    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    complete_native_with_payload.mint.key().as_ref(),
    complete_native_with_payload.payer.key().as_ref()
    ],
    bump = fee_tracker.bump
    )]
    pub fee_tracker: Account<'info, FeeTracker>,

    // #[account(
    // mut,
    // token::mint = complete_native_with_payload.mint,
    // token::authority = complete_native_with_payload.propeller,
    // address = complete_native_with_payload.propeller.fee_vault,
    // )]
    // pub fee_vault: Box<Account<'info, TokenAccount>>,
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ PropellerError::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(
    mut,
    seeds = [
    b"two_pool".as_ref(),
    marginal_price_pool_token_0_account.mint.as_ref(),
    marginal_price_pool_token_1_account.mint.as_ref(),
    marginal_price_pool_lp_mint.key().as_ref(),
    ],
    bump = marginal_price_pool.bump,
    seeds::program = two_pool_program.key()
    )]
    pub marginal_price_pool: Box<Account<'info, TwoPool>>,
    pub marginal_price_pool_token_0_account: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_token_1_account: Box<Account<'info, TokenAccount>>,
    pub marginal_price_pool_lp_mint: Box<Account<'info, Mint>>,
    pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
}

impl<'info> PropellerCompleteNativeWithPayload<'info> {
    pub fn accounts(ctx: &Context<PropellerCompleteNativeWithPayload>) -> Result<()> {
        validate_marginal_prices_pool_accounts(
            &ctx.accounts.complete_native_with_payload.propeller,
            &ctx.accounts.marginal_price_pool.key(),
            &[
                ctx.accounts.marginal_price_pool_token_0_account.mint,
                ctx.accounts.marginal_price_pool_token_1_account.mint,
            ],
        )?;
        require_keys_eq!(
            ctx.accounts.complete_native_with_payload.fee_recipient.key(),
            ctx.accounts.complete_native_with_payload.propeller.fee_vault
        );
        require_keys_eq!(
            ctx.accounts.complete_native_with_payload.fee_recipient.owner,
            ctx.accounts.complete_native_with_payload.propeller.key()
        );
        Ok(())
    }
}

pub fn handle_propeller_complete_native_with_payload(ctx: Context<PropellerCompleteNativeWithPayload>) -> Result<()> {
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
    // require!(
    //     propeller.evm_routing_contract_address == payload_transfer_with_payload.from_address,
    //     PropellerError::InvalidRoutingContractAddress,
    // );

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
    msg!("transfer_amount(swimUSD): {:?}", transfer_amount);
    msg!("redeemer escrow balance before reload: {:?}", ctx.accounts.complete_native_with_payload.to.amount);
    ctx.accounts.complete_native_with_payload.to.reload()?;
    msg!("redeemer escrow balance after reload: {:?}", ctx.accounts.complete_native_with_payload.to.amount);
    // Only tracking & converting fee from SOL -> swimUSD if the payer isn't the actual logical owner.
    // This is for if the propeller engine is unavailable and the user is manually calling
    // this ix. They should use the `CompleteNativeWithPayload` ix instead but adding this just in case.\
    // TODO: if swim payload owner calling though they will need a fee tracker account already.
    let swim_payload_owner = Pubkey::new_from_array(swim_payload.owner);
    let token_program = &ctx.accounts.complete_native_with_payload.token_program;
    if swim_payload_owner != ctx.accounts.complete_native_with_payload.payer.key() {
        let fees_in_token_bridge = calculate_fees(&ctx)?;
        let fee_tracker = &mut ctx.accounts.fee_tracker;
        let updated_fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_token_bridge).ok_or(PropellerError::IntegerOverflow)?;
        fee_tracker.fees_owed = updated_fees_owed;

        let cpi_accounts = Transfer {
            from: ctx.accounts.complete_native_with_payload.to.to_account_info(),
            to: ctx.accounts.complete_native_with_payload.fee_recipient.to_account_info(),
            authority: ctx.accounts.complete_native_with_payload.redeemer.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                cpi_accounts,
                &[&[&b"redeemer".as_ref(), &[ctx.accounts.complete_native_with_payload.propeller.redeemer_bump]]],
            ),
            fees_in_token_bridge,
        )?;
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
    propeller_message.owner = swim_payload_owner;
    propeller_message.memo = swim_payload.memo;
    propeller_message.propeller_enabled = swim_payload.propeller_enabled;
    propeller_message.gas_kickstart = swim_payload.gas_kickstart;
    let memo = propeller_message.memo;
    let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    invoke(&memo_ix, &[ctx.accounts.complete_native_with_payload.memo.to_account_info()])?;
    Ok(())
}

fn calculate_fees(ctx: &Context<PropellerCompleteNativeWithPayload>) -> Result<u64> {
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
    let total_rent_exemption_in_lamports = propeller_message_rent_exempt_fees
        .checked_add(wormhole_message_rent_exempt_fees)
        .and_then(|x| x.checked_add(claim_rent_exempt_fees))
        .ok_or(PropellerError::IntegerOverflow)?;
    msg!(
        "
    {}(propeller_message_rent_exempt_fees) +
    {}(wormhole_message_rent_exempt_fees) +
    {}(claim_rent_exempt_fees) +
    = {}(total_rent_exemption_in_lamports)
    ",
        propeller_message_rent_exempt_fees,
        wormhole_message_rent_exempt_fees,
        claim_rent_exempt_fees,
        total_rent_exemption_in_lamports
    );
    let fee_in_lamports = total_rent_exemption_in_lamports
        .checked_add(complete_with_payload_fee)
        .ok_or(PropellerError::IntegerOverflow)?;

    msg!(
        "
    {}(total_rent_exemption_in_lamports)
    {}(complete_with_payload_fee)
    = {}(fee_in_lamports)
    ",
        total_rent_exemption_in_lamports,
        complete_with_payload_fee,
        fee_in_lamports
    );

    let cpi_ctx = CpiContext::new(
        ctx.accounts.two_pool_program.to_account_info(),
        two_pool::cpi::accounts::MarginalPrices {
            pool: ctx.accounts.marginal_price_pool.to_account_info(),
            pool_token_account_0: ctx.accounts.marginal_price_pool_token_0_account.to_account_info(),
            pool_token_account_1: ctx.accounts.marginal_price_pool_token_1_account.to_account_info(),
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
    let sol_usd_price: Decimal = feed.get_result()?.try_into()?;
    let name = feed.name;

    let lamports_decimal = Decimal::from_u64(1_000_000_000).unwrap();
    let lamports_usd_price = sol_usd_price.checked_div(lamports_decimal).ok_or(PropellerError::IntegerOverflow)?;
    msg!("sol_usd_price:{},lamports_usd_price: {}", sol_usd_price, lamports_usd_price);
    // check whether the feed has been updated in the last 300 seconds
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
    msg!("marginal_price: {}", marginal_price);
    let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
    msg!("fee_in_lamports(u64): {:?} fee_in_lamports_decimal: {:?}", fee_in_lamports, fee_in_lamports_decimal);
    let fee_in_token_bridge_mint_decimal = marginal_price
        .checked_mul(lamports_usd_price)
        .and_then(|v| v.checked_mul(fee_in_lamports_decimal))
        .ok_or(PropellerError::IntegerOverflow)?;
    // .checked_mul(Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::IntegerOverflow)?)
    // .ok_or(PropellerError::IntegerOverflow)?;
    let lp_mint_decimals_decimal =
        Decimal::from_u64(10u64.pow(ctx.accounts.complete_native_with_payload.mint.decimals as u32)).unwrap();
    let fee_in_token_bridge_mint = fee_in_token_bridge_mint_decimal
        .checked_mul(lp_mint_decimals_decimal)
        .and_then(|v| v.to_u64())
        .ok_or(PropellerError::ConversionError)?;
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
