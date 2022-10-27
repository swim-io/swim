use {
    crate::{
        error::*, fees::*, get_memo_as_utf8, get_message_data, state::SwimPayloadMessage, wormhole::SwimPayload,
        ClaimData, Fees, MessageData, PayloadTransferWithPayload, Propeller, TokenBridge, Wormhole,
        COMPLETE_NATIVE_WITH_PAYLOAD_INSTRUCTION,
    },
    anchor_lang::{
        prelude::*,
        solana_program::{instruction::Instruction, program::invoke_signed, system_program, sysvar::SysvarId},
    },
    anchor_spl::{
        associated_token::get_associated_token_address,
        token::{self, Mint, Token, TokenAccount, Transfer},
    },
    solana_program::program::invoke,
};

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct CompleteNativeWithPayload<'info> {
    #[account(
    seeds = [ b"propeller".as_ref(), propeller.swim_usd_mint.as_ref() ],
    bump = propeller.bump,
    has_one = swim_usd_mint @ PropellerError::InvalidSwimUsdMint,
    has_one = fee_vault @ PropellerError::InvalidFeeVault,
    constraint = !propeller.is_paused @ PropellerError::IsPaused,
    )]
    pub propeller: Box<Account<'info, Propeller>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    mut,
    seeds = [ b"config".as_ref() ],
    bump,
    seeds::program = token_bridge.key(),
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
    //   seeds::program = propeller.wormhole()
    // )]
    // pub message: Box<Account<'info, PostedMessageData>>,
    #[account(
    mut,
    owner = wormhole.key(),
    )]
    /// CHECK: wormhole message account. seeds = [ "PostedVAA", hash(vaa) ], seeds::program = token_bridge
    pub message: UncheckedAccount<'info>,
    // Note: this works only without the Box wrapper
    // error[E0277]: the trait bound `Box<anchor_lang::prelude::Account<'_, wormhole::PostedVAAData>>: AsRef<anchor_lang::prelude::AccountInfo<'_>>` is not satisfied
    //
    // #[derive(Accounts)]
    //          ^^^^^^^^ the trait `AsRef<anchor_lang::prelude::AccountInfo<'_>>` is not implemented for `Box<anchor_lang::prelude::Account<'_, wormhole::PostedVAAData>>`

    // pub message: Box<Account<'info, PostedVAAData>>,
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
    //   seeds::program = propeller.wormhole()
    // )]
    #[account(mut)]
    /// CHECK: wormhole claim account to prevent double spending
    /// checked in CPI
    pub claim: UncheckedAccount<'info>,

    /// CHECK: wormhole endpoint account. seeds = [ vaa.emitter_chain, vaa.emitter_address ]
    /// checked in CPI
    pub endpoint: UncheckedAccount<'info>,
    /// `to` account in `CompleteNativeWithPayload`
    #[account(
    mut,
    address = get_associated_token_address(&redeemer.key(), &swim_usd_mint.key())
    )]
    pub redeemer_escrow: Box<Account<'info, TokenAccount>>,

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

    #[account(mut)]
    /// this is "to_fees"
    /// recipient of fees for executing complete transfer (e.g. relayer)
    /// this is only used in `propellerCompleteNativeWithPayload`.
    pub fee_vault: Box<Account<'info, TokenAccount>>,

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
    pub swim_payload_message: Box<Account<'info, SwimPayloadMessage>>,
    // #[account(mut)]
    // /// this is "to_fees"
    // /// TODO: type as TokenAccount?
    // /// CHECK: recipient of fees for executing complete transfer (e.g. relayer)
    // pub fee_recipient: AccountInfo<'info>,
    #[account(
    mut,
    seeds = [swim_usd_mint.key().as_ref()],
    seeds::program = token_bridge.key(),
    bump,
    )]
    /// CHECK: wormhole_custody_account: seeds = [mint], seeds::program = token_bridge
    pub custody: UncheckedAccount<'info>,
    // #[account(address = propeller.token_bridge_mint)]
    pub swim_usd_mint: Box<Account<'info, Mint>>,
    #[account(
        seeds = [b"custody_signer".as_ref()],
        seeds::program = token_bridge.key(),
        bump,
    )]
    /// CHECK: custody_signer_account: seeds = [b"custody_signer"], seeds::program = token_bridge
    pub custody_signer: UncheckedAccount<'info>,

    pub wormhole: Program<'info, Wormhole>,
    pub token_program: Program<'info, Token>,
    pub token_bridge: Program<'info, TokenBridge>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CompleteNativeWithPayload<'info> {
    pub fn accounts(ctx: &Context<CompleteNativeWithPayload>) -> Result<()> {
        require!(Self::redeemer_check(ctx), PropellerError::UserRedeemerSignatureNotDetected);

        Ok(())
    }

    //TODO: allow for "user" to call CompleteNativeWithPayload through this program?
    // dependent on if `vaa.to` is this programId for user initiated transfers
    fn redeemer_check(_ctx: &Context<CompleteNativeWithPayload>) -> bool {
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
            self.redeemer_escrow.to_account_info().clone(),
            self.redeemer.to_account_info().clone(),
            self.fee_vault.to_account_info().clone(),
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
                AccountMeta::new(self.redeemer_escrow.key(), false),
                AccountMeta::new_readonly(self.redeemer.key(), true),
                AccountMeta::new(self.fee_vault.key(), false),
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
            &[&[(b"redeemer".as_ref()), &[self.propeller.redeemer_bump]]],
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
        // let transfer_with_payload = deserialize_message_payload(&mut message_data.payload.as_slice())?;
        let transfer_with_payload = PayloadTransferWithPayload::deserialize(&mut message_data.payload.as_slice())?;
        msg!("transfer_with_payload: {:?}", transfer_with_payload);
        Ok(transfer_with_payload)
    }

    fn write_swim_payload_message(
        &mut self,
        bump: u8,
        message_data: &MessageData,
        transfer_amount: u64,
        swim_payload: &SwimPayload,
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
        swim_payload_message.owner = Pubkey::new_from_array(swim_payload.owner);
        swim_payload_message.propeller_enabled = swim_payload.propeller_enabled.unwrap_or_default();
        swim_payload_message.gas_kickstart = swim_payload.gas_kickstart.unwrap_or_default();
        swim_payload_message.max_fee = swim_payload.max_fee.unwrap_or_default();
        swim_payload_message.target_token_id = swim_payload.target_token_id.unwrap_or_default();
        swim_payload_message.memo = swim_payload.memo.unwrap_or_default();
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

    let mut transfer_amount = transfer_with_payload.amount.as_u64();
    if ctx.accounts.swim_usd_mint.decimals > 8 {
        transfer_amount *= 10u64.pow(ctx.accounts.swim_usd_mint.decimals as u32);
    }

    let bump = *ctx.bumps.get("swim_payload_message").unwrap();
    ctx.accounts.write_swim_payload_message(bump, &message_data, transfer_amount, swim_payload)?;

    Ok(())
}

#[derive(Accounts)]
// #[instruction(vaa: PostVAAData)]
pub struct PropellerCompleteNativeWithPayload<'info> {
    pub complete_native_with_payload: CompleteNativeWithPayload<'info>,
    // note - fee_vault is repeated in here but txn size-wise it should only take an additional byte not 32.
    pub fee_tracking: FeeTracking<'info>,

    #[account(executable, address = spl_memo::id())]
    ///CHECK: memo program
    pub memo: UncheckedAccount<'info>,
}

impl<'info> PropellerCompleteNativeWithPayload<'info> {
    pub fn accounts(ctx: &Context<PropellerCompleteNativeWithPayload>) -> Result<()> {
        let propeller = &ctx.accounts.complete_native_with_payload.propeller;
        ctx.accounts.fee_tracking.marginal_price_pool.validate(propeller)?;
        Ok(())
    }

    fn log_memo(&self, memo: [u8; 16]) -> Result<()> {
        if memo != [0u8; 16] {
            let memo_ix = spl_memo::build_memo(get_memo_as_utf8(memo)?.as_ref(), &[]);
            invoke(&memo_ix, &[self.memo.to_account_info()])?;
        }
        Ok(())
    }
}

impl<'info> Fees<'info> for PropellerCompleteNativeWithPayload<'info> {
    fn calculate_fees_in_lamports(&self) -> Result<u64> {
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
        Ok(fee_in_lamports)
    }

    fn transfer_fees_to_vault(&mut self, fees_in_swim_usd: u64) -> Result<()> {
        token::transfer(
            CpiContext::new_with_signer(
                self.complete_native_with_payload.token_program.to_account_info(),
                Transfer {
                    from: self.complete_native_with_payload.redeemer_escrow.to_account_info(),
                    to: self.complete_native_with_payload.fee_vault.to_account_info(),
                    authority: self.complete_native_with_payload.redeemer.to_account_info(),
                },
                &[&[(b"redeemer".as_ref()), &[self.complete_native_with_payload.propeller.redeemer_bump]]],
            ),
            fees_in_swim_usd,
        )
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
    require!(swim_payload.propeller_enabled.unwrap_or_default(), PropellerError::NotPropellerEnabled);
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
    // Only tracking & converting fee from SOL -> swimUSD if the payer isn't the actual logical owner.
    // This is for if the propeller engine is unavailable and the user is manually calling
    // this ix. They should use the `CompleteNativeWithPayload` ix instead but adding this just in case.\
    // if swim payload owner calling though they will need a fee tracker account already.
    let swim_payload_owner = Pubkey::new_from_array(swim_payload.owner);
    if swim_payload_owner != ctx.accounts.complete_native_with_payload.payer.key() {
        let fees_in_lamports = ctx.accounts.calculate_fees_in_lamports()?;
        // let fees_in_swim_usd_atomic = ctx.accounts.convert_fees_to_swim_usd_atomic(fees_in_lamports)?;
        let fees_in_swim_usd_atomic = ctx.accounts.fee_tracking.track_fees(fees_in_lamports, propeller)?;
        ctx.accounts.transfer_fees_to_vault(fees_in_swim_usd_atomic)?;
        msg!("fees_in_swim_usd_atomic: {:?}", fees_in_swim_usd_atomic);
        transfer_amount =
            transfer_amount.checked_sub(fees_in_swim_usd_atomic).ok_or(error!(PropellerError::InsufficientFunds))?;
    }
    msg!("transfer_amount(swimUSD) after fees: {:?}", transfer_amount);

    let bump = *ctx.bumps.get("swim_payload_message").unwrap();
    ctx.accounts.complete_native_with_payload.write_swim_payload_message(
        bump,
        &message_data,
        transfer_amount,
        swim_payload,
    )?;
    let memo = swim_payload.memo.unwrap_or_default();

    ctx.accounts.log_memo(memo)?;
    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Default)]
pub struct CompleteNativeWithPayloadData {}
