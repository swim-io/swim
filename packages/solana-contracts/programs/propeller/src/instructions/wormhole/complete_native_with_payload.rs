use {
    crate::{
        constants::LAMPORTS_PER_SOL_DECIMAL, deserialize_message_payload, error::*,
        get_lamports_intermediate_token_price, get_marginal_price_decimal, get_marginal_prices, get_message_data,
        get_swim_usd_mint_decimals, get_transfer_with_payload_from_message_account, hash_vaa,
        instructions::fee_tracker::FeeTracker, state::SwimPayloadMessage, validate_marginal_prices_pool_accounts,
        Address, ChainID, ClaimData, MessageData, PayloadTransferWithPayload, PostVAAData, PostedMessageData,
        PostedVAAData, Propeller, RawSwimPayload, TokenBridge, Wormhole, COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION,
        TOKEN_COUNT,
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
    two_pool::{state::TwoPool, BorshDecimal},
};

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct CompleteNativeWithPayload<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref() ],
    bump = propeller.bump,
    has_one = swim_usd_mint @ PropellerError::InvalidSwimUsdMint,
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
    #[account(
    mut,
    owner = propeller.wormhole()?,
    )]
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
    token::mint = swim_usd_mint.key(),
    token::authority = redeemer,
    )]
    pub to: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [ b"redeemer".as_ref()],
    bump = propeller.redeemer_bump
    )]
    /// CHECK: this used to be "to_owner".\
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

    // TODO: rename to `fee_vault` and add has_one in propeller constraints?
    #[account(
        mut,
        token::mint = propeller.swim_usd_mint,
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
    pub custody: UncheckedAccount<'info>,
    // #[account(address = propeller.token_bridge_mint)]
    pub swim_usd_mint: Box<Account<'info, Mint>>,
    /// CHECK: custody_signer_account: seeds = [b"custody_signer"], seeds::program = token_bridge
    pub custody_signer: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,

    pub wormhole: Program<'info, Wormhole>,
    pub token_program: Program<'info, Token>,
    pub token_bridge: Program<'info, TokenBridge>,

    #[account(
    init,
    payer = payer,
    seeds = [
    b"propeller".as_ref(),
    b"swim_payload".as_ref(),
    claim.key().as_ref(),
    ],
    bump,
    space = 8 + SwimPayloadMessage::LEN,
    )]
    pub swim_payload_message: Account<'info, SwimPayloadMessage>,
}

impl<'info> CompleteNativeWithPayload<'info> {
    pub fn accounts(ctx: &Context<CompleteNativeWithPayload>) -> Result<()> {
        require!(Self::redeemer_check(ctx), PropellerError::UserRedeemerSignatureNotDetected);

        Ok(())
    }

    //TODO: allow for "user" to call CompleteNativeWithPayload through this program?
    // dependent on if `vaa.to` is this programId for user initiated transfers
    fn redeemer_check(ctx: &Context<CompleteNativeWithPayload>) -> bool {
        // if ctx.accounts.redeemer.address == ctx.accounts.message.payload.to_address() {
        // 	return ctx.accounts.redeemer.to_account_info().is_signer;
        // }
        true
    }

    pub fn invoke_complete_native_with_payload(&self) -> Result<()> {
        let wh_complete_native_with_payload_acct_infos = vec![
            self.payer.to_account_info().clone(),
            self.token_bridge_config.to_account_info().clone(),
            self.message.to_account_info().clone(),
            self.claim.to_account_info().clone(),
            self.endpoint.to_account_info().clone(),
            self.to.to_account_info().clone(),
            self.redeemer.to_account_info().clone(),
            self.fee_recipient.to_account_info().clone(),
            self.custody.to_account_info().clone(),
            self.swim_usd_mint.to_account_info().clone(),
            self.custody_signer.to_account_info().clone(),
            self.rent.to_account_info().clone(),
            self.system_program.to_account_info().clone(),
            self.wormhole.to_account_info().clone(),
            self.token_program.to_account_info().clone(),
        ];
        let complete_transfer_with_payload_ix = Instruction {
            program_id: self.token_bridge.key(),
            // accounts: ctx.accounts.to_account_metas(None),
            accounts: vec![
                AccountMeta::new(self.payer.key(), true),
                AccountMeta::new_readonly(self.token_bridge_config.key(), false),
                AccountMeta::new_readonly(self.message.key(), false),
                AccountMeta::new(self.claim.key(), false),
                AccountMeta::new_readonly(self.endpoint.key(), false),
                AccountMeta::new(self.to.key(), false),
                AccountMeta::new_readonly(self.redeemer.key(), true),
                AccountMeta::new(self.fee_recipient.key(), false),
                AccountMeta::new(self.custody.key(), false),
                AccountMeta::new_readonly(self.swim_usd_mint.key(), false),
                AccountMeta::new_readonly(self.custody_signer.key(), false),
                // Dependencies
                AccountMeta::new_readonly(Rent::id(), false),
                AccountMeta::new_readonly(system_program::id(), false),
                // Program
                AccountMeta::new_readonly(self.wormhole.key(), false),
                AccountMeta::new_readonly(spl_token::id(), false),
            ],
            data: (COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION, CompleteNativeWithPayloadData {}).try_to_vec()?,
        };
        invoke_signed(
            &complete_transfer_with_payload_ix,
            &wh_complete_native_with_payload_acct_infos,
            // &self.to_account_infos(),
            &[&[&b"redeemer".as_ref(), &[self.propeller.redeemer_bump]]],
        )?;
        msg!("successfully invoked self.complete_native_with_payload()");
        Ok(())
    }

    pub fn get_message(&self) -> Result<MessageData> {
        let message_account_info = &self.message.to_account_info();
        let message_data = get_message_data(message_account_info)?;
        msg!("message_data: {:?}", message_data);
        get_message_data(message_account_info)
    }

    pub fn get_transfer_with_payload(&self, message_data: &MessageData) -> Result<PayloadTransferWithPayload> {
        // let message_account_info = &self.message.to_account_info();
        // let message_data = get_message_data(message_account_info)?;
        // msg!("message_data: {:?}", message_data);
        let transfer_with_payload = deserialize_message_payload(&mut message_data.payload.as_slice())?;
        msg!("transfer_with_payload: {:?}", transfer_with_payload);
        Ok(transfer_with_payload)
    }

    fn write_swim_payload_message(
        &mut self,
        bump: u8,
        message_data: &MessageData,
        transfer_amount: u64,
        swim_payload: &RawSwimPayload,
    ) -> Result<()> {
        let swim_payload_message = &mut self.swim_payload_message;
        swim_payload_message.bump = bump;
        swim_payload_message.claim = self.claim.key();
        // swim_payload_message.claim_bump = *ctx.bumps.get("claim").unwrap();
        swim_payload_message.swim_payload_message_payer = self.payer.key();
        // swim_payload_message.wh_message_bump = *ctx.bumps.get("message").unwrap();
        swim_payload_message.vaa_emitter_address = message_data.emitter_address;
        swim_payload_message.vaa_emitter_chain = message_data.emitter_chain;
        swim_payload_message.vaa_sequence = message_data.sequence;
        swim_payload_message.transfer_amount = transfer_amount;
        swim_payload_message.swim_payload_version = swim_payload.swim_payload_version;
        swim_payload_message.target_token_id = swim_payload.target_token_id;
        swim_payload_message.owner = Pubkey::new_from_array(swim_payload.owner);
        swim_payload_message.memo = swim_payload.memo;
        swim_payload_message.propeller_enabled = swim_payload.propeller_enabled;
        swim_payload_message.gas_kickstart = swim_payload.gas_kickstart;
        Ok(())
    }
}

/// There's nothing stopping a propellerEngine from calling this but
/// there would be no reason to since the propellerEngine would just lose out on fees.
/// A user should be allowed to call this even if swim_payload.propellerEnabled for manual takeover
/// in the event that the propellerEngine was unavailable.
pub fn handle_complete_native_with_payload(ctx: Context<CompleteNativeWithPayload>) -> Result<()> {
    ctx.accounts.invoke_complete_native_with_payload()?;
    let message_data = ctx.accounts.get_message()?;
    let transfer_with_payload = &ctx.accounts.get_transfer_with_payload(&message_data)?;

    //TODO: do we want this check?
    // msg!(
    //     "payload.from_address {:?} propeller.evm_routing_address {:?}",
    //     payload_transfer_with_payload.from_address,
    //     propeller.evm_routing_contract_address
    // );
    // require!(
    //     propeller.evm_routing_contract_address == payload_transfer_with_payload.from_address,
    //     PropellerError::InvalidRoutingContractAddress,
    // );

    let swim_payload = &transfer_with_payload.payload;
    msg!("swim_payload: {:?}", swim_payload);

    // ugly. re-doing the same calculation that WH does in `complete_transfer_payload` but
    // should not be a huge issue.
    let mut transfer_amount = transfer_with_payload.amount.as_u64();
    if ctx.accounts.swim_usd_mint.decimals > 8 {
        transfer_amount *= 10u64.pow(ctx.accounts.swim_usd_mint.decimals as u32);
    }

    let bump = *ctx.bumps.get("swim_payload_message").unwrap();
    ctx.accounts.write_swim_payload_message(bump, &message_data, transfer_amount, swim_payload)?;

    // let memo = swim_payload.memo;
    // // get target_token_id -> (pool, pool_token_index)
    // //    need to know when to do remove_exact_burn & when to do swap_exact_input
    // let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
    // invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;

    Ok(())
}

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct PropellerCompleteNativeWithPayload<'info> {
    pub complete_native_with_payload: CompleteNativeWithPayload<'info>,
    // pub marginal_price_pool: MarginalPricePool<'info>,
    #[account(
    mut,
    seeds = [
    b"propeller".as_ref(),
    b"fee".as_ref(),
    complete_native_with_payload.swim_usd_mint.key().as_ref(),
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
    // pub two_pool_program: Program<'info, two_pool::program::TwoPool>,
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
    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
}

impl<'info> PropellerCompleteNativeWithPayload<'info> {
    pub fn accounts(ctx: &Context<PropellerCompleteNativeWithPayload>) -> Result<()> {
        let propeller = &ctx.accounts.complete_native_with_payload.propeller;
        validate_marginal_prices_pool_accounts(
            &propeller,
            &ctx.accounts.marginal_price_pool.key(),
            &[
                ctx.accounts.marginal_price_pool_token_0_account.mint,
                ctx.accounts.marginal_price_pool_token_1_account.mint,
            ],
        )?;
        require_keys_eq!(ctx.accounts.complete_native_with_payload.fee_recipient.key(), propeller.fee_vault);
        require_keys_eq!(ctx.accounts.complete_native_with_payload.fee_recipient.owner, propeller.key());
        require_keys_eq!(ctx.accounts.aggregator.key(), propeller.aggregator, PropellerError::InvalidAggregator);
        Ok(())
    }

    fn calculate_fees(&self) -> Result<u64> {
        let rent = Rent::get()?;
        let wormhole_message_rent_exempt_fees =
            rent.minimum_balance(self.complete_native_with_payload.message.to_account_info().data_len());
        let claim_rent_exempt_fees =
            rent.minimum_balance(self.complete_native_with_payload.claim.to_account_info().data_len());
        let propeller = &self.complete_native_with_payload.propeller;
        // let complete_with_payload_fee = propeller.complete_with_payload_fee;
        let complete_with_payload_fee = propeller.get_complete_native_with_payload_fee();

        let total_rent_exemption_in_lamports = wormhole_message_rent_exempt_fees
            .checked_add(claim_rent_exempt_fees)
            .ok_or(PropellerError::IntegerOverflow)?;
        msg!(
            "
    {}(wormhole_message_rent_exempt_fees) +
    {}(claim_rent_exempt_fees) +
    = {}(total_rent_exemption_in_lamports)
    ",
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

        let marginal_prices = get_marginal_prices(self.into_marginal_prices())?;

        let intermediate_token_price_decimal: Decimal = get_marginal_price_decimal(
            &self.marginal_price_pool,
            &marginal_prices,
            &propeller,
            // propeller.marginal_price_pool_token_index as usize,
            &self.marginal_price_pool_lp_mint.key(),
            // &token_bridge_mint_key,
        )?;

        msg!("intermediate_token_price_decimal: {:?}", intermediate_token_price_decimal);

        //swimUSD is lp token of marginal price pool
        let mut res = 0u64;

        let fee_in_lamports_decimal = Decimal::from_u64(fee_in_lamports).ok_or(PropellerError::ConversionError)?;
        msg!("fee_in_lamports(u64): {:?} fee_in_lamports_decimal: {:?}", fee_in_lamports, fee_in_lamports_decimal);
        let lamports_intermediate_token_price = get_lamports_intermediate_token_price(&self.aggregator, i64::MAX)?;
        let fee_in_swim_usd_decimal = lamports_intermediate_token_price
            .checked_mul(fee_in_lamports_decimal)
            .and_then(|x| x.checked_div(intermediate_token_price_decimal))
            .ok_or(PropellerError::IntegerOverflow)?;

        let swim_usd_mint_key = self.complete_native_with_payload.propeller.swim_usd_mint;

        let swim_usd_mint_decimals = get_swim_usd_mint_decimals(
            &swim_usd_mint_key,
            &self.marginal_price_pool,
            &self.marginal_price_pool_lp_mint,
        )?;
        //TODO: good lord forgive me for this terrible naming. i will fix later.
        let ten_pow_decimals =
            Decimal::from_u64(10u64.pow(swim_usd_mint_decimals as u32)).ok_or(PropellerError::IntegerOverflow)?;
        let fee_in_swim_usd_atomic = fee_in_swim_usd_decimal
            .checked_mul(ten_pow_decimals)
            .and_then(|v| v.to_u64())
            .ok_or(PropellerError::ConversionError)?;
        msg!(
            "fee_in_swim_usd_decimal: {:?} fee_in_swim_usd_atomic: {:?}",
            fee_in_swim_usd_decimal,
            fee_in_swim_usd_atomic
        );
        res = fee_in_swim_usd_atomic;
        Ok(res)
    }

    fn handle_fees(&mut self, fees_in_token_bridge_mint: u64) -> Result<()> {
        let fee_tracker = &mut self.fee_tracker;
        let updated_fees_owed =
            fee_tracker.fees_owed.checked_add(fees_in_token_bridge_mint).ok_or(PropellerError::IntegerOverflow)?;
        fee_tracker.fees_owed = updated_fees_owed;

        let cpi_accounts = Transfer {
            from: self.complete_native_with_payload.to.to_account_info(),
            to: self.complete_native_with_payload.fee_recipient.to_account_info(),
            authority: self.complete_native_with_payload.redeemer.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                self.complete_native_with_payload.token_program.to_account_info(),
                cpi_accounts,
                &[&[&b"redeemer".as_ref(), &[self.complete_native_with_payload.propeller.redeemer_bump]]],
            ),
            fees_in_token_bridge_mint,
        )
    }

    fn into_marginal_prices(&self) -> CpiContext<'_, '_, '_, 'info, two_pool::cpi::accounts::MarginalPrices<'info>> {
        let program = self.two_pool_program.to_account_info();
        let accounts = two_pool::cpi::accounts::MarginalPrices {
            pool: self.marginal_price_pool.to_account_info(),
            pool_token_account_0: self.marginal_price_pool_token_0_account.to_account_info(),
            pool_token_account_1: self.marginal_price_pool_token_1_account.to_account_info(),
            lp_mint: self.marginal_price_pool_lp_mint.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }
}

pub fn handle_propeller_complete_native_with_payload(ctx: Context<PropellerCompleteNativeWithPayload>) -> Result<()> {
    ctx.accounts.complete_native_with_payload.invoke_complete_native_with_payload()?;
    let message_data = ctx.accounts.complete_native_with_payload.get_message()?;
    let transfer_with_payload = &ctx.accounts.complete_native_with_payload.get_transfer_with_payload(&message_data)?;
    let propeller = &ctx.accounts.complete_native_with_payload.propeller;

    msg!("transfer_with_payload: {:?}", transfer_with_payload);
    let swim_payload = &transfer_with_payload.payload;
    msg!("swim_payload: {:?}", swim_payload);
    require!(swim_payload.propeller_enabled, PropellerError::NotPropellerEnabled);
    let claim_data = ClaimData::try_from_slice(&mut ctx.accounts.complete_native_with_payload.claim.data.borrow())
        .map_err(|_| error!(PropellerError::InvalidClaimData))?;
    msg!("claim_data: {:?}", claim_data);

    // ugly. re-doing the same calculation that WH does in `complete_transfer_payload` but
    // should not be a huge issue.
    let mut transfer_amount = transfer_with_payload.amount.as_u64();
    if ctx.accounts.complete_native_with_payload.swim_usd_mint.decimals > 8 {
        transfer_amount *= 10u64.pow(ctx.accounts.complete_native_with_payload.swim_usd_mint.decimals as u32);
    }
    msg!("transfer_amount(swimUSD atomic): {:?}", transfer_amount);
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
        let fees_in_token_bridge_mint = ctx.accounts.calculate_fees()?;
        ctx.accounts.handle_fees(fees_in_token_bridge_mint)?;

        msg!("propeller_complete_native_with_payload fees(swimUSD): {:?}", fees_in_token_bridge_mint);
        transfer_amount =
            transfer_amount.checked_sub(fees_in_token_bridge_mint).ok_or(PropellerError::IntegerOverflow)?;
    }
    msg!("transfer_amount(swimUSD) after fees: {:?}", transfer_amount);

    let bump = *ctx.bumps.get("swim_payload_message").unwrap();
    ctx.accounts.complete_native_with_payload.write_swim_payload_message(
        bump,
        &message_data,
        transfer_amount,
        &swim_payload,
    )?;
    let memo = swim_payload.memo;
    if memo != [0u8; 16] {
        let memo_ix = spl_memo::build_memo(memo.as_slice(), &[]);
        invoke(&memo_ix, &[ctx.accounts.memo.to_account_info()])?;
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Default)]
pub struct CompleteNativeWithPayloadData {}
